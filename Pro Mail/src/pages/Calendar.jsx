import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Video, Clock, MapPin, Users, Sparkles, MoreVertical } from 'lucide-react';
import { cn } from '../lib/utils';

const EVENTS = [
  { id: 1, title: "Product Sync: Pro Mail", time: "10:00 AM", type: "meeting", participants: 4, color: "bg-violet-500" },
  { id: 2, title: "Security Audit", time: "1:30 PM", type: "work", participants: 2, color: "bg-blue-500" },
  { id: 3, title: "Newsletter Strategy", time: "4:00 PM", type: "meeting", participants: 6, color: "bg-fuchsia-500" },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const today = new Date();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = [];
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  // Padding for previous month
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-24 md:h-32 bg-gray-50/30 dark:bg-gray-800/10 border-b border-r border-gray-100 dark:border-gray-800" />);
  }

  // Days of current month
  for (let d = 1; d <= totalDays; d++) {
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    days.push(
      <div key={d} className="h-24 md:h-32 p-2 border-b border-r border-gray-100 dark:border-gray-800 group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30 relative">
        <span className={cn(
          "text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-colors",
          isToday ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100"
        )}>
          {d}
        </span>
        
        {isToday && (
          <div className="mt-2 space-y-1">
            {EVENTS.map(event => (
              <div key={event.id} className={cn("text-[10px] font-bold text-white px-1.5 py-0.5 rounded-md truncate shadow-sm", event.color)}>
                {event.title}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#16171d]">
      {/* Calendar Header */}
      <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 min-w-[180px]">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h1>
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button onClick={prevMonth} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all text-gray-500">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              Today
            </button>
            <button onClick={nextMonth} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all text-gray-500">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mr-2">
            {['Day', 'Week', 'Month'].map((v) => (
              <button 
                key={v}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  v === 'Month' ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500"
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg">
            <Plus size={18} />
            New Event
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Calendar Grid */}
        <div className="flex-1 overflow-y-auto border-r border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-7 border-l border-t border-gray-100 dark:border-gray-800">
            {DAYS.map(day => (
              <div key={day} className="py-3 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 border-b border-r border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                {day}
              </div>
            ))}
            {days}
          </div>
        </div>

        {/* Upcoming Sidebar */}
        <div className="w-80 p-8 hidden xl:flex flex-col bg-gray-50/50 dark:bg-[#16171d]/50">
          <div className="flex items-center gap-2 mb-8 text-violet-600 dark:text-violet-400">
            <Sparkles size={18} />
            <h2 className="text-xs font-black uppercase tracking-[0.2em]">Upcoming Agendas</h2>
          </div>

          <div className="space-y-6">
            {EVENTS.map(event => (
              <div key={event.id} className="bg-white dark:bg-[#1f2028] p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("w-2 h-10 rounded-full", event.color)} />
                  <button className="text-gray-300 hover:text-gray-600 transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">{event.title}</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Clock size={14} />
                    {event.time}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Users size={14} />
                    {event.participants} Participants
                  </div>
                </div>

                {event.type === 'meeting' && (
                  <button className="w-full mt-5 py-3 bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-violet-600 hover:text-white transition-all group/btn">
                    <Video size={16} className="transition-transform group-hover/btn:scale-110" />
                    Join Pro Meet
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-auto p-6 bg-gradient-to-br from-fuchsia-500 to-violet-600 rounded-[2.5rem] text-white shadow-xl shadow-violet-500/20">
            <h3 className="font-bold mb-2">Sync Your Schedule</h3>
            <p className="text-[11px] text-white/80 leading-relaxed mb-4">
              Link your external calendars to manage everything in the secure Pro ecosystem.
            </p>
            <button className="w-full py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-all">
              Connect Google/Outlook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
