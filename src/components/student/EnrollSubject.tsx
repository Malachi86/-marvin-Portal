'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';

import {
  UserPlus,
  AlertCircle,
  Loader2,
  Info,
  CheckCircle2,
  BookOpen,
  User as UserIcon,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  School,
  Lock
} from 'lucide-react';

import {
  addEnrollmentAction,
  getSubjectsAction,
  getUsersAction,
  getEnrollmentsAction,
  getTermEnrollmentsAction
} from '@/app/actions/dbActions';

import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { User, Subject, Enrollment, TermEnrollment } from '@/utils/storage';
import { Badge } from '@/components/ui/badge';

export default function EnrollSubject() {
  const { user } = useAuth();

  const [teachers, setTeachers] = useState<User[]>([]);
  const [allAvailableSubjects, setAllAvailableSubjects] = useState<Subject[]>([]);
  const [myApprovedTerms, setMyApprovedTerms] = useState<string[]>([]);
  const [existingEnrollments, setExistingEnrollments] = useState<Enrollment[]>([]);

  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const userId = user?.id;
  const userDept = user?.department || 'college';

  const loadInitialData = useCallback(async () => {
    if (!userId) return;
    
    try {
      const [
        users,
        subjects,
        termEnrollments,
        enrollments
      ] = await Promise.all([
        getUsersAction(),
        getSubjectsAction(),
        getTermEnrollmentsAction(),
        getEnrollmentsAction()
      ]);

      const approvedTerms = termEnrollments
        .filter((te: TermEnrollment) => te.studentId === userId && te.status === 'approved')
        .map((te: TermEnrollment) => te.termId);

      setMyApprovedTerms(approvedTerms);
      setExistingEnrollments(enrollments.filter((e: Enrollment) => e.studentId === userId));
      
      const filteredSubjects = subjects.filter(s => s.department === userDept);
      setAllAvailableSubjects(filteredSubjects);

      const teacherUsers = users.filter(u => 
        u.role === 'teacher' && u.department === userDept
      );

      const teachersWithSubjects = teacherUsers.filter(t =>
        filteredSubjects.some(
          s => s.teacherId === t.id && (approvedTerms.includes(s.termId))
        )
      );

      setTeachers(teachersWithSubjects);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load enrollment data.");
    } finally {
      setInitialLoading(false);
    }
  }, [userId, userDept]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const displayedSubjects = useMemo(() => {
    if (!selectedTeacher || !userId) return [];
    
    return allAvailableSubjects.filter(s =>
      s.teacherId === selectedTeacher &&
      myApprovedTerms.includes(s.termId)
    );
  }, [allAvailableSubjects, selectedTeacher, myApprovedTerms, userId]);

  const toggleSubject = useCallback((id: string) => {
    setSelectedSubjectIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!userId || selectedSubjectIds.length === 0) {
      setError('Please select at least one subject.');
      return;
    }

    setLoading(true);

    try {
      let successCount = 0;
      let failCount = 0;

      for (const subjectId of selectedSubjectIds) {
        const existing = existingEnrollments.find(en => en.subjectId === subjectId);

        if (existing) {
          failCount++;
          continue;
        }

        const newEnrollment = {
          id: `ENR-${Date.now()}-${subjectId}`,
          studentId: userId,
          subjectId: subjectId,
          enrolledAt: new Date().toISOString(),
          status: 'pending' as const
        };

        await addEnrollmentAction(newEnrollment);
        successCount++;
      }

      if (successCount > 0) {
        toast.success(`Sent enrollment request for ${successCount} subject(s).`);
      }
      
      if (failCount > 0) {
        toast.warning(`${failCount} subject(s) were already requested.`);
      }

      setSelectedTeacher('');
      setSelectedSubjectIds([]);
      loadInitialData();

    } catch (e) {
      toast.error("Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (myApprovedTerms.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-500">
        <div className="w-full max-w-4xl bg-white rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col md:flex-row">
          <div className="md:w-2/5 bg-primary p-12 text-white flex flex-col justify-center items-center text-center space-y-6">
            <div className="h-24 w-24 rounded-[2rem] bg-white/10 backdrop-blur-xl border-2 border-white/20 flex items-center justify-center shadow-2xl">
              <Lock size={48} className="text-white animate-pulse" />
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter leading-tight">Access Restricted</h3>
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.3em] mt-2">Term Enrollment Protocol</p>
            </div>
          </div>
          
          <div className="md:w-3/5 p-12 md:p-16 flex flex-col justify-center space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 rounded-full border border-amber-100">
                <AlertCircle size={14} className="text-amber-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Action Required</span>
              </div>
              <h2 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none">Enroll in Academic Cycle</h2>
              <p className="text-muted-foreground font-medium leading-relaxed">
                Kailangan mo munang mag-enroll sa active academic term bago ka makapili ng iyong mga subjects para sa trimester na ito.
              </p>
            </div>

            <div className="p-8 bg-muted/20 rounded-[2rem] border-2 border-primary/5 space-y-4 shadow-inner">
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-1"><School size={18} /></div>
                <div>
                  <p className="font-black uppercase text-[11px] tracking-tight text-foreground">Step 1: Request Entry</p>
                  <p className="text-xs text-muted-foreground font-medium mt-1">Pumunta sa Dashboard at piliin ang 'Join Academic Term'.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-1"><ShieldCheck size={18} /></div>
                <div>
                  <p className="font-black uppercase text-[11px] tracking-tight text-foreground">Step 2: Admin Validation</p>
                  <p className="text-xs text-muted-foreground font-medium mt-1">Hintayin ang approval ng administrator para sa iyong term status.</p>
                </div>
              </div>
            </div>

            <Button 
              asChild
              className="h-16 w-full rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-primary/20 gap-3"
            >
              <a href="/">
                Return to Dashboard <ArrowRight size={18} />
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                    <ShieldCheck size={18} />
                </div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Department Isolated: {userDept.toUpperCase()}</p>
            </div>
            <h2 className="text-[3.5rem] font-black text-primary tracking-tighter uppercase leading-none">Enrollment Portal</h2>
        </div>

        <div className="w-full md:w-96 space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
            FACULTY SELECTION
          </Label>
          <div className="relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/20 group-hover:text-primary transition-colors">
              <UserIcon size={20} />
            </div>
            <select
              value={selectedTeacher}
              onChange={(e) => {
                setSelectedTeacher(e.target.value);
                setSelectedSubjectIds([]);
              }}
              className="w-full h-16 bg-white border-2 border-primary/10 rounded-2xl pl-16 pr-8 font-black text-sm uppercase tracking-tight focus:ring-0 focus:border-primary transition-all appearance-none cursor-pointer shadow-xl shadow-primary/5"
            >
              <option value="" disabled>Select Department Faculty</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
              ))}
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/40">
              <ChevronRight className="rotate-90" size={20} />
            </div>
          </div>
        </div>
      </div>

      {selectedTeacher ? (
        <div className="space-y-10 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between border-b border-primary/5 pb-6">
            <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-primary">
              AVAILABLE SUBJECTS ({displayedSubjects.length})
            </h3>
            {selectedSubjectIds.length > 0 && (
                <span className="text-[10px] font-black uppercase bg-primary text-white px-4 py-1.5 rounded-full shadow-lg">
                    {selectedSubjectIds.length} SELECTED
                </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {displayedSubjects.map(s => {
              const isEnrolled = existingEnrollments.some(e => e.subjectId === s.id && e.status === 'approved');
              const isPending = existingEnrollments.some(e => e.subjectId === s.id && e.status === 'pending');
              const isSelected = selectedSubjectIds.includes(s.id);
              const isDisabled = isEnrolled || isPending;
              
              return (
                <Card 
                  key={s.id} 
                  onClick={() => !isDisabled && toggleSubject(s.id)}
                  className={cn(
                    "relative p-10 rounded-[3rem] border-none transition-all cursor-pointer flex flex-col justify-between group min-h-[220px]",
                    isSelected ? "bg-primary text-white shadow-2xl scale-[1.03]" : "bg-white shadow-xl hover:shadow-2xl hover:-translate-y-1",
                    isDisabled && "opacity-60 cursor-not-allowed bg-muted/10 grayscale"
                  )}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                        <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-colors shadow-inner", isSelected ? "bg-white/20 text-white" : "bg-primary/5 text-primary")}>
                            <BookOpen size={24} />
                        </div>
                        {isEnrolled ? (
                            <Badge className="bg-green-500 text-white font-black text-[9px] uppercase tracking-widest border-none shadow-sm gap-2 h-8 px-4 rounded-full">
                                <CheckCircle2 size={12} /> ENROLLED
                            </Badge>
                        ) : isPending ? (
                            <Badge className="bg-amber-500 text-white font-black text-[9px] uppercase tracking-widest border-none shadow-sm gap-2 h-8 px-4 rounded-full">
                                <Loader2 size={12} className="animate-spin" /> PENDING
                            </Badge>
                        ) : (
                            <div className={cn(
                                "w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center shadow-inner",
                                isSelected ? "bg-white border-white text-primary" : "border-primary/10 bg-muted/20 text-transparent"
                            )}>
                                <CheckCircle2 size={24} />
                            </div>
                        )}
                    </div>
                    
                    <div>
                        <h4 className={cn("font-black text-2xl uppercase leading-tight tracking-tight", isSelected ? "text-white" : "text-primary")}>
                            {s.name}
                        </h4>
                        <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] mt-2", isSelected ? "text-white/60" : "text-muted-foreground")}>
                            {s.code || 'SUBJ'} • {s.units || 3} UNITS
                        </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="pt-10 flex justify-center">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading || selectedSubjectIds.length === 0}
              className="h-20 px-24 rounded-[2rem] bg-primary hover:bg-primary/90 text-white font-black uppercase text-sm tracking-[0.3em] shadow-[0_30px_60px_-15px_rgba(109,27,10,0.4)] transition-all active:scale-95 disabled:grayscale"
            >
              {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={24} />}
              REQUEST ACADEMIC LOAD
            </Button>
          </div>
        </div>
      ) : (
        <div className="py-32 flex flex-col items-center justify-center text-center space-y-8 bg-white/50 border-4 border-dashed border-primary/5 rounded-[4rem]">
            <div className="h-24 w-24 rounded-[3rem] bg-primary/5 flex items-center justify-center text-primary/20 shadow-inner">
                <UserIcon size={48} />
            </div>
            <div>
                <h3 className="text-2xl font-black text-primary/40 uppercase tracking-tighter">Waiting for Instructor Selection</h3>
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.4em] mt-2">Select a faculty member from the dropdown to view available subjects</p>
            </div>
        </div>
      )}
    </div>
  );
}
