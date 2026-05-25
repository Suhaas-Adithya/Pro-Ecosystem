import { useState, useRef, useEffect } from 'react';
import { X, Minus, Maximize2, Paperclip, Image, Link2, Smile, MoreVertical, Trash2, Lock, Unlock, Loader2, Sparkles, Wand2, Type, Eye } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { db, storage, collection, setDoc, doc, getDocs, getDoc, query, where, serverTimestamp, ref, uploadBytes, getDownloadURL } from '../firebase';
import { encryptPayload } from '../lib/crypto';

export default function ComposeModal({ isOpen, onClose }) {
  const { currentUser, aliases } = useAuth();
  const { composeData } = useApp();
  const [isMaximized, setIsMaximized] = useState(false);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [fromAddress, setFromAddress] = useState(currentUser?.email || '');
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [requestReadReceipt, setRequestReadReceipt] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [draftId, setDraftId] = useState(null);
  const [undoTimer, setUndoTimer] = useState(null);
  const [isUndoVisible, setIsUndoVisible] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [expiresIn, setExpiresIn] = useState(null); // null, 1h, 1d, 1w
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [undoProgress, setUndoProgress] = useState(100);
  
  const contentRef = useRef(null);
  const fileInputRef = useRef(null);

  const getExpirationDate = (val) => {
    if (!val) return null;
    const now = new Date();
    if (val === '1h') now.setHours(now.getHours() + 1);
    if (val === '1d') now.setDate(now.getDate() + 1);
    if (val === '1w') now.setDate(now.getDate() + 7);
    return now;
  };

  useEffect(() => {
    if (isOpen && composeData) {
      if (composeData.to) setTo(composeData.to);
      if (composeData.subject) {
        const prefix = composeData.isReply ? 'Re: ' : '';
        setSubject(prefix + composeData.subject);
      }
      if (composeData.body) setBody(composeData.body);
      if (composeData.threadId) setActiveThreadId(composeData.threadId);
    } else if (!isOpen) {
      setTo('');
      setSubject('');
      setBody('');
      setAttachments([]);
      setActiveThreadId(null);
      setDraftId(null);
    }
  }, [isOpen, composeData]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files.map(f => ({ file: f, id: Math.random().toString(36).substring(7) }))]);
  };

  const handleAIAction = (action) => {
    setIsProcessingAI(true);
    setShowAIMenu(false);
    // Simulated AI Writing processing
    setTimeout(() => {
      let newBody = body;
      if (action === 'professional') newBody = "Dear recipient,\n\nI hope this finds you well. " + body + "\n\nBest regards,\n" + (currentUser.displayName || 'User');
      if (action === 'concise') newBody = body.split('.').slice(0, 2).join('.') + ".";
      if (action === 'friendly') newBody = "Hi there!\n\nJust wanted to reach out. " + body + "\n\nTalk soon!";
      setBody(newBody);
      setIsProcessingAI(false);
    }, 1200);
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  useEffect(() => {
    if (currentUser && !fromAddress) setFromAddress(currentUser.email);
  }, [currentUser, fromAddress]);

  // Load signature on open
  useEffect(() => {
    if (isOpen && currentUser && !body) {
      const loadSignature = async () => {
        const userRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists() && snap.data().signature) {
          setBody('\n\n--\n' + snap.data().signature);
        }
      };
      loadSignature();
    }
  }, [isOpen, currentUser]);

  // Draft Auto-save Logic
  useEffect(() => {
    if (!to && !subject && !body) return;
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      try {
        const docRef = draftId ? doc(db, 'emails', draftId) : doc(collection(db, 'emails'));
        const newDraftId = docRef.id;
        if (!draftId) setDraftId(newDraftId);

        await setDoc(docRef, {
          id: newDraftId,
          senderUid: currentUser.uid,
          senderEmail: fromAddress,
          recipientEmail: to,
          subject: subject || '(No Subject)',
          body: body || '',
          folder: 'drafts',
          timestamp: serverTimestamp(),
          unread: false,
          starred: false,
          isSnoozed: false
        }, { merge: true });
        console.log("Draft saved:", newDraftId);
      } catch (err) {
        console.error("Draft save error:", err);
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timer);
  }, [to, subject, body, isOpen, currentUser, fromAddress, draftId]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Compose-specific shortcut events from useKeyboardShortcuts hook
  useEffect(() => {
    if (!isOpen) return;
    const onSend           = () => handleSend();
    const onToggleEncrypt  = () => setIsEncrypted(v => !v);
    const onToggleMaximize = () => setIsMaximized(v => !v);
    const onAddAttachment  = () => fileInputRef.current?.click();

    window.addEventListener('shortcut:compose:send',           onSend);
    window.addEventListener('shortcut:compose:toggleEncrypt',  onToggleEncrypt);
    window.addEventListener('shortcut:compose:toggleMaximize', onToggleMaximize);
    window.addEventListener('shortcut:compose:addAttachment',  onAddAttachment);
    return () => {
      window.removeEventListener('shortcut:compose:send',           onSend);
      window.removeEventListener('shortcut:compose:toggleEncrypt',  onToggleEncrypt);
      window.removeEventListener('shortcut:compose:toggleMaximize', onToggleMaximize);
      window.removeEventListener('shortcut:compose:addAttachment',  onAddAttachment);
    };
  }, [isOpen, to, subject, body, currentUser, fromAddress, draftId, isEncrypted]);

  const undoIntervalRef = useRef(null);

  const cancelUndo = () => {
    if (undoTimer) {
      clearTimeout(undoTimer);
      if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
      setUndoTimer(null);
      setIsUndoVisible(false);
      setIsSending(false);
      setUndoProgress(100);
    }
  };

  const handleSend = async () => {
    if (!to || !subject || !body || !currentUser) return;
    setIsSending(true);
    setIsUndoVisible(true);
    setUndoProgress(100);

    undoIntervalRef.current = setInterval(() => {
      setUndoProgress(prev => Math.max(0, prev - 1));
    }, 100);

    const timer = setTimeout(async () => {
      if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
      try {
        let finalPayload = { subject, body };
        let encryptedData = null;
        let recipientUid = null;

        // Find recipient public key and UID (using aliases array)
        const q = query(collection(db, 'users'), where('aliases', 'array-contains', to));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          alert('Recipient not found. Only users on Pro Mail can receive emails currently.');
          setIsSending(false);
          setIsUndoVisible(false);
          return;
        }
        
        const recipientUser = snap.docs[0].data();
        recipientUid = recipientUser.uid;

        // Process Attachments
        const attachmentData = [];
        for (const item of attachments) {
          const file = item.file;
          const reader = new FileReader();
          const fileContent = await new Promise((resolve) => {
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file); // Encode as base64 string for simplicity in the crypto helper
          });

          let encryptedFile = null;
          if (isEncrypted) {
            const myRef = doc(db, 'users', currentUser.uid);
            const mySnap = await getDoc(myRef);
            const myPublicKey = mySnap.exists() ? mySnap.data().publicKey : null;
            encryptedFile = await encryptPayload(fileContent, recipientUser.publicKey, myPublicKey);
          }

          const fileId = Math.random().toString(36).substring(7);
          const storageRef = ref(storage, `attachments/${fileId}_${file.name}`);
          
          // If encrypted, upload the JSON of encryptedFile, otherwise upload raw file
          const blob = new Blob([isEncrypted ? JSON.stringify(encryptedFile) : file], { type: isEncrypted ? 'application/json' : file.type });
          await uploadBytes(storageRef, blob);
          const url = await getDownloadURL(storageRef);

          attachmentData.push({
            id: fileId,
            name: file.name,
            size: file.size,
            type: file.type,
            url: url,
            isEncrypted: isEncrypted
          });
        }

        if (isEncrypted) {
          const myRef = doc(db, 'users', currentUser.uid);
          const mySnap = await getDoc(myRef);
          const myPublicKey = mySnap.exists() ? mySnap.data().publicKey : null;
          const payloadStr = JSON.stringify({ subject, body });
          encryptedData = await encryptPayload(payloadStr, recipientUser.publicKey, myPublicKey);
          
          finalPayload = {
             subject: 'Encrypted Message',
             body: 'This message is end-to-end encrypted.'
          };
        }

        const emailDocRef = draftId ? doc(db, 'emails', draftId) : doc(collection(db, 'emails'));
        
        await setDoc(emailDocRef, {
          id: emailDocRef.id,
          senderUid: currentUser.uid,
          senderEmail: fromAddress,
          senderName: fromAddress.split('@')[0],
          recipientEmail: to,
          recipientUid: recipientUid,
          subject: finalPayload.subject,
          body: finalPayload.body,
          encryptedData: encryptedData,
          isEncrypted: isEncrypted,
          attachments: attachmentData,
          threadId: activeThreadId || emailDocRef.id,
          expiresAt: expiresIn ? getExpirationDate(expiresIn) : null,
          timestamp: serverTimestamp(),
          folder: 'inbox',
          senderFolder: 'sent',
          unread: true,
          starred: false,
          isSnoozed: false,
          requestReadReceipt: requestReadReceipt,
          seenAt: null
        });

        setAttachments([]);
        setTo('');
        setSubject('');
        setBody('');
        setIsEncrypted(false);
        setDraftId(null);
        setIsUndoVisible(false);
        onClose();
      } catch (e) {
        console.error(e);
        alert('Failed to send email.');
      } finally {
        setIsSending(false);
        setUndoTimer(null);
      }
    }, 10000); // 10 second undo window

    setUndoTimer(timer);
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col bg-white dark:bg-[#1f2028] shadow-2xl transition-all duration-300 ease-in-out border border-gray-200 dark:border-gray-800 overflow-hidden",
        isMaximized
          ? "inset-4 md:inset-10 rounded-2xl"
          : "bottom-0 right-0 md:right-24 w-full md:w-[500px] h-[500px] rounded-t-2xl"
      )}
    >
      {/* Header */}
      <div className="h-10 bg-gray-100 dark:bg-[#16171d] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 shrink-0 rounded-t-2xl cursor-pointer">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">New Message</span>
        <div className="flex items-center gap-2">
          <button className="p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors" aria-label="Minimize">
            <Minus size={16} />
          </button>
          <button 
            className="p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors" 
            onClick={() => setIsMaximized(!isMaximized)}
            aria-label={isMaximized ? "Restore down" : "Maximize"}
          >
            <Maximize2 size={14} />
          </button>
          <button 
            className="p-1 text-gray-500 hover:bg-gray-200 hover:text-red-500 dark:hover:bg-gray-800 dark:hover:text-red-400 rounded transition-colors" 
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Form Fields */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800/50 flex items-center relative bg-gray-50/50 dark:bg-[#16171d]/50">
          <span className="text-gray-500 dark:text-gray-400 text-sm w-12 shrink-0">From</span>
          <select 
            value={fromAddress}
            onChange={(e) => setFromAddress(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-violet-600 dark:text-violet-400 focus:ring-0 p-0"
          >
            {aliases.map(alias => (
              <option key={alias} value={alias}>{alias}</option>
            ))}
          </select>
        </div>

        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800/50 flex items-center relative">
          <span className="text-gray-500 dark:text-gray-400 text-sm w-12 shrink-0">To</span>
          <input
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:ring-0 p-0"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            autoFocus
          />
          <div className="absolute right-4 text-xs text-gray-400 dark:text-gray-500 font-medium cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
            Cc Bcc
          </div>
        </div>
        
        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800/50 flex items-center">
          <input
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:ring-0 p-0"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        {/* E2EE Banner */}
        {isEncrypted && (
          <div className="bg-green-50 dark:bg-green-500/10 border-b border-green-100 dark:border-green-500/20 px-4 py-2 flex items-center justify-center gap-2 text-xs font-medium text-green-700 dark:text-green-400">
            <Lock size={14} />
            End-to-End Encryption Active
          </div>
        )}

        {/* Body Area */}
        <div className="flex-1 p-4 overflow-y-auto cursor-text text-sm text-gray-800 dark:text-gray-200" onClick={() => contentRef.current?.focus()}>
          <textarea
             ref={contentRef}
             className="w-full h-full resize-none bg-transparent border-none outline-none focus:ring-0 p-0"
             value={body}
             onChange={(e) => setBody(e.target.value)}
          />
        </div>

        {/* Attachments List */}
        {attachments.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800/50 bg-gray-50/50 dark:bg-[#16171d]/30 flex flex-wrap gap-2 shrink-0">
            {attachments.map((item) => (
              <div key={item.id} className="flex items-center gap-2 bg-white dark:bg-[#1f2028] border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm group">
                <Paperclip size={12} className="text-gray-400" />
                <span className="truncate max-w-[150px]">{item.file.name}</span>
                <button 
                  onClick={() => removeAttachment(item.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <input 
        type="file" 
        multiple 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        className="hidden" 
      />

      {/* Footer Toolbar */}
      <div className="h-14 bg-white dark:bg-[#1f2028] border-t border-gray-100 dark:border-gray-800/50 flex items-center justify-between px-4 shrink-0 rounded-b-2xl">
        <div className="flex items-center gap-3 flex-1">
          {isUndoVisible ? (
            <div className="flex flex-col w-full bg-violet-50 dark:bg-violet-500/10 px-4 py-3 rounded-xl border border-violet-100 dark:border-violet-500/20 gap-3">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 text-sm font-medium text-violet-700 dark:text-violet-300">
                  <Loader2 size={16} className="animate-spin" />
                  Sending in {Math.ceil(undoProgress / 10)}s...
                </div>
                <button 
                  onClick={cancelUndo}
                  className="text-sm font-bold text-violet-600 dark:text-violet-400 hover:underline"
                >
                  Undo
                </button>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-1 bg-violet-200 dark:bg-violet-900/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-violet-500 transition-all duration-100 ease-linear"
                  style={{ width: `${undoProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <button 
                onClick={handleSend}
                disabled={isSending || !to || !body}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm active:scale-95 group"
                title="Send (Ctrl+Enter)"
              >
                {isSending ? <Loader2 size={16} className="animate-spin" /> : null}
                Send
                <kbd className="text-[10px] font-bold px-1.5 py-0.5 bg-white/20 border border-white/30 rounded-md font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  ⌘ Enter
                </kbd>
              </button>
              
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
              
              <button 
                className={cn(
                  "p-2 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium",
                  isEncrypted 
                    ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 hover:bg-green-100 dark:hover:bg-green-500/20" 
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
                onClick={() => setIsEncrypted(!isEncrypted)}
                title="Toggle Encryption (Ctrl+Shift+D)"
              >
                {isEncrypted ? <Lock size={18} /> : <Unlock size={18} />}
              </button>

              <button 
                className={cn(
                  "p-2 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium",
                  requestReadReceipt 
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20" 
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
                onClick={() => setRequestReadReceipt(!requestReadReceipt)}
                title="Request Read Receipt"
              >
                <Eye size={18} />
              </button>
              
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors hidden sm:block" aria-label="Format options">
                <span className="font-serif font-bold italic text-base leading-none">A</span>
              </button>
              <button 
                onClick={() => fileInputRef.current.click()}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors hidden sm:block" 
                aria-label="Attach file"
              >
                <Paperclip size={18} />
              </button>

              <div className="relative">
                <button 
                  onClick={() => setShowAIMenu(!showAIMenu)}
                  disabled={isProcessingAI}
                  className={cn(
                    "p-2 rounded-lg transition-all flex items-center gap-1.5",
                    showAIMenu || isProcessingAI
                      ? "bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400"
                      : "text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10"
                  )}
                  title="Pro Write AI Assistant"
                >
                  {isProcessingAI ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                </button>

                {showAIMenu && (
                  <div className="absolute bottom-full mb-2 left-0 w-48 bg-white dark:bg-[#1f2028] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl p-2 animate-in slide-in-from-bottom-2 duration-200 z-50">
                    <div className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 dark:border-gray-800/50 mb-1">
                      Pro Write AI
                    </div>
                    {[
                      { id: 'professional', label: 'Professional Tone', icon: Type },
                      { id: 'friendly', label: 'Friendly Tone', icon: Smile },
                      { id: 'concise', label: 'Make it Concise', icon: Wand2 },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleAIAction(opt.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-400 rounded-xl transition-all text-left"
                      >
                        <opt.icon size={16} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors hidden sm:block" aria-label="Insert link">
                <Link2 size={18} />
              </button>
              <button 
                onClick={() => {
                  const options = [null, '1h', '1d', '1w'];
                  const idx = options.indexOf(expiresIn);
                  setExpiresIn(options[(idx + 1) % options.length]);
                }}
                className={cn(
                  "p-2 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium",
                  expiresIn 
                    ? "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20" 
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
                title={`Self-Destruct: ${expiresIn || 'None'}`}
              >
                <Clock size={18} />
                {expiresIn && <span className="text-[10px] font-bold">{expiresIn}</span>}
              </button>
              
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors hidden sm:block" aria-label="Insert emoji">
                <Smile size={18} />
              </button>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" aria-label="More options">
            <MoreVertical size={18} />
          </button>
          <button 
            className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" 
            aria-label="Discard draft"
            onClick={onClose}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
