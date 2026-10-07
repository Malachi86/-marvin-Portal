'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, Send, AlertCircle, Monitor, Building, Clock, Loader2 } from 'lucide-react';
import { getEnrollmentsAction, getUsersAction, getSubjectsAction, getLabsAction, getRoomsAction, getPcsAction, addLabRequestAction } from '@/app/actions/dbActions';
import { Subject, User } from '@/utils/storage';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export default function MakeRequest() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [availablePCs, setAvailablePCs] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    teacher: '',
    subject: '',
    type: 'lab' as 'lab' | 'room',
    labOrRoom: '',
    pc: '',
    startTime: '',
    endTime: '',
    reason: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if(user) {
      loadInitialData();
    }
  }, [user]);

  useEffect(() => {
    if (formData.teacher) {
      loadSubjectsForTeacher(formData.teacher);
    } else {
      setSubjects([]);
    }
  }, [formData.teacher]);

  useEffect(() => {
    if (formData.type === 'lab' && formData.labOrRoom) {
      loadAvailablePCs(formData.labOrRoom);
    }
  }, [formData.labOrRoom, formData.type]);

  const loadInitialData = async () => {
    if (!user) return;
    const allUsers = await getUsersAction();
    
    const teacherUsers = allUsers.filter(u => u.role === 'teacher');
    
    // Manually create an admin user object to be included as an instructor
    const adminUser = {
        id: 'admin',
        name: 'Admin',
        email: 'admin@school.edu',
        role: 'admin' as const,
        password: ''
    };
    
    const allPotentialInstructors = [...teacherUsers, adminUser];

    setTeachers(allPotentialInstructors);
    setLabs(await getLabsAction());
    setRooms(await getRoomsAction());
  };

  const loadSubjectsForTeacher = async (teacherId: string) => {
    if (!user) return;

    if (teacherId === 'admin') {
      const adminSubjects: Subject[] = [
        { id: 'exam', name: 'Exam', teacherId: 'admin', teacherName: 'Admin', schedules: [], termId: 'ADMIN' },
        { id: 'personal_use', name: 'Personal Use', teacherId: 'admin', teacherName: 'Admin', schedules: [], termId: 'ADMIN' }
      ];
      setSubjects(adminSubjects);
    } else {
      const allSubjects = await getSubjectsAction();
      let subjectsForSelectedTeacher = allSubjects.filter(s => s.teacherId === teacherId);
      const myEnrollments = await getEnrollmentsAction();
      const myApprovedEnrollments = myEnrollments.filter(e => e.studentId === user.id && e.status === 'approved');
      const mySubjectIds = myApprovedEnrollments.map(e => e.subjectId);
      subjectsForSelectedTeacher = subjectsForSelectedTeacher.filter(s => mySubjectIds.includes(s.id));
      setSubjects(subjectsForSelectedTeacher);
    }
  };

  const loadAvailablePCs = async (labId: string) => {
    const allPcs = await getPcsAction();
    const available = allPcs.filter(pc => pc.labId === labId && pc.status === 'available');
    setAvailablePCs(available);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) return;

    if (formData.subject === 'personal_use' && !formData.reason.trim()) {
        setError('A reason is required for Personal Use requests.');
        return;
    }
    
    if (!formData.teacher || !formData.subject || !formData.labOrRoom || !formData.startTime || !formData.endTime) {
      setError('Please fill out all required fields.');
      return;
    }

    if (formData.type === 'lab' && !formData.pc) {
      setError('Please select an available PC for the lab.');
      return;
    }
    
    setLoading(true);
    try {
        const today = new Date().toISOString().split('T')[0];
        const newRequest = {
          studentId: user.id,
          teacherId: formData.teacher,
          subjectId: formData.subject,
          labId: formData.labOrRoom,
          pcId: formData.type === 'lab' ? formData.pc : undefined,
          startTime: `${today}T${formData.startTime}`,
          endTime: `${today}T${formData.endTime}`,
          reason: formData.reason,
          status: 'pending' as const
        };
        
        await addLabRequestAction(newRequest);
        toast.success("Request submitted successfully!", { description: "Your teacher or admin has been notified."});
        setFormData({
            teacher: '',
            subject: '',
            type: 'lab',
            labOrRoom: '',
            pc: '',
            startTime: '',
            endTime: '',
            reason: ''
        });
    } catch {
        toast.error("Failed to submit request.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div>
        <h2 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none">MAKE LAB REQUEST</h2>
        <p className="text-xs font-bold text-muted-foreground mt-2 uppercase tracking-widest">Request access to lab or room for a class, exam, or personal use.</p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-xl flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-2xl border-none p-10 md:p-16 space-y-10">
        <form onSubmit={handleSubmit} className="space-y-10">
          
          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Instructor / Office</Label>
              <select
                value={formData.teacher}
                onChange={(e) => setFormData({ ...formData, teacher: e.target.value, subject: '' })}
                className="w-full h-14 bg-muted/10 border-none rounded-2xl px-6 font-bold text-foreground focus:ring-2 focus:ring-primary/20 outline-none appearance-none transition-all"
                required
              >
                <option value="">Select Instructor</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Subject / Purpose</Label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full h-14 bg-muted/10 border-none rounded-2xl px-6 font-bold text-foreground focus:ring-2 focus:ring-primary/20 outline-none appearance-none transition-all disabled:opacity-50"
                required
                disabled={!formData.teacher}
              >
                <option value="">Select Subject/Purpose</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Request Type</Label>
            <div className="flex gap-8">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all", formData.type === 'lab' ? "border-primary bg-primary" : "border-primary/20 group-hover:border-primary/40")}>
                  {formData.type === 'lab' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <input type="radio" value="lab" checked={formData.type === 'lab'} onChange={(e) => setFormData({ ...formData, type: e.target.value as 'lab' | 'room', labOrRoom: '', pc: ''})} className="hidden" />
                <span className="font-bold text-sm uppercase tracking-tight">Lab (with PC)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all", formData.type === 'room' ? "border-primary bg-primary" : "border-primary/20 group-hover:border-primary/40")}>
                  {formData.type === 'room' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <input type="radio" value="room" checked={formData.type === 'room'} onChange={(e) => setFormData({ ...formData, type: e.target.value as 'lab' | 'room', labOrRoom: '', pc: ''})} className="hidden" />
                <span className="font-bold text-sm uppercase tracking-tight">Room</span>
              </label>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">{formData.type === 'lab' ? 'Lab' : 'Room'}</Label>
              <select
                value={formData.labOrRoom}
                onChange={(e) => setFormData({ ...formData, labOrRoom: e.target.value, pc: '' })}
                className="w-full h-14 bg-muted/10 border-none rounded-2xl px-6 font-bold text-foreground focus:ring-2 focus:ring-primary/20 outline-none appearance-none transition-all"
                required
              >
                <option value="">Select {formData.type === 'lab' ? 'Lab' : 'Room'}</option>
                {(formData.type === 'lab' ? labs : rooms).map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name} (Cap: {loc.capacity})</option>
                ))}
              </select>
            </div>

            {formData.type === 'lab' && formData.labOrRoom && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">Available PCs ({availablePCs.length})</Label>
                <select
                  value={formData.pc}
                  onChange={(e) => setFormData({ ...formData, pc: e.target.value })}
                  className="w-full h-14 bg-primary/5 border-2 border-primary/10 rounded-2xl px-6 font-bold text-primary focus:ring-2 focus:ring-primary/20 outline-none appearance-none transition-all"
                  required
                >
                  <option value="">Select Workstation</option>
                  {availablePCs.map((pc) => (
                    <option key={pc.id} value={pc.id}>PC {pc.pcNumber}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Start Time</Label>
              <div className="relative group">
                <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/40 h-5 w-5 group-focus-within:text-primary transition-colors" />
                <Input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} required className="h-14 pl-14 rounded-2xl border-none bg-muted/10 font-bold" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">End Time</Label>
              <div className="relative group">
                <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/40 h-5 w-5 group-focus-within:text-primary transition-colors" />
                <Input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} required className="h-14 pl-14 rounded-2xl border-none bg-muted/10 font-bold" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Reason / Purpose</Label>
            <Textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="rounded-3xl p-8 border-none bg-muted/10 min-h-[140px] font-medium text-base focus:ring-2 focus:ring-primary/20 outline-none"
              placeholder={formData.subject === 'personal_use' ? 'Please provide a detailed reason for your request...' : 'Optional details'}
              required={formData.subject === 'personal_use'}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-20 bg-primary hover:bg-primary/90 text-white font-black uppercase text-sm tracking-[0.25em] rounded-2xl shadow-2xl shadow-primary/20 gap-4 transition-all active:scale-95 disabled:grayscale"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Send size={24} />}
            SUBMIT REQUEST
          </Button>
        </form>
      </div>
    </div>
  );
}
