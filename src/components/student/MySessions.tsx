'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Calendar,
  Monitor,
  Clock,
  Loader2,
  Search,
  History,
  Timer,
  LayoutDashboard,
  MapPin,
  User as UserIcon
} from 'lucide-react';

import { 
  Attendance, 
  Subject, 
  Lab, 
  Reservation 
} from '@/utils/storage';

import {
  getAttendancesAction,
  getSubjectsAction,
  getLabsAction,
  getReservationsAction
} from '@/app/actions/dbActions';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, isSameWeek, parseISO, differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';

type PopulatedSession = Attendance & {
  subjectName: string;
  teacherName: string;
  labName: string;
  pcNumber?: string;
  duration: string;
};

export default function MySessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<PopulatedSession[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [labFilter, setLabFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [
        allAttendances, 
        allSubjects, 
        allLabs, 
        allReservations
      ] = await Promise.all([
        getAttendancesAction(),
        getSubjectsAction(),
        getLabsAction(),
        getReservationsAction()
      ]);

      // 1. Process History
      const myAttendances = allAttendances.filter(a => a.studentId === user.id);
      const populated = myAttendances.map(session => {
        const subject = allSubjects.find(s => s.id === session.subjectId);
        const lab = allLabs.find(l => l.id === session.locationId);
        
        let durationStr = '-';
        if (session.timeIn && session.timeOut) {
          const start = new Date(`1970-01-01T${session.timeIn}`);
          const end = new Date(`1970-01-01T${session.timeOut}`);
          const mins = differenceInMinutes(end, start);
          const hrs = (mins / 60).toFixed(1);
          durationStr = `${hrs} hrs`;
        } else if (session.timeIn) {
          durationStr = 'Active';
        }

        return {
          ...session,
          subjectName: subject?.name || 'Unknown Subject',
          teacherName: subject?.teacherName || 'Instructor',
          labName: lab?.name || 'Main Hall',
          pcNumber: session.pcId?.split('-').pop(),
          duration: durationStr
        };
      });

      setSessions(populated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

      // 2. Process Upcoming (Approved Reservations)
      const now = new Date();
      const myUpcoming = allReservations
        .filter(r => r.studentId === user.id || (allSubjects.find(s => s.id === r.subjectId)?.teacherId === r.teacherId))
        .filter(r => {
          try {
            const resDate = new Date(r.date);
            return resDate >= new Date(now.setHours(0,0,0,0));
          } catch { return false; }
        })
        .map(r => {
          const subj = allSubjects.find(s => s.id === r.subjectId);
          const lab = allLabs.find(l => l.id === r.locationId);
          return { ...r, subjectName: subj?.name, labName: lab?.name, teacherName: subj?.teacherName };
        });
      
      setUpcoming(myUpcoming);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  // --- ANALYTICS ---
  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    const totalMins = sessions.reduce((acc, s) => {
      if (s.timeIn && s.timeOut) {
        const start = new Date(`1970-01-01T${s.timeIn}`);
        const end = new Date(`1970-01-01T${s.timeOut}`);
        return acc + Math.abs(differenceInMinutes(end, start));
      }
      return acc;
    }, 0);
    
    const weekSessions = sessions.filter(s => {
      try { return isSameWeek(parseISO(s.date), new Date()); } catch { return false; }
    }).length;
    
    const lastSession = sessions.length > 0 ? format(parseISO(sessions[0].date), "MMM dd, yyyy") : 'None';

    return {
      total: totalSessions,
      hours: (totalMins / 60).toFixed(1),
      last: lastSession,
      week: weekSessions
    };
  }, [sessions]);

  // --- FILTERING LOGIC ---
  const filteredSessions = sessions.filter(s => {
    const matchesSearch = s.subjectName.toLowerCase().includes(search.toLowerCase()) || 
                          s.teacherName.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = subjectFilter === 'all' || s.subjectId === subjectFilter;
    const matchesLab = labFilter === 'all' || s.locationId === labFilter;
    const matchesDate = !dateFilter || s.date.startsWith(dateFilter);

    return matchesSearch && matchesSubject && matchesLab && matchesDate;
  });

  // Safe unique list generation for Select items
  const uniqueSubjects = useMemo(() => {
    const map = new Map<string, string>();
    sessions.forEach(s => {
      if (s.subjectId && s.subjectName) {
        map.set(s.subjectId, s.subjectName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [sessions]);

  const uniqueLabs = useMemo(() => {
    const map = new Map<string, string>();
    sessions.forEach(s => {
      if (s.locationId && s.labName) {
        map.set(s.locationId, s.labName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [sessions]);

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col gap-1">
        <h1 className="text-[3.5rem] font-black text-primary tracking-tighter uppercase leading-none">My Sessions</h1>
        <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-2">Your laboratory session history</p>
      </div>

      {/* ANALYTICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={History} label="Total Sessions" value={stats.total} />
        <StatCard icon={Timer} label="Total Hours Used" value={`${stats.hours} hrs`} />
        <StatCard icon={Calendar} label="Last Session" value={stats.last} />
        <StatCard icon={LayoutDashboard} label="This Week Sessions" value={stats.week} highlight />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* MAIN HISTORY & FILTERS */}
        <div className="lg:col-span-9 space-y-8">
          
          {/* FILTER BAR */}
          <Card className="rounded-[2rem] border-none shadow-xl bg-white p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search Session..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10 h-12 rounded-xl bg-muted/20 border-none font-bold text-xs"
                />
              </div>
              
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold text-xs"><SelectValue placeholder="Filter by Subject" /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Subjects</SelectItem>
                  {uniqueSubjects.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={labFilter} onValueChange={setLabFilter}>
                <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold text-xs"><SelectValue placeholder="Filter by Lab" /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Labs</SelectItem>
                  {uniqueLabs.map((lab) => (
                    <SelectItem key={lab.id} value={lab.id}>{lab.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input 
                type="date" 
                value={dateFilter} 
                onChange={e => setDateFilter(e.target.value)}
                className="h-12 rounded-xl bg-muted/20 border-none font-bold text-xs"
              />
            </div>
          </Card>

          {/* HISTORY TABLE */}
          <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white">
            <div className="h-2 bg-primary" />
            <div className="p-8 border-b border-primary/5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary"><History size={20} /></div>
              <h3 className="font-black uppercase tracking-tight text-xl">Session History</h3>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full">
                <thead className="bg-primary/5">
                  <tr className="text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b border-primary/5">
                    <th className="px-8 py-5 text-left">Date</th>
                    <th className="px-6 py-5 text-left">Subject</th>
                    <th className="px-6 py-5 text-left">Teacher</th>
                    <th className="px-6 py-5 text-left">Lab Room</th>
                    <th className="px-6 py-5 text-center">PC</th>
                    <th className="px-6 py-5 text-center">Time In</th>
                    <th className="px-6 py-5 text-center">Time Out</th>
                    <th className="px-6 py-5 text-center">Duration</th>
                    <th className="px-8 py-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-20 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs opacity-40">No session records found</td>
                    </tr>
                  ) : (
                    filteredSessions.map(session => (
                      <tr key={session.id} className="hover:bg-primary/[0.02] transition-colors group">
                        <td className="px-8 py-6 whitespace-nowrap">
                          <p className="font-black text-primary text-xs">{format(parseISO(session.date), "MMM dd, yyyy")}</p>
                        </td>
                        <td className="px-6 py-6">
                          <p className="font-black text-foreground uppercase text-xs truncate max-w-[120px]">{session.subjectName}</p>
                        </td>
                        <td className="px-6 py-6">
                          <p className="font-bold text-xs text-slate-600 truncate max-w-[100px]">{session.teacherName}</p>
                        </td>
                        <td className="px-6 py-6">
                          <p className="font-bold text-xs text-slate-600">{session.labName}</p>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <p className="text-[10px] font-black text-primary uppercase">PC-{session.pcNumber || 'NA'}</p>
                        </td>
                        <td className="px-6 py-6 text-center whitespace-nowrap">
                          <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">{session.timeIn}</span>
                        </td>
                        <td className="px-6 py-6 text-center whitespace-nowrap">
                          {session.timeOut ? (
                            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100">{session.timeOut}</span>
                          ) : (
                            <span className="text-[10px] font-bold text-muted-foreground italic">-</span>
                          )}
                        </td>
                        <td className="px-6 py-6 text-center">
                          <span className="font-black text-[10px] text-muted-foreground uppercase">{session.duration}</span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <Badge className={cn(
                            "px-3 py-1 rounded-full font-black text-[8px] uppercase tracking-widest border-none shadow-sm",
                            session.timeOut ? "bg-slate-500 text-white" : "bg-green-500 text-white animate-pulse"
                          )}>
                            {session.timeOut ? 'Completed' : 'Ongoing'}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* SIDEBAR: UPCOMING */}
        <div className="lg:col-span-3 space-y-10">
          
          {/* UPCOMING SESSION */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 ml-2">
              <Calendar className="text-primary h-5 w-5" />
              <h2 className="text-xl font-black uppercase tracking-widest text-primary">Upcoming Session</h2>
            </div>

            {upcoming.length === 0 ? (
              <Card className="p-10 text-center border-4 border-dashed rounded-[3rem] border-primary/5 bg-white/50">
                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em]">No approved reservations</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcoming.map((u, i) => (
                  <Card key={i} className="rounded-[2.5rem] border-none shadow-xl bg-primary text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 group-hover:rotate-0 transition-transform">
                      <Monitor size={120} />
                    </div>
                    <CardContent className="p-8 space-y-6 relative z-10">
                      <div className="flex justify-between items-start">
                        <Badge className="bg-white/20 text-white border-none font-black text-[8px] tracking-widest h-6 px-3">APPROVED</Badge>
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{format(parseISO(u.date), "MMM dd")}</span>
                      </div>
                      <div>
                        <h4 className="text-2xl font-black uppercase tracking-tight leading-tight">{u.subjectName}</h4>
                        <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1">Teacher: {u.teacherName}</p>
                      </div>
                      <div className="space-y-3 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2 text-xs font-bold"><MapPin size={14} className="opacity-60"/> {u.labName}</div>
                        <div className="flex items-center gap-2 text-xs font-bold"><Clock size={14} className="opacity-60"/> {u.startTime} - {u.endTime}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, highlight }: any) {
  return (
    <Card className={cn(
      "p-8 rounded-[2.5rem] border-none shadow-xl transition-all hover:-translate-y-1 flex flex-col justify-between min-h-[160px]",
      highlight ? "bg-primary text-white" : "bg-white text-foreground"
    )}>
      <div className={cn(
        "h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner",
        highlight ? "bg-white/10" : "bg-primary/5 text-primary"
      )}>
        <Icon size={22} />
      </div>
      <div className="mt-6">
        <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-60 mb-1")}>{label}</p>
        <p className="text-3xl font-black tracking-tighter leading-none">{value}</p>
      </div>
    </Card>
  );
}
