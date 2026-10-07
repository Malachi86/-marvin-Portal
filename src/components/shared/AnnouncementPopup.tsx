'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
    getAnnouncementsAction, 
    dismissAnnouncementAction,
    recordSlotAcknowledgementAction,
    checkSlotAcknowledgementAction
} from '@/app/actions/dbActions';
import { Announcement } from '@/utils/storage';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Megaphone, Bell, CheckCircle2, ShieldCheck, Zap, History } from 'lucide-react';

export default function AnnouncementPopup() {
    const { user } = useAuth();
    const [activeAnn, setActiveAnn] = useState<Announcement | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const checkAnnouncements = useCallback(async () => {
        if (!user) return;
        
        try {
            const all = await getAnnouncementsAction();
            const now = new Date();
            const hours = now.getHours();
            
            // Define time slots: Morning (0-11) and Afternoon/Night (12-23)
            const currentSlot = hours < 12 ? 'AM' : 'PM';
            const today = now.toISOString().split('T')[0];
            const slotKey = `${today}_${currentSlot}`;
            
            // 1. Filter active announcements only
            const activeList = all.filter(a => a.active);
            
            // 2. Find announcement matching target and dismissal logic
            for (const a of activeList) {
                // Check Target Type
                let isTarget = false;
                if (a.targetType === 'all') isTarget = true;
                else if (a.targetType === 'students' && user.role === 'student') isTarget = true;
                else if (a.targetType === 'teachers' && user.role === 'teacher') isTarget = true;
                else if (a.targetType === 'specific' && a.targetUserId === user.id) isTarget = true;
                
                if (!isTarget) continue;

                // Check Dismissal Type
                if (a.attemptType === 'unlimited') {
                    // Unlimited: Cross-device global check
                    const isDismissedGlobally = await checkSlotAcknowledgementAction(user.id, a.id, slotKey);
                    if (!isDismissedGlobally) {
                        setActiveAnn(a);
                        setIsOpen(true);
                        return; // Show only one at a time
                    }
                } else {
                    // Limited: Check permanent dismissal in Firestore
                    if (!a.dismissedBy.includes(user.id)) {
                        // Double check local attempts for "limited"
                        const viewKey = `ann_views_${user.id}_${a.id}`;
                        const viewCount = parseInt(localStorage.getItem(viewKey) || '0');
                        const max = a.maxAttempts || 1;

                        if (viewCount < max) {
                            setActiveAnn(a);
                            setIsOpen(true);
                            localStorage.setItem(viewKey, (viewCount + 1).toString());
                            return;
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Announcement check failed", e);
        }
    }, [user]);

    useEffect(() => {
        checkAnnouncements();
        // Periodic check for new signals
        const interval = setInterval(checkAnnouncements, 60000);
        return () => clearInterval(interval);
    }, [checkAnnouncements]);

    const handleAcknowledge = async () => {
        if (!activeAnn || !user) return;
        
        try {
            if (activeAnn.attemptType === 'limited') {
                // Permanent dismissal for Limited type
                await dismissAnnouncementAction(activeAnn.id, user.id);
            } else {
                // Slot-based global dismissal for Unlimited type
                const now = new Date();
                const currentSlot = now.getHours() < 12 ? 'AM' : 'PM';
                const today = now.toISOString().split('T')[0];
                const slotKey = `${today}_${currentSlot}`;
                
                await recordSlotAcknowledgementAction(user.id, activeAnn.id, slotKey);
            }
            setIsOpen(false);
            setTimeout(() => setActiveAnn(null), 300);
        } catch {
            setIsOpen(false);
        }
    };

    if (!activeAnn) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(val) => { if(!val) setIsOpen(false); }}>
            <DialogContent className="max-w-lg p-0 overflow-hidden border-none rounded-xl shadow-3xl z-[150] bg-white flex flex-col max-h-[85vh]">
                <div className="bg-primary p-8 text-white relative overflow-hidden flex-none">
                    <div className="absolute -top-10 -right-10 opacity-10 rotate-12 pointer-events-none">
                        <Megaphone size={150} />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                                    <Bell className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-60 leading-none">Priority Broadcast</p>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest mt-1.5">Official Signal</h3>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                                {activeAnn.attemptType === 'limited' ? <History size={10}/> : <Zap size={10} fill="currentColor" />}
                                <span className="text-[8px] font-black uppercase tracking-widest">
                                    {activeAnn.attemptType === 'limited' ? 'Limited View' : 'Daily Sync'}
                                </span>
                            </div>
                        </div>
                        
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black uppercase tracking-tighter leading-tight text-white">
                                {activeAnn.title}
                            </DialogTitle>
                        </DialogHeader>
                    </div>
                </div>

                <div className="p-8 space-y-8 bg-white flex-1 overflow-y-auto no-scrollbar">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 shadow-inner">
                        <p className="text-base font-bold text-slate-700 leading-relaxed italic">
                            "{activeAnn.message}"
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-4 pb-2">
                        <Button 
                            onClick={handleAcknowledge}
                            className="w-full h-16 rounded-xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95 gap-3"
                        >
                            <CheckCircle2 size={20} />
                            Acknowledge Signal
                        </Button>
                        <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">
                            Authenticated Identity: {user?.name}
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
