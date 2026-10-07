
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
    Megaphone, 
    Send, 
    Globe, 
    Trash2, 
    Loader2, 
    Clock, 
    Repeat, 
    Infinity as InfinityIcon,
    ChevronDown,
    Layout
} from 'lucide-react';
import { 
    addAnnouncementAction, 
    getAnnouncementsAction, 
    deactivateAnnouncementAction 
} from '@/app/actions/dbActions';
import { Announcement } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function SystemAnnouncements() {
    const { user: admin } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        message: '',
        targetType: 'all' as Announcement['targetType'],
        targetUserId: '',
        attemptType: 'limited' as Announcement['attemptType'],
        maxAttempts: 1
    });

    useEffect(() => {
        loadAnnouncements();
    }, []);

    const loadAnnouncements = async () => {
        setLoading(true);
        try {
            const data = await getAnnouncementsAction();
            setAnnouncements(data);
        } catch (e) {
            toast.error("Failed to load broadcast history.");
        } finally {
            setLoading(false);
        }
    };

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!admin) return;
        if (!formData.title.trim() || !formData.message.trim()) {
            toast.error("Please fill in both the title and the message content.");
            return;
        }

        setIsSaving(true);
        try {
            const payload: any = {
                senderId: admin.id,
                title: formData.title.trim(),
                message: formData.message.trim(),
                targetType: formData.targetType,
                attemptType: formData.attemptType
            };

            if (formData.targetType === 'specific') payload.targetUserId = formData.targetUserId.trim();
            if (formData.attemptType === 'limited') payload.maxAttempts = Number(formData.maxAttempts);

            await addAnnouncementAction(payload);
            toast.success("Broadcast Transmitted!");
            setFormData({ title: '', message: '', targetType: 'all', targetUserId: '', attemptType: 'limited', maxAttempts: 1 });
            loadAnnouncements();
        } catch (error: any) {
            toast.error("Transmission failed.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeactivate = async (id: string) => {
        try {
            await deactivateAnnouncementAction(id);
            toast.success("Broadcast Retired.");
            loadAnnouncements();
        } catch (e) {
            toast.error("Deactivation failed.");
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-24 max-w-[1400px] mx-auto">
            <div className="flex flex-col gap-1">
                <h1 className="text-4xl font-black text-primary tracking-tight uppercase leading-none">Broadcast Hub</h1>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">System-Wide Messaging Protocol</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                {/* Compose Section */}
                <div className="lg:col-span-5">
                    <Card className="rounded-[2.5rem] border-none shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] overflow-hidden bg-white">
                        <div className="h-2 bg-primary" />
                        <CardContent className="p-10 space-y-8">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                                    <Megaphone size={18} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight text-foreground">COMPOSE SIGNAL</h3>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">DEPLOY A SYSTEM-WIDE POP-UP MESSAGE</p>
                                </div>
                            </div>

                            <form onSubmit={handleBroadcast} className="space-y-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">AUDIENCE TARGET</Label>
                                    <div className="relative">
                                        <select 
                                            value={formData.targetType} 
                                            onChange={(e: any) => setFormData({...formData, targetType: e.target.value})}
                                            className="w-full h-14 bg-white border-2 border-black/5 rounded-2xl px-6 font-black text-[10px] uppercase tracking-widest appearance-none outline-none focus:border-primary/20 transition-all shadow-sm"
                                        >
                                            <option value="all">GLOBAL (EVERYONE)</option>
                                            <option value="students">STUDENTS ONLY</option>
                                            <option value="teachers">FACULTY ONLY</option>
                                            <option value="specific">SPECIFIC IDENTITY</option>
                                        </select>
                                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>

                                <div className="p-8 bg-muted/20 rounded-[2.5rem] space-y-6 shadow-inner">
                                    <div className="space-y-3">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-primary ml-1 text-center block">ATTEMPT SETTING</Label>
                                        <div className="grid grid-cols-2 gap-3 p-1.5 bg-white/50 rounded-2xl">
                                            <button 
                                                type="button"
                                                onClick={() => setFormData({...formData, attemptType: 'limited'})}
                                                className={cn(
                                                    "flex items-center justify-center gap-2 h-14 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all",
                                                    formData.attemptType === 'limited' ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/50"
                                                )}
                                            >
                                                <Repeat size={14} /> LIMITED
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setFormData({...formData, attemptType: 'unlimited'})}
                                                className={cn(
                                                    "flex items-center justify-center gap-2 h-14 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all",
                                                    formData.attemptType === 'unlimited' ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/50"
                                                )}
                                            >
                                                <InfinityIcon size={14} /> UNLIMITED
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">BROADCAST TITLE</Label>
                                    <Input 
                                        placeholder="e.g. MAINTENANCE ALERT" 
                                        value={formData.title}
                                        onChange={e => setFormData({...formData, title: e.target.value})}
                                        className="h-14 rounded-2xl border-2 border-black/5 bg-white px-6 font-bold text-sm focus:border-primary/20 transition-all placeholder:text-muted-foreground/20"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">SIGNAL CONTENT</Label>
                                    <Textarea 
                                        placeholder="Type your message here..." 
                                        value={formData.message}
                                        onChange={e => setFormData({...formData, message: e.target.value})}
                                        className="rounded-2xl p-6 border-2 border-black/5 bg-white min-h-[140px] font-medium leading-relaxed resize-none focus:border-primary/20 transition-all"
                                    />
                                </div>

                                <Button 
                                    type="submit" 
                                    disabled={isSaving}
                                    className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-primary/20 transition-all active:scale-95 gap-3"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" /> : <Send size={16} />}
                                    TRANSMIT SIGNAL
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-7 space-y-8">
                    <div className="flex items-center gap-3 ml-2">
                        <Clock className="text-muted-foreground h-5 w-5" />
                        <h2 className="text-xl font-black uppercase tracking-widest text-muted-foreground">BROADCAST REGISTRY</h2>
                    </div>

                    <div className="space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto no-scrollbar pr-2">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-32 space-y-4">
                                <Loader2 className="animate-spin h-10 w-10 text-primary" />
                                <p className="font-black uppercase text-[9px] tracking-widest text-muted-foreground">Syncing Communications...</p>
                            </div>
                        ) : announcements.length === 0 ? (
                            <div className="p-24 text-center border-4 border-dashed rounded-[3rem] border-black/5">
                                <Globe size={48} className="mx-auto text-muted-foreground opacity-10 mb-4" />
                                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em]">No active signals in registry</p>
                            </div>
                        ) : (
                            announcements.map(ann => (
                                <Card key={ann.id} className={cn(
                                    "rounded-[2.5rem] border-none shadow-[0_15px_40px_-10px_rgba(0,0,0,0.08)] transition-all bg-white group overflow-hidden",
                                    !ann.active && "opacity-60 grayscale"
                                )}>
                                    <div className="p-8 flex items-start gap-6">
                                        <div className="h-14 w-14 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-xl border-4 border-primary/5">
                                            <Globe size={20} />
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-muted px-3 py-1 rounded-full font-black text-[8px] uppercase tracking-widest">TO: {ann.targetType.toUpperCase()}</span>
                                                </div>
                                                <span className="text-[8px] font-bold text-muted-foreground uppercase tabular-nums">
                                                    {new Date(ann.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-black uppercase tracking-tight text-primary flex items-center gap-2">📢 {ann.title}</h3>
                                            <p className="text-xs font-medium text-slate-500">{ann.message}</p>
                                            {ann.active && (
                                                <button onClick={() => handleDeactivate(ann.id)} className="flex items-center gap-2 text-[9px] font-black uppercase text-primary hover:opacity-70 transition-all"><Trash2 size={12} /> END BROADCAST</button>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
