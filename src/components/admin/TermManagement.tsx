'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Calendar, 
    Plus, 
    CheckCircle, 
    XCircle, 
    Loader2, 
    School, 
    Pencil, 
    AlertCircle, 
    History, 
    UserPlus, 
    Clock, 
    Archive,
    Users,
    ArrowLeft,
    Search,
    Building2,
    X,
    Activity,
    ShieldCheck,
    Trash2,
    Save,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { 
    getTermsAction, 
    addTermAction, 
    endTermAction, 
    updateTermAction, 
    getTermEnrollmentsAction, 
    updateTermEnrollmentAction, 
    getUsersAction 
} from '@/app/actions/dbActions';
import { Term, TermEnrollment, User } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    AlertDialog, 
    AlertDialogTrigger,
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

const StatBox = ({ icon: Icon, label, value, color, description }: any) => (
  <Card className="p-3 rounded-2xl border border-slate-100 shadow-sm bg-white flex flex-col justify-between min-h-[90px] transition-all hover:border-primary/20 group relative overflow-hidden">
    <div className="flex justify-between items-start relative z-10">
      <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shadow-sm", color || "bg-primary/5 text-primary")}>
        <Icon size={14} />
      </div>
      {description && (
        <span className="text-[7px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">
          {description}
        </span>
      )}
    </div>
    <div className="relative z-10 mt-1">
      <p className="text-[8px] font-bold text-slate-500 mb-0.5 uppercase tracking-widest">{label}</p>
      <span className="text-lg font-bold tracking-tight text-slate-900">{value}</span>
    </div>
    <Icon size={40} className="absolute -right-2 -bottom-2 opacity-[0.02] transition-transform group-hover:scale-110" />
  </Card>
);

