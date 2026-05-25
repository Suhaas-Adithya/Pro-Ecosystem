import { NavLink } from "react-router-dom";
import { Inbox, Send, File, Trash2, Star, Clock, AlertCircle, Shield, Lock, Settings as SettingsIcon, Users, Newspaper, Calendar as CalendarIcon, Paperclip, Sparkles } from "lucide-react";
import { cn } from "../lib/utils";
import Logo from "./Logo";

const navItems = [
  { icon: Inbox, label: "Inbox", path: "/", shortcut: "I", count: 12 },
  { icon: Star, label: "Starred", path: "/starred", shortcut: "S" },
  { icon: Clock, label: "Snoozed", path: "/snoozed", shortcut: "B" },
  { icon: CalendarIcon, label: "Calendar", path: "/calendar", shortcut: "G" },
  { icon: Sparkles, label: "Keep", path: "/keep", shortcut: "H" },
  { icon: Send, label: "Sent", path: "/sent", shortcut: "T" },
  { icon: File, label: "Drafts", path: "/drafts", shortcut: "D", count: 3 },
  { icon: Newspaper, label: "Newsletters", path: "/newsletters", shortcut: "N" },
  { icon: Paperclip, label: "Attachments", path: "/attachments", shortcut: "A" },
  { icon: AlertCircle, label: "Spam", path: "/spam", shortcut: "!", count: 42 },
  { icon: Trash2, label: "Trash", path: "/trash", shortcut: "#" },
  { icon: Shield, label: "Aliases", path: "/aliases", shortcut: "L" },
  { icon: Lock, label: "Security", path: "/security", shortcut: "K" },
  { icon: Users, label: "Contacts", path: "/contacts", shortcut: "O" },
  { icon: SettingsIcon, label: "Settings", path: "/settings", shortcut: "P" },
];

export default function Sidebar({ onComposeClick }) {
  return (
    <aside className="w-64 bg-gray-50 dark:bg-gray-900 flex flex-col pt-4 px-3 pb-6 shrink-0 transition-colors duration-200">
      <div className="flex items-center gap-2 px-3 mb-8">
        <Logo className="h-5 text-gray-900 dark:text-white" />
        <span className="font-light text-xl tracking-tight text-gray-400 dark:text-gray-500 select-none">
          Mail
        </span>
      </div>

      <button
        className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white px-5 py-3 rounded-xl font-medium shadow-sm transition-all active:scale-[0.98] mb-6 group relative"
        onClick={onComposeClick}
        title="Compose new email (C)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Compose
        <kbd className="ml-auto text-[10px] font-bold bg-white/20 text-white border border-white/30 px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
          C
        </kbd>
      </button>

      <nav className="flex-1 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 group",
                isActive
                  ? "bg-violet-100 text-violet-900 dark:bg-violet-500/10 dark:text-violet-300"
                  : "text-gray-700 hover:bg-gray-200/50 dark:text-gray-300 dark:hover:bg-gray-800/50"
              )
            }
            title={`${item.label} (${item.shortcut})`}
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <item.icon
                    size={18}
                    className={cn(
                      "transition-colors",
                      isActive
                        ? "text-violet-600 dark:text-violet-400"
                        : "text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
                    )}
                  />
                  {item.label}
                </div>
                <div className="flex items-center gap-2">
                  {item.count && (
                    <span
                      className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full",
                        isActive
                          ? "bg-violet-200 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300"
                          : "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      )}
                    >
                      {item.count}
                    </span>
                  )}
                  {/* Shortcut hint – visible on hover */}
                  <kbd className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-md border transition-opacity font-mono",
                    isActive
                      ? "bg-violet-200/50 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-400 opacity-60"
                      : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100"
                  )}>
                    {item.shortcut}
                  </kbd>
                </div>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Shortcut hint footer */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('toggleShortcutsModal'))}
        className="mt-4 mx-1 flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 transition-colors group"
        title="View all keyboard shortcuts"
      >
        <kbd className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md font-mono text-gray-500 dark:text-gray-400">
          ?
        </kbd>
        <span className="font-medium">Keyboard shortcuts</span>
      </button>
    </aside>
  );
}
