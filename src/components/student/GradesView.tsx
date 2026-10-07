'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LiveGradeLedger from './LiveGradeLedger';
import GradeSlip from './GradeSlip';
import { BarChart3, GraduationCap, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GradesViewProps {
  onBack: () => void;
}

export default function GradesView({ onBack }: GradesViewProps) {
  return (
    <div className="animate-in fade-in duration-500 pb-20 space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <Button variant="ghost" onClick={onBack} className="mb-2 -ml-2 hover:bg-primary/5 rounded-full p-0 h-auto">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
          <h2 className="text-[2.8rem] font-black text-primary tracking-tighter leading-none uppercase">Academic Records</h2>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-3">Live Ledger & Certified Grade Slips</p>
        </div>
      </div>

      <Tabs defaultValue="ledger" className="w-full">
        <div className="flex justify-start mb-10 px-2">
            <TabsList className="bg-white border-none h-14 p-1.5 rounded-full shadow-lg inline-flex">
                <TabsTrigger 
                    value="ledger" 
                    className="rounded-full font-black uppercase text-[10px] tracking-widest px-10 data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2 h-full"
                >
                    <BarChart3 size={16}/> Live Ledger
                </TabsTrigger>
                <TabsTrigger 
                    value="slip" 
                    className="rounded-full font-black uppercase text-[10px] tracking-widest px-10 data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2 h-full"
                >
                    <GraduationCap size={16}/> Certified Grade Slip
                </TabsTrigger>
            </TabsList>
        </div>

        <TabsContent value="ledger" className="mt-0">
          <LiveGradeLedger />
        </TabsContent>

        <TabsContent value="slip" className="mt-0">
          <GradeSlip />
        </TabsContent>
      </Tabs>
    </div>
  );
}
