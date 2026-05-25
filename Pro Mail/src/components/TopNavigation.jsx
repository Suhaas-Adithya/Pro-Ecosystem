import { Search, Moon, Sun, Bell, User, LayoutGrid, Mail, Video, HardDrive, MessageSquare, Keyboard, Sparkles } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function TopNavigation() {
  const { theme, toggleTheme } = useTheme();
  const { logout, currentUser } = useAuth();
  const { searchTerm, setSearchTerm } = useApp();
  const [isAppLauncherOpen, setIsAppLauncherOpen] = useState(false);
  const isMac = typeof window !== 'undefined' && navigator.platform.toLowerCase().includes('mac');

  const navigate = useNavigate();
  const location = useLocation();
  const isKeep = location.pathname.startsWith('/keep');

  const apps = [
    { name: 'Mail', icon: Mail, color: 'text-violet-500', path: '/', active: !isKeep },
    { name: 'Keep', icon: Sparkles, color: 'text-amber-500', path: '/keep', active: isKeep },
    { name: 'Meet', icon: Video, color: 'text-blue-500' },
    { name: 'Drive', icon: HardDrive, color: 'text-orange-500' },
    { name: 'Chat', icon: MessageSquare, color: 'text-green-500' },
  ];

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 shrink-0 relative">
      <div className="flex-1 max-w-2xl">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-24 py-2.5 border border-transparent rounded-xl leading-5 bg-white dark:bg-[#1f2028] text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-[#16171d] focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 sm:text-sm transition-all shadow-sm"
            placeholder="Search mail..."
          />
          {!searchTerm && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <kbd className="hidden sm:inline-flex items-center gap-0.5 select-none rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 font-mono text-[9px] font-bold text-gray-400 dark:text-gray-500 shadow-sm uppercase">
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

      <div className="flex items-center gap-2 ml-4">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('toggleShortcutsModal'))}
          className="p-2 rounded-full text-gray-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
          aria-label="Keyboard shortcuts (?)"
          title="Keyboard shortcuts (?)"
        >
          <Keyboard size={20} />
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-200/50 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle dark mode (Shift+D)"
          title="Toggle dark mode (Shift+D)"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setIsAppLauncherOpen(!isAppLauncherOpen)}
            className={`p-2 rounded-full transition-colors ${isAppLauncherOpen ? 'bg-violet-100 dark:bg-violet-500/10 text-violet-600' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-200/50 dark:hover:bg-gray-800'}`}
            aria-label="App launcher"
          >
            <LayoutGrid size={20} />
          </button>

          {isAppLauncherOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#1f2028] rounded-[2rem] shadow-2xl border border-gray-100 dark:border-gray-800 p-6 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-6 px-2">Pro Suite</h3>
              <div className="grid grid-cols-3 gap-y-8">
                {apps.map((app) => (
                  <div 
                    key={app.name} 
                    className="flex flex-col items-center gap-2 group cursor-pointer"
                    onClick={() => {
                      setIsAppLauncherOpen(false);
                      if (app.path) navigate(app.path);
                    }}
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-gray-50 dark:bg-[#16171d] border border-gray-100 dark:border-gray-800 flex items-center justify-center transition-all group-hover:scale-110 group-hover:shadow-lg ${app.active ? 'ring-2 ring-violet-500/20 bg-violet-50 dark:bg-violet-500/5' : ''}`}>
                      <app.icon className={`w-7 h-7 ${app.color}`} />
                    </div>
                    <span className={`text-[11px] font-bold ${app.active ? 'text-violet-600' : 'text-gray-500 dark:text-gray-400'}`}>
                      {app.name}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
                <button className="text-xs font-bold text-violet-600 hover:underline">
                  More from Pro
                </button>
              </div>
            </div>
          )}
        </div>

        <button className="p-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-200/50 dark:hover:bg-gray-800 transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-gray-50 dark:ring-gray-900" />
        </button>

        <div 
          className="flex items-center gap-3 cursor-pointer ml-2 group hover:opacity-80 transition-opacity"
          onClick={() => logout()}
          title="Click to log out"
        >
          <div className="hidden sm:block text-right">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-none">
              {currentUser?.displayName || 'Bindhu Sreenath'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {currentUser?.email || 'bindhu@pro.me'}
            </div>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 p-[2px]">
            <div className="bg-white dark:bg-gray-900 h-full w-full rounded-full flex items-center justify-center overflow-hidden">
              <User size={18} className="text-gray-600 dark:text-gray-300" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
