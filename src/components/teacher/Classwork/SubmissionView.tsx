'use client';

import React, { useState, useEffect } from 'react';
import { Classwork, Submission, User, Enrollment, QuizQuestion } from '@/utils/storage';
import { getSubmissionsAction, getUsersAction, getEnrollmentsAction, updateSubmissionAction } from '@/app/actions/dbActions';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, User as UserIcon, Send, CheckCircle2, Link as LinkIcon, ExternalLink, UserCheck, HelpCircle, ListChecks, FileX } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SubmissionsViewProps {
  classwork: Classwork;
  onBack: () => void;
}

type StudentWithSubmission = {
  student: User;
  submission: Submission | null;
  isExempted: boolean;
};

export default function SubmissionsView({ classwork, onBack }: SubmissionsViewProps) {
  const [studentsWithSubmissions, setStudentsWithSubmissions] = useState<StudentWithSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSubmissions();
  }, [classwork]);

  const loadSubmissions = async () => {
    setLoading(true);
    const [allSubmissions, allUsers, allEnrollments] = await Promise.all([
      getSubmissionsAction(),
      getUsersAction(),
      getEnrollmentsAction()
    ]);

    const enrolledStudents = allEnrollments
      .filter(en => en.subjectId === classwork.subjectId && en.status === 'approved')
      .map(en => allUsers.find(u => u.id === en.studentId))
      .filter((u): u is User => !!u);
      
    const classworkSubmissions = allSubmissions.filter(sub => sub.classworkId === classwork.id);

    const combinedData = enrolledStudents.map(student => {
      const submission = classworkSubmissions.find(s => s.studentId === student.id) || null;
      const isExempted = classwork.exemptedStudentIds?.includes(student.id) || false;
      return { student, submission, isExempted };
    });
    
    const initialGrades: Record<string, string> = {};
    const initialFeedbacks: Record<string, string> = {};

    combinedData.forEach(({ student, submission, isExempted }) => {
        if (isExempted) {
            initialGrades[student.id] = classwork.totalPoints.toString();
            initialFeedbacks[student.id] = 'EXEMPTED: Auto-Perfect Score';
        } else if(submission?.id) {
            initialGrades[submission.id] = submission.grade?.toString() || '';
            initialFeedbacks[submission.id] = submission.feedback || '';
        }
    });

    setGrades(initialGrades);
    setFeedbacks(initialFeedbacks);
    setStudentsWithSubmissions(combinedData);
    setLoading(false);
  };

  const handleGradeSubmission = async (submissionId: string) => {
    const grade = grades[submissionId];
    const feedback = feedbacks[submissionId];
    if(!grade) {
        toast.warning("Maglagay ng score para ma-finalize.");
        return;
    }
    try {
        await updateSubmissionAction(submissionId, {
            grade: parseFloat(grade),
            feedback: feedback,
            status: 'graded'
        });
        toast.success("Grade saved! Content purged.");
        loadSubmissions();
    } catch (e) {
        toast.error("Failed to save grade.");
    }
  };

  const renderQuizResponses = (submission: Submission) => {
    if (submission.status === 'graded') {
        return (
            <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
                <FileX className="text-slate-300 h-8 w-8" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Response details purged after grading.</p>
            </div>
        );
    }

    if (!classwork.questions || !submission.quizAnswers) return null;

    return (
      <div className="space-y-6 pt-6 border-t border-primary/5">
        <div className="flex items-center gap-3 mb-4">
          <ListChecks className="text-primary h-5 w-5" />
          <Label className="text-[11px] font-black uppercase tracking-widest text-slate-800">QUIZ RESPONSES:</Label>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {classwork.questions.map((q, idx) => {
            const answer = submission.quizAnswers?.find(a => a.questionId === q.id);
            const isCorrect = q.type !== 'identification' 
              ? answer?.value === q.correctAnswer 
              : answer?.value?.toLowerCase().trim() === q.correctAnswer?.toLowerCase().trim();

            return (
              <div key={q.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded bg-primary/10 text-primary flex items-center justify-center font-black text-[10px]">{idx + 1}</span>
                    <p className="font-bold text-sm text-slate-700">{q.text}</p>
                  </div>
                  <div className="ml-9">
                    <p className="text-xs text-muted-foreground font-medium">
                      Student Answer: <span className={cn("font-black uppercase", isCorrect ? "text-green-600" : "text-red-500")}>{answer?.value || 'NO ANSWER'}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                      Correct: {q.correctAnswer}
                    </p>
                  </div>
                </div>
                <div className="flex-none text-right">
                  <Badge className={cn("px-3 py-1 rounded-lg font-black text-[10px] tracking-widest", isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                    {answer?.earnedPoints || 0} / {q.points} PTS
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
        <div>
          <Button variant="ghost" onClick={onBack} className="mb-4 hover:bg-primary/5 rounded-full p-0 h-auto">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Load
          </Button>
          <h2 className="text-4xl font-black text-primary uppercase tracking-tighter leading-none">{classwork.title}</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2">
            {classwork.submissionType === 'quiz' ? 'Automated Quiz Evaluation' : 'Link-Based Asset Evaluation'}
          </p>
        </div>
        <div className="bg-primary/5 px-8 py-4 rounded-[2rem] border-2 border-primary/10 text-center">
          <p className="text-[9px] font-black text-primary uppercase tracking-widest">MAX POINTS</p>
          <p className="text-2xl font-black text-primary leading-none mt-1">{classwork.totalPoints} PTS</p>
        </div>
      </div>

      <div className="space-y-8">
        {studentsWithSubmissions.map(({ student, submission, isExempted }) => {
          const isGraded = submission?.status === 'graded' || isExempted;
          const subId = isExempted ? student.id : (submission?.id || '');
          
          return (
            <div key={student.id} className={cn("bg-white rounded-[2rem] border shadow-sm overflow-hidden p-8 md:p-10", isExempted ? "border-blue-100 bg-blue-50/10" : "border-slate-100")}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border border-slate-100 bg-slate-50">
                    <AvatarImage src={student.profilePic} />
                    <AvatarFallback className="bg-slate-100 text-slate-400"><UserIcon size={24} /></AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-black text-xl text-slate-800 uppercase leading-none tracking-tight">{student.name}</h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mt-1.5">ID: {student.id}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isExempted && <Badge className="bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest gap-2"><UserCheck size={12} /> EXEMPTED</Badge>}
                  {submission && <Badge className={cn("px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest", submission.status === 'graded' ? "bg-green-500 text-white" : "bg-green-50 text-green-600 border border-green-100")}>{submission.status === 'graded' ? "GRADED" : "SUBMITTED"}</Badge>}
                </div>
              </div>

              {submission && (
                <div className="space-y-8">
                  {classwork.submissionType === 'file' ? (
                    <>
                      <div className="space-y-4">
                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-800 ml-1">ASSET LINKS:</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {submission.status === 'graded' ? (
                             <div className="col-span-2 p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
                                <FileX className="text-slate-300 h-8 w-8" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Links removed after grading.</p>
                             </div>
                          ) : (
                            <>
                              {submission.files?.map((link, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                  <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="h-9 w-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0"><LinkIcon size={18} /></div>
                                    <div className="overflow-hidden">
                                      <p className="font-bold text-xs text-slate-700 truncate">{link.name}</p>
                                      <p className="text-[9px] font-bold text-muted-foreground truncate">{link.url}</p>
                                    </div>
                                  </div>
                                  <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-full hover:bg-slate-50">
                                    <a href={link.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} /></a>
                                  </Button>
                                </div>
                              ))}
                              {(!submission.files || submission.files.length === 0) && (
                                <div className="p-4 bg-slate-50 rounded-xl text-xs font-bold text-slate-400 uppercase italic">No links provided. Check text response below.</div>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-800 ml-1">TEXT RESPONSE:</Label>
                        <div className="bg-slate-50/80 rounded-3xl p-8 border border-slate-50 text-sm font-medium text-slate-600 leading-relaxed shadow-inner">
                          {submission.status === 'graded' ? "Content purged after grading." : (submission.textAnswer || "No text provided.")}
                        </div>
                      </div>
                    </>
                  ) : (
                    renderQuizResponses(submission)
                  )}

                  <div className="bg-white border border-red-100 rounded-[2.5rem] p-8 md:p-10 flex flex-col lg:flex-row items-end lg:items-center gap-10">
                    <div className="flex-none space-y-3 w-full lg:w-auto">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-[#D1432A] ml-1">SCORE /</Label>
                      <div className="flex items-center gap-4">
                        <Input type="number" value={grades[subId] || ''} onChange={e => setGrades(g => ({...g, [subId]: e.target.value}))} disabled={isGraded} className="h-16 w-32 rounded-2xl text-center font-black text-2xl text-slate-800" />
                        <span className="text-xl font-bold text-slate-300">/ {classwork.totalPoints}</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-3 w-full">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-[#D1432A] ml-1">FEEDBACK</Label>
                      <Input value={feedbacks[subId] || ''} onChange={e => setFeedbacks(f => ({...f, [subId]: e.target.value}))} disabled={isGraded} placeholder="Instructional feedback..." className="h-16 rounded-2xl px-8 font-medium" />
                    </div>
                    <div className="flex-none w-full lg:w-auto">
                      {!isGraded ? (
                        <Button onClick={() => handleGradeSubmission(subId)} className="h-16 w-full lg:w-auto px-10 bg-[#D1432A] text-white font-black uppercase text-xs rounded-2xl shadow-xl gap-3">
                          <Send size={18} /> SAVE GRADE
                        </Button>
                      ) : (
                        <div className="h-16 flex items-center justify-center px-10 bg-green-500 rounded-2xl shadow-xl gap-3 text-white">
                          <CheckCircle2 size={24} /> <span className="font-black uppercase text-xs tracking-widest">FINALIZED</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
