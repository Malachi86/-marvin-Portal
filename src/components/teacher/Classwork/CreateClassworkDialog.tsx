'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addClassworkAction, getEnrollmentsAction, getUsersAction } from '@/app/actions/dbActions';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Calendar, Link as LinkIcon, X, UserCheck, Mail, ListChecks, FileText, CheckCircle2 } from 'lucide-react';
import { QuizQuestion, User } from '@/utils/storage';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface CreateClassworkDialogProps {
  subjectId: string;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateClassworkDialog({ subjectId, onClose, onCreated }: CreateClassworkDialogProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDateDate, setDueDateDate] = useState('');
  const [dueDateTime, setDueDateTime] = useState('23:59');
  const [submissionType, setSubmissionType] = useState<'file' | 'quiz'>('file');
  const [type, setType] = useState<'quiz' | 'activity' | 'performance' | 'final_output'>('activity');
  const [totalPoints, setTotalPoints] = useState('100');
  
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [links, setLinks] = useState<{ name: string, url: string }[]>([]);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState<User[]>([]);
  const [exemptedIds, setExemptedIds] = useState<string[]>([]);
  const [notifyStudents, setNotifyStudents] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [enrollments, users] = await Promise.all([
          getEnrollmentsAction(),
          getUsersAction()
        ]);
        
        const enrolled = enrollments
          .filter(e => e.subjectId === subjectId && e.status === 'approved')
          .map(e => users.find(u => u.id === e.studentId))
          .filter((u): u is User => !!u);
        setEnrolledStudents(enrolled);
      } catch (e) {
        console.error(e);
      }
    };
    loadData();
  }, [subjectId]);

  const addLink = () => {
    if (!newLinkName || !newLinkUrl) return;
    setLinks([...links, { name: newLinkName, url: newLinkUrl }]);
    setNewLinkName('');
    setNewLinkUrl('');
  };

  const addQuestion = () => {
    const newQ: QuizQuestion = {
      id: `Q-${Date.now()}-${questions.length}`,
      text: '',
      type: 'mcq',
      points: 5,
      options: ['', '', '', ''],
      correctAnswer: ''
    };
    setQuestions([...questions, newQ]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, updates: Partial<QuizQuestion>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const toggleExempted = (id: string) => {
    setExemptedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title || !dueDateDate) {
      toast.error("Title and Deadline are required.");
      return;
    }

    setLoading(true);
    try {
      const dueDate = `${dueDateDate}T${dueDateTime}`;
      const calculatedTotalPoints = submissionType === 'quiz' ? questions.reduce((sum, q) => sum + Number(q.points), 0) : Number(totalPoints);

      const payload: any = {
        subjectId,
        teacherId: user.id,
        title,
        description,
        dueDate,
        type,
        submissionType,
        totalPoints: calculatedTotalPoints,
        exemptedStudentIds: exemptedIds,
        status: 'published',
        attachments: links,
      };

      if (submissionType === 'quiz') {
        payload.questions = questions;
      }

      await addClassworkAction(payload);
      toast.success("Assessment deployed!");
      onCreated();
    } catch (err) {
      toast.error("Failed to publish assessment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-3xl flex flex-col h-[90vh] bg-white">
        {/* Condensed Header */}
        <div className="px-8 py-4 flex-none flex items-center justify-between border-b border-slate-50">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Create New Classwork</DialogTitle>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-12 space-y-10 bg-slate-50/10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Academic Title</Label>
                <Input 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  required 
                  placeholder="e.g. Activity 1: Neural Links"
                  className="h-11 rounded-xl border-slate-100 bg-white px-5 font-bold focus:ring-primary/10" 
                />
              </div>

              <div className="p-5 bg-muted/5 rounded-[1.5rem] border border-slate-100 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Assessment Category</Label>
                  <Select value={type} onValueChange={(v: any) => setType(v)}>
                    <SelectTrigger className="h-10 rounded-xl border-slate-100 bg-white font-black uppercase text-[9px] tracking-widest"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="activity" className="font-bold">Activity</SelectItem>
                      <SelectItem value="quiz" className="font-bold">Quiz</SelectItem>
                      <SelectItem value="performance" className="font-bold">Performance Task</SelectItem>
                      <SelectItem value="final_output" className="font-bold">Final Assessment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Submission Interface</Label>
                  <Select value={submissionType} onValueChange={(v: any) => setSubmissionType(v)}>
                    <SelectTrigger className="h-10 rounded-xl border-slate-100 bg-white font-black uppercase text-[9px] tracking-widest"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="file" className="font-bold">Cloud Link Repository</SelectItem>
                      <SelectItem value="quiz" className="font-bold">Interactive Architecture</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="p-6 bg-muted/10 rounded-[2rem] flex flex-col justify-center items-center text-center space-y-5 border border-slate-200/50 shadow-inner">
              <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-lg border border-slate-100">
                <Calendar size={24} />
              </div>
              <div className="space-y-1.5">
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/40">Temporal Deadline</p>
                <div className="flex items-center gap-2 pt-1">
                  <Input type="date" value={dueDateDate} onChange={e => setDueDateDate(e.target.value)} required className="h-10 rounded-xl border-slate-100 bg-white text-[10px] font-black text-center w-32 shadow-sm" />
                  <Input type="time" value={dueDateTime} onChange={e => setDueDateTime(e.target.value)} required className="h-10 rounded-xl border-slate-100 bg-white text-[10px] font-black text-center w-24 shadow-sm" />
                </div>
              </div>
              <div className="w-full pt-3 border-t border-slate-200/50">
                 <Label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Total Point Matrix</Label>
                 <Input 
                   type="number" 
                   value={totalPoints} 
                   onChange={e => setTotalPoints(e.target.value)} 
                   disabled={submissionType === 'quiz'}
                   className="h-11 mt-1 bg-white border-none rounded-xl text-center font-black text-2xl shadow-sm text-primary" 
                 />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">INSTRUCTIONAL LOGIC</Label>
            <Textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              className="rounded-2xl p-8 border-slate-200 bg-white min-h-[140px] font-medium text-base shadow-inner resize-none focus:ring-2 focus:ring-primary/10 outline-none" 
              placeholder="State the instructional objectives and requirements..." 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-4">
            {submissionType === 'file' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 ml-1">
                  <LinkIcon size={16} className="text-primary" />
                  <Label className="text-[10px] font-black uppercase tracking-widest text-foreground">SUPPLEMENTARY ASSETS</Label>
                </div>
                <div className="space-y-6">
                   <div className="flex gap-2">
                      <Input 
                        placeholder="Label" 
                        value={newLinkName} 
                        onChange={e => setNewLinkName(e.target.value)} 
                        className="h-14 rounded-2xl bg-white border-slate-100 font-bold px-6 focus:ring-primary/10" 
                      />
                      <Input 
                        placeholder="URL" 
                        value={newLinkUrl} 
                        onChange={e => setNewLinkUrl(e.target.value)} 
                        className="h-14 w-14 rounded-2xl bg-white border-slate-100 font-bold px-0 text-center focus:ring-primary/10 flex-none" 
                      />
                      <Button 
                        type="button" 
                        onClick={addLink} 
                        className="h-14 w-14 rounded-2xl shrink-0 p-0 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20"
                      >
                        <Plus size={24} strokeWidth={3} />
                      </Button>
                   </div>
                   <div className="space-y-3">
                      {links.map((l, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-primary/20 transition-all">
                          <div className="flex items-center gap-4 overflow-hidden">
                            <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0"><LinkIcon size={18} /></div>
                            <div className="overflow-hidden text-left">
                              <p className="text-[10px] font-black uppercase truncate leading-none">{l.name}</p>
                              <p className="text-[8px] font-bold text-muted-foreground truncate mt-1.5">{l.url}</p>
                            </div>
                          </div>
                          <button type="button" onClick={() => setLinks(links.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500 p-2 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div className="flex items-center justify-between ml-1">
                <div className="flex items-center gap-3">
                    <UserCheck size={16} className="text-primary" />
                    <Label className="text-[10px] font-black uppercase tracking-widest text-foreground">EXEMPTION MATRIX</Label>
                </div>
                <Badge className="bg-blue-600 text-white font-black text-[8px] uppercase tracking-widest border-none px-3 py-1 rounded-full shadow-lg">
                  {exemptedIds.length} MARKED
                </Badge>
              </div>
              <div className="p-4 bg-muted/5 rounded-[2.5rem] border border-slate-100 max-h-[300px] overflow-y-auto no-scrollbar grid grid-cols-1 gap-3 shadow-inner">
                 {enrolledStudents.map(s => (
                   <div 
                    key={s.id} 
                    onClick={() => toggleExempted(s.id)} 
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer shadow-sm", 
                      exemptedIds.includes(s.id) ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-50"
                    )}
                   >
                      <div className={cn(
                        "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-colors", 
                        exemptedIds.includes(s.id) ? "bg-primary border-primary text-white" : "border-slate-200"
                      )}>
                        <CheckCircle2 size={16} className={cn(exemptedIds.includes(s.id) ? "block" : "hidden")} />
                      </div>
                      <span className="text-xs font-black uppercase truncate tracking-tight">{s.name}</span>
                   </div>
                 ))}
              </div>
            </div>
          </div>

          {submissionType === 'quiz' && (
            <div className="space-y-6 pt-6 border-t border-slate-200/50">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                    <ListChecks size={18} />
                  </div>
                  <h3 className="font-black uppercase tracking-tighter text-xl text-slate-900">Quiz Architecture</h3>
                </div>
                <Button 
                  type="button" 
                  onClick={addQuestion} 
                  variant="outline" 
                  className="h-10 rounded-full px-6 font-black uppercase text-[9px] tracking-widest gap-2 border-2 border-slate-200 hover:bg-slate-900 hover:text-white transition-all active:scale-95 shadow-sm"
                >
                  <Plus size={14} /> Add Question
                </Button>
              </div>

              <div className="space-y-6">
                {questions.map((q, idx) => (
                    <div key={q.id} className="p-6 md:p-8 bg-white border border-slate-100 rounded-[2.5rem] space-y-6 relative group hover:border-primary/5 transition-all shadow-md">
                       <button onClick={() => removeQuestion(q.id)} className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-lg z-10"><Trash2 size={14}/></button>
                       <div className="flex flex-col sm:flex-row items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-[#6D1B0A] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-lg">{idx + 1}</div>
                          <div className="flex-1 w-full relative">
                            <Select value={q.type} onValueChange={(v: any) => updateQuestion(q.id, { type: v })}>
                               <SelectTrigger className="h-10 w-full rounded-full border-2 border-[#6D1B0A]/20 bg-white font-black text-[10px] uppercase tracking-widest px-6 focus:ring-0 focus:border-[#6D1B0A]"><SelectValue /></SelectTrigger>
                               <SelectContent className="rounded-xl font-bold">
                                  <SelectItem value="mcq">Multiple Choice</SelectItem>
                                  <SelectItem value="tf">True / False</SelectItem>
                                  <SelectItem value="identification">Identification</SelectItem>
                                  <SelectItem value="enumeration">Enumeration</SelectItem>
                                  <SelectItem value="explanation">Explanation</SelectItem>
                               </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border-2 border-slate-100 shrink-0">
                             <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Points:</Label>
                             <input type="number" value={q.points} onChange={e => updateQuestion(q.id, { points: Number(e.target.value) })} className="w-12 bg-transparent border-none text-center font-black text-base text-[#6D1B0A] outline-none" />
                          </div>
                       </div>
                    </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Optimized Footer */}
        <div className="p-6 md:p-10 bg-slate-50 border-t border-slate-100 flex-none flex items-center justify-between px-12 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-4">
               <Checkbox id="notify-create" checked={notifyStudents} onCheckedChange={(v) => setNotifyStudents(!!v)} className="h-6 w-6 border-primary rounded-lg shadow-sm" />
               <label htmlFor="notify-create" className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest text-slate-500 cursor-pointer hover:text-primary transition-colors">
                  <Mail size={16} /> SEND EMAIL BLAST
               </label>
            </div>
            <div className="flex items-center gap-8">
               <DialogClose asChild>
                 <button className="font-black uppercase text-[11px] tracking-[0.2em] text-slate-400 hover:text-red-500 transition-colors">ABORT</button>
               </DialogClose>
               <Button onClick={handleSubmit} disabled={loading} className="h-16 px-12 rounded-2xl bg-primary text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-primary/20 transition-all active:scale-95 gap-3">
                 {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Plus size={20} strokeWidth={3} />} DEPLOY ASSESSMENT
               </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
