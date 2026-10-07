'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { addSubjectAction, getTermsAction } from '@/app/actions/dbActions';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, BookOpen, Trash2, Loader2, School, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Schedule, Term } from '@/utils/storage';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface AddSubjectDialogProps {
    onSubjectAdded: () => void;
}

export default function AddSubjectDialog({ onSubjectAdded }: AddSubjectDialogProps) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [units, setUnits] = useState('3');
    const [termId, setTermId] = useState('');
    const [description, setDescription] = useState('');
    const [schedules, setSchedules] = useState<Schedule[]>([{ day: '', startTime: '', dismissalTime: '' }]);
    const [activeTerms, setActiveTerms] = useState<Term[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingTerms, setFetchingTerms] = useState(false);

    const loadTerms = async () => {
        setFetchingTerms(true);
        try {
            const data = await getTermsAction();
            const active = data.filter((t: any) => t.status === 'active');
            setActiveTerms(active);
            if (active.length > 0 && !termId) {
                setTermId(active[0].id);
            }
        } catch (e) {
            console.error("Term fetch error", e);
        } finally {
            setFetchingTerms(false);
        }
    };

    useEffect(() => {
        if (open) {
            loadTerms();
        }
    }, [open]);

    const handleScheduleChange = (index: number, field: keyof Schedule, value: string) => {
        const newSchedules = [...schedules];
        newSchedules[index] = { ...newSchedules[index], [field]: value };
        setSchedules(newSchedules);
    };

    const addSchedule = () => setSchedules([...schedules, { day: '', startTime: '', dismissalTime: '' }]);
    const removeSchedule = (idx: number) => schedules.length > 1 && setSchedules(schedules.filter((_, i) => i !== idx));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !termId || schedules.some(s => !s.day || !s.startTime || !s.dismissalTime)) {
            toast.error('Mangyaring punan ang lahat ng required fields.');
            return;
        }
        setLoading(true);
        try {
            await addSubjectAction({
                id: `SUB-${Date.now()}`,
                name,
                code,
                units: parseInt(units),
                teacherId: user!.id,
                teacherName: user!.name,
                department: user!.department,
                termId,
                schedules,
                description
            });
            toast.success('Subject successfully provisioned!');
            setOpen(false);
            resetForm();
            onSubjectAdded();
        } catch (e) {
            toast.error("Failed to add subject.");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setName('');
        setCode('');
        setUnits('3');
        setDescription('');
        setTermId('');
        setSchedules([{ day: '', startTime: '', dismissalTime: '' }]);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-full h-12 px-8 bg-primary text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl shadow-primary/20">
                    <Plus className="w-4 h-4" /> Provision Subject
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-t-[2rem] sm:rounded-[2.5rem] border-none shadow-2xl h-[95vh] sm:h-auto flex flex-col">
                <div className="bg-primary p-6 md:p-10 text-white flex-none">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-2xl md:text-3xl font-black uppercase tracking-tighter">
                            <BookOpen className="w-6 h-6 md:w-8 md:h-8" /> New Subject Registration
                        </DialogTitle>
                        <DialogDescription className="text-white/70 font-bold uppercase text-[9px] md:text-[10px] tracking-widest mt-2">
                            Associate course load with an active academic term
                        </DialogDescription>
                    </DialogHeader>
                </div>
                
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 bg-white">
                    <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 no-scrollbar">
                        {!fetchingTerms && activeTerms.length === 0 && (
                            <Alert variant="destructive" className="rounded-2xl border-none bg-red-50">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle className="font-black uppercase text-[10px]">Academic Lock</AlertTitle>
                                <AlertDescription className="text-[10px] font-bold">
                                    Walang Active Academic Term sa system. Mangyaring kontakin ang Admin para mag-activate ng trimester.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Subject Code</Label>
                                <Input placeholder="e.g. CS101" value={code} onChange={e => setCode(e.target.value)} className="h-14 rounded-2xl border-primary/10 font-bold px-6" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Subject Title *</Label>
                                <Input placeholder="e.g. Data Structures" value={name} onChange={e => setName(e.target.value)} required className="h-14 rounded-2xl border-primary/10 font-bold px-6" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Units</Label>
                                <Input type="number" value={units} onChange={e => setUnits(e.target.value)} className="h-14 rounded-2xl border-primary/10 font-bold px-6" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Academic Term *</Label>
                                <Select 
                                    value={termId} 
                                    onValueChange={setTermId} 
                                    disabled={fetchingTerms || activeTerms.length === 0}
                                >
                                    <SelectTrigger className="h-14 rounded-2xl border-2 border-primary font-bold px-6 bg-white">
                                        <SelectValue placeholder={fetchingTerms ? "Syncing..." : "Select Active Term"} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        {activeTerms.map(t => (
                                            <SelectItem key={t.id} value={t.id} className="font-bold">{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 ml-1">
                                <School className="h-3 w-3 text-primary" /> Schedule Matrix *
                            </Label>
                            {schedules.map((s, idx) => (
                                <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 md:p-6 bg-muted/20 border rounded-2xl relative">
                                    <div className="sm:col-span-1">
                                        <Select value={s.day} onValueChange={v => handleScheduleChange(idx, 'day', v)}>
                                            <SelectTrigger className="h-12 rounded-xl border-primary/5 bg-white"><SelectValue placeholder="Day" /></SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Input type="time" value={s.startTime} onChange={e => handleScheduleChange(idx, 'startTime', e.target.value)} className="h-12 rounded-xl border-primary/5 bg-white px-4" />
                                    <Input type="time" value={s.dismissalTime} onChange={e => handleScheduleChange(idx, 'dismissalTime', e.target.value)} className="h-12 rounded-xl border-primary/5 bg-white px-4" />
                                    <Button type="button" variant="destructive" size="icon" onClick={() => removeSchedule(idx)} disabled={schedules.length <= 1} className="h-12 w-full sm:w-12 rounded-xl shrink-0">
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" onClick={addSchedule} className="w-full h-14 rounded-2xl border-dashed border-2 font-black uppercase text-[10px] tracking-widest gap-2">
                                <Plus className="h-4 w-4" /> Add Schedule Block
                            </Button>
                        </div>

                        <div className="space-y-2 pb-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Course Notes</Label>
                            <Textarea placeholder="Instructional objectives..." value={description} onChange={e => setDescription(e.target.value)} className="rounded-2xl p-6 border-primary/10 min-h-[120px] font-medium" />
                        </div>
                    </div>

                    <div className="p-6 md:p-10 bg-slate-50/50 border-t border-slate-100 flex-none flex flex-col-reverse sm:flex-row gap-3 md:gap-4">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="flex-1 h-14 md:h-16 rounded-2xl font-black uppercase text-xs tracking-widest">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || activeTerms.length === 0} className="flex-1 h-14 md:h-16 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20">
                            {loading ? <Loader2 className="animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            {loading ? 'Processing...' : 'Provision Load'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
