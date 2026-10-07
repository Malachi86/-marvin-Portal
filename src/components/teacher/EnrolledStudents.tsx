'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';

import {
  getUsersAction,
  getEnrollmentsAction,
  getSubjectsAction
} from '@/app/actions/dbActions';

import { User, Subject } from '@/utils/storage';

import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  BookOpen,
  Mail,
  Smartphone,
  ChevronRight,
  ArrowLeft,
  X,
  Filter
} from 'lucide-react';

import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export default function EnrolledStudents() {
  const { user } = useAuth();

  const [enrolledStudents, setEnrolledStudents] = useState<Array<{student: User, subject: Subject}>>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  /* Pagination */
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    if (user) loadEnrolledStudents();
  }, [user]);

  const loadEnrolledStudents = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [allUsers, allSubjects, allEnrollments] = await Promise.all([
        getUsersAction(),
        getSubjectsAction(),
        getEnrollmentsAction()
      ]);

      const tSubjects = allSubjects.filter(s => s.teacherId === user.id);
      setTeacherSubjects(tSubjects);
      
      const teacherSubjectIds = tSubjects.map(s => s.id);

      const approvedEnrollments = allEnrollments.filter(e =>
        teacherSubjectIds.includes(e.subjectId) && e.status === 'approved'
      );

      const studentsWithSubjects = approvedEnrollments.map(enrollment => {
        const student = allUsers.find(u => u.id === enrollment.studentId);
        const subject = tSubjects.find(s => s.id === enrollment.subjectId);
        return { student, subject };
      }).filter((item): item is { student: User, subject: Subject } => !!(item.student && item.subject));

      setEnrolledStudents(studentsWithSubjects);
    } catch (e) {
      toast.error("Failed to sync enrollment registry.");
    } finally {
      setLoading(false);
    }
  };

  /* Filter Logic */
  const filteredStudents = useMemo(() => {
    return enrolledStudents.filter(({student, subject}) => {
      const matchesSearch = 
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.id.toLowerCase().includes(search.toLowerCase()) ||
        subject.name.toLowerCase().includes(search.toLowerCase());
      
      const matchesSubject = subjectFilter === 'all' || subject.id === subjectFilter;

      return matchesSearch && matchesSubject;
    });
  }, [enrolledStudents, search, subjectFilter]);

  /* Pagination Logic */
  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);
  const start = (currentPage - 1) * rowsPerPage;
  const paginatedStudents = filteredStudents.slice(start, start + rowsPerPage);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="animate-spin text-primary h-12 w-12" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Accessing Roster Registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-[3rem] font-black text-primary tracking-tighter uppercase leading-none">Class Roster</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] mt-2">Active Enrolled Identities</p>
        </div>
        <div className="bg-primary/5 px-6 py-3 rounded-2xl border border-primary/10">
          <p className="text-[9px] font-black text-primary uppercase tracking-widest">Total Population</p>
          <p className="text-2xl font-black text-primary leading-none mt-1">{enrolledStudents.length} Students</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative group flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/20 group-focus-within:text-primary transition-colors" size={20} />
          <Input 
            placeholder="Search by Name, USN, or Subject..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="h-16 pl-14 rounded-2xl border-none bg-white shadow-xl font-bold text-base w-full"
          />
        </div>

        <div className="relative w-full lg:w-80 group">
          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/20 group-hover:text-primary transition-colors" size={18} />
          <select
            value={subjectFilter}
            onChange={(e) => { setSubjectFilter(e.target.value); setCurrentPage(1); }}
            className="w-full h-16 bg-white border-none rounded-2xl pl-14 pr-8 font-black text-[10px] uppercase tracking-widest shadow-xl appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-primary/10 transition-all"
          >
            <option value="all">ALL SUBJECTS</option>
            {teacherSubjects.map(s => (
              <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>
            ))}
          </select>
          <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 rotate-90 text-muted-foreground/30 pointer-events-none" size={16} />
        </div>
      </div>

      {/* Registry Table (Desktop) */}
      <div className="hidden lg:block bg-white rounded-[3rem] border border-primary/5 shadow-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary/5 border-b border-primary/5">
              <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Student Identity</th>
              <th className="px-6 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Academic Load</th>
              <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Level</th>
              <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Program</th>
              <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {paginatedStudents.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-20 text-center text-muted-foreground font-bold uppercase tracking-widest opacity-40">No matching records in registry</td>
              </tr>
            ) : (
              paginatedStudents.map(({student, subject}, index) => (
                <tr key={index} className="hover:bg-primary/[0.02] transition-colors group">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-2 border-primary/5 shadow-inner">
                        <AvatarImage src={student.profilePic || undefined} />
                        <AvatarFallback className="bg-muted text-primary font-black uppercase">{student.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-black text-primary uppercase tracking-tight text-lg">{student.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{student.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <p className="font-black text-slate-700 uppercase text-xs">{subject.name}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">CODE: {subject.code || 'NA'}</p>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <Badge variant="outline" className="font-black text-[9px] tracking-widest border-primary/10">YEAR {student.year || '?'}</Badge>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className="font-black text-xs uppercase text-slate-500">{student.program || 'N/A'}</span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button 
                      onClick={() => setSelectedStudent({student, subject})}
                      className="h-10 px-5 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all font-black uppercase text-[10px] tracking-widest gap-2 shadow-sm inline-flex items-center"
                    >
                      <Eye size={14} /> Profile
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Registry Cards (Mobile) */}
      <div className="lg:hidden space-y-6">
        {paginatedStudents.length === 0 ? (
          <div className="p-20 text-center bg-white rounded-[2rem] border-4 border-dashed border-primary/5">
            <p className="text-muted-foreground font-black uppercase tracking-widest text-xs opacity-40">Empty Registry</p>
          </div>
        ) : (
          paginatedStudents.map(({student, subject}, index) => (
            <Card key={index} className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden group">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-5">
                  <Avatar className="h-16 w-16 border-2 border-primary/5 shadow-inner">
                    <AvatarImage src={student.profilePic || undefined} />
                    <AvatarFallback className="bg-muted text-primary font-black uppercase text-xl">{student.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="overflow-hidden">
                    <h3 className="font-black text-xl text-primary uppercase leading-none tracking-tight truncate">{student.name}</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1.5">{student.id}</p>
                  </div>
                </div>
                
                <div className="p-6 bg-muted/20 rounded-2xl border border-primary/5 space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-muted-foreground">Program:</span>
                    <span className="text-foreground">{student.program || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-muted-foreground">Year Level:</span>
                    <Badge variant="secondary" className="h-5 px-2 bg-primary/10 text-primary border-none">Year {student.year || '?'}</Badge>
                  </div>
                  <div className="flex flex-col gap-1 border-t border-white/40 pt-3">
                    <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Subject Load:</span>
                    <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{subject.name}</span>
                  </div>
                </div>

                <Button 
                  onClick={() => setSelectedStudent({student, subject})} 
                  className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] gap-2 shadow-xl shadow-primary/20 transition-all active:scale-95"
                >
                  <Eye size={16} /> View Full Profile
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Rows per page:</span>
            <Badge variant="outline" className="h-10 px-4 rounded-xl font-bold bg-white">{rowsPerPage}</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              disabled={currentPage === 1}
              onClick={() => goToPage(currentPage - 1)}
              className="h-12 w-12 rounded-xl font-black text-primary p-0 hover:bg-primary/5"
            >
              <ArrowLeft size={20} />
            </Button>
            
            <div className="flex gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => {
                  if (totalPages <= 5) return true;
                  return Math.abs(p - currentPage) <= 1 || p === 1 || p === totalPages;
                })
                .map((p, idx, arr) => {
                  const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                  return (
                    <div key={p} className="flex items-center gap-1.5">
                      {showEllipsis && <span className="text-muted-foreground">...</span>}
                      <button
                        onClick={() => goToPage(p)}
                        className={cn(
                          "h-12 w-12 rounded-xl font-black text-xs transition-all",
                          currentPage === p ? "bg-primary text-white shadow-lg scale-110" : "bg-white text-muted-foreground hover:bg-primary/5 shadow-sm border border-primary/5"
                        )}
                      >
                        {p}
                      </button>
                    </div>
                  );
                })}
            </div>

            <Button
              variant="ghost"
              disabled={currentPage === totalPages}
              onClick={() => goToPage(currentPage + 1)}
              className="h-12 w-12 rounded-xl font-black text-primary p-0 hover:bg-primary/5"
            >
              <ChevronRight size={20} />
            </Button>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4 md:p-8 animate-in fade-in duration-300">
          <Card className="bg-white rounded-[3rem] w-full max-w-lg max-h-[90vh] overflow-hidden shadow-3xl border-none flex flex-col relative">
            <button 
              onClick={() => setSelectedStudent(null)} 
              className="absolute top-6 right-6 z-[160] h-10 w-10 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-all"
            >
              <X size={24} />
            </button>

            <div className="bg-primary p-8 text-white flex flex-col items-center text-center space-y-4">
              <Avatar className="h-28 w-24 rounded-[2rem] border-4 border-white/20 shadow-2xl">
                <AvatarImage src={selectedStudent.student.profilePic || undefined} />
                <AvatarFallback className="bg-white/10 text-white font-black text-4xl">{selectedStudent.student.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="text-2xl font-black uppercase tracking-tight">{selectedStudent.student.name}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">{selectedStudent.student.id}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8 bg-white">
              <div className="space-y-4">
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shadow-sm"><BookOpen size={20} /></div>
                    <div className="overflow-hidden">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Enrolled Subject</p>
                      <p className="font-black text-slate-800 uppercase truncate text-sm">{selectedStudent.subject.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shadow-sm"><Smartphone size={20} /></div>
                    <div>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Academic Program</p>
                      <p className="font-black text-slate-800 uppercase text-sm">{selectedStudent.student.program || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Emergency Contact Information</h4>
                  <div className="p-8 rounded-[2.5rem] bg-red-50 border-2 border-red-100/50 space-y-4 shadow-sm">
                    <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                      <span className="font-black text-red-900/40 uppercase text-[10px] tracking-widest">Name:</span>
                      <span className="font-black text-sm text-red-900 uppercase truncate">{selectedStudent.student.emergencyContactName || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                      <span className="font-black text-red-900/40 uppercase text-[10px] tracking-widest">Address:</span>
                      <span className="font-bold text-xs text-red-900 uppercase leading-relaxed">{selectedStudent.student.emergencyContactAddress || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                      <span className="font-black text-red-900/40 uppercase text-[10px] tracking-widest">Tel No:</span>
                      <span className="font-black text-sm text-red-900">{selectedStudent.student.emergencyContactPhone || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-2 border-dashed rounded-[2rem] border-primary/5 text-center">
                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                  THIS IDENTITY SIGNAL IS FOR AUTHORIZED ACADEMIC VIEWING ONLY.
                </p>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex-none px-8">
              <Button onClick={() => setSelectedStudent(null)} className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl">
                Close Registry Detail
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
