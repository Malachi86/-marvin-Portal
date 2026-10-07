'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Search, 
  Loader2, 
  UserX, 
  Unlock, 
  Ban, 
  Activity,
  ShieldAlert,
  History,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { 
    getDevicesAction, 
    updateDeviceStatusAction, 
    banDeviceAction 
} from '@/app/actions/dbActions';
import { User } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const StatBox = ({ icon: Icon, label, value, color, description }: any) => (
  <Card className="p-5 rounded-2xl border border-slate-100 shadow-sm bg-white flex flex-col justify-between min-h-[130px] transition-all hover:border-primary/20 group relative overflow-hidden">
    <div className="flex justify-between items-start relative z-10">
      <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shadow-sm", color || "bg-primary/5 text-primary")}>
        <Icon size={18} />
      </div>
      {description && (
        <span className="text-[9px] font-bold text-slate-400 tracking-tight bg-slate-50 px-2 py-1 rounded uppercase">
          {description}
        </span>
      )}
    </div>
    <div className="relative z-10 mt-4">
      <p className="text-[10px] font-bold tracking-wider text-slate-500 mb-0.5 uppercase">{label}</p>
      <span className="text-3xl font-bold tracking-tight text-slate-900">{value}</span>
    </div>
    <Icon size={80} className="absolute -right-4 -bottom-4 opacity-[0.02] transition-transform group-hover:scale-110" />
  </Card>
);

