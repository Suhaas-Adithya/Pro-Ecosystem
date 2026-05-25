import { Star, Clock, MoreVertical, Archive, Trash2, Send, File, AlertCircle, Inbox, Lock, Loader2, Newspaper, ShieldAlert, BellOff, Filter, ArrowUpDown, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { db, collection, query, where, onSnapshot, doc, getDoc, updateDoc } from "../firebase";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { analyzeEmail } from "../lib/SecurityEngine";

export default function EmailList({ folder = "inbox", category = "primary" }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { searchTerm } = useApp();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, attachments, encrypted
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, subject, sender
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const emailRowRefs = useRef([]);

  // Auto-scroll selected row into view
  useEffect(() => {
    if (selectedIndex >= 0 && emailRowRefs.current[selectedIndex]) {
      emailRowRefs.current[selectedIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  const archiveEmail = useCallback(async (emailId) => {
    try {
      await updateDoc(doc(db, 'emails', emailId), { folder: 'archive' });
    } catch (e) { console.error(e); }
  }, []);

  const trashEmail = useCallback(async (emailId) => {
    try {
      await updateDoc(doc(db, 'emails', emailId), { folder: 'trash' });
    } catch (e) { console.error(e); }
  }, []);

  // ── filteredEmails must be declared BEFORE the keyboard effect that references it ──
  const filteredEmails = useMemo(() => {
    let result = emails;
    
    // 1. Search Filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(email => 
        email.subject?.toLowerCase().includes(lower) || 
        email.body?.toLowerCase().includes(lower) || 
        email.senderName?.toLowerCase().includes(lower) || 
        email.senderEmail?.toLowerCase().includes(lower) || 
        email.recipientEmail?.toLowerCase().includes(lower)
      );
    }

    // 2. Functional Filter
    if (filter === 'unread') result = result.filter(e => e.unread);
    if (filter === 'attachments') result = result.filter(e => e.attachments?.length > 0);
    if (filter === 'encrypted') result = result.filter(e => e.isEncrypted);

    // 3. Filter by expiration
    const now = Date.now();
    result = result.filter(email => {
      if (!email.expiresAt) return true;
      const expiry = email.expiresAt.toMillis ? email.expiresAt.toMillis() : new Date(email.expiresAt).getTime();
      return expiry > now;
    });

    // 4. Grouping by Thread
    const threadMap = new Map();
    result.forEach(email => {
      const threadId = email.threadId || email.id;
      if (!threadMap.has(threadId)) {
        threadMap.set(threadId, { ...email, threadCount: 1 });
      } else {
        const existing = threadMap.get(threadId);
        existing.threadCount += 1;
        if (email.timestamp?.toMillis() > existing.timestamp?.toMillis()) {
          const count = existing.threadCount;
          Object.assign(existing, email);
          existing.threadCount = count;
        }
      }
    });

    // 5. Sorting
    return Array.from(threadMap.values()).sort((a, b) => {
      if (sortBy === 'newest') return (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0);
      if (sortBy === 'oldest') return (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0);
      if (sortBy === 'subject') return (a.subject || '').localeCompare(b.subject || '');
      if (sortBy === 'sender') return (a.senderName || a.senderEmail || '').localeCompare(b.senderName || b.senderEmail || '');
      return 0;
    });
  }, [emails, searchTerm, filter, sortBy]);

  useEffect(() => {

    const handleKeyDown = (e) => {
      // Don't trigger if user is typing
      if (['input', 'textarea', 'select'].includes(document.activeElement.tagName.toLowerCase())) return;
      if (document.activeElement.isContentEditable) return;

      switch (e.key) {
        case 'j':
        case 'J':
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredEmails.length - 1));
          break;
        case 'k':
        case 'K':
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'o':
        case 'O':
        case 'Enter':
          if (selectedIndex >= 0 && filteredEmails[selectedIndex]) {
            navigate(`/email/${filteredEmails[selectedIndex].id}`);
          }
          break;
        default:
          break;
      }
    };

    // Also listen to custom shortcut events from useKeyboardShortcuts
    const onNext = () => setSelectedIndex(prev => Math.min(prev + 1, filteredEmails.length - 1));
    const onPrev = () => setSelectedIndex(prev => Math.max(prev - 1, 0));
    const onOpen = () => {
      if (selectedIndex >= 0 && filteredEmails[selectedIndex]) {
        navigate(`/email/${filteredEmails[selectedIndex].id}`);
      }
    };
    const onArchive = () => {
      if (selectedIndex >= 0 && filteredEmails[selectedIndex]) {
        archiveEmail(filteredEmails[selectedIndex].id);
        setSelectedIndex(prev => Math.min(prev, filteredEmails.length - 2));
      }
    };
    const onTrash = () => {
      if (selectedIndex >= 0 && filteredEmails[selectedIndex]) {
        trashEmail(filteredEmails[selectedIndex].id);
        setSelectedIndex(prev => Math.min(prev, filteredEmails.length - 2));
      }
    };
    const onStar = () => {
      if (selectedIndex >= 0 && filteredEmails[selectedIndex]) {
        const em = filteredEmails[selectedIndex];
        toggleStar({ stopPropagation: () => {} }, em.id, em.starred);
      }
    };

    const onSelect = () => {
      if (selectedIndex >= 0 && filteredEmails[selectedIndex]) {
        const id = filteredEmails[selectedIndex].id;
        setSelectedIds(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
      }
    };
    const onSelectAll = () => {
      setSelectedIds(new Set(filteredEmails.map(e => e.id)));
    };
    const onDeselectAll = () => {
      setSelectedIds(new Set());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('shortcut:list:next', onNext);
    window.addEventListener('shortcut:list:prev', onPrev);
    window.addEventListener('shortcut:list:open', onOpen);
    window.addEventListener('shortcut:list:select', onSelect);
    window.addEventListener('shortcut:list:selectAll', onSelectAll);
    window.addEventListener('shortcut:list:deselectAll', onDeselectAll);
    window.addEventListener('shortcut:email:archive', onArchive);
    window.addEventListener('shortcut:email:trash', onTrash);
    window.addEventListener('shortcut:email:toggleStar', onStar);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('shortcut:list:next', onNext);
      window.removeEventListener('shortcut:list:prev', onPrev);
      window.removeEventListener('shortcut:list:open', onOpen);
      window.removeEventListener('shortcut:list:select', onSelect);
      window.removeEventListener('shortcut:list:selectAll', onSelectAll);
      window.removeEventListener('shortcut:list:deselectAll', onDeselectAll);
      window.removeEventListener('shortcut:email:archive', onArchive);
      window.removeEventListener('shortcut:email:trash', onTrash);
      window.removeEventListener('shortcut:email:toggleStar', onStar);
    };
  }, [filteredEmails, selectedIndex, navigate, archiveEmail, trashEmail]);


  useEffect(() => {
    if (!currentUser) return;

    let q;
    const emailsRef = collection(db, 'emails');
    const uid = currentUser.uid;

    if (folder === 'sent') {
      q = query(emailsRef, where('senderUid', '==', uid), where('folder', '!=', 'trash'));
    } else if (folder === 'inbox' || folder === 'newsletters') {
      q = query(emailsRef, where('recipientUid', '==', uid), where('folder', '==', 'inbox'));
    } else if (folder === 'starred') {
      q = query(emailsRef, where('recipientUid', '==', uid), where('starred', '==', true));
    } else if (folder === 'trash') {
      q = query(emailsRef, where('recipientUid', '==', uid), where('folder', '==', 'trash'));
    } else if (folder === 'spam') {
      q = query(emailsRef, where('recipientUid', '==', uid), where('folder', '==', 'spam'));
    } else if (folder === 'drafts') {
      q = query(emailsRef, where('senderUid', '==', uid), where('folder', '==', 'drafts'));
    } else if (folder === 'snoozed') {
      q = query(emailsRef, where('recipientUid', '==', uid), where('isSnoozed', '==', true));
    } else {
      setEmails([]);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // Fetch user rules for automation
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      const userRules = userSnap.exists() ? (userSnap.data().rules || []) : [];

      let fetchedEmails = snapshot.docs.map(doc => {
        const data = { id: doc.id, ...doc.data() };
        let processedData = { ...data };

        // Apply Automation Rules
        userRules.forEach(rule => {
          const matchType = rule.type === 'sender' ? data.senderEmail : data.subject;
          if (matchType?.toLowerCase().includes(rule.value?.toLowerCase())) {
            if (['inbox', 'spam', 'trash'].includes(rule.target)) {
               processedData.folder = rule.target;
            } else {
               processedData.label = rule.target;
            }
          }
        });

        const securityReport = analyzeEmail(processedData);
        return { ...processedData, securityReport };
      });
      
      if (folder === 'inbox') {
        fetchedEmails = fetchedEmails.filter(e => e.folder === 'inbox' && e.securityReport.category === category);
      } else if (folder === 'newsletters') {
        fetchedEmails = fetchedEmails.filter(e => e.securityReport.category === 'newsletters');
      } else if (folder === 'spam') {
        fetchedEmails = fetchedEmails.filter(e => e.folder === 'spam' || e.isSpam || e.isPhishing);
      }
      
      // Client-side sort
      fetchedEmails.sort((a, b) => {
        const timeA = a.timestamp?.toMillis() || 0;
        const timeB = b.timestamp?.toMillis() || 0;
        return timeB - timeA;
      });
      
      setEmails(fetchedEmails);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching emails: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, folder, category]);

  const toggleStar = async (e, emailId, currentStatus) => {
    e.stopPropagation();
    try {
      const emailRef = doc(db, 'emails', emailId);
      await updateDoc(emailRef, { starred: !currentStatus });
    } catch (error) {
      console.error("Error toggling star: ", error);
    }
  };

  const emptyStateMessages = {
    starred: { icon: Star, title: "No starred messages", desc: "Stars let you give messages a special status to make them easier to find." },
    snoozed: { icon: Clock, title: "No snoozed messages", desc: "Snoozed messages will appear here when it's time." },
    sent: { icon: Send, title: "No sent messages", desc: "Messages you send will appear here." },
    drafts: { icon: File, title: "No drafts", desc: "You don't have any saved drafts." },
    spam: { icon: AlertCircle, title: "Hooray, no spam here!", desc: "Spam messages will appear here." },
    trash: { icon: Trash2, title: "Trash is empty", desc: "No deleted messages." },
    inbox: { icon: Inbox, title: "Your inbox is empty", desc: "You're all caught up." },
    newsletters: { icon: Newspaper, title: "No newsletters found", desc: "We'll show your subscriptions here once they arrive." },
  };

  const emptyState = emptyStateMessages[folder] || emptyStateMessages.inbox;
  const EmptyIcon = emptyState.icon;

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    // Return something like "10:30 AM" or "Oct 24"
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#16171d]">
      {/* Toolbar */}
      <div className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 shrink-0 justify-between bg-white/50 dark:bg-[#16171d]/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-violet-600 focus:ring-violet-600 dark:bg-gray-800" />
          
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Archive">
              <Archive size={18} />
            </button>
            <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Delete">
              <Trash2 size={18} />
            </button>
            <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="More">
              <MoreVertical size={18} />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1"></div>

          {/* Filter Controls */}
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100/50 dark:bg-gray-800/50 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700">
              {['all', 'unread', 'attachments', 'encrypted'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                    filter === f 
                      ? "bg-white dark:bg-gray-700 text-violet-600 dark:text-violet-400 shadow-sm" 
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="flex bg-gray-100/50 dark:bg-gray-800/50 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 outline-none px-2 py-1 cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="subject">Subject</option>
                <option value="sender">Sender</option>
              </select>
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {filteredEmails.length > 0 ? `1-${filteredEmails.length} of ${filteredEmails.length}` : '0 of 0'}
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin text-violet-500" size={32} />
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500 dark:text-gray-400">
            <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <EmptyIcon size={32} className="text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">{emptyState.title}</h3>
            <p className="max-w-sm">{emptyState.desc}</p>
          </div>
        ) : (
          filteredEmails.map((email, index) => (
          <div
            key={email.id}
            ref={el => { emailRowRefs.current[index] = el; }}
            onClick={() => navigate(`/email/${email.id}`)}
            className={cn(
              "group flex items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800/50 cursor-pointer transition-colors relative",
              email.unread ? "bg-white dark:bg-[#1f2028]" : "bg-gray-50/50 dark:bg-[#16171d]",
              selectedIds.has(email.id) ? "bg-violet-50/50 dark:bg-violet-500/10" : "",
              index === selectedIndex ? "ring-2 ring-inset ring-violet-500 bg-violet-50/30 dark:bg-violet-500/5" : "hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:shadow-sm"
            )}
          >
            {/* Selection Indicator Bar */}
            {index === selectedIndex && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-600" />
            )}
            {/* Drag Handle & Checkbox Area */}
            <div className="flex items-center gap-3 w-16 shrink-0" onClick={(e) => e.stopPropagation()}>
              <input 
                type="checkbox" 
                checked={selectedIds.has(email.id)}
                onChange={() => {
                  setSelectedIds(prev => {
                    const next = new Set(prev);
                    if (next.has(email.id)) next.delete(email.id);
                    else next.add(email.id);
                    return next;
                  });
                }}
                className={cn(
                  "w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-violet-600 focus:ring-violet-600 dark:bg-gray-800 transition-opacity",
                  selectedIds.has(email.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )} 
              />
              <button 
                onClick={(e) => toggleStar(e, email.id, email.starred)}
                className={cn("transition-colors hover:scale-110 active:scale-95", email.starred ? "text-amber-400" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200")}
              >
                <Star size={18} fill={email.starred ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex items-center gap-4 min-w-0 pr-4">
              <div className={cn("w-48 truncate text-sm", email.unread ? "font-bold text-gray-900 dark:text-gray-100" : "font-medium text-gray-700 dark:text-gray-300")}>
                {folder === 'sent' ? `To: ${email.recipientEmail}` : email.senderName || email.senderEmail}
              </div>
              <div className="flex-1 flex items-center truncate text-sm">
                <span className={cn("truncate flex items-center", email.unread ? "font-bold text-gray-900 dark:text-gray-100" : "text-gray-800 dark:text-gray-200")}>
                  {email.isEncrypted && <Lock size={14} className="mr-1.5 text-green-600 dark:text-green-500 shrink-0" />}
                  
                  {email.securityReport?.isPhishing && (
                    <ShieldAlert size={14} className="mr-1.5 text-red-500 shrink-0" title="Possible Phishing" />
                  )}
                  {email.securityReport?.isSpam && !email.securityReport?.isPhishing && (
                    <AlertCircle size={14} className="mr-1.5 text-yellow-500 shrink-0" title="Possible Spam" />
                  )}

                  {email.subject}
                  {email.threadCount > 1 && (
                    <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md">
                      {email.threadCount}
                    </span>
                  )}
                </span>
                <span className="mx-2 text-gray-400 dark:text-gray-500 shrink-0">-</span>
                <span className="truncate text-gray-500 dark:text-gray-400">
                  {email.body.substring(0, 100)}
                </span>
              </div>
            </div>

            {/* Time & Actions Area */}
            <div className="w-40 shrink-0 text-right flex items-center justify-end gap-2 pr-4">
              {folder === 'sent' && email.seenAt && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 rounded-md text-green-600 dark:text-green-400 text-[10px] font-black uppercase tracking-tighter" title={`Seen at ${formatTime({ toMillis: () => new Date(email.seenAt).getTime() })}`}>
                  <div className="flex -space-x-1">
                    <ArrowRight size={10} className="stroke-[3]" />
                    <ArrowRight size={10} className="stroke-[3]" />
                  </div>
                  Seen
                </div>
              )}
              <span className={cn("text-xs transition-opacity group-hover:opacity-0", email.unread ? "font-bold text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400")}>
                {formatTime(email.timestamp)}
              </span>
              
              {/* Hover Actions */}
              <div className="absolute right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-50 dark:bg-[#1f2028] pl-2" onClick={(e) => e.stopPropagation()}>
                {folder === 'newsletters' && email.securityReport?.unsubscribeLink && (
                  <button 
                    onClick={() => window.open(email.securityReport.unsubscribeLink, '_blank')}
                    className="flex items-center gap-1.5 px-3 py-1 bg-violet-600 text-white text-[10px] font-bold rounded-full hover:bg-violet-700 transition-colors shadow-sm"
                  >
                    <BellOff size={12} />
                    Unsubscribe
                  </button>
                )}
                <button className="p-1.5 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm" aria-label="Archive">
                  <Archive size={16} />
                </button>
                <button className="p-1.5 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm" aria-label="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))
        )}
      </div>
    </div>
  );
}
