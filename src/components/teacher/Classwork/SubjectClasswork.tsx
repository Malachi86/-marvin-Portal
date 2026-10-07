'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Subject, Classwork, Material, Submission, Enrollment, User } from '@/utils/storage';
import { 
  getClassworksAction, 
  getMaterialsAction, 
  deleteMaterialAction, 
  deleteClassworkAction, 
  getEnrollmentsAction, 
  getSubmissionsAction,
  getUsersAction,
} from '@/app/actions/dbActions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Plus, 
  BookOpen, 
  Loader2, 
  Edit, 
  Users, 
  FileText, 
  Trash2, 
  Download, 
  ClipboardList, 
  CheckCircle2, 
  AlertCircle, 
  BarChart3, 
  Calendar,
  Zap,
  Activity,
  UserCheck,
  ListChecks,
  GraduationCap,
  X,
  FilterX
} from 'lucide-react';
import { format } from 'date-fns';
import CreateClassworkDialog from './CreateClassworkDialog';
import EditClassworkDialog from './EditClassworkDialog';
import CreateMaterialDialog from './CreateMaterialDialog';
import SubmissionsView from './SubmissionView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SubjectClassworkProps {
  subject: Subject;
  onBack: () => void;
}

// Formalized StatBox with click support for filtering
const StatBox = ({ icon: Icon, label, value, color, description, onClick, isActive }: any) => (
  <Card 
    onClick={onClick}
    className={cn(
      "p-5 rounded-2xl border bg-white flex flex-col justify-between min-h-[130px] transition-all cursor-pointer group relative overflow-hidden",
      isActive 
        ? "border-primary ring-2 ring-primary/10 shadow-lg scale-[1.02]" 
        : "border-slate-100 shadow-sm hover:border-primary/20 hover:shadow-md"
    )}
  >
    <div className="flex justify-between items-start relative z-10">
      <div className={cn(
        "h-10 w-10 rounded-lg flex items-center justify-center shadow-sm transition-colors", 
        isActive ? "bg-primary text-white" : (color || "bg-primary/5 text-primary")
      )}>
        <Icon size={18} />
      </div>
      <div className={cn(
        "text-[9px] font-bold px-2 py-1 rounded transition-colors",
        isActive ? "bg-primary/10 text-primary" : "bg-slate-50 text-slate-400"
      )}>
        {isActive ? 'FILTERED' : 'RECORDS'}
      </div>
    </div>
    <div className="relative z-10 mt-4">
      <p className="text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wider">{label}</p>
      <span className="text-3xl font-bold tracking-tight text-slate-900">{value}</span>
      <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">{description}</p>
    </div>
    <Icon size={80} className={cn(
      "absolute -right-4 -bottom-4 opacity-[0.02] transition-transform",
      isActive ? "scale-110 opacity-[0.05]" : "group-hover:scale-110"
    )} />
  </Card>
);

