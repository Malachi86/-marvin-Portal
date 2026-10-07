'use client';

import { useAuth } from '@/contexts/AuthContext';
import LoginPage from '@/components/auth/LoginPage';
import TeacherDashboard from '@/components/teacher/TeacherDashboard';
import StudentDashboard from '@/components/student/StudentDashboard';
import AdminDashboard from '@/components/admin/AdminDashboard';
import LibraryDashboard from '@/components/library/LibraryDashboard';
import GuardDashboard from '@/components/guard/GuardDashboard';
import { Toaster } from 'sonner';

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
            <div className="animate-pulse flex flex-col items-center">
                <a 
                  href="https://myportfolio-48bb2.web.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-16 h-16 bg-primary rounded-2xl mb-4 flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer"
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m8 3 4 8 5-5 5 15H2L8 3z"/>
                  </svg>
                </a>
                <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-sm">AMS:AMACC</p>
                <p className="text-[8px] font-bold text-primary/40 mt-2 tracking-[0.3em] uppercase">Establishing Connection...</p>
            </div>
        </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'student':
      return <StudentDashboard />;
    case 'library_admin':
      return <LibraryDashboard />;
    case 'guard':
      return <GuardDashboard />;
    default:
      return <LoginPage />;
  }
};

const App = () => {
  return (
    <>
      <AppContent />
      <Toaster position="top-center" richColors />
    </>
  );
};

export default App;
