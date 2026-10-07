'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../shared/Layout';
import { useAuth } from '../../contexts/AuthContext';

import {
Book,
Users,
School,
Loader2,
ClipboardList,
Smartphone,
Activity,
Calendar,
ShieldCheck,
Zap,
ArrowRight,
Clock,
CheckCircle2
} from 'lucide-react';

import PendingRequests from './PendingRequests';
import PendingEnrollments from './PendingEnrollments';
import EnrolledStudents from './EnrolledStudents';
import ManageSubjects from './ManageSubjects';
import LabView from './LabView';
import RoomReservations from './RoomReservations';
import AttendanceRecords from './AttendanceRecords';
import TeacherCalendar from './TeacherCalendar';
import QRScanner from './QRScanner';
import SubjectDetails from './SubjectDetails';
import Classwork from './Classwork/index';
import GradingSetup from './GradingSetup';
import ProfileView from '../shared/ProfileView';
import MyAdvisory from './MyAdvisory';

import {
getSubjectsAction,
getEnrollmentsAction,
getLabRequestsAction,
getTermsAction
} from '@/app/actions/dbActions';

import { Term, Subject } from '@/utils/storage';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';

function StatCard({title, value, icon, onClick, colorClass}: any){
  return(
    <Card 
      onClick={onClick}
      className={cn(
        "bg-white p-6 rounded-[2rem] border-none shadow-xl flex items-center justify-between min-h-[120px] transition-all duration-300 group",
        onClick && "cursor-pointer hover:shadow-2xl hover:-translate-y-1"
      )}
    >
      <div className="relative z-10 space-y-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">
          {title}
        </p>
        <p className="text-4xl font-black text-slate-900 tracking-tighter">
          {value}
        </p>
      </div>
      <div className={cn(
        "h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner transition-colors",
        colorClass || "bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white"
      )}>
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 24 }) : icon}
      </div>
    </Card>
  );
}

