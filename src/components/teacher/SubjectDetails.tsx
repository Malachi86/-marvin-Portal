'use client';

import { useState, useEffect } from 'react';

import { Subject, User, Attendance } from '@/utils/storage';

import {
  getUsersAction,
  getEnrollmentsAction,
  getAttendancesAction
} from '@/app/actions/dbActions';

import { Button } from '@/components/ui/button';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

import {
  ArrowLeft,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  School
} from 'lucide-react';

import StudentInfoDialog from './StudentInfoDialog';

interface SubjectDetailsProps {
  subject: Subject;
  onBack: () => void;
}

export default function SubjectDetails({ subject, onBack }: SubjectDetailsProps) {

  const [enrolledStudents, setEnrolledStudents] = useState<User[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalSessions, setTotalSessions] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 9;

  const firstSchedule = subject.schedules?.[0];

  useEffect(() => {
    loadData();
  }, [subject.id]);

  const loadData = async () => {

    setLoading(true);

    const users = await getUsersAction();
    const enrollments = await getEnrollmentsAction();
    const allAttendances = await getAttendancesAction();

    const subjectEnrollments =
      enrollments.filter(e =>
        e.subjectId === subject.id && e.status === 'approved'
      );

    const studentIds =
      subjectEnrollments.map(e => e.studentId);

    const students =
      users.filter(u => studentIds.includes(u.id));

    setEnrolledStudents(students);
    setAttendances(allAttendances);

    // FIX: Calculate total distinct days conducted for this subject
    const subjectAttendances = allAttendances.filter(a => a.subjectId === subject.id);
    const uniqueDays = Array.from(new Set(subjectAttendances.map(a => a.date.split('T')[0])));
    setTotalSessions(uniqueDays.length);

    setLoading(false);

  };

  const getStudentAttendanceStats = (studentId: string) => {

    const studentAttendances =
      attendances.filter(
        a => a.studentId === studentId && a.subjectId === subject.id
      );

    const present =
      studentAttendances.filter(a => a.status === 'present').length;

    const late =
      studentAttendances.filter(a => a.status === 'late').length;

    const explicitAbsent =
      studentAttendances.filter(a => a.status === 'absent').length;

    // Smart Absent Logic: Total Meetings Conducted - (Present + Late records)
    const attendedDays = new Set(studentAttendances.filter(a => a.status !== 'absent').map(a => a.date.split('T')[0])).size;
    const implicitAbsent = Math.max(0, totalSessions - attendedDays);
    
    const absent = implicitAbsent + explicitAbsent;

    return { present, late, absent, total: totalSessions || 1 };

  };

  const totalPages =
    Math.ceil(enrolledStudents.length / studentsPerPage);

  const paginatedStudents =
    enrolledStudents.slice(
      (currentPage - 1) * studentsPerPage,
      currentPage * studentsPerPage
    );

  return (

    <div className="min-h-screen bg-muted/20">

      {/* Header */}

      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">

        <div className="container mx-auto px-4 sm:px-6 py-5">

          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center gap-4">

            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <School className="text-white h-6 w-6" />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                {subject.name}
              </h1>

              <p className="text-xs text-muted-foreground">
                {firstSchedule
                  ? `${firstSchedule.day} • ${firstSchedule.startTime}`
                  : "No schedule"}
              </p>
            </div>

          </div>

        </div>

      </header>

      {/* Content */}

      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">

        <Card>

          <CardHeader>

            <CardTitle className="flex items-center gap-2">

              <Users size={20} />

              Class Roster ({enrolledStudents.length})

            </CardTitle>

          </CardHeader>

          <CardContent>

            {loading ? (

              <div className="text-center py-12 text-muted-foreground">
                Loading students...
              </div>

            ) : enrolledStudents.length === 0 ? (

              <div className="text-center py-16">

                <Users className="mx-auto mb-3 opacity-40" size={40} />

                <p className="text-muted-foreground">
                  No students enrolled yet
                </p>

              </div>

            ) : (

              <>

                {/* Student Grid */}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                  {paginatedStudents.map(student => {

                    const stats =
                      getStudentAttendanceStats(student.id);

                    // Rate: Present=100%, Late=80%, Absent=0%
                    const rate = Math.round(((stats.present * 1 + stats.late * 0.8) / stats.total) * 100);

                    return (

                      <Card
                        key={student.id}
                        className="cursor-pointer hover:shadow-md transition bg-white rounded-xl overflow-hidden border-primary/5"
                        onClick={() => setSelectedStudent(student)}
                      >

                        <CardContent className="p-6 space-y-4">

                          {/* Student Info */}

                          <div className="flex items-center gap-4">

                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">

                              {student.profilePic ? (

                                <img
                                  src={student.profilePic}
                                  alt={student.name}
                                  className="w-full h-full object-cover"
                                />

                              ) : (

                                <span className="font-bold text-primary">
                                  {student.name.charAt(0)}
                                </span>

                              )}

                            </div>

                            <div>

                              <p className="font-semibold truncate">
                                {student.name}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                ID: {student.id}
                              </p>

                            </div>

                          </div>

                          {/* Stats */}

                          <div className="grid grid-cols-3 gap-2 text-center py-4 border-y border-primary/5">

                            <div className="text-green-600">
                              <CheckCircle size={16} className="mx-auto mb-1" />
                              <p className="font-bold text-lg">{stats.present}</p>
                            </div>

                            <div className="text-amber-600">
                              <Clock size={16} className="mx-auto mb-1" />
                              <p className="font-bold text-lg">{stats.late}</p>
                            </div>

                            <div className="text-red-600">
                              <XCircle size={16} className="mx-auto mb-1" />
                              <p className="font-bold text-lg">{stats.absent}</p>
                            </div>

                          </div>

                          <div className="text-center pt-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                              Attendance Rate
                            </p>
                            <p className="font-black text-primary text-2xl tracking-tighter">
                              {rate}%
                            </p>
                          </div>

                        </CardContent>

                      </Card>

                    );

                  })}

                </div>

                {/* Pagination */}

                {totalPages > 1 && (

                  <div className="flex justify-center gap-2 mt-6">

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (

                      <Button
                        key={page}
                        size="sm"
                        variant={page === currentPage ? "default" : "outline"}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>

                    ))}

                  </div>

                )}

              </>

            )}

          </CardContent>

        </Card>

      </main>

      {/* Student Info Dialog */}

      {selectedStudent && (

        <StudentInfoDialog
          student={selectedStudent}
          subject={subject}
          onClose={() => setSelectedStudent(null)}
        />

      )}

    </div>

  );

}
