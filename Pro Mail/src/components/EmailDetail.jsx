import { ArrowLeft, Archive, Trash2, Clock, MoreVertical, Reply, Forward, Star, CornerUpLeft, CornerUpRight, Lock, Unlock, Key, Loader2, Download, Image, Paperclip, ShieldAlert, AlertCircle, Filter, Sparkles } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { cn } from "../lib/utils";
import { db, doc, getDoc, updateDoc } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { decryptPayload } from "../lib/crypto";

import { analyzeEmail } from "../lib/SecurityEngine";

export default function EmailDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentUser } = useAuth();
  const { openCompose, isFocusMode, toggleFocusMode } = useApp();
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedBody, setDecryptedBody] = useState("");
  const [error, setError] = useState(null);
  const [showImages, setShowImages] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState(null);

  const handleSummarize = () => {
    setIsSummarizing(true);
    // Simulated AI Processing
    setTimeout(() => {
      const sentences = decryptedBody.replace(/<[^>]*>/g, '').split(/[.!?]/).filter(s => s.trim().length > 10);
      const points = sentences.slice(0, 3).map(s => s.trim());
      setSummary(points.length > 0 ? points : ["This email discusses " + (email?.subject || "a new topic") + "."]);
      setIsSummarizing(false);
    }, 1500);
  };

  const securityReport = useMemo(() => {
    if (!email) return null;
    return analyzeEmail(email);
  }, [email]);

  const hasImages = /<img\s+[^>]*src=/i.test(decryptedBody);

  const processedBody = useMemo(() => {
    if (!decryptedBody) return "";
    if (showImages) return decryptedBody;
    // Simple regex to block external images for privacy
    return decryptedBody.replace(/<img\s+([^>]*)\bsrc=["']([^"']+)["']/gi, (match, attributes, src) => {
      return `<img ${attributes} src="" data-blocked-src="${src}" style="background: #f1f1f1; border: 1px dashed #ccc; padding: 10px; display: block; content: 'Image Blocked for Privacy';"`;
    });
  }, [decryptedBody, showImages]);

  const handleReply = () => {
    if (!email) return;
    openCompose({
      to: email.senderEmail,
      subject: email.subject,
      threadId: email.threadId,
      isReply: true
    });
  };

  const handleForward = () => {
    if (!email) return;
    openCompose({
      subject: email.subject,
      body: `\n\n---------- Forwarded message ----------\nFrom: ${email.senderEmail}\nDate: ${formatTime(email.timestamp)}\nSubject: ${email.subject}\n\n${decryptedBody}`,
      threadId: email.threadId
    });
  };

  useEffect(() => {
    async function fetchEmail() {
      if (!id || !currentUser) return;
      try {
        const docRef = doc(db, 'emails', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setEmail(data);
          
          if (data.isEncrypted && data.encryptedData) {
            setIsDecrypting(true);
            try {
              const isSender = data.senderUid === currentUser.uid;
              const decryptedStr = await decryptPayload(currentUser.uid, data.encryptedData, isSender);
              const payloadObj = JSON.parse(decryptedStr);
              setDecryptedBody(payloadObj.body);
            } catch (err) {
              console.error("Decryption failed:", err);
              setError("Failed to decrypt this message. The private key on this device does not match.");
            } finally {
              // Add artificial delay for visual effect
              setTimeout(() => {
                setIsDecrypting(false);
              }, 1500);
            }
          } else {
            setDecryptedBody(data.body);
          }
        } else {
          setError("Email not found.");
        }
      } catch (err) {
        console.error(err);
        setError("Error loading email.");
      } finally {
        setLoading(false);
      }
    }
    fetchEmail();
  }, [id, currentUser]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  const toggleStar = async () => {
    if (!email) return;
    try {
      const emailRef = doc(db, 'emails', id);
      await updateDoc(emailRef, { starred: !email.starred });
      setEmail(prev => ({ ...prev, starred: !prev.starred }));
    } catch (error) {
      console.error("Error toggling star: ", error);
    }
  };

  const handleArchive = async () => {
    try {
      await updateDoc(doc(db, 'emails', id), { folder: 'archive' });
      navigate('/');
    } catch (e) { console.error(e); }
  };

  const handleTrash = async () => {
    try {
      await updateDoc(doc(db, 'emails', id), { folder: 'trash' });
      navigate('/');
    } catch (e) { console.error(e); }
  };

  // Keyboard shortcut bindings for this view
  useEffect(() => {
    const onReply    = () => handleReply();
    const onForward  = () => handleForward();
    const onArchive  = () => handleArchive();
    const onTrash    = () => handleTrash();
    const onStar     = () => toggleStar();
    const onFocus    = () => toggleFocusMode();

    window.addEventListener('shortcut:email:reply',       onReply);
    window.addEventListener('shortcut:email:forward',     onForward);
    window.addEventListener('shortcut:email:archive',     onArchive);
    window.addEventListener('shortcut:email:trash',       onTrash);
    window.addEventListener('shortcut:email:toggleStar',  onStar);
    window.addEventListener('shortcut:focusMode:toggle',  onFocus);
    return () => {
      window.removeEventListener('shortcut:email:reply',       onReply);
      window.removeEventListener('shortcut:email:forward',     onForward);
      window.removeEventListener('shortcut:email:archive',     onArchive);
      window.removeEventListener('shortcut:email:trash',       onTrash);
      window.removeEventListener('shortcut:email:toggleStar',  onStar);
      window.removeEventListener('shortcut:focusMode:toggle',  onFocus);
    };
  }, [email, id, navigate, toggleFocusMode]);

  // Read Receipt Trigger
  useEffect(() => {
    if (!email || !currentUser || email.recipientUid !== currentUser.uid) return;
    if (email.requestReadReceipt && !email.seenAt) {
      updateDoc(doc(db, 'emails', id), {
        seenAt: new Date().toISOString(),
        seenBy: currentUser.uid
      }).catch(console.error);
    }
  }, [email, id, currentUser]);

  if (loading) {
     return (
       <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#16171d]">
         <Loader2 className="animate-spin text-violet-500" size={32} />
       </div>
     );
  }

  if (error || !email) {
     return (
       <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#16171d] text-gray-500">
         {error || "Email not found."}
       </div>
     );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#16171d] relative">
      {/* Focus Mode Bar */}
      {isFocusMode && (
        <div className="fixed inset-x-0 top-0 h-14 bg-white/80 dark:bg-[#16171d]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 animate-in slide-in-from-top-4 duration-500 z-[100]">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                {email?.subject}
              </h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Focus Mode Active</p>
            </div>
          </div>
          <button 
            onClick={toggleFocusMode}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 shrink-0 justify-between bg-white/50 dark:bg-[#16171d]/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400" 
            aria-label="Back to inbox"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
          
          <div className="flex items-center gap-1">
          <button className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Archive (E)" onClick={handleArchive}>
            <Archive size={18} />
          </button>
          <button className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Trash (Delete)" onClick={handleTrash}>
            <Trash2 size={18} />
          </button>
          <button 
            onClick={toggleFocusMode}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isFocusMode ? "bg-violet-600 text-white" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
            title="Focus Mode (Z)"
          >
            <Sparkles size={18} />
          </button>
          <button 
            onClick={() => navigate('/settings', { state: { newRule: { type: 'sender', value: email?.senderEmail } } })}
            className="p-2 rounded-lg text-gray-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors" 
            title="Filter messages like this"
          >
            <Filter size={18} />
          </button>
        </div>
        </div>
        
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
          <button 
            onClick={toggleStar}
            className={cn(
              "p-2 rounded-lg transition-all hover:scale-110 active:scale-95",
              email?.starred ? "text-amber-400" : "hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
            title={email?.starred ? "Unstar (Shift+S)" : "Star (Shift+S)"}
          >
            <Star size={18} fill={email?.starred ? "currentColor" : "none"} />
          </button>
          <button className="p-2 rounded-lg hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="More">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* Email Content */}
      <div className={cn(
        "flex-1 overflow-y-auto p-6 md:p-10",
        isFocusMode && "pt-24 md:pt-28"
      )}>
        <div className="max-w-3xl mx-auto">
          {/* Security Banner */}
          {securityReport?.isPhishing && (
            <div className="mb-8 p-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl flex gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="p-3 bg-red-100 dark:bg-red-500/20 rounded-xl text-red-600 dark:text-red-400 h-fit">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-800 dark:text-red-400 mb-1">Suspicious Activity Detected</h3>
                <p className="text-sm text-red-700/80 dark:text-red-300/80 mb-3">
                  This message was flagged as a potential phishing attempt. Be careful with links or requests for sensitive information.
                </p>
                <ul className="space-y-1">
                  {securityReport.securityReasons.map((r, i) => (
                    <li key={i} className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-current" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {securityReport?.isSpam && !securityReport?.isPhishing && (
            <div className="mb-8 p-6 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-2xl flex gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="p-3 bg-orange-100 dark:bg-orange-500/20 rounded-xl text-orange-600 dark:text-orange-400 h-fit">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-orange-800 dark:text-orange-400 mb-1">Possible Spam</h3>
                <p className="text-sm text-orange-700/80 dark:text-orange-300/80">
                  This message contains patterns common in spam or promotional mail.
                </p>
              </div>
            </div>
          )}

          {/* Subject */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <h1 className="text-2xl md:text-3xl font-normal text-gray-900 dark:text-gray-100 leading-snug">
              {email.subject}
            </h1>
            <div className="flex items-center gap-2 shrink-0 mt-1">
              <button className="p-2 text-gray-400 hover:text-yellow-400 transition-colors rounded-full hover:bg-gray-50 dark:hover:bg-gray-800">
                <Star size={20} className={cn(email.starred && "fill-yellow-400 text-yellow-400")} />
              </button>
            </div>
          </div>

          {/* Sender Info */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-sm">
                {(email.senderName || email.senderEmail || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{email.senderName || email.senderEmail}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline-block">&lt;{email.senderEmail}&gt;</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  to {email.recipientEmail} <span className="mx-1">▾</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{formatTime(email.timestamp)}</div>
              <div className="flex items-center gap-1 justify-end">
                <button className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded">
                  <CornerUpLeft size={16} />
                </button>
                <button className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Expiration Banner */}
          {email.expiresAt && (() => {
            const expiry = email.expiresAt.toMillis ? email.expiresAt.toMillis() : new Date(email.expiresAt).getTime();
            const expired = expiry < Date.now();
            if (expired) {
               return (
                 <div className="mb-6 flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-4 rounded-2xl w-full justify-center">
                   <Clock size={16} />
                   This message has expired and the contents have been purged for your security.
                 </div>
               );
            }
            return (
              <div className="mb-6 flex items-center gap-2 text-xs font-medium text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 px-3 py-1.5 rounded-full w-max">
                <Clock size={14} />
                Self-destructs on {new Date(expiry).toLocaleString()}
              </div>
            );
          })()}

          {/* Image Blocking Banner */}
          {hasImages && !showImages && (
            <div className="mb-6 flex items-center justify-between gap-4 text-xs font-medium text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 px-4 py-2.5 rounded-xl">
              <div className="flex items-center gap-2">
                <Image size={16} />
                Remote images are blocked to prevent the sender from tracking you.
              </div>
              <button 
                onClick={() => setShowImages(true)}
                className="font-bold hover:underline whitespace-nowrap"
              >
                Load Images
              </button>
            </div>
          )}

          {/* Encrypted Banner */}
          {email.isEncrypted && !isDecrypting && !error && (
            <div className="mb-6 flex items-center gap-2 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 px-3 py-1.5 rounded-full w-max">
              <Lock size={14} />
              End-to-End Encrypted Message
            </div>
          )}

          {/* Body */}
          {summary && (
            <div className="mb-10 p-6 bg-gradient-to-br from-violet-50 to-white dark:from-violet-500/5 dark:to-transparent border border-violet-100 dark:border-violet-500/20 rounded-[2rem] shadow-sm animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-2 mb-4 text-violet-600 dark:text-violet-400">
                <Sparkles size={18} />
                <h3 className="text-xs font-black uppercase tracking-[0.2em]">Smart Summary</h3>
              </div>
              <ul className="space-y-3">
                {summary.map((point, i) => (
                  <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex gap-3 leading-relaxed">
                    <span className="text-violet-400 mt-1 font-bold">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isDecrypting ? (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-green-300 dark:border-green-700 rounded-2xl bg-green-50/50 dark:bg-green-900/10">
              <div className="relative mb-4">
                <Lock size={48} className="text-green-500 absolute animate-pulse opacity-50" />
                <Unlock size={48} className="text-green-500 animate-bounce" />
              </div>
              <h3 className="text-lg font-medium text-green-800 dark:text-green-400 mb-2">Decrypting Payload...</h3>
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500 font-mono">
                <Key size={14} />
                <span>Using device private key</span>
              </div>
            </div>
          ) : (email.expiresAt && (email.expiresAt.toMillis ? email.expiresAt.toMillis() : new Date(email.expiresAt).getTime()) < Date.now()) ? null : (
            <div 
              className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: processedBody }}
            />
          )}

          {/* Quick Reply Actions */}
          <div className="mt-12 flex gap-3 flex-wrap">
            <button 
              onClick={handleReply}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300 group"
              title="Reply (R)"
            >
              <CornerUpLeft size={16} />
              Reply
              <kbd className="ml-1 text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md font-mono text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                R
              </kbd>
            </button>
            <button 
              onClick={handleForward}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300 group"
              title="Forward (F)"
            >
              <CornerUpRight size={16} />
              Forward
              <kbd className="ml-1 text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md font-mono text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                F
              </kbd>
            </button>

            <button 
              onClick={handleSummarize}
              disabled={isSummarizing || !decryptedBody}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-full transition-all text-sm font-bold ml-auto",
                summary 
                  ? "bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-500/30" 
                  : "text-gray-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 border border-gray-200 dark:border-gray-700"
              )}
            >
              {isSummarizing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              {isSummarizing ? "Analyzing..." : summary ? "Regenerate Summary" : "Smart Summary"}
            </button>
          </div>

          {/* Attachments Section */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Paperclip size={16} className="text-violet-500" />
                Attachments ({email.attachments.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {email.attachments.map((file) => (
                  <AttachmentItem key={file.id} file={file} currentUser={currentUser} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AttachmentItem({ file, currentUser }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(file.url);
      const data = await response.text();

      let finalBlob;
      if (file.isEncrypted) {
        const encryptedData = JSON.parse(data);
        const isSender = file.senderUid === currentUser.uid;
        const decryptedBase64 = await decryptPayload(currentUser.uid, encryptedData, isSender);
        
        // DataURL to Blob
        const fetchRes = await fetch(decryptedBase64);
        finalBlob = await fetchRes.blob();
      } else {
        finalBlob = await response.blob();
      }

      const downloadUrl = window.URL.createObjectURL(finalBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error("Download failed:", e);
      alert("Failed to download attachment.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1f2028] border border-gray-100 dark:border-gray-800 rounded-xl group transition-all hover:bg-gray-100 dark:hover:bg-gray-800">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 bg-white dark:bg-[#16171d] rounded-lg border border-gray-100 dark:border-gray-800 text-violet-500">
          <FileIcon type={file.type} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{file.name}</div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
            {(file.size / 1024).toFixed(1)} KB {file.isEncrypted && "• Encrypted"}
          </div>
        </div>
      </div>
      <button 
        onClick={handleDownload}
        disabled={isDownloading}
        className="p-2 bg-white dark:bg-[#16171d] border border-gray-100 dark:border-gray-800 rounded-lg text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors shadow-sm disabled:opacity-50"
      >
        {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      </button>
    </div>
  );
}

function FileIcon({ type }) {
  if (type.includes('image')) return <Image size={18} />;
  if (type.includes('pdf')) return <Paperclip size={18} />;
  return <Paperclip size={18} />;
}
