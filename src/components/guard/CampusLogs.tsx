'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CampusLog } from '@/utils/storage';
import { getCampusLogsAction } from '@/app/actions/dbActions';
import { Loader2, History, LogIn, LogOut, Search, Calendar, ArrowLeft, Building2, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CampusLogsProps {
  onBack?: () => void;
}

export default function CampusLogs({ onBack }: CampusLogsProps) {
  const [logs, setLogs] = useState<CampusLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 10000); // Live update every 10s
    return () => clearInterval(interval);
  }, []);

  const loadLogs = async () => {
    try {
      const data = await getCampusLogsAction();
      setLogs(data.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = log.userName.toLowerCase().includes(search.toLowerCase()) || 
                          log.userId.toLowerCase().includes(search.toLowerCase());
      const matchesDate = !dateFilter || log.timestamp.startsWith(dateFilter);
      return matchesSearch && matchesDate;
    });
  }, [logs, search, dateFilter]);

  if (loading && logs.length === 0) return (
    <div className="flex flex-col items-center justify-center p-32 space-y-4">
      <Loader2 className="animate-spin h-12 w-12 text-primary" strokeWidth={3}/>
      <p className="font-black uppercase text-[10px] tracking-widest text-muted-foreground animate-pulse">Accessing Activity Intel...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-24 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button 
              variant="ghost" 
              onClick={onBack} 
              className="h-12 w-12 rounded-full p-0 flex items-center justify-center hover:bg-primary/5 transition-all active:scale-90 shrink-0"
            >
              <ArrowLeft className="h-6 w-6 text-primary" />
            </Button>
          )}
          <div>
            <h2 className="text-[3rem] font-black text-primary tracking-tighter uppercase leading-none">Activity Registry</h2>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-3">Campus Entry & Exit Logs</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="p-8 rounded-[2.5rem] bg-primary text-white border-none shadow-xl flex items-center justify-between group overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Today's Traffic</p>
            <p className="text-6xl font-black tracking-tighter mt-2">{filteredLogs.length}</p>
          </div>
          <History size={100} className="absolute -right-4 -bottom-4 opacity-10 group-hover:rotate-12 transition-transform" />
        </Card>
        
        <Card className="p-8 rounded-[2.5rem] bg-white border-none shadow-xl flex items-center justify-between group overflow-hidden relative border-2 border-primary/5">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Global Entries</p>
            <p className="text-6xl font-black tracking-tighter mt-2 text-primary">{logs.filter(l => l.type === 'entry').length}</p>
          </div>
          <LogIn size={100} className="absolute -right-4 -bottom-4 text-primary opacity-5" />
        </Card>

        <Card className="p-8 rounded-[2.5rem] bg-white border-none shadow-xl flex items-center justify-between group overflow-hidden relative border-2 border-primary/5">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Global Exits</p>
            <p className="text-6xl font-black tracking-tighter mt-2 text-primary">{logs.filter(l => l.type === 'exit').length}</p>
          </div>
          <LogOut size={100} className="absolute -right-4 -bottom-4 text-primary opacity-5" />
        </Card>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-primary/5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/20 group-focus-within:text-primary transition-colors" size={20} />
          <Input 
            placeholder="Search Name or Identity USN..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-14 pl-12 rounded-2xl border-none bg-muted/20 font-bold focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
        <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/20" size={20} />
            <Input 
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="h-14 pl-12 rounded-2xl border-none bg-muted/20 font-bold focus:ring-2 focus:ring-primary/10 transition-all"
            />
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-primary/5 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full">
            <thead className="bg-primary/5 border-b border-primary/5">
              <tr>
                <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Student Identity</th>
                <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Security Protocol</th>
                <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Timestamp</th>
                <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Terminal Station</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-24 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs opacity-40">No signals detected for this period</td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-primary/[0.02] transition-colors group">
                    <td className="px-10 py-6">
                      <p className="font-black text-primary uppercase tracking-tight text-lg group-hover:scale-[1.01] transition-transform origin-left">{log.userName}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{log.role.replace('_', ' ')} • {log.userId}</p>
                    </td>
                    <td className="px-10 py-6">
                      <Badge className={cn(
                        "px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest border-none shadow-sm",
                        log.type === 'entry' ? "bg-emerald-500 text-white" : "bg-primary text-white"
                      )}>
                        {log.type === 'entry' ? "CAMPUS ENTRANCE" : "CAMPUS DISMISSAL"}
                      </Badge>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <Calendar size={14} className="text-primary/40" />
                        {format(new Date(log.timestamp), "MMM dd, yyyy")}
                        <span className="text-primary font-black ml-2 tabular-nums">{format(new Date(log.timestamp), "hh:mm:ss a")}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground bg-muted/30 px-3 py-1 rounded-lg">
                        <MapPin size={10} className="text-primary/40"/>
                        {log.location}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