export default function SubjectClasswork({ subject, onBack }: SubjectClassworkProps) {
  const [classworks, setClassworks] = useState<Classwork[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingMaterial, setIsCreatingMaterial] = useState(false);
  const [editingClasswork, setEditingClasswork] = useState<Classwork | null>(null);
  const [selectedClasswork, setSelectedClasswork] = useState<Classwork | null>(null);
  
  // Filtering state
  const [filterType, setFilterType] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [subject]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allClassworks, allMaterials, allEnrollments, allSubmissions, allUsers] = await Promise.all([
        getClassworksAction(),
        getMaterialsAction(),
        getEnrollmentsAction(),
        getSubmissionsAction(),
        getUsersAction()
      ]);
      
      const filteredCW = allClassworks.filter(cw => cw.subjectId === subject.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setClassworks(filteredCW);
      setMaterials(allMaterials.filter(m => m.subjectId === subject.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setEnrollments(allEnrollments.filter(e => e.subjectId === subject.id && e.status === 'approved'));
      setSubmissions(allSubmissions);
      setUsers(allUsers);

      const signal = localStorage.getItem('notif_deep_link');
      if (signal) {
        try {
          const { classworkId, type } = JSON.parse(signal);
          if (type === 'submission' && !selectedClasswork) {
            const targetCW = filteredCW.find(cw => cw.id === classworkId);
            if (targetCW) {
              setSelectedClasswork(targetCW);
            }
          }
        } catch (e) {
          console.error("Deep link parse error", e);
        }
      }
    } catch (e) {
      toast.error("Failed to sync records.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm("Are you sure you want to delete this learning material?")) return;
    try {
      const result = await deleteMaterialAction(id);
      if (result.success) {
        toast.success("Learning material deleted.");
        loadData();
      }
    } catch (e) {
      toast.error("Failed to delete material.");
    }
  };

  const filteredClassworks = useMemo(() => {
    if (!filterType) return classworks;
    return classworks.filter(cw => cw.type === filterType);
  }, [classworks, filterType]);

  const stats = useMemo(() => {
    const totalEnrolled = enrollments.length;
    return classworks.map(cw => {
      const cwSubmissions = submissions.filter(s => s.classworkId === cw.id);
      const turnedIn = cwSubmissions.length;
      const exemptedCount = cw.exemptedStudentIds?.length || 0;
      const missing = Math.max(0, totalEnrolled - turnedIn - exemptedCount);
      return { id: cw.id, turnedIn, missing, totalEnrolled, exemptedCount };
    });
  }, [classworks, enrollments, submissions]);

  const summary = useMemo(() => {
    const types = ['activity', 'quiz', 'performance', 'final_output'];
    return types.map(t => {
      const items = classworks.filter(cw => cw.type === t);
      
      const totalCompleted = items.reduce((acc, cw) => {
        const subStudentIds = submissions.filter(s => s.classworkId === cw.id).map(s => s.studentId);
        const exemptedIds = cw.exemptedStudentIds || [];
        const uniqueCompletions = new Set([...subStudentIds, ...exemptedIds]).size;
        return acc + uniqueCompletions;
      }, 0);
      
      const totalPossible = items.length * enrollments.length;
      return {
        type: t,
        count: items.length,
        completion: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0
      };
    });
  }, [classworks, enrollments, submissions]);

  const classPulse = useMemo(() => {
    const studentIds = enrollments.map(e => e.studentId);
    const now = new Date();
    const activeStudents = users.filter(u => {
      if (!studentIds.includes(u.id) || !u.lastSeen) return false;
      const lastSeen = new Date(u.lastSeen);
      return (now.getTime() - lastSeen.getTime()) < 120000;
    });
    return { onlineCount: activeStudents.length, totalEnrolled: studentIds.length };
  }, [enrollments, users]);
  
  if (selectedClasswork) {
    return <SubmissionsView classwork={selectedClasswork} onBack={() => setSelectedClasswork(null)} />;
  }

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'activity': return ClipboardList;
      case 'quiz': return ListChecks;
      case 'performance': return Zap;
      case 'final_output': return GraduationCap;
      default: return FileText;
    }
  };

  const getCategoryColor = (type: string) => {
    switch (type) {
      case 'activity': return 'bg-rose-50 text-rose-600';
      case 'quiz': return 'bg-emerald-50 text-emerald-600';
      case 'performance': return 'bg-amber-50 text-amber-600';
      case 'final_output': return 'bg-violet-50 text-violet-600';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  const handleToggleFilter = (type: string) => {
    if (filterType === type) {
      setFilterType(null);
      toast.info("Showing all categories.");
    } else {
      setFilterType(type);
      toast.success(`Isolated category: ${type.replace('_', ' ').toUpperCase()}`);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
        <div className="space-y-1">
          <Button variant="ghost" onClick={onBack} className="mb-2 -ml-2 hover:bg-primary/5 rounded-full p-0 h-auto">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Load
          </Button>
          <h2 className="text-3xl md:text-4xl font-black text-primary uppercase tracking-tighter leading-none">{subject.name}</h2>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-60">Instructional Resource Hub</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <Button onClick={() => setIsCreatingMaterial(true)} variant="outline" className="flex-1 md:flex-none rounded-xl h-12 px-8 border-primary/10 hover:bg-primary/5 bg-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-sm transition-all active:scale-95">
                <FileText className="h-4 w-4" /> Upload Module
            </Button>
            <Button onClick={() => setIsCreating(true)} className="flex-1 md:flex-none rounded-xl h-12 px-10 bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20 font-black uppercase text-[10px] tracking-widest gap-2 transition-all active:scale-95">
                <Plus className="h-4 w-4" /> Post Assessment
            </Button>
        </div>
      </div>

      <Tabs defaultValue="assessments" className="w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-primary/5 pb-2">
          <TabsList className="bg-white border-2 border-primary/5 h-14 p-1.5 rounded-full inline-flex shadow-sm">
            <TabsTrigger value="assessments" className="rounded-full font-black uppercase text-[10px] tracking-widest px-8 data-[state=active]:bg-primary data-[state=active]:text-white">Assessments</TabsTrigger>
            <TabsTrigger value="modules" className="rounded-full font-black uppercase text-[10px] tracking-widest px-8 data-[state=active]:bg-primary data-[state=active]:text-white">Learning Modules</TabsTrigger>
          </TabsList>
          <div className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
            <Users className="h-3 w-3" /> {enrollments.length} Active Students
          </div>
        </div>

        <TabsContent value="assessments" className="mt-0">
          {loading && classworks.length === 0 ? (
            <div className="flex justify-center p-32"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>
          ) : (
            <div className="space-y-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                {summary.map(s => (
                  <StatBox 
                    key={s.type}
                    icon={getCategoryIcon(s.type)}
                    label={s.type.replace('_', ' ')}
                    value={`${s.completion}%`}
                    color={getCategoryColor(s.type)}
                    description={`${s.count} Items`}
                    isActive={filterType === s.type}
                    onClick={() => handleToggleFilter(s.type)}
                  />
                ))}
                <StatBox 
                  icon={Zap}
                  label="Pulse Monitor"
                  value={classPulse.onlineCount}
                  color="bg-primary/5 text-primary"
                  description="Active Session"
                />
              </div>

              {/* Filter Active Signal */}
              {filterType && (
                <div className="flex items-center justify-between bg-primary/5 px-6 py-3 rounded-2xl border border-primary/10 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded bg-primary text-white flex items-center justify-center"><Activity size={14}/></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                      Filtering registry by category: <span className="underline decoration-2 underline-offset-4">{filterType.replace('_', ' ')}</span>
                    </p>
                  </div>
                  <button 
                    onClick={() => setFilterType(null)}
                    className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white border border-primary/20 text-primary font-black text-[9px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm"
                  >
                    <FilterX size={12} /> Clear Isolation
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredClassworks.length === 0 ? (
                  <div className="md:col-span-2 text-center py-20 bg-white border-4 border-dashed rounded-xl border-primary/5">
                    <ClipboardList size={64} className="mx-auto text-primary opacity-10 mb-6" />
                    <h3 className="text-xl font-black text-muted-foreground uppercase">
                      {filterType ? `No ${filterType.replace('_', ' ')} items detected` : 'Registry Clear'}
                    </h3>
                    {filterType && (
                       <Button variant="ghost" onClick={() => setFilterType(null)} className="mt-4 font-black uppercase text-[10px] tracking-widest">
                         Show all categories
                       </Button>
                    )}
                  </div>
                ) : (
                  filteredClassworks.map(cw => {
                    const cwStat = stats.find(s => s.id === cw.id);
                    return (
                      <Card key={cw.id} className="bg-white rounded-xl border-none shadow-xl p-8 hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col min-h-[300px]">
                        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                          <ClipboardList size={120} />
                        </div>
                        <div className="relative z-10 flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-6">
                            <Badge className="bg-primary text-white font-black text-[10px] uppercase tracking-widest border-none px-4 py-1.5 rounded-full shadow-lg shadow-primary/10">
                              {cw.type.replace('_', ' ')}
                            </Badge>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-100">
                                <CheckCircle2 size={12} />
                                <span className="font-black text-[10px] uppercase tracking-widest">{cwStat?.turnedIn} Turned In</span>
                              </div>
                              {cwStat && cwStat.exemptedCount > 0 && (
                                <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-100">
                                  <UserCheck size={12} />
                                  <span className="font-black text-[10px] uppercase tracking-widest">{cwStat.exemptedCount} Exempted</span>
                                </div>
                              )}
                              {cwStat && cwStat.missing > 0 && (
                                <div className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-full border border-red-100">
                                  <AlertCircle size={12} />
                                  <span className="font-black text-[10px] uppercase tracking-widest">{cwStat.missing} Missing</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <h3 className="font-black text-2xl text-foreground leading-tight uppercase tracking-tight mb-4 group-hover:text-primary transition-colors line-clamp-2">
                            {cw.title}
                          </h3>
                          <div className="flex items-center gap-3 text-[11px] font-black text-muted-foreground uppercase tracking-widest bg-muted/30 px-4 py-2 rounded-xl w-fit">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            <span>DUE:</span>
                            <span className="text-foreground">{format(new Date(cw.dueDate), "MMM dd, yyyy • h:mm a")}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 relative z-10 mt-10">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setEditingClasswork(cw)}
                            className="flex-1 h-12 rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest border-primary/10 hover:bg-primary/5 transition-all shadow-sm"
                          >
                            <Edit className="h-4 w-4" /> MODIFY
                          </Button>
                          <Button 
                            onClick={() => setSelectedClasswork(cw)}
                            className="flex-[1.5] h-12 rounded-xl gap-3 bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-primary/20 transition-all active:scale-95"
                          >
                            <Users className="h-4 w-4" /> SUBMISSIONS
                          </Button>
                        </div>
                      </Card>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="modules" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {materials.length === 0 ? (
              <div className="md:col-span-3 text-center py-32 bg-white border-4 border-dashed rounded-xl border-primary/5">
                <FileText size={64} className="mx-auto text-primary opacity-10 mb-6" />
                <h3 className="text-2xl font-black uppercase tracking-tighter text-muted-foreground">No Modules Published</h3>
              </div>
            ) : (
              materials.map(m => (
                <Card key={m.id} className="bg-white rounded-xl border-none shadow-xl p-8 hover:shadow-2xl transition-all group relative flex flex-col h-full hover:-translate-y-1">
                  <div className="flex justify-between items-start mb-8">
                    <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                      <FileText size={24} />
                    </div>
                    <button onClick={() => handleDeleteMaterial(m.id)} className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all active:scale-95 shadow-sm opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                  </div>
                  <h3 className="font-black text-xl text-primary leading-tight uppercase tracking-tight mb-3">{m.title}</h3>
                  <p className="text-sm text-muted-foreground font-medium line-clamp-3 mb-10 leading-relaxed">{m.description || "No instructional notes."}</p>
                  <div className="space-y-3 mt-auto pt-6 border-t border-primary/5">
                    {m.attachments?.map((att, i) => (
                        <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-muted/20 rounded-xl hover:bg-primary/5 transition-colors border border-transparent hover:border-primary/10 shadow-sm">
                            <Download size={16} className="text-primary shrink-0" />
                            <span className="text-[11px] font-black uppercase tracking-tight truncate flex-1 text-slate-700">{att.name}</span>
                        </a>
                    ))}
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {isCreating && <CreateClassworkDialog subjectId={subject.id} onClose={() => setIsCreating(false)} onCreated={() => { setIsCreating(false); loadData(); }} />}
      {isCreatingMaterial && <CreateMaterialDialog subjectId={subject.id} onClose={() => setIsCreatingMaterial(true)} onCreated={() => { setIsCreatingMaterial(false); loadData(); }} />}
      {editingClasswork && <EditClassworkDialog classwork={editingClasswork} onClose={() => setEditingClasswork(null)} onUpdated={() => { setEditingClasswork(null); loadData(); }} />}
    </div>
  );
}
