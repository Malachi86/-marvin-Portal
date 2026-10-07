'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
    Monitor, 
    Clock, 
    LogOut, 
    Loader2,
    Volume2,
    VolumeX,
    Zap,
    AlertTriangle
} from 'lucide-react';
import { 
    getAttendancesAction, 
    getLabRequestsAction, 
    getSubjectsAction,
    updateAttendanceAction,
    updatePcAction
} from '@/app/actions/dbActions';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { differenceInSeconds } from 'date-fns';

export default function SessionTerminal() {
    const { user } = useAuth();
    const [activeSession, setActiveSession] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [isExpired, setIsExpired] = useState(false);
    const [autoCheckOutActive, setAutoCheckOutActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);

    // Audio Context Initializer - Persistent
    const getAudioContext = useCallback(() => {
        if (typeof window === 'undefined') return null;
        
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
            const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                audioCtxRef.current = new AudioContextClass();
            }
        }
        return audioCtxRef.current;
    }, []);

    // Global Unlocker - Ensures context is resumed on any interaction
    useEffect(() => {
        const unlock = () => {
            const ctx = getAudioContext();
            if (ctx && ctx.state === 'suspended') {
                ctx.resume();
            }
        };
        window.addEventListener('click', unlock);
        window.addEventListener('keydown', unlock);
        return () => {
            window.removeEventListener('click', unlock);
            window.removeEventListener('keydown', unlock);
        };
    }, [getAudioContext]);

    // PIERCING SIREN LOGIC
    const playAlarm = useCallback(() => {
        if (isMuted) return;
        
        const ctx = getAudioContext();
        if (!ctx) return;

        // Try to resume if browser suspended it
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const now = ctx.currentTime;
        
        const playBeep = (time: number, freq: number, duration: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = "square";
            osc.frequency.setValueAtTime(freq, time);
            
            gain.gain.setValueAtTime(0.9, time); 
            gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(time);
            osc.stop(time + duration + 0.05);
        };

        // 4-pulse alternating emergency pattern
        playBeep(now, 1800, 0.1);
        playBeep(now + 0.15, 2400, 0.1);
        playBeep(now + 0.3, 1800, 0.1);
        playBeep(now + 0.45, 2400, 0.1);
        
    }, [isMuted, getAudioContext]);

    const handleCheckOut = useCallback(async (isAuto = false) => {
        if (!activeSession) return;
        
        try {
            const timeOut = new Date().toLocaleTimeString('en-US', { hour12: false });
            
            updateAttendanceAction(activeSession.id, { timeOut });
            if (activeSession.pcId) {
                updatePcAction(activeSession.pcId, { status: 'available' });
            }

            if (isAuto) {
                toast.info("AUTO-DISMISSAL COMPLETE", { 
                    description: "Registry finalized due to session timeout.",
                    duration: 10000
                });
            } else {
                toast.success("CHECK-OUT SUCCESSFUL", { description: "Session logging complete." });
            }
            
            setActiveSession(null);
            setTimeLeft(null);
            setIsExpired(false);
            
            if (audioCtxRef.current) {
                audioCtxRef.current.close().catch(() => {});
                audioCtxRef.current = null;
            }
        } catch (e) {
            toast.error("Network sync failure.");
        }
    }, [activeSession]);

    const findActiveSession = useCallback(async () => {
        if (!user || user.role !== 'student') return;

        try {
            const [attendances, requests, subjects] = await Promise.all([
                getAttendancesAction(), 
                getLabRequestsAction(), 
                getSubjectsAction()
            ]);

            const today = new Date().toISOString().split('T')[0];
            const current = attendances.find(a => 
                a.studentId === user.id && 
                a.date.startsWith(today) && 
                a.timeIn && 
                !a.timeOut
            );

            if (!current) {
                setActiveSession(null);
                setLoading(false);
                return;
            }

            let targetEndTime: Date | null = null;

            if (current.sessionId?.startsWith('SESS-REQ-')) {
                const reqId = current.sessionId.replace('SESS-REQ-', '');
                const request = requests.find(r => r.id === reqId);
                if (request) {
                    targetEndTime = new Date(request.endTime);
                }
            } 
            
            if (!targetEndTime) {
                const subject = subjects.find(s => s.id === current.subjectId);
                const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                const schedule = subject?.schedules?.find(s => s.day === dayName);
                
                if (schedule?.dismissalTime) {
                    const [h, m] = schedule.dismissalTime.split(':').map(Number);
                    targetEndTime = new Date();
                    targetEndTime.setHours(h, m, 0, 0);
                }
            }

            setActiveSession({
                ...current,
                targetEndTime
            });
        } catch (e) {
            console.error("Session monitor failure");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        findActiveSession();
        const poll = setInterval(findActiveSession, 30000);
        return () => clearInterval(poll);
    }, [findActiveSession]);

    useEffect(() => {
        if (timerRef.current) clearInterval(timerRef.current);

        if (activeSession?.targetEndTime) {
            timerRef.current = setInterval(() => {
                const now = new Date();
                const diff = differenceInSeconds(activeSession.targetEndTime, now);
                
                setTimeLeft(diff);

                if (diff <= 0) {
                    setIsExpired(true);
                    playAlarm(); 
                    
                    if (diff <= -300 && !autoCheckOutActive) {
                        setAutoCheckOutActive(true);
                        handleCheckOut(true);
                    }
                } else {
                    setIsExpired(false);
                }
            }, 1000);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [activeSession, handleCheckOut, playAlarm, autoCheckOutActive]);

    const formatTime = (seconds: number) => {
        const absSec = Math.abs(seconds);
        const h = Math.floor(absSec / 3600);
        const m = Math.floor((absSec % 3600) / 60);
        const s = absSec % 60;
        return `${seconds < 0 ? '-' : ''}${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading || !activeSession) return null;

    const pcNum = activeSession.pcId?.split('-').pop();

    return (
        <div className="px-4 py-4 mb-4">
            <div className={cn(
                "rounded-[1.5rem] border-2 p-4 space-y-4 transition-all duration-500 shadow-xl relative overflow-hidden group",
                isExpired 
                    ? "bg-red-600 border-red-400 text-white animate-pulse" 
                    : "bg-primary/10 border-primary/20 text-primary"
            )}>
                <div className="absolute top-0 right-0 p-1 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                    <Zap size={60} fill="currentColor" />
                </div>

                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center shadow-inner",
                            isExpired ? "bg-white/20 text-white" : "bg-primary text-white"
                        )}>
                            {isExpired ? <Volume2 size={20} className="animate-bounce" /> : <Monitor size={20} />}
                        </div>
                        <div>
                            <p className={cn(
                                "text-[8px] font-black uppercase tracking-[0.2em] opacity-60",
                                isExpired ? "text-white" : "text-primary"
                            )}>
                                Station Active
                            </p>
                            <h4 className="text-lg font-black uppercase tracking-tight">PC-UNIT {pcNum || 'NA'}</h4>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {isExpired && (
                            <button 
                                onClick={() => setIsMuted(!isMuted)}
                                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                title={isMuted ? "Unmute Alarm" : "Mute Alarm"}
                            >
                                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-1 relative z-10">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-60">
                            {isExpired ? 'OVERTIME LIMIT REACHED' : 'SESSION COUNTDOWN'}
                        </span>
                        <Clock size={10} className={cn(isExpired ? "animate-spin" : "")} />
                    </div>
                    <div className={cn(
                        "text-2xl font-black tracking-tighter text-center py-2 rounded-xl shadow-inner font-mono",
                        isExpired ? "bg-black/20 text-white" : "bg-white text-primary"
                    )}>
                        {timeLeft !== null ? formatTime(timeLeft) : '--:--:--'}
                    </div>
                </div>

                {isExpired && (
                    <div className="bg-white/10 p-3 rounded-xl border border-white/10 flex items-center gap-2 relative z-10">
                        <AlertTriangle size={14} className="text-white shrink-0" />
                        <p className="text-[8px] font-black uppercase leading-tight tracking-widest">
                            Mandatory Logout Required. Unit status is currently compromised.
                        </p>
                    </div>
                )}

                <div className="space-y-2 relative z-10">
                    <Button 
                        onClick={() => handleCheckOut(false)}
                        className={cn(
                            "w-full h-10 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg transition-all active:scale-95 gap-2",
                            isExpired 
                                ? "bg-white text-red-600 hover:bg-slate-100" 
                                : "bg-primary text-white hover:bg-primary/90"
                        )}
                    >
                        <LogOut size={14} />
                        Terminate Session
                    </Button>
                </div>
            </div>
        </div>
    );
}