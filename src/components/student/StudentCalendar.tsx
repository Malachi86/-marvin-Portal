'use client';

import { Subject, Schedule } from '@/utils/storage';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

interface StudentCalendarProps {
  subjects: Subject[];
}

export default function StudentCalendar({ subjects }: StudentCalendarProps) {
  const groupedByDay = subjects.reduce((acc, subject) => {
    if (subject.schedules) {
      subject.schedules.forEach(schedule => {
        if (!acc[schedule.day]) {
          acc[schedule.day] = [];
        }
        acc[schedule.day].push({
          ...subject,
          ...schedule
        });
      });
    }
    return acc;
  }, {} as Record<string, (Subject & Schedule)[]>);

  /* Sort schedules by start time */
  Object.keys(groupedByDay).forEach(day => {
    groupedByDay[day]?.sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header Area */}
      <div>
        <h1 className="text-3xl font-black text-primary tracking-tighter uppercase">My Schedule</h1>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">Your weekly class schedule overview</p>
      </div>

      {/* Modern Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {DAYS.map((day) => {
          const dayClasses = groupedByDay[day] || [];
          return (
            <div key={day} className="bg-white rounded-[2.5rem] shadow-xl border border-primary/5 flex flex-col min-h-[500px]">
              {/* Day Column Header */}
              <div className="p-8 pb-4 flex items-center justify-between border-b border-primary/5">
                <h3 className="font-black text-sm uppercase tracking-widest text-primary">{day}</h3>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 px-3 py-1 rounded-full">
                  {dayClasses.length} Classes
                </span>
              </div>

              {/* Subject List */}
              <div className="p-6 space-y-4 flex-1 overflow-y-auto no-scrollbar">
                {dayClasses.length > 0 ? (
                  dayClasses.map((subject, index) => (
                    <div
                      key={`${subject.id}-${index}`}
                      className="p-6 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all group"
                    >
                      <h4 className="font-black text-sm text-slate-800 leading-tight mb-2 group-hover:text-primary transition-colors">
                        {subject.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground tracking-tight">
                        <Clock size={12} className="text-primary/60" />
                        <span>{subject.startTime} - {subject.dismissalTime}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-20 space-y-4">
                    <Clock size={48} strokeWidth={1} />
                    <p className="text-[9px] font-black uppercase tracking-widest">No classes scheduled</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
