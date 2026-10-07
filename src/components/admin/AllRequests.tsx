
"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  User as UserIcon,
  Calendar,
  Filter,
  Monitor,
  Building2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import {
  getLabRequestsAction,
  updateLabRequestAction,
  getUsersAction,
  getSubjectsAction,
  getLabsAction,
  addAttendanceAction,
  addAuditLogAction,
} from "@/app/actions/dbActions";

import { LabRequest, User, Subject, Lab } from "@/utils/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

export default function AllRequests() {
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const [reqs, usrs, subs, lbs] = await Promise.all([
        getLabRequestsAction(),
        getUsersAction(),
        getSubjectsAction(),
        getLabsAction(),
      ]);

      setRequests(
        reqs.sort(
          (a, b) =>
            new Date(b.startTime).getTime() -
            new Date(a.startTime).getTime()
        )
      );

      setUsers(usrs);
      setSubjects(subs);
      setLabs(lbs);
    } catch {
      toast.error("Failed to load requests registry.");
    } finally {
      setLoading(false);
    }
  };

  const getName = (id: string, type: "user" | "subject" | "lab") => {
    switch (type) {
      case "user":
        return users.find((u) => u.id === id)?.name || id;
      case "subject":
        if (id === 'personal_use') return 'Personal Use';
        if (id === 'exam') return 'Exam';
        return subjects.find((s) => s.id === id)?.name || id;
      case "lab":
        return labs.find((l) => l.id === id)?.name || id;
    }
  };

  const handleUpdateRequest = async (
    request: LabRequest,
    status: "approved" | "declined"
  ) => {
    try {
      if (status === "approved") {
        let attendanceStatus: 'present' | 'late' = 'present';
        const subject = subjects.find(s => s.id === request.subjectId);
        const studentName = getName(request.studentId, "user");
        const labName = getName(request.labId, "lab");

        if (subject && subject.id !== 'personal_use' && subject.id !== 'exam') {
            const requestDate = new Date(request.startTime);
            const dayName = requestDate.toLocaleDateString('en-US', { weekday: 'long' });
            const schedule = subject.schedules?.find(s => s.day === dayName);

            if (schedule && schedule.startTime) {
                const reqTimePart = request.startTime.split('T')[1];
                if (reqTimePart) {
                    const [reqH, reqM] = reqTimePart.split(':').map(Number);
                    const [schH, schM] = schedule.startTime.split(':').map(Number);
                    const reqTotalMins = reqH * 60 + reqM;
                    const schTotalMins = schH * 60 + schM;
                    if (reqTotalMins > schTotalMins + 15) attendanceStatus = 'late';
                }
            }
        }

        await updateLabRequestAction(request.id, { status });
        
        const usageDetails = `Used ${labName}${request.pcId ? ` (PC ${request.pcId.split('-').pop()})` : ''} for ${subject?.name || 'Academic activity'}`;
        await addAuditLogAction({
          userId: request.studentId,
          userName: studentName,
          action: 'facility_usage',
          details: usageDetails
        });

        await addAttendanceAction({
          studentId: request.studentId,
          subjectId: request.subjectId,
          date: new Date(request.startTime).toISOString(),
          status: attendanceStatus,
          timeIn: new Date(request.startTime).toLocaleTimeString("en-US", { hour12: false }),
          sessionId: `SESS-REQ-${request.id}`,
          locationId: request.labId,
          locationType: "lab",
          pcId: request.pcId,
        });

        toast.success(`Request approved! Marked as ${attendanceStatus}.`);
      } else {
        await updateLabRequestAction(request.id, { status });
        toast.info("Request declined.");
      }
      loadRequests();
    } catch {
      toast.error("Process execution failed.");
    }
  };

  const filtered = requests.filter((r) => {
    const student = getName(r.studentId, "user").toLowerCase();
    const subject = getName(r.subjectId, "subject").toLowerCase();
    const lab = getName(r.labId, "lab").toLowerCase();

    const searchMatch =
      student.includes(search.toLowerCase()) ||
      subject.includes(search.toLowerCase()) ||
      lab.includes(search.toLowerCase());

    const statusMatch =
      filter === "All" || r.status === filter.toLowerCase();

    const dateMatch =
      !dateFilter ||
      new Date(r.startTime).toISOString().split("T")[0] === dateFilter;

    return searchMatch && statusMatch && dateMatch;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCSV = () => {
    if (!filtered.length) return;
    const rows = filtered.map((r) => ({
      Student: getName(r.studentId, "user"),
      Subject: getName(r.subjectId, "subject"),
      Lab: getName(r.labId, "lab"),
      PC: r.pcId?.split("-").pop(),
      Start: new Date(r.startTime).toLocaleString(),
      End: new Date(r.endTime).toLocaleString(),
      Status: r.status,
    }));
    const csv = Object.keys(rows[0]).join(",") + "\n" + rows.map((r) => Object.values(r).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lab-requests-registry.csv";
    a.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-primary tracking-tighter leading-none">All requests</h2>
          <p className="text-[10px] font-black text-muted-foreground mt-2">Manage lab and room usage requests</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="h-12 px-6 rounded-xl font-black text-[10px] gap-2 bg-white shadow-sm">
          <Download size={16} /> Export CSV
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-primary/5 shadow-xl">
          <p className="text-[10px] font-black text-muted-foreground mb-1">Pending requests</p>
          <div className="text-3xl font-black text-amber-600">{requests.filter(r => r.status === 'pending').length}</div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-primary/5 shadow-xl">
          <p className="text-[10px] font-black text-muted-foreground mb-1">Approved sessions</p>
          <div className="text-3xl font-black text-green-600">{requests.filter(r => r.status === 'approved').length}</div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-primary/5 shadow-xl">
          <p className="text-[10px] font-black text-muted-foreground mb-1">Declined requests</p>
          <div className="text-3xl font-black text-red-600">{requests.filter(r => r.status === 'declined').length}</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/20 group-focus-within:text-primary transition-colors" size={20} />
          <Input 
            placeholder="Search by student, subject or lab..." 
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
            className="h-14 pl-12 rounded-2xl border-primary/5 shadow-lg font-bold text-lg" 
          />
        </div>
        <Input 
          type="date" 
          value={dateFilter} 
          onChange={(e) => { setDateFilter(e.target.value); setPage(1); }} 
          className="h-14 w-full md:w-56 rounded-2xl border-primary/5 shadow-lg font-bold" 
        />
        <select
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          className="h-14 px-6 rounded-2xl border-none bg-white shadow-lg font-black text-[10px] appearance-none outline-none focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
        >
          {["All", "Pending", "Approved", "Declined"].map(f => (
            <option key={f} value={f}>{f} status</option>
          ))}
        </select>
      </div>

      {/* Registry Table */}
      <div className="bg-white rounded-[2.5rem] border border-primary/5 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-sm">
            <thead className="bg-primary/5 border-b border-primary/5">
              <tr>
                <th className="px-8 py-6 text-left text-[10px] font-black text-muted-foreground">Student info</th>
                <th className="px-6 py-6 text-left text-[10px] font-black text-muted-foreground">Lab / Room</th>
                <th className="px-6 py-6 text-center text-[10px] font-black text-muted-foreground">PC unit</th>
                <th className="px-6 py-6 text-center text-[10px] font-black text-muted-foreground">Time block</th>
                <th className="px-8 py-6 text-right text-[10px] font-black text-muted-foreground">Status / Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <Loader2 className="animate-spin h-10 w-10 mx-auto text-primary" />
                    <p className="mt-4 font-black text-[10px] text-muted-foreground">Accessing records...</p>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-muted-foreground font-bold text-xs opacity-40">No matching requests in registry</td>
                </tr>
              ) : (
                paginated.map((request) => (
                  <tr key={request.id} className="hover:bg-primary/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0 shadow-inner group-hover:bg-primary group-hover:text-white transition-colors">
                          <UserIcon size={18} />
                        </div>
                        <div>
                          <p className="font-black text-foreground tracking-tight leading-none mb-1.5">{getName(request.studentId, "user")}</p>
                          <p className="text-[10px] font-bold text-muted-foreground truncate max-w-[150px]">{getName(request.subjectId, "subject")}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        {request.pcId ? <Monitor size={14} className="text-primary/40" /> : <Building2 size={14} className="text-primary/40" />}
                        <span className="font-black text-slate-700 text-xs">{getName(request.labId, "lab")}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className="font-black text-primary text-xs">{request.pcId ? `PC ${request.pcId.split("-").pop()}` : "-"}</span>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-slate-800">{new Date(request.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-[8px] font-bold text-slate-400">to</span>
                        <span className="text-[10px] font-black text-slate-800">{new Date(request.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-4">
                        <Badge className={cn(
                          "px-3 py-1 rounded-full font-black text-[8px] border-none shadow-sm",
                          request.status === 'pending' ? "bg-amber-100 text-amber-800" :
                          request.status === 'approved' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        )}>
                          {request.status}
                        </Badge>
                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateRequest(request, "approved")}
                              className="h-9 w-9 rounded-lg bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm flex items-center justify-center"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                            <button
                              onClick={() => handleUpdateRequest(request, "declined")}
                              className="h-9 w-9 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center justify-center"
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        )}
                      </div>
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
        <div className="flex justify-between items-center px-4">
          <Button 
            variant="ghost" 
            disabled={page === 1} 
            onClick={() => setPage(page - 1)} 
            className="h-12 px-6 rounded-xl font-black text-[10px] bg-white shadow-lg border border-primary/5"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          <span className="font-black text-[10px] text-muted-foreground">Registry page {page} of {totalPages}</span>
          <Button 
            variant="ghost" 
            disabled={page === totalPages} 
            onClick={() => setPage(page + 1)} 
            className="h-12 px-6 rounded-xl font-black text-[10px] bg-white shadow-lg border border-primary/5"
          >
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
