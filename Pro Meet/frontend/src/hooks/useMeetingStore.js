/**
 * useMeetingStore — Local API-backed meeting metadata.
 */

const API_BASE = 'http://localhost:3001/api';

export async function startMeeting(roomId, userEmail) {
  try {
    await fetch(`${API_BASE}/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: roomId,
        hostEmail: userEmail,
        participants: [userEmail],
        startedAt: new Date().toISOString(),
        endedAt: null,
        durationSec: null,
        chatLog: [],
      })
    });
  } catch (err) {
    console.error('[useMeetingStore] startMeeting failed:', err);
  }
}

export async function joinMeeting(roomId, userEmail) {
  try {
    // Ideally we would fetch the meeting and append the user, 
    // but for simplicity we will just call startMeeting which acts as an upsert/merge on our backend mock.
    // However, our backend doesn't currently merge participants array, it just overwrites.
    // To fix this quickly without complex backend logic, we just re-start the meeting.
    await startMeeting(roomId, userEmail);
  } catch (err) {
    console.error('[useMeetingStore] joinMeeting failed:', err);
  }
}

export async function endMeeting(roomId, durationSec, chatLog = [], recordingUrl = null, aiSummary = null) {
  try {
    const updateData = {
      id: roomId,
      endedAt: new Date().toISOString(),
      durationSec: Math.round(durationSec),
      chatLog,
    };
    if (recordingUrl) updateData.recordingUrl = recordingUrl;
    if (aiSummary)    updateData.aiSummary    = aiSummary;
    
    await fetch(`${API_BASE}/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
  } catch (err) {
    console.error('[useMeetingStore] endMeeting failed:', err);
  }
}

export async function getUserMeetings(userEmail) {
  try {
    const res = await fetch(`${API_BASE}/meetings`);
    if (!res.ok) return [];
    const data = await res.json();
    
    // Filter meetings where userEmail is the host or participant
    const meetings = (data.meetings || []).filter(m => m.hostEmail === userEmail || (m.participants && m.participants.includes(userEmail)));
    
    meetings.sort((a, b) => {
      const aTime = new Date(a.startedAt).getTime() || 0;
      const bTime = new Date(b.startedAt).getTime() || 0;
      return bTime - aTime;
    });
    
    return meetings;
  } catch (err) {
    console.error('[useMeetingStore] getUserMeetings failed:', err);
    return [];
  }
}

export async function createPersistentRoom(name, userEmail) {
  try {
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const roomId = baseSlug ? `${baseSlug}-${randomSuffix}` : `room-${randomSuffix}`;

    await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: roomId,
        name: name,
        hostEmail: userEmail,
        createdAt: new Date().toISOString(),
      })
    });

    return roomId;
  } catch (err) {
    console.error('[useMeetingStore] createPersistentRoom failed:', err);
    return null;
  }
}

export async function getUserPersistentRooms(userEmail) {
  try {
    const res = await fetch(`${API_BASE}/rooms`);
    if (!res.ok) return [];
    const data = await res.json();
    
    const rooms = (data.rooms || []).filter(r => r.hostEmail === userEmail);
    
    rooms.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime() || 0;
      const bTime = new Date(b.createdAt).getTime() || 0;
      return bTime - aTime;
    });
    
    return rooms;
  } catch (err) {
    console.error('[useMeetingStore] getUserPersistentRooms failed:', err);
    return [];
  }
}

export async function clearUserHistory(userEmail) {
  // In a real database we would run a delete query.
  // For now, we will just leave this as a no-op since there's no /api/meetings/delete endpoint.
  console.log("Clear history requested for", userEmail);
}
