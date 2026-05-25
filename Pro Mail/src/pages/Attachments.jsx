import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, collection, query, where, onSnapshot } from '../firebase';
import { Paperclip, File, Image, Download, ExternalLink, Search, Loader2, FileText, Music, Video as VideoIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function Attachments() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!currentUser) return;

    const emailsRef = collection(db, 'emails');
    const q = query(
      emailsRef, 
      where('recipientUid', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allAttachments = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.attachments && Array.isArray(data.attachments)) {
          data.attachments.forEach(att => {
            allAttachments.push({
              ...att,
              emailId: doc.id,
              senderName: data.senderName,
              senderEmail: data.senderEmail,
              timestamp: data.timestamp
            });
          });
        }
      });
      
      // Sort by date
      allAttachments.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
      setAttachments(allAttachments);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const filteredAttachments = attachments.filter(att => 
    att.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    att.senderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    att.senderEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return <Image size={24} className="text-blue-500" />;
    if (type?.includes('pdf')) return <FileText size={24} className="text-red-500" />;
    if (type?.startsWith('audio/')) return <Music size={24} className="text-purple-500" />;
    if (type?.startsWith('video/')) return <VideoIcon size={24} className="text-orange-500" />;
    return <File size={24} className="text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-[#16171d]">
        <Loader2 className="animate-spin text-violet-500" size={40} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#16171d]">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-violet-100 dark:bg-violet-500/10 rounded-lg text-violet-600 dark:text-violet-400">
                <Paperclip size={20} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Attachment Gallery</h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Access all your E2EE protected files and documents in one central hub.
            </p>
          </div>

          <div className="relative w-full md:w-72 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-24 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20 transition-all text-gray-900 dark:text-gray-100"
            />
            {!searchTerm && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <kbd className="hidden sm:inline-flex items-center gap-0.5 select-none rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-1.5 py-0.5 font-mono text-[9px] font-bold text-gray-400 dark:text-gray-500 shadow-sm uppercase">
                  <span>{typeof window !== 'undefined' && navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}</span>
                  <span>+</span>
                  <span>Shift</span>
                  <span>+</span>
                  <span>S</span>
                </kbd>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-8">
        {filteredAttachments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
            <Paperclip size={48} className="mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium">No attachments found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAttachments.map((att, i) => (
              <div 
                key={`${att.emailId}-${i}`}
                className="group relative bg-white dark:bg-[#1f2028] rounded-[2rem] border border-gray-100 dark:border-gray-800 p-6 transition-all hover:shadow-2xl hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-4 bg-gray-50 dark:bg-[#16171d] rounded-2xl">
                    {getFileIcon(att.type)}
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => navigate(`/email/${att.emailId}`)}
                      className="p-2 text-gray-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-full transition-colors"
                      title="View Email"
                    >
                      <ExternalLink size={18} />
                    </button>
                    <button 
                      className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-full transition-colors"
                      title="Download"
                    >
                      <Download size={18} />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate mb-1" title={att.name}>
                  {att.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mb-4">
                  <span>{(att.size / 1024).toFixed(1)} KB</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                  <span>{new Date(att.timestamp?.toMillis() || Date.now()).toLocaleDateString()}</span>
                </div>

                <div className="pt-4 border-t border-gray-50 dark:border-gray-800/50 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center text-[10px] text-white font-bold">
                    {att.senderName?.[0] || 'U'}
                  </div>
                  <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate">
                    {att.senderName || att.senderEmail}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
