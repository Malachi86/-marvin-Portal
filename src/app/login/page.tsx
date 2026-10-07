"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { CalendarDays, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Mock Login Logic
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Hardcoded Admin
      if (formData.email === 'admin' && formData.password === 'ADMIN@2026') {
        const adminUser = { uid: 'admin-1', email: 'admin', role: 'admin' };
        localStorage.setItem('currentUser', JSON.stringify(adminUser));
        toast({ title: "Welcome Admin!" });
        router.push("/dashboard");
        setLoading(false);
        return;
      }

      const found = users.find((u: any) => u.email === formData.email && u.password === formData.password);

      if (found) {
        localStorage.setItem('currentUser', JSON.stringify(found));
        toast({ title: "Welcome back!", description: "Successfully logged in." });
        router.push("/dashboard");
      } else {
        toast({ variant: "destructive", title: "Login Failed", description: "Invalid email or password." });
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent/30 p-4">
      <Card className="w-full max-w-md shadow-xl border-primary/10">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-2 rounded-xl">
              <CalendarDays className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Login</CardTitle>
          <CardDescription>Enter your email and password to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="text" placeholder="email@school.edu or 'admin'" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 mt-4 text-white font-bold" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
