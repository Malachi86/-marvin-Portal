'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Classwork, QuizAnswer } from '@/utils/storage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { addSubmissionAction } from '@/app/actions/dbActions';
import { toast } from 'sonner';
import { Loader2, Link as LinkIcon, Send, ListTodo, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubmitWorkDialogProps {
  classwork: Classwork;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function SubmitWorkDialog({ classwork, onClose, onSubmitted }: SubmitWorkDialogProps) {
  const { user } = useAuth();
  const [textAnswer, setTextAnswer] = useState('');
  const [links, setLinks] = useState<{ name: string, url: string }[]>([]);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const addLink = () => {
    if (!newLinkName || !newLinkUrl) {
      toast.error("Please provide both Link Name and URL.");
      return;
    }
    setLinks([...links, { name: newLinkName, url: newLinkUrl }]);
    setNewLinkName('');
    setNewLinkUrl('');
  };

  const removeLink = (idx: number) => {
    setLinks(links.filter((_, i) => i !== idx));
  };

  const handleQuizAnswer = (qId: string, value: string) => {
    setQuizAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (classwork.submissionType === 'file') {
      if (links.length === 0 && !textAnswer.trim()) {
        toast.error("Please provide your work links or a text response.");
        return;
      }
    } else {
      const questionsCount = classwork.questions?.length || 0;
      if (Object.keys(quizAnswers).length < questionsCount) {
        toast.error("Sagutan ang lahat ng tanong bago mag-submit.");
        return;
      }
    }

    setLoading(true);

    try {
      const formattedQuizAnswers: QuizAnswer[] = classwork.questions?.map(q => {
        const studentValue = quizAnswers[q.id] || '';
        let earnedPoints = 0;
        if (q.type === 'mcq' || q.type === 'tf') {
          if (q.correctAnswer === studentValue) earnedPoints = q.points;
        } else if (q.type === 'identification') {
          if (q.correctAnswer?.toLowerCase().trim() === studentValue.toLowerCase().trim()) earnedPoints = q.points;
        } else if (q.type === 'enumeration') {
          const correctItems = q.correctAnswer?.split(',').map(i => i.trim().toLowerCase()) || [];
          const studentItems = studentValue.split(',').map(i => i.trim().toLowerCase());
          const matchingCount = studentItems.filter(item => correctItems.includes(item)).length;
          earnedPoints = Math.round((matchingCount / Math.max(1, correctItems.length)) * q.points);
        }
        return { questionId: q.id, value: studentValue, earnedPoints };
      }) || [];

      await addSubmissionAction({
        classworkId: classwork.id,
        studentId: user.id,
        textAnswer: textAnswer,
        files: links,
        quizAnswers: formattedQuizAnswers,
        status: 'submitted',
      });
      
      toast.success("Work submitted! Awaiting teacher review.");
      onSubmitted();
    } catch (err) {
      toast.error("Submission failure.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !m-0 !rounded-none !p-0 border-none flex flex-col !left-0 !top-0 !translate-x-0 !translate-y-0 !transform-none z-[200] bg-white",
          "[&>button]:text-white [&>button]:z-[210] [&>button]:h-8 [&>button]:w-8 [&>button]:top-4 [&>button]:right-6"
        )}
      >
        <div className="bg-primary p-4 md:p-5 text-white flex-none shadow-xl relative z-[205]">
          <div className="max-w-5xl mx-auto w-full">
            <DialogHeader>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shadow-inner border border-white/10 shrink-0">
                  <ListTodo size={20} className="text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl md:text-2xl font-black uppercase tracking-tighter leading-none">SUBMIT ASSESSMENT</DialogTitle>
                  <DialogDescription className="text-white/70 font-bold uppercase text-[8px] tracking-[0.2em] mt-1">
                    {classwork.title} • {classwork.type.replace('_', ' ').toUpperCase()}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-10 bg-slate-50/30">
          <div className="max-w-5xl mx-auto w-full space-y-8">
            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
              <p className="text-[8px] font-black uppercase text-primary/40 tracking-[0.2em] mb-1.5">INSTRUCTIONAL PROTOCOL</p>
              <p className="text-base font-medium text-slate-600 leading-relaxed italic">
                {classwork.description || 'Please complete the requirements for this activity.'}
              </p>
            </div>

            {classwork.submissionType === 'file' ? (
              <div className="space-y-8">
                <div className="p-8 md:p-12 border-4 border-dashed rounded-[2.5rem] border-slate-200 bg-white shadow-inner">
                  <div className="h-12 w-12 rounded-2xl bg-primary/5 mx-auto flex items-center justify-center text-primary mb-4 border border-primary/10">
                    <LinkIcon size={20} />
                  </div>
                  <Label className="font-black uppercase text-center text-[10px] tracking-widest text-slate-500 block mb-6">UPLOAD WORK REPOSITORY (ASSET LINKS)</Label>
                  
                  <div className="space-y-4 max-w-2xl mx-auto">
                      <div className="flex flex-col sm:flex-row gap-3">
                          <Input placeholder="Link Label" value={newLinkName} onChange={e => setNewLinkName(e.target.value)} className="h-12 rounded-xl flex-1 font-bold bg-slate-50 border-none px-5" />
                          <div className="flex gap-2 flex-[2]">
                              <Input placeholder="URL (https://...)" value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} className="h-12 rounded-xl flex-1 font-bold bg-slate-50 border-none px-5" />
                              <Button type="button" onClick={addLink} className="h-12 w-12 rounded-xl shadow-lg bg-primary text-white shrink-0"><Plus size={20} /></Button>
                          </div>
                      </div>

                      {links.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                              {links.map((link, i) => (
                                  <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-[1.25rem] shadow-md group hover:border-primary/20 transition-all">
                                      <div className="flex items-center gap-3 overflow-hidden">
                                          <div className="h-8 w-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0"><LinkIcon size={14} /></div>
                                          <div className="overflow-hidden">
                                              <p className="font-black text-[11px] text-slate-800 uppercase tracking-tight truncate">{link.name}</p>
                                              <p className="text-[8px] font-bold text-muted-foreground truncate">{link.url}</p>
                                          </div>
                                      </div>
                                      <Button variant="ghost" size="icon" onClick={() => removeLink(i)} className="text-red-500 h-8 w-8 rounded-xl hover:bg-red-50"><Trash2 size={14} /></Button>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-3">SUPPLEMENTARY NOTES</Label>
                  <Textarea value={textAnswer} onChange={e => setTextAnswer(e.target.value)} className="rounded-[2rem] p-6 md:p-8 border-none bg-white shadow-xl min-h-[160px] font-medium text-base leading-relaxed focus:ring-2 focus:ring-primary/10 outline-none" placeholder="Provide additional context for your submission..." />
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {classwork.questions?.map((q, idx) => (
                  <div key={q.id} className="p-8 md:p-10 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <span className="h-8 w-8 rounded-[0.75rem] bg-primary text-white flex items-center justify-center font-black text-sm shadow-lg shadow-primary/20">{idx + 1}</span>
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">{q.type.toUpperCase()}</p>
                      </div>
                      <span className="font-black text-[8px] uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full border border-slate-200 text-slate-600">{q.points} POINTS</span>
                    </div>
                    
                    <h3 className="text-lg md:text-xl font-black text-slate-800 mb-8 leading-tight tracking-tight">
                      {q.text}
                    </h3>
                    
                    <div className="space-y-3">
                      {q.type === 'mcq' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {q.options?.map((opt, optIdx) => (
                            <button 
                              key={optIdx} 
                              type="button" 
                              onClick={() => handleQuizAnswer(q.id, opt)} 
                              className={cn(
                                "p-5 rounded-[1.25rem] border-2 text-left font-black text-sm transition-all active:scale-[0.98]", 
                                quizAnswers[q.id] === opt 
                                  ? "bg-primary/5 border-primary text-primary shadow-lg" 
                                  : "bg-slate-50/50 border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-white"
                              )}
                            >
                              <span className="opacity-30 mr-2 font-black">{String.fromCharCode(65 + optIdx)}.</span> {opt}
                            </button>
                          ))}
                        </div>
                      )}

                      {q.type === 'tf' && (
                        <div className="flex gap-3">
                          {['True', 'False'].map(opt => (
                            <button 
                              key={opt} 
                              type="button" 
                              onClick={() => handleQuizAnswer(q.id, opt)} 
                              className={cn(
                                "h-14 px-8 rounded-[1.25rem] border-2 font-black text-base tracking-tight transition-all flex-1 active:scale-[0.98]", 
                                quizAnswers[q.id] === opt 
                                  ? "bg-primary/5 border-primary text-primary shadow-lg" 
                                  : "bg-slate-50/50 border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-white"
                              )}
                            >
                              {opt.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      )}

                      {q.type === 'identification' && (
                        <Input 
                          placeholder="Type your answer precisely..." 
                          value={quizAnswers[q.id] || ''} 
                          onChange={e => handleQuizAnswer(q.id, e.target.value)} 
                          className="h-14 rounded-xl border-2 border-slate-100 bg-slate-50/50 font-black text-base px-6 focus:border-primary focus:bg-white transition-all" 
                        />
                      )}

                      {q.type === 'enumeration' && (
                        <div className="space-y-2">
                          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-primary/40 ml-2">REQUIRED LIST (SEPARATED BY COMMAS)</p>
                          <Input 
                            placeholder="Item 1, Item 2, Item 3..." 
                            value={quizAnswers[q.id] || ''} 
                            onChange={e => handleQuizAnswer(q.id, e.target.value)} 
                            className="h-14 rounded-xl border-2 border-slate-100 bg-slate-50/50 font-black text-base px-6 focus:border-primary focus:bg-white transition-all" 
                          />
                        </div>
                      )}

                      {q.type === 'explanation' && (
                        <div className="space-y-2">
                          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-primary/40 ml-2">EXPANDED RESPONSE / ESSAY</p>
                          <Textarea 
                            value={quizAnswers[q.id] || ''} 
                            onChange={e => handleQuizAnswer(q.id, e.target.value)} 
                            className="min-h-[180px] rounded-[1.5rem] p-6 border-2 border-slate-100 bg-slate-50/50 font-medium text-base leading-relaxed focus:border-primary focus:bg-white transition-all" 
                            placeholder="Detailed explanation here..." 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 md:p-5 bg-white border-t border-slate-100 flex-none shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.05)] relative z-[205]">
          <div className="max-w-5xl mx-auto w-full flex items-center justify-between px-2">
            <DialogClose asChild>
              <button className="font-black uppercase text-[9px] tracking-[0.2em] text-slate-400 hover:text-primary transition-colors py-2 px-5 rounded-full hover:bg-primary/5">EXIT WITHOUT SAVING</button>
            </DialogClose>
            <Button onClick={handleSubmit} disabled={loading} className="h-12 md:h-14 px-8 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all active:scale-95 disabled:grayscale gap-3">
              {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Send size={16} />} 
              FINALIZE SUBMISSION
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
