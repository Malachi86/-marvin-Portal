'use client';

import React, { useState } from 'react';
import { ScannerComponent } from '@/components/teacher/ScannerComponent';
import { User } from '@/utils/storage';
import { getUsersAction, addCampusLogAction } from '@/app/actions/dbActions';
import { toast } from 'sonner';
import { 
    Loader2, 
    ShieldCheck, 
    User as UserIcon, 
    Mail, 
    Barcode, 
    ArrowLeft, 
    Smartphone, 
    ShieldAlert, 
    MapPin, 
    Phone,
    AlertTriangle,
    LogIn,
    QrCode
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const VisualBarcode = ({ value }: { value: string }) => {
  const bars = value.split('').map((char, i) => {
    const digit = parseInt(char) || 0;
    const width = (digit % 2 === 0) ? 6 : 3;
    const height = 48;
    const gap = 4;
    const x = i * (6 + gap);
    return (
      <rect key={i} x={x} y={0} width={width} height={height} fill="currentColor" rx={2} />
    );
  });
  return <svg width={value.length * 10} height="48" viewBox={`0 0 ${value.length * 10} 48`} className="mx-auto text-primary">{bars}</svg>;
};

interface CampusScannerProps {
  onBack?: () => void;
}

export default function CampusScanner({ onBack }: CampusScannerProps) {
  const [verifying, setVerifying] = useState(false);
  const [scanMode, setScanMode] = useState<'entry' | 'exit'>('entry');
  const [verifiedUser, setVerifiedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleScan = async (data: string) => {
    setVerifying(true);
    try {
      const users = await getUsersAction();
      const user = users.find(u => u.id === data.trim());

      if (user) {
        if (user.isBanned) {
          toast.error("SECURITY BREACH: Restricted Identity Detected", {
            description: "Sentinel has flagged this user for permanent restriction.",
            duration: 8000
          });
          return;
        }

        await addCampusLogAction({
          userId: user.id,
          userName: user.name,
          role: user.role,
          type: scanMode,
          location: 'INSTITUTE MAIN GATE'
        });

        setVerifiedUser(user);
        setIsModalOpen(true);
        toast.success(`Identity Validated: ${user.name}`);
      } else {
        toast.error("VALIDATION FAILURE", { description: "Identity signal not recognized in the registry." });
      }
    } catch (e) {
      toast.error("System Protocol Error");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col items-center text-center relative px-4">
        {onBack && (
          <Button 
            variant="ghost" 
            onClick={onBack} 
            className="absolute left-0 top-0 h-14 w-14 rounded-full p-0 flex items-center justify-center hover:bg-primary/5 transition-all active:scale-90"
          >
            <ArrowLeft className="h-8 w-8 text-primary" />
          </Button>
        )}
        <div className="h-16 w-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary mb-6 shadow-inner">
            <ShieldCheck size={32} />
        </div>
        <h2 className="text-5xl font-black text-primary tracking-tighter uppercase leading-none">Security Sentinel</h2>
        <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.5em] mt-4">Automated Identity Validation Protocol</p>
      </div>

      <div className="flex justify-center gap-4 px-4">
        <button 
          onClick={() => setScanMode('entry')}
          className={cn(
            "flex-1 h-20 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3",
            scanMode === 'entry' ? "bg-primary text-white" : "bg-white text-muted-foreground border-2 border-primary/5"
          )}
        >
          <LogIn size={20} /> Entrance
        </button>
        <button 
          onClick={() => setScanMode('exit')}
          className={cn(
            "flex-1 h-20 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3",
            scanMode === 'exit' ? "bg-primary text-white" : "bg-white text-muted-foreground border-2 border-primary/5"
          )}
        >
          <LogOutIcon size={20} /> Dismissal
        </button>
      </div>

      <div className="bg-white rounded-[4rem] p-10 md:p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-primary/5 flex flex-col items-center relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
            <QrCode size={300} />
        </div>
        
        {verifying ? (
          <div className="h-80 flex flex-col items-center justify-center space-y-8">
            <div className="relative">
              <Loader2 className="animate-spin h-24 w-24 text-primary" strokeWidth={4} />
              <ShieldCheck className="absolute inset-0 m-auto h-10 w-10 text-primary/40" />
            </div>
            <div className="text-center">
                <p className="text-xs font-black uppercase tracking-[0.4em] text-primary animate-pulse">Decrypting Identity Signature...</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mt-2">Connecting to Secure Registry</p>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-sm relative z-10">
            <ScannerComponent 
              onScan={handleScan} 
              mode={scanMode === 'entry' ? 'in' : 'out'} 
            />
          </div>
        )}
      </div>

      {/* Verification Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-none rounded-[3rem] shadow-3xl bg-white no-scrollbar h-[90vh]">
          <DialogHeader className="sr-only">
            <DialogTitle>Validation Result</DialogTitle>
            <DialogDescription>Registry Matching Sequence</DialogDescription>
          </DialogHeader>
          
          {verifiedUser && (
            <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
              <div className="bg-primary p-10 text-white flex items-start gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12"><ShieldCheck size={120}/></div>
                <div className="w-28 h-28 rounded-[2.5rem] bg-white/20 backdrop-blur-xl border-4 border-white/20 flex items-center justify-center overflow-hidden shrink-0 shadow-2xl relative z-10">
                  {verifiedUser.profilePic ? (
                    <img src={verifiedUser.profilePic} alt="profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={56} />
                  )}
                </div>
                <div className="flex-1 space-y-2 mt-2 relative z-10">
                  <Badge className="bg-white/20 text-white border-none font-black text-[8px] uppercase tracking-widest px-3 mb-1">CERTIFIED IDENTITY</Badge>
                  <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">{verifiedUser.name}</h3>
                  <div className="space-y-1">
                    <p className="text-xs font-bold opacity-90 uppercase tracking-widest">{verifiedUser.id} • YEAR {verifiedUser.year || '?'}</p>
                    <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{verifiedUser.program || verifiedUser.strand || 'UNASSIGNED'}</p>
                  </div>
                </div>
              </div>

              <div className="p-10 space-y-10 bg-slate-50/50 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-6 rounded-[2rem] bg-white border border-primary/5 shadow-sm space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary"><Mail size={16}/></div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Communication</p>
                        </div>
                        <p className="font-black text-sm uppercase text-slate-800 truncate">{verifiedUser.email}</p>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-green-50 border border-green-100 shadow-sm space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600"><ShieldCheck size={16}/></div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-green-600">Access Status</p>
                        </div>
                        <p className="font-black text-sm uppercase text-green-700">AUTHORIZED ACTIVE</p>
                    </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3 ml-2">
                    <AlertTriangle size={18} className="text-red-500" />
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Emergency Protocol Contacts</h4>
                  </div>
                  
                  <div className="p-8 rounded-[2.5rem] bg-white border-2 border-red-50 space-y-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-red-500"><Phone size={100}/></div>
                    <div className="space-y-4 relative z-10">
                        <div className="grid grid-cols-[100px_1fr] items-baseline gap-4">
                            <span className="font-black text-red-900/30 uppercase text-[9px] tracking-widest">Protocol Rep:</span>
                            <span className="font-black text-base text-slate-800 uppercase leading-none">{verifiedUser.emergencyContactName || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] items-baseline gap-4">
                            <span className="font-black text-red-900/30 uppercase text-[9px] tracking-widest">Phone Link:</span>
                            <span className="font-black text-lg text-primary tabular-nums">{verifiedUser.emergencyContactPhone || 'SIGNAL ERROR'}</span>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] items-baseline gap-4">
                            <span className="font-black text-red-900/30 uppercase text-[9px] tracking-widest">Residential:</span>
                            <span className="font-bold text-xs text-slate-500 uppercase leading-relaxed line-clamp-2">{verifiedUser.emergencyContactAddress || 'No registry entry.'}</span>
                        </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex flex-col items-center gap-4">
                   <div className="p-4 bg-white rounded-3xl border-4 border-primary/5 shadow-2xl">
                        <QRCode value={verifiedUser.id} size={80} includeMargin />
                   </div>
                   <div className="text-center">
                        <VisualBarcode value={verifiedUser.id} />
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/40 mt-3">{verifiedUser.id}</p>
                   </div>
                </div>
              </div>

              <div className="p-8 bg-slate-100 border-t border-slate-200">
                <Button onClick={() => setIsModalOpen(false)} className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all">
                    Acknowledge Validation
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LogOutIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
    </svg>
  );
}
