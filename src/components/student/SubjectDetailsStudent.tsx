'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Subject, Attendance } from '@/utils/storage';
import { getAttendancesAction } from '@/app/actions/dbActions';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import {
  ArrowLeft,
  User,
  BookOpen,
  Calendar as CalendarIcon,
  QrCode,
  CheckCircle,
  Clock,
  XCircle,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from '@/components/ui/dialog';

import { QRCodeSVG as QRCode } from 'qrcode.react';
import { Badge } from '../ui/badge';

interface SubjectDetailsStudentProps {
  subject: Subject;
  onBack: () => void;
}

export default function SubjectDetailsStudent({
  subject,
  onBack
}: SubjectDetailsStudentProps) {

  const { user } = useAuth();

  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [totalSessions, setTotalSessions] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && subject) {
      loadData();
    }
  }, [user, subject]);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError("");
      const allAttendances = await getAttendancesAction();
      
      // Calculate total conducted meetings for this subject
      const subjectAttendances = allAttendances.filter(a => a.subjectId === subject.id);
      const uniqueDays = Array.from(new Set(subjectAttendances.map(a => a.date.split('T')[0])));
      setTotalSessions(uniqueDays.length);

      const myAttendances = allAttendances.filter(
        (a) => a.studentId === user.id && a.subjectId === subject.id
      );
      setAttendances(myAttendances);

      const today = new Date().toDateString();
      const todaysAttendance = myAttendances.find(
        (a) => new Date(a.date).toDateString() === today && a.timeIn
      );
      setHasCheckedIn(!!todaysAttendance);
    } catch (err) {
      console.error(err);
      setError("Failed to load attendance data.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const presentCount = attendances.filter((a) => a.status === "present").length;
  const lateCount = attendances.filter((a) => a.status === "late").length;
  const explicitAbsent = attendances.filter(a => a.status === 'absent').length;
  
  // Smart Absent Logic: Total Meetings - (Present + Late records)
  // This handles the "Auto-Absent if not scanned" requirement deterministically.
  const attendedDays = new Set(attendances.filter(a => a.status === 'present' || a.status === 'late').map(a => a.date.split('T')[0])).size;
  const implicitAbsent = Math.max(0, totalSessions - attendedDays);
  const absentCount = implicitAbsent + explicitAbsent;

  const attendanceRate = totalSessions === 0
      ? 100
      : Math.round(((presentCount * 1 + lateCount * 0.8) / totalSessions) * 100);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={onBack}
            size="icon"
            className="rounded-full hover:bg-primary/5 h-12 w-12"
          >
            <ArrowLeft className="h-6 w-6 text-primary" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-black text-primary uppercase tracking-tighter leading-none">
              {subject.name}
            </h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
              Resource & Identity Hub
            </p>
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              className="h-14 px-8 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl shadow-primary/20 transition-all active:scale-95"
              disabled={loading}
            >
              <QrCode className="h-5 w-5" />
              {hasCheckedIn ? "IDENTITY VERIFIED" : "CAPTURE ATTENDANCE"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase">Digital Handshake</DialogTitle>
              <DialogDescription className="text-xs font-bold text-muted-foreground uppercase mt-1">Ask instructor to scan your terminal signal</DialogDescription>
            </DialogHeader>
            <div className="flex justify-center p-8 bg-muted/20 rounded-2xl border-2 border-dashed border-primary/10">
              <QRCode value={user.id} size={240} includeMargin />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Profile Card */}
        <Card className="lg:col-span-4 rounded-2xl border-none shadow-xl bg-white overflow-hidden">
          <div className="h-1.5 bg-primary" />
          <CardContent className="p-8 space-y-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-32 h-32 rounded-2xl bg-primary/5 border-2 border-primary/5 flex items-center justify-center overflow-hidden shadow-inner">
                {user.profilePic ? (
                  <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-primary/20" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-foreground">{user.name}</h3>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">{user.id} • YEAR {user.year}</p>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-primary/5">
              <div className="flex items-center gap-4 text-[10px] font-black uppercase text-muted-foreground">
                <BookOpen size={14} className="text-primary" /> 
                <span className="flex-1">Course Code:</span>
                <span className="text-foreground">{subject.code || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase text-muted-foreground">
                <ShieldCheck size={14} className="text-primary" /> 
                <span className="flex-1">Status:</span>
                <Badge variant="success" className="h-5 text-[8px]">ACTIVE</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Grid */}
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-2xl border-none shadow-lg bg-white p-6 flex flex-col justify-between group">
              <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-4">Class Presence</p>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-black text-slate-800 tabular-nums">{presentCount}</span>
                <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 border border-green-100 group-hover:bg-green-500 group-hover:text-white transition-all"><CheckCircle size={20} /></div>
              </div>
            </Card>
            <Card className="rounded-2xl border-none shadow-lg bg-white p-6 flex flex-col justify-between group">
              <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-4">Tardy Signal</p>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-black text-slate-800 tabular-nums">{lateCount}</span>
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 group-hover:bg-amber-500 group-hover:text-white transition-all"><Clock size={20} /></div>
              </div>
            </Card>
            <Card className="rounded-2xl border-none shadow-lg bg-white p-6 flex flex-col justify-between group">
              <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-4">Absence Record</p>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-black text-slate-800 tabular-nums">{absentCount}</span>
                <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 border border-red-100 group-hover:bg-red-500 group-hover:text-white transition-all"><XCircle size={20} /></div>
              </div>
            </Card>
          </div>

          <Card className="rounded-2xl border-none shadow-2xl bg-white overflow-hidden">
            <div className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="space-y-2 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <TrendingUp className="text-primary h-4 w-4" />
                  <h4 className="text-xl font-black uppercase tracking-tight">Academic Standing</h4>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Attendance Performance Matrix</p>
              </div>
              
              <div className="flex items-center gap-10">
                <div className="text-center">
                  <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Total Meetings</p>
                  <p className="text-3xl font-black text-slate-800">{totalSessions}</p>
                </div>
                <div className="h-12 w-px bg-primary/10" />
                <div className="bg-primary/5 px-10 py-6 rounded-2xl border border-primary/10 text-center">
                  <p className="text-[9px] font-black text-primary uppercase mb-1">Session Rate</p>
                  <p className="text-5xl font-black text-primary tracking-tighter">{attendanceRate}%</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}

