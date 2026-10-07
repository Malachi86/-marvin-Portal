'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../shared/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { 
    getSSCPaymentsAction, 
    updateSSCPaymentAction, 
    getUsersAction,
    getSettingsAction,
    updateSettingsAction,
    getTermsAction,
    getTermEnrollmentsAction
} from '@/app/actions/dbActions';
import { SSCPayment, User, Term } from '@/utils/storage';
import { 
    CreditCard, 
    Users, 
    CheckCircle2, 
    XCircle, 
    Eye, 
    Loader2, 
    Search, 
    TrendingUp, 
    Clock, 
    Settings, 
    Save, 
    Smartphone, 
    FileSpreadsheet, 
    ChevronLeft, 
    ChevronRight, 
    X,
    Activity,
    BarChart3,
    GraduationCap
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import ProfileView from '../shared/ProfileView';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip as RechartsTooltip, 
    ResponsiveContainer,
    Cell
} from 'recharts';

const StatCard = ({ icon: Icon, label, value, color, description, onClick }: any) => {
    return (
        <Card 
            onClick={onClick}
            className={cn(
                "p-6 rounded-[2rem] border-none shadow-xl flex items-center justify-between min-h-[120px] transition-all duration-300 group bg-white", 
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
                {React.isValidElement(Icon) ? React.cloneElement(Icon as React.ReactElement<any>, { size: 24 }) : <Icon size={24} />}
            </div>
        </Card>
    );
};

export default function SSCDashboard() {
    const { user: sscUser } = useAuth();
    const [currentView, setCurrentView] = useState('home'); 
    const [payments, setPayments] = useState<SSCPayment[]>([]);
    const [allStudents, setAllStudents] = useState<User[]>([]);
    const [terms, setTerms] = useState<Term[]>([]);
    const [termEnrollments, setTermEnrollments] = useState<any[]>([]);
    const [membershipFee, setMembershipFee] = useState(150);
    const [loading, setLoading] = useState(true);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    
    const [search, setSearch] = useState('');
    const [selectedTermId, setSelectedTermId] = useState<string>('all');
    const [ledgerPage, setLedgerPage] = useState(1);
    const [unpaidPage, setUnpaidPage] = useState(1);
    const pageSize = 10;

    const [selectedPayment, setSelectedPayment] = useState<SSCPayment | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    const [tempFee, setTempFee] = useState('150');
    const [tempGcash, setTempGcash] = useState('');
    const [tempGcashName, setTempGcashName] = useState('');
    const [tempQrCode, setTempQrCode] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [payData, userData, settings, termData, termEnr] = await Promise.all([
                getSSCPaymentsAction(),
                getUsersAction(),
                getSettingsAction(),
                getTermsAction(),
                getTermEnrollmentsAction()
            ]);
            setPayments(payData);
            setAllStudents(userData.filter(u => u.role === 'student'));
            setTerms(termData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            setTermEnrollments(termEnr);
            
            const fee = settings.sscMembershipFee || 150;
            setMembershipFee(fee);
            setTempFee(fee.toString());
            setTempGcash(settings.sscGcashNumber || '');
            setTempGcashName(settings.sscGcashName || '');
            setTempQrCode(settings.sscGcashQr || '');

            const active = termData.find(t => t.status === 'active');
            if (active) setSelectedTermId(active.id);
        } catch (e) {
            toast.error("Failed to sync treasury records.");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, status: 'approved' | 'rejected') => {
        if (!sscUser) return;
        try {
            await updateSSCPaymentAction(id, { 
                status, 
                approvedBy: sscUser.id,
                timestamp: new Date().toISOString()
            });
            toast.success(`Payment ${status}.`);
            setSelectedPayment(null);
            loadData();
        } catch (e) {
            toast.error("Protocol failure.");
        }
    };

    const handleSaveSettings = async () => {
        setIsSavingSettings(true);
        try {
            await updateSettingsAction({ 
                sscMembershipFee: parseFloat(tempFee),
                sscGcashNumber: tempGcash,
                sscGcashName: tempGcashName,
                sscGcashQr: tempQrCode
            });
            setMembershipFee(parseFloat(tempFee));
            toast.success("Treasury configuration deployed!");
            setIsSettingsOpen(false);
        } catch (e) {
            toast.error("Failed to update treasury protocol.");
        } finally {
            setIsSavingSettings(false);
        }
    };

    const enrichedLedger = useMemo(() => {
        return payments.filter(p => {
            const matchesSearch = p.studentName.toLowerCase().includes(search.toLowerCase()) || 
                                  p.studentId.toLowerCase().includes(search.toLowerCase()) || 
                                  p.referenceNumber.toLowerCase().includes(search.toLowerCase());
            
            if (selectedTermId === 'all') return matchesSearch;
            
            const hasJoinedTerm = termEnrollments.some(e => e.studentId === p.studentId && e.termId === selectedTermId && e.status === 'approved');
            return matchesSearch && hasJoinedTerm;
        }).map(p => {
            const student = allStudents.find(s => s.id === p.studentId);
            const enrollment = termEnrollments.find(e => e.studentId === p.studentId && (selectedTermId !== 'all' ? e.termId === selectedTermId : true) && e.status === 'approved');
            const term = terms.find(t => t.id === enrollment?.termId);
            
            return {
                ...p,
                studentYear: student?.year || 'N/A',
                termName: term?.name || 'N/A'
            };
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [payments, search, selectedTermId, termEnrollments, allStudents, terms]);

    const unpaidRegistry = useMemo(() => {
        if (selectedTermId === 'all') return [];
        const joinedTermStudentIds = termEnrollments
            .filter(e => e.termId === selectedTermId && e.status === 'approved')
            .map(e => e.studentId);

        return allStudents.filter(s => {
            if (!joinedTermStudentIds.includes(s.id)) return false;
            const hasPaid = payments.some(p => p.studentId === s.id && p.status === 'approved');
            const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase());
            return !hasPaid && matchesSearch;
        });
    }, [allStudents, termEnrollments, payments, selectedTermId, search]);

    const stats = useMemo(() => {
        const approved = payments.filter(p => p.status === 'approved');
        const collection = approved.reduce((sum, p) => sum + (p.amount || membershipFee), 0);
        const pending = payments.filter(p => p.status === 'pending').length;
        const unpaidCount = unpaidRegistry.length;
        return { collection, pending, validated: approved.length, unpaid: unpaidCount };
    }, [payments, membershipFee, unpaidRegistry]);

    const chartData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return format(d, 'MMM dd');
        });

        return last7Days.map(day => {
            const dayApproved = payments.filter(p => p.status === 'approved' && format(new Date(p.timestamp), 'MMM dd') === day);
            const total = dayApproved.reduce((sum, p) => sum + (p.amount || membershipFee), 0);
            return { day, total };
        });
    }, [payments, membershipFee]);

    const paginatedLedger = enrichedLedger.slice((ledgerPage - 1) * pageSize, ledgerPage * pageSize);
    const totalLedgerPages = Math.ceil(enrichedLedger.length / pageSize);

    const paginatedUnpaid = unpaidRegistry.slice((unpaidPage - 1) * pageSize, unpaidPage * pageSize);
    const totalUnpaidPages = Math.ceil(unpaidRegistry.length / pageSize);

    const renderPagination = (current: number, total: number, onChange: (p: number) => void) => {
        if (total <= 1) return null;
        return (
            <div className="flex items-center justify-center gap-3 pt-10">
                <Button variant="ghost" disabled={current === 1} onClick={() => onChange(current - 1)} className="h-12 w-12 rounded-full text-primary p-0 border border-primary/5 bg-white shadow-sm">
                    <ChevronLeft size={24} />
                </Button>
                <div className="flex gap-2.5">
                    {Array.from({ length: total }).map((_, i) => (
                        <button key={i} onClick={() => onChange(i + 1)} className={cn("h-12 w-12 rounded-full font-black text-xs transition-all border-2", current === i + 1 ? "bg-primary text-white border-primary shadow-xl scale-110" : "bg-white text-muted-foreground border-primary/5 hover:border-primary/20 shadow-sm")}>
                            {i + 1}
                        </button>
                    ))}
                </div>
                <Button variant="ghost" disabled={current === total} onClick={() => onChange(current + 1)} className="h-12 w-12 rounded-full text-primary p-0 border border-primary/5 bg-white shadow-sm">
                    <ChevronRight size={24} />
                </Button>
            </div>
        );
    };

    const exportCSV = () => {
        if (!enrichedLedger.length) return;
        const termName = selectedTermId === 'all' ? 'All cycles' : terms.find(t => t.id === selectedTermId)?.name || 'Term';
        const headers = ['NAME', 'USN/EMP', 'YEAR', 'TERM', 'REF NUMBER', 'AMOUNT', 'STATUS', 'DATE'];
        const rows = enrichedLedger.map(p => [
            p.studentName, p.studentId, p.studentYear, p.termName, p.referenceNumber, (p.amount || membershipFee), p.status, new Date(p.timestamp).toLocaleDateString()
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SSC_MEMBERSHIP_LEDGER_${termName.replace(/\s/g, '_')}.csv`;
        a.click();
    };

    const renderDashboard = () => (
        <div className="space-y-12 animate-in fade-in duration-500">
            <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-black text-primary tracking-tighter uppercase leading-none">Dashboard</h2>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-2">
                    Treasury analytics & summary
                 </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <StatCard 
                    icon={TrendingUp} 
                    label="Total collection" 
                    value={`₱${stats.collection.toLocaleString()}`} 
                    color="bg-green-50 text-green-600" 
                    description="Gross validation"
                />
                <StatCard 
                    icon={CheckCircle2} 
                    label="Validated members" 
                    value={stats.validated} 
                    onClick={() => setCurrentView('payments')}
                    color="bg-blue-50 text-blue-600"
                    description="Official registry"
                />
               <StatCard 
                    icon={<Clock />} 
                    label="Pending validation" 
                    value={stats.pending} 
                    color="bg-amber-50 text-amber-600" 
                    onClick={() => setCurrentView('payments')}
                    description="Action required"
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                <Card className="xl:col-span-8 p-10 rounded-[2.5rem] border-none shadow-xl bg-white space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary"><BarChart3 size={20} /></div>
                            <h3 className="font-black text-xl uppercase tracking-tight">Collection growth</h3>
                        </div>
                        <Badge className="bg-primary/5 text-primary border-none font-black text-[10px] tracking-widest px-4">LAST 7 DAYS</Badge>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748B' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748B' }} />
                                <RechartsTooltip 
                                    cursor={{ fill: 'transparent' }} 
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                                />
                                <Bar dataKey="total" radius={[8, 8, 8, 8]} barSize={40}>
                                    {chartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? 'hsl(var(--primary))' : '#CBD5E1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="xl:col-span-4 p-10 rounded-[2.5rem] border-none shadow-xl bg-white space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary"><Activity size={20} /></div>
                        <h3 className="font-black text-xl uppercase tracking-tight">Recent activity</h3>
                    </div>
                    <div className="space-y-6">
                        {payments.slice(0, 5).map(p => (
                            <div key={p.id} className="flex items-center justify-between group cursor-pointer" onClick={() => { setSelectedPayment(p); }}>
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                        <CreditCard size={20} />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-black text-sm uppercase truncate text-slate-800">{p.studentName}</p>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase">{p.referenceNumber}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-xs text-primary">₱{p.amount || membershipFee}</p>
                                    <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">{format(new Date(p.timestamp), 'MMM dd')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button onClick={() => setCurrentView('payments')} variant="ghost" className="w-full h-14 rounded-2xl border-2 border-dashed border-primary/5 font-black uppercase text-[10px] tracking-widest text-primary hover:bg-primary/5">
                        View full ledger
                    </Button>
                </Card>
            </div>
        </div>
    );

    const renderPayments = () => (
        <div className="space-y-12 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none">Treasury Hub</h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-2">Official membership ledger</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={() => setIsSettingsOpen(true)} variant="outline" className="h-12 px-6 rounded-2xl border-2 border-primary/10 text-primary font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-primary hover:text-white transition-all">
                        <Settings className="h-4 w-4 mr-2" /> Treasury config
                    </Button>
                    <Button onClick={exportCSV} variant="outline" className="h-12 px-6 rounded-2xl bg-white border-none shadow-xl font-black uppercase text-[10px] tracking-widest gap-2">
                        <FileSpreadsheet size={18} /> Export ledger
                    </Button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative group flex-1 w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/20 group-focus-within:text-primary transition-colors" size={20} />
                    <Input placeholder="Search student, USN or reference..." value={search} onChange={e => { setSearch(e.target.value); setLedgerPage(1); }} className="h-16 pl-14 rounded-2xl border-none bg-white shadow-xl font-bold text-base w-full" />
                </div>
                <div className="w-full lg:w-80">
                    <select value={selectedTermId} onChange={e => { setSelectedTermId(e.target.value); setLedgerPage(1); }} className="w-full h-16 bg-white border-none rounded-2xl px-8 font-black text-[10px] uppercase tracking-widest shadow-xl appearance-none outline-none">
                        <option value="all">All cycles</option>
                        {terms.map(t => <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-primary/5 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full">
                        <thead className="bg-primary/5 border-b border-primary/5">
                            <tr>
                                <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Student identity</th>
                                <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Academic detail</th>
                                <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Transaction</th>
                                <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Amount</th>
                                <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Status</th>
                                <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/5">
                            {paginatedLedger.length === 0 ? (
                                <tr><td colSpan={6} className="p-24 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs opacity-40">No validated records found for this period</td></tr>
                            ) : (
                                paginatedLedger.map(p => (
                                    <tr key={p.id} className="hover:bg-primary/[0.01] transition-colors group">
                                        <td className="px-10 py-8">
                                            <p className="font-black text-primary uppercase text-sm group-hover:scale-[1.01] transition-transform origin-left">{p.studentName}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">{p.studentId}</p>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-2">
                                                <GraduationCap size={14} className="text-primary/40" />
                                                <span className="font-black text-slate-700 text-[10px] uppercase">Year {p.studentYear}</span>
                                            </div>
                                            <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1 truncate max-w-[140px]">{p.termName}</p>
                                        </td>
                                        <td className="px-10 py-8">
                                            <p className="font-black text-slate-700 text-xs tabular-nums">{p.referenceNumber}</p>
                                            <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1.5">{format(new Date(p.timestamp), 'MMM dd yyyy')}</p>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <span className="font-black text-xs text-green-600">₱{p.amount || membershipFee}</span>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <Badge className={cn("px-4 py-1 rounded-full font-black text-[9px] uppercase tracking-widest border-none shadow-sm", p.status === 'approved' ? "bg-green-500 text-white" : p.status === 'pending' ? "bg-amber-500 text-white" : "bg-red-500 text-white")}>
                                                {p.status}
                                            </Badge>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <button onClick={() => setSelectedPayment(p)} className="h-11 px-6 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all font-black uppercase text-[10px] tracking-widest gap-2 inline-flex items-center shadow-sm">
                                                <Eye size={14} /> Review
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {renderPagination(ledgerPage, totalLedgerPages, setLedgerPage)}
        </div>
    );

    const renderUnpaid = () => (
        <div className="space-y-12 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-4xl font-black text-[#6D1B0A] tracking-tighter uppercase leading-none">Unpaid registry</h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-2">Collection delinquency monitor</p>
                </div>
                <Badge className="bg-[#6D1B0A] text-white font-black text-[10px] px-6 py-3 rounded-2xl shadow-xl animate-pulse uppercase tracking-widest">{stats.unpaid} pending settlements</Badge>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative group flex-1 w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/20 group-focus-within:text-primary transition-colors" size={20} />
                    <Input placeholder="Search student identity..." value={search} onChange={e => { setSearch(e.target.value); setUnpaidPage(1); }} className="h-16 pl-14 rounded-2xl border-none bg-white shadow-xl font-bold text-base w-full" />
                </div>
                <div className="w-full lg:w-80">
                    <select value={selectedTermId} onChange={e => { setSelectedTermId(e.target.value); setUnpaidPage(1); }} className="w-full h-16 bg-white border-none rounded-2xl px-8 font-black text-[10px] uppercase tracking-widest shadow-xl appearance-none outline-none">
                        <option value="all">Select cycle to monitor</option>
                        {terms.map(t => <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-primary/5 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-primary/5">
                            <tr>
                                <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Identified student</th>
                                <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Academic load</th>
                                <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Year level</th>
                                <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Status protocol</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/5">
                            {paginatedUnpaid.length === 0 ? (
                                <tr><td colSpan={4} className="p-24 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs opacity-40">All joined students for this cycle have cleared dues</td></tr>
                            ) : (
                                paginatedUnpaid.map(s => (
                                    <tr key={s.id} className="hover:bg-red-50/30 transition-colors group">
                                        <td className="px-10 py-8">
                                            <p className="font-black text-slate-800 uppercase text-sm group-hover:scale-[1.01] transition-transform origin-left">{s.name}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">{s.id}</p>
                                        </td>
                                        <td className="px-10 py-8">
                                            <p className="text-xs font-black uppercase text-[#6D1B0A]">{s.program || 'N/A'}</p>
                                        </td>
                                        <td className="px-10 py-8 text-center font-bold text-xs">Year {s.year}</td>
                                        <td className="px-10 py-8 text-right">
                                            <Badge variant="destructive" className="px-5 py-2 rounded-full font-black text-[9px] uppercase tracking-widest border-none shadow-sm bg-[#6D1B0A] text-white">Settlement required</Badge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {renderPagination(unpaidPage, totalUnpaidPages, setUnpaidPage)}
        </div>
    );

    const renderContent = () => {
        if (currentView === 'profile') return <ProfileView onBack={() => setCurrentView('home')} />;
        if (currentView === 'payments') return renderPayments();
        if (currentView === 'unpaid') return renderUnpaid();
        return renderDashboard();
    };

    if (loading) return (
        <div className="h-[70vh] flex flex-col items-center justify-center space-y-6">
            <Loader2 className="animate-spin text-primary h-14 w-14" strokeWidth={3} />
            <p className="font-black uppercase text-[10px] tracking-[0.4em] text-muted-foreground animate-pulse">Syncing treasury intelligence...</p>
        </div>
    );

    return (
        <Layout currentView={currentView} onNavigate={setCurrentView}>
            <div className="h-full pt-4">
                {renderContent()}
            </div>

            {/* Treasury Config Modal */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="sm:max-w-md rounded-[3rem] p-0 overflow-hidden border-none shadow-3xl bg-white">
                    <div className="bg-primary p-10 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black uppercase tracking-tight">Treasury protocol</DialogTitle>
                            <DialogDescription className="text-white/60 font-bold text-[10px] uppercase tracking-widest mt-2">Deploy official membership fees and details</DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="p-10 space-y-8 bg-white">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Trimester fee amount (PHP)</Label>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-2xl text-primary">₱</span>
                                <Input type="number" value={tempFee} onChange={e => setTempFee(e.target.value)} className="h-16 pl-14 rounded-2xl border-2 border-primary/10 font-black text-2xl shadow-inner bg-slate-50 focus:bg-white transition-all" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Gcash account details</Label>
                            <Input placeholder="Account Name (e.g. JUAN DELA CRUZ)" value={tempGcashName} onChange={e => setTempGcashName(e.target.value.toUpperCase())} className="h-14 rounded-xl border-primary/10 font-bold bg-slate-50" />
                            <Input placeholder="Mobile Number (e.g. 09123456789)" value={tempGcash} onChange={e => setTempGcash(e.target.value)} className="h-14 rounded-xl border-primary/10 font-bold bg-slate-50" />
                        </div>
                        <div className="flex gap-4 pt-4">
                            <DialogClose asChild><Button variant="ghost" className="flex-1 h-16 rounded-2xl font-black uppercase text-[10px] tracking-widest">Abort</Button></DialogClose>
                            <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="flex-[2] h-16 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 gap-3">
                                {isSavingSettings ? <Loader2 className="animate-spin h-5 w-5" /> : <Save size={20} />} Deploy protocol
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Validation Modal */}
            {selectedPayment && (
                <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
                    <DialogContent className="sm:max-w-2xl rounded-[3rem] p-0 overflow-hidden border-none shadow-3xl bg-white">
                        <div className="bg-primary p-10 text-white relative">
                            <button onClick={() => setSelectedPayment(null)} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors"><X size={28} /></button>
                            <DialogHeader>
                                <DialogTitle className="text-3xl font-black uppercase tracking-tight">Validate transaction</DialogTitle>
                                <DialogDescription className="text-white/60 font-bold text-[10px] uppercase tracking-widest mt-2">Treasury verification protocol v1.0</DialogDescription>
                            </DialogHeader>
                        </div>
                        <div className="p-12 space-y-10 bg-white">
                            <div className="flex items-center justify-between border-b border-primary/5 pb-8">
                                <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Identified student</p>
                                    <p className="font-black text-3xl text-primary uppercase leading-none tracking-tight">{selectedPayment.studentName}</p>
                                    <p className="text-xs font-bold text-slate-400 mt-2">USN: {selectedPayment.studentId}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Gcash reference</p>
                                    <p className="font-black text-2xl text-slate-800 tabular-nums leading-none tracking-tighter">{selectedPayment.referenceNumber}</p>
                                    <Badge className="bg-green-100 text-green-700 border-none font-black text-[9px] mt-2 px-3">₱{selectedPayment.amount || membershipFee}</Badge>
                                </div>
                            </div>
                            
                            {selectedPayment.receiptPic ? (
                                <div className="rounded-[2.5rem] border-4 border-slate-50 overflow-hidden shadow-2xl bg-slate-100 flex items-center justify-center p-3 relative group">
                                    <img src={selectedPayment.receiptPic} alt="Official Receipt" className="max-w-full h-auto rounded-[1.5rem] object-contain max-h-[450px] shadow-sm transition-transform duration-700 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button onClick={() => window.open(selectedPayment.receiptPic!, '_blank')} className="h-16 w-16 rounded-full bg-white text-primary flex items-center justify-center shadow-2xl scale-0 group-hover:scale-100 transition-transform duration-500"><Eye size={28} /></button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-20 text-center border-4 border-dashed rounded-[3rem] border-slate-100 bg-slate-50/50 flex flex-col items-center">
                                    <FileSpreadsheet size={48} className="text-slate-200 mb-4" />
                                    <p className="font-black text-slate-300 uppercase text-xs tracking-[0.2em]">No receipt image uploaded</p>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-5 pt-4">
                                <Button onClick={() => handleAction(selectedPayment!.id, 'approved')} className="flex-1 h-20 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-green-900/10 gap-3 transition-all active:scale-95">
                                    <CheckCircle2 size={24} /> Authorize entry
                                </Button>
                                <Button onClick={() => handleAction(selectedPayment!.id, 'rejected')} variant="destructive" className="flex-1 h-20 rounded-2xl font-black uppercase text-xs tracking-[0.2em] gap-3 transition-all active:scale-95 shadow-xl">
                                    <XCircle size={24} /> Decline signal
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </Layout>
    );
}

