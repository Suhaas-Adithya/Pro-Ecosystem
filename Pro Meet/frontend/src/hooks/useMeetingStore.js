/**
 * useMeetingStore — Firestore-backed meeting metadata.
 *
 * Collection layout:
 *   meetings/{roomId}
 *     hostEmail:    string
 *     participants: string[]   (emails, via arrayUnion)
 *     startedAt:   Timestamp
 *     endedAt:     Timestamp | null
 *     durationSec: number | null
 *     chatLog:     { sender, text, ts }[]
 */

import { isMocked, db, doc, setDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, orderBy, getDocs, serverTimestamp } from '../firebase';

// No-op stubs used when Firebase is mocked / Firestore not initialised
const noop = async () => {};

function guard() {
  if (isMocked || !db) {
    console.warn('[useMeetingStore] Firestore not available (mock mode or not initialised).');
    return true;
  }
  return false;
}

/**
 * Called by the room host as soon as they enter the room.
 */
export async function startMeeting(roomId, userEmail) {
  if (guard()) return;
  try {
    await setDoc(doc(db, 'meetings', roomId), {
      hostEmail:    userEmail,
      participants: [userEmail],
      startedAt:    serverTimestamp(),
      endedAt:      null,
      durationSec:  null,
      chatLog:      [],
    }, { merge: true }); // merge so a re-join doesn't overwrite an existing session
  } catch (err) {
    console.error('[useMeetingStore] startMeeting failed:', err);
  }
}

/**
 * Called by every non-host participant when they join.
 */
export async function joinMeeting(roomId, userEmail) {
  if (guard()) return;
  try {
    await updateDoc(doc(db, 'meetings', roomId), {
      participants: arrayUnion(userEmail),
    });
  } catch (err) {
    // The document may not exist yet if the host hasn't called startMeeting — create it.
    await startMeeting(roomId, userEmail);
  }
}

/**
 * Called when a user leaves / hangs up.
 * Only the host writes the final summary; participants just quietly exit.
 */
export async function endMeeting(roomId, durationSec, chatLog = [], recordingUrl = null, aiSummary = null) {
  if (guard()) return;
  try {
    const updateData = {
      endedAt:     serverTimestamp(),
      durationSec: Math.round(durationSec),
      chatLog,
    };
    if (recordingUrl) updateData.recordingUrl = recordingUrl;
    if (aiSummary)    updateData.aiSummary    = aiSummary;
    await updateDoc(doc(db, 'meetings', roomId), updateData);
  } catch (err) {
    console.error('[useMeetingStore] endMeeting failed:', err);
  }
}

/**
 * Returns all meetings where the given email appears in participants[],
 * sorted newest-first.
 * Returns [] on error or mock mode.
 */
export async function getUserMeetings(userEmail) {
  if (guard()) return [];
  try {
    const q = query(
      collection(db, 'meetings'),
      where('participants', 'array-contains', userEmail)
    );
    const snap = await getDocs(q);
    const meetings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Sort in memory to avoid needing a Firestore composite index (which causes quiet failures)
    meetings.sort((a, b) => {
      const aTime = a.startedAt?.toDate().getTime() || 0;
      const bTime = b.startedAt?.toDate().getTime() || 0;
      return bTime - aTime; // descending
    });
    
    return meetings;
  } catch (err) {
    console.error('[useMeetingStore] getUserMeetings failed:', err);
    return [];
  }
}

/**
 * Persistent Rooms Methods
 * Rooms are permanent spaces that never die, unlike ad-hoc "meetings".
 */
export async function createPersistentRoom(name, userEmail) {
  if (guard()) return null;
  try {
    // Generate a beautiful, text-based hyphenated ID (e.g. "engineering-sync-xyz123")
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const roomId = baseSlug ? `${baseSlug}-${randomSuffix}` : `room-${randomSuffix}`;

    await setDoc(doc(db, 'rooms', roomId), {
      id: roomId,
      name: name,
      hostEmail: userEmail,
      createdAt: serverTimestamp(),
    });

    return roomId;
  } catch (err) {
    console.error('[useMeetingStore] createPersistentRoom failed:', err);
    return null;
  }
}

export async function getUserPersistentRooms(userEmail) {
  if (guard()) return [];
  try {
    const q = query(
      collection(db, 'rooms'),
      where('hostEmail', '==', userEmail)
    );
    const snap = await getDocs(q);
    const rooms = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Sort in memory by createdAt descending
    rooms.sort((a, b) => {
      const aTime = a.createdAt?.toDate().getTime() || 0;
      const bTime = b.createdAt?.toDate().getTime() || 0;
      return bTime - aTime;
    });
    
    return rooms;
  } catch (err) {
    console.error('[useMeetingStore] getUserPersistentRooms failed:', err);
    return [];
  }
}

/**
 * Removes the user's email from the participants array of all their recorded meetings.
 * This effectively "clears" their history without affecting other meeting participants.
 */
export async function clearUserHistory(userEmail) {
  if (guard()) return;
  try {
    const q = query(collection(db, 'meetings'), where('participants', 'array-contains', userEmail));
    const snap = await getDocs(q);
    
    // Process removals in parallel to avoid batch size limits
    const promises = snap.docs.map(d => 
      updateDoc(doc(db, 'meetings', d.id), {
        participants: arrayRemove(userEmail)
      })
    );
    await Promise.all(promises);
  } catch (err) {
    console.error('[useMeetingStore] clearUserHistory failed:', err);
  }
}
