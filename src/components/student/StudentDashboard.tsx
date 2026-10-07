'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../shared/Layout';
import { 
    Calendar as CalendarIcon, BookOpen, Monitor, Loader2, ArrowRight, QrCode, 
    Smartphone, Mail, ShieldCheck, Barcode, User as UserIcon, Lock, 
    AlertTriangle, BarChart3, Clock, ClipboardList, Book, GraduationCap,
    History, MapPin, Send, XCircle, Bell, CheckCircle2, Zap, Activity,
    ChevronRight, ChevronLeft
} from 'lucide-react';
import { format, parseISO, isSameDay } from 'date-fns';
import { 
    getEnrollmentsAction, getSubjectsAction, getLabRequestsAction, 
    getTermsAction, getTermEnrollmentsAction, 
    getClassworksAction, getSubmissionsAction
} from '@/app/actions/dbActions';
import { Term, TermEnrollment, Classwork as ClassworkType, Subject } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DayPicker } from 'react-day-picker';
import "react-day-picker/style.css";

// Component Imports
import Classwork from './Classwork';
import ProfileView from '../shared/ProfileView';
import GradesView from './GradesView';
import MySubjects from './MySubjects';
import MakeRequest from './MakeRequest';
import MyRequests from './MyRequests';
import MySessions from './MySessions';
import Library from './Library';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('home');
  const [loading, setLoading] = useState(true);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<ClassworkType[]>([]);
  const [activeTerms, setActiveTerms] = useState<Term[]>([]);
  const [myTermEnrollments, setMyTermEnrollments] = useState<TermEnrollment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [terms, termEnr, enrollments, allSubjects, cws, subs] = await Promise.all([
        getTermsAction(), getTermEnrollmentsAction(), getEnrollmentsAction(), 
        getSubjectsAction(), getClassworksAction(), 
        getSubmissionsAction()
      ]);

      setActiveTerms(terms.filter(t => t.status === 'active'));
      setMyTermEnrollments(termEnr.filter(e => e.studentId === user.id));

      const myAppIds = enrollments.filter(e => e.studentId === user.id && e.status === 'approved').map(e => e.subjectId);
      const mySubjs = allSubjects.filter(s => myAppIds.includes(s.id));
      setSubjects(mySubjs);

      // Deadlines: Only unsubmitted and non-exempted tasks
      const currentUserId = user.id.trim();
      const mySubs = subs.filter(s => s.studentId === user.id);
      const deadlines = cws.filter(cw => {
          const isEnrolled = myAppIds.includes(cw.subjectId);
          const hasSubmitted = mySubs.some(s => s.classworkId === cw.id);
          const isExempted = cw.exemptedStudentIds?.some(id => id.trim() === currentUserId);
          return isEnrolled && cw.status === 'published' && !hasSubmitted && !isExempted;
      });
      setUpcomingDeadlines(deadlines);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const upcomingList = useMemo(() => {
    return upcomingDeadlines
      .sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime())
      .slice(0, 4); 
  }, [upcomingDeadlines]);

  const deadlinesForSelectedDay = useMemo(() => {
    return upcomingDeadlines.filter(cw => isSameDay(parseISO(cw.dueDate), selectedDate));
  }, [selectedDate, upcomingDeadlines]);

  const classesForSelectedDay = useMemo(() => {
    const dayName = format(selectedDate, 'EEEE');
    const list: any[] = [];
    
    subjects.forEach(s => {
        s.schedules?.forEach(sch => {
            if (sch.day === dayName) {
                list.push({
                    id: s.id,
                    name: s.name,
                    teacher: s.teacherName,
                    startTime: sch.startTime,
                    endTime: sch.dismissalTime
                });
            }
        });
    });
    
    return list.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [selectedDate, subjects]);

  const calendarModifiers = useMemo(() => {
    const scheduledWeekDays = new Set<string>();
    subjects.forEach(s => s.schedules?.forEach(sch => scheduledWeekDays.add(sch.day)));

    return {
        hasSchedule: (date: Date) => scheduledWeekDays.has(format(date, 'EEEE')),
        hasDeadline: (date: Date) => upcomingDeadlines.some(cw => isSameDay(parseISO(cw.dueDate), date))
    };
  }, [upcomingDeadlines, subjects]);

  const renderHome = () => {
    const currentTerm = activeTerms.find(t => myTermEnrollments.some(e => e.termId === t.id && e.status === 'approved'));

    return (
      <div className="space-y-12 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1">
            <h2 className="text-[2.2rem] md:text-[2.8rem] font-black text-primary tracking-tighter leading-none uppercase">Student Hub</h2>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-3">Active Workspace v2.0</p>
          </div>
          <div className="flex items-center gap-3">
              {currentTerm && <Badge className="h-10 md:h-12 px-6 rounded-full bg-green-600 text-white font-black text-[8px] md:text-[9px] uppercase tracking-widest shadow-lg">ACTIVE: {currentTerm.name}</Badge>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
            {/* Left: Schedule & Tasks Card */}
            <div className="lg:col-span-8 space-y-10">
                <Card className="rounded-[2.5rem] md:rounded-[3rem] border-none shadow-2xl bg-white p-6 md:p-12 space-y-10 overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-start">
                        
                        {/* Minimalist DayPicker */}
                        <div className="flex flex-col items-center justify-center p-2 overflow-x-auto w-full">
                            <DayPicker 
                                mode="single" 
                                selected={selectedDate} 
                                onSelect={(d) => d && setSelectedDate(d)}
                                modifiers={calendarModifiers}
                                modifiersClassNames={{
                                    hasSchedule: "!font-black !bg-primary/5 !text-primary !rounded-md",
                                    hasDeadline: "!font-black !underline !decoration-2 !underline-offset-4 !text-primary",
                                    selected: "!bg-transparent !text-primary !border-[2.5px] !border-primary !rounded-md !font-black",
                                    today: "!font-black !text-primary"
                                }}
                                classNames={{
                                    caption: "flex justify-between items-center mb-10 px-1 w-full",
                                    caption_label: "text-2xl font-black text-slate-800",
                                    nav: "flex items-center gap-4",
                                    nav_button: "h-10 w-10 flex items-center justify-center text-blue-600 transition-transform active:scale-90 hover:bg-slate-50 rounded-full",
                                    table: "w-full border-collapse",
                                    head_cell: "text-slate-400 font-bold text-[10px] uppercase tracking-widest pb-6 w-12",
                                    cell: "p-0 text-center",
                                    day: "h-12 w-12 text-sm font-black text-slate-400 hover:bg-slate-50 rounded-lg transition-all",
                                    day_selected: "text-primary border-primary",
                                    day_today: "text-primary"
                                }}
                            />
                        </div>

                        {/* Registry Panel */}
                        <div className="space-y-8 flex flex-col h-full">
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6D1B0A]">
                                    REGISTRY: {format(selectedDate, 'MMM dd, yyyy')}
                                </p>
                            </div>

                            <div className="space-y-10 flex-1 overflow-y-auto no-scrollbar max-h-[500px] pr-2">
                                {/* Chronological Class List */}
                                <div className="space-y-4">
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Class Schedule</p>
                                    {classesForSelectedDay.length > 0 ? (
                                        <div className="space-y-3">
                                            {classesForSelectedDay.map((c, i) => (
                                                <div key={`class-${i}`} className="p-5 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm flex items-center justify-between gap-6 group hover:border-primary/20 transition-all">
                                                    <div className="flex items-center gap-4 overflow-hidden">
                                                        <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0 shadow-inner group-hover:bg-primary group-hover:text-white transition-colors">
                                                            <BookOpen size={18}/>
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <p className="font-black text-[13px] uppercase text-slate-800 truncate leading-none mb-1.5">{c.name}</p>
                                                            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest truncate">Instr: {c.teacher}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="text-sm font-black text-primary tabular-nums">{c.startTime}</p>
                                                        <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Start</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-10 bg-slate-50/50 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center text-center opacity-20">
                                            <p className="text-[9px] font-black uppercase tracking-widest">No Scheduled Classes</p>
                                        </div>
                                    )}
                                </div>

                                {/* Task Registry */}
                                <div className="space-y-4 pt-6 border-t border-primary/5">
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Pending Assignments</p>
                                    {deadlinesForSelectedDay.length > 0 ? (
                                        <div className="space-y-3">
                                            {deadlinesForSelectedDay.map((cw, i) => (
                                                <div key={`deadline-${i}`} className="p-5 bg-primary/5 border border-primary/10 rounded-[1.5rem] shadow-sm flex justify-between items-center group">
                                                    <div className="overflow-hidden">
                                                        <p className="font-black text-xs uppercase text-primary truncate leading-none mb-2">{cw.title}</p>
                                                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                                                            Points: {cw.totalPoints} • Due: {format(parseISO(cw.dueDate), 'h:mm a')}
                                                        </p>
                                                    </div>
                                                    <Badge className="bg-primary text-white border-none font-black text-[7px] uppercase tracking-tighter h-6 px-3 rounded-full">TO-DO</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-12 flex flex-col items-center justify-center text-center opacity-20">
                                            <div className="h-14 w-14 rounded-full border-4 border-slate-200 flex items-center justify-center mb-4">
                                                <CheckCircle2 size={28} className="text-slate-200" />
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Registry Clear</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Sub-Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card onClick={() => setCurrentView('classwork')} className="p-10 rounded-[3rem] bg-[#14343A] text-white border-none shadow-2xl cursor-pointer hover:scale-[1.02] transition-all group overflow-hidden">
                        <div className="relative z-10 space-y-6">
                            <ClipboardList size={48} className="text-accent" />
                            <h4 className="text-3xl font-black uppercase tracking-tight">Active Tasks</h4>
                            <p className="text-[10px] font-bold opacity-60 uppercase tracking-[0.2em]">View assigned assessments</p>
                        </div>
                        <ArrowRight size={120} className="absolute -right-8 -bottom-8 opacity-5 group-hover:translate-x-4 transition-transform" />
                    </Card>
                    <Card onClick={() => setCurrentView('grades')} className="p-10 rounded-[3rem] bg-primary text-white border-none shadow-2xl cursor-pointer hover:scale-[1.02] transition-all group overflow-hidden">
                        <div className="relative z-10 space-y-6">
                            <BarChart3 size={48} className="text-white" />
                            <h4 className="text-3xl font-black uppercase tracking-tight">Grades & Records</h4>
                            <p className="text-[10px] font-bold opacity-60 uppercase tracking-[0.2em]">Live Ledger & Grade Slips</p>
                        </div>
                        <GraduationCap size={120} className="absolute -right-8 -bottom-8 opacity-5 group-hover:rotate-12 transition-transform" />
                    </Card>
                </div>
            </div>

            {/* Right: Upcoming Deadlines Card */}
            <div className="lg:col-span-4 space-y-10">
                <Card className="rounded-[3.5rem] border-none shadow-2xl bg-white p-10 space-y-12 flex flex-col h-full min-h-[550px]">
                    <div className="flex items-center gap-5">
                        <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center text-[#6D1B0A] shadow-inner">
                            <Bell size={32} />
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter leading-none text-foreground">
                            UPCOMING<br/>DEADLINES
                        </h3>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                        {upcomingList.length === 0 ? (
                            <div className="text-center">
                                <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-200">Clear workspace</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {upcomingList.map((cw) => (
                                    <div key={cw.id} className="group p-6 rounded-3xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-xl transition-all cursor-pointer">
                                        <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-2">
                                            {subjects.find(s => s.id === cw.subjectId)?.name || 'Subject Load'}
                                        </p>
                                        <h4 className="font-black text-base text-slate-800 uppercase leading-tight truncate">{cw.title}</h4>
                                        <div className="flex items-center gap-2 mt-3">
                                            <Clock size={12} className="text-slate-400" />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {format(parseISO(cw.dueDate), 'MMM dd, h:mm a')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-4">
                        <Button 
                            variant="outline" 
                            onClick={() => setCurrentView('classwork')}
                            className="w-full h-20 rounded-[2rem] border-2 border-dashed border-slate-200 bg-white hover:bg-slate-50 hover:border-primary/20 transition-all font-black uppercase text-[11px] tracking-[0.2em] text-slate-400 hover:text-primary"
                        >
                            View all classwork
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case 'home': return renderHome();
      case 'classwork': return <Classwork />;
      case 'profile': return <ProfileView onBack={() => setCurrentView('home')} />;
      case 'grades': return <GradesView onBack={() => setCurrentView('home')} />;
      case 'subjects': return <MySubjects />;
      case 'make-request': return <MakeRequest />;
      case 'my-requests': return <MyRequests />;
      case 'my-sessions': return <MySessions />;
      case 'library': return <Library />;
      default: return renderHome();
    }
  };

  if (loading && !subjects.length && currentView === 'home') {
     return <div className="flex justify-center items-center h-[70vh]"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;
  }

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      <div className="h-full pt-4">{renderContent()}</div>
    </Layout>
  );
}
