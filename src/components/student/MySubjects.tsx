'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';

import {
  getEnrollmentsAction,
  getSubjectsAction,
  deleteEnrollmentAction
} from '@/app/actions/dbActions';

import {
  Subject,
  Enrollment
} from '@/utils/storage';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";

import StudentCalendar from './StudentCalendar';
import SubjectDetailsStudent from './SubjectDetailsStudent';

import {
  Card,
  CardContent
} from '@/components/ui/card';

import {
  Calendar,
  BookOpen,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  XCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

export default function MySubjects() {
  const { user } = useAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [unenrollId, setUnenrollId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSubjects();
    }
    
    // Cloud Signal Listener for Cross-Device Sync
    const handleSync = (e: any) => {
        if (e.detail?.collection === 'enrollments' || e.detail?.collection === 'subjects') {
            loadSubjects();
        }
    };
    window.addEventListener('neural_sync_update', handleSync);
    return () => window.removeEventListener('neural_sync_update', handleSync);
  }, [user]);

  const loadSubjects = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [allEnrollments, allSubjects] = await Promise.all([
        getEnrollmentsAction(),
        getSubjectsAction()
      ]);

      const myEnrollments = allEnrollments.filter(e => e.studentId === user.id);
      setEnrollments(myEnrollments);
      setSubjects(allSubjects);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const approvedSubjects = useMemo(() => {
    const approvedIds = enrollments
      .filter(e => e.status === 'approved')
      .map(e => e.subjectId);
    return subjects.filter(s => approvedIds.includes(s.id));
  }, [subjects, enrollments]);

  const pendingSubjects = useMemo(() => {
    const pendingIds = enrollments
      .filter(e => e.status === 'pending')
      .map(e => e.subjectId);
    return subjects.filter(s => pendingIds.includes(s.id));
  }, [subjects, enrollments]);

  const handleUnenroll = async () => {
    if (!unenrollId) return;
    
    try {
      // Optimistic Update: Clear local state immediately for responsiveness
      setEnrollments(prev => prev.filter(e => e.id !== unenrollId));
      
      deleteEnrollmentAction(unenrollId);
      toast.success("Subject removed from your load.");
      setUnenrollId(null);
    } catch (e) {
      toast.error("Un-enrollment failed.");
      loadSubjects(); // Revert on failure
    }
  };

  if (selectedSubject) {
    return (
      <SubjectDetailsStudent
        subject={selectedSubject}
        onBack={() => setSelectedSubject(null)}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl md:text-3xl font-black text-primary tracking-tighter uppercase leading-none">
          My Academic Load
        </h2>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-2">
          Manage your course roster and schedule
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="subjects" className="w-full">
        <TabsList className="bg-white border-2 border-primary/5 h-12 p-1 rounded-full mb-8 inline-flex">
          <TabsTrigger value="subjects" className="rounded-full font-black uppercase text-[10px] tracking-widest px-8 data-[state=active]:bg-primary data-[state=active]:text-white">
            Current List
          </TabsTrigger>
          <TabsTrigger value="schedule" className="rounded-full font-black uppercase text-[10px] tracking-widest px-8 data-[state=active]:bg-primary data-[state=active]:text-white">
            Weekly Matrix
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="mt-0">
          {loading && enrollments.length === 0 ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : (
            <div className="space-y-12">
              {/* APPROVED SUBJECTS */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 border border-green-100">
                    <CheckCircle2 size={16} />
                  </div>
                  <h3 className="font-black text-xs uppercase tracking-widest text-foreground">Enrolled Load ({approvedSubjects.length})</h3>
                </div>

                {approvedSubjects.length === 0 ? (
                  <div className="p-16 border-2 border-dashed rounded-2xl text-center bg-white/50 border-primary/5">
                    <BookOpen className="mx-auto text-muted-foreground/20 mb-4" size={40} />
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">No active subjects recorded.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {approvedSubjects.map(subject => {
                      const schedule = subject.schedules?.[0];
                      const enrollment = enrollments.find(e => e.subjectId === subject.id);
                      return (
                        <Card
                          key={subject.id}
                          className="hover:shadow-xl transition-all border-primary/5 bg-white rounded-2xl overflow-hidden group"
                        >
                          <div className="h-1.5 bg-primary" />
                          <CardContent className="p-6 md:p-8 space-y-6">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <h3 className="font-black text-lg text-primary leading-tight uppercase group-hover:text-primary/80 transition-colors">
                                  {subject.name}
                                </h3>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{subject.code || 'SUBJ'}</p>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (enrollment) setUnenrollId(enrollment.id);
                                }}
                                className="h-8 w-8 rounded-lg bg-muted/50 text-muted-foreground hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-all"
                                title="Un-enroll"
                              >
                                <LogOut size={14} />
                              </button>
                            </div>

                            <div className="space-y-3">
                              {schedule && (
                                <div className="flex items-center gap-3 text-[10px] font-bold text-foreground/70 bg-muted/30 p-3 rounded-xl">
                                  <Clock size={12} className="text-primary" />
                                  {schedule.day} • {schedule.startTime}
                                </div>
                              )}
                              <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground px-1">
                                <span className="uppercase tracking-widest">Instructor:</span>
                                <span className="text-foreground font-black uppercase">{subject.teacherName}</span>
                              </div>
                            </div>

                            <div className="pt-4 border-t border-primary/5">
                              <Button 
                                onClick={() => setSelectedSubject(subject)}
                                variant="outline" 
                                className="w-full h-10 rounded-xl font-black uppercase text-[9px] tracking-widest gap-2"
                              >
                                Open Resource Hub
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* PENDING SUBJECTS */}
              {pendingSubjects.length > 0 && (
                <section className="pt-8 border-t border-primary/5">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                      <AlertCircle size={16} />
                    </div>
                    <h3 className="font-black text-xs uppercase tracking-widest text-foreground">Pending Approval ({pendingSubjects.length})</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingSubjects.map(subject => {
                      const enrollment = enrollments.find(e => e.subjectId === subject.id);
                      return (
                        <Card
                          key={subject.id}
                          className="bg-amber-50/20 border-amber-100 rounded-2xl shadow-sm overflow-hidden"
                        >
                          <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <h3 className="font-black text-base text-amber-900 leading-tight uppercase opacity-70">
                                  {subject.name}
                                </h3>
                                <p className="text-[9px] font-black text-amber-700/50 uppercase tracking-[0.2em]">{subject.code || 'SUBJ'}</p>
                              </div>
                              <button 
                                onClick={() => enrollment && setUnenrollId(enrollment.id)}
                                className="h-8 w-8 rounded-lg bg-amber-100/50 text-amber-700 hover:bg-amber-200 flex items-center justify-center transition-all"
                                title="Cancel Request"
                              >
                                <XCircle size={14} />
                              </button>
                            </div>
                            
                            <div className="flex items-center gap-2 text-[9px] font-black text-amber-600 uppercase tracking-widest">
                              <Loader2 size={12} className="animate-spin" />
                              Awaiting Verification
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="mt-0">
          <StudentCalendar subjects={approvedSubjects} />
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!unenrollId} onOpenChange={() => setUnenrollId(null)}>
        <AlertDialogContent className="rounded-2xl p-10 border-primary/5">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-primary uppercase">Terminate Academic Link?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-muted-foreground mt-4 leading-relaxed">
              Sigurado ka bang nais mong mag-unenroll o i-cancel ang iyong request sa subject na ito? Mawawala ang iyong access sa mga class resources at attendance logs para sa subject na ito.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="h-12 rounded-xl font-black uppercase text-[10px] tracking-widest">Abort</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnenroll} className="h-12 rounded-xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">Confirm Withdrawal</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}