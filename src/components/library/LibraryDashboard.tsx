'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../shared/Layout';
import { 
    BookOpen, 
    FileText, 
    Loader2, 
    History, 
    Scan, 
    Library as LibIcon, 
    Archive,
    Search,
    ChevronRight,
    TrendingUp
} from 'lucide-react';
import ManageBooks from './ManageBooks';
import BorrowRequests from './BorrowRequests';
import BorrowRecords from './BorrowRecords';
import ScanLend from './ScanLend';
import ProfileView from '../shared/ProfileView';
import { getBooksAction, getBorrowRequestsAction } from '@/app/actions/dbActions';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

function StatBox({ icon: Icon, label, value, color, description, onClick }: any) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "p-6 rounded-[2.5rem] border-none shadow-xl flex items-center justify-between min-h-[120px] transition-all duration-300 group bg-white",
        onClick && "cursor-pointer hover:shadow-2xl hover:-translate-y-1"
      )}
    >
      <div className="relative z-10 space-y-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">
          {label}
        </p>
        <p className="text-4xl font-black text-slate-900 tracking-tighter">
          {value}
        </p>
        {description && <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">{description}</p>}
      </div>
      <div className={cn(
        "h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner transition-colors",
        color || "bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white"
      )}>
        <Icon size={24} />
      </div>
    </Card>
  );
}

export default function LibraryDashboard() {
  const [currentView, setCurrentView] = useState('home');
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState({
    totalBooks: 0,
    available: 0,
    borrowed: 0,
    pendingRequests: 0
  });

  useEffect(() => {
    if (currentView === 'home') {
      loadStats();
    }
  }, [currentView]);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
        const [books, requests] = await Promise.all([
            getBooksAction(),
            getBorrowRequestsAction()
        ]);

        setStats({
            totalBooks: books.length,
            available: books.filter((b: any) => b.status === 'available').length,
            borrowed: books.filter((b: any) => b.status === 'borrowed').length,
            pendingRequests: requests.filter((r: any) => r.status === 'pending').length
        });
    } catch(e) {
        console.error("Failed to load stats", e);
    } finally {
        setLoadingStats(false);
    }
  };

  const renderHome = () => (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-[3.5rem] font-black text-primary tracking-tighter leading-none uppercase">Library Ops</h2>
          <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-3">Knowledge Base Control Center</p>
        </div>
        
        <div className="flex items-center gap-4">
            <button 
                onClick={() => setCurrentView('scan-lend')}
                className="h-16 px-10 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-primary/20 transition-all active:scale-95 flex items-center gap-3"
            >
                <Scan size={20} />
                Initialize Scanner
            </button>
        </div>
      </div>

      {loadingStats ? (
        <div className="h-64 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="animate-spin text-primary h-12 w-12" strokeWidth={3}/>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Syncing Matrix...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatBox
            icon={BookOpen}
            label="Catalogue Size"
            value={stats.totalBooks}
            onClick={() => setCurrentView('books')}
            color="bg-blue-50 text-blue-600"
          />
          <StatBox
            icon={CheckCircle2}
            label="In-Stock assets"
            value={stats.available}
            onClick={() => setCurrentView('books')}
            color="bg-emerald-50 text-emerald-600"
          />
          <StatBox
            icon={TrendingUp}
            label="Active Loans"
            value={stats.borrowed}
            onClick={() => setCurrentView('borrow-records')}
            color="bg-primary/5 text-primary"
          />
          <StatBox
            icon={FileText}
            label="Queue Signals"
            value={stats.pendingRequests}
            onClick={() => setCurrentView('borrow-requests')}
            color="bg-amber-50 text-amber-600"
            description="Pending Validation"
          />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <Card className="xl:col-span-8 p-10 rounded-[3rem] border-none shadow-2xl bg-white space-y-8 group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform">
                <LibIcon size={200} />
            </div>
            
            <div className="relative z-10 space-y-10">
                <div className="flex items-center gap-5">
                    <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary shadow-inner"><Archive size={24}/></div>
                    <div>
                        <h3 className="text-2xl font-black uppercase tracking-tight text-slate-800">Operational Directives</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Librarian terminal protocols</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button 
                        onClick={() => setCurrentView('books')}
                        className="p-8 rounded-[2.5rem] bg-slate-50 border-2 border-transparent hover:border-primary/20 transition-all flex flex-col items-start gap-4 text-left group/btn"
                    >
                        <div className="h-10 w-10 rounded-xl bg-white shadow-md flex items-center justify-center text-primary group-hover/btn:bg-primary group-hover/btn:text-white transition-colors"><BookOpen size={20}/></div>
                        <div>
                            <h4 className="font-black uppercase tracking-tight text-slate-800">Inventory Registry</h4>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase leading-relaxed">Modify and manage the physical knowledge catalogue.</p>
                        </div>
                    </button>

                    <button 
                        onClick={() => setCurrentView('borrow-records')}
                        className="p-8 rounded-[2.5rem] bg-slate-50 border-2 border-transparent hover:border-primary/20 transition-all flex flex-col items-start gap-4 text-left group/btn"
                    >
                        <div className="h-10 w-10 rounded-xl bg-white shadow-md flex items-center justify-center text-primary group-hover/btn:bg-primary group-hover/btn:text-white transition-colors"><History size={20}/></div>
                        <div>
                            <h4 className="font-black uppercase tracking-tight text-slate-800">Transaction History</h4>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase leading-relaxed">Review historical loan signals and overdue status.</p>
                        </div>
                    </button>
                </div>
            </div>
        </Card>

        <Card className="xl:col-span-4 p-10 rounded-[3rem] bg-[#14343A] text-white border-none shadow-2xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 group-hover:rotate-0 transition-transform">
                <Scan size={180} />
            </div>
            
            <div className="relative z-10 space-y-10">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                        <Scan size={24} />
                    </div>
                    <h3 className="text-xl font-black text-white tracking-tighter uppercase">Unified Scan</h3>
                </div>
                <p className="text-sm font-medium opacity-80 leading-relaxed uppercase tracking-tight">
                    Universal signal processor for rapid lending and returns. Capture asset IDs and identity signatures instantly.
                </p>
            </div>

            <div className="relative z-10 pt-10">
                <button 
                    onClick={() => setCurrentView('scan-lend')}
                    className="w-full h-20 bg-white text-[#14343A] font-black text-xs tracking-[0.2em] rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 uppercase"
                >
                    Initialize Terminal
                    <ChevronRight size={18} />
                </button>
            </div>
        </Card>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'home': return renderHome();
      case 'books': return <ManageBooks />;
      case 'scan-lend': return <ScanLend />;
      case 'borrow-requests': return <BorrowRequests />;
      case 'borrow-records': return <BorrowRecords />;
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

function CheckCircle2(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  );
}