export default function TermManagement() {
    const [terms, setTerms] = useState<Term[]>([]);
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [selectedRosterTerm, setSelectedRosterTerm] = useState<Term | null>(null);
    const [rosterSearch, setRosterSearch] = useState('');
    const [rosterPage, setRosterPage] = useState(1);
    const ROSTER_PAGE_SIZE = 10;

    const [newTermName, setNewTermName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingTerm, setEditingTerm] = useState<Term | null>(null);
    const [editTermName, setEditTermName] = useState('');
    const [editStartDate, setEditStartDate] = useState('');
    const [editEndDate, setEditEndDate] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [allTerms, allTermEnrollments, allUsers] = await Promise.all([
                getTermsAction(),
                getTermEnrollmentsAction(),
                getUsersAction()
            ]);
            
            const populatedEnrollments = allTermEnrollments.map(en => {
                const student = allUsers.find(u => u.id === en.studentId);
                const term = allTerms.find(t => t.id === en.termId);
                return { ...en, studentName: student?.name, studentDetails: student, termName: term?.name };
            });

            setTerms(allTerms.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            setEnrollments(populatedEnrollments);
        } catch (e) {
            toast.error("Failed to load registry signals.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAddTerm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTermName.trim() || !startDate || !endDate) {
            toast.error("Required fields missing.");
            return;
        }
        setIsSaving(true);
        try {
            await addTermAction(newTermName, startDate, endDate);
            toast.success("Academic cycle deployed.");
            setNewTermName(''); setStartDate(''); setEndDate('');
            fetchData();
        } catch (e) {
            toast.error("Activation failed.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateTerm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTerm || !editTermName.trim() || !editStartDate || !editEndDate) {
            toast.error("Required fields missing.");
            return;
        }
        setIsSaving(true);
        try {
            await updateTermAction(editingTerm.id, {
                name: editTermName,
                startDate: editStartDate,
                endDate: editEndDate
            });
            toast.success("Cycle modified.");
            setIsEditDialogOpen(false);
            fetchData();
        } catch (e) {
            toast.error("Modification failed.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEndTerm = async (term: Term) => {
        setLoading(true);
        try {
            await endTermAction(term.id);
            toast.success(`Cycle ${term.name} finalized and archived.`);
            fetchData();
        } catch (e) {
            toast.error("Finalization failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEnrollment = async (id: string, status: 'approved' | 'rejected') => {
        try {
            await updateTermEnrollmentAction(id, status);
            toast.success(`Enrollment ${status}.`);
            fetchData();
        } catch (e) {
            toast.error("Validation failed.");
        }
    };

    if (loading && terms.length === 0) return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <Loader2 className="animate-spin h-8 w-8 text-primary" strokeWidth={3} />
        <p className="text-[9px] font-bold text-slate-400 animate-pulse uppercase tracking-widest">Syncing matrix...</p>
      </div>
    );

    const pendingEnrollments = enrollments.filter(e => e.status === 'pending');
    const activeTerms = terms.filter(t => t.status === 'active');
    const archivedTermsCount = terms.filter(t => t.status === 'ended').length;

    if (selectedRosterTerm) {
        const fullRoster = enrollments
            .filter(e => e.termId === selectedRosterTerm.id && e.status === 'approved')
            .filter(e => 
                (e.studentName || "").toLowerCase().includes(rosterSearch.toLowerCase()) || 
                e.studentId.toLowerCase().includes(rosterSearch.toLowerCase())
            );

        const totalRosterPages = Math.ceil(fullRoster.length / ROSTER_PAGE_SIZE);
        const paginatedRoster = fullRoster.slice((rosterPage - 1) * ROSTER_PAGE_SIZE, rosterPage * ROSTER_PAGE_SIZE);

        return (
            <div className="space-y-6 animate-in fade-in duration-500 pb-20 max-w-[1200px] mx-auto">
                {/* Image-Style Header */}
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setSelectedRosterTerm(null)} 
                        className="h-10 w-10 rounded-full flex items-center justify-center text-primary hover:bg-primary/5 transition-all"
                    >
                        <ArrowLeft size={24} strokeWidth={3} />
                    </button>
                    <div className="space-y-0.5">
                        <h2 className="text-2xl font-black text-primary tracking-tight leading-none uppercase">
                            {selectedRosterTerm.name} ROSTER
                        </h2>
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">Official Registry</p>
                    </div>
                </div>

                {/* Search & Identity Count (Pic 2 Style) */}
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative group flex-1 w-full">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/20 group-focus-within:text-primary transition-colors" size={20} strokeWidth={3} />
                        <Input 
                            placeholder="Search student identity..." 
                            value={rosterSearch}
                            onChange={(e) => { setRosterSearch(e.target.value); setRosterPage(1); }}
                            className="h-16 pl-16 rounded-full border-none bg-white shadow-xl font-bold text-base"
                        />
                    </div>
                    <Badge className="h-16 px-8 rounded-full bg-primary/5 text-primary border-none shadow-xl flex items-center gap-3 transition-transform hover:scale-105">
                        <Users size={20} strokeWidth={3} />
                        <span className="font-black text-xs uppercase tracking-widest">{fullRoster.length} identities</span>
                    </Badge>
                </div>

                {/* Registry Table (High-Fidelity) */}
                <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white">
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-primary/[0.02] border-b border-primary/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                    <th className="px-10 py-6 text-left">STUDENT IDENTITY</th>
                                    <th className="px-10 py-6 text-left">ACADEMIC LOAD</th>
                                    <th className="px-10 py-6 text-center">STATUS PROTOCOL</th>
                                    <th className="px-10 py-6 text-right">REGISTRATION DATE</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-primary/5">
                                {paginatedRoster.length === 0 ? (
                                    <tr><td colSpan={4} className="p-24 text-center text-muted-foreground font-black text-sm opacity-20 uppercase tracking-[0.4em]">No matching entries</td></tr>
                                ) : (
                                    paginatedRoster.map(en => (
                                        <tr key={en.id} className="hover:bg-primary/[0.01] transition-colors group">
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-6">
                                                    <Avatar className="h-14 w-14 border-2 border-primary/5 shadow-inner">
                                                        <AvatarImage src={en.studentDetails?.profilePic} />
                                                        <AvatarFallback className="bg-muted text-primary font-black text-xl">{en.studentName ? en.studentName[0] : '?'}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-black text-primary uppercase text-sm group-hover:scale-[1.01] transition-transform origin-left">{en.studentName}</p>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1.5">{en.studentId}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <p className="font-black text-slate-700 uppercase text-xs">{en.studentDetails?.program || 'N/A'}</p>
                                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1.5">YEAR {en.studentDetails?.year || '?'}</p>
                                            </td>
                                            <td className="px-10 py-6 text-center">
                                                <Badge className="bg-green-500 text-white font-black text-[9px] uppercase tracking-[0.2em] border-none px-4 py-1.5 shadow-lg shadow-green-500/20">AUTHORIZED</Badge>
                                            </td>
                                            <td className="px-10 py-6 text-right font-black text-slate-300 text-[10px] tracking-widest tabular-nums">
                                                {format(new Date(en.enrolledAt), 'MMM dd, yyyy').toUpperCase()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Pagination Console */}
                {totalRosterPages > 1 && (
                    <div className="flex items-center justify-between px-6 pt-4">
                        <Button 
                            variant="ghost" 
                            disabled={rosterPage === 1} 
                            onClick={() => setRosterPage(p => p - 1)}
                            className="h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 bg-white shadow-lg border border-primary/5"
                        >
                            <ChevronLeft size={16} /> Previous Page
                        </Button>
                        <span className="font-black text-[10px] text-muted-foreground uppercase tracking-widest">
                            Page {rosterPage} of {totalRosterPages}
                        </span>
                        <Button 
                            variant="ghost" 
                            disabled={rosterPage === totalRosterPages} 
                            onClick={() => setRosterPage(p => p + 1)}
                            className="h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 bg-white shadow-lg border border-primary/5"
                        >
                            Next Page <ChevronRight size={16} />
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-[1100px] mx-auto">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-2 px-2">
                <div className="space-y-0.5">
                    <h1 className="text-2xl font-black tracking-tighter text-[#0f172a] leading-none uppercase">ACADEMIC REGISTRY</h1>
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">System Monitor v1.0</p>
                    </div>
                </div>
                <Badge variant="outline" className="rounded-lg px-2 py-1 text-[7px] font-bold bg-white shadow-sm border-slate-200 uppercase tracking-widest">
                    <ShieldCheck size={10} className="mr-1.5 text-green-600" />
                    Protocol: Encrypted
                </Badge>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-2">
                <StatBox icon={School} label="Active cycles" value={activeTerms.length} color="bg-emerald-50 text-emerald-600" description="Current" />
                <StatBox icon={UserPlus} label="Pending requests" value={pendingEnrollments.length} color="bg-amber-50 text-amber-600" description="Queued" />
                <StatBox icon={Archive} label="Archive registry" value={archivedTermsCount} color="bg-slate-50 text-slate-700" description="Records" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch px-2">
                
                {/* Activation Terminal */}
                <div className="lg:col-span-3">
                    <Card className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden bg-white h-full flex flex-col">
                        <div className="bg-slate-50/50 px-5 py-3 border-b border-slate-100">
                            <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">Deploy cycle</h3>
                        </div>

                        <CardContent className="p-4 space-y-4">
                            <form onSubmit={handleAddTerm} className="space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-[8px] font-bold text-slate-400 ml-1 uppercase">Cycle label</Label>
                                    <Input 
                                        value={newTermName} 
                                        onChange={e => setNewTermName(e.target.value)} 
                                        placeholder="SY 2025-26" 
                                        required 
                                        className="h-8 rounded-lg border-slate-200 bg-slate-50 px-3 font-bold text-[9px] uppercase focus:ring-primary/10"
                                    />
                                </div>

                                <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                                    <div className="space-y-1">
                                        <Label className="text-[8px] font-bold text-slate-500 ml-1 uppercase text-[7px]">Start</Label>
                                        <div className="relative">
                                            <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-primary/40 pointer-events-none" />
                                            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="h-7 rounded-md border-slate-200 bg-white pl-7 text-[8px] font-bold" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[8px] font-bold text-slate-500 ml-1 uppercase text-[7px]">End</Label>
                                        <div className="relative">
                                            <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-primary/40 pointer-events-none" />
                                            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="h-7 rounded-md border-slate-200 bg-white pl-7 text-[8px] font-bold" />
                                        </div>
                                    </div>
                                </div>

                                <Button 
                                    type="submit" 
                                    disabled={isSaving}
                                    className="w-full h-8 rounded-lg bg-[#6D1B0A] hover:bg-[#521408] text-white font-bold text-[8px] shadow-sm gap-2 mt-2 uppercase tracking-widest"
                                >
                                    {isSaving ? <Loader2 className="animate-spin h-3 w-3" /> : <Plus size={10} />}
                                    Deploy term
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Registry Terminal */}
                <div className="lg:col-span-9">
                    <Card className="rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden bg-white min-h-[400px] h-full flex flex-col">
                        <Tabs defaultValue="live" className="flex flex-col h-full">
                            <div className="bg-slate-50/50 px-5 py-3 flex flex-col lg:flex-row items-center justify-between gap-3 border-b border-slate-100">
                                <TabsList className="bg-white border border-slate-200 h-8 p-1 rounded-full shadow-sm w-full md:w-auto">
                                    <TabsTrigger value="live" className="flex-1 md:flex-none rounded-full px-4 font-black uppercase text-[8px] tracking-widest data-[state=active]:bg-[#6D1B0A] data-[state=active]:text-white transition-all">Live</TabsTrigger>
                                    <TabsTrigger value="pending" className="flex-1 md:flex-none rounded-full px-4 font-black uppercase text-[8px] tracking-widest data-[state=active]:bg-[#6D1B0A] data-[state=active]:text-white transition-all">Requests ({pendingEnrollments.length})</TabsTrigger>
                                    <TabsTrigger value="archive" className="flex-1 md:flex-none rounded-full px-4 font-black uppercase text-[8px] tracking-widest data-[state=active]:bg-[#6D1B0A] data-[state=active]:text-white transition-all">Archive</TabsTrigger>
                                </TabsList>
                            </div>

                            <CardContent className="flex-1 p-0 bg-white overflow-y-auto no-scrollbar">
                                <TabsContent value="live" className="m-0 p-3 space-y-2">
                                    {activeTerms.length === 0 ? (
                                        <div className="p-10 text-center text-muted-foreground font-bold text-[9px] opacity-40 uppercase tracking-widest">No active cycles found</div>
                                    ) : (
                                        activeTerms.map(term => (
                                            <div key={term.id} className="p-4 rounded-[2rem] border border-slate-100 bg-white hover:bg-slate-50/30 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm group">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-9 w-9 rounded-xl bg-[#f8f5f4] flex items-center justify-center text-[#6D1B0A] shrink-0 border border-[#f1ebe9] shadow-inner">
                                                        <Building2 size={16} />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <h3 className="text-xs font-black text-slate-900 leading-tight uppercase tracking-tight">{term.name}</h3>
                                                        <div className="flex items-center gap-2">
                                                            <Badge className="bg-[#e6fcf5] text-[#20c997] font-black text-[7px] uppercase tracking-tighter border-none px-1.5 py-0.5 rounded-full h-auto">Active</Badge>
                                                            <div className="flex items-center gap-1 text-[8px] font-bold text-slate-300 tabular-nums">
                                                                <Calendar size={8} className="opacity-40" />
                                                                {format(new Date(term.startDate), 'MMM dd')} - {format(new Date(term.endDate), 'MMM dd, yyyy')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={() => setSelectedRosterTerm(term)} 
                                                            className="h-8 px-5 bg-white border border-slate-200 rounded-full shadow-sm text-[8px] font-black text-slate-800 uppercase flex items-center gap-1.5 hover:bg-slate-50 transition-all active:scale-95"
                                                        >
                                                            <Users size={12} /> ROSTER REGISTRY
                                                        </button>
                                                        
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <button className="h-8 px-5 bg-[#fff5f5] text-[#e03131] font-black text-[8px] rounded-full uppercase hover:bg-[#ffe3e3] transition-all active:scale-95 shadow-sm">
                                                                    FINALIZE CYCLE
                                                                </button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent className="rounded-3xl p-6 border-none shadow-2xl max-w-sm">
                                                                <AlertDialogHeader>
                                                                    <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 mb-2 mx-auto sm:mx-0">
                                                                        <AlertCircle size={20} />
                                                                    </div>
                                                                    <AlertDialogTitle className="text-lg font-black text-primary uppercase">Finalize Cycle?</AlertDialogTitle>
                                                                    <AlertDialogDescription className="text-xs font-medium text-muted-foreground mt-2 leading-relaxed uppercase tracking-tighter">
                                                                        Ending this cycle will finalize grades and clear subjects for the next trimester. 
                                                                        <span className="text-red-600 underline block mt-2">ROSTER PRESERVED IN ARCHIVE.</span>
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter className="mt-6 gap-2">
                                                                    <AlertDialogCancel className="h-9 rounded-xl font-black text-[9px] uppercase tracking-widest">Abort</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleEndTerm(term)} className="h-9 rounded-xl bg-[#6D1B0A] text-white font-black text-[9px] uppercase tracking-widest">Finalize</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>

                                                    <button 
                                                        onClick={() => { setEditingTerm(term); setEditTermName(term.name); setEditStartDate(term.startDate || ''); setEditEndDate(term.endDate || ''); setIsEditDialogOpen(true); }} 
                                                        className="h-8 w-8 rounded-full border border-slate-100 bg-white flex items-center justify-center text-slate-300 hover:text-primary hover:border-primary/20 transition-all shadow-md group/edit"
                                                    >
                                                        <Pencil size={12} className="group-hover/edit:scale-110 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </TabsContent>

                                <TabsContent value="pending" className="m-0 p-3.5 space-y-2">
                                    {pendingEnrollments.length === 0 ? (
                                        <div className="p-10 text-center text-muted-foreground font-bold text-[9px] opacity-40 uppercase tracking-widest">Registry clear</div>
                                    ) : (
                                        pendingEnrollments.map(en => (
                                            <div key={en.id} className="p-3.5 rounded-xl border border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary shadow-inner"><UserPlus size={14} /></div>
                                                    <div>
                                                        <p className="font-black text-[10px] text-slate-900 uppercase tracking-tight">{en.studentName}</p>
                                                        <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Target: {en.termName}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button className="h-7 px-3 bg-green-600 hover:bg-green-700 text-white font-black text-[8px] uppercase rounded-lg shadow-sm" onClick={() => handleUpdateEnrollment(en.id, 'approved')}>Authorize</Button>
                                                    <Button variant="ghost" className="h-7 px-3 text-red-600 hover:bg-red-50 font-black text-[8px] uppercase rounded-lg" onClick={() => handleUpdateEnrollment(en.id, 'rejected')}>Deny</Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </TabsContent>

                                <TabsContent value="archive" className="m-0 p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {terms.filter(t => t.status === 'ended').length === 0 ? (
                                        <div className="md:col-span-2 p-10 text-center text-muted-foreground font-bold text-[9px] opacity-40 uppercase tracking-widest border-2 border-dashed rounded-2xl border-slate-50">Archive registry empty</div>
                                    ) : (
                                        terms.filter(t => t.status === 'ended').map(term => (
                                            <div 
                                                key={term.id} 
                                                className="p-4 rounded-[1.25rem] bg-slate-50 border border-slate-100 shadow-inner group opacity-80 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer hover:bg-white hover:shadow-md" 
                                                onClick={() => setSelectedRosterTerm(term)}
                                            >
                                                <div className="h-8 w-8 rounded-[0.5rem] bg-primary/5 flex items-center justify-center text-primary/20 mb-3 group-hover:text-primary transition-all">
                                                    <History size={16} />
                                                </div>
                                                <h3 className="font-black text-xs mb-0.5 text-slate-800 uppercase tracking-tight leading-tight">{term.name}</h3>
                                                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest tabular-nums">
                                                    {format(new Date(term.startDate), 'yyyy')} CYCLE
                                                </p>
                                                <div className="mt-3">
                                                    <span className="text-[8px] font-black text-[#6D1B0A] uppercase tracking-widest hover:underline decoration-1 underline-offset-2">View roster</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </TabsContent>
                            </CardContent>
                        </Tabs>
                    </Card>
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="rounded-[2rem] p-0 overflow-hidden border-none shadow-3xl max-w-sm bg-white">
                    <div className="bg-[#6D1B0A] p-6 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black uppercase tracking-tight">Modify cycle</DialogTitle>
                            <DialogDescription className="text-white/70 font-bold text-[8px] uppercase tracking-widest mt-1">Academic parameters protocol</DialogDescription>
                        </DialogHeader>
                    </div>
                    <form onSubmit={handleUpdateTerm} className="p-6 space-y-6 bg-white">
                        <div className="space-y-1">
                            <Label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-1">Updated label</Label>
                            <Input value={editTermName} onChange={e => setEditTermName(e.target.value)} required className="h-9 rounded-xl border-slate-200 bg-slate-50 font-black px-4 text-[10px] focus:ring-primary/10" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-1">Start</Label>
                                <Input type="date" value={editStartDate} onChange={e => setEditStartDate(e.target.value)} required className="h-8 rounded-lg border-slate-200 bg-slate-50 font-bold px-3 text-[9px]" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-1">End</Label>
                                <Input type="date" value={editEndDate} onChange={e => setEditEndDate(e.target.value)} required className="h-8 rounded-lg border-slate-200 bg-slate-50 font-bold px-3 text-[9px]" />
                            </div>
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                            <DialogClose asChild><button type="button" className="font-black uppercase text-[8px] tracking-widest text-slate-400 py-2 px-4 rounded-lg hover:bg-slate-50 transition-all">Cancel</button></DialogClose>
                            <Button type="submit" disabled={isSaving} className="h-10 px-6 rounded-xl bg-[#6D1B0A] text-white font-black uppercase text-[8px] tracking-widest shadow-lg">
                                {isSaving ? <Loader2 className="animate-spin h-3 w-3" /> : <Save className="h-3 w-3 mr-1.5" />}
                                Publish update
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
