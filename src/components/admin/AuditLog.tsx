"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Monitor, 
  Building2, 
  Search, 
  Loader2, 
  Download, 
  Filter, 
  Calendar, 
  History,
  XCircle
} from "lucide-react";
import { getAuditLogsAction, getLabsAction, getRoomsAction } from "@/app/actions/dbActions";
import { AuditLog, Lab, Room } from "@/utils/storage";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 15;

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [selectedFacility, setSelectedFacility] = useState("all"); // "all", labId, or roomId
  const [selectedDate, setSelectedDate] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [auditLogs, allLabs, allRooms] = await Promise.all([
        getAuditLogsAction(),
        getLabsAction(),
        getRoomsAction()
      ]);
      // Strictly focused on facility usage as per database logic
      setLogs(auditLogs);
      setLabs(allLabs);
      setRooms(allRooms);
    } catch {
      console.error("Failed to load audit registry");
    }
    setLoading(false);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const details = log.details.toLowerCase();
      const student = log.userName.toLowerCase();
      
      const matchesSearch = student.includes(search.toLowerCase()) || details.includes(search.toLowerCase());
      const matchesFacility = selectedFacility === 'all' || details.includes(selectedFacility.toLowerCase());
      const matchesDate = !selectedDate || log.timestamp.startsWith(selectedDate);

      return matchesSearch && matchesFacility && matchesDate;
    });
  }, [logs, search, selectedFacility, selectedDate]);

  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE);
  const paginatedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCSV = () => {
    if (!filteredLogs.length) return;
    const rows = filteredLogs.map((log) => ({
      Timestamp: new Date(log.timestamp).toLocaleString(),
      Student: log.userName,
      USN: log.userId,
      Details: log.details
    }));
    const csv = Object.keys(rows[0]).join(",") + "\n" + rows.map((r) => Object.values(r).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `facility-audit-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-[3rem] font-black text-primary tracking-tighter uppercase leading-none">Facility Audit</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] mt-2">Laboratory & Room Activity Tracker</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 bg-white shadow-xl shadow-primary/5">
          <Download size={18} /> Export Registry
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-8 rounded-[2.5rem] bg-primary text-white border-none shadow-xl flex items-center justify-between group overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Usage Events Recorded</p>
            <p className="text-6xl font-black tracking-tighter mt-2">{logs.length}</p>
          </div>
          <History size={100} className="absolute -right-4 -bottom-4 opacity-10 group-hover:rotate-12 transition-transform" />
        </Card>
        
        <Card className="p-8 rounded-[2.5rem] bg-white border-none shadow-xl flex items-center justify-between group overflow-hidden relative border-2 border-primary/5">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Unique Facility Points</p>
            <p className="text-6xl font-black tracking-tighter mt-2 text-primary">{labs.length + rooms.length}</p>
          </div>
          <div className="flex gap-2 absolute right-8 top-1/2 -translate-y-1/2 opacity-5 text-primary">
            <Monitor size={80} />
            <Building2 size={80} />
          </div>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-primary/5 space-y-6">
        <div className="flex items-center gap-3 ml-1">
          <Filter size={16} className="text-primary" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Audit Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/20 group-focus-within:text-primary transition-colors" size={20} />
            <Input 
              placeholder="Search Student Name or USN..." 
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="h-14 pl-12 rounded-2xl border-none bg-muted/20 font-bold focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          <select
            value={selectedFacility}
            onChange={e => { setSelectedFacility(e.target.value); setPage(1); }}
            className="h-14 px-6 rounded-2xl border-none bg-muted/20 font-bold text-sm uppercase tracking-tight focus:ring-2 focus:ring-primary/10 transition-all appearance-none cursor-pointer outline-none"
          >
            <option value="all">GENERAL VIEW (ALL)</option>
            <optgroup label="LABORATORIES">
              {labs.map(lab => <option key={lab.id} value={lab.name}>{lab.name}</option>)}
            </optgroup>
            <optgroup label="ROOMS">
              {rooms.map(room => <option key={room.id} value={room.name}>{room.name}</option>)}
            </optgroup>
          </select>

          <Input 
            type="date" 
            value={selectedDate}
            onChange={e => { setSelectedDate(e.target.value); setPage(1); }}
            className="h-14 px-6 rounded-2xl border-none bg-muted/20 font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
          />
        </div>
      </div>

      {/* Audit Registry Table */}
      <div className="bg-white rounded-[3rem] border border-primary/5 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full">
            <thead className="bg-primary/5 border-b border-primary/5">
              <tr>
                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Log Timestamp</th>
                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Identity</th>
                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Usage Details</th>
                <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center">
                    <Loader2 className="animate-spin h-10 w-10 mx-auto text-primary" />
                    <p className="mt-4 font-black uppercase text-[10px] tracking-widest text-muted-foreground">Accessing Records...</p>
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs opacity-40">No matching usage signals detected</td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-primary/[0.02] transition-colors group">
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                        <Calendar size={14} className="text-primary/40" />
                        {new Date(log.timestamp).toLocaleDateString()}
                        <span className="text-primary font-black ml-2">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-black text-primary uppercase tracking-tight group-hover:scale-[1.01] transition-transform origin-left">{log.userName}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{log.userId}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="p-4 bg-muted/30 rounded-2xl border border-primary/5 group-hover:bg-white transition-all shadow-sm">
                        <p className="text-xs font-bold text-slate-700 leading-relaxed uppercase tracking-tight">
                          {log.details}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <Badge className={cn(
                        "px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest border-none shadow-sm",
                        log.details.toLowerCase().includes('lab') ? "bg-primary text-white" : "bg-slate-800 text-white"
                      )}>
                        {log.details.toLowerCase().includes('lab') ? 'LABORATORY' : 'ROOM USAGE'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center px-4 pt-4">
          <Button
            variant="ghost"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest bg-white shadow-lg border border-primary/5"
          >
            Previous
          </Button>
          <span className="font-black uppercase text-[10px] tracking-[0.3em] text-muted-foreground">
            Registry Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest bg-white shadow-lg border border-primary/5"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
