'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Clock, Calendar, ArrowLeft, Loader2, Plus, Trash2, School, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { addSubjectAction, getTermsAction } from '@/app/actions/dbActions';
import { Schedule, Term } from '@/utils/storage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AddSubjectPage() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [termId, setTermId] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [activeTerms, setActiveTerms] = useState<Term[]>([]);
  const [fetchingTerms, setFetchingTerms] = useState(true);
  const [schedules, setSchedules] = useState<Partial<Schedule>[]>([{ day: '', startTime: '', dismissalTime: '' }]);

  useEffect(() => {
    const init = async () => {
      setFetchingTerms(true);
      try {
        const data = await getTermsAction();
        const active = data.filter((t: any) => t.status === 'active');
        setActiveTerms(active);
        if (active.length > 0) {
          setTermId(active[0].id);
        }
      } catch (e) {
        toast({ variant: "destructive", title: "Error", description: "Could not sync academic terms." });
      } finally {
        setFetchingTerms(false);
      }
    };
    init();
  }, [toast]);

  const handleScheduleChange = (index: number, field: keyof Schedule, value: string) => {
    const newSchedules = [...schedules];
    newSchedules[index] = { ...newSchedules[index], [field]: value };
    setSchedules(newSchedules);
  };

  const addSchedule = () => {
    setSchedules([...schedules, { day: '', startTime: '', dismissalTime: '' }]);
  };

  const removeSchedule = (index: number) => {
    if (schedules.length <= 1) return;
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    if (!title || !termId || schedules.some(s => !s.day || !s.startTime || !s.dismissalTime)) {
        toast({ variant: "destructive", title: "Missing Fields", description: "Please fill out subject title, academic term, and all schedule fields." });
        setLoading(false);
        return;
    }

    try {
      const newSubject = {
        id: `SUB-${Date.now()}`,
        name: title,
        teacherId: user.id,
        teacherName: user.name,
        termId: termId,
        department: user.department,
        schedules: schedules as Schedule[],
        description: '',
      };
      
      await addSubjectAction(newSubject);
      toast({ title: "Subject Added", description: `${title} has been recorded in the database.` });
      router.push("/");
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to save", description: "Could not write to database file." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" asChild className="hover:bg-primary/5">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 flex justify-center">
        <Card className="w-full max-w-2xl border-primary/10 shadow-2xl rounded-[3rem] overflow-hidden">
          <div className="h-3 bg-primary" />
          <CardHeader className="text-center pt-10">
            <CardTitle className="text-3xl font-black text-primary uppercase tracking-tighter">New Subject</CardTitle>
            <CardDescription className="font-bold text-[10px] uppercase tracking-widest mt-2">Enter academic session details</CardDescription>
          </CardHeader>
          <CardContent className="p-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1"><BookOpen className="h-3 w-3 text-primary" /> Subject Title</Label>
                <Input 
                  placeholder="e.g. Data Structures" 
                  required 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  className="h-14 rounded-2xl border-primary/10 font-bold px-6"
                />
              </div>

              <div className="space-y-4">
                <Label className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1"><School className="h-3 w-3 text-primary" /> Academic Term</Label>
                
                {!fetchingTerms && activeTerms.length === 0 && (
                  <Alert variant="destructive" className="rounded-2xl bg-red-50 border-red-100">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="font-black uppercase text-[10px]">System Locked</AlertTitle>
                    <AlertDescription className="text-[10px] font-bold">
                      Walang Active Academic Term sa system. Mangyaring kontakin ang Admin para mag-activate ng bagong Trimester.
                    </AlertDescription>
                  </Alert>
                )}

                <Select value={termId} onValueChange={setTermId} disabled={fetchingTerms || activeTerms.length === 0}>
                  <SelectTrigger className="h-14 rounded-2xl border-2 border-primary font-bold px-6 bg-white">
                    <SelectValue placeholder={fetchingTerms ? "Syncing Database..." : "Select Active Term"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {activeTerms.map(t => (
                        <SelectItem key={t.id} value={t.id} className="font-bold">{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

               <div className="space-y-4">
                <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground flex items-center gap-2 ml-1"><Calendar className="h-3 w-3 text-primary" /> Schedules</Label>
                {schedules.map((schedule, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-6 border rounded-[1.5rem] bg-muted/5 relative">
                     <div className="space-y-1">
                      <Label htmlFor={`day-${index}`} className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Day</Label>
                       <Select value={schedule.day} onValueChange={(v) => handleScheduleChange(index, 'day', v)}>
                          <SelectTrigger className="h-12 rounded-xl bg-white">
                            <SelectValue placeholder="Day" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                          </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`time-${index}`} className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Start</Label>
                      <Input 
                        id={`time-${index}`}
                        type="time"
                        value={schedule.startTime} 
                        onChange={e => handleScheduleChange(index, 'startTime', e.target.value)} 
                        className="h-12 rounded-xl bg-white px-4"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`dismissal-${index}`} className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Dismissal</Label>
                      <Input
                        id={`dismissal-${index}`}
                        type="time"
                        value={schedule.dismissalTime}
                        onChange={e => handleScheduleChange(index, 'dismissalTime', e.target.value)}
                        className="h-12 rounded-xl bg-white px-4"
                      />
                    </div>
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeSchedule(index)} disabled={schedules.length <= 1} className="h-12 w-12 rounded-xl shrink-0">
                        <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
                 <Button type="button" variant="outline" className="w-full h-14 rounded-2xl border-dashed border-2 font-black uppercase text-[10px] tracking-widest gap-2" onClick={addSchedule}>
                  <Plus className="h-4 w-4"/> Add Schedule Block
                </Button>
              </div>


              <div className="pt-6">
                <Button type="submit" className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-xl shadow-primary/20 uppercase tracking-widest text-xs" disabled={loading || activeTerms.length === 0}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                  {loading ? "Publishing..." : "Publish Subject"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
