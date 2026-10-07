'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
    CreditCard, 
    Send, 
    CheckCircle2, 
    Clock, 
    Loader2, 
    Info, 
    Smartphone,
    ArrowLeft,
    ShieldCheck,
    Lock,
    AlertTriangle,
    Upload,
    X,
    Eye
} from 'lucide-react';
import { getSSCPaymentsAction, addSSCPaymentAction, getSettingsAction } from '@/app/actions/dbActions';
import { SSCPayment } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { compressImage } from '@/lib/compression';

const SSCIcon = ({ className, size = 48 }: { className?: string, size?: number }) => (
  <img 
    src="/SSC.png" 
    alt="SSC" 
    style={{ width: size, height: size }}
    className={cn("object-contain shrink-0", className)} 
  />
);

interface SSCMembershipProps {
    onBack: () => void;
}

export default function SSCMembership({ onBack }: SSCMembershipProps) {
    const { user } = useAuth();
    const [payments, setPayments] = useState<SSCPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSaving] = useState(false);
    const [membershipFee, setMembershipFee] = useState(150);
    const [gcashNumber, setGcashNumber] = useState('');
    const [gcashName, setGcashName] = useState('');
    const [gcashQr, setGcashQr] = useState('');
    
    const [reference, setReference] = useState('');
    const [receiptPic, setReceiptPic] = useState('');
    const receiptInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) loadData();
    }, [user]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [payData, settings] = await Promise.all([
                getSSCPaymentsAction(),
                getSettingsAction()
            ]);
            setPayments(payData.filter(p => p.studentId === user?.id));
            setMembershipFee(settings.sscMembershipFee || 150);
            setGcashNumber(settings.sscGcashNumber || '09XXXXXXXXX');
            setGcashName(settings.sscGcashName || '');
            setGcashQr(settings.sscGcashQr || '');
        } catch (e) {
            toast.error("Failed to load treasury data.");
        } finally {
            setLoading(false);
        }
    };

    const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            const compressed = await compressImage(base64, 1000, 1000, 0.5); // Aggressive compression for receipts
            setReceiptPic(compressed);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !reference) {
            toast.error("Please provide the GCash reference number.");
            return;
        }

        setIsSaving(true);
        try {
            await addSSCPaymentAction({
                studentId: user.id,
                studentName: user.name,
                referenceNumber: reference,
                receiptPic: receiptPic, 
                amount: membershipFee,
                status: 'pending',
                timestamp: new Date().toISOString()
            });
            toast.success("Payment submitted for validation!");
            setReference('');
            setReceiptPic('');
            loadData();
        } catch (e) {
            toast.error("Submission failed.");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;

    const activePayment = payments.find(p => p.status === 'approved') || payments[0]; 

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500 pb-24">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={onBack} size="icon" className="rounded-full hover:bg-primary/5 h-12 w-12">
                    <ArrowLeft size={24} className="text-primary" />
                </Button>
                <div>
                    <h2 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none">SSC Membership</h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-2">Treasury & Organization Protocol</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                
                <div className="lg:col-span-7">
                    {activePayment && activePayment.status === 'approved' ? (
                        <Card className="rounded-[3rem] border-none shadow-3xl bg-white overflow-hidden">
                            <div className="bg-green-600 p-12 text-white text-center space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full bg-black/5 pointer-events-none" />
                                
                                <div className="h-40 w-40 rounded-full bg-white p-6 flex items-center justify-center mx-auto shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-8 border-white/20 relative z-10 transition-transform hover:scale-105 duration-500">
                                    <SSCIcon size={100} />
                                </div>
                                
                                <div className="space-y-2 relative z-10">
                                    <h3 className="text-4xl font-black uppercase tracking-tighter drop-shadow-md">MEMBERSHIP VALIDATED</h3>
                                    <p className="text-xs font-bold opacity-80 uppercase tracking-[0.3em]">SSC PROTOCOL: FULL ACCESS GRANTED</p>
                                </div>
                            </div>
                            <CardContent className="p-12 space-y-10">
                                <div className="p-10 bg-green-50/50 rounded-[2.5rem] border-2 border-green-100 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-inner">
                                    <div className="text-center sm:text-left">
                                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Reference Identifier</p>
                                        <p className="text-2xl font-black text-green-900 tracking-tight">{activePayment.referenceNumber}</p>
                                    </div>
                                    <div className="h-12 w-px bg-green-200 hidden sm:block" />
                                    <div className="text-center sm:text-right">
                                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Validation Time</p>
                                        <p className="text-xl font-black text-green-900">{format(new Date(activePayment.timestamp), "MMM dd, yyyy")}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-center max-w-md leading-relaxed">
                                        You are now eligible to enroll in academic terms and join official student organization activities.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden">
                            <div className="h-2 bg-primary" />
                            <CardContent className="p-10 md:p-16 space-y-10">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                                        <Smartphone size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase tracking-tighter">GCASH PAYMENT PORTAL</h3>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Scan Official QR or pay to the number below</p>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-10 items-start">
                                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center text-center space-y-6">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">OFFICIAL TREASURY QR</p>
                                        
                                        <div className="bg-white p-4 rounded-3xl shadow-xl w-full max-w-[320px] aspect-square flex items-center justify-center relative overflow-hidden group mx-auto border-4 border-slate-100">
                                            {gcashQr ? (
                                                <img src={gcashQr} alt="Official GCash QR" className="w-full h-full object-contain" />
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    <QRCode value={gcashNumber} size={280} includeMargin />
                                                    <p className="text-[8px] font-black uppercase text-muted-foreground opacity-40 mt-2">Auto-Generated Fallback</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <p className="font-black text-blue-600 text-xl tracking-[0.1em] uppercase">{gcashName || 'NOT CONFIGURED'}</p>
                                            <p className="font-black text-3xl text-primary tracking-tight">{gcashNumber}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">AMA LIPA SSC TREASURY</p>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <Badge className="bg-primary text-white h-6 w-6 rounded-lg p-0 flex items-center justify-center font-black text-[10px]">1</Badge>
                                                <p className="text-sm font-bold text-slate-700">Pay exactly <span className="font-black text-primary">₱{membershipFee.toFixed(2)}</span></p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge className="bg-primary text-white h-6 w-6 rounded-lg p-0 flex items-center justify-center font-black text-[10px]">2</Badge>
                                                <p className="text-sm font-bold text-slate-700">Take a screenshot of receipt</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge className="bg-primary text-white h-6 w-6 rounded-lg p-0 flex items-center justify-center font-black text-[10px]">3</Badge>
                                                <p className="text-sm font-bold text-slate-700">Submit Ref No. and Receipt</p>
                                            </div>
                                        </div>

                                        {activePayment?.status === 'pending' ? (
                                            <div className="p-8 bg-amber-50 rounded-[2rem] border-2 border-amber-100 flex flex-col items-center text-center gap-4 animate-pulse">
                                                <Clock className="text-amber-600 h-10 w-10" />
                                                <div>
                                                    <p className="font-black text-amber-900 uppercase text-xs">Validation Pending</p>
                                                    <p className="text-[9px] font-bold text-amber-700/60 uppercase tracking-widest mt-1">Ref: {activePayment.referenceNumber}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleSubmit} className="space-y-6">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Reference Number</Label>
                                                    <Input 
                                                        value={reference} 
                                                        onChange={e => setReference(e.target.value)} 
                                                        placeholder="GCash Ref #" 
                                                        className="h-14 rounded-2xl border-primary/10 font-bold"
                                                    />
                                                </div>

                                                <div className="space-y-2 hidden">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Receipt Screenshot (Optional but recommended)</Label>
                                                    <button 
                                                        type="button"
                                                        onClick={() => receiptInputRef.current?.click()}
                                                        className={cn(
                                                            "w-full h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all overflow-hidden",
                                                            receiptPic ? "border-green-500 bg-green-50" : "border-slate-200 bg-slate-50 hover:border-primary/40"
                                                        )}
                                                    >
                                                        {receiptPic ? (
                                                            <div className="flex flex-col items-center">
                                                                <CheckCircle2 className="text-green-600 h-8 w-8" />
                                                                <span className="text-[9px] font-black uppercase text-green-700">Receipt Compressed</span>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <Upload className="text-slate-400 h-8 w-8" />
                                                                <span className="text-[9px] font-black uppercase text-slate-500">Upload Receipt</span>
                                                            </>
                                                        )}
                                                    </button>
                                                    <input ref={receiptInputRef} type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" />
                                                </div>

                                                <Button 
                                                    type="submit" 
                                                    disabled={isSubmitting || !reference}
                                                    className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-primary/20 gap-3"
                                                >
                                                    {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Send size={18} />}
                                                    COMMIT PAYMENT
                                                </Button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="lg:col-span-5 space-y-10">
                    <div className="p-10 bg-primary rounded-[3rem] text-white space-y-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 group-hover:rotate-0 transition-transform">
                            <ShieldCheck size={150} />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10"><Info size={24} /></div>
                                <h4 className="text-xl font-black uppercase tracking-tight">Organization Rules</h4>
                            </div>
                            <p className="text-sm font-medium leading-relaxed opacity-80">
                                Ang SSC Membership ay required bawat trimester. Ito ay nagsisilbing pundasyon para sa ating mga student services, events, at campus initiatives. 
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center shadow-lg"><CreditCard size={16} className="text-green-600" /></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">LIFECYCLE: PER TRIMESTER</span>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center shadow-lg"><Lock size={16} className="text-amber-600" /></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">BLOCKS TERM ENROLLMENT</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-xl font-black uppercase tracking-widest text-muted-foreground ml-2">PAYMENT HISTORY</h2>
                        <div className="space-y-4">
                            {payments.length === 0 ? (
                                <div className="p-12 text-center border-4 border-dashed rounded-[3rem] border-black/5 bg-white/20">
                                    <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em]">No transactions recorded</p>
                                </div>
                            ) : (
                                payments.map(pay => (
                                    <Card key={pay.id} className="rounded-[2rem] border-none shadow-lg bg-white group hover:shadow-xl transition-all">
                                        <div className="p-6 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                                    <CreditCard size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-xs uppercase text-slate-800">₱{(pay.amount || membershipFee).toFixed(2)}</p>
                                                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{format(new Date(pay.timestamp), "MMM dd, yyyy")}</p>
                                                </div>
                                            </div>
                                            <Badge className={cn(
                                                "px-3 py-1 rounded-full font-black text-[8px] uppercase tracking-widest border shadow-none",
                                                pay.status === 'approved' ? "bg-green-100 text-green-800" :
                                                pay.status === 'pending' ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                                            )}>
                                                {pay.status}
                                            </Badge>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
