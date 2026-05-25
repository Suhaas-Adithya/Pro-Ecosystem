import { Newspaper, BellOff, ExternalLink, CheckCircle2 } from "lucide-react";
import EmailList from "../components/EmailList";

export default function Newsletters() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#16171d]">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-violet-100 dark:bg-violet-500/10 rounded-lg text-violet-600 dark:text-violet-400">
            <Newspaper size={20} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Newsletters & Subscriptions</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          We've automatically identified your subscriptions. Quickly manage and unsubscribe from unwanted noise.
        </p>
      </div>
      
      <EmailList folder="newsletters" />
    </div>
  );
}
