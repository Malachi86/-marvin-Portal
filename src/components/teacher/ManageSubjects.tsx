'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getSubjectsAction, deleteSubjectAction, addSubjectAction } from '@/app/actions/dbActions';
import { Subject } from '@/utils/storage';
import { Book, Plus, Trash2, Edit, Loader2, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import AddSubjectDialog from './AddSubjectDialog';
import EditSubjectDialog from './EditSubjectDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import * as XLSX from 'xlsx';

export default function ManageSubjects() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const loadSubjects = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const allSubjects = await getSubjectsAction();
      const teacherSubjects = allSubjects.filter(s => s.teacherId === user.id);
      setSubjects(teacherSubjects);
    } catch (e) {
      toast.error("Failed to load subjects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, [user]);

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          toast.error("No data found in the Excel file.");
          setIsImporting(false);
          return;
        }

        // Helper to find header case-insensitively
        const findHeader = (target: string, row: any) => {
            const keys = Object.keys(row);
            return keys.find(k => k.toLowerCase().replace(/\s/g, '') === target.toLowerCase().replace(/\s/g, ''));
        };

        let importedCount = 0;
        for (const row of data as any[]) {
          const codeKey = findHeader("Course Code", row);
          const descKey = findHeader("Subject Description", row);

          const code = codeKey ? String(row[codeKey]).trim() : '';
          const name = descKey ? String(row[descKey]).trim() : '';

          if (name) {
            await addSubjectAction({
              id: `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              name: name,
              code: code,
              teacherId: user.id,
              teacherName: user.name,
              termId: '', 
              department: user.department,
              schedules: [], 
              description: '',
              units: 3
            });
            importedCount++;
          }
        }

        toast.success(`Protocol Success: Imported ${importedCount} subjects!`, {
          description: "Please edit each subject to configure their academic terms and weekly schedules."
        });
        loadSubjects();
      } catch (err) {
        console.error(err);
        toast.error("Excel processing failure. Check column headers.");
      } finally {
        setIsImporting(false);
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDelete = async (subject: Subject) => {
    if (!window.confirm(`Are you sure you want to delete ${subject.name}? This cannot be undone.`)) return;
    try {
      await deleteSubjectAction(subject.id);
      toast.success("Subject deleted.");
      loadSubjects();
    } catch (e) {
      toast.error("Failed to delete subject.");
    }
  };
  
  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-primary uppercase tracking-tighter">Manage Subjects</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Add, edit, or delete your course subjects.</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleImportExcel}
            className="hidden"
            id="excel-import"
            disabled={isImporting}
          />
          <Button variant="outline" className="h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 bg-white shadow-sm" asChild disabled={isImporting}>
            <label htmlFor="excel-import" className="cursor-pointer">
               {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
               Import Excel
            </label>
          </Button>
          <AddSubjectDialog onSubjectAdded={loadSubjects} />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-primary/5">
        {subjects.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            < Book size={64} className="mx-auto mb-6 opacity-20 text-primary" />
            <p className="text-lg font-black uppercase tracking-tighter mb-2">No Subjects Registered</p>
            <p className="text-[10px] font-bold uppercase tracking-widest">Provision subjects manually or via Excel import.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="p-6 rounded-[1.5rem] flex items-center justify-between transition-all bg-slate-50/50 border border-primary/5 hover:border-primary/20 hover:bg-white hover:shadow-lg group"
              >
                <div className="overflow-hidden">
                  <p className="font-black text-xl text-primary uppercase tracking-tight truncate">{subject.name}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest border-primary/10">{subject.code || 'NO CODE'}</Badge>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                       {subject.schedules && subject.schedules.length > 0 ? (
                         subject.schedules.map((s, i) => (
                           <span key={i} className="flex items-center gap-1">
                             <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
                             {s.day} • {s.startTime}
                           </span>
                         ))
                       ) : (
                         <span className="text-red-400 italic">Schedule Pending Update</span>
                       )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 ml-6">
                  <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl bg-white border border-primary/5 text-primary hover:bg-primary hover:text-white shadow-sm" onClick={() => setEditingSubject(subject)}>
                    <Edit className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl bg-white border border-red-100 text-red-500 hover:bg-red-500 hover:text-white shadow-sm" onClick={() => handleDelete(subject)}>
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingSubject && (
        <EditSubjectDialog
          subject={editingSubject}
          onClose={() => setEditingSubject(null)}
          onSubjectUpdated={() => {
            setEditingSubject(null);
            loadSubjects();
          }}
        />
      )}
    </div>
  );
}
