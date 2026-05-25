import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import ChatSidebar from "./ChatSidebar";
import TopNavigation from "./TopNavigation";
import ComposeModal from "./ComposeModal";
import ShortcutsModal from "./ShortcutsModal";
import { useApp } from "../context/AppContext";
import { cn } from "../lib/utils";

export default function Layout() {
  const { isComposeOpen, openCompose, closeCompose, isFocusMode } = useApp();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <div className={cn(
        "transition-all duration-500 ease-in-out flex shrink-0",
        isFocusMode ? "w-0 -ml-64 opacity-0 pointer-events-none" : "w-64"
      )}>
        <Sidebar onComposeClick={() => openCompose()} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className={cn(
          "transition-all duration-500 ease-in-out overflow-hidden",
          isFocusMode ? "h-0 opacity-0 pointer-events-none" : "h-16"
        )}>
          <TopNavigation />
        </div>
        
        <main className={cn(
          "flex-1 overflow-auto bg-white dark:bg-[#16171d] transition-all duration-500 ease-in-out relative",
          isFocusMode 
            ? "m-0 rounded-none border-none shadow-none" 
            : "rounded-tl-2xl shadow-sm border border-gray-200 dark:border-gray-800 m-2 mt-0 ml-0 overflow-hidden"
        )}>
            <Outlet />
        </main>
        <ComposeModal isOpen={isComposeOpen} onClose={closeCompose} />
      </div>
      <div className={cn(
        "transition-all duration-500 ease-in-out overflow-hidden",
        isFocusMode ? "w-0 opacity-0 pointer-events-none" : "w-16 flex shrink-0"
      )}>
        <ChatSidebar />
      </div>
      <ShortcutsModal />
    </div>
  );
}
