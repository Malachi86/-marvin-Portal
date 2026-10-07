'use client';

import React, { useState, useEffect } from 'react';
import { 
    Monitor, 
    Plus, 
    Building, 
    ArrowLeft, 
    Pencil, 
    User as UserIcon, 
    RefreshCw, 
    AlertTriangle, 
    Building2,
    Users,
    Trash2,
    Save,
    MapPin,
    ShieldCheck,
    Loader2,
    ChevronDown,
    Clock,
    Edit3
} from 'lucide-react';
import { 
    getLabsAction, 
    addLabAction, 
    getRoomsAction, 
    addRoomAction, 
    getPcsAction, 
    updateLabAction, 
    updateRoomAction,
    deleteRoomAction,
    deleteLabAction,
    getAttendancesAction, 
    getUsersAction, 
    getSubjectsAction, 
    getSectionsAction,
    addSectionAction,
    updateSectionAction,
    deleteSectionAction,
    cleanupExpiredSessionsAction,
    forceResetAllLabsAction
} from "@/app/actions/dbActions";
import { Lab, Pc, Room, Attendance, User, Subject, Section } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDesc } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "sonner";
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

type PopulatedSession = Attendance & {
    student?: User;
    subject?: Subject;
    teacher?: User;
};

// --- PC History Internal Component ---
const PCHistoryView = ({ pc, lab, onBack }: { pc: Pc; lab: Lab; onBack: () => void; }) => {
    const [sessions, setSessions] = useState<PopulatedSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            const [allAttendances, allUsers, allSubjects] = await Promise.all([
                getAttendancesAction(),
                getUsersAction(),
                getSubjectsAction()
            ]);
            
            const pcSessions = allAttendances
                .filter((a: Attendance) => a.pcId === pc.id)
                .sort((a: Attendance, b: Attendance) => new Date(b.date).getTime() - new Date(a.date).getTime());
                
            const populatedSessions = pcSessions.map((sess: Attendance) => {
                const student = allUsers.find((u: User) => u.id === sess.studentId);
                const subject = allSubjects.find((s: Subject) => s.id === sess.subjectId);
                const teacher = allUsers.find((u: User) => u.id === subject?.teacherId);
                return { ...sess, student, subject, teacher };
            });

            setSessions(populatedSessions);
            setLoading(false);
        };
        fetchHistory();
    }, [pc.id]);

    return (
        <div className="animate-in fade-in duration-500">
            <Button variant="ghost" onClick={onBack} className="mb-4 rounded-full h-10 px-4 hover:bg-primary/5 font-black text-[10px] uppercase tracking-widest">
                <ArrowLeft className="mr-2 h-4 w-4"/> Back to {lab.name}
            </Button>
            <div className="flex items-center gap-4 mb-8">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <Monitor size={28} />
                </div>
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-primary uppercase">WORKSTATION PC-{pc.pcNumber}</h1>
                    <p className="text-muted-foreground font-bold uppercase text-[9px] tracking-[0.3em] mt-1">Usage Parity Log</p>
                </div>
            </div>
            
            <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-2xl bg-white">
                <div className="h-2 bg-primary" />
                <CardHeader className="bg-primary/5 p-8 border-b border-primary/5">
                    <CardTitle className="text-sm font-black uppercase tracking-widest">Signal History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? <div className="p-20 text-center flex flex-col items-center gap-3"><Loader2 className="animate-spin text-primary h-8 w-8"/><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Accessing Records...</p></div> : (
                        <div className="divide-y divide-primary/5">
                            {sessions.length === 0 && <p className="text-center text-muted-foreground py-20 font-black text-[10px] uppercase tracking-[0.2em] opacity-30">Registry Empty</p>}
                            {sessions.map(session => (
                                <div key={session.id} className="p-6 md:p-8 flex justify-between items-center hover:bg-primary/[0.02] transition-colors group">
                                    <div className="flex items-center gap-5">
                                        <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all shadow-inner">
                                            <UserIcon size={20} />
                                        </div>
                                        <div>
                                            <p className="font-black text-primary uppercase tracking-tight text-lg">{session.student?.name || 'Unknown Identity'}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">{session.subject?.name || 'Academic Activity'} • {session.student?.id}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-slate-800 tracking-tighter">{new Date(session.date).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                        <div className="flex items-center justify-end gap-2 mt-1">
                                            <Clock size={12} className="text-primary/40" />
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{session.timeIn} - {session.timeOut || 'ACTIVE'}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

// --- Lab Detailed Grid Internal Component ---
const LabDetailView = ({ lab, onBack, onSelectPc, onLabUpdated }: { lab: Lab; onBack: () => void; onSelectPc: (pc: Pc) => void; onLabUpdated: () => void; }) => {
    const [pcs, setPcs] = useState<Pc[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditDialogOpen, setEditDialogOpen] = useState(false);
    const [labFormData, setLabFormData] = useState({ name: lab.name, capacity: lab.capacity.toString() });

    useEffect(() => {
        const fetchPcs = async () => {
            setLoading(true);
            const allPcs = await getPcsAction();
            setPcs(allPcs.filter((p: Pc) => p.labId === lab.id).sort((a,b) => parseInt(a.pcNumber) - parseInt(b.pcNumber)));
            setLoading(false);
        };
        fetchPcs();
    }, [lab.id]);

    const handleSaveLab = async (e: React.FormEvent) => {
        e.preventDefault();
        await updateLabAction(lab.id, { name: labFormData.name, capacity: parseInt(labFormData.capacity) });
        toast.success("Registry updated.");
        setEditDialogOpen(false);
        onLabUpdated();
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-start mb-8 gap-6">
                <div>
                    <Button variant="ghost" onClick={onBack} className="mb-4 rounded-full h-10 px-4 hover:bg-primary/5 font-black text-[10px] uppercase tracking-widest">
                        <ArrowLeft className="mr-2 h-4 w-4"/> Back to Infrastructure
                    </Button>
                    <h1 className="text-4xl font-black text-primary uppercase tracking-tighter leading-none">{lab.name}</h1>
                    <p className="text-muted-foreground font-black text-[10px] tracking-[0.3em] mt-2 uppercase">Component Matrix Registry</p>
                </div>
                <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogTrigger asChild><Button variant="outline" className="rounded-2xl h-14 px-8 font-black uppercase text-[10px] tracking-widest border-2 border-primary/10 shadow-xl">Edit Registry</Button></DialogTrigger>
                    <DialogContent className="rounded-[2.5rem] p-10">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Modify Lab Definition</DialogTitle>
                            <DialogDescription className="text-xs font-medium text-muted-foreground mt-1 uppercase tracking-widest">Update parameters for this facility node</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSaveLab} className="space-y-6 pt-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Identification</Label>
                                <Input value={labFormData.name} onChange={e => setLabFormData({ ...labFormData, name: e.target.value })} className="h-14 rounded-2xl border-primary/5 bg-slate-50 font-bold px-6" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Workstation Threshold</Label>
                                <Input type="number" value={labFormData.capacity} onChange={e => setLabFormData({ ...labFormData, capacity: e.target.value })} className="h-14 rounded-2xl border-primary/5 bg-slate-50 font-bold px-6" />
                            </div>
                            <DialogFooter><Button type="submit" className="h-14 w-full rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs shadow-xl">Commit Updates</Button></DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            
            {loading ? <div className="p-32 text-center"><Loader2 className="animate-spin text-primary h-12 w-12 mx-auto" /></div> : (
                <Card className="rounded-[3rem] border-none shadow-2xl overflow-hidden bg-white">
                    <div className="bg-primary/5 p-10 flex items-center justify-between border-b border-primary/5">
                        <div>
                            <CardTitle className="text-xl font-black uppercase tracking-tighter">Terminal Signal Nodes</CardTitle>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">{pcs.length} WORKSTATIONS DETECTED</p>
                        </div>
                    </div>
                    <CardContent className="p-10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
                        {pcs.map(pc => (
                            <div key={pc.id} onClick={() => onSelectPc(pc)} className={`p-8 rounded-[2rem] border-2 text-center cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm group ${
                                pc.status === 'available' ? 'border-green-100 bg-green-50/30' :
                                pc.status === 'occupied' ? 'border-primary/20 bg-primary/5' :
                                'border-amber-100 bg-amber-50/30'
                            }`}>
                                <Monitor className={`mx-auto mb-4 h-10 w-10 transition-colors ${
                                    pc.status === 'available' ? 'text-green-600 group-hover:text-green-700' :
                                    pc.status === 'occupied' ? 'text-primary group-hover:text-primary' :
                                    'text-amber-600 group-hover:text-amber-700'
                                }`} />
                                <p className="font-black text-xs uppercase">PC-{pc.pcNumber}</p>
                                <Badge variant="secondary" className={`capitalize mt-4 font-black text-[8px] tracking-widest border-none shadow-inner h-6 px-3 ${
                                    pc.status === 'available' ? 'bg-green-500 text-white' :
                                    pc.status === 'occupied' ? 'bg-primary text-white animate-pulse' :
                                    'bg-amber-500 text-white'
                                }`}>{pc.status}</Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default function CampusInfrastructure() {
    const [labs, setLabs] = useState<Lab[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [teachers, setTeachers] = useState<User[]>([]);
    
    const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
    const [selectedPc, setSelectedPc] = useState<Pc | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCleaning, setIsCleaning] = useState(false);
    const [isForcing, setIsForcing] = useState(false);

    const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
    const [registrationType, setRegistrationType] = useState<'section' | 'lab'>('section');
    
    const [labForm, setLabForm] = useState({ name: '', capacity: '' });
    const [sectionForm, setSectionForm] = useState<Partial<Section>>({ name: '', gradeLevel: 1, department: 'college', advisoryTeacherId: '', roomNumber: '', capacity: 40 });

    const [editingSection, setEditingSection] = useState<Section | null>(null);
    const [isEditSectionOpen, setIsEditSectionOpen] = useState(false);

    const fetchData = async (runCleanup = true) => {
        setLoading(true);
        try {
            if(runCleanup) await cleanupExpiredSessionsAction();
            const [fetchedLabs, fetchedSections, fetchedUsers] = await Promise.all([
                getLabsAction(), getSectionsAction(), getUsersAction()
            ]);
            setLabs(fetchedLabs);
            setSections(fetchedSections);
            setTeachers(fetchedUsers.filter(u => u.role === 'teacher'));
            
            if (selectedLab) {
                const updatedLab = fetchedLabs.find((l: Lab) => l.id === selectedLab.id);
                setSelectedLab(updatedLab || null);
            }
        } catch (e) {
            toast.error("Failed to sync infrastructure matrix.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleCleanUp = async () => {
        setIsCleaning(true);
        const result = await cleanupExpiredSessionsAction();
        toast.success(`${result.updated} expired sessions cleared.`);
        await fetchData(false);
        setIsCleaning(false);
    }

    const handleForceReset = async () => {
        setIsForcing(true);
        try {
            const result = await forceResetAllLabsAction();
            toast.success("Total Lab Reset Complete", { description: `${result.closedSessions} active sessions auto-checked out.` });
            await fetchData(false);
        } catch (e) {
            toast.error("Force Reset Failed");
        } finally {
            setIsForcing(false);
        }
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (registrationType === 'lab') {
                const id = `LAB-${Date.now()}`;
                await addLabAction({ id, name: labForm.name, capacity: parseInt(labForm.capacity, 10) });
                toast.success("Laboratory provisioned.");
                setLabForm({ name: '', capacity: '' });
            } else {
                const teacher = teachers.find(t => t.id === sectionForm.advisoryTeacherId);
                const id = `SEC-${Date.now()}`;
                await addSectionAction({
                    ...sectionForm,
                    id,
                    advisoryTeacherName: teacher?.name || 'Unknown'
                } as Section);
                toast.success("Section & Room registered.");
                setSectionForm({ name: '', gradeLevel: 1, department: 'college', advisoryTeacherId: '', roomNumber: '', capacity: 40 });
            }
            fetchData(false);
            setIsRegistrationOpen(false);
        } catch (e) {
            toast.error("Registration failed.");
        }
    };

    const handleEditSection = (sec: Section) => {
        setEditingSection(sec);
        setSectionForm({
            name: sec.name,
            gradeLevel: sec.gradeLevel,
            department: sec.department,
            advisoryTeacherId: sec.advisoryTeacherId,
            roomNumber: sec.roomNumber,
            capacity: sec.capacity
        });
        setIsEditSectionOpen(true);
    };

    const handleUpdateSection = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSection) return;
        try {
            const teacher = teachers.find(t => t.id === sectionForm.advisoryTeacherId);
            await updateSectionAction(editingSection.id, {
                ...sectionForm,
                advisoryTeacherName: teacher?.name || 'Unknown'
            });
            toast.success("Section updated successfully.");
            setIsEditSectionOpen(false);
            setEditingSection(null);
            fetchData(false);
        } catch (e) {
            toast.error("Update failed.");
        }
    };

    const handleDeleteFacility = async (id: string) => {
        if (!confirm(`Permanently terminate records for this laboratory?`)) return;
        await deleteLabAction(id);
        toast.success("Registry purged.");
        fetchData(false);
    };

    const handleDeleteSection = async (id: string) => {
        if (!confirm('Permanently terminate this section roster?')) return;
        await deleteSectionAction(id);
        toast.success("Section purged.");
        fetchData(false);
    }

    if (loading) return <div className="flex flex-col items-center justify-center p-32 space-y-4"><Loader2 className="animate-spin text-primary h-12 w-12" strokeWidth={3}/><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Synchronizing Matrix...</p></div>;
    if (selectedPc && selectedLab) return <PCHistoryView pc={selectedPc} lab={selectedLab} onBack={() => setSelectedPc(null)} />;
    if (selectedLab) return <LabDetailView lab={selectedLab} onBack={() => setSelectedLab(null)} onSelectPc={setSelectedPc} onLabUpdated={() => fetchData(false)} />;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6 px-2">
            <div className="space-y-1">
                <h1 className="text-5xl font-black text-primary tracking-tighter uppercase leading-none">CAMPUS REGISTRY</h1>
                <p className="text-muted-foreground font-black text-[11px] tracking-[0.4em] mt-3 uppercase opacity-80">PHYSICAL INFRASTRUCTURE CONTROL V2.0</p>
            </div>
            
            <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-3">
                    <Button 
                        onClick={handleCleanUp} 
                        className="rounded-xl h-14 px-8 gap-3 border-none shadow-xl font-black uppercase text-[10px] tracking-widest bg-white text-slate-800 hover:bg-slate-50 transition-all active:scale-95" 
                        disabled={isCleaning}
                    >
                        <RefreshCw className={cn("h-4 w-4", isCleaning && "animate-spin")} />
                        CLEAN SESSIONS
                    </Button>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button 
                                variant="destructive" 
                                className="rounded-xl h-14 px-8 gap-3 font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95" 
                                disabled={isForcing}
                            >
                                <AlertTriangle className="h-4 w-4" />
                                INSTITUTE LOCKDOWN
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2.5rem] p-10 border-none shadow-3xl bg-white">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-3xl font-black text-primary uppercase tracking-tight">CRITICAL OVERRIDE</AlertDialogTitle>
                                <AlertDialogDescription className="text-base font-bold text-muted-foreground mt-6 leading-relaxed" asChild>
                                    <div>
                                        This action will <span className="text-destructive underline decoration-2">AUTO-DISMISS</span> every active student session on campus terminals.
                                        <br/><br/>
                                        <div className="p-6 bg-red-50 rounded-2xl border-2 border-red-100 space-y-3">
                                            <div className="flex items-center gap-3 text-red-700 text-xs font-black uppercase"><ShieldCheck size={16}/> Records Preserved</div>
                                            <div className="flex items-center gap-3 text-red-700 text-xs font-black uppercase"><Monitor size={16}/> Workstations Released</div>
                                        </div>
                                    </div>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-10 gap-3">
                                <AlertDialogCancel className="rounded-xl h-14 font-black uppercase text-[10px] tracking-widest">Abort Protocol</AlertDialogCancel>
                                <AlertDialogAction onClick={handleForceReset} className="rounded-xl h-14 bg-destructive text-white hover:bg-destructive/90 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-900/20">Execute Override</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>

                <Dialog open={isRegistrationOpen} onOpenChange={setIsRegistrationOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-xl h-12 px-8 bg-[#6D1B0A] text-white hover:bg-[#521408] shadow-2xl font-black uppercase text-[10px] tracking-widest gap-2 transition-all active:scale-95">
                            <Plus className="h-4 w-4"/> REGISTER FACILITY
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[3rem] p-10 max-w-2xl overflow-hidden">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Provision Campus Asset</DialogTitle>
                            <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Select category to define infrastructure node</DialogDescription>
                        </DialogHeader>

                        <div className="mt-8 space-y-8">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Asset Category</Label>
                                <div className="relative group">
                                    <select 
                                        value={registrationType}
                                        onChange={(e: any) => setRegistrationType(e.target.value)}
                                        className="w-full h-14 bg-slate-50 border-2 border-primary/10 rounded-2xl px-6 font-black text-xs uppercase tracking-widest appearance-none outline-none focus:border-primary transition-all shadow-inner"
                                    >
                                        <option value="section">Academic Section & Room</option>
                                        <option value="lab">Computer Laboratory</option>
                                    </select>
                                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40 pointer-events-none" />
                                </div>
                            </div>

                            <form onSubmit={handleRegister} className="space-y-6 animate-in slide-in-from-top-2 duration-500">
                                {registrationType === 'section' ? (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Section Identity</Label>
                                                <Input value={sectionForm.name} onChange={e => setSectionForm({...sectionForm, name: e.target.value})} placeholder="e.g. 11-STEM A" className="h-14 rounded-xl border-primary/10 font-bold bg-slate-50"/>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Room Designation</Label>
                                                <Input value={sectionForm.roomNumber} onChange={e => setSectionForm({...sectionForm, roomNumber: e.target.value})} placeholder="e.g. Room 302" className="h-14 rounded-xl border-primary/10 font-bold bg-slate-50"/>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Department</Label>
                                                <Select value={sectionForm.department} onValueChange={(v: any) => setSectionForm({...sectionForm, department: v})}>
                                                    <SelectTrigger className="h-14 rounded-xl border-primary/10 bg-slate-50 font-bold"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value="college" className="font-bold">College</SelectItem>
                                                        <SelectItem value="shs" className="font-bold">Senior High</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Grade / Year</Label>
                                                <Input type="number" value={sectionForm.gradeLevel} onChange={e => setSectionForm({...sectionForm, gradeLevel: parseInt(e.target.value)})} className="h-14 rounded-xl border-primary/10 font-bold bg-slate-50"/>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Advisory Teacher</Label>
                                                <Select value={sectionForm.advisoryTeacherId} onValueChange={v => setSectionForm({...sectionForm, advisoryTeacherId: v})}>
                                                    <SelectTrigger className="h-14 rounded-xl border-primary/10 bg-slate-50 font-bold"><SelectValue placeholder="Assign Instructor" /></SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        {teachers.map(t => <SelectItem key={t.id} value={t.id} className="font-bold">{t.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Room Capacity</Label>
                                                <Input type="number" value={sectionForm.capacity} onChange={e => setSectionForm({...sectionForm, capacity: parseInt(e.target.value)})} className="h-14 rounded-xl border-primary/10 font-bold bg-slate-50"/>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Lab Name / Label</Label>
                                            <Input value={labForm.name} onChange={e => setLabForm({...labForm, name: e.target.value})} placeholder="e.g. CompLab 1" className="h-14 rounded-xl border-primary/10 font-bold bg-slate-50"/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Max Workstations</Label>
                                            <Input type="number" value={labForm.capacity} onChange={e => setLabForm({...labForm, capacity: e.target.value})} className="h-14 rounded-xl border-primary/10 font-bold bg-slate-50"/>
                                        </div>
                                    </div>
                                )}
                                <DialogFooter>
                                    <Button type="submit" className="h-16 w-full rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20">
                                        Commit Registry Entry
                                    </Button>
                                </DialogFooter>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
      
        <Tabs defaultValue="sections">
            <div className="flex justify-start mt-16 px-2">
                <TabsList className="bg-white h-16 p-2 rounded-full shadow-[0_15px_50px_rgba(0,0,0,0.08)] inline-flex gap-2">
                    <TabsTrigger value="sections" className="rounded-[1.25rem] font-black uppercase text-[10px] tracking-widest px-10 h-full data-[state=active]:bg-[#6D1B0A] data-[state=active]:text-white transition-all gap-3 shadow-none">
                        <Users size={16}/> SECTIONS & ROOMS
                    </TabsTrigger>
                    <TabsTrigger value="labs" className="rounded-[1.25rem] font-black uppercase text-[10px] tracking-widest px-10 h-full data-[state=active]:bg-[#6D1B0A] data-[state=active]:text-white transition-all gap-3 shadow-none">
                        <Monitor size={16}/> LABORATORIES
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="sections" className="animate-in slide-in-from-bottom-6 duration-700 mt-12">
                {sections.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 opacity-20">
                        <Users size={120} strokeWidth={1.5} />
                        <p className="font-black uppercase tracking-[0.4em] text-sm mt-8">NO ACTIVE SECTIONS IN REGISTRY</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
                        {sections.map(sec => (
                            <Card key={sec.id} className="rounded-[2.5rem] border-none shadow-xl bg-white hover:shadow-2xl transition-all group overflow-hidden flex flex-col">
                                <div className="h-1.5 bg-primary/10 group-hover:bg-primary transition-colors" />
                                <div className="p-8 space-y-6 flex-1">
                                    <div className="flex justify-between items-start">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner"><Building size={22}/></div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={() => handleEditSection(sec)} className="h-10 w-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"><Edit3 size={16}/></button>
                                            <button onClick={() => handleDeleteSection(sec.id)} className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-primary uppercase tracking-tight leading-none mb-2">{sec.name}</h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{sec.department.toUpperCase()} • GRADE {sec.gradeLevel}</p>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-primary/5 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1">Room Designation</p>
                                                <p className="font-black text-xs text-slate-800 uppercase">{sec.roomNumber}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1">Seat Capacity</p>
                                                <p className="font-black text-xs text-slate-800">{sec.capacity} Seats</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1">Advisory Official</p>
                                            <div className="flex items-center gap-3">
                                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-[9px]">{sec.advisoryTeacherName?.[0]}</div>
                                                <p className="font-bold text-xs text-slate-800 uppercase truncate">{sec.advisoryTeacherName}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </TabsContent>

            <TabsContent value="labs" className="animate-in slide-in-from-bottom-6 duration-700 mt-12">
                {labs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 opacity-20">
                        <Monitor size={120} strokeWidth={1.5} />
                        <p className="font-black uppercase tracking-[0.4em] text-sm mt-8">NO LABORATORIES PROVISIONED</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
                        {labs.map(lab => (
                            <Card key={lab.id} className="rounded-[2.5rem] border-none shadow-xl bg-white hover:shadow-2xl transition-all group overflow-hidden">
                                <div className="h-1.5 bg-[#14343A]/20 group-hover:bg-[#14343A] transition-colors" />
                                <div className="p-8 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className="h-12 w-12 rounded-2xl bg-[#14343A]/5 flex items-center justify-center text-[#14343A] group-hover:bg-[#14343A] group-hover:text-white transition-all shadow-inner"><Monitor size={22}/></div>
                                        <button onClick={() => handleDeleteFacility(lab.id)} className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-primary uppercase tracking-tight leading-none mb-2">{lab.name}</h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Capacity Matrix: {lab.capacity} Units</p>
                                    </div>
                                    <Button onClick={() => setSelectedLab(lab)} className="w-full h-14 rounded-2xl bg-[#14343A] text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-black/10 hover:scale-[1.02] transition-transform">
                                        Workstation Hub
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </TabsContent>
        </Tabs>

        {/* Edit Section Dialog */}
        <Dialog open={isEditSectionOpen} onOpenChange={setIsEditSectionOpen}>
            <DialogContent className="rounded-[3rem] p-10 max-w-2xl overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tight">Modify Section Protocol</DialogTitle>
                    <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Update parameters for this academic node</DialogDescription>
                </DialogHeader>

                <div className="mt-8">
                    <form onSubmit={handleUpdateSection} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Section Identity</Label>
                                <Input value={sectionForm.name} onChange={e => setSectionForm({...sectionForm, name: e.target.value})} className="h-14 rounded-xl border-primary/10 font-bold bg-slate-50"/>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Room Designation</Label>
                                <Input value={sectionForm.roomNumber} onChange={e => setSectionForm({...sectionForm, roomNumber: e.target.value})} className="h-14 rounded-xl border-primary/10 font-bold bg-slate-50"/>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Department</Label>
                                <Select value={sectionForm.department} onValueChange={(v: any) => setSectionForm({...sectionForm, department: v})}>
                                    <SelectTrigger className="h-14 rounded-xl border-primary/10 bg-slate-50 font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="college" className="font-bold">College</SelectItem>
                                        <SelectItem value="shs" className="font-bold">Senior High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Grade / Year</Label>
                                <Input type="number" value={sectionForm.gradeLevel} onChange={e => setSectionForm({...sectionForm, gradeLevel: parseInt(e.target.value)})} className="h-14 rounded-xl border-primary/10 font-bold bg-slate-50"/>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Advisory Teacher</Label>
                                <Select value={sectionForm.advisoryTeacherId} onValueChange={v => setSectionForm({...sectionForm, advisoryTeacherId: v})}>
                                    <SelectTrigger className="h-14 rounded-xl border-primary/10 bg-slate-50 font-bold"><SelectValue placeholder="Assign Instructor" /></SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {teachers.map(t => <SelectItem key={t.id} value={t.id} className="font-bold">{t.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Room Capacity</Label>
                                <Input type="number" value={sectionForm.capacity} onChange={e => setSectionForm({...sectionForm, capacity: parseInt(e.target.value)})} className="h-14 rounded-xl border-primary/10 font-bold bg-slate-50"/>
                            </div>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="submit" className="h-16 w-full rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs shadow-xl">
                                Commit Subject Update
                            </Button>
                        </DialogFooter>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    </div>
  );
}
