'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import {
  getSubjectsAction,
  getGradingWeightsAction,
  updateGradingWeightsAction,
  getEnrollmentsAction,
  getUsersAction,
  getAttendancesAction,
  getClassworksAction,
  getSubmissionsAction
} from '@/app/actions/dbActions';

import {
  Subject,
  GradingWeights,
  Attendance,
  Classwork,
  Submission,
  User
} from '@/utils/storage';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import {
  Loader2,
  Save,
  Download,
  AlertCircle,
  FileSpreadsheet,
  Table as TableIcon,
  XCircle
} from 'lucide-react';

import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function GradingSetup() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [weights, setWeights] = useState<GradingWeights | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [classworks, setClassworks] = useState<Classwork[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [allSubjects, allWeights] = await Promise.all([
        getSubjectsAction(),
        getGradingWeightsAction()
      ]);
      const teacherSubjects = allSubjects.filter(s => s.teacherId === user.id);
      setSubjects(teacherSubjects);
      if (teacherSubjects.length > 0) {
        handleSelectSubject(teacherSubjects[0], allWeights);
      }
    } catch (e) {
      toast.error("Failed to load grading settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSubject = async (subject: Subject, allWeights?: GradingWeights[]) => {
    setSelectedSubject(subject);
    const weightsList = allWeights || await getGradingWeightsAction();
    const found = weightsList.find(w => w.subjectId === subject.id);
    const activeWeights = found || {
      subjectId: subject.id,
      attendance: 15,
      activities: 20,
      quizzes: 20,
      performance: 25,
      finalOutput: 20,
      lateMultiplier: 50,
      absentMultiplier: 0
    };
    setWeights(activeWeights);
    loadStudentsPerformance(subject.id, activeWeights);
  };

  const loadStudentsPerformance = async (subjectId: string, activeWeights: GradingWeights) => {
    const [enrollments, users, attendances, allClassworks, allSubmissions] = await Promise.all([
      getEnrollmentsAction(),
      getUsersAction(),
      getAttendancesAction(),
      getClassworksAction(),
      getSubmissionsAction()
    ]);

    const enrolledIds = enrollments
      .filter(e => e.subjectId === subjectId && e.status === 'approved')
      .map(e => e.studentId);

    const enrolledStudents = users.filter(u => enrolledIds.includes(u.id));
    const subjectClassworks = allClassworks.filter(cw => cw.subjectId === subjectId && cw.status === 'published');
    const subjectAttendances = attendances.filter(a => a.subjectId === subjectId);
    
    setClassworks(subjectClassworks);
    setSubmissions(allSubmissions);

    const uniqueDays = Array.from(new Set(subjectAttendances.map(a => a.date.split('T')[0])));
    const totalClassMeetings = uniqueDays.length;

    const results = enrolledStudents.map(student => {
      const studentAttendances = attendances.filter(a => a.studentId === student.id && a.subjectId === subjectId);
      const studentSubmissions = allSubmissions.filter(s => s.studentId === student.id);

      const lateVal = activeWeights.lateMultiplier ?? 50;
      const absentVal = activeWeights.absentMultiplier ?? 0;
      
      let attPoints = 0;
      if (totalClassMeetings > 0) {
          uniqueDays.forEach(dayStr => {
              const recordsForDay = studentAttendances.filter(a => a.date.startsWith(dayStr));
              if (recordsForDay.length > 0) {
                  const hasPresent = recordsForDay.some(r => r.status === 'present');
                  const hasLate = recordsForDay.some(r => r.status === 'late');
                  if (hasPresent) attPoints += 1;
                  else if (hasLate) attPoints += (lateVal / 100);
                  else attPoints += (absentVal / 100);
              } else {
                  attPoints += (absentVal / 100);
              }
          });
      }

      const attendanceScore = totalClassMeetings > 0 
          ? Math.min((attPoints / totalClassMeetings) * 100, 100)
          : 100; // AMA Protocol: 100% if no meetings yet

      const computeAverage = (type: string) => {
        const tasks = subjectClassworks.filter(cw => cw.type === type);
        if (tasks.length === 0) return 100; // AMA protocol: Default to 100% if no tasks assigned yet
        
        let totalEarned = 0, totalPossible = 0;
        tasks.forEach(task => {
          const isExempted = task.exemptedStudentIds?.includes(student.id);
          const maxPoints = task.totalPoints || 100;
          if (isExempted) {
            totalEarned += maxPoints;
          } else {
            const sub = studentSubmissions.find(s => s.classworkId === task.id);
            const score = sub?.grade !== undefined ? Math.min(sub.grade, maxPoints) : 0;
            totalEarned += score;
          }
          totalPossible += maxPoints;
        });
        
        return totalPossible > 0 ? Math.min((totalEarned / totalPossible) * 100, 100) : 0;
      };

      return {
        ...student,
        attendanceScore,
        activityScore: computeAverage('activity'),
        quizScore: computeAverage('quiz'),
        performanceScore: computeAverage('performance'),
        finalOutputScore: computeAverage('final_output')
      };
    });

    setStudents(results);
  };

  const handleSaveWeights = async () => {
    if (!weights) return;
    const total = (weights.attendance || 0) + (weights.activities || 0) + (weights.quizzes || 0) + (weights.performance || 0) + (weights.finalOutput || 0);
    if (total !== 100) {
      toast.error(`Invalid total (${total}%). Categories must equal 100%.`);
      return;
    }
    setIsSaving(true);
    try {
      await updateGradingWeightsAction(weights);
      toast.success("Grading system deployed");
      if (selectedSubject) loadStudentsPerformance(selectedSubject.id, weights);
    } catch (e) {
      toast.error("Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const computeFinalGrade = (student: any) => {
    if (!weights) return 0;
    
    // Running Weighted Average Logic:
    // Only count categories that have at least one task or meeting.
    // Scale weights relative to the assigned components.
    
    let weightedSum = 0;
    let totalWeightUsed = 0;

    const components = [
      { score: student.attendanceScore, weight: weights.attendance, type: 'attendance' },
      { score: student.activityScore, weight: weights.activities, type: 'activity' },
      { score: student.quizScore, weight: weights.quizzes, type: 'quiz' },
      { score: student.performanceScore, weight: weights.performance, type: 'performance' },
      { score: student.finalOutputScore, weight: weights.finalOutput, type: 'final_output' }
    ];

    components.forEach(comp => {
      // For attendance, it always counts if term is active.
      // For others, only count if score is not null (meaning tasks exist).
      if (comp.score !== null) {
        weightedSum += (comp.score * (comp.weight / 100));
        totalWeightUsed += comp.weight;
      }
    });

    if (totalWeightUsed === 0) return 100; // Default for fresh subjects

    // Normalizing result to 100% scale
    const finalPercentage = (weightedSum / totalWeightUsed) * 100;
    return Math.min(Number(finalPercentage.toFixed(2)), 100);
  };

  const getGradeScale = (score: number) => {
    if (score >= 97) return '1.00';
    if (score >= 94) return '1.25';
    if (score >= 91) return '1.50';
    if (score >= 88) return '1.75';
    if (score >= 85) return '2.00';
    if (score >= 82) return '2.25';
    if (score >= 79) return '2.50';
    if (score >= 76) return '2.75';
    if (score >= 75) return '3.00';
    return '5.00';
  };

  const exportECR = () => {
    if (!selectedSubject || !students.length) return;
    
    const activities = classworks.filter(cw => cw.type === 'activity');
    const quizzes = classworks.filter(cw => cw.type === 'quiz');
    const perfs = classworks.filter(cw => cw.type === 'performance');
    const finals = classworks.filter(cw => cw.type === 'final_output');
    
    const headers = [
      'NAME', 'USN', 'EMAIL', 'COURSE/PROGRAM',
      ...activities.map((_, i) => `ACT ${i + 1}`), 'ACT AVG', `${weights?.activities}%`,
      ...quizzes.map((_, i) => `QUIZ ${i + 1}`), 'QUIZ AVG', `${weights?.quizzes}%`,
      ...perfs.map((_, i) => `PERF ${i + 1}`), 'PERF AVG', `${weights?.performance}%`,
      ...finals.map((_, i) => `FINAL ${i + 1}`), 'FINAL AVG', `${weights?.finalOutput}%`,
      'ATTENDANCE', 'FINAL RATING', 'SCALE'
    ];

    const rows = students.map(student => {
      const studentSubmissions = submissions.filter(s => s.studentId === student.id);
      
      const getScores = (taskList: Classwork[]) => taskList.map(cw => {
        if (cw.exemptedStudentIds?.includes(student.id)) return cw.totalPoints;
        const sub = studentSubmissions.find(s => s.classworkId === cw.id);
        return sub?.grade !== undefined ? Math.min(sub.grade, cw.totalPoints || 100) : 0;
      });

      const finalScore = computeFinalGrade(student);

      return [
        student.name, student.id, student.email, student.program || student.strand || 'N/A',
        ...getScores(activities), (student.activityScore || 0).toFixed(2), (student.activityScore ? student.activityScore * (weights?.activities || 0) / 100 : 0).toFixed(2),
        ...getScores(quizzes), (student.quizScore || 0).toFixed(2), (student.quizScore ? student.quizScore * (weights?.quizzes || 0) / 100 : 0).toFixed(2),
        ...getScores(perfs), (student.performanceScore || 0).toFixed(2), (student.performanceScore ? student.performanceScore * (weights?.performance || 0) / 100 : 0).toFixed(2),
        ...getScores(finals), (student.finalOutputScore || 0).toFixed(2), (student.finalOutputScore ? student.finalOutputScore * (weights?.finalOutput || 0) / 100 : 0).toFixed(2),
        student.attendanceScore.toFixed(2), finalScore, getGradeScale(finalScore)
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ECR_${selectedSubject.name}_${new Date().getFullYear()}.csv`;
    link.click();
  };

  useEffect(() => { loadData(); }, [user]);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-primary uppercase tracking-tighter leading-none">Grading Console</h1>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-2">Evaluation & Weight Configuration</p>
        </div>
        <div className="w-full md:w-80">
          <Select value={selectedSubject?.id} onValueChange={v => handleSelectSubject(subjects.find(s => s.id === v)!)}>
            <SelectTrigger className="h-14 rounded-2xl border-primary/10 shadow-sm font-bold text-sm"><SelectValue placeholder="Select Course Load" /></SelectTrigger>
            <SelectContent className="rounded-2xl">{subjects.map(s => <SelectItem key={s.id} value={s.id} className="font-bold">{s.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="weights" className="w-full">
        <TabsList className="bg-white border-2 border-primary/5 h-14 p-1.5 rounded-full mb-8 inline-flex">
          <TabsTrigger value="weights" className="rounded-full font-black uppercase text-[10px] tracking-widest px-8 data-[state=active]:bg-primary data-[state=active]:text-white">Weight Distribution</TabsTrigger>
          <TabsTrigger value="performance" className="rounded-full font-black uppercase text-[10px] tracking-widest px-8 data-[state=active]:bg-primary data-[state=active]:text-white">Live Ledger</TabsTrigger>
          <TabsTrigger value="ecr" className="rounded-full font-black uppercase text-[10px] tracking-widest px-8 data-[state=active]:bg-primary data-[state=active]:text-white">Electronic Class Record</TabsTrigger>
        </TabsList>

        <TabsContent value="weights" className="mt-0">
          <Card className="rounded-[3rem] border-none shadow-2xl overflow-hidden bg-white">
            <div className="h-3 bg-primary" />
            <CardHeader className="p-10 pb-6">
              <CardTitle className="text-2xl font-black uppercase tracking-tight">WEIGHT CONFIGURATION</CardTitle>
              <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Define grading system for {selectedSubject?.name}</CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-0 space-y-12">
              {weights && (
                <div className="space-y-10">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Attendance</Label>
                      <Input type="number" value={weights.attendance ?? ''} onChange={e => setWeights({ ...weights, attendance: parseInt(e.target.value) || 0 } as any)} className="h-14 rounded-2xl border-primary/10 font-black text-xl text-center bg-primary/[0.02]" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Activities</Label>
                      <Input type="number" value={weights.activities ?? ''} onChange={e => setWeights({ ...weights, activities: parseInt(e.target.value) || 0 } as any)} className="h-14 rounded-2xl border-primary/10 font-black text-xl text-center bg-primary/[0.02]" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Quizzes</Label>
                      <Input type="number" value={weights.quizzes ?? ''} onChange={e => setWeights({ ...weights, quizzes: parseInt(e.target.value) || 0 } as any)} className="h-14 rounded-2xl border-primary/10 font-black text-xl text-center bg-primary/[0.02]" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Performance</Label>
                      <Input type="number" value={weights.performance ?? ''} onChange={e => setWeights({ ...weights, performance: parseInt(e.target.value) || 0 } as any)} className="h-14 rounded-2xl border-primary/10 font-black text-xl text-center bg-primary/[0.02]" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">FinalOutput</Label>
                      <Input type="number" value={weights.finalOutput ?? ''} onChange={e => setWeights({ ...weights, finalOutput: parseInt(e.target.value) || 0 } as any)} className="h-14 rounded-2xl border-primary/10 font-black text-xl text-center bg-primary/[0.02]" />
                    </div>
                  </div>

                  <div className="p-8 bg-muted/20 rounded-[2.5rem] border-2 border-primary/5 space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><AlertCircle size={18} /></div>
                      <h3 className="font-black text-sm uppercase tracking-widest text-foreground">Attendance Policy Rules</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">LATE MULTIPLIER (%)</Label>
                        <div className="flex items-center gap-4">
                          <Input type="number" min="0" max="100" value={weights.lateMultiplier ?? ''} onChange={e => setWeights({ ...weights, lateMultiplier: parseInt(e.target.value) || 0 } as any)} className="h-12 w-24 rounded-xl border-primary/10 font-bold text-center" />
                          <p className="text-xs font-medium text-muted-foreground leading-relaxed">Student gets <span className="font-black text-primary">{weights.lateMultiplier ?? 0}%</span> credit for "Late" marks.</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">ABSENT MULTIPLIER (%)</Label>
                        <div className="flex items-center gap-4">
                          <Input type="number" min="0" max="100" value={weights.absentMultiplier ?? ''} onChange={e => setWeights({ ...weights, absentMultiplier: parseInt(e.target.value) || 0 } as any)} className="h-12 w-24 rounded-xl border-primary/10 font-bold text-center" />
                          <p className="text-xs font-medium text-muted-foreground leading-relaxed">Student gets <span className="font-black text-primary">{weights.absentMultiplier ?? 0}%</span> credit for "Absent" marks.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-end pt-6">
                <Button onClick={handleSaveWeights} disabled={isSaving} className="h-16 px-12 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-primary/20 transition-all active:scale-95 gap-3">
                  {isSaving ? <Loader2 className="animate-spin h-5 w-5" /> : <Save size={20} />}
                  Deploy Protocol
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-0">
          <Card className="rounded-[3rem] border-none shadow-2xl overflow-hidden bg-white">
            <div className="h-3 bg-primary" />
            <CardHeader className="p-10 flex flex-row justify-between items-center border-b border-primary/5">
              <div>
                <CardTitle className="text-2xl font-black uppercase tracking-tight text-primary">Live Grade Ledger</CardTitle>
                <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Automated computation based on active weights</CardDescription>
              </div>
              <Button variant="outline" onClick={() => window.print()} className="rounded-full h-12 px-6 font-black uppercase text-[10px] tracking-widest gap-2 border-primary/10"><Download size={16} />Export Ledger</Button>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto no-scrollbar">
              <table className="w-full">
                <thead>
                  <tr className="bg-primary/5 border-b border-primary/5">
                    <th className="py-6 px-10 text-left font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Identified Student</th>
                    <th className="py-6 text-center font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Attendance</th>
                    <th className="py-6 text-center font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Activities</th>
                    <th className="py-6 text-center font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Quiz</th>
                    <th className="py-6 text-center font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Performance</th>
                    <th className="py-6 text-center font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">FinalOutput</th>
                    <th className="py-6 px-10 text-right font-black uppercase text-[10px] tracking-[0.2em] text-primary">Final Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {students.map(student => {
                    const total = computeFinalGrade(student);
                    return (
                      <tr key={student.id} className="hover:bg-primary/[0.02] transition-colors">
                        <td className="py-6 px-10">
                          <div className="font-black text-foreground uppercase tracking-tight">{student.name}</div>
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{student.id}</div>
                        </td>
                        <td className="text-center font-bold text-slate-600">{(student.attendanceScore || 0).toFixed(0)}%</td>
                        <td className="text-center font-bold text-slate-600">{(student.activityScore || 0).toFixed(0)}%</td>
                        <td className="text-center font-bold text-slate-600">{(student.quizScore || 0).toFixed(0)}%</td>
                        <td className="text-center font-bold text-slate-600">{(student.performanceScore || 0).toFixed(0)}%</td>
                        <td className="text-center font-bold text-slate-600">{(student.finalOutputScore || 0).toFixed(0)}%</td>
                        <td className="py-6 px-10 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-2xl font-black text-primary tracking-tighter">{total.toFixed(2)}%</span>
                            <span className="text-sm font-black text-accent">{getGradeScale(total)}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ecr" className="mt-0">
          <Card className="rounded-[2rem] border-none shadow-2xl overflow-hidden bg-white">
            <div className="bg-[#6D1B0A] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left space-y-1">
                <h3 className="text-2xl font-black uppercase tracking-tighter">ELECTRONIC CLASS RECORD</h3>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-70">Official Faculty Matrix • {selectedSubject?.name}</p>
              </div>
              <Button onClick={exportECR} className="h-12 px-8 rounded-xl bg-white text-[#6D1B0A] hover:bg-white/90 font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl">
                <FileSpreadsheet size={18} /> Export Electronic Record
              </Button>
            </div>
            
            <CardContent className="p-0 overflow-x-auto no-scrollbar">
              <table className="w-full border-collapse border-slate-200">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    <th className="py-4 px-6 text-left border-r border-slate-200 sticky left-0 bg-slate-50 z-10 min-w-[250px]">Student Identity</th>
                    <th className="py-4 px-4 text-center border-r border-slate-200 min-w-[150px]">Program</th>
                    
                    {/* CATEGORY GROUPS */}
                    <th className="bg-rose-50/50 py-4 px-4 text-center border-r border-slate-200" colSpan={classworks.filter(cw => cw.type === 'activity').length + 2}>ACTIVITIES ({weights?.activities}%)</th>
                    <th className="bg-emerald-50/50 py-4 px-4 text-center border-r border-slate-200" colSpan={classworks.filter(cw => cw.type === 'quiz').length + 2}>QUIZZES ({weights?.quizzes}%)</th>
                    <th className="bg-amber-50/50 py-4 px-4 text-center border-r border-slate-200" colSpan={classworks.filter(cw => cw.type === 'performance').length + 2}>PERFORMANCE ({weights?.performance}%)</th>
                    <th className="bg-violet-50/50 py-4 px-4 text-center border-r border-slate-200" colSpan={classworks.filter(cw => cw.type === 'final_output').length + 2}>FINAL OUTPUT ({weights?.finalOutput}%)</th>
                    
                    <th className="bg-sky-50/50 py-4 px-4 text-center border-r border-slate-200">ATTENDANCE</th>
                    <th className="py-4 px-6 text-right bg-slate-100 min-w-[120px]">FINAL GRADE</th>
                  </tr>
                  <tr className="bg-white border-b border-slate-200 text-[8px] font-black uppercase tracking-tighter text-slate-400">
                    <th className="py-3 px-6 text-left border-r border-slate-200 sticky left-0 bg-white z-10">Name / USN</th>
                    <th className="py-3 px-4 text-center border-r border-slate-200">Details</th>
                    
                    {/* ACTIVITIES */}
                    {classworks.filter(cw => cw.type === 'activity').map((cw, i) => (
                      <th key={cw.id} className="py-3 px-2 text-center border-r border-slate-100 bg-rose-50/20" title={cw.title}>Act {i+1}</th>
                    ))}
                    <th className="py-3 px-2 text-center border-r border-slate-100 bg-rose-100/30 text-rose-700">AVG</th>
                    <th className="py-3 px-2 text-center border-r border-slate-200 bg-rose-200/30 text-rose-900">NET</th>

                    {/* QUIZZES */}
                    {classworks.filter(cw => cw.type === 'quiz').map((cw, i) => (
                      <th key={cw.id} className="py-3 px-2 text-center border-r border-slate-100 bg-emerald-50/20" title={cw.title}>Qz {i+1}</th>
                    ))}
                    <th className="py-3 px-2 text-center border-r border-slate-100 bg-emerald-100/30 text-emerald-700">AVG</th>
                    <th className="py-3 px-2 text-center border-r border-slate-200 bg-emerald-200/30 text-emerald-900">NET</th>

                    {/* PERFORMANCE */}
                    {classworks.filter(cw => cw.type === 'performance').map((cw, i) => (
                      <th key={cw.id} className="py-3 px-2 text-center border-r border-slate-100 bg-amber-50/20" title={cw.title}>Prf {i+1}</th>
                    ))}
                    <th className="py-3 px-2 text-center border-r border-slate-100 bg-amber-100/30 text-amber-700">AVG</th>
                    <th className="py-3 px-2 text-center border-r border-slate-200 bg-amber-200/30 text-amber-900">NET</th>

                    {/* FINAL OUTPUT */}
                    {classworks.filter(cw => cw.type === 'final_output').map((cw, i) => (
                      <th key={cw.id} className="py-3 px-2 text-center border-r border-slate-100 bg-violet-50/20" title={cw.title}>Fin {i+1}</th>
                    ))}
                    <th className="py-3 px-2 text-center border-r border-slate-100 bg-violet-100/30 text-violet-700">AVG</th>
                    <th className="py-3 px-2 text-center border-r border-slate-200 bg-violet-200/30 text-violet-800">NET</th>

                    <th className="py-3 px-2 text-center border-r border-slate-200 bg-sky-50/30">SCORE</th>
                    <th className="py-3 px-6 text-right bg-slate-50">SCORE / SCALE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map(student => {
                    const studentSubmissions = submissions.filter(s => s.studentId === student.id);
                    
                    const renderCategoryData = (type: string, themeColor: string, weight: number) => {
                      const tasks = classworks.filter(cw => cw.type === type);
                      const rawAvg = student[`${type === 'final_output' ? 'finalOutput' : type}Score`];
                      const netScore = rawAvg !== null ? (rawAvg * weight / 100) : 0;
                      
                      return (
                        <>
                          {tasks.map(cw => {
                            const isExempted = cw.exemptedStudentIds?.includes(student.id);
                            const sub = studentSubmissions.find(s => s.classworkId === cw.id);
                            const score = isExempted ? (cw.totalPoints || 100) : (sub?.grade !== undefined ? Math.min(sub.grade, cw.totalPoints || 100) : 0);
                            return (
                              <td key={cw.id} className="py-4 px-2 text-center border-r border-slate-100 text-[10px] font-black tabular-nums text-slate-600">
                                {score}
                              </td>
                            );
                          })}
                          <td className={cn("py-4 px-2 text-center border-r border-slate-100 font-black text-[10px]", `text-${themeColor}-700 bg-${themeColor}-50/30`)}>
                            {rawAvg !== null ? rawAvg.toFixed(0) : '0'}
                          </td>
                          <td className={cn("py-4 px-2 text-center border-r border-slate-200 font-black text-[10px]", `text-${themeColor}-900 bg-${themeColor}-100/30`)}>
                            {netScore.toFixed(1)}
                          </td>
                        </>
                      );
                    };

                    const finalScore = computeFinalGrade(student);

                    return (
                      <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="py-4 px-6 border-r border-slate-100 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                          <p className="font-black text-xs uppercase truncate">{student.name}</p>
                          <p className="text-[8px] font-bold text-slate-400 mt-0.5">{student.id}</p>
                        </td>
                        <td className="py-4 px-4 text-center border-r border-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                          {student.program || student.strand || 'N/A'}
                        </td>

                        {renderCategoryData('activity', 'rose', weights?.activities || 0)}
                        {renderCategoryData('quiz', 'emerald', weights?.quizzes || 0)}
                        {renderCategoryData('performance', 'amber', weights?.performance || 0)}
                        {renderCategoryData('final_output', 'violet', weights?.finalOutput || 0)}

                        <td className="py-4 px-2 text-center border-r border-slate-200 bg-sky-50/30 font-black text-sky-700 text-[10px]">{student.attendanceScore.toFixed(0)}</td>
                        
                        <td className="py-4 px-6 text-right bg-slate-50">
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-black text-slate-900 leading-none">{finalScore.toFixed(2)}%</span>
                            <span className="text-[9px] font-black text-accent mt-1">{getGradeScale(finalScore)}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
