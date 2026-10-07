'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { verifyIdentityAction } from '@/app/actions/authActions';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [id, setId] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await verifyIdentityAction(id, email);

    if (result.success) {
      toast.success("Identity Verified!", { description: "You can now reset your password." });
      // Redirect to reset page with verified ID
      router.push(`/reset-password?id=${id}`);
    } else {
      toast.error("Verification Failed", { description: result.message });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7F8] p-4">
      <Card className="w-full max-w-md shadow-2xl border-none rounded-[2.5rem] overflow-hidden bg-white">
        <div className="h-2 bg-[#6D1B0A]" />
        <CardHeader className="space-y-4 text-center pt-10">
          <div className="h-16 w-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mx-auto shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <CardTitle className="text-3xl font-black text-primary uppercase tracking-tight">Verify Identity</CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Step 1: Protocol Authentication</CardDescription>
        </CardHeader>
        <CardContent className="p-10 pt-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Universal ID (USN/EMP)</Label>
              <Input
                type="text"
                placeholder="ID Number"
                required
                value={id}
                onChange={e => setId(e.target.value)}
                disabled={loading}
                className="h-14 rounded-2xl border-primary/10 font-bold px-6"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Registered Email</Label>
              <Input
                type="email"
                placeholder="email@school.edu"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                className="h-14 rounded-2xl border-primary/10 font-bold px-6"
              />
            </div>
            <Button type="submit" className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-primary/20 mt-4" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify and Continue"}
            </Button>
          </form>
          <div className="mt-8 text-center">
            <Button variant="ghost" asChild className="h-12 rounded-xl font-black uppercase text-[10px] tracking-widest">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Login
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
