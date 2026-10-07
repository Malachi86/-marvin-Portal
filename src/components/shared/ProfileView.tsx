'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Save, Loader2, QrCode, User as UserIcon, Mail, ShieldCheck, Barcode, ArrowLeft, RotateCw, AlertTriangle, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { updateUserAction } from '@/app/actions/dbActions';
import { compressImage } from '@/lib/compression';
import { motion } from 'framer-motion';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { Department } from '@/utils/storage';

export default function ProfileView({ onBack }: { onBack?: () => void }) {
  const { user, updateCurrentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'college' as Department,
    program: '',
    strand: '',
    year: 1,
    position: '',
    profilePic: '',
    emergencyContactName: '',
    emergencyContactAddress: '',
    emergencyContactPhone: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        department: (user.department as Department) || 'college',
        program: user.program || '',
        strand: user.strand || '',
        year: user.year || 1,
        position: user.position || '',
        profilePic: user.profilePic || '',
        emergencyContactName: user.emergencyContactName || '',
        emergencyContactAddress: user.emergencyContactAddress || '',
        emergencyContactPhone: user.emergencyContactPhone || ''
      });
    }
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const compressed = await compressImage(base64);
      setFormData({ ...formData, profilePic: compressed });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const updates: any = {
        name: formData.name,
        email: formData.email,
        department: formData.department,
        profilePic: formData.profilePic
      };
      
      if (user.role === 'student') {
        updates.program = formData.program;
        updates.strand = formData.strand;
        updates.year = formData.year;
        updates.emergencyContactName = formData.emergencyContactName;
        updates.emergencyContactAddress = formData.emergencyContactAddress;
        updates.emergencyContactPhone = formData.emergencyContactPhone;
      } else {
        updates.position = formData.position;
      }

      await updateUserAction(user.id, updates);
      updateCurrentUser(updates);
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" onClick={onBack} size="icon" className="h-12 w-12 rounded-full p-0 flex items-center justify-center hover:bg-primary/5 shrink-0">
              <ArrowLeft className="h-6 w-6 text-primary" />
            </Button>
          )}
          <div>
            <h2 className="text-3xl font-black text-primary tracking-tighter uppercase leading-none">Account Profile</h2>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-2">Personal Identity Control</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* 3D Flip ID Section */}
        <div className="lg:col-span-5 flex flex-col items-center space-y-8">
            <div className="perspective-1000 w-full max-w-[360px] aspect-[1/1.58]">
                <motion.div 
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                    className="relative w-full h-full preserve-3d"
                >
                    {/* Front of ID */}
                    <div className="absolute inset-0 backface-hidden bg-white rounded-[2rem] shadow-2xl border-4 border-primary/10 overflow-hidden flex flex-col">
                        <div className="bg-primary h-24 p-6 flex items-center justify-between">
                            <img src="/logo.png" alt="Logo" className="h-8 w-auto brightness-0 invert" />
                            <div className="text-right">
                                <p className="text-[7px] font-black text-white/60 uppercase tracking-widest leading-none">Institute Protocol</p>
                                <p className="text-[10px] font-black text-white uppercase tracking-tighter mt-0.5">LIPA CAMPUS</p>
                            </div>
                        </div>
                        <div className="flex-1 p-8 flex flex-col items-center space-y-6 text-center">
                            <div className="w-32 h-32 rounded-[2rem] bg-primary/5 border-4 border-primary/10 flex items-center justify-center overflow-hidden shadow-xl">
                                {formData.profilePic ? (
                                    <img src={formData.profilePic} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon size={64} className="text-primary/20" />
                                )}
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-black text-primary uppercase tracking-tight leading-none">{formData.name || 'FULL NAME'}</h3>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">{user.role}</p>
                            </div>
                            <div className="w-full grid grid-cols-2 gap-4 text-left border-t border-primary/5 pt-6">
                                <div>
                                    <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest">Universal ID</p>
                                    <p className="text-xs font-black text-slate-800">{user.id}</p>
                                </div>
                                <div>
                                    <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest">Term Entry</p>
                                    <p className="text-xs font-black text-slate-800">Verified</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 pt-0 flex justify-center">
                           <div className="flex items-center gap-2 px-4 py-1.5 bg-green-50 rounded-full border border-green-100">
                               <ShieldCheck size={10} className="text-green-600" />
                               <span className="text-[8px] font-black text-green-700 uppercase tracking-widest">Certified Digital Key</span>
                           </div>
                        </div>
                    </div>

                    {/* Back of ID - Emergency Protocol Contacts */}
                    <div className="absolute inset-0 backface-hidden bg-white rounded-[2rem] shadow-2xl border-4 border-primary/10 overflow-hidden flex flex-col rotate-y-180">
                        <div className="bg-[#14343A] h-20 p-6 flex items-center justify-center">
                            <p className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Emergency Contacts</p>
                        </div>
                        <div className="flex-1 p-8 flex flex-col justify-between">
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0 shadow-inner">
                                        <AlertTriangle size={18} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Primary Protocol Contact</p>
                                        <p className="text-sm font-black text-slate-800 uppercase leading-none">{formData.emergencyContactName || 'N/A'}</p>
                                        <p className="text-[11px] font-black text-primary mt-2">{formData.emergencyContactPhone || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 shadow-inner">
                                        <MapPin size={18} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Residential Registry</p>
                                        <p className="text-[10px] font-bold text-slate-600 uppercase leading-relaxed line-clamp-3">
                                            {formData.emergencyContactAddress || 'No permanent address recorded in database.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-6 border-t border-slate-100 flex flex-col items-center">
                                <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-primary/5">
                                    <QRCode value={user.id} size={70} includeMargin />
                                </div>
                                <div className="mt-4 flex flex-col items-center gap-1">
                                    <Barcode size={32} className="text-slate-200" />
                                    <p className="text-[6px] font-black text-slate-300 uppercase tracking-[0.3em]">{user.id}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-primary h-3" />
                    </div>
                </motion.div>
            </div>
            
            <Button onClick={() => setIsFlipped(!isFlipped)} className="h-14 px-10 rounded-2xl bg-white text-primary border-2 border-primary/10 hover:bg-primary/5 font-black uppercase text-[10px] tracking-widest gap-3 shadow-xl">
                <RotateCw size={18} /> Flip Identity Card
            </Button>
        </div>

        {/* Form Section */}
        <div className="lg:col-span-7 space-y-8">
            <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden">
                <CardContent className="p-10 md:p-16 space-y-10">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-[1.5rem] bg-primary/5 flex items-center justify-center text-4xl text-primary font-black shadow-inner overflow-hidden border-2 border-primary/5">
                                {formData.profilePic ? <img src={formData.profilePic} className="w-full h-full object-cover" /> : user.name.charAt(0)}
                            </div>
                            <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg border-2 border-white"><Camera size={14}/></button>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </div>
                        <div>
                            <h4 className="text-2xl font-black uppercase tracking-tight text-slate-800">{formData.name}</h4>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Modify Authentication Profile</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</Label>
                            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-14 rounded-2xl border-slate-100 font-bold px-6" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Email</Label>
                            <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="h-14 rounded-2xl border-slate-100 font-bold px-6" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Department</Label>
                            <Select value={formData.department} onValueChange={(v: Department) => setFormData({...formData, department: v})}>
                                <SelectTrigger className="h-14 rounded-2xl font-bold"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    <SelectItem value="college" className="font-bold">College</SelectItem>
                                    <SelectItem value="shs" className="font-bold">Senior High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {user.role === 'student' && formData.department === 'shs' && (
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">SHS Strand</Label>
                                <Select value={formData.strand} onValueChange={(v: any) => setFormData({...formData, strand: v})}>
                                    <SelectTrigger className="h-14 rounded-2xl font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        {['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL-ICT', 'HE'].map(s => <SelectItem key={s} value={s} className="font-bold">{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {user.role === 'student' && (
                             <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">{formData.department === 'shs' ? 'Grade Level' : 'Year Level'}</Label>
                                <Select value={String(formData.year)} onValueChange={v => setFormData({...formData, year: parseInt(v)})}>
                                    <SelectTrigger className="h-14 rounded-2xl font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        {formData.department === 'shs' ? [11, 12].map(y => <SelectItem key={y} value={String(y)} className="font-bold">Grade {y}</SelectItem>) : [1, 2, 3, 4].map(y => <SelectItem key={y} value={String(y)} className="font-bold">Year {y}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                             </div>
                        )}
                    </div>

                    {user.role === 'student' && (
                         <div className="pt-10 border-t border-slate-100 space-y-8">
                             <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 shadow-sm"><AlertTriangle size={16}/></div>
                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-800">Emergency Protocol Contacts</h4>
                             </div>
                             <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-2"><Label className="text-[9px] font-black text-slate-400 uppercase">Contact Name</Label><Input value={formData.emergencyContactName} onChange={e => setFormData({...formData, emergencyContactName: e.target.value})} className="h-12 rounded-xl" /></div>
                                <div className="space-y-2"><Label className="text-[9px] font-black text-slate-400 uppercase">Contact Phone</Label><Input value={formData.emergencyContactPhone} onChange={e => setFormData({...formData, emergencyContactPhone: e.target.value})} className="h-12 rounded-xl" /></div>
                                <div className="md:col-span-2 space-y-2"><Label className="text-[9px] font-black text-slate-400 uppercase">Home Address</Label><Input value={formData.emergencyContactAddress} onChange={e => setFormData({...formData, emergencyContactAddress: e.target.value})} className="h-12 rounded-xl" /></div>
                             </div>
                         </div>
                    )}

                    <div className="flex justify-end pt-8">
                        <Button onClick={handleSave} disabled={loading} className="h-16 px-12 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-primary/20 gap-3 transition-all active:scale-95">
                            {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />} Save All Changes
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
