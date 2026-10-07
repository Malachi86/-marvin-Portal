
'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../shared/Layout';
import { useAuth } from '../../contexts/AuthContext';
import {
  Users,
  Calendar,
  Monitor,
  User,
  School,
  ShieldAlert,
  Palette,
  Clock,
  Megaphone,
  Activity,
  Database,
  ShieldCheck,
  Zap,
  Lock,
  LogOut,
  Building2,
} from 'lucide-react';
import ManageUsers from './ManageUsers';
import AllRequests from './AllRequests';
import AttendanceReports from './AttendanceReports';
import CampusInfrastructure from './CampusInfrastructure';
import AuditLog from './AuditLog';
import SystemSettings from './SystemSettings';
import TermManagement from './TermManagement';
import SecurityCenter from './SecurityCenter';
import ThemeCustomizer from './ThemeCustomizer';
import ProfileView from '../shared/ProfileView';
import SystemAnnouncements from './SystemAnnouncements';
import {
  getUsersAction,
  getLabRequestsAction,
  getTermsAction,
  getSectionsAction
} from '@/app/actions/dbActions';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

function StatCard({
  icon,
  label,
  value,
  onClick,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  onClick?: () => void;
  colorClass?: string;
}) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'border-none bg-white rounded-[2rem] p-6 shadow-xl transition-all duration-300 relative overflow-hidden group flex items-center justify-between min-h-[120px]',
        onClick ? 'cursor-pointer hover:shadow-2xl hover:-translate-y-1' : ''
      )}
    >
      <div className="relative z-10 space-y-1">
        <p className="text-[10px] text-slate-400 font-black tracking-widest leading-tight uppercase">
          {label}
        </p>
        <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{value}</h3>
      </div>
      <div
        className={cn(
          'h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner transition-colors relative z-10',
          colorClass || 'bg-primary/5 text-primary'
        )}
      >
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 24 }) : icon}
      </div>
      <div className="absolute -right-6 -bottom-6 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform text-slate-900">
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 100 }) : null}
      </div>
    </Card>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('home');
  const [stats, setStats] = useState({
    totalUsers: 0,
    teachers: 0,
    students: 0,
    activeSessions: 0,
    activeTerms: 0,
    bannedUsers: 0,
    pendingApprovals: 0,
    totalSections: 0,
  });

  useEffect(() => {
    if (currentView === 'home') {
      loadStats();
    }
  }, [currentView]);

  const loadStats = async () => {
    try {
      const [users, requests, terms, sections] = await Promise.all([
        getUsersAction(),
        getLabRequestsAction(),
        getTermsAction(),
        getSectionsAction()
      ]);

      setStats({
        totalUsers: users.length,
        teachers: users.filter((u: any) => u.role === 'teacher').length,
        students: users.filter((u: any) => u.role === 'student').length,
        pendingApprovals: users.filter(
          (u: any) => u.role === 'student' && u.isApproved === false
        ).length,
        activeSessions: requests.filter((r: any) => r.status === 'approved').length,
        activeTerms: terms.filter((t: any) => t.status === 'active').length,
        bannedUsers: users.filter((u: any) => u.isBanned).length,
        totalSections: sections.length,
      });
    } catch (error) {
      console.error('Failed to load dashboard stats', error);
    }
  };

  const renderHome = () => (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#6D1B0A] leading-none uppercase">
            System Control
          </h1>
          <p className="text-slate-500 font-black tracking-[0.4em] text-[11px] mt-4 ml-1">
            ROOT MANAGEMENT V1.0
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setCurrentView('announcements')}
            className="h-14 px-8 rounded-full bg-white text-[#6D1B0A] font-black text-[10px] tracking-widest shadow-xl hover:shadow-2xl transition-all active:scale-95 flex items-center gap-3 uppercase"
          >
            <Megaphone size={16} />
            Broadcast Hub
          </button>
          <button
            onClick={() => setCurrentView('design')}
            className="h-14 px-8 rounded-full bg-white text-[#6D1B0A] font-black text-[10px] tracking-widest shadow-xl hover:shadow-2xl transition-all active:scale-95 flex items-center gap-3 uppercase"
          >
            <Palette size={16} />
            Design lab
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <StatCard
          icon={<Clock />}
          label="Pending Approvals"
          value={stats.pendingApprovals}
          onClick={() => setCurrentView('users')}
          colorClass="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={<School />}
          label="Active Academic Terms"
          value={stats.activeTerms}
          onClick={() => setCurrentView('terms')}
          colorClass="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={<Building2 />}
          label="Campus Registry"
          value={stats.totalSections}
          onClick={() => setCurrentView('infrastructure')}
          colorClass="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={<Users />}
          label="Global User Registry"
          value={stats.totalUsers}
          onClick={() => setCurrentView('users')}
          colorClass="bg-slate-50 text-slate-600"
        />
        <StatCard
          icon={<ShieldAlert />}
          label="Banned Identities"
          value={stats.bannedUsers}
          onClick={() => setCurrentView('security')}
          colorClass="bg-red-50 text-red-600"
        />
        <StatCard
          icon={<User />}
          label="Faculty Personnel"
          value={stats.teachers}
          onClick={() => setCurrentView('users')}
          colorClass="bg-violet-50 text-violet-600"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <Card className="xl:col-span-8 border-none bg-white rounded-[2.5rem] p-10 shadow-2xl space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-full bg-slate-50 flex items-center justify-center text-primary shadow-inner">
                <Activity size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
                  Neural System Pulse
                </h2>
                <p className="text-[10px] font-black text-slate-400 tracking-widest mt-1 uppercase">
                  Live Performance Monitor
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-600 border-none rounded-full px-5 py-2 font-black text-[10px] tracking-widest animate-pulse w-fit">
              PROTOCOL ACTIVE
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="rounded-[2rem] bg-slate-50/50 p-8 border border-slate-100 shadow-inner flex flex-col items-center text-center">
              <Zap size={16} className="text-amber-500 mb-4" />
              <p className="text-[10px] font-black tracking-widest text-slate-400 mb-1 uppercase">
                Uptime
              </p>
              <p className="text-4xl font-black text-slate-900 tracking-tighter">99.9%</p>
            </div>

            <div className="rounded-[2rem] bg-slate-50/50 p-8 border border-slate-100 shadow-inner flex flex-col items-center text-center">
              <Database size={16} className="text-blue-500 mb-4" />
              <p className="text-[10px] font-black tracking-widest text-slate-400 mb-1 uppercase">
                Latency
              </p>
              <p className="text-4xl font-black text-slate-900 tracking-tighter">24ms</p>
            </div>

            <div className="rounded-[2rem] bg-slate-50/50 p-8 border border-slate-100 shadow-inner flex flex-col items-center text-center">
              <ShieldCheck size={16} className="text-emerald-500 mb-4" />
              <p className="text-[10px] font-black tracking-widest text-slate-400 mb-1 uppercase">
                Load
              </p>
              <p className="text-4xl font-black text-slate-900 tracking-tighter">12%</p>
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-4 border-none bg-[#6D1B0A] rounded-[3rem] p-10 shadow-2xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
            <ShieldAlert size={160} className="text-white" />
          </div>

          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                <ShieldAlert size={24} />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">
                Root Directives
              </h2>
            </div>
            <p className="text-sm font-bold text-white/50 tracking-widest leading-relaxed">
              Execute critical system overrides across all campus terminals.
            </p>
          </div>

          <div className="relative z-10 space-y-4 pt-10">
            <button className="w-full h-16 rounded-2xl bg-white text-[#6D1B0A] font-black text-[11px] tracking-widest hover:bg-slate-50 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 uppercase">
              <LogOut size={18} />
              Terminal Logout
            </button>
            <button className="w-full h-16 rounded-2xl bg-red-600 text-white font-black text-[11px] tracking-widest hover:bg-red-700 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 uppercase">
              <Lock size={18} />
              Institute Lockdown
            </button>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return renderHome();
      case 'users':
        return <ManageUsers />;
      case 'requests':
        return <AllRequests />;
      case 'attendance':
        return <AttendanceReports />;
      case 'infrastructure':
        return <CampusInfrastructure />;
      case 'terms':
        return <TermManagement />;
      case 'security':
        return <SecurityCenter />;
      case 'audit':
        return <AuditLog />;
      case 'settings':
        return <SystemSettings />;
      case 'design':
        return <ThemeCustomizer />;
      case 'announcements':
        return <SystemAnnouncements />;
      case 'profile':
        return <ProfileView onBack={() => setCurrentView('home')} />;
      default:
        return renderHome();
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      <div className="min-h-full">{renderContent()}</div>
    </Layout>
  );
}
