
"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Save,
  Plus,
  Loader2,
  School,
  ShieldCheck,
  XCircle
} from "lucide-react";

import {
  getSettingsAction,
  updateSettingsAction,
} from "@/app/actions/dbActions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { toast } from "sonner";

export default function SystemSettings() {
  const [loading, setLoading] = useState(true);
  const [teacherCode, setTeacherCode] = useState("");
  const [programs, setPrograms] = useState<string[]>([]);
  const [strands, setStrands] = useState<string[]>([]);
  const [newProgram, setNewProgram] = useState("");
  const [newStrand, setNewStrand] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const settings = await getSettingsAction();
      setTeacherCode(settings.teacherSecret || "");
      setPrograms(settings.programs || ['BSCS', 'BSIT', 'BSCpE', 'BSHM', 'BSTM']);
      setStrands(settings.strands || ['STEM', 'ABM', 'HUMSS', 'ICT', 'HE']);
    } catch {
      toast.error("Failed to load settings");
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    try {
      await updateSettingsAction({ 
        teacherSecret: teacherCode,
        programs,
        strands
      });
      toast.success("System configurations deployed");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  const addProgram = () => {
    if (newProgram && !programs.includes(newProgram)) {
      setPrograms([...programs, newProgram]);
      setNewProgram("");
    }
  };

  const addStrand = () => {
    if (newStrand && !strands.includes(newStrand)) {
      setStrands([...strands, newStrand]);
      setNewStrand("");
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <div className="space-y-10 max-w-6xl pb-32 animate-in fade-in duration-500">
      <div>
        <h2 className="text-4xl font-black text-primary uppercase tracking-tighter">System Console</h2>
        <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Core Registry Configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* ACADEMIC OFFERINGS */}
        <Card className="p-10 rounded-[3rem] border-none shadow-2xl space-y-8 bg-white">
          <div className="flex items-center gap-4 text-primary">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center"><School size={24} /></div>
            <h3 className="font-black uppercase tracking-tight text-xl">Academic Programs</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">College Programs</Label>
              <div className="flex gap-2">
                <Input placeholder="New Program Code" value={newProgram} onChange={e => setNewProgram(e.target.value)} className="h-12 rounded-xl" />
                <Button onClick={addProgram} size="icon" className="h-12 w-12 rounded-xl"><Plus size={20} /></Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {programs.map(p => (
                  <Badge key={p} className="h-10 px-4 bg-muted text-foreground font-bold rounded-xl flex items-center gap-2 group">
                    {p}
                    <XCircle size={14} className="cursor-pointer text-muted-foreground hover:text-red-500" onClick={() => setPrograms(programs.filter(x => x !== p))} />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">SHS Strands</Label>
              <div className="flex gap-2">
                <Input placeholder="New Strand Code" value={newStrand} onChange={e => setNewStrand(e.target.value)} className="h-12 rounded-xl" />
                <Button onClick={addStrand} size="icon" className="h-12 w-12 rounded-xl"><Plus size={20} /></Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {strands.map(s => (
                  <Badge key={s} className="h-10 px-4 bg-muted text-foreground font-bold rounded-xl flex items-center gap-2 group">
                    {s}
                    <XCircle size={14} className="cursor-pointer text-muted-foreground hover:text-red-500" onClick={() => setStrands(strands.filter(x => x !== s))} />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* SECURITY & DEPLOY */}
        <Card className="p-10 rounded-[3rem] border-none shadow-2xl space-y-8 bg-primary text-white">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center"><ShieldCheck size={24} /></div>
            <h3 className="font-black uppercase tracking-tight text-xl">Faculty Protocol</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-white/60 ml-1">Instructor Auth Code</Label>
              <Input type="password" value={teacherCode} onChange={e => setTeacherCode(e.target.value)} className="h-16 rounded-2xl bg-white/10 border-none text-white font-black text-xl px-8" />
            </div>
            <Button onClick={saveSettings} className="w-full h-16 bg-white text-primary hover:bg-white/90 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl gap-3">
              <Save size={20} /> Deploy Configuration
            </Button>
          </div>
        </Card>
      </div>

      <div className="p-12 bg-white rounded-[3rem] border-4 border-dashed border-primary/5 text-center flex flex-col items-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center text-primary/40"><Settings size={32} /></div>
          <div>
              <p className="font-black uppercase text-sm text-primary tracking-tight">Infrastructure Management Relocated</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 max-w-sm">Physical management has been moved to the <span className="text-primary underline">Campus Registry</span> for unified control of Rooms, Labs, and Sections.</p>
          </div>
      </div>
    </div>
  );
}
