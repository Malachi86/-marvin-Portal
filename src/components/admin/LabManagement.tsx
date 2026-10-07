'use client';
import React, { useState, useEffect } from 'react';
import { Monitor, Plus, Eye, Building, ArrowLeft, Pencil, User as UserIcon, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { 
    getLabsAction, 
    addLabAction, 
    getRoomsAction, 
    addRoomAction, 
    getPcsAction, 
    updateLabAction, 
    getAttendancesAction, 
    getUsersAction, 
    getSubjectsAction, 
    cleanupExpiredSessionsAction,
    forceResetAllLabsAction
} from "@/app/actions/dbActions";
import { Lab, Pc, Room, Attendance, User, Subject } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { toast } from "sonner";
import { Badge } from '../ui/badge';

type PopulatedSession = Attendance & {
    student?: User;
    subject?: Subject;
    teacher?: User;
};

const SessionHeroCard = ({ session, onBack }: { session: PopulatedSession, onBack: () => void }) => {
    if (!session.student || !session.subject) {
        return (
            <div>
                <Button variant="ghost" onClick={onBack} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4"/> Back to History
                </Button>
                <Card>
                    <CardHeader>
                        <CardTitle>Session Data Missing</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Could not load complete details for this session.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    return (
        <div>
            <Button variant="ghost" onClick={onBack} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4"/> Back to PC History
            </Button>
            <div className="hero-landscape p-10 flex items-center gap-10">
              <div className="relative z-10 w-40 h-40 rounded-[2rem] bg-white/20 border-4 border-white/40 flex items-center justify-center overflow-hidden shadow-2xl rotate-2">
                {session.student.profilePic ? (
                  <img src={session.student.profilePic} alt={session.student.name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-20 h-20 text-white" />
                )}
              </div>
              <div className="relative z-10 flex-1 text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70 mb-2">Usage Record</p>
                <h3 className="text-4xl font-black mb-5 leading-tight drop-shadow-lg">{session.student.name}</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm font-black uppercase tracking-widest">
                  <div className="flex flex-col"><span className="text-white/50 text-[9px]">Student ID</span><span>{session.student.id}</span></div>
                  <div className="flex flex-col"><span className="text-white/50 text-[9px]">Year Level</span><span>Year {session.student.year}</span></div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="rounded-[2rem]">
                    <CardHeader><CardTitle className="text-lg">Session Details</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p><strong>Subject:</strong> {session.subject.name}</p>
                        <p><strong>Date:</strong> {new Date(session.date).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> {session.timeIn} - {session.timeOut || 'Active'}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const PCHistoryView = ({ pc, lab, onBack }: { pc: Pc; lab: Lab; onBack: () => void; }) => {
    const [sessions, setSessions] = useState<PopulatedSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState<PopulatedSession | null>(null);

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
    
    if (selectedSession) return <SessionHeroCard session={selectedSession} onBack={() => setSelectedSession(null)} />

    return (
        <div>
            <Button variant="ghost" onClick={onBack} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4"/> Back to {lab.name}
            </Button>
            <h1 className="text-3xl font-black tracking-tight text-primary">PC {pc.pcNumber}</h1>
            <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest mt-1">Usage Inventory</p>
            
            <Card className="mt-8 rounded-[2rem] overflow-hidden border-primary/10">
                <CardHeader className="bg-primary/5"><CardTitle>Usage Log</CardTitle></CardHeader>
                <CardContent className="p-0">
                    {loading ? <div className="p-10 text-center">Loading history...</div> : (
                        <div className="divide-y">
                            {sessions.length === 0 && <p className="text-center text-muted-foreground py-12">No usage history recorded.</p>}
                            {sessions.map(session => (
                                <div key={session.id} onClick={() => setSelectedSession(session)} className="p-6 flex justify-between items-center cursor-pointer hover:bg-muted/30 transition-colors">
                                    <div>
                                        <p className="font-black text-primary uppercase">{session.student?.name || 'Unknown User'}</p>
                                        <p className="text-xs font-bold text-muted-foreground mt-1">{session.subject?.name || 'Unknown Subject'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black">{new Date(session.date).toLocaleDateString()}</p>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{session.timeIn} - {session.timeOut || 'Active'}</p>
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
        toast.success("Lab updated successfully.");
        setEditDialogOpen(false);
        onLabUpdated();
    };

    return (
        <div>
            <div className="flex justify-between items-start mb-8">
                <div>
                    <Button variant="ghost" onClick={onBack} className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4"/> Back
                    </Button>
                    <h1 className="text-3xl font-black text-primary uppercase">{lab.name}</h1>
                    <p className="text-muted-foreground font-bold text-[10px] tracking-widest mt-1">Component Inventory</p>
                </div>
                <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogTrigger asChild><Button variant="outline" className="rounded-full h-12 px-6">Edit Lab</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Edit Lab</DialogTitle></DialogHeader>
                        <form onSubmit={handleSaveLab} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>Lab Name</Label>
                                <Input value={labFormData.name} onChange={e => setLabFormData({ ...labFormData, name: e.target.value })}/>
                            </div>
                            <div className="space-y-2">
                                <Label>Capacity (PCs)</Label>
                                <Input type="number" value={labFormData.capacity} onChange={e => setLabFormData({ ...labFormData, capacity: e.target.value })}/>
                            </div>
                            <DialogFooter><Button type="submit">Save Changes</Button></DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            
            {loading ? <p>Loading PCs...</p> : (
                <Card className="rounded-[3rem] border-primary/5 overflow-hidden">
                    <CardHeader className="bg-primary/5 p-10"><CardTitle>PC Units ({pcs.length})</CardTitle></CardHeader>
                    <CardContent className="p-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
                        {pcs.map(pc => (
                            <div key={pc.id} onClick={() => onSelectPc(pc)} className={`p-6 rounded-[2rem] border-2 text-center cursor-pointer transition-all hover:scale-105 ${
                                pc.status === 'available' ? 'border-green-100 bg-green-50/50' :
                                pc.status === 'occupied' ? 'border-primary/10 bg-primary/5' :
                                'border-amber-100 bg-amber-50/50'
                            }`}>
                                <Monitor className={`mx-auto mb-3 h-8 w-8 ${
                                    pc.status === 'available' ? 'text-green-600' :
                                    pc.status === 'occupied' ? 'text-primary' :
                                    'text-amber-600'
                                }`} />
                                <p className="font-black text-xs">PC {pc.pcNumber}</p>
                                <Badge variant="secondary" className={`capitalize mt-3 font-bold text-[9px] tracking-tighter ${
                                    pc.status === 'available' ? 'bg-green-100 text-green-800' :
                                    pc.status === 'occupied' ? 'bg-primary text-white' :
                                    'bg-amber-100 text-amber-800'
                                }`}>{pc.status}</Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default function LabManagement() {
    const [labs, setLabs] = useState<Lab[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
    const [selectedPc, setSelectedPc] = useState<Pc | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCleaning, setIsCleaning] = useState(false);
    const [isForcing, setIsForcing] = useState(false);

    const [isAddLabOpen, setAddLabOpen] = useState(false);
    const [newLabName, setNewLabName] = useState('');
    const [newLabCapacity, setNewLabCapacity] = useState('');
    const [activeTab, setActiveTab] = useState("labs");

    const fetchData = async (runCleanup = true) => {
        setLoading(true);
        if(runCleanup) await cleanupExpiredSessionsAction();
        const fetchedLabs = await getLabsAction();
        const fetchedRooms = await getRoomsAction();
        setLabs(fetchedLabs);
        setRooms(fetchedRooms);
        if (selectedLab) {
            const updatedLab = fetchedLabs.find((l: Lab) => l.id === selectedLab.id);
            setSelectedLab(updatedLab || null);
        }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleCleanUp = async () => {
        setIsCleaning(true);
        const result = await cleanupExpiredSessionsAction();
        toast.success(`${result.updated} expired sessions cleared.`, { description: "PC units have been synchronized." });
        await fetchData(false);
        setIsCleaning(false);
    }

    const handleForceReset = async () => {
        setIsForcing(true);
        try {
            const result = await forceResetAllLabsAction();
            toast.success("Total Lab Reset Complete", { 
                description: `${result.closedSessions} active sessions were auto-checked out. Records saved.` 
            });
            await fetchData(false);
        } catch (e) {
            toast.error("Force Reset Failed");
        } finally {
            setIsForcing(false);
        }
    }

    const handleAddLab = async (e: React.FormEvent) => {
        e.preventDefault();
        await addLabAction({ id: `LAB-${Date.now()}`, name: newLabName, capacity: parseInt(newLabCapacity, 10) });
        toast.success("Lab created.");
        setNewLabName(''); setNewLabCapacity(''); fetchData(false); setAddLabOpen(false);
    };

    if (loading) return <div className="flex justify-center p-20"><RefreshCw className="animate-spin text-primary" /></div>;
    if(selectedPc && selectedLab) return <PCHistoryView pc={selectedPc} lab={selectedLab} onBack={() => setSelectedPc(null)} />;
    if (selectedLab) return <LabDetailView lab={selectedLab} onBack={() => setSelectedLab(null)} onSelectPc={setSelectedPc} onLabUpdated={() => fetchData(false)} />;

  return (
    <div className="space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
                <h1 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none">Facilities Control</h1>
                <p className="text-muted-foreground font-bold text-[10px] tracking-[0.2em] mt-2 uppercase">Infrastructure Management Hub</p>
            </div>
            <div className="flex flex-wrap gap-3">
                <Button onClick={handleCleanUp} variant="outline" className="rounded-full h-12 px-6 gap-2" disabled={isCleaning}>
                    <RefreshCw className={`h-4 w-4 ${isCleaning ? 'animate-spin' : ''}`}/>
                    {isCleaning ? 'Processing...' : 'Clean Up Sessions'}
                </Button>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="rounded-full h-12 px-6 gap-2" disabled={isForcing}>
                            <AlertTriangle className="h-4 w-4" />
                            {isForcing ? 'Forcing Reset...' : 'Force Reset All Labs'}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-[2.5rem] p-10 border-destructive/20">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black text-primary uppercase">CRITICAL SYSTEM RESET</AlertDialogTitle>
                            <AlertDialogDescription className="text-base font-bold text-muted-foreground mt-4" asChild>
                                <div>
                                    This action will <span className="text-destructive underline">AUTO-CHECKOUT</span> every active student session on campus.
                                    <br/><br/>
                                    <ul className="list-disc ml-6 space-y-2 text-sm">
                                        <li><strong>Attendance is SAVED:</strong> All students will receive an automatic "Time Out" for their current session.</li>
                                        <li><strong>PCs are FREED:</strong> All units across all laboratories will be set to "Available".</li>
                                        <li><strong>Safe for Records:</strong> Their "Present" or "Late" status will be maintained.</li>
                                    </ul>
                                </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-8">
                            <AlertDialogCancel className="rounded-full h-12">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleForceReset} className="rounded-full h-12 bg-destructive text-white hover:bg-destructive/90">Confirm Force Reset</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <Dialog open={isAddLabOpen} onOpenChange={setAddLabOpen}>
                    <DialogTrigger asChild><Button className="rounded-full h-12 px-8 bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20 font-black uppercase text-xs tracking-widest gap-2"><Plus className="h-4 w-4"/>Add Infrastructure</Button></DialogTrigger>
                    <DialogContent className="rounded-[2rem]">
                        <DialogHeader><DialogTitle>Register New Facility</DialogTitle></DialogHeader>
                        <form onSubmit={handleAddLab} className="space-y-6 pt-6">
                            <div className="space-y-2">
                                <Label className="font-bold text-[10px] uppercase tracking-widest">Facility Name</Label>
                                <Input value={newLabName} onChange={e => setNewLabName(e.target.value)} placeholder="e.g., Computer Lab 1" className="h-12 rounded-xl"/>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold text-[10px] uppercase tracking-widest">Unit Capacity</Label>
                                <Input type="number" value={newLabCapacity} onChange={e => setNewLabCapacity(e.target.value)} placeholder="Total PCs" className="h-12 rounded-xl"/>
                            </div>
                            <DialogFooter><Button type="submit" className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs">Provision Infrastructure</Button></DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
      
        <Tabs defaultValue="labs" onValueChange={setActiveTab}>
            <TabsList className="bg-white border-2 border-primary/5 h-14 p-1.5 rounded-full mb-8">
                <TabsTrigger value="labs" className="rounded-full font-black uppercase text-[10px] tracking-widest px-8 data-[state=active]:bg-primary data-[state=active]:text-white">Laboratories</TabsTrigger>
                <TabsTrigger value="rooms" className="rounded-full font-black uppercase text-[10px] tracking-widest px-8 data-[state=active]:bg-primary data-[state=active]:text-white">Lecture Rooms</TabsTrigger>
            </TabsList>
            <TabsContent value="labs">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {labs.map(lab => (
                        <Card key={lab.id} className="rounded-[2.5rem] border-primary/5 shadow-xl hover:shadow-2xl transition-all group">
                            <CardHeader className="p-8">
                                <CardTitle className="flex items-center gap-4 text-primary font-black uppercase tracking-tighter text-xl">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                        <Monitor className="h-6 w-6"/>
                                    </div>
                                    {lab.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-8 pb-8 space-y-6">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Capacity Matrix: {lab.capacity} Units</p>
                                <Button onClick={() => setSelectedLab(lab)} className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/10 hover:scale-[1.02] transition-transform">
                                    Manage PC Units
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </TabsContent>
            <TabsContent value="rooms">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {rooms.map(room => (
                        <Card key={room.id} className="rounded-[2.5rem] border-primary/5 shadow-xl">
                            <CardHeader className="p-8">
                                <CardTitle className="flex items-center gap-4 text-primary font-black uppercase tracking-tighter text-xl">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center"><Building className="h-6 w-6"/></div>
                                    {room.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-8 pb-8">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Audience Capacity: {room.capacity} Seats</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </TabsContent>
        </Tabs>
    </div>
  );
}