export default function TeacherDashboard() {
  const { user } = useAuth();

  const [currentView, setCurrentView] = useState('home');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [activeTerms, setActiveTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [todayClasses, setTodayClasses] = useState<any[]>([]);

  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalStudents: 0,
    pendingEnrollments: 0,
    pendingRequests: 0
  });

  useEffect(() => {
    const signal = localStorage.getItem('notif_deep_link');
    if (signal && user?.role === 'teacher') {
      try {
        const { type } = JSON.parse(signal);
        if (type === 'submission') {
          setCurrentView('classwork');
        }
      } catch (e) {
        console.error("Deep link signal error", e);
      }
    }
  }, [currentView, user?.role]);

  useEffect(() => {
    if (user) loadDashboard();
  }, [user, currentView]);

  const loadDashboard = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const [
        subjectsData,
        enrollmentsData,
        requestsData,
        termData
      ] = await Promise.all([
        getSubjectsAction(),
        getEnrollmentsAction(),
        getLabRequestsAction(),
        getTermsAction()
      ]);

      const teacherSubjects = subjectsData.filter(s => s.teacherId === user.id);
      const teacherSubjectIds = teacherSubjects.map(s => s.id);

      const active = termData.filter(t => t.status === 'active');
      setActiveTerms(active);

      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayDay = days[new Date().getDay()];
      const now = new Date();

      const classesToday = teacherSubjects.flatMap(subject => {
        if (!subject.schedules) return [];
        return subject.schedules
          .filter((s: any) => s.day === todayDay)
          .map((s: any) => {
            const start = new Date();
            const end = new Date();
            const [sh, sm] = s.startTime.split(':').map(Number);
            const [eh, em] = s.dismissalTime.split(':').map(Number);
            start.setHours(sh, sm, 0);
            end.setHours(eh, em, 0);

            let status: 'Ongoing' | 'Upcoming' | 'Ended' = 'Upcoming';
            if (now >= start && now <= end) status = 'Ongoing';
            else if (now > end) status = 'Ended';

            return {
              id: subject.id,
              name: subject.name,
              time: `${s.startTime} - ${s.dismissalTime}`,
              status
            };
          });
      });
      setTodayClasses(classesToday.sort((a, b) => a.time.localeCompare(b.time)));

      const subjectsWithCounts = teacherSubjects.map(subject => {
        const studentCount = enrollmentsData.filter(
          e => e.subjectId === subject.id && e.status === 'approved'
        ).length;

        const pendingItems = 
          enrollmentsData.filter(e => e.subjectId === subject.id && e.status === 'pending').length +
          requestsData.filter(r => r.subjectId === subject.id && r.status === 'pending').length;

        return { ...subject, studentCount, pendingItems };
      });

      const uniqueStudentIds = new Set(
        enrollmentsData
          .filter(e => teacherSubjectIds.includes(e.subjectId) && e.status === 'approved')
          .map(e => e.studentId)
      );
      const totalStudents = uniqueStudentIds.size;

      const pendingEnrollments = enrollmentsData.filter(
        e => teacherSubjectIds.includes(e.subjectId) && e.status === 'pending'
      ).length;

      const pendingRequests = requestsData.filter(r => {
        return teacherSubjectIds.includes(r.subjectId) && r.status === 'pending';
      }).length;

      setSubjects(subjectsWithCounts);
      setStats({
        totalSubjects: teacherSubjects.length,
        totalStudents,
        pendingEnrollments,
        pendingRequests
      });

    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderHome = () => (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="space-y-1">
          <h2 className="text-[2.2rem] font-black text-primary tracking-tighter leading-none uppercase">
            Faculty Hub
          </h2>
          <p className="text-[13px] font-bold text-muted-foreground mt-2 uppercase tracking-widest">
            Welcome back, {user?.name}
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          {activeTerms.map(term => (
            <Badge
              key={term.id}
              variant="outline"
              className="h-10 px-6 text-[10px] font-black rounded-full bg-white border-2 border-primary text-primary shadow-sm whitespace-nowrap uppercase tracking-widest"
            >
              Cycle: {term.name}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Course load"
          value={stats.totalSubjects}
          icon={<Smartphone />}
          onClick={() => setCurrentView('manage-subjects')}
        />
        <StatCard
          title="Enrolled students"
          value={stats.totalStudents}
          icon={<Users />}
          onClick={() => setCurrentView('enrolled-students')}
        />
        <StatCard
          title="Pending enrollments"
          value={stats.pendingEnrollments}
          icon={<School />}
          onClick={() => setCurrentView('pending-enrollments')}
          colorClass="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Action requests"
          value={stats.pendingRequests}
          icon={<ClipboardList />}
          onClick={() => setCurrentView('pending-requests')}
          colorClass="bg-blue-50 text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <Card className="lg:col-span-8 bg-white rounded-[2.5rem] border-none shadow-2xl p-8 md:p-10 flex flex-col space-y-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                <Activity size={22} />
              </div>
              <h3 className="text-xl font-black tracking-tighter text-slate-800 uppercase">Operational Overview</h3>
            </div>
            <button 
              onClick={() => setCurrentView('schedule')}
              className="h-12 px-6 bg-white border-2 border-primary/5 hover:border-primary/20 rounded-2xl flex items-center gap-2 transition-all font-black text-[10px] tracking-widest text-muted-foreground shadow-sm uppercase"
            >
              <Calendar size={14} className="text-primary" />
              View calendar
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            {todayClasses.length === 0 ? (
                <div className="h-full bg-muted/20 border-4 border-dashed border-primary/5 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center group transition-all hover:bg-white hover:border-primary/10">
                    <div className="h-20 w-20 rounded-full bg-white shadow-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Users size={32} className="text-primary/20" />
                    </div>
                    <h4 className="text-xl font-black text-primary tracking-tight uppercase">No Classes Today</h4>
                    <p className="text-[10px] font-bold text-muted-foreground tracking-widest mt-2 uppercase">Enjoy your teaching break or prepare modules</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    <p className="text-[10px] font-black tracking-[0.1em] text-primary/40 ml-2 uppercase">Assigned classes for {format(new Date(), 'EEEE')}</p>
                    {todayClasses.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-primary/5 group hover:bg-white hover:shadow-xl hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-6">
                                <div className="h-14 w-14 rounded-2xl bg-white border border-primary/10 flex items-center justify-center text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                                    <School size={24} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black tracking-tight text-slate-800 uppercase">{item.name}</h4>
                                    <div className="flex items-center gap-3 mt-1">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                                            <Clock size={12} className="text-primary/60" />
                                            {item.time}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Badge className={cn(
                                "px-5 py-2 rounded-full font-black text-[9px] tracking-widest border-none shadow-md uppercase",
                                item.status === 'Ongoing' ? "bg-green-500 text-white animate-pulse" : 
                                item.status === 'Ended' ? "bg-slate-300 text-slate-500" : "bg-primary/10 text-primary"
                            )}>
                                {item.status}
                            </Badge>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-4 bg-[#14343A] rounded-[2.5rem] border-none shadow-2xl p-10 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
            <Zap size={180} fill="currentColor" className="text-white" />
          </div>

          <div className="relative z-10 space-y-10">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-xl font-black text-white tracking-tighter uppercase">Session validation</h3>
              </div>
              <Badge className="bg-green-500/20 text-green-400 font-black text-[8px] tracking-widest border-none px-3 flex items-center gap-2 uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                Capture OK
              </Badge>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black tracking-widest text-white/40 uppercase">Identity terminal v1.0</p>
              <p className="text-sm font-medium text-white/80 leading-relaxed">
                Capture student arrivals and assign workstations for the current academic period.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-10">
            <button 
              onClick={() => setCurrentView('scanner')}
              className="w-full h-20 bg-[#D1432A] hover:bg-[#B33620] text-white font-black text-xs tracking-[0.2em] rounded-2xl shadow-[0_20px_50px_-12px_rgba(209,67,42,0.4)] transition-all active:scale-95 flex items-center justify-center gap-3 uppercase"
            >
              <Users size={20} />
              Initialize scanner
            </button>
          </div>
        </Card>
      </div>

      <div className="space-y-6 pt-6">
        <div className="flex items-center gap-3 ml-2">
          <Book size={20} className="text-primary" />
          <h3 className="font-black text-lg tracking-tight uppercase">Assigned subjects</h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40}/></div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border-primary/5 shadow-xl">
            <Book size={56} className="mx-auto text-primary opacity-20 mb-6" />
            <h3 className="text-xl font-black tracking-tighter uppercase">No subjects assigned</h3>
            <p className="text-xs font-bold text-muted-foreground tracking-widest mt-2 mb-8 uppercase">Provision your load to start teaching.</p>
            <button onClick={() => setCurrentView('manage-subjects')} className="px-10 h-14 rounded-2xl bg-primary text-white text-[10px] font-black tracking-widest hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all uppercase">Create subject</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {subjects.map(subject => (
              <Card
                key={subject.id}
                onClick={() => setSelectedSubject(subject)}
                className="bg-white rounded-[2rem] border-primary/5 p-8_cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all group relative overflow-hidden"
              >
                <div className="h-1.5 bg-primary absolute top-0 left-0 right-0" />
                {subject.pendingItems > 0 && (
                  <div className="absolute top-0 right-0 z-20">
                    <div className="relative">
                      <div className="bg-red-600 text-white w-10 h-10 rounded-bl-[2rem] flex items-start justify-end p-2 shadow-lg">
                        <span className="text-[10px] font-black">{subject.pendingItems}</span>
                      </div>
                      <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full animate-ping opacity-40" />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <School size={24}/>
                  </div>
                  <h3 className="font-black text-primary tracking-tight group-hover:text-primary transition-colors leading-tight uppercase">
                    {subject.name}
                  </h3>
                </div>
                <div className="text-[10px] font-black text-muted-foreground tracking-widest space-y-2 mb-6 uppercase">
                  {subject.schedules?.map((s: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/20"/>
                      {s.day} • {s.startTime}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center border-t pt-5">
                  <span className="text-[9px] font-black tracking-widest text-muted-foreground uppercase">Enrollments</span>
                  <span className="flex items-center gap-1.5 text-primary font-black">
                    {subject.studentCount}
                    <Users size={14}/>
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    if(selectedSubject)
      return(
        <SubjectDetails
          subject={selectedSubject}
          onBack={() => {
            setSelectedSubject(null);
            loadDashboard();
          }}
        />
      );

    switch(currentView){
      case 'home': return renderHome();
      case 'schedule': return <TeacherCalendar subjects={subjects}/>;
      case 'scanner': return <QRScanner/>;
      case 'classwork': return <Classwork />;
      case 'grading': return <GradingSetup/>;
      case 'advisory': return <MyAdvisory onBack={() => setCurrentView('home')} />;
      case 'pending-requests': return <PendingRequests/>;
      case 'pending-enrollments': return <PendingEnrollments/>;
      case 'enrolled-students': return <EnrolledStudents/>;
      case 'lab-view': return <LabView/>;
      case 'manage-subjects': return <ManageSubjects/>;
      case 'reservations': return <RoomReservations/>;
      case 'attendance-records': return <AttendanceRecords/>;
      case 'profile': return <ProfileView onBack={() => setCurrentView('home')} />;
      default: return renderHome();
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      <div className="h-full">
        {renderContent()}
      </div>
    </Layout>
  );
}