'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Subject, Classwork, Submission, Material } from '@/utils/storage';
import { getClassworksAction, getSubmissionsAction, getMaterialsAction, deleteSubmissionAction } from '@/app/actions/dbActions';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  ExternalLink, 
  Link as LinkIcon, 
  ClipboardList, 
  Loader2, 
  UserCheck, 
  FileText, 
  RotateCcw,
  CheckCircle2,
  Filter,
  ListChecks,
  Zap,
  GraduationCap
} from 'lucide-react';
import { format, isPast } from 'date-fns';
import SubmitWorkDialog from './SubmitWorkDialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SubjectClassworkProps {
  subject: Subject;
  onBack: () => void;
}

export default function SubjectClasswork({ subject, onBack }: SubjectClassworkProps) {
  const { user } = useAuth();
  const [classworks, setClassworks] = useState<Classwork[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingWork, setSubmittingWork] = useState<Classwork | null>(null);
  
  // Category Isolation State
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    
    const handleSync = (e: any) => {
        if (e.detail?.collection === 'submissions' || e.detail?.collection === 'classworks') {
            loadData();
        }
    };
    window.addEventListener('neural_sync_update', handleSync);
    return () => window.removeEventListener('neural_sync_update', handleSync);
  }, [subject]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [allClassworks, allSubmissions, allMaterials] = await Promise.all([
        getClassworksAction(),
        getSubmissionsAction(),
        getMaterialsAction()
      ]);
      setClassworks(allClassworks.filter(cw => cw.subjectId === subject.id && cw.status === 'published'));
      setMaterials(allMaterials.filter(m => m.subjectId === subject.id));
      setSubmissions(allSubmissions.filter(sub => sub.studentId === user.id));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubmit = async (submissionId: string) => {
    if (!confirm("Are you sure you want to unsubmit?")) return;
    try {
      setSubmissions(prev => prev.filter(s => s.id !== submissionId));
      deleteSubmissionAction(submissionId);
      toast.success("Work unsubmitted.");
    } catch (e) {
      toast.error("Failed to unsubmit.");
      loadData();
    }
  };

  const filteredAssessments = useMemo(() => {
    if (!activeCategory) return classworks;
    return classworks.filter(cw => cw.type === activeCategory);
  }, [classworks, activeCategory]);

  const categories = [
    { id: 'activity', label: 'Activities', icon: ClipboardList },
    { id: 'quiz', label: 'Quizzes', icon: ListChecks },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'final_output', label: 'Final Output', icon: GraduationCap },
  ];

  if (loading && classworks.length === 0) return (
    <div className="flex flex-col items-center justify-center p-32 space-y-4">
      <Loader2 className="animate-spin text-primary h-12 w-12" />
      <p className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Syncing academic loads...</p>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
        <div>
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 mb-2 text-muted-foreground hover:text-primary transition-colors font-bold text-xs uppercase tracking-tight"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Load
          </button>
          <h2 className="text-4xl md:text-5xl font-black text-primary uppercase tracking-tighter leading-none">{subject.name}</h2>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-2">Course Resource Hub</p>
        </div>
      </div>

      <Tabs defaultValue="assessments" className="w-full">
        <TabsList className="bg-white border-2 border-primary/5 h-14 p-1.5 rounded-full mb-10 inline-flex shadow-sm">
          <TabsTrigger value="assessments" className="rounded-full font-black uppercase text-[10px] tracking-widest px-10 data-[state=active]:bg-primary data-[state=active]:text-white">Assessments</TabsTrigger>
          <TabsTrigger value="modules" className="rounded-full font-black uppercase text-[10px] tracking-widest px-10 data-[state=active]:bg-primary data-[state=active]:text-white">Learning Modules</TabsTrigger>
        </TabsList>

        <TabsContent value="assessments" className="space-y-10">
          {/* Category Filter Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 mr-2">
              <Filter size={16} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filter Category:</span>
            </div>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={cn(
                  "h-10 px-6 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-sm border",
                  activeCategory === cat.id 
                    ? "bg-primary text-white border-primary shadow-primary/20" 
                    : "bg-white text-muted-foreground border-primary/10 hover:border-primary/40"
                )}
              >
                <cat.icon size={14} />
                {cat.label}
              </button>
            ))}
            {activeCategory && (
              <button 
                onClick={() => setActiveCategory(null)}
                className="h-10 px-4 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                <RotateCcw size={16} />
              </button>
            )}
          </div>

          {filteredAssessments.length === 0 ? (
            <div className="text-center py-32 bg-white border-4 border-dashed rounded-[3.5rem] border-primary/5">
              <ClipboardList size={64} className="mx-auto text-primary opacity-10 mb-6" />
              <h3 className="text-xl font-black text-muted-foreground uppercase tracking-tighter">
                {activeCategory ? `No ${activeCategory.replace('_', ' ')} found` : 'Registry clear'}
              </h3>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredAssessments.map(cw => {
                const submission = submissions.find(s => s.classworkId === cw.id);
                const currentUserId = user?.id?.trim();
                const isExempted = currentUserId && cw.exemptedStudentIds?.some(id => id.trim() === currentUserId);
                const isLate = isPast(new Date(cw.dueDate)) && !submission && !isExempted;

                return (
                  <div key={cw.id} className={cn(
                    "bg-white rounded-[3.5rem] shadow-2xl border-none p-10 md:p-14 transition-all hover:translate-y-[-4px] relative overflow-hidden group",
                    isExempted && "ring-4 ring-blue-500/10"
                  )}>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12">
                      {/* Left Data Column */}
                      <div className="flex-1 space-y-8">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="h-8 px-5 rounded-full border-primary/10 font-black text-[9px] uppercase tracking-widest text-primary/60">{cw.type.replace('_', ' ')}</Badge>
                          <Badge variant="outline" className="h-8 px-5 rounded-full border-primary/10 font-black text-[9px] uppercase tracking-widest text-primary/60">{cw.totalPoints} POINTS</Badge>
                          {isExempted && <Badge className="bg-blue-600 text-white font-black text-[9px] uppercase tracking-widest border-none px-4 rounded-full">EXEMPTED</Badge>}
                        </div>

                        <div>
                          <h3 className="text-[2.5rem] font-black text-slate-900 uppercase tracking-tighter leading-none mb-3 group-hover:text-primary transition-colors">{cw.title}</h3>
                          <div className="flex items-center gap-2 text-[11px] font-black text-primary uppercase tracking-[0.2em] opacity-70">
                            <Clock className="h-4 w-4" /> 
                            DEADLINE: {format(new Date(cw.dueDate), "MMM dd, yyyy • h:mm a")}
                          </div>
                        </div>

                        {(cw.description || submission?.feedback) && (
                          <div className="bg-slate-100/70 rounded-[2rem] p-8 text-sm font-medium text-slate-600 italic leading-relaxed border border-slate-200/50">
                            {submission?.status === 'graded' && submission.feedback ? (
                              <div className="space-y-2">
                                <p className="text-[9px] font-black uppercase text-primary not-italic tracking-widest">Instructor Feedback:</p>
                                <p>"{submission.feedback}"</p>
                              </div>
                            ) : (
                              cw.description || "Please refer to course resources for instruction."
                            )}
                          </div>
                        )}

                        {!submission && !isExempted && !isLate && (
                          <div className="flex flex-wrap gap-3">
                            <Button 
                              onClick={() => setSubmittingWork(cw)} 
                              className="h-16 px-12 rounded-[1.5rem] bg-primary hover:bg-primary/90 text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-primary/30 transition-all active:scale-95 gap-3"
                            >
                              <LinkIcon size={20} /> Open Submission Link
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Right Status Column (Reference Image Style) */}
                      <div className="lg:w-[400px] shrink-0">
                         <div className={cn(
                           "h-full min-h-[300px] rounded-[3rem] p-12 flex flex-col items-center justify-center text-center space-y-6 transition-all duration-700",
                           isExempted ? "bg-blue-50/50 border-4 border-blue-100" :
                           submission ? "bg-green-50/50 border-4 border-green-100 shadow-xl" :
                           isLate ? "bg-red-50/50 border-4 border-red-100" :
                           "bg-slate-50 border-4 border-dashed border-slate-200"
                         )}>
                            {isExempted ? (
                              <>
                                <div className="h-20 w-20 rounded-[1.5rem] bg-blue-500 text-white flex items-center justify-center shadow-2xl"><UserCheck size={40} /></div>
                                <div className="space-y-1">
                                  <p className="font-black text-blue-900 uppercase text-xs tracking-widest">EXEMPTED</p>
                                  <p className="text-7xl font-black text-blue-900 tracking-tighter">{cw.totalPoints}</p>
                                </div>
                              </>
                            ) : submission ? (
                              <>
                                <div className="h-20 w-20 rounded-[1.5rem] bg-green-500 text-white flex items-center justify-center shadow-2xl animate-in zoom-in duration-500">
                                  <CheckCircle2 size={40} />
                                </div>
                                <div className="space-y-1">
                                  <p className="font-black text-green-900 uppercase text-xs tracking-widest">SUBMITTED</p>
                                  <p className="text-[5rem] font-black text-green-900 tracking-tighter leading-none">
                                    {submission.status === 'graded' ? submission.grade : '—'}
                                  </p>
                                  {submission.status !== 'graded' && (
                                    <button 
                                      onClick={() => handleUnsubmit(submission.id)}
                                      className="text-[10px] font-black uppercase text-green-700/50 hover:text-green-700 tracking-widest mt-4 flex items-center gap-2"
                                    >
                                      <RotateCcw size={12} /> UN-SUBMIT
                                    </button>
                                  )}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="h-20 w-20 rounded-[1.5rem] bg-slate-200 flex items-center justify-center text-slate-400">
                                  {isLate ? <XCircle size={40} /> : <ClipboardList size={40} />}
                                </div>
                                <div className="space-y-1">
                                  <p className={cn("font-black uppercase text-xs tracking-widest", isLate ? "text-red-500" : "text-slate-400")}>
                                    {isLate ? "EXPIRED" : "NO SUBMISSION"}
                                  </p>
                                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                    {isLate ? "LATE DISMISSAL" : "Awaiting Protocol"}
                                  </p>
                                </div>
                              </>
                            )}
                         </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="modules" className="space-y-10">
          {materials.length === 0 ? (
            <div className="text-center py-32 bg-white border-4 border-dashed rounded-[3.5rem] border-primary/5">
              <FileText size={64} className="mx-auto text-primary opacity-10 mb-6" />
              <h3 className="text-xl font-black text-muted-foreground uppercase tracking-tighter">Library Empty</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {materials.map(m => (
                <div key={m.id} className="bg-white rounded-[3rem] border border-primary/5 shadow-2xl p-10 hover:translate-y-[-6px] transition-all group flex flex-col h-full">
                  <div className="h-16 w-16 rounded-[1.25rem] bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner mb-8">
                    <BookOpen size={32} />
                  </div>
                  <h3 className="font-black text-2xl text-foreground uppercase tracking-tight mb-3 leading-tight">{m.title}</h3>
                  <p className="text-sm text-muted-foreground font-medium mb-10 leading-relaxed italic">{m.description || "Instructional components archived."}</p>
                  <div className="space-y-3 mt-auto">
                    {m.attachments?.map((att, i) => (
                        <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl hover:bg-primary/5 transition-all border-2 border-transparent hover:border-primary/10 shadow-sm">
                            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-md"><ExternalLink size={18} /></div>
                            <span className="text-[11px] font-black uppercase truncate flex-1 tracking-tight">{att.name}</span>
                        </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {submittingWork && (
        <SubmitWorkDialog
          classwork={submittingWork}
          onClose={() => setSubmittingWork(null)}
          onSubmitted={() => { setSubmittingWork(null); loadData(); }}
        />
      )}
    </div>
  );
}

function XCircle(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
    </svg>
  );
}
