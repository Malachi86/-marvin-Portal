'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
    CheckCircle, LogIn, LogOut as LogOutIcon, QrCode, ShieldCheck, 
    ClipboardList, Zap, ArrowLeft, RefreshCw,
    Users, Search, UserCheck, XCircle, ListChecks, Award, Save, Activity, CheckCircle2,
    GraduationCap,
    RotateCcw,
    ChevronRight,
    UserPlus,
    Clock,
    AlertTriangle,
    UserX
} from 'lucide-react';
import { toast } from 'sonner';
import { 
    getAttendancesAction, addAttendanceAction, updateAttendanceAction, 
    getUsersAction, getSubjectsAction, getEnrollmentsAction, 
    getReservationsAction, getClassworksAction, getSubmissionsAction,
    addSubmissionAction, updateSubmissionAction, updatePcAction, addEnrollmentAction
} from '@/app/actions/dbActions';
import { ScannerComponent } from './ScannerComponent';
import SelectPCDialog from './SelectPCDialog';
import { User, Subject, Attendance, Classwork, Submission } from '@/utils/storage';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

type ScanMode = 'in' | 'out' | 'score';

export default function QRScanner() {
  const { user: teacher } = useAuth();
  const [scanMode, setScanMode] = useState<ScanMode>('in');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  
  // Data State
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [roster, setAllStudents] = useState<User[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [classworks, setClassworks] = useState<Classwork[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  
  // Selection States
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  
  // Scanned Protocol State
  const [scannedStudentId, setScannedStudentId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [pendingAttendance, setPendingAttendance] = useState<{ student: User, subjectId: string } | null>(null);
  
  const [pcSelection, setPcSelection] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- INITIALIZATION ---
  useEffect(() => {
    loadData();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [teacher]);

  const loadData = async () => {
    if (!teacher) return;
    setLoading(true);
    try {
      const [subj, usrs, enr, att, cws, subs] = await Promise.all([
        getSubjectsAction(), getUsersAction(), getEnrollmentsAction(),
        getAttendancesAction(), getClassworksAction(), getSubmissionsAction()
      ]);

      const tSubjs = subj.filter(s => s.teacherId === teacher.id);
      setSubjects(tSubjs);
      setAllStudents(usrs.filter(u => u.role === 'student'));
      setEnrollments(enr);
      setAttendances(att);
      setClassworks(cws);
      setSubmissions(subs);

      const now = new Date();
      const currentDay = now.toLocaleString('en-US', { weekday: 'long' });
      const active = tSubjs.find(s => 
        s.schedules?.some(sch => {
            if (sch.day !== currentDay) return false;
            const [sh, sm] = sch.startTime.split(':').map(Number);
            const [eh, em] = sch.dismissalTime.split(':').map(Number);
            const start = new Date(now); start.setHours(sh, sm, 0);
            const end = new Date(now); end.setHours(eh, em, 0);
            return now >= new Date(start.getTime() - 45 * 60000) && now <= end;
        })
      );

      if (active) {
          setActiveSubject(active);
          setSelectedSubjectId(active.id);
      } else if (tSubjs.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(tSubjs[0].id);
      }
    } catch (e) {
      toast.error("Registry sync failed.");
    } finally {
      setLoading(false);
    }
  };

  // --- DERIVED DATA ---
  const currentSubjectStudents = useMemo(() => {
    const targetId = selectedSubjectId || activeSubject?.id;
    if (!targetId) return [];
    const enrolledIds = enrollments.filter(e => e.subjectId === targetId && e.status === 'approved').map(e => e.studentId);
    return roster.filter(u => enrolledIds.includes(u.id)).sort((a,b) => a.name.localeCompare(b.name));
  }, [selectedSubjectId, activeSubject, enrollments, roster]);

  const activeSessions = useMemo(() => {
    const targetId = selectedSubjectId || activeSubject?.id;
    if (!targetId) return [];
    const today = new Date().toISOString().split('T')[0];
    return attendances.filter(a => a.subjectId === targetId && a.date.startsWith(today) && !a.timeOut);
  }, [attendances, selectedSubjectId, activeSubject]);

  const filteredStudents = useMemo(() => {
    return currentSubjectStudents.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [currentSubjectStudents, searchTerm]);

  const scannedStudent = useMemo(() => {
    return roster.find(s => s.id === scannedStudentId);
  }, [roster, scannedStudentId]);

  const filteredCategoryTasks = useMemo(() => {
    if (!selectedCategory || !selectedSubjectId) return [];
    return classworks
      .filter(cw => cw.subjectId === selectedSubjectId && cw.type === selectedCategory && cw.status === 'published')
      .sort((a, b) => {
        const subA = submissions.find(s => s.classworkId === a.id && s.studentId === scannedStudentId);
        const subB = submissions.find(s => s.classworkId === b.id && s.studentId === scannedStudentId);
        if (!subA && subB) return -1;
        if (subA && !subB) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [classworks, selectedCategory, selectedSubjectId, scannedStudentId, submissions]);

  // --- ACTION HANDLERS ---
  const processScan = async (data: string) => {
    const studentId = data.trim();
    const student = roster.find(s => s.id === studentId);
    
    if (!student) {
      toast.error("Identity not found in Registry.");
      return;
    }

    const targetSubjectId = selectedSubjectId || activeSubject?.id;

    if (scanMode === 'in') {
      const isEnrolled = enrollments.some(e => e.subjectId === targetSubjectId && e.studentId === student.id && e.status === 'approved');
      if (!isEnrolled) {
          setScannedStudentId(student.id);
          toast.info("Registration Protocol Required", { description: `${student.name} is not on the roster.` });
      } else {
          setPendingAttendance({ student, subjectId: targetSubjectId! });
          toast.success(`Identity Verified: ${student.name}`);
      }
    } else if (scanMode === 'out') {
      const session = activeSessions.find(s => s.studentId === student.id);
      if (session) {
        handleDismissal(session.id, student.name);
      } else {
        toast.warning(`${student.name} has no active session.`);
      }
    } else if (scanMode === 'score') {
       setScannedStudentId(student.id);
       toast.success(`Identity Verified: ${student.name}`);
    }
  };

  const handleCommitAttendance = async (status: 'present' | 'late' | 'absent') => {
    if (!pendingAttendance) return;
    const { student, subjectId } = pendingAttendance;

    const isAlreadyIn = activeSessions.some(s => s.studentId === student.id);
    if (isAlreadyIn) {
        toast.warning(`${student.name} is already checked in.`);
        setPendingAttendance(null);
        return;
    }

    try {
        const reservations = await getReservationsAction();
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const activeRes = reservations.find(r => r.subjectId === subjectId && r.date === todayStr);
        
        if (activeRes?.locationType === 'lab' && status !== 'absent') {
            setPcSelection({ 
                labId: activeRes.locationId, 
                student, 
                subject: subjects.find(s => s.id === subjectId),
                status 
            });
            setPendingAttendance(null);
            return;
        }

        await addAttendanceAction({
            studentId: student.id,
            subjectId: subjectId,
            date: now.toISOString(),
            status: status,
            timeIn: status === 'absent' ? undefined : now.toLocaleTimeString('en-US', { hour12: false }),
            timeOut: status === 'absent' ? now.toLocaleTimeString('en-US', { hour12: false }) : undefined,
            sessionId: `SESS-${Date.now()}`
        });

        toast.success(`Marked ${student.name} as ${status.toUpperCase()}`);
        setPendingAttendance(null);
        loadData();
    } catch (e) {
        toast.error("Entrance logging failed.");
    }
  };

  const handleDismissal = async (attendanceId: string, name: string) => {
    try {
        const timeOut = new Date().toLocaleTimeString('en-US', { hour12: false });
        await updateAttendanceAction(attendanceId, { timeOut });
        
        const record = attendances.find(a => a.id === attendanceId);
        if (record?.pcId) {
            await updatePcAction(record.pcId, { status: 'available' });
        }

        toast.success(`Dismissal Recorded: ${name}`);
        loadData();
    } catch (e) {
        toast.error("Dismissal failed.");
    }
  };

  const handleFinalizeSession = async () => {
    const targetId = selectedSubjectId || activeSubject?.id;
    if (!targetId) return;

    const today = new Date().toISOString().split('T')[0];
    const presentStudentIds = attendances
        .filter(a => a.subjectId === targetId && a.date.startsWith(today))
        .map(a => a.studentId);

    const missingStudents = currentSubjectStudents.filter(s => !presentStudentIds.includes(s.id));

    if (missingStudents.length === 0) {
        toast.info("Registry Perfect: All enrolled students accounted for.");
        return;
    }

    if (!confirm(`Mark remaining ${missingStudents.length} students as ABSENT?`)) return;

    setLoading(true);
    try {
        const now = new Date().toISOString();
        for (const student of missingStudents) {
            await addAttendanceAction({
                studentId: student.id,
                subjectId: targetId,
                date: now,
                status: 'absent',
                timeIn: undefined,
                timeOut: new Date().toLocaleTimeString('en-US', { hour12: false }),
                sessionId: `SESS-AUTO-ABS-${Date.now()}`
            });
        }
        toast.success(`Protocol Finalized: ${missingStudents.length} students marked absent.`);
        loadData();
    } catch (e) {
        toast.error("Finalization failed.");
    } finally {
        setLoading(false);
    }
  };

  const handleManualGrade = async (studentId: string, classworkId: string, score: string) => {
    if (!classworkId || !score) return;
    const val = parseFloat(score);
    if (isNaN(val)) return;

    try {
        const existing = submissions.find(s => s.classworkId === classworkId && s.studentId === studentId);
        if (existing) {
            await updateSubmissionAction(existing.id, { grade: val, status: 'graded' });
        } else {
            await addSubmissionAction({
                classworkId,
                studentId,
                grade: val,
                status: 'graded',
                submittedAt: new Date().toISOString()
            });
        }
        toast.success("Score recorded.");
        loadData();
    } catch (e) {
        toast.error("Grade injection failed.");
    }
  };

  // --- UI RENDERERS ---
  const renderInMode = () => (
    <div className="space-y-12 animate-in fade-in duration-500">
        {!pendingAttendance ? (
            <div className="space-y-12">
                <div className="w-full max-w-[400px] mx-auto">
                    <ScannerComponent mode="in" onScan={processScan} />
                </div>
                
                {scannedStudentId && (
                     <div className="p-8 bg-blue-50 border-2 border-blue-100 rounded-[2.5rem] flex flex-col items-center text-center gap-6 animate-in zoom-in-95 duration-500 shadow-xl">
                        <div className="h-16 w-16 rounded-[1.5rem] bg-blue-500 text-white flex items-center justify-center shadow-lg"><UserPlus size={32}/></div>
                        <div>
                            <h3 className="text-xl font-black uppercase text-blue-900 leading-none">Register Identity?</h3>
                            <p className="text-[10px] font-bold text-blue-700/60 uppercase tracking-widest mt-2">
                                {roster.find(u => u.id === scannedStudentId)?.name} is not on this roster.
                            </p>
                        </div>
                        <div className="flex gap-3 w-full">
                            <Button onClick={() => setScannedStudentId(null)} variant="ghost" className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest">Cancel</Button>
                            <Button onClick={() => handleRegisterToSubject(scannedStudentId!)} className="flex-[2] h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest shadow-lg">Register</Button>
                        </div>
                     </div>
                )}

                <div className="space-y-4 pt-4 border-t border-primary/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 text-center">Manual Registry Selection</p>
                    <div className="relative group max-w-md mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/20 group-focus-within:text-primary transition-colors" size={16} />
                        <Input 
                            placeholder="Search Name or USN..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="h-12 pl-10 rounded-2xl border-primary/5 bg-slate-50 font-bold text-xs"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                        {filteredStudents.map(s => (
                            <div key={s.id} onClick={() => setPendingAttendance({ student: s, subjectId: selectedSubjectId || activeSubject!.id })} className="p-4 bg-white border border-primary/5 rounded-2xl flex items-center justify-between hover:bg-primary/5 cursor-pointer transition-all active:scale-[0.98] shadow-sm">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={s.profilePic} />
                                        <AvatarFallback className="bg-muted text-primary font-black text-xs">{s.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-black text-slate-800 text-xs uppercase">{s.name}</p>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase">{s.id}</p>
                                    </div>
                                </div>
                                <ChevronRight size={14} className="text-primary/20" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        ) : (
            <div className="space-y-10 animate-in zoom-in-95 duration-500">
                <div className="p-8 rounded-[2.5rem] bg-slate-50 border-4 border-primary/5 flex flex-col items-center text-center space-y-6">
                    <Avatar className="h-24 w-20 rounded-[2rem] border-4 border-white shadow-2xl">
                        <AvatarImage src={pendingAttendance.student.profilePic} />
                        <AvatarFallback className="bg-white text-primary font-black text-3xl">{pendingAttendance.student.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h4 className="text-3xl font-black uppercase text-slate-800 tracking-tight leading-none">{pendingAttendance.student.name}</h4>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] mt-3">Determine Registry Status</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Button 
                        onClick={() => handleCommitAttendance('present')} 
                        className="h-24 rounded-[2rem] bg-green-600 hover:bg-green-700 text-white font-black uppercase text-xs tracking-widest flex flex-col gap-2 shadow-xl shadow-green-900/10"
                    >
                        <CheckCircle2 size={24} /> PRESENT
                    </Button>
                    <Button 
                        onClick={() => handleCommitAttendance('late')} 
                        className="h-24 rounded-[2rem] bg-amber-500 hover:bg-amber-600 text-white font-black uppercase text-xs tracking-widest flex flex-col gap-2 shadow-xl shadow-amber-900/10"
                    >
                        <Clock size={24} /> LATE
                    </Button>
                    <Button 
                        onClick={() => handleCommitAttendance('absent')} 
                        className="h-24 rounded-[2rem] bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs tracking-widest flex flex-col gap-2 shadow-xl shadow-red-900/10"
                    >
                        <UserX size={24} /> ABSENT
                    </Button>
                </div>

                <Button 
                    onClick={() => setPendingAttendance(null)} 
                    variant="ghost" 
                    className="w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400"
                >
                    Discard Scan
                </Button>
            </div>
        )}
    </div>
  );

  const renderOutMode = () => (
    <div className="space-y-12 animate-in fade-in duration-500">
        <div className="w-full max-w-[400px] mx-auto">
            <ScannerComponent mode="out" onScan={processScan} />
        </div>

        <div className="space-y-6 pt-6 border-t border-primary/5">
            <div className="flex items-center justify-between px-2">
                <div>
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-primary">Active Session Control</h4>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Students currently checked-in</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleFinalizeSession} className="h-10 px-6 rounded-xl bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest shadow-lg gap-2">
                        <UserX size={14}/> Finalize Registry (Auto-Absent)
                    </Button>
                    {activeSessions.length > 0 && (
                        <Button onClick={() => { if(confirm("Bulk dismiss all?")) handleDismissAll(); }} variant="destructive" className="h-10 px-6 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg">
                            Bulk Dismiss ({activeSessions.length})
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
                {activeSessions.length === 0 ? (
                    <div className="col-span-full py-20 text-center border-4 border-dashed rounded-[3rem] border-slate-100 opacity-20">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">No Active Signals</p>
                    </div>
                ) : (
                    activeSessions.map(session => {
                        const student = roster.find(u => u.id === session.studentId);
                        return (
                            <div key={session.id} className="p-5 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-between shadow-sm group hover:border-primary/20 transition-all">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-10 w-10 border-2 border-primary/5">
                                        <AvatarImage src={student?.profilePic} />
                                        <AvatarFallback className="bg-muted text-primary font-black text-xs">{student?.name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-black text-slate-800 text-sm uppercase leading-none">{student?.name}</p>
                                        <p className="text-[9px] font-bold text-muted-foreground mt-1.5 uppercase">Entered: {session.timeIn}</p>
                                    </div>
                                </div>
                                <Button onClick={() => handleDismissal(session.id, student?.name || 'Student')} variant="outline" className="h-9 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest text-red-600 border-red-100 hover:bg-red-50">
                                    End Session
                                </Button>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    </div>
  );

  const handleRegisterToSubject = async (studentId: string) => {
    const targetId = selectedSubjectId || activeSubject?.id;
    if (!targetId) return;

    try {
        await addEnrollmentAction({
            id: `ENR-${Date.now()}-${studentId}`,
            studentId,
            subjectId: targetId,
            enrolledAt: new Date().toISOString(),
            status: 'approved'
        });
        toast.success("Identity Provisioned: Student Registered");
        setScannedStudentId(null);
        loadData();
    } catch (e) {
        toast.error("Provisioning failed.");
    }
  };

  const renderScoreManagement = () => (
    <div className="space-y-12 animate-in fade-in duration-500">
        {!scannedStudent ? (
            <div className="space-y-12">
                <div className="w-full max-w-[400px] mx-auto">
                    <ScannerComponent mode="in" onScan={processScan} />
                </div>
                <div className="space-y-4 pt-4 border-t border-primary/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 text-center">Manual Registry Search</p>
                    <div className="relative group max-w-md mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/20 group-focus-within:text-primary transition-colors" size={16} />
                        <Input 
                            placeholder="Name or USN..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="h-12 pl-10 rounded-2xl border-primary/5 bg-slate-50 font-bold text-xs"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                        {filteredStudents.map(s => (
                            <div key={s.id} onClick={() => setScannedStudentId(s.id)} className="p-4 bg-white border border-primary/5 rounded-2xl flex items-center justify-between hover:bg-primary/5 cursor-pointer transition-all shadow-sm">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={s.profilePic} />
                                        <AvatarFallback className="bg-muted text-primary font-black text-xs">{s.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-black text-slate-800 text-xs uppercase">{s.name}</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase">{s.id}</p>
                                    </div>
                                </div>
                                <ChevronRight size={14} className="text-primary/20" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        ) : (
            <div className="space-y-10">
                <div className="p-8 rounded-[2.5rem] bg-primary text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                        <CheckCircle2 size={120} />
                    </div>
                    <div className="flex items-center gap-6 relative z-10">
                        <Avatar className="h-24 w-20 rounded-2xl border-4 border-white/20 shadow-xl">
                            <AvatarImage src={scannedStudent.profilePic} />
                            <AvatarFallback className="bg-white/10 text-white font-black text-3xl">{scannedStudent.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <h4 className="text-3xl font-black uppercase tracking-tight leading-none">{scannedStudent.name}</h4>
                            <p className="text-xs font-bold opacity-60 uppercase tracking-widest">{scannedStudent.id} • YEAR {scannedStudent.year}</p>
                        </div>
                    </div>
                    <Button onClick={() => { setScannedStudentId(null); setSelectedCategory(null); }} variant="ghost" className="h-12 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black uppercase text-[10px] tracking-widest gap-2">
                        <RotateCcw size={16} /> Reset Profile
                    </Button>
                </div>

                <div className="space-y-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary"><Activity size={18}/></div>
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-foreground">Select Protocol Category</h4>
                        </div>
                        <select 
                            value={selectedSubjectId} 
                            onChange={e => { setSelectedSubjectId(e.target.value); setSelectedCategory(null); }}
                            className="h-12 bg-slate-50 border-2 border-primary/10 rounded-xl px-6 font-black text-[10px] uppercase shadow-inner outline-none"
                        >
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { id: 'activity', label: 'Activity', icon: ClipboardList, color: 'bg-rose-50 text-rose-600' },
                            { id: 'quiz', label: 'Quiz', icon: ListChecks, color: 'bg-emerald-50 text-emerald-600' },
                            { id: 'performance', label: 'Performance', icon: Zap, color: 'bg-amber-50 text-amber-600' },
                            { id: 'final_output', label: 'Final Output', icon: GraduationCap, color: 'bg-violet-50 text-violet-600' }
                        ].map(cat => (
                            <button 
                                key={cat.id} 
                                onClick={() => setSelectedCategory(cat.id)}
                                className={cn(
                                    "p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 group active:scale-95",
                                    selectedCategory === cat.id ? "bg-primary border-primary text-white shadow-xl" : "bg-white border-slate-100 hover:border-primary/20"
                                )}
                            >
                                <cat.icon size={24} className={cn(selectedCategory === cat.id ? "text-white" : "text-primary")} />
                                <span className="font-black uppercase text-[9px] tracking-widest">{cat.label}</span>
                            </button>
                        ))}
                    </div>

                    {selectedCategory && (
                        <div className="space-y-6 pt-6 border-t border-primary/5 animate-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center justify-between ml-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Unmarked {selectedCategory.replace('_', ' ')} Tasks</Label>
                                <Badge className="bg-primary/5 text-primary border-none font-black text-[8px]">{filteredCategoryTasks.length} ITEMS</Badge>
                            </div>
                            {filteredCategoryTasks.length === 0 ? (
                                <div className="p-12 border-4 border-dashed rounded-[3rem] border-slate-100 bg-slate-50/50 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">No matching tasks found</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredCategoryTasks.map(cw => {
                                        const sub = submissions.find(s => s.classworkId === cw.id && s.studentId === scannedStudentId);
                                        const isExempted = cw.exemptedStudentIds?.includes(scannedStudentId!);
                                        return (
                                            <div key={cw.id} className={cn(
                                                "p-6 bg-white border rounded-[2rem] shadow-lg flex items-center justify-between gap-6 transition-all group",
                                                isExempted ? "border-blue-100 bg-blue-50/5" : "border-slate-100"
                                            )}>
                                                <div className="flex-1 overflow-hidden">
                                                    <h5 className="font-black text-sm uppercase text-slate-800 truncate group-hover:text-primary transition-colors">{cw.title}</h5>
                                                    <p className="text-[9px] font-bold text-muted-foreground mt-2 uppercase tracking-widest">MAX PTS: {cw.totalPoints}</p>
                                                </div>
                                                {isExempted ? (
                                                    <Badge className="bg-blue-600 text-white font-black text-[8px] h-9 px-4 rounded-xl uppercase">Exempted</Badge>
                                                ) : (
                                                    <div className="relative">
                                                        <input 
                                                            type="number"
                                                            placeholder="0"
                                                            defaultValue={sub?.grade || ''}
                                                            onBlur={e => handleManualGrade(scannedStudentId!, cw.id, e.target.value)}
                                                            className="w-20 h-14 bg-slate-50 border-2 border-primary/10 rounded-2xl text-center font-black text-xl text-primary focus:border-primary outline-none transition-all"
                                                        />
                                                        {sub?.status === 'graded' && <CheckCircle2 className="absolute -top-1 -right-1 h-5 w-5 text-green-500 fill-white shadow-sm" />}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-32">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-xl border border-primary/5">
        <div className="flex items-center gap-4">
            <div className={cn("h-3 w-3 rounded-full animate-pulse", isOnline ? "bg-green-500" : "bg-red-500")} />
            <p className="font-black uppercase text-[10px] tracking-widest text-slate-500">
                {isOnline ? 'Authorized Terminal • Online' : 'Offline Protocol Active'}
            </p>
        </div>
        <Badge variant="outline" className="bg-primary/5 text-primary border-none px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest">
            {activeSubject ? `Active: ${activeSubject.name.toUpperCase()}` : 'No Scheduled Session'}
        </Badge>
      </div>

      <Tabs value={scanMode} onValueChange={(v: any) => { setScanMode(v); setScannedStudentId(null); setPendingAttendance(null); }} className="w-full">
        <TabsList className="grid grid-cols-3 bg-white border-2 border-primary/5 h-20 p-2 rounded-[2rem] shadow-2xl">
            <TabsTrigger value="in" className="rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-3">
                <LogIn size={20}/> Entrance
            </TabsTrigger>
            <TabsTrigger value="out" className="rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-3">
                <LogOutIcon size={20}/> Dismissal
            </TabsTrigger>
            <TabsTrigger value="score" className="rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-3">
                <Zap size={20}/> Score
            </TabsTrigger>
        </TabsList>

        <Card className="rounded-[3.5rem] border-none shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden bg-white mt-8">
            <div className="h-3 bg-primary" />
            <CardContent className="p-10 md:p-14 space-y-12">
                <div className="text-center">
                    <h3 className="text-[3.5rem] font-black text-primary uppercase tracking-tighter leading-none">CAPTURE ACTIVE</h3>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.4em] mt-3">Universal Signal Processor v2.0</p>
                </div>

                <TabsContent value="in" className="m-0 space-y-12">
                    {renderInMode()}
                </TabsContent>

                <TabsContent value="out" className="m-0 space-y-12">
                    {renderOutMode()}
                </TabsContent>

                <TabsContent value="score" className="m-0">
                    {renderScoreManagement()}
                </TabsContent>
            </CardContent>
        </Card>
      </Tabs>

      {pcSelection && (
          <SelectPCDialog 
            labId={pcSelection.labId} 
            studentName={pcSelection.student.name} 
            subjectName={pcSelection.subject.name} 
            onClose={() => setPcSelection(null)} 
            onSubmit={async (pcId) => {
                await addAttendanceAction({
                    studentId: pcSelection.student.id,
                    subjectId: pcSelection.subject.id,
                    date: new Date().toISOString(),
                    status: pcSelection.status || 'present',
                    timeIn: new Date().toLocaleTimeString('en-US', { hour12: false }),
                    pcId
                });
                setPcSelection(null);
                toast.success(`Marked as ${pcSelection.status.toUpperCase()} & PC Assigned`);
                loadData();
            }}
          />
      )}
    </div>
  );
}

