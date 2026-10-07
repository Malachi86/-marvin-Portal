'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Lock, CheckCircle2 } from 'lucide-react';
import { updatePasswordAction } from '@/app/actions/authActions';
import { toast } from 'sonner';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');
  
  const [loading, setLoading] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  if (!userId) {
    router.push('/forgot-password');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPass.length < 6) {
      toast.error("Password too short", { description: "Minimum of 6 characters required." });
      return;
    }

    if (newPass !== confirmPass) {
      toast.error("Mismatch detected", { description: "Passwords do not match." });
      return;
    }

    setLoading(true);
    const result = await updatePasswordAction(userId, newPass);

    if (result.success) {
      toast.success("Security Update Success", { description: "Your password has been reset. You may now sign in." });
      router.push('/');
    } else {
      toast.error("Update Failed", { description: result.message });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7F8] p-4">
      <Card className="w-full max-w-md shadow-2xl border-none rounded-[3rem] overflow-hidden bg-white">
        <div className="h-2 bg-primary" />
        <CardHeader className="space-y-4 text-center pt-10">
          <div className="h-16 w-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mx-auto shadow-inner border border-green-100">
            <Lock size={32} />
          </div>
          <CardTitle className="text-3xl font-black text-primary uppercase tracking-tight">Reset Password</CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Step 2: Update Credentials</CardDescription>
        </CardHeader>
        <CardContent className="p-10 pt-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">New Access Key</Label>
              <Input
                type="password"
                placeholder="••••••••"
                required
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                disabled={loading}
                className="h-14 rounded-2xl border-primary/10 font-bold px-6"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm Access Key</Label>
              <Input
                type="password"
                placeholder="••••••••"
                required
                value={confirmPass}
                onChange={e => setConfirmPass(e.target.value)}
                disabled={loading}
                className="h-14 rounded-2xl border-primary/10 font-bold px-6"
              />
            </div>
            <Button type="submit" className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-primary/20 mt-4 gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 size={18} />}
              Update & Finalize
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary"/></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
