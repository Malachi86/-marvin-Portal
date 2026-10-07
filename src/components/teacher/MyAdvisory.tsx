'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
    getSectionsAction, 
    getUsersAction,
    updateUserAction,
    getTermsAction,
} from '@/app/actions/dbActions';
import { Section, User, Term } from '@/utils/storage';
import { 
    Users, 
    Search, 
    Loader2, 
    ChevronRight,
    ArrowLeft,
    ShieldCheck,
    Mail,
    Plus,
    X,
    UserPlus,
    CheckCircle2,
    Calendar,
    Save,
    GraduationCap,
    Smartphone,
    MapPin
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ScannerComponent } from './ScannerComponent';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { db } from '@/firebase/config';
import { doc, setDoc } from 'firebase/firestore';

interface MyAdvisoryProps {
    onBack?: () => void;
}

export default function MyAdvisory({ onBack }: MyAdvisoryProps) {
    const { user: teacher } = useAuth();
    const [mySection, setMySection] = useState<Section | null>(null);
    const [advisoryStudents, setAdvisoryStudents] = useState<User[]>([]);
    const [allStudents, setAllStudents] = useState<User[]>([]);
    const [activeTerms, setActiveTerms] = useState<Term[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isNamingSection, setIsNamingSection] = useState(false);
    const [newSectionName, setNewSectionName] = useState('');

    // Registration UI State
    const [isRegistering, setIsRegistering] = useState(false);
    const [regSearch, setRegSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
    const [selectedTermId, setSelectedTermId] = useState('');

    useEffect(() => {
        loadRegistry();
    }, [teacher]);

    const loadRegistry = async () => {
        if (!teacher) return;
        setLoading(true);
        try {
            const [sections, allUsers, terms] = await Promise.all([
                getSectionsAction(),
                getUsersAction(),
                getTermsAction()
            ]);

            const section = sections.find(s => s.advisoryTeacherId === teacher.id);
            setMySection(section || null);
            if (section) setNewSectionName(section.name);

            // Fetch students who are not assigned to any section yet
            setAllStudents(allUsers.filter(u => u.role === 'student' && !u.sectionId));
            setActiveTerms(terms.filter(t => t.status === 'active'));
            if (terms.length > 0) {
                const active = terms.find(t => t.status === 'active');
                if (active) setSelectedTermId(active.id);
            }

            if (section) {
                const students = allUsers.filter(u => 
                    u.role === 'student' && u.sectionId === section.id
                );
                setAdvisoryStudents(students);
            }
        } catch (e) {
            toast.error("Registry Sync Failure");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSectionName = async () => {
        if (!mySection || !newSectionName.trim()) return;
        try {
            // Update section name in registry
            const sections = await getSectionsAction();
            const secIdx = sections.findIndex(s => s.id === mySection.id);
            if (secIdx > -1) {
                const updatedSec = { ...sections[secIdx], name: newSectionName.trim() };
                await setDoc(doc(db, 'sections', mySection.id), updatedSec);
            }
            toast.success("Section configuration updated.");
            setIsNamingSection(false);
            loadRegistry();
        } catch (e) {
            toast.error("Failed to update section.");
        }
    };

    const handleScanStudent = async (data: string) => {
        const student = allStudents.find(s => s.id === data.trim());
        if (student) {
            setSelectedStudent(student);
            setRegSearch('');
        } else {
            const alreadyIn = advisoryStudents.find(s => s.id === data.trim());
            if (alreadyIn) toast.warning(`${alreadyIn.name} is na sa iyong registry.`);
            else toast.error("Identity signal not recognized or already assigned to another section.");
        }
    };

    const handleConfirmRegistration = async () => {
        if (!selectedStudent || !mySection || !selectedTermId) return;

        try {
            // 1. Assign student to section
            await updateUserAction(selectedStudent.id, { 
                sectionId: mySection.id,
                advisorySectionId: mySection.id
            });

            // 2. Register for academic term automatically with Approved status
            const termEnrollmentId = `TENR-${Date.now()}-${selectedStudent.id}`;
            await setDoc(doc(db, 'termenrollments', termEnrollmentId), {
                id: termEnrollmentId,
                studentId: selectedStudent.id,
                termId: selectedTermId,
                status: 'approved',
                enrolledAt: new Date().toISOString()
            });

            toast.success(`${selectedStudent.name} registered to ${mySection.name}`);
            setSelectedStudent(null);
            setRegSearch('');
            loadRegistry();
        } catch (e) {
            toast.error("Registration failed.");
        }
    };

    const handleRemoveFromSection = async (studentId: string) => {
        if (!confirm("Permanently remove this student from your advisory roster?")) return;
        try {
            await updateUserAction(studentId, { sectionId: '', advisorySectionId: '' });
            toast.success("Identity dissociated from section.");
            loadRegistry();
        } catch (e) {
            toast.error("Process failed.");
        }
    };

    const filteredAdvisory = useMemo(() => {
        return advisoryStudents.filter(s => 
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.id.toLowerCase().includes(search.toLowerCase())
        );
    }, [advisoryStudents, search]);

    const filteredRegistry = useMemo(() => {
        if (!regSearch.trim()) return [];
        return allStudents.filter(s => 
            s.name.toLowerCase().includes(regSearch.toLowerCase()) ||
            s.id.toLowerCase().includes(regSearch.toLowerCase())
        );
    }, [allStudents, regSearch]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-32 space-y-4">
            <Loader2 className="animate-spin text-primary h-12 w-12" />
            <p className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Accessing Advisory Registry...</p>
        </div>
    );

    if (!mySection) return (
        <div className="py-20 text-center space-y-8 animate-in fade-in duration-700">
            <div className="h-24 w-24 rounded-[3rem] bg-primary/5 flex items-center justify-center text-primary/20 mx-auto shadow-inner">
                <Users size={48} />
            </div>
            <div>
                <h3 className="text-2xl font-black text-primary/40 uppercase tracking-tighter">No Advisory Assignment</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] mt-2">Check with Admin for section provisioning</p>
            </div>
            {onBack && (
                <Button onClick={onBack} variant="outline" className="rounded-full h-12 px-8 font-black uppercase text-[10px] tracking-widest">
                    Return to Hub
                </Button>
            )}
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-24 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3">
                        {isNamingSection ? (
                            <div className="flex gap-2 w-full max-w-md">
                                <Input value={newSectionName} onChange={e => setNewSectionName(e.target.value)} className="h-14 rounded-2xl font-black text-2xl uppercase tracking-tighter text-primary border-primary/20" autoFocus />
                                <Button onClick={handleUpdateSectionName} className="h-14 w-14 rounded-2xl bg-green-600 shadow-lg shrink-0 text-white"><Save size={24}/></Button>
                                <Button onClick={() => setIsNamingSection(false)} variant="ghost" className="h-14 w-14 rounded-2xl shrink-0"><X size={24}/></Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setIsNamingSection(true)}>
                                <h2 className="text-[3.5rem] font-black text-primary tracking-tighter leading-none uppercase">{mySection.name}</h2>
                                <Badge variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg h-6">Rename</Badge>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Official Advisory Registry • Grade {mySection.gradeLevel}</p>
                    </div>
                </div>
                
                <div className="flex gap-3">
                    <Button onClick={() => setIsRegistering(true)} className="h-16 px-10 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-primary/20 gap-3">
                        <UserPlus size={20} /> Register Member
                    </Button>
                </div>
            </div>

            {/* Registry Search */}
            <div className="relative group max-w-2xl">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/20 group-focus-within:text-primary transition-colors" size={20} />
                <Input 
                    placeholder="Search Identity in Roster..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="h-16 pl-16 rounded-[1.5rem] border-none bg-white shadow-xl font-bold text-base"
                />
            </div>

            {/* Student Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredAdvisory.length === 0 ? (
                    <div className="col-span-full py-32 text-center border-4 border-dashed rounded-[3rem] border-primary/5 bg-white/50 opacity-40">
                        <p className="font-black uppercase tracking-widest text-xs">Roster is currently empty</p>
                    </div>
                ) : (
                    filteredAdvisory.map(student => (
                        <Card key={student.id} className="rounded-[2.5rem] border-none shadow-xl bg-white hover:shadow-2xl transition-all group overflow-hidden flex flex-col">
                            <div className="h-1.5 bg-primary/10 group-hover:bg-primary transition-colors" />
                            <CardContent className="p-8 space-y-6 flex-1">
                                <div className="flex justify-between items-start">
                                    <Avatar className="h-16 w-16 border-4 border-primary/5 shadow-inner">
                                        <AvatarImage src={student.profilePic} />
                                        <AvatarFallback className="bg-muted text-primary font-black text-xl">{student.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <button onClick={() => handleRemoveFromSection(student.id)} className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-sm"><X size={18}/></button>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight group-hover:text-primary transition-colors leading-none">{student.name}</h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{student.id}</p>
                                </div>

                                <div className="p-6 bg-slate-50/50 rounded-2xl border border-primary/5 space-y-4 shadow-inner">
                                    <div className="flex items-center gap-3">
                                        <GraduationCap size={14} className="text-primary/40" />
                                        <p className="text-[10px] font-black uppercase text-slate-600 truncate">{student.program || student.strand || 'N/A'}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Mail size={14} className="text-primary/40" />
                                        <p className="text-[10px] font-black uppercase text-slate-600 truncate">{student.email}</p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-primary/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Certified Member</span>
                                    </div>
                                    <ChevronRight size={16} className="text-primary/20 group-hover:translate-x-1 transition-all" />
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Registration Dialog */}
            <Dialog open={isRegistering} onOpenChange={(val) => { setIsRegistering(val); if(!val) { setRegSearch(''); setSelectedStudent(null); } }}>
                <DialogContent className="rounded-[3rem] p-0 overflow-hidden border-none shadow-3xl bg-white max-w-2xl h-[85vh] flex flex-col">
                    <div className="bg-primary p-10 text-white flex-none">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4">
                                <UserPlus size={32} /> REGISTER CLASS MEMBER
                            </DialogTitle>
                            <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest mt-2">Provision student identity to {mySection.name}</DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar p-10 space-y-10 bg-slate-50/30">
                        {selectedStudent ? (
                            <div className="space-y-10 animate-in zoom-in-95 duration-500">
                                <div className="p-10 bg-white rounded-[2.5rem] shadow-2xl border-4 border-primary/5 flex flex-col items-center text-center space-y-6">
                                    <Avatar className="h-28 w-24 rounded-[2rem] border-4 border-primary/10 shadow-xl">
                                        <AvatarImage src={selectedStudent.profilePic}/>
                                        <AvatarFallback className="bg-muted text-primary font-black text-3xl">{selectedStudent.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h4 className="text-2xl font-black uppercase tracking-tight text-slate-800">{selectedStudent.name}</h4>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">{selectedStudent.id}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">ASSIGN ACADEMIC CYCLE</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/40" size={20}/>
                                        <select 
                                            value={selectedTermId} 
                                            onChange={e => setSelectedTermId(e.target.value)}
                                            className="w-full h-16 bg-white border-2 border-primary/10 rounded-2xl px-14 font-black text-sm uppercase tracking-tight outline-none shadow-xl shadow-primary/5 appearance-none"
                                        >
                                            <option value="" disabled>Select Cycle</option>
                                            {activeTerms.map(t => <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <Button onClick={() => { setSelectedStudent(null); setRegSearch(''); }} variant="ghost" className="flex-1 h-16 rounded-2xl font-black uppercase text-[10px] tracking-widest">Abort</Button>
                                    <Button onClick={handleConfirmRegistration} disabled={!selectedTermId} className="flex-[2] h-16 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 gap-3">
                                        <CheckCircle2 size={20}/> Finalize Entry
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-10">
                                <div className="w-full max-w-[340px] mx-auto">
                                    <ScannerComponent mode="in" onScan={handleScanStudent} />
                                </div>

                                <div className="space-y-6 pt-6 border-t border-primary/5">
                                    <div className="text-center space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/30">Manual Registry Lookup</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Search students without section assignments</p>
                                    </div>
                                    <div className="relative group">
                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/20 group-focus-within:text-primary transition-colors" size={20}/>
                                        <Input 
                                            placeholder="Search name or ID..." 
                                            value={regSearch}
                                            onChange={e => setRegSearch(e.target.value)}
                                            className="h-16 pl-14 rounded-2xl border-none bg-white shadow-xl font-bold focus:ring-2 focus:ring-primary/10 transition-all" 
                                        />
                                    </div>

                                    {regSearch.trim() && (
                                        <div className="space-y-3 mt-4 max-h-[350px] overflow-y-auto no-scrollbar animate-in slide-in-from-top-2 duration-300">
                                            {filteredRegistry.length === 0 ? (
                                                <div className="py-20 text-center border-4 border-dashed rounded-[2.5rem] border-primary/5 opacity-40">
                                                    <p className="text-[10px] font-black uppercase tracking-widest">No unassigned students found</p>
                                                </div>
                                            ) : (
                                                filteredRegistry.map(s => (
                                                    <div 
                                                        key={s.id} 
                                                        onClick={() => { setSelectedStudent(s); setRegSearch(''); }}
                                                        className="p-5 bg-white border border-primary/5 rounded-2xl flex items-center justify-between hover:bg-primary/5 cursor-pointer transition-all active:scale-[0.98] shadow-sm group"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <Avatar className="h-12 w-12 border-2 border-primary/5 shadow-inner">
                                                                <AvatarImage src={s.profilePic} />
                                                                <AvatarFallback className="bg-muted text-primary font-black text-sm">{s.name[0]}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-black text-slate-800 text-sm uppercase leading-none group-hover:text-primary transition-colors">{s.name}</p>
                                                                <p className="text-[10px] font-bold text-muted-foreground mt-1.5 uppercase">{s.id}</p>
                                                            </div>
                                                        </div>
                                                        <div className="h-8 w-8 rounded-full bg-primary/5 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <ChevronRight size={16} />
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

