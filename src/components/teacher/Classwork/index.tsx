'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSubjectsAction, getClassworksAction, getSubmissionsAction } from '@/app/actions/dbActions';
import { Subject, Classwork as ClassworkType, Submission } from '@/utils/storage';
import { Loader2, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import SubjectClasswork from './SubjectClasswork';

export default function Classwork() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  useEffect(() => {
    if (user) {
      loadSubjects();
    }
  }, [user]);

  const loadSubjects = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [allSubjects, allClassworks, allSubmissions] = await Promise.all([
        getSubjectsAction(),
        getClassworksAction(),
        getSubmissionsAction()
      ]);

      const mySubjects = allSubjects.filter((s: Subject) => s.teacherId === user.id);
      
      const subjectsWithSubmissions = mySubjects.map(s => {
        const subjectCWIds = allClassworks.filter(cw => cw.subjectId === s.id).map(cw => cw.id);
        const pendingSubs = allSubmissions.filter(sub => subjectCWIds.includes(sub.classworkId) && sub.status === 'submitted').length;
        return { ...s, pendingSubs };
      });

      setSubjects(subjectsWithSubmissions);

      // Deep Linking Logic
      const signal = localStorage.getItem('notif_deep_link');
      if (signal) {
        const { subjectId, classworkId, type } = JSON.parse(signal);
        if (type === 'submission') {
          const targetSubj = mySubjects.find(s => s.id === subjectId);
          if (targetSubj) {
            setSelectedSubject(targetSubj);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary"/></div>
  }

  if (selectedSubject) {
    return <SubjectClasswork subject={selectedSubject} onBack={() => {
      setSelectedSubject(null);
      localStorage.removeItem('notif_deep_link');
    }} />;
  }

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-3xl mb-2 font-black uppercase tracking-tighter text-primary">Classwork Management</h2>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-8">Select a subject to manage tasks and view submissions.</p>

      {subjects.length === 0 ? (
         <div className="bg-white rounded-[2.5rem] border-primary/5 shadow-xl p-20 text-center">
            <BookOpen size={64} className="mx-auto mb-6 text-primary opacity-20" />
            <p className="text-muted-foreground font-black uppercase text-xs tracking-widest">You have not created any subjects.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {subjects.map(subject => (
                <Card 
                    key={subject.id} 
                    className="cursor-pointer hover:shadow-2xl transition-all hover:-translate-y-1 rounded-[2rem] border-primary/5 bg-white relative group overflow-hidden"
                    onClick={() => setSelectedSubject(subject)}
                >
                    <div className="h-1.5 bg-primary" />
                    {subject.pendingSubs > 0 && (
                        <div className="absolute top-0 right-0 z-20">
                            <div className="relative">
                                <div className="bg-red-600 text-white w-10 h-10 rounded-bl-[2rem] flex items-start justify-end p-2 shadow-lg">
                                    <span className="text-[10px] font-black">{subject.pendingSubs}</span>
                                </div>
                                <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full animate-ping opacity-40" />
                            </div>
                        </div>
                    )}
                    <CardContent className="p-8">
                        <h3 className="font-black text-xl text-primary leading-tight uppercase group-hover:text-primary/80 transition-colors mb-2">{subject.name}</h3>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          {subject.schedules?.map((s: any) => s.day).join(', ')}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
      )}
    </div>
  );
}
