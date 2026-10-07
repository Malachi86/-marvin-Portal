'use client';

import React, { useState, useEffect } from 'react';
import { 
    Scan, 
    User as UserIcon, 
    Book, 
    CheckCircle, 
    RotateCcw, 
    QrCode, 
    Calendar, 
    Loader2, 
    Smartphone, 
    ArrowRight,
    ShieldCheck,
    ChevronRight,
    AlertCircle,
    Barcode
} from 'lucide-react';
import { Book as BookType, User as UserType, LibraryBorrowing } from '@/utils/storage';
import { 
    getBooksAction, 
    getUsersAction, 
    updateBookAction, 
    addLibraryBorrowingAction, 
    updateLibraryBorrowingAction, 
    getLibraryBorrowingsAction 
} from '@/app/actions/dbActions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import BarcodeScanner from './BarcodeScanner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ScanLend() {
  const [bookBarcode, setBookBarcode] = useState('');
  const [bookInfo, setBookInfo] = useState<BookType | null>(null);
  const [userUSN, setUserUSN] = useState('');
  const [userInfo, setUserInfo] = useState<UserType | null>(null);
  const [daysUntilDue, setDaysUntilDue] = useState('7');
  const [step, setStep] = useState<'scan' | 'user' | 'confirm'>('scan');
  const [mode, setMode] = useState<'lend' | 'return'>('lend');
  const [showScanner, setShowScanner] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleScanResult = (result: string) => {
    setShowScanner(false);
    if (step === 'scan') {
      setBookBarcode(result);
      scanBook(result);
    } else if (step === 'user') {
      setUserUSN(result);
      findUser(result);
    }
  }

  const scanBook = async (barcode: string) => {
    if (!barcode.trim()) {
      toast.error('Barcode identity required');
      return;
    }

    setProcessing(true);
    try {
      const books = await getBooksAction();
      const book = books.find((b: any) => b.barcode === barcode);

      if (!book) {
        toast.error('Asset not found in Registry');
        setProcessing(false);
        return;
      }

      if (mode === 'lend' && book.status === 'borrowed') {
        toast.warning('Asset Protocol Locked', { description: `Currently held by student ${book.borrowerId}` });
        setProcessing(false);
        return;
      }

      if (mode === 'return' && book.status !== 'borrowed') {
        toast.warning('Logic Conflict', { description: "Item is already marked as in-stock." });
        setProcessing(false);
        return;
      }

      setBookInfo(book);
      toast.success("Asset Verified: " + book.title.toUpperCase());
      
      if (mode === 'return') {
        const users = await getUsersAction();
        const borrowerInfo = users.find(u => u.id === book.borrowerId);
        if (borrowerInfo) {
          setUserInfo(borrowerInfo);
          setStep('confirm');
        } else {
          setStep('user');
        }
      } else {
        setStep('user');
      }
    } catch (e) {
      toast.error("Registry lookup failure");
    } finally {
      setProcessing(false);
    }
  };

  const findUser = async (usn: string) => {
    if (!usn.trim()) {
      toast.error('Identity signature required');
      return;
    }
    
    setProcessing(true);
    try {
        const users = await getUsersAction();
        const user = users.find((u: any) => u.id === usn.trim());

        if (!user) {
            toast.error('Identity not found');
            setProcessing(false);
            return;
        }

        setUserInfo(user);
        setStep('confirm');
        toast.success("Identity Verified: " + user.name.toUpperCase());
    } catch(e) {
        toast.error("Validation system failure");
    } finally {
        setProcessing(false);
    }
  };
  
  const confirmLending = async () => {
    if (!bookInfo || !userInfo) return;
    setProcessing(true);

    try {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + parseInt(daysUntilDue || '7'));

        await updateBookAction(bookInfo.id, {
            status: 'borrowed',
            borrowerId: userInfo.id,
            borrowedAt: new Date().toISOString(),
            dueDate: dueDate.toISOString(),
        });
        
        await addLibraryBorrowingAction({
            bookId: bookInfo.id,
            studentId: userInfo.id,
            borrowDate: new Date().toISOString(),
            dueDate: dueDate.toISOString(),
            status: 'borrowed'
        });

        toast.success(`Transaction Finalized!`, { description: `Asset assigned to ${userInfo.name}.` });
        reset();
    } catch(e) {
        toast.error("Transaction commit failed");
    } finally {
        setProcessing(false);
    }
  };

  const handleReturn = async () => {
    if (!bookInfo) return;
    setProcessing(true);

    try {
      await updateBookAction(bookInfo.id, {
        status: 'available',
        borrowerId: undefined,
        borrowedAt: undefined,
        dueDate: undefined,
      });

      const borrowings = await getLibraryBorrowingsAction();
      const record = borrowings.slice().reverse().find(
        (r: LibraryBorrowing) => r.bookId === bookInfo.id && !r.returnDate
      );
      
      if (record) {
        await updateLibraryBorrowingAction(record.id, {
            returnDate: new Date().toISOString(),
            status: 'returned'
        });
      }
      
      toast.success(`Asset Returned: ${bookInfo.title.toUpperCase()}`);
      reset();
    } catch(e) {
      toast.error("Return protocol failed");
    } finally {
        setProcessing(false);
    }
  };

  const reset = () => {
    setBookBarcode('');
    setBookInfo(null);
    setUserUSN('');
    setUserInfo(null);
    setDaysUntilDue('7');
    setStep('scan');
    setShowScanner(false);
    setProcessing(false);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div>
          <h2 className="text-[3rem] font-black text-primary tracking-tighter uppercase leading-none">Transaction Hub</h2>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-3">Asset Lending & Return Terminal</p>
        </div>
        <div className="flex gap-2 p-1.5 bg-white rounded-2xl shadow-xl border border-primary/5">
          <button 
            onClick={() => { setMode('lend'); reset(); }} 
            className={cn(
                "h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all",
                mode === 'lend' ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-slate-50"
            )}
          >
            Lend Protocol
          </button>
          <button 
            onClick={() => { setMode('return'); reset(); }} 
            className={cn(
                "h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all",
                mode === 'return' ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-slate-50"
            )}
          >
            Return Protocol
          </button>
        </div>
      </div>

      {showScanner && <BarcodeScanner onScan={handleScanResult} onCancel={() => setShowScanner(false)} />}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Step Indicator Sidebar */}
        <div className="lg:col-span-3 space-y-4">
            {[
                { id: 'scan', label: 'ASSET CAPTURE', active: step === 'scan', done: !!bookInfo },
                { id: 'user', label: 'IDENTITY LINK', active: step === 'user', done: !!userInfo },
                { id: 'confirm', label: 'VALIDATION', active: step === 'confirm', done: false }
            ].map((s, i) => (
                <div key={s.id} className={cn(
                    "p-6 rounded-[2rem] border-2 transition-all flex items-center gap-4",
                    s.active ? "bg-primary border-primary text-white shadow-xl scale-[1.05]" : 
                    s.done ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                    "bg-white border-slate-100 text-slate-300 opacity-50"
                )}>
                    <div className={cn(
                        "h-8 w-8 rounded-xl flex items-center justify-center font-black text-xs shadow-inner",
                        s.active ? "bg-white/20" : "bg-slate-50"
                    )}>{i + 1}</div>
                    <span className="font-black uppercase text-[9px] tracking-widest">{s.label}</span>
                </div>
            ))}
        </div>

        {/* Main Terminal Area */}
        <Card className="lg:col-span-9 rounded-[3rem] border-none shadow-3xl bg-white overflow-hidden flex flex-col">
            <div className="h-2 bg-primary" />
            <CardContent className="p-10 md:p-16 flex-1 flex flex-col justify-center">
                
                {processing ? (
                    <div className="h-64 flex flex-col items-center justify-center space-y-6">
                        <Loader2 className="animate-spin text-primary h-16 w-16" strokeWidth={3}/>
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Synchronizing Records...</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {step === 'scan' && (
                            <div className="space-y-10 animate-in zoom-in-95 duration-500">
                                <div className="text-center space-y-4">
                                    <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center text-primary mx-auto shadow-inner"><Barcode size={32}/></div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight text-slate-800">Identify Asset</h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">SCAN BOOK BARCODE TO INITIALIZE</p>
                                </div>
                                <div className="flex gap-4 max-w-md mx-auto">
                                    <Input 
                                        value={bookBarcode} 
                                        onChange={e => setBookBarcode(e.target.value)} 
                                        onKeyPress={e => e.key === 'Enter' && scanBook(bookBarcode)}
                                        className="h-16 rounded-2xl border-2 border-primary/5 bg-slate-50 font-black text-xl px-8 focus:bg-white transition-all text-center tracking-widest"
                                        placeholder="0000000000"
                                    />
                                    <Button onClick={() => setShowScanner(true)} className="h-16 w-16 rounded-2xl bg-primary shadow-xl"><Scan size={28}/></Button>
                                </div>
                            </div>
                        )}

                        {step === 'user' && (
                            <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                                <div className="text-center space-y-4">
                                    <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center text-primary mx-auto shadow-inner"><QrCode size={32}/></div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight text-slate-800">Verify Identity</h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">SCAN STUDENT DIGITAL ID SIGNATURE</p>
                                </div>
                                <div className="flex gap-4 max-w-md mx-auto">
                                    <Input 
                                        value={userUSN} 
                                        onChange={e => setUserUSN(e.target.value)} 
                                        onKeyPress={e => e.key === 'Enter' && findUser(userUSN)}
                                        className="h-16 rounded-2xl border-2 border-primary/5 bg-slate-50 font-black text-xl px-8 focus:bg-white transition-all text-center tracking-widest"
                                        placeholder="250011XXXXX"
                                    />
                                    <Button onClick={() => setShowScanner(true)} className="h-16 w-16 rounded-2xl bg-primary shadow-xl"><Scan size={28}/></Button>
                                </div>
                            </div>
                        )}

                        {step === 'confirm' && bookInfo && userInfo && (
                            <div className="space-y-10 animate-in zoom-in-95 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Asset Details */}
                                    <div className="p-8 rounded-[2.5rem] bg-slate-50 border-2 border-slate-100 space-y-6">
                                        <Badge className="bg-primary/10 text-primary border-none font-black text-[8px]">SELECTED ASSET</Badge>
                                        <div className="space-y-2">
                                            <h4 className="text-xl font-black uppercase text-slate-800 leading-tight">{bookInfo.title}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{bookInfo.author}</p>
                                        </div>
                                        <div className="pt-4 border-t border-slate-200 flex items-center gap-3">
                                            <Barcode size={14} className="text-primary/40"/>
                                            <span className="text-[10px] font-black tabular-nums">{bookInfo.barcode}</span>
                                        </div>
                                    </div>

                                    {/* User Details */}
                                    <div className="p-8 rounded-[2.5rem] bg-primary text-white space-y-6 shadow-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 group-hover:rotate-0 transition-transform"><Smartphone size={100}/></div>
                                        <Badge className="bg-white/20 text-white border-none font-black text-[8px]">RECIPIENT IDENTITY</Badge>
                                        <div className="flex items-center gap-4 relative z-10">
                                            <Avatar className="h-12 w-10 rounded-xl border-2 border-white/20">
                                                <AvatarImage src={userInfo.profilePic}/>
                                                <AvatarFallback className="bg-white/10 text-white font-black text-xs">{userInfo.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="overflow-hidden">
                                                <h4 className="font-black uppercase truncate text-sm leading-none">{userInfo.name}</h4>
                                                <p className="text-[9px] font-bold opacity-60 mt-1">{userInfo.id}</p>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-white/10 flex items-center gap-2 relative z-10">
                                            <ShieldCheck size={14} className="text-white/60"/>
                                            <span className="text-[9px] font-black uppercase tracking-widest">Identity Verified</span>
                                        </div>
                                    </div>
                                </div>

                                {mode === 'lend' ? (
                                    <div className="max-w-md mx-auto space-y-6">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">SET LOAN DURATION (DAYS)</Label>
                                            <div className="relative">
                                                <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" size={24}/>
                                                <Input 
                                                    type="number" 
                                                    value={daysUntilDue} 
                                                    onChange={e => setDaysUntilDue(e.target.value)} 
                                                    className="h-20 pl-16 rounded-[1.5rem] border-4 border-primary/10 bg-slate-50 font-black text-3xl text-center"
                                                />
                                            </div>
                                        </div>
                                        <Button onClick={confirmLending} className="w-full h-20 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase text-sm tracking-[0.2em] shadow-[0_30px_60px_-15px_rgba(109,27,10,0.4)] gap-3 active:scale-95 transition-all">
                                            <CheckCircle size={24} /> AUTHORIZE TRANSACTION
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="max-w-md mx-auto">
                                        <Button onClick={handleReturn} className="w-full h-20 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-sm tracking-[0.2em] shadow-[0_30px_60px_-15px_rgba(5,150,105,0.4)] gap-3 active:scale-95 transition-all">
                                            <RotateCcw size={24} /> CONFIRM RETURN RECEIPT
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <Button onClick={reset} variant="ghost" className="h-12 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 text-slate-400 hover:text-primary transition-all">
                    <RotateCcw size={14}/> ABORT & RESET
                </Button>
                <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secure Protocol Active</span>
                </div>
            </div>
        </Card>
      </div>

      <div className="p-10 bg-primary/5 rounded-[3rem] border-2 border-dashed border-primary/10 text-center flex flex-col items-center gap-4">
          <AlertCircle className="text-primary/40 h-10 w-10" />
          <div>
              <p className="font-black uppercase text-xs text-slate-800 tracking-tight">Audit Trail Active</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 max-w-lg">Every scan event is recorded with your librarian identity signature for institutional accountability.</p>
          </div>
      </div>
    </div>
  );
}
