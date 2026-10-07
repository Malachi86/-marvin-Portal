'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';

import {
  Search,
  Loader2,
  AlertTriangle,
  Eye,
  X,
  Download,
  Calendar as CalendarIcon,
  Clock,
  User as UserIcon,
  CheckCircle2,
  History
} from 'lucide-react';

import {
  getAttendancesAction,
  getSubjectsAction,
  getUsersAction
} from '@/app/actions/dbActions';

import { Subject, Attendance, User } from '@/utils/storage';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { format, differenceInMinutes, parseISO } from 'date-fns';

/* ---------------------------------------------------------------- */
/* MINI CALENDAR COMPONENT */
/* ---------------------------------------------------------------- */

const MiniCalendar = ({ studentHistory }: { studentHistory: Attendance[] }) => {
  const daysInMonth = 31; // Simplified for visualization
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Monthly Visualization</p>
        <div className="flex gap-2">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-[8px] font-bold">PR</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-[8px] font-bold">LT</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /><span className="text-[8px] font-bold">AB</span></div>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dayRecords = studentHistory.filter(h => new Date(h.date).getDate() === dayNum);
          const status = dayRecords.length > 0 ? dayRecords[0].status : null;
          
          return (
            <div 
              key={i} 
              className={cn(
                "aspect-square rounded-md flex items-center justify-center text-[9px] font-black border transition-all",
                status === 'present' ? "bg-green-500 text-white border-green-600 shadow-sm" :
                status === 'late' ? "bg-amber-500 text-white border-amber-600 shadow-sm" :
                status === 'absent' ? "bg-red-500 text-white border-red-600 shadow-sm" :
                "bg-muted/30 text-muted-foreground/20 border-transparent"
              )}
            >
              {dayNum}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function AttendanceRecords() {
  const { user } = useAuth();

  const [records, setRecords] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  const [filter, setFilter] = useState({
    search: '',
    subject: '',
    date: ''
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const [allAttendances, allSubjects, allUsers] = await Promise.all([
        getAttendancesAction(),
        getSubjectsAction(),
        getUsersAction()
      ]);

      const teacherSubjects = allSubjects.filter(s => s.teacherId === user.id);
      const teacherSubjectIds = teacherSubjects.map(s => s.id);

      const teacherAttendances = allAttendances.filter(a =>
        teacherSubjectIds.includes(a.subjectId)
      );

      const populatedRecords = teacherAttendances.map(rec => {
        const student = allUsers.find(u => u.id === rec.studentId);
        const subject = teacherSubjects.find(s => s.id === rec.subjectId);

        return {
          ...rec,
          student: student,
          student_name: student?.name || 'Unknown',
          student_usn: student?.id || 'Unknown',
          subject_name: subject?.name || 'Unknown'
        };
      });

      setRecords(populatedRecords);
      setSubjects(teacherSubjects);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (dateStr: string, timeIn: string | undefined, timeOut: string | undefined) => {
    if (!timeIn) return '-';
    try {
      const day = dateStr.split('T')[0];
      const start = new Date(`${day}T${timeIn}`);
      
      if (!timeOut) return 'Active';
      
      const end = new Date(`${day}T${timeOut}`);
      const diffMins = Math.abs(differenceInMinutes(end, start));
      
      const h = Math.floor(diffMins / 60);
      const m = diffMins % 60;
      
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    } catch {
      return '-';
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const subjectMatch = filter.subject ? rec.subjectId === filter.subject : true;
      const searchMatch = filter.search ?
        rec.student_name.toLowerCase().includes(filter.search.toLowerCase()) ||
        rec.student_usn.toLowerCase().includes(filter.search.toLowerCase())
        : true;
      const dateMatch = filter.date ?
        new Date(rec.date).toISOString().slice(0, 10) === filter.date
        : true;
      return subjectMatch && searchMatch && dateMatch;
    });
  }, [records, filter]);

  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const exportCSV = () => {
    if (filteredRecords.length === 0) return;
    const rows = filteredRecords.map(r => ({
      Student: r.student_name,
      ID: r.student_usn,
      Subject: r.subject_name,
      Date: new Date(r.date).toLocaleDateString(),
      TimeIn: r.timeIn,
      TimeOut: r.timeOut,
      Status: r.status
    }));
    const csv = Object.keys(rows[0]).join(',') + '\n' + rows.map(r => Object.values(r).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance-records.csv';
    a.click();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <Loader2 className="animate-spin text-primary h-12 w-12" />
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Accessing Records Hub...</p>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border-2 border-red-100 text-red-700 p-8 rounded-[2rem] flex flex-col items-center text-center gap-4">
      <AlertTriangle size={48} />
      <p className="font-black uppercase tracking-tight text-xl">{error}</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-[3rem] font-black text-primary tracking-tighter uppercase leading-none">Attendance Records</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] mt-2">Comprehensive Session Registry</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 bg-white shadow-xl shadow-primary/5">
          <Download size={18} /> Export CSV Registry
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-10 border border-primary/5 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Search Identity</Label>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/20 group-focus-within:text-primary transition-colors" size={20} />
            <input
              type="text"
              placeholder="Name or USN..."
              value={filter.search}
              onChange={e => { setFilter({ ...filter, search: e.target.value }); setCurrentPage(1); }}
              className="w-full h-14 pl-12 pr-6 rounded-2xl border-none bg-muted/20 font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Filter by Subject</Label>
          <select
            value={filter.subject}
            onChange={e => { setFilter({ ...filter, subject: e.target.value }); setCurrentPage(1); }}
            className="w-full h-14 px-6 rounded-2xl border-none bg-muted/20 font-bold focus:ring-2 focus:ring-primary/10 transition-all appearance-none cursor-pointer outline-none"
          >
            <option value="">All Subject Loads</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Specific Date</Label>
          <input
            type="date"
            value={filter.date}
            onChange={e => { setFilter({ ...filter, date: e.target.value }); setCurrentPage(1); }}
            className="w-full h-14 px-6 rounded-2xl border-none bg-muted/20 font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
          />
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block bg-white rounded-[3rem] border border-primary/5 shadow-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary/5 border-b border-primary/5">
              <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Student Identity</th>
              <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Academic Subject</th>
              <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Date</th>
              <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Duration</th>
              <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Status</th>
              <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-20 text-center text-muted-foreground font-bold uppercase tracking-widest opacity-40">No matching records in registry</td>
              </tr>
            ) : (
              paginatedRecords.map(rec => (
                <tr key={rec.id} className="hover:bg-primary/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="font-black text-primary uppercase tracking-tight">{rec.student_name}</div>
                    <div className="text-[10px] font-bold text-muted-foreground">{rec.student_usn}</div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-bold text-slate-700 uppercase text-xs">{rec.subject_name}</p>
                  </td>
                  <td className="px-8 py-6 text-center whitespace-nowrap">
                    <p className="font-black text-[11px] text-slate-500 tabular-nums">{new Date(rec.date).toLocaleDateString()}</p>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <Badge variant="outline" className="font-black text-[10px] border-primary/5 px-3 py-1 bg-muted/30">
                      {calculateDuration(rec.date, rec.timeIn, rec.timeOut)}
                    </Badge>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <Badge className={cn(
                      "px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest border-none shadow-sm",
                      rec.status === 'present' ? "bg-green-500 text-white" : "bg-amber-500 text-white"
                    )}>
                      {rec.status}
                    </Badge>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button onClick={() => setSelectedRecord(rec)} className="h-10 px-5 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all font-black uppercase text-[10px] tracking-widest flex items-center gap-2 ml-auto shadow-sm">
                      <Eye size={14} /> View History
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet View */}
      <div className="lg:hidden space-y-6 px-2">
        {paginatedRecords.length === 0 ? (
          <div className="p-20 text-center bg-white rounded-[2rem] border-4 border-dashed border-primary/5">
            <p className="text-muted-foreground font-black uppercase tracking-widest text-xs opacity-40">Empty Registry</p>
          </div>
        ) : (
          paginatedRecords.map((rec, index) => (
            <Card key={index} className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden group">
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-xl text-primary uppercase leading-none tracking-tight">{rec.student_name}</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1.5">{rec.student_usn}</p>
                  </div>
                  <Badge className={cn(
                    "px-3 py-1 rounded-lg font-black text-[8px] uppercase tracking-widest",
                    rec.status === 'present' ? "bg-green-500 text-white" : "bg-amber-500 text-white"
                  )}>
                    {rec.status}
                  </Badge>
                </div>
                
                <div className="p-6 bg-muted/20 rounded-2xl border border-primary/5 space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground">
                    <span>Subject:</span>
                    <span className="text-primary">{rec.subject_name}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground">
                    <span>Date:</span>
                    <span>{new Date(rec.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground">
                    <span>Duration:</span>
                    <span className="text-foreground">{calculateDuration(rec.date, rec.timeIn, rec.timeOut)}</span>
                  </div>
                </div>

                <Button onClick={() => setSelectedRecord(rec)} className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl shadow-primary/20">
                  <Eye size={16} /> Analysis Report
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 pt-6">
          <Button
            variant="ghost"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="h-12 w-12 rounded-xl font-black text-primary p-0"
          >
            <History size={20} className="rotate-180" />
          </Button>
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={cn(
                  "h-12 w-12 rounded-xl font-black text-xs transition-all",
                  currentPage === p ? "bg-primary text-white shadow-lg scale-110" : "bg-white text-muted-foreground hover:bg-primary/5 shadow-sm"
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="h-12 w-12 rounded-xl font-black text-primary p-0"
          >
            <History size={20} />
          </Button>
        </div>
      )}

      {/* STUDENT ANALYSIS MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 md:p-8 animate-in fade-in duration-300">
          <Card className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-none flex flex-col">
            {/* Modal Header */}
            <div className="bg-primary p-8 md:p-12 text-white relative flex-none">
              <button onClick={() => setSelectedRecord(null)} className="absolute top-8 right-8 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                <X size={24} />
              </button>
              <div className="flex items-center gap-8">
                <div className="h-24 w-24 rounded-[2rem] bg-white/20 backdrop-blur-xl border-4 border-white/20 flex items-center justify-center overflow-hidden shadow-2xl shrink-0">
                  {selectedRecord.student?.profilePic ? (
                    <img src={selectedRecord.student.profilePic} alt="student" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={48} className="text-white" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Identity Insight</p>
                  <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none">{selectedRecord.student_name}</h3>
                  <p className="text-xs font-bold opacity-80 uppercase tracking-widest">{selectedRecord.student_usn} • Enrolled Student</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-8 md:p-12 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Stats Summary */}
                <div className="space-y-8">
                  <div className="flex items-center gap-3">
                    <History className="text-primary h-5 w-5" />
                    <h4 className="text-xl font-black uppercase tracking-tight">Performance Summary</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-green-50 rounded-[1.5rem] border border-green-100">
                      <p className="text-[9px] font-black uppercase text-green-600 tracking-widest">Total Present</p>
                      <p className="text-3xl font-black text-green-700 mt-1">
                        {records.filter(r => r.studentId === selectedRecord.studentId && r.subjectId === selectedRecord.subjectId && r.status === 'present').length}
                      </p>
                    </div>
                    <div className="p-6 bg-amber-50 rounded-[1.5rem] border border-amber-100">
                      <p className="text-[9px] font-black uppercase text-amber-600 tracking-widest">Total Late</p>
                      <p className="text-3xl font-black text-amber-700 mt-1">
                        {records.filter(r => r.studentId === selectedRecord.studentId && r.subjectId === selectedRecord.subjectId && r.status === 'late').length}
                      </p>
                    </div>
                    <div className="p-6 bg-red-50 rounded-[1.5rem] border border-red-100">
                      <p className="text-[9px] font-black uppercase text-red-600 tracking-widest">Total Absences</p>
                      <p className="text-3xl font-black text-red-700 mt-1">
                        {records.filter(r => r.studentId === selectedRecord.studentId && r.subjectId === selectedRecord.subjectId && r.status === 'absent').length}
                      </p>
                    </div>
                    <div className="p-6 bg-primary/5 rounded-[1.5rem] border border-primary/10">
                      <p className="text-[9px] font-black uppercase text-primary tracking-widest">Subject Engagement</p>
                      <p className="text-3xl font-black text-primary mt-1">88%</p>
                    </div>
                  </div>

                  <div className="p-8 bg-muted/20 rounded-[2rem] border-2 border-primary/5">
                    <div className="flex items-center gap-3 mb-4">
                      <CalendarIcon className="text-primary h-4 w-4" />
                      <p className="text-[10px] font-black uppercase text-foreground tracking-widest">ACTIVE SUBJECT LOAD</p>
                    </div>
                    <p className="font-black text-primary text-xl uppercase tracking-tight">{selectedRecord.subject_name}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mt-2">Authenticated Lab Session Hub</p>
                  </div>
                </div>

                {/* Mini Calendar Visualization */}
                <div className="space-y-8">
                  <div className="flex items-center gap-3">
                    <Clock className="text-primary h-5 w-5" />
                    <h4 className="text-xl font-black uppercase tracking-tight">Timeline Matrix</h4>
                  </div>
                  
                  <Card className="p-8 rounded-[2rem] border-none shadow-inner bg-slate-50">
                    <MiniCalendar 
                      studentHistory={records.filter(r => 
                        r.studentId === selectedRecord.studentId && 
                        r.subjectId === selectedRecord.subjectId
                      )} 
                    />
                  </Card>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">LATEST SESSION SIGNAL</p>
                    <div className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600"><CheckCircle2 size={20} /></div>
                        <div>
                          <p className="font-black text-xs uppercase text-slate-800 leading-none">Last Check-In</p>
                          <p className="text-[9px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest">{format(new Date(selectedRecord.date), "MMMM dd, yyyy")}</p>
                        </div>
                      </div>
                      <span className="font-black text-green-600 text-xs tabular-nums">{selectedRecord.timeIn}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end flex-none">
              <Button onClick={() => setSelectedRecord(null)} className="h-14 px-12 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20">
                Acknowledge Intel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
