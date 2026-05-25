import { useState, useEffect, useMemo } from 'react';
import { Keyboard, X, Search } from 'lucide-react';
import { useShortcuts } from '../context/ShortcutsContext';

// We map the groups to the IDs in the context
const GROUPS = [
  {
    title: 'Navigation',
    items: [
      { id: 'nav:inbox', label: 'Go to Inbox' },
      { id: 'nav:starred', label: 'Go to Starred' },
      { id: 'nav:sent', label: 'Go to Sent' },
      { id: 'nav:drafts', label: 'Go to Drafts' },
      { id: 'nav:calendar', label: 'Go to Calendar' },
      { id: 'nav:keep', label: 'Go to Keep' },
      { id: 'nav:security', label: 'Go to Security' },
    ]
  },
  {
    title: 'Actions',
    items: [
      { id: 'action:compose', label: 'Compose New Email' },
      { id: 'action:search', label: 'Universal Search' },
      { id: 'action:chat', label: 'Toggle Chat Sidebar' },
      { id: 'list:next', label: 'Select Next', alt: 'J' },
      { id: 'list:prev', label: 'Select Previous', alt: 'K' },
    ]
  },
  {
    title: 'Email',
    items: [
      { id: 'email:archive', label: 'Archive' },
      { id: 'email:trash', label: 'Delete' },
      { id: 'email:star', label: 'Star / Important' },
    ]
  },
  {
    title: 'System',
    items: [
      { id: 'system:theme', label: 'Toggle Dark Mode' },
      { id: 'system:help', label: 'Show Help' },
    ]
  }
];

function KbdKey({ children }) {
  return (
    <kbd className="min-w-[28px] h-7 flex items-center justify-center px-2 bg-gray-50 dark:bg-gray-800 border border-b-2 border-gray-200 dark:border-gray-600 rounded-lg text-[10px] font-bold text-gray-600 dark:text-gray-400 shadow-sm font-mono uppercase">
      {children}
    </kbd>
  );
}

export default function ShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { shortcuts } = useShortcuts();
  const isMac = typeof window !== 'undefined' && navigator.platform.toLowerCase().includes('mac');

  useEffect(() => {
    const toggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggleShortcutsModal', toggle);
    return () => window.removeEventListener('toggleShortcutsModal', toggle);
  }, []);

  useEffect(() => {
    const onEscape = () => setIsOpen(false);
    window.addEventListener('shortcut:escape', onEscape);
    return () => window.removeEventListener('shortcut:escape', onEscape);
  }, []);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return GROUPS.map(group => ({
      ...group,
      items: group.items.filter(item => item.label.toLowerCase().includes(q))
    })).filter(g => g.items.length > 0);
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setIsOpen(false)} />
      
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#1f2028] rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-10 pb-6 shrink-0">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-violet-500/20">
                <Keyboard size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Command Palette</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">Personalized Shortcuts</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all">
              <X size={24} />
            </button>
          </div>

          <div className="relative group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search commands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-24 py-4 bg-gray-50 dark:bg-[#16171d] border border-gray-100 dark:border-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
            {!searchQuery && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <kbd className="hidden sm:inline-flex items-center gap-0.5 select-none rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-1.5 py-0.5 font-mono text-[9px] font-bold text-gray-400 dark:text-gray-500 shadow-sm uppercase">
                  <span>{isMac ? '⌘' : 'Ctrl'}</span>
                  <span>+</span>
                  <span>Shift</span>
                  <span>+</span>
                  <span>S</span>
                </kbd>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-10 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
            {filteredGroups.map((group, i) => (
              <div key={i}>
                <h3 className="text-[10px] font-black text-violet-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                  <span className="w-6 h-[2px] bg-violet-500/20 rounded-full" />
                  {group.title}
                </h3>
                <div className="space-y-4">
                  {group.items.map((item) => {
                    const keys = shortcuts[item.id]?.keys || [];
                    return (
                      <div key={item.id} className="flex items-center justify-between group">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                          {item.label}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {keys.map((k, ki) => (
                            <KbdKey key={ki}>{k === 'Ctrl' && isMac ? '⌘' : k}</KbdKey>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-6 bg-gray-50 dark:bg-[#16171d]/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Customize these in <span className="text-violet-500">Settings</span>
        </div>
      </div>
    </div>
  );
}

