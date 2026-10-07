'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Home, Book, FileText, Calendar, Users, Settings, LogOut,
  BookOpen, BarChart3, FileCheck, Menu, X, Monitor, MapPin, Scan, GraduationCap, MessageCircle, School, ShieldAlert, HelpCircle, Palette, UserPlus, ClipboardList, Smartphone, Clock, Building2, History, Library
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import ChatContainer from '../Chat/ChatContainer';
import { cn } from '@/lib/utils';
import UserGuide from './UserGuide';
import NotificationBell from './NotificationBell';
import AnnouncementPopup from './AnnouncementPopup';
import SessionTerminal from '../student/SessionTerminal';
import { getSectionsAction } from '@/app/actions/dbActions';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

export default function Layout({ children, currentView, onNavigate }: LayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [isAdviser, setIsAdviser] = useState(false);

  // Dynamic Advisory Check: Monitors the Campus Registry for assignments
  useEffect(() => {
    if (user?.role === 'teacher') {
      const checkAdvisory = async () => {
        try {
          const sections = await getSectionsAction();
          const hasAdvisory = sections.some(s => s.advisoryTeacherId === user.id);
          setIsAdviser(hasAdvisory);
        } catch (e) {}
      };
      
      checkAdvisory();
      
      // Listen for registry changes from the Admin
      const handleSync = (e: any) => {
        if (e.detail?.collection === 'sections') checkAdvisory();
      };
      window.addEventListener('neural_sync_update', handleSync);
      return () => window.removeEventListener('neural_sync_update', handleSync);
    }
  }, [user]);

  const getMenuItems = () => {
    if (!user) return [];
    switch (user.role) {
      case 'student':
        return [
          { id: 'home', label: 'Dashboard', icon: Home },
          { id: 'chat', label: 'Messages', icon: MessageCircle },
          { id: 'grades', label: 'Grades & Records', icon: BarChart3 },
          { id: 'subjects', label: 'My subjects', icon: Smartphone },
          { id: 'classwork', label: 'Classwork', icon: ClipboardList },
          { id: 'make-request', label: 'Make request', icon: FileText },
          { id: 'my-requests', label: 'My requests', icon: FileCheck },
          { id: 'my-sessions', label: 'My sessions', icon: Clock },
          { id: 'library', label: 'Library hub', icon: BookOpen },
        ];
      case 'teacher':
        const items = [
          { id: 'home', label: 'Dashboard', icon: Home },
          { id: 'chat', label: 'Messages', icon: MessageCircle },
          { id: 'grading', label: 'Grading setup', icon: BarChart3 },
          { id: 'scanner', label: 'Universal Scanner', icon: Scan },
          { id: 'schedule', label: 'My schedule', icon: Calendar },
          { id: 'manage-subjects', label: 'Manage subjects', icon: Book },
          { id: 'classwork', label: 'Classwork', icon: FileCheck },
          { id: 'reservations', label: 'Room reservations', icon: MapPin },
          { id: 'pending-requests', label: 'Pending requests', icon: ClipboardList },
          { id: 'attendance-records', label: 'Attendance records', icon: FileCheck },
        ];
        
        // Show Advisory if teacher is found in the sections registry
        if (isAdviser) {
            items.splice(4, 0, { id: 'advisory', label: 'My Advisory', icon: Users });
        }
        
        return items;
      case 'admin':
        return [
          { id: 'home', label: 'Dashboard', icon: Home },
          { id: 'design', label: 'Design lab', icon: Palette },
          { id: 'security', label: 'Security center', icon: ShieldAlert },
          { id: 'terms', label: 'Term management', icon: School },
          { id: 'users', label: 'Manage users', icon: Users },
          { id: 'infrastructure', label: 'Campus Registry', icon: Building2 },
          { id: 'requests', label: 'All requests', icon: FileText },
          { id: 'attendance', label: 'Attendance reports', icon: Calendar },
          { id: 'audit', label: 'Audit log', icon: BarChart3 },
          { id: 'settings', label: 'System settings', icon: Settings },
        ];
      case 'library_admin':
        return [
          { id: 'home', label: 'Dashboard', icon: Home },
          { id: 'chat', label: 'Messages', icon: MessageCircle },
          { id: 'books', label: 'Manage books', icon: BookOpen },
          { id: 'scan-lend', label: 'Scan & Lend', icon: Scan },
          { id: 'borrow-requests', label: 'Borrow requests', icon: FileText },
          { id: 'borrow-records', label: 'Borrow records', icon: History },
        ];
      case 'guard':
        return [
          { id: 'home', label: 'Dashboard', icon: Home },
          { id: 'scanner', label: 'Identity Scanner', icon: Scan },
          { id: 'logs', label: 'Activity Log', icon: History },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const handleNav = (id: string) => {
    onNavigate(id);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const renderContent = () => {
    if (currentView === 'chat') return <ChatContainer />;
    return children;
  }

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <AnnouncementPopup />

      <header style={{ backgroundColor: 'hsl(var(--header))' }} className="text-white h-28 flex items-center justify-between px-4 md:px-8 sticky top-0 z-50 shadow-xl print:hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg lg:hidden">
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center">
            <Image src="/logo.png" alt="AMA Student Portal" width={280} height={72} className="h-20 w-auto" priority />
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <NotificationBell onNavigate={onNavigate} currentView={currentView} />
          <button onClick={() => setGuideOpen(true)} className="hidden md:flex h-12 px-6 items-center gap-2 bg-accent text-white hover:bg-accent/90 rounded-full transition-all border border-accent/10 shadow-lg">
            <HelpCircle size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Tutorial</span>
          </button>
          <button onClick={logout} className="p-2 hover:bg-white/10 rounded-full transition-all group" title="Logout">
            <LogOut size={28} className="opacity-70 group-hover:opacity-100" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 relative">
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-secondary/60 z-40 lg:hidden backdrop-blur-sm" />
          )}
        </AnimatePresence>

        <aside style={{ backgroundColor: 'hsl(var(--sidebar))' }} className={cn("fixed inset-y-0 left-0 z-[60] lg:z-40 lg:sticky lg:top-28 lg:h-[calc(100vh-7rem)] border-r border-white/5 w-72 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 print:hidden shadow-2xl lg:shadow-none", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
          <div onClick={() => handleNav('profile')} className="pt-12 pb-6 px-6 flex flex-col items-center bg-gradient-to-b from-primary/10 to-transparent cursor-pointer group flex-none">
            <div className="w-24 h-24 rounded-[2rem] bg-primary flex items-center justify-center text-4xl text-white font-black shadow-xl shadow-primary/20 rotate-3 mb-6 transition-transform group-hover:rotate-0 overflow-hidden border-4 border-accent/20">
              {user?.profilePic ? <img src={user.profilePic} alt="avatar" className="w-full h-full object-cover" /> : user?.name?.charAt(0) || 'S'}
            </div>
            <h2 className="text-sm font-black tracking-tight text-center leading-tight text-white px-4 group-hover:text-accent transition-colors">{user?.name}</h2>
            <p className="mt-1 text-[9px] font-bold tracking-[0.1em] text-white/40 text-center uppercase">{user?.role?.replace('_', ' ')}</p>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
            {user?.role === 'student' && <SessionTerminal />}
            <nav className="px-4 pb-8 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button key={item.id} onClick={() => handleNav(item.id)} className={cn("w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] font-black tracking-widest transition-all group", isActive ? "bg-white/10 text-accent border-l-4 border-accent shadow-lg scale-[1.02]" : "text-white/40 hover:bg-white/5 hover:text-white")}>
                    {typeof Icon === 'function' ? <Icon size={18} className={cn("transition-colors", isActive ? "text-accent" : "text-white/20 group-hover:text-white")} /> : <Icon size={18} />}
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="flex-1 min-w-0 bg-secondary p-4 md:p-10">
          <div className="max-w-[1600px] mx-auto h-full">
            <motion.div key={currentView} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="h-full">
              {renderContent()}
            </motion.div>
          </div>
        </main>
      </div>

      <UserGuide open={guideOpen} onOpenChange={setGuideOpen} />
    </div>
  );
}
