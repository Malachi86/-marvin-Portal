
'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, Download, Loader2, ShieldCheck, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { 
    getAttendancesAction, getSubjectsAction, getUsersAction, 
    getEnrollmentsAction, getClassworksAction, getSubmissionsAction 
} from '@/app/actions/dbActions';

export default function DepEdExport({ subjectId }: { subjectId: string }) {
    const [loading, setLoading] = useState(false);

    const exportSF2 = async () => {
        setLoading(true);
        try {
            const [atts, subjects, users, enrollments] = await Promise.all([
                getAttendancesAction(), getSubjectsAction(), getUsersAction(), getEnrollmentsAction()
            ]);
            
            const subject = subjects.find(s => s.id === subjectId);
            const myEnrolledIds = enrollments.filter(e => e.subjectId === subjectId && e.status === 'approved').map(e => e.studentId);
            const myStudents = users.filter(u => myEnrolledIds.includes(u.id));
            const myAtts = atts.filter(a => a.subjectId === subjectId);

            const headers = ['NAME', 'SEX', 'USN', 'DATES...'];
            const data = myStudents.map(s => {
                const row: any = { 'NAME': s.name, 'SEX': 'M/F', 'USN': s.id };
                // Add dummy dates for SF2 format
                for(let i=1; i<=20; i++) row[`Day ${i}`] = myAtts.some(a => a.studentId === s.id && new Date(a.date).getDate() === i) ? 'P' : 'A';
                return row;
            });

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "SF2-Report");
            XLSX.writeFile(wb, `SF2_${subject?.name}_${new Date().getMonth()}.xlsx`);
            toast.success("SF2 Compatible Form Generated.");
        } catch (e) {
            toast.error("Export failure.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden">
            <div className="bg-primary/5 p-8 flex items-center justify-between border-b border-primary/5">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><FileSpreadsheet size={20}/></div>
                    <div>
                        <h4 className="font-black uppercase tracking-tight text-slate-800">DepEd school forms</h4>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Protocol SF2 & SF5 Automation</p>
                    </div>
                </div>
            </div>
            <CardContent className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button onClick={exportSF2} disabled={loading} variant="outline" className="h-16 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-3 border-2 border-primary/10 hover:bg-primary hover:text-white transition-all">
                    {loading ? <Loader2 className="animate-spin" /> : <ClipboardList size={18} />} Export SF2 (Attendance)
                </Button>
                <Button disabled variant="outline" className="h-16 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-3 border-2 border-primary/10 opacity-50 cursor-not-allowed">
                    <ShieldCheck size={18} /> Export SF5 (Grades)
                </Button>
            </CardContent>
        </Card>
    );
}
