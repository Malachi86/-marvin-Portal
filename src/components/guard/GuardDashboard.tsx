'use client';

import React, { useState } from 'react';
import Layout from '../shared/Layout';
import CampusScanner from './CampusScanner';
import CampusLogs from './CampusLogs';
import ProfileView from '../shared/ProfileView';
import { ShieldCheck, History, Scan, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GuardDashboard() {
  const [currentView, setCurrentView] = useState('home');

  const renderHome = () => (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none">Security Ops</h2>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-2">Active Sentinel Mode</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <button 
          onClick={() => setCurrentView('scanner')}
          className="p-12 bg-white rounded-[3rem] shadow-2xl border-none hover:shadow-primary/10 transition-all group flex flex-col items-center text-center space-y-6 hover:-translate-y-2"
        >
          <div className="h-24 w-24 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
            <Scan size={48} />
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-primary">Identity Scanner</h3>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">Process Student IDs (Barcode/QR)</p>
          </div>
        </button>

        <button 
          onClick={() => setCurrentView('logs')}
          className="p-12 bg-white rounded-[3rem] shadow-2xl border-none hover:shadow-primary/10 transition-all group flex flex-col items-center text-center space-y-6 hover:-translate-y-2"
        >
          <div className="h-24 w-24 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
            <History size={48} />
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-primary">Activity Log</h3>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">Review Campus Traffic History</p>
          </div>
        </button>
      </div>

      <div className="p-10 bg-primary rounded-[2.5rem] text-white flex items-center justify-between shadow-2xl shadow-primary/20 relative overflow-hidden group cursor-pointer" onClick={() => setCurrentView('profile')}>
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Security Official</p>
          <h3 className="text-3xl font-black uppercase tracking-tighter mt-1">Personnel Account Registry</h3>
        </div>
        <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all relative z-10">
          <ShieldCheck size={32} />
        </div>
        <UserIcon size={200} className="absolute -right-10 -bottom-10 opacity-10 rotate-12" />
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'home': return renderHome();
      case 'scanner': return <CampusScanner onBack={() => setCurrentView('home')} />;
      case 'logs': return <CampusLogs onBack={() => setCurrentView('home')} />;
      case 'profile': return <ProfileView onBack={() => setCurrentView('home')} />;
      default: return renderHome();
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      <div className="h-full pt-4">{renderContent()}</div>
    </Layout>
  );
}