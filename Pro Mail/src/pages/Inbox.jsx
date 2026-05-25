import { useState, useEffect } from "react";
import { User, Users, Tag, ShieldCheck, Mail } from "lucide-react";
import EmailList from "../components/EmailList";
import { cn } from "../lib/utils";

const TABS = [
  { id: 'primary', label: 'Primary', icon: Mail },
  { id: 'social', label: 'Social', icon: Users },
  { id: 'promotions', label: 'Promotions', icon: Tag },
  { id: 'security', label: 'Security', icon: ShieldCheck },
];

export default function Inbox() {
  const [activeCategory, setActiveCategory] = useState('primary');

  useEffect(() => {
    const onSetCategory = (e) => {
      if (e.detail?.category) setActiveCategory(e.detail.category);
    };
    window.addEventListener('shortcut:list:setCategory', onSetCategory);
    return () => window.removeEventListener('shortcut:list:setCategory', onSetCategory);
  }, []);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#16171d]">
      {/* Inbox Tabs */}
      <div className="flex items-center px-4 border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-[#16171d]/50 backdrop-blur-md sticky top-0 z-20 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id)}
            className={cn(
              "flex items-center gap-3 px-6 py-4 border-b-2 transition-all min-w-max",
              activeCategory === tab.id
                ? "border-violet-600 text-violet-600 bg-violet-50/50 dark:bg-violet-500/5 font-bold"
                : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
            )}
          >
            <tab.icon size={18} className={cn(activeCategory === tab.id ? "text-violet-600" : "text-gray-400")} />
            <span className="text-sm tracking-tight">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        <EmailList folder="inbox" category={activeCategory} />
      </div>
    </div>
  );
}
