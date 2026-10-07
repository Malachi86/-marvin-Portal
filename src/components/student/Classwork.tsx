'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSubjectsAction, getEnrollmentsAction, getClassworksAction, getSubmissionsAction } from '@/app/actions/dbActions';
import { Subject, Enrollment, Classwork as ClassworkType, Submission } from '@/utils/storage';
import { Loader2, BookOpen, Bell, ListTodo, CheckCircle2, Clock, Calendar, ArrowRight, ClipboardList, AlertCircle, XCircle, UserCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import SubjectClasswork from './Classwork/SubjectClasswork';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, isPast, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Classwork() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classworks, setClassworks] = useState<ClassworkType[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [allSubjects, allEnrollments, allClassworks, allSubmissions] = await Promise.all([
        getSubjectsAction(),
        getEnrollmentsAction(),
        getClassworksAction(),
        getSubmissionsAction(),
      ]);

      const myEnrollments = allEnrollments.filter(
        (e: Enrollment) => e.studentId === user.id && e.status === 'approved'
      );
      const mySubjectIds = myEnrollments.map((e) => e.subjectId);
      const mySubjects = allSubjects.filter((s: Subject) => mySubjectIds.includes(s.id));
      
      setSubjects(mySubjects);
      setClassworks(allClassworks);
      setSubmissions(allSubmissions.filter(s => s.studentId === user.id));

      const signal = localStorage.getItem('notif_deep_link');
      if (signal) {
        try {
          const { subjectId, type } = JSON.parse(signal);
          if (type === 'classwork' || type === 'assignment-grade') {
            const targetSubj = mySubjects.find(s => s.id === subjectId);
            if (targetSubj) {
              setSelectedSubject(targetSubj);
            }
          }
        } catch (e) {}
      }
    } catch (error) {
      console.error("Failed to load classwork data", error);
    } finally {
      setLoading(false);
    }
  };
  
  const taskStats = useMemo(() => {
    const mySubjectIds = subjects.map(s => s.id);
    const relevantCW = classworks.filter(cw => mySubjectIds.includes(cw.subjectId) && cw.status === 'published');
    
    const currentUserId = user?.id?.trim();

    const pending = relevantCW.filter(cw => {
      const hasSubmitted = submissions.some(s => s.classworkId === cw.id);
      const isExempted = currentUserId && cw.exemptedStudentIds?.some(id => id.trim() === currentUserId);
      return !hasSubmitted && !isExempted && !isPast(parseISO(cw.dueDate));
    }).sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());

    const missed = relevantCW.filter(cw => {
      const hasSubmitted = submissions.some(s => s.classworkId === cw.id);
      const isExempted = currentUserId && cw.exemptedStudentIds?.some(id => id.trim() === currentUserId);
      return !hasSubmitted && !isExempted && isPast(parseISO(cw.dueDate));
    }).sort((a, b) => parseISO(b.dueDate).getTime() - parseISO(a.dueDate).getTime());

    const completed = relevantCW.filter(cw => {
      const hasSubmitted = submissions.some(s => s.classworkId === cw.id);
      const isExempted = currentUserId && cw.exemptedStudentIds?.some(id => id.trim() === currentUserId);
      return hasSubmitted || isExempted;
    }).sort((a, b) => parseISO(b.dueDate).getTime() - parseISO(a.dueDate).getTime());

    return { pending, missed, completed };
  }, [classworks, subjects, submissions, user?.id]);

  const getPendingCount = (subjectId: string) => {
    const subjectClassworks = classworks.filter(cw => cw.subjectId === subjectId && cw.status === 'published');
    const currentUserId = user?.id?.trim();
    return subjectClassworks.filter(cw => {
      const hasSubmitted = submissions.some(s => s.classworkId === cw.id);
      const isExempted = currentUserId && cw.exemptedStudentIds?.some(id => id.trim() === currentUserId);
      const isPastDue = isPast(parseISO(cw.dueDate));
      return !hasSubmitted && !isExempted && !isPastDue;
    }).length;
  };

  if (loading) {
    return <div className="flex justify-center p-32"><Loader2 className="animate-spin text-primary h-10 w-10"/></div>
  }

  if (selectedSubject) {
    return <SubjectClasswork subject={selectedSubject} onBack={() => {
      setSelectedSubject(null);
      localStorage.removeItem('notif_deep_link');
    }} />;
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-10 pb-20 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-primary leading-none">Academic Classwork</h2>
        <p className="text-[10px] font-black text-muted-foreground tracking-[0.1em] mt-2">Personal task registry & load overview</p>
      </div>

      <Card className="rounded-xl border border-primary/5 shadow-xl overflow-hidden bg-white">
        <div className="h-1.5 bg-primary" />
        <Tabs defaultValue="todo" className="w-full">
          <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-primary/5 bg-primary/[0.01]">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <ListTodo size={20} />
              </div>
              <div>
                <h3 className="font-black text-xl tracking-tighter text-foreground">Registry Signal</h3>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Global status tracker</p>
              </div>
            </div>
            
            <TabsList className="bg-muted/50 p-1 rounded-xl h-12 inline-flex w-full md:w-auto">
              <TabsTrigger value="todo" className="flex-1 md:flex-none px-6 font-black text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg">
                To-do ({taskStats.pending.length})
              </TabsTrigger>
              <TabsTrigger value="missed" className="flex-1 md:flex-none px-6 font-black text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm rounded-lg">
                Missed ({taskStats.missed.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex-1 md:flex-none px-6 font-black text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm rounded-lg">
                Completed ({taskStats.completed.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="todo" className="m-0">
            <div className="p-6 md:p-8">
              {taskStats.pending.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center opacity-30">
                  <CheckCircle2 size={48} className="text-primary mb-4" />
                  <p className="font-black text-[10px] tracking-[0.1em]">All Clear: No pending tasks</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {taskStats.pending.map(cw => {
                    const subject = subjects.find(s => s.id === cw.subjectId);
                    return (
                      <div 
                        key={cw.id} 
                        onClick={() => setSelectedSubject(subject || null)}
                        className="p-5 rounded-xl border border-primary/5 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all cursor-pointer group flex items-start justify-between gap-4"
                      >
                        <div className="flex gap-4">
                          <div className="h-10 w-10 rounded-lg bg-white border border-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0 shadow-sm">
                            <ClipboardList size={18} />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-[8px] font-black tracking-widest text-primary mb-1 truncate">{subject?.name || 'Class'}</p>
                            <h4 className="font-black text-sm tracking-tight text-slate-800 leading-tight truncate group-hover:text-primary transition-colors">{cw.title}</h4>
                            <div className="flex items-center gap-2 mt-2 text-[9px] font-bold text-slate-400">
                              <Clock size={10} /> {format(parseISO(cw.dueDate), "MMM dd, h:mm a")}
                            </div>
                          </div>
                        </div>
                        <ArrowRight size={14} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="missed" className="m-0">
            <div className="p-6 md:p-8">
              {taskStats.missed.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center opacity-30">
                  <AlertCircle size={48} className="text-slate-400 mb-4" />
                  <p className="font-black text-[10px] tracking-[0.1em]">No overdue requirements</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {taskStats.missed.map(cw => {
                    const subject = subjects.find(s => s.id === cw.subjectId);
                    return (
                      <div 
                        key={cw.id} 
                        onClick={() => setSelectedSubject(subject || null)}
                        className="p-5 rounded-xl border border-red-100 bg-red-50/20 hover:bg-white hover:shadow-lg transition-all cursor-pointer group flex items-start justify-between gap-4"
                      >
                        <div className="flex gap-4">
                          <div className="h-10 w-10 rounded-lg bg-white border border-red-100 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors shadow-sm">
                            <XCircle size={18} />
                          </div>
                          <div className="overflow-hidden">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-[8px] font-black tracking-widest text-red-600 truncate">{subject?.name || 'Class'}</p>
                                <Badge variant="destructive" className="h-4 px-1.5 text-[7px] font-black tracking-tighter leading-none">Missed</Badge>
                            </div>
                            <h4 className="font-black text-sm tracking-tight text-slate-800 leading-tight truncate group-hover:text-red-600 transition-colors">{cw.title}</h4>
                            <div className="flex items-center gap-2 mt-2 text-[9px] font-bold text-red-400">
                              <Clock size={10} /> Expired: {format(parseISO(cw.dueDate), "MMM dd")}
                            </div>
                          </div>
                        </div>
                        <ArrowRight size={14} className="text-red-200 group-hover:text-red-500 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="m-0">
            <div className="p-6 md:p-8">
              {taskStats.completed.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center opacity-30">
                  <CheckCircle2 size={48} className="text-green-400 mb-4" />
                  <p className="font-black text-[10px] tracking-[0.1em]">No completed work found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {taskStats.completed.map(cw => {
                    const subject = subjects.find(s => s.id === cw.subjectId);
                    const sub = submissions.find(s => s.classworkId === cw.id);
                    const currentUserId = user?.id?.trim();
                    const isExempted = currentUserId && cw.exemptedStudentIds?.some(id => id.trim() === currentUserId);
                    
                    return (
                      <div 
                        key={cw.id} 
                        onClick={() => setSelectedSubject(subject || null)}
                        className={cn(
                          "p-5 rounded-xl border transition-all cursor-pointer group flex items-start justify-between gap-4",
                          isExempted ? "border-blue-100 bg-blue-50/30" : "border-green-100 bg-green-50/20 hover:bg-white hover:shadow-lg"
                        )}
                      >
                        <div className="flex gap-4">
                          <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 shadow-md",
                            isExempted ? "bg-blue-500 text-white" : "bg-green-500 text-white"
                          )}>
                            {isExempted ? <UserCheck size={18} /> : <CheckCircle2 size={18} />}
                          </div>
                          <div className="overflow-hidden">
                            <p className={cn(
                              "text-[8px] font-black tracking-widest mb-1 truncate",
                              isExempted ? "text-blue-600" : "text-green-600"
                            )}>{subject?.name || 'Class'}</p>
                            <h4 className="font-black text-sm tracking-tight text-slate-800 leading-tight truncate">{cw.title}</h4>
                            <div className="flex items-center gap-3 mt-2">
                              <Badge className={cn(
                                "h-5 text-[8px] font-black tracking-widest border-none",
                                isExempted ? "bg-blue-600 text-white" : (sub?.status === 'graded' ? "bg-green-600 text-white" : "bg-blue-500 text-white")
                              )}>
                                {isExempted ? 'Exempted' : (sub?.status === 'graded' ? 'Graded' : 'Submitted')}
                              </Badge>
                              {(isExempted || sub?.status === 'graded') && (
                                <span className={cn("font-black text-[10px]", isExempted ? "text-blue-700" : "text-green-700")}>
                                  {isExempted ? cw.totalPoints : sub?.grade} / {cw.totalPoints}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <ArrowRight size={14} className={cn("group-hover:translate-x-1 transition-all shrink-0 mt-1", isExempted ? "text-blue-200 group-hover:text-blue-500" : "text-green-200 group-hover:text-green-500")} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
      
      <div className="space-y-6">
        <div className="flex items-center gap-3 ml-1">
          <BookOpen className="text-primary h-5 w-5" />
          <h3 className="font-black text-xl tracking-tight text-foreground">Course load overview</h3>
        </div>

        {subjects.length === 0 ? (
          <div className="bg-white rounded-xl shadow-xl p-20 text-center border border-primary/5">
              <BookOpen size={64} className="mx-auto mb-6 text-primary opacity-10" />
              <p className="text-muted-foreground font-black text-xs tracking-widest">You are not enrolled in any subjects.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map(subject => {
                  const pendingCount = getPendingCount(subject.id);
                  return (
                      <Card 
                          key={subject.id} 
                          className="cursor-pointer hover:shadow-xl transition-all duration-300 relative border border-primary/5 hover:border-primary/20 hover:-translate-y-1 bg-white rounded-xl group overflow-hidden"
                          onClick={() => setSelectedSubject(subject)}
                      >
                          <div className="h-1.5 bg-primary" />
                          {pendingCount > 0 && (
                              <div className="absolute top-0 right-0 z-20">
                                  <div className="relative">
                                      <div className="bg-red-600 text-white w-10 h-10 rounded-bl-[2rem] flex items-start justify-end p-2 shadow-lg">
                                          <span className="text-[10px] font-black">{pendingCount}</span>
                                      </div>
                                      <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full animate-ping opacity-40" />
                                  </div>
                              </div>
                          )}
                          <CardContent className="p-6">
                              <div className="flex justify-between items-start">
                                  <div className="space-y-1">
                                      <h3 className="font-black text-lg text-primary leading-tight group-hover:text-primary/80 transition-colors">{subject.name}</h3>
                                      <p className="text-[9px] font-black text-muted-foreground tracking-[0.1em]">{subject.teacherName}</p>
                                  </div>
                              </div>
                          </CardContent>
                      </Card>
                  );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
