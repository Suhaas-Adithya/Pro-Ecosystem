import { useState } from 'react';
import { MessageSquare, Users, Search, X, Send, Smile, Plus, MoreHorizontal, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

const CONTACTS = [
  { id: 1, name: "Sarah Chen", status: "online", avatar: "SC", color: "from-blue-400 to-indigo-500" },
  { id: 2, name: "Alex Rivera", status: "away", avatar: "AR", color: "from-orange-400 to-red-500" },
  { id: 3, name: "Jordan Smith", status: "online", avatar: "JS", color: "from-green-400 to-teal-500" },
  { id: 4, name: "Emma Wilson", status: "offline", avatar: "EW", color: "from-violet-400 to-fuchsia-500" },
];

export default function ChatSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [message, setMessage] = useState('');

  return (
    <div className="flex h-full sticky top-0 z-30">
      {/* Mini Toggle Bar */}
      <div className="w-16 bg-white dark:bg-[#16171d] border-l border-gray-100 dark:border-gray-800 flex flex-col items-center py-6 gap-6 shrink-0 transition-all duration-300">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "p-3 rounded-2xl transition-all shadow-sm",
            isOpen ? "bg-violet-600 text-white" : "bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          )}
        >
          <MessageSquare size={20} />
        </button>

        <div className="flex flex-col gap-4">
          {CONTACTS.map((contact) => (
            <div key={contact.id} className="relative group">
              <button 
                onClick={() => {
                  setIsOpen(true);
                  setActiveChat(contact);
                }}
                className={cn(
                  "w-10 h-10 rounded-full bg-gradient-to-tr flex items-center justify-center text-[10px] font-black text-white shadow-sm transition-all hover:scale-110 active:scale-95",
                  contact.color
                )}
              >
                {contact.avatar}
              </button>
              {/* Status Indicator */}
              <div className={cn(
                "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-[#16171d]",
                contact.status === 'online' ? "bg-green-500" : contact.status === 'away' ? "bg-orange-500" : "bg-gray-400"
              )} />
              
              {/* Tooltip */}
              <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {contact.name}
              </div>
            </div>
          ))}
        </div>

        <button className="mt-auto p-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
          <Plus size={20} />
        </button>
      </div>

      {/* Expanded Chat Panel */}
      <div className={cn(
        "bg-white dark:bg-[#1f2028] border-l border-gray-100 dark:border-gray-800 flex flex-col transition-all duration-500 ease-out overflow-hidden shadow-2xl",
        isOpen ? "w-80" : "w-0"
      )}>
        <div className="w-80 flex flex-col h-full">
          {/* Panel Header */}
          <div className="p-6 border-b border-gray-50 dark:border-gray-800/50 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Users size={16} className="text-violet-500" />
              Direct Messages
            </h2>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {!activeChat ? (
              <div className="p-6">
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="Search contacts..." 
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#16171d] rounded-xl text-xs outline-none border border-transparent focus:border-violet-500/20"
                  />
                </div>
                
                <div className="space-y-1">
                  {CONTACTS.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => setActiveChat(contact)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all text-left group"
                    >
                      <div className={cn("w-10 h-10 rounded-full bg-gradient-to-tr flex items-center justify-center text-[10px] font-black text-white", contact.color)}>
                        {contact.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{contact.name}</div>
                        <div className="text-[10px] text-gray-500 flex items-center gap-1.5 capitalize">
                          <div className={cn("w-1.5 h-1.5 rounded-full", contact.status === 'online' ? "bg-green-500" : "bg-gray-400")} />
                          {contact.status}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Active Chat View */
              <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
                <div className="p-4 bg-gray-50 dark:bg-[#16171d] flex items-center gap-3 border-b border-gray-100 dark:border-gray-800">
                  <button onClick={() => setActiveChat(null)} className="p-1 text-gray-400 hover:text-gray-600">
                    <ChevronLeft size={20} />
                  </button>
                  <div className={cn("w-8 h-8 rounded-full bg-gradient-to-tr flex items-center justify-center text-[8px] font-black text-white", activeChat.color)}>
                    {activeChat.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-gray-900 dark:text-gray-100">{activeChat.name}</div>
                    <div className="text-[9px] text-green-500 font-bold uppercase tracking-widest">Active Now</div>
                  </div>
                </div>

                <div className="flex-1 p-4 space-y-4">
                  <div className="flex flex-col gap-1 max-w-[80%]">
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                      Hey! Did you get the chance to review the latest Pro Mail designs?
                    </div>
                    <span className="text-[9px] text-gray-400 ml-1">11:42 AM</span>
                  </div>

                  <div className="flex flex-col items-end gap-1 ml-auto max-w-[80%]">
                    <div className="bg-violet-600 p-3 rounded-2xl rounded-tr-none text-xs text-white shadow-lg shadow-violet-600/20 leading-relaxed">
                      Just looking at them now. The new Chat Sidebar is incredible!
                    </div>
                    <span className="text-[9px] text-gray-400 mr-1">11:45 AM</span>
                  </div>
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-gray-50 dark:border-gray-800/50">
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#16171d] p-2 rounded-2xl border border-transparent focus-within:border-violet-500/20 transition-all">
                    <input 
                      type="text" 
                      placeholder="Type a message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="flex-1 bg-transparent border-none outline-none text-xs text-gray-900 dark:text-gray-100 px-2"
                    />
                    <button className="p-1.5 text-violet-500 hover:scale-110 transition-transform">
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronLeft({ size, ...props }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="m15 18-6-6 6-6"/>
    </svg>
  );
}