export default function SecurityCenter() {
  const { user: admin } = useAuth();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadRegistry();
    const interval = setInterval(loadRegistry, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadRegistry = async () => {
    try {
      const data = await getDevicesAction();
      setDevices(data);
    } catch (e) {
      console.error('Registry sync failure');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async (deviceId: string) => {
    try {
        await updateDeviceStatusAction(deviceId, { isVerified: true, isBanned: false });
        toast.success("Device Authorized", { description: "Portal access granted for this signature." });
        loadRegistry();
    } catch (e) {
        toast.error("Authorization failed.");
    }
  };

  const handleRestrict = async (deviceId: string, reason: string = "Administrative Restriction") => {
    try {
        await updateDeviceStatusAction(deviceId, { isVerified: false, isBanned: true, banReason: reason });
        toast.warning("Device Restricted", { description: "Access revoked for this signature." });
        loadRegistry();
    } catch (e) {
        toast.error("Restriction failed.");
    }
  };

  const handleRestore = async (deviceId: string) => {
    try {
        await updateDeviceStatusAction(deviceId, { isVerified: true, isBanned: false, banReason: "" });
        toast.success("Access Restored");
        loadRegistry();
    } catch (e) {
        toast.error("Restore failed.");
    }
  };

  const filtered = devices.filter(
    (d) =>
      d.id.toLowerCase().includes(search.toLowerCase()) ||
      d.userAgent.toLowerCase().includes(search.toLowerCase()) ||
      d.associatedUser?.toLowerCase().includes(search.toLowerCase())
  );

  const pending = devices.filter(d => !d.isVerified && !d.isBanned);
  const banned = devices.filter(d => d.isBanned);

  return (
    <div className="min-h-full space-y-6 animate-in fade-in duration-500 pb-12 max-w-[1200px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 px-2">
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#6D1B0A] leading-none uppercase">
            Security Center
          </h1>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <p className="text-[10px] font-black text-slate-500 tracking-[0.15em] uppercase">
              Identity Guard Protocol v2.0
            </p>
          </div>
        </div>
        
        <Badge variant="outline" className="rounded-lg px-3 py-1.5 text-[10px] font-bold tracking-wider bg-white shadow-sm border-slate-200">
          <ShieldCheck size={12} className="mr-2 text-green-600" />
          TERMINAL SECURED
        </Badge>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-2">
        <StatBox 
          icon={Clock} 
          label="Pending Visitors" 
          value={pending.length} 
          color="bg-amber-50 text-amber-600"
          description="Verification"
        />
        <StatBox 
          icon={Ban} 
          label="Restricted Nodes" 
          value={banned.length} 
          color="bg-red-50 text-red-600"
          description="Blacklist"
        />
        <StatBox 
          icon={Activity} 
          label="System Integrity" 
          value="100%" 
          color="bg-emerald-50 text-emerald-600"
          description="Operational"
        />
      </div>

      <Tabs defaultValue="pending" className="w-full px-2">
        <TabsList className="bg-white border border-slate-200 h-14 p-1 rounded-full mb-6 shadow-sm inline-flex">
            <TabsTrigger value="pending" className="rounded-full px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-[#6D1B0A] data-[state=active]:text-white transition-all">
                Pending Approval ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="restricted" className="rounded-full px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-[#6D1B0A] data-[state=active]:text-white transition-all">
                Restricted Registry ({banned.length})
            </TabsTrigger>
        </TabsList>

        <Card className="border border-slate-200 bg-white rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col min-h-[500px]">
            <div className="bg-slate-50/50 px-8 py-6 flex flex-col lg:flex-row items-center justify-between gap-6 border-b border-slate-100">
                <div className="relative group w-full lg:w-[450px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                        placeholder="Search ID, User, or Hardware Signal..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-12 pl-12 rounded-2xl border-slate-200 bg-white shadow-sm font-bold text-sm focus:ring-primary/20 transition-all"
                    />
                </div>
            </div>

            <CardContent className="flex-1 p-0">
                {loading ? (
                    <div className="h-96 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="animate-spin h-10 w-10 text-primary" strokeWidth={3} />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronizing Matrix...</p>
                    </div>
                ) : (
                    <>
                        <TabsContent value="pending" className="m-0">
                            {pending.length === 0 ? (
                                <div className="h-96 flex flex-col items-center justify-center text-center opacity-20">
                                    <ShieldCheck size={80} />
                                    <p className="text-sm font-black uppercase tracking-widest mt-4">Registry Clear</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {pending.map(device => (
                                        <div key={device.id} className="p-8 hover:bg-slate-50/30 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-8 group">
                                            <div className="flex items-center gap-6">
                                                <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shadow-inner group-hover:bg-amber-500 group-hover:text-white transition-all">
                                                    <Smartphone size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{device.id}</h3>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">First Visit: {format(new Date(device.firstVisit), 'MMM dd, h:mm a')}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex-1 max-w-md">
                                                <div className="bg-slate-100/50 p-4 rounded-2xl border border-slate-200/50">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Hardware Header</p>
                                                    <p className="text-[10px] font-medium text-slate-600 line-clamp-2 leading-relaxed">{device.userAgent}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <Button onClick={() => handleAuthorize(device.id)} className="h-12 px-8 rounded-xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95 gap-2">
                                                    <CheckCircle2 size={16} /> Authorize Access
                                                </Button>
                                                <Button onClick={() => handleRestrict(device.id)} variant="outline" className="h-12 w-12 rounded-xl border-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-all p-0">
                                                    <XCircle size={20} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="restricted" className="m-0">
                            {banned.length === 0 ? (
                                <div className="h-96 flex flex-col items-center justify-center text-center opacity-20">
                                    <Ban size={80} />
                                    <p className="text-sm font-black uppercase tracking-widest mt-4">Blacklist Empty</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {banned.map(device => (
                                        <div key={device.id} className="p-8 hover:bg-red-50/10 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-8 group">
                                            <div className="flex items-center gap-6">
                                                <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 border border-red-100 shadow-inner">
                                                    <ShieldAlert size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-red-900 tracking-tight">{device.id}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge className="bg-red-600 text-white font-black text-[8px] uppercase h-5">RESTRICTED</Badge>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{format(new Date(device.updatedAt?.toDate?.() || device.updatedAt || Date.now()), 'MMM dd, yyyy')}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex-1 max-w-md">
                                                <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                                                    <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">Termination Reason</p>
                                                    <p className="text-xs font-bold text-red-700 italic">"{device.banReason || 'Administrative decision.'}"</p>
                                                </div>
                                            </div>

                                            <Button onClick={() => handleRestore(device.id)} className="h-12 px-8 rounded-xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95 gap-2">
                                                <Unlock size={16} /> Restore Access
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </>
                )}
            </CardContent>

            <div className="bg-slate-50/50 px-8 py-5 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-slate-400 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Root Directive Console</span>
                </div>
                <div className="flex items-center gap-6 text-slate-400">
                    <div className="flex items-center gap-2">
                        <History size={14} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Registry Sync: Active</span>
                    </div>
                </div>
            </div>
        </Card>
      </Tabs>
    </div>
  );
}
