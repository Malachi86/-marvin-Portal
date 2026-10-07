'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  BookOpen, 
  UserPlus, 
  ClipboardList, 
  Book, 
  Loader2, 
  CheckCircle2, 
  Info, 
  GraduationCap, 
  Clock, 
  Send,
  FileText,
  CheckCircle,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getUsersAction, 
  getClassworksAction, 
  getSubmissionsAction, 
  getTermEnrollmentsAction, 
  getBorrowRequestsAction,
  getSubjectsAction,
  getAcademicRecordsAction,
  getTermsAction,
  getEnrollmentsAction,
  getLabRequestsAction
} from '@/app/actions/dbActions';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: 'classwork' | 'assignment-grade' | 'final-grade' | 'approval' | 'enrollment' | 'library' | 'submission' | 'enrollment-update' | 'request-status' | 'pending-request' | 'pending-enrollment';
  timestamp: string;
  meta?: {
    subjectId?: string;
    classworkId?: string;
    studentId?: string;
    termId?: string;
  };
}

interface NotificationBellProps {
  onNavigate: (view: string) => void;
  currentView?: string;
}

export default function NotificationBell({ onNavigate, currentView }: NotificationBellProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // --- AUTO DISMISS LOGIC ---
  // If the user navigates to a relevant section, mark those notifications as "permanently dismissed"
  useEffect(() => {
    if (!currentView || !notifications.length || !user) return;

    let typesToDismiss: NotificationItem['type'][] = [];

    // Map view to notification types
    if (currentView === 'subjects') typesToDismiss = ['enrollment-update'];
    if (currentView === 'my-requests') typesToDismiss = ['request-status'];
    if (currentView === 'classwork') typesToDismiss = ['classwork', 'assignment-grade', 'submission'];
    if (currentView === 'view-card') typesToDismiss = ['final-grade'];
    if (currentView === 'pending-enrollments') typesToDismiss = ['pending-enrollment'];
    if (currentView === 'pending-requests') typesToDismiss = ['pending-request'];
    if (currentView === 'users') typesToDismiss = ['approval'];
    if (currentView === 'terms') typesToDismiss = ['enrollment'];
    if (currentView === 'borrow-requests') typesToDismiss = ['library'];

    if (typesToDismiss.length > 0) {
      const storageKey = `notif_dismissed_${user.id}`;
      const dismissedIds = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      const idsToMark = notifications
        .filter(n => typesToDismiss.includes(n.type))
        .map(n => n.id);
      
      if (idsToMark.length > 0) {
        const updatedDismissed = Array.from(new Set([...dismissedIds, ...idsToMark]));
        localStorage.setItem(storageKey, JSON.stringify(updatedDismissed));
        setNotifications(prev => prev.filter(n => !idsToMark.includes(n.id)));
      }
    }
  }, [currentView, notifications, user]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const items: NotificationItem[] = [];
      const dismissedIds = JSON.parse(localStorage.getItem(`notif_dismissed_${user.id}`) || '[]');

      if (user.role === 'student') {
        const [cws, subs, records, terms, enrollments, allSubjects, labRequests] = await Promise.all([
          getClassworksAction(), 
          getSubmissionsAction(),
          getAcademicRecordsAction(),
          getTermsAction(),
          getEnrollmentsAction(),
          getSubjectsAction(),
          getLabRequestsAction()
        ]);
        
        const myEnrollments = enrollments.filter(e => e.studentId === user.id);
        const myApprovedSubjectIds = myEnrollments
          .filter(e => e.status === 'approved')
          .map(e => e.subjectId);

        const mySubs = subs.filter(s => s.studentId === user.id);
        
        // Enrollment updates
        myEnrollments.filter(e => e.status !== 'pending').forEach(e => {
          const subject = allSubjects.find(s => s.id === e.subjectId);
          items.push({
            id: `enr-upd-${e.id}-${e.status}`,
            title: `ENROLLMENT ${e.status.toUpperCase()}`,
            description: `Ang iyong request sa ${subject?.name || 'Subject'} ay ${e.status}.`,
            type: 'enrollment-update',
            timestamp: e.enrolledAt,
            meta: { subjectId: e.subjectId }
          });
        });

        // Lab request updates
        labRequests.filter(r => r.studentId === user.id && r.status !== 'pending').forEach(r => {
          const subject = allSubjects.find(s => s.id === r.subjectId);
          const subjName = r.subjectId === 'personal_use' ? 'Personal Use' : (r.subjectId === 'exam' ? 'Exam' : (subject?.name || 'Subject'));
          items.push({
            id: `req-upd-${r.id}-${r.status}`,
            title: `REQUEST ${r.status.toUpperCase()}`,
            description: `Ang iyong booking para sa ${subjName} ay ${r.status}.`,
            type: 'request-status',
            timestamp: r.startTime
          });
        });

        // New classworks (Filter out exempted)
        const currentUserId = user.id.trim();
        cws.filter(cw => cw.status === 'published' && myApprovedSubjectIds.includes(cw.subjectId)).forEach(cw => {
          const hasSubmitted = mySubs.some(s => s.classworkId === cw.id);
          const isExempted = cw.exemptedStudentIds?.some(id => id.trim() === currentUserId);
          const subject = allSubjects.find(s => s.id === cw.subjectId);
          if (!hasSubmitted && !isExempted) {
            items.push({
              id: `cw-${cw.id}`,
              title: `NEW TASK: ${cw.title}`,
              description: `Subject: ${subject?.name || 'Class'} | Deadline: ${format(new Date(cw.dueDate), "MMM dd, h:mm a")}`,
              type: 'classwork',
              timestamp: cw.createdAt,
              meta: { subjectId: cw.subjectId, classworkId: cw.id }
            });
          }
        });

        // Graded items
        mySubs.filter(s => s.status === 'graded').forEach(s => {
          const cw = cws.find(c => c.id === s.classworkId);
          const subject = allSubjects.find(subj => subj.id === cw?.subjectId);
          if (cw && myApprovedSubjectIds.includes(cw.subjectId)) {
            items.push({
              id: `grade-${s.id}`,
              title: `GRADE RELEASED: ${cw.title}`,
              description: `Subject: ${subject?.name || 'Class'} | Review your score in Classwork.`,
              type: 'assignment-grade',
              timestamp: s.submittedAt,
              meta: { subjectId: cw.subjectId, classworkId: cw.id }
            });
          }
        });

        // Term finalized grades
        const myRecords = records.filter(r => r.studentId === user.id);
        const endedTerms = terms.filter(t => t.status === 'ended');
        endedTerms.forEach(term => {
          if (myRecords.some(r => r.termId === term.id)) {
            items.push({
              id: `final-${term.id}`,
              title: "OFFICIAL GRADES FINALIZED",
              description: `Your records for ${term.name} are now archived in Grade Slip.`,
              type: 'final-grade',
              timestamp: term.endedAt || term.createdAt,
              meta: { termId: term.id }
            });
          }
        });
      }

      if (user.role === 'teacher') {
        const [subs, subjects, usersList, classworks, enrollments, labRequests] = await Promise.all([
          getSubmissionsAction(), 
          getSubjectsAction(),
          getUsersAction(),
          getClassworksAction(),
          getEnrollmentsAction(),
          getLabRequestsAction()
        ]);
        const mySubjectIds = subjects.filter(s => s.teacherId === user.id).map(s => s.id);
        
        // Pending enrollments
        enrollments.filter(e => e.status === 'pending' && mySubjectIds.includes(e.subjectId)).forEach(e => {
          const student = usersList.find(u => u.id === e.studentId);
          const subject = subjects.find(s => s.id === e.subjectId);
          items.push({
            id: `p-enr-${e.id}`,
            title: "PENDING ENROLLMENT",
            description: `${student?.name || 'Student'} is requesting to join ${subject?.name || 'Class'}.`,
            type: 'pending-enrollment',
            timestamp: e.enrolledAt
          });
        });

        // Pending lab requests
        labRequests.filter(r => r.status === 'pending' && mySubjectIds.includes(r.subjectId)).forEach(r => {
          const student = usersList.find(u => u.id === r.studentId);
          const subject = subjects.find(s => s.id === r.subjectId);
          const subjName = r.subjectId === 'personal_use' ? 'Personal Use' : (r.subjectId === 'exam' ? 'Exam' : (subject?.name || 'Subject'));
          items.push({
            id: `p-req-${r.id}`,
            title: "PENDING LAB REQUEST",
            description: `${student?.name || 'Student'} requested a session for ${subjName}.`,
            type: 'pending-request',
            timestamp: r.startTime
          });
        });

        // New submissions
        subs.filter(s => s.status === 'submitted').forEach(s => {
          const cw = classworks.find(c => c.id === s.classworkId);
          const subject = subjects.find(subj => subj.id === cw?.subjectId);
          const student = usersList.find(u => u.id === s.studentId);
          
          if (cw && mySubjectIds.includes(cw.subjectId)) {
            items.push({
              id: `sub-${s.id}`,
              title: `SUBMISSION: ${student?.name || 'Student'}`,
              description: `Subject: ${subject?.name || 'Class'} | Task: ${cw.title}`,
              type: 'submission',
              timestamp: s.submittedAt,
              meta: { subjectId: cw.subjectId, classworkId: cw.id, studentId: s.studentId }
            });
          }
        });
      }

      if (user.role === 'admin') {
        const [usersList, termEnr, allTerms] = await Promise.all([getUsersAction(), getTermEnrollmentsAction(), getTermsAction()]);
        
        // Pending user approvals
        usersList.filter(u => u.isApproved === false).forEach(u => {
          items.push({
            id: `reg-${u.id}`,
            title: "PENDING REGISTRATION",
            description: `${u.name} (${u.id}) is requesting account authorization.`,
            type: 'approval',
            timestamp: new Date().toISOString()
          });
        });

        // Term enrollment requests
        termEnr.filter(te => te.status === 'pending').forEach(te => {
          const term = allTerms.find(t => t.id === te.termId);
          items.push({
            id: `te-${te.id}`,
            title: "TERM ENROLLMENT REQUEST",
            description: `A student is requesting entry to ${term?.name || 'Academic Term'}.`,
            type: 'enrollment',
            timestamp: te.enrolledAt
          });
        });
      }

      if (user.role === 'library_admin') {
        const reqs = await getBorrowRequestsAction();
        reqs.filter(r => r.status === 'pending').forEach(r => {
          items.push({
            id: `lib-${r.id}`,
            title: "BOOK BORROW REQUEST",
            description: `${r.studentName} is requesting "${r.bookTitle}".`,
            type: 'library',
            timestamp: r.requestedAt
          });
        });
      }

      // Final processing: filter out manually dismissed items
      const filtered = items.filter(n => !dismissedIds.includes(n.id));
      const sorted = filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setNotifications(sorted);
      
      // Update unread count based on last seen notification ID
      const lastSeenId = localStorage.getItem(`notif_last_seen_${user.id}`);
      if (sorted.length > 0 && sorted[0].id !== lastSeenId) {
        setUnreadCount(sorted.length);
      } else {
        setUnreadCount(0);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleOpen = () => {
    if (notifications.length > 0) {
      localStorage.setItem(`notif_last_seen_${user?.id}`, notifications[0].id);
    }
    setUnreadCount(0);
  };

  const dismissNotification = (id: string) => {
    if (!user) return;
    const storageKey = `notif_dismissed_${user.id}`;
    const dismissedIds = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const updated = Array.from(new Set([...dismissedIds, id]));
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleItemClick = (n: NotificationItem) => {
    let targetView = '';
    
    if (n.meta) {
      localStorage.setItem('notif_deep_link', JSON.stringify({ ...n.meta, type: n.type }));
    }

    if (user?.role === 'student') {
      if (n.type === 'classwork' || n.type === 'assignment-grade') targetView = 'classwork';
      if (n.type === 'final-grade') targetView = 'view-card';
      if (n.type === 'enrollment-update') targetView = 'subjects';
      if (n.type === 'request-status') targetView = 'my-requests';
    } else if (user?.role === 'teacher') {
      if (n.type === 'submission') targetView = 'classwork';
      if (n.type === 'pending-enrollment') targetView = 'pending-enrollments';
      if (n.type === 'pending-request') targetView = 'pending-requests';
    } else if (user?.role === 'admin') {
      if (n.type === 'approval') targetView = 'users';
      if (n.type === 'enrollment') targetView = 'terms';
    } else if (user?.role === 'library_admin') {
      if (n.type === 'library') targetView = 'borrow-requests';
    }

    dismissNotification(n.id);

    if (targetView) {
      onNavigate(targetView);
      setIsOpen(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'classwork': return <ClipboardList className="text-[#D1432A]" size={16} />;
      case 'submission': return <Send className="text-blue-500" size={16} />;
      case 'assignment-grade': return <CheckCircle2 className="text-green-600" size={16} />;
      case 'final-grade': return <GraduationCap className="text-accent" size={16} />;
      case 'approval': return <UserPlus className="text-blue-600" size={16} />;
      case 'enrollment': return <Info className="text-amber-600" size={16} />;
      case 'pending-enrollment': return <UserPlus className="text-primary" size={16} />;
      case 'pending-request': return <FileText className="text-primary" size={16} />;
      case 'enrollment-update':
      case 'request-status': return <CheckCircle className="text-green-600" size={16} />;
      case 'library': return <Book className="text-primary" size={16} />;
      default: return <Bell size={16} />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={(val) => { setIsOpen(val); if(val) handleOpen(); }}>
      <PopoverTrigger asChild>
        <button className="relative p-3 hover:bg-white/10 rounded-full transition-all group active:scale-95">
          <Bell className={cn("h-7 w-7 text-white/70 group-hover:text-white transition-colors", unreadCount > 0 && "animate-bounce")} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-5 min-w-5 flex items-center justify-center bg-accent text-white text-[10px] font-black rounded-full border-2 border-primary px-1 shadow-lg">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[90vw] max-w-[420px] p-0 border-none rounded-[2.5rem] shadow-3xl overflow-hidden bg-white z-[120]">
        <div className="bg-[#D1432A] p-8 text-white">
          <h3 className="font-black uppercase tracking-tighter text-2xl flex items-center gap-3">
            <Bell size={24} /> NOTIFICATIONS
          </h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mt-2">Updates requiring your attention</p>
        </div>
        
        <div className="max-h-[450px] overflow-y-auto no-scrollbar py-2">
          {loading && notifications.length === 0 ? (
            <div className="p-16 text-center">
              <Loader2 className="animate-spin text-primary mx-auto mb-4 h-10 w-10" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Syncing academic intel...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-20 text-center space-y-4">
              <div className="h-20 w-20 rounded-[2rem] bg-muted/50 mx-auto flex items-center justify-center text-muted-foreground/20">
                <Bell size={40} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Workspace clear</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  onClick={() => handleItemClick(n)}
                  className="p-6 hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <div className="flex gap-5">
                    <div className="h-12 w-12 rounded-2xl bg-muted/30 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:shadow-md transition-all">
                      {getIcon(n.type)}
                    </div>
                    <div className="space-y-1.5 overflow-hidden flex-1">
                      <p className="font-black text-sm uppercase tracking-tight text-slate-800 leading-none">{n.title}</p>
                      <p className="text-xs font-medium text-slate-500 leading-relaxed">{n.description}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-primary/30 pt-1 flex items-center gap-1">
                        <Clock size={10} />
                        {format(new Date(n.timestamp), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); dismissNotification(n.id); }}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-[#CFD8DC]/40 p-6 text-center border-t border-slate-100">
          <button 
            onClick={() => {
              if (!user) return;
              const storageKey = `notif_dismissed_${user.id}`;
              const dismissedIds = JSON.parse(localStorage.getItem(storageKey) || '[]');
              const updated = Array.from(new Set([...dismissedIds, ...notifications.map(n => n.id)]));
              localStorage.setItem(storageKey, JSON.stringify(updated));
              setNotifications([]);
              setIsOpen(false);
            }} 
            className="text-[11px] font-black uppercase tracking-[0.2em] text-[#D1432A] hover:underline transition-all"
          >
            ACKNOWLEDGE ALL UPDATES
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
