'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { 
    getSubjectsAction, 
    getEnrollmentsAction, 
    getGradingWeightsAction, 
    getAttendancesAction, 
    getClassworksAction, 
    getSubmissionsAction,
    getTermsAction
} from '@/app/actions/dbActions';
import { 
    Subject, 
    GradingWeights, 
    Term
} from '@/utils/storage';
import { 
    Loader2, 
    GraduationCap,
    Printer, 
    ShieldCheck, 
    User as UserIcon,
    Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CategoryData {
    scores: number[];
    avg: number | null; // null if no tasks
    net: number;
}

interface SubjectRecord {
    subject: Subject;
    weights: GradingWeights;
    activities: CategoryData;
    quizzes: CategoryData;
    performance: CategoryData;
    finalOutput: CategoryData;
    attendance: { avg: number; net: number };
    finalPercentage: number;
    numericalGrade: string;
}

const getGradeScale = (score: number): string => {
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

const getGradeStatus = (grade: string): { label: string; color: string } => {
    const num = parseFloat(grade);
    if (num <= 1.50) return { label: 'Excellent', color: 'text-emerald-600' };
    if (num <= 2.00) return { label: 'Very Good', color: 'text-green-600' };
    if (num <= 2.50) return { label: 'Good', color: 'text-blue-600' };
    if (num <= 3.00) return { label: 'Passed', color: 'text-amber-600' };
    return { label: 'Failed', color: 'text-red-600' };
};

export default function LiveGradeLedger() {
    const { user } = useAuth();
    const [records, setRecords] = useState<SubjectRecord[]>([]);
    const [activeTerms, setActiveTerms] = useState<Term[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            setLoading(true);
            
            try {
                const [
                    allSubjects, 
                    allEnrollments, 
                    allWeights, 
                    allAttendances, 
                    allClassworks, 
                    allSubmissions,
                    allTerms
                ] = await Promise.all([
                    getSubjectsAction(),
                    getEnrollmentsAction(),
                    getGradingWeightsAction(),
                    getAttendancesAction(),
                    getClassworksAction(),
                    getSubmissionsAction(),
                    getTermsAction()
                ]);

                const active = allTerms.filter(t => t.status === 'active');
                setActiveTerms(active);

                const myEnrollments = allEnrollments.filter(
                    e => e.studentId === user.id && e.status === 'approved'
                );
                const mySubjectIds = myEnrollments.map(e => e.subjectId);
                const mySubjects = allSubjects.filter(s => mySubjectIds.includes(s.id));

                const results: SubjectRecord[] = mySubjects.map(subject => {
                    const weights = allWeights.find(w => w.subjectId === subject.id) || {
                        subjectId: subject.id,
                        attendance: 15,
                        activities: 15,
                        quizzes: 15,
                        performance: 25,
                        finalOutput: 30,
                        lateMultiplier: 50,
                        absentMultiplier: 0
                    };

                    const subjectCW = allClassworks.filter(
                        cw => cw.subjectId === subject.id && cw.status === 'published'
                    );
                    const mySubs = allSubmissions.filter(s => s.studentId === user.id);

                    const getCategoryData = (
                        type: string, 
                        weight: number
                    ): CategoryData => {
                        const tasks = subjectCW.filter(cw => cw.type === type);
                        if (tasks.length === 0) return { scores: [], avg: 100, net: weight };
                        
                        const scores: number[] = [];
                        let totalEarned = 0;
                        let totalPossible = 0;

                        tasks.forEach(task => {
                            const isExempted = task.exemptedStudentIds?.includes(user.id);
                            const score = isExempted 
                                ? (task.totalPoints || 100)
                                : (mySubs.find(s => s.classworkId === task.id)?.grade || 0);
                            
                            const cappedScore = Math.min(score, task.totalPoints || 100);
                            scores.push(cappedScore);
                            totalEarned += cappedScore;
                            totalPossible += task.totalPoints || 100;
                        });

                        const avg = totalPossible > 0 ? Math.min((totalEarned / totalPossible) * 100, 100) : 0;
                        const net = avg * (weight / 100);
                        return { scores, avg, net };
                    };

                    const subjectAtts = allAttendances.filter(a => a.subjectId === subject.id);
                    const myAtts = subjectAtts.filter(a => a.studentId === user.id);
                    const uniqueDays = Array.from(
                        new Set(subjectAtts.map(a => a.date.split('T')[0]))
                    );
                    const totalMeetings = uniqueDays.length;
                    
                    const lateVal = weights.lateMultiplier ?? 50;
                    const absentVal = weights.absentMultiplier ?? 0;
                    
                    let attPoints = 0;
                    if (totalMeetings > 0) {
                        uniqueDays.forEach(dayStr => {
                            const recordsForDay = myAtts.filter(a => a.date.startsWith(dayStr));
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
                    
                    const attAvg = totalMeetings > 0 
                        ? Math.min((attPoints / totalMeetings) * 100, 100)
                        : 100; // AMA Protocol: 100% if no meetings yet

                    const attNet = attAvg * (weights.attendance / 100);

                    const act = getCategoryData('activity', weights.activities);
                    const qz = getCategoryData('quiz', weights.quizzes);
                    const prf = getCategoryData('performance', weights.performance);
                    const fo = getCategoryData('final_output', weights.finalOutput);

                    // Running Weighted Average Logic:
                    let runningWeightedSum = 0;
                    let totalWeightUsed = 0;

                    const activeComps = [
                        { score: attAvg, weight: weights.attendance },
                        { score: act.avg, weight: weights.activities },
                        { score: qz.avg, weight: weights.quizzes },
                        { score: prf.avg, weight: weights.performance },
                        { score: fo.avg, weight: weights.finalOutput }
                    ];

                    activeComps.forEach(comp => {
                        if (comp.score !== null) {
                            runningWeightedSum += (comp.score * (comp.weight / 100));
                            totalWeightUsed += comp.weight;
                        }
                    });

                    const rawFinalPercentage = totalWeightUsed > 0 ? (runningWeightedSum / totalWeightUsed) * 100 : 100;
                    const finalPercentage = Math.min(rawFinalPercentage, 100);

                    return {
                        subject,
                        weights,
                        activities: act,
                        quizzes: qz,
                        performance: prf,
                        finalOutput: fo,
                        attendance: { avg: attAvg, net: attNet },
                        finalPercentage: Number(finalPercentage.toFixed(2)),
                        numericalGrade: getGradeScale(finalPercentage)
                    };
                });

                setRecords(results);
            } catch (error) {
                console.error('Error loading grade data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user?.id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="animate-spin text-primary h-12 w-12" />
                <p className="text-muted-foreground font-semibold uppercase text-xs tracking-widest">
                    Loading Academic Records...
                </p>
            </div>
        );
    }

    const defaultWeights = records[0]?.weights || {
        activities: 15,
        quizzes: 15,
        performance: 25,
        finalOutput: 30,
        attendance: 15
    };

    const gwa = records.length > 0 
        ? (records.reduce((sum, r) => sum + parseFloat(r.numericalGrade), 0) / records.length).toFixed(2)
        : '0.00';

    const maxAct = Math.max(...records.map(r => r.activities.scores.length), 0);
    const maxQz = Math.max(...records.map(r => r.quizzes.scores.length), 0);
    const maxPrf = Math.max(...records.map(r => r.performance.scores.length), 0);
    const maxFo = Math.max(...records.map(r => r.finalOutput.scores.length), 0);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4 md:p-8 pb-20 print:bg-white print:p-0">
            <div className="max-w-[1600px] mx-auto space-y-6">
                <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden print:border print:rounded-none print:shadow-none">
                    <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-8 py-4 print:bg-slate-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center">
                                    <GraduationCap className="h-8 w-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-white font-bold text-lg tracking-wide">
                                        ACADEMIC RECORDS OFFICE
                                    </h1>
                                    <p className="text-slate-300 text-xs tracking-widest uppercase">
                                        Official Grade Report • {activeTerms[0]?.name || 'Current Term'}
                                    </p>
                                </div>
                            </div>
                            <Button 
                                onClick={() => window.print()}
                                variant="secondary"
                                size="sm"
                                className="gap-2 print:hidden"
                            >
                                <Printer size={14} />
                                Print
                            </Button>
                        </div>
                    </div>

                    <div className="p-6 md:p-8 border-b border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            <div className="md:col-span-5 flex items-center gap-5">
                                <div className="h-20 w-20 rounded-xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                    {user?.profilePic ? (
                                        <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon size={36} className="text-slate-300" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                        Student Name
                                    </p>
                                    <h2 className="text-xl font-bold text-slate-900 mt-0.5">{user?.name}</h2>
                                    <p className="text-sm text-slate-500 mt-1">{user?.id}</p>
                                </div>
                            </div>

                            <div className="md:col-span-4 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Program</p>
                                    <p className="text-sm font-semibold text-slate-700 mt-1">{user?.program || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Year Level</p>
                                    <p className="text-sm font-semibold text-slate-700 mt-1">Year {user?.year}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Subjects Enrolled</p>
                                    <p className="text-sm font-semibold text-slate-700 mt-1">{records.length} Subject{records.length !== 1 ? 's' : ''}</p>
                                </div>
                            </div>

                            <div className="md:col-span-3 flex items-center justify-center">
                                <div className="text-center px-6 py-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/70">
                                        General Weighted Average
                                    </p>
                                    <p className="text-3xl font-bold text-primary mt-1">{gwa}</p>
                                    <p className={cn("text-xs font-semibold mt-1", getGradeStatus(gwa).color)}>
                                        {getGradeStatus(gwa).label}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse min-w-[1200px]">
                            <thead>
                                <tr className="bg-slate-800 text-white">
                                    <th rowSpan={2} className="py-3 px-4 text-left text-[10px] font-bold uppercase tracking-wider border-r border-slate-700 min-w-[200px]">Subject</th>
                                    <th colSpan={maxAct + 2} className="py-2 px-2 text-center text-[10px] font-bold uppercase tracking-wider border-r border-slate-700 bg-rose-600/90">Activities ({defaultWeights.activities}%)</th>
                                    <th colSpan={maxQz + 2} className="py-2 px-2 text-center text-[10px] font-bold uppercase tracking-wider border-r border-slate-700 bg-emerald-600/90">Quizzes ({defaultWeights.quizzes}%)</th>
                                    <th colSpan={maxPrf + 2} className="py-2 px-2 text-center text-[10px] font-bold uppercase tracking-wider border-r border-slate-700 bg-amber-600/90">Performance ({defaultWeights.performance}%)</th>
                                    <th colSpan={maxFo + 2} className="py-2 px-2 text-center text-[10px] font-bold uppercase tracking-wider border-r border-slate-700 bg-violet-600/90">Final Output ({defaultWeights.finalOutput}%)</th>
                                    <th colSpan={2} className="py-2 px-2 text-center text-[10px] font-bold uppercase tracking-wider border-r border-slate-700 bg-sky-600/90">Attendance ({defaultWeights.attendance}%)</th>
                                    <th rowSpan={2} className="py-3 px-4 text-center text-[10px] font-bold uppercase tracking-wider bg-slate-900 border-l border-slate-700 min-w-[120px]">Final Grade</th>
                                </tr>
                                <tr className="bg-slate-100 text-[9px] font-bold uppercase tracking-wide text-slate-600">
                                    {Array.from({ length: maxAct }).map((_, i) => (<th key={i} className="py-2 px-2 text-center border-r border-slate-200 bg-rose-50">A{i+1}</th>))}
                                    <th className="py-2 px-2 text-center border-r border-slate-200 bg-rose-100 text-rose-700">AVG</th>
                                    <th className="py-2 px-2 text-center border-r border-slate-300 bg-rose-200 text-rose-800">NET</th>
                                    {Array.from({ length: maxQz }).map((_, i) => (<th key={i} className="py-2 px-2 text-center border-r border-slate-200 bg-emerald-50">Q{i+1}</th>))}
                                    <th className="py-2 px-2 text-center border-r border-slate-200 bg-emerald-100 text-emerald-700">AVG</th>
                                    <th className="py-2 px-2 text-center border-r border-slate-300 bg-emerald-200 text-emerald-900">NET</th>
                                    {Array.from({ length: maxPrf }).map((_, i) => (<th key={i} className="py-2 px-2 text-center border-r border-slate-200 bg-amber-50">P{i+1}</th>))}
                                    <th className="py-2 px-2 text-center border-r border-slate-200 bg-amber-100 text-amber-700">AVG</th>
                                    <th className="py-2 px-2 text-center border-r border-slate-300 bg-amber-200 text-amber-800">NET</th>
                                    {Array.from({ length: maxFo }).map((_, i) => (<th key={i} className="py-2 px-2 text-center border-r border-slate-200 bg-violet-50">F{i+1}</th>))}
                                    <th className="py-2 px-2 text-center border-r border-slate-200 bg-violet-100 text-violet-700">AVG</th>
                                    <th className="py-2 px-2 text-center border-r border-slate-300 bg-violet-200 text-violet-800">NET</th>
                                    <th className="py-2 px-2 text-center border-r border-slate-200 bg-sky-100 text-sky-700">AVG</th>
                                    <th className="py-2 px-2 text-center border-r border-slate-300 bg-sky-200 text-sky-800">NET</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {records.length === 0 ? (
                                    <tr>
                                        <td colSpan={20} className="py-16 text-center text-slate-400 font-medium">
                                            <div className="flex flex-col items-center gap-3">
                                                <Award className="h-12 w-12 text-slate-300" />
                                                <p>No enrolled subjects found for this term</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    records.map((record, index) => (
                                        <tr key={index} className={cn("hover:bg-slate-50 transition-colors", index % 2 === 0 ? "bg-white" : "bg-slate-50/50")}>
                                            <td className="py-4 px-4 border-r border-slate-200">
                                                <p className="font-bold text-sm text-slate-900">{record.subject.name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{record.subject.code || 'No Code'}</p>
                                            </td>
                                            {/* ACTIVITIES */}
                                            {Array.from({ length: maxAct }).map((_, i) => (
                                                <td key={i} className="py-4 px-2 text-center border-r border-slate-100 text-xs font-semibold text-slate-600 tabular-nums bg-rose-50/30">
                                                    {record.activities.scores[i]?.toFixed(1) || '—'}
                                                </td>
                                            ))}
                                            <td className="py-4 px-2 text-center border-r border-slate-100 text-xs font-bold text-rose-700 tabular-nums bg-rose-100/50">{(record.activities.avg || 0).toFixed(1)}%</td>
                                            <td className="py-4 px-2 text-center border-r border-slate-200 text-xs font-bold text-rose-900 tabular-nums bg-rose-200/50">{(record.activities.net || 0).toFixed(2)}</td>
                                            
                                            {/* QUIZZES */}
                                            {Array.from({ length: maxQz }).map((_, i) => (
                                                <td key={i} className="py-4 px-2 text-center border-r border-slate-100 text-xs font-semibold text-slate-600 tabular-nums bg-emerald-50/30">
                                                    {record.quizzes.scores[i]?.toFixed(1) || '—'}
                                                </td>
                                            ))}
                                            <td className="py-4 px-2 text-center border-r border-slate-100 text-xs font-bold text-emerald-700 tabular-nums bg-emerald-100/50">{(record.quizzes.avg || 0).toFixed(1)}%</td>
                                            <td className="py-4 px-2 text-center border-r border-slate-200 text-xs font-bold text-emerald-900 tabular-nums bg-emerald-200/50">{(record.quizzes.net || 0).toFixed(2)}</td>
                                            
                                            {/* PERFORMANCE */}
                                            {Array.from({ length: maxPrf }).map((_, i) => (
                                                <td key={i} className="py-4 px-2 text-center border-r border-slate-100 text-xs font-semibold text-slate-600 tabular-nums bg-amber-50/30">
                                                    {record.performance.scores[i]?.toFixed(1) || '—'}
                                                </td>
                                            ))}
                                            <td className="py-4 px-2 text-center border-r border-slate-100 text-xs font-bold text-amber-700 tabular-nums bg-amber-100/50">{(record.performance.avg || 0).toFixed(1)}%</td>
                                            <td className="py-4 px-2 text-center border-r border-slate-200 text-xs font-bold text-amber-900 tabular-nums bg-amber-200/50">{(record.performance.net || 0).toFixed(2)}</td>
                                            
                                            {/* FINAL OUTPUT */}
                                            {Array.from({ length: maxFo }).map((_, i) => (
                                                <td key={i} className="py-4 px-2 text-center border-r border-slate-100 text-xs font-semibold text-slate-600 tabular-nums bg-violet-50/30">
                                                    {record.finalOutput.scores[i]?.toFixed(1) || '—'}
                                                </td>
                                            ))}
                                            <td className="py-4 px-2 text-center border-r border-slate-100 text-xs font-bold text-violet-700 tabular-nums bg-violet-100/50">{(record.finalOutput.avg || 0).toFixed(1)}%</td>
                                            <td className="py-4 px-2 text-center border-r border-slate-200 text-xs font-bold text-violet-900 tabular-nums bg-violet-200/50">{(record.finalOutput.net || 0).toFixed(2)}</td>
                                            
                                            {/* ATTENDANCE */}
                                            <td className="py-4 px-2 text-center border-r border-slate-100 text-xs font-bold text-sky-700 tabular-nums bg-sky-100/50">{record.attendance.avg.toFixed(1)}%</td>
                                            <td className="py-4 px-2 text-center border-r border-slate-200 text-xs font-bold text-sky-900 tabular-nums bg-sky-200/50">{record.attendance.net.toFixed(2)}</td>
                                            <td className="py-4 px-4 text-center bg-slate-900">
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <span className={cn("text-2xl font-bold tabular-nums", record.finalPercentage >= 75 ? "text-emerald-400" : "text-red-400")}>{record.finalPercentage.toFixed(2)}%</span>
                                                    <Badge className={cn("text-[10px] font-bold px-2", record.finalPercentage >= 75 ? "bg-emerald-500 hover:bg-emerald-500" : "bg-red-500 hover:bg-red-500")}>{record.numericalGrade}</Badge>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Grade Components Legend</p>
                                <div className="flex flex-wrap gap-4">
                                    {[{ color: 'bg-rose-500', label: 'Activities' }, { color: 'bg-emerald-500', label: 'Quizzes' }, { color: 'bg-amber-500', label: 'Performance' }, { color: 'bg-violet-500', label: 'Final Output' }, { color: 'bg-sky-500', label: 'Attendance' }].map(item => (
                                        <div key={item.label} className="flex items-center gap-2">
                                            <div className={cn("w-3 h-3 rounded-sm", item.color)} />
                                            <span className="text-xs text-slate-600 font-medium">{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex items-start gap-2 text-xs text-slate-500">
                                    <ShieldCheck size={14} className="shrink-0 mt-0.5 text-slate-400" />
                                    <p>This report represents your running weighted average. Grades are capped at 100% and normalize as new components are added to the academic cycle.</p>
                                </div>
                            </div>
                            <div className="text-center border-l border-slate-200 pl-6">
                                <div className="pt-8">
                                    <div className="w-40 h-px bg-slate-400 mx-auto mb-2" />
                                    <p className="font-bold text-slate-900 text-sm">Fatima L. Layyo</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Registrar Official</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
