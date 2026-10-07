'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import {
  getAcademicRecordsAction,
  getTermsAction,
  getTermEnrollmentsAction
} from '@/app/actions/dbActions';

import { AcademicRecord, Term } from '@/utils/storage';

import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import { Loader2, Printer, Info, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

import Image from 'next/image';

export default function GradeSlip() {

  const { user } = useAuth();

  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ------------------------------------------------ */
  /* FETCH TERMS + HISTORY + ENROLLMENTS */
  /* ------------------------------------------------ */

  const fetchData = async () => {

    if (!user) return;

    setLoading(true);

    try {

      const [allTerms, allHistorical, allTermEnrollments] = await Promise.all([
        getTermsAction(),
        getAcademicRecordsAction(),
        getTermEnrollmentsAction()
      ]);

      const myTermIds = new Set([
        ...allTermEnrollments
          .filter((te: any) => te.studentId === user.id && te.status === 'approved')
          .map((te: any) => te.termId),
        ...allHistorical
          .filter((ar: any) => ar.studentId === user.id)
          .map((ar: any) => ar.termId)
      ]);

      const filteredTerms = allTerms.filter((t: any) => myTermIds.has(t.id));

      const sortedTerms = filteredTerms.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

      setTerms(sortedTerms);

      if (sortedTerms.length > 0) {

        const activeTerm = sortedTerms.find(
          (t) => t.status === 'active'
        );

        const defaultTermId =
          activeTerm?.id || sortedTerms[0].id;

        setSelectedTermId(defaultTermId);

        loadTermGrades(defaultTermId, sortedTerms, allHistorical);

      }

    } catch (e) {

      console.error(e);

    } finally {

      setLoading(false);

    }

  };

  /* ------------------------------------------------ */
  /* LOAD TERM GRADES */
  /* ------------------------------------------------ */

  const loadTermGrades = async (
    termId: string,
    currentTerms?: Term[],
    historical?: AcademicRecord[]
  ) => {

    if (!user) return;

    const termsList = currentTerms || terms;
    const term = termsList.find((t) => t.id === termId);

    if (term?.status === 'active') {
      setRecords([]);
      return;
    }

    const historyData =
      historical || (await getAcademicRecordsAction());

    const history = historyData.filter(
      (r) =>
        r.studentId === user.id &&
        r.termId === termId
    );

    if (history.length > 0) {

      setRecords(
        history.map((h) => ({
          code: h.subjectCode,
          description: h.subjectName,
          units: h.units,
          grade: h.grade.toFixed(2),
          letter: getLetter(h.grade)
        }))
      );

    } else {
      setRecords([]);
    }

  };

  const getLetter = (g: number) => {
    if (g === 1.00) return 'A+';
    if (g === 1.25) return 'A';
    if (g === 1.50) return 'A-';
    if (g === 1.75) return 'B+';
    if (g === 2.00) return 'B';
    if (g === 2.25) return 'B-';
    if (g === 2.50) return 'C+';
    if (g === 2.75) return 'C';
    if (g === 3.00) return 'C-';
    return 'F';
  };

  useEffect(() => { fetchData(); }, [user?.id]);

  const calculateGWA = () => {

    if (records.length === 0) return "0.00";

    let totalPoints = 0;
    let totalUnits = 0;

    records.forEach(r => {
      totalPoints += parseFloat(r.grade) * r.units;
      totalUnits += r.units;
    });

    return (totalPoints / totalUnits).toFixed(2);

  };

  const currentTerm = terms.find(t => t.id === selectedTermId);
  const isTermActive = currentTerm?.status === 'active';

  if (loading)
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );

  return (

    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-2 sm:px-0 animate-in fade-in duration-500">

      {/* Controls */}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">

        <div className="w-full sm:w-96">

          <Select
            value={selectedTermId}
            onValueChange={(v) => {
              setSelectedTermId(v);
              loadTermGrades(v);
            }}
          >

            <SelectTrigger className="h-14 rounded-full font-black uppercase text-[11px] tracking-widest px-8 border-primary/10 shadow-sm bg-white">
              <SelectValue placeholder="Select Enrolled Term" />
            </SelectTrigger>

            <SelectContent className="rounded-2xl">

              {terms.length === 0 ? (
                <div className="p-4 text-center text-[10px] font-bold text-muted-foreground uppercase">No Enrolled Terms Found</div>
              ) : (
                terms.map(t => (
                  <SelectItem key={t.id} value={t.id} className="font-bold">
                    {t.name} {t.status === 'ended' ? '(Finalized)' : '(Ongoing)'}
                  </SelectItem>
                ))
              )}

            </SelectContent>

          </Select>

        </div>

        <Button 
          onClick={() => window.print()} 
          className="w-full sm:w-auto h-14 px-10 rounded-full font-black uppercase text-[10px] tracking-widest gap-2 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20"
          disabled={isTermActive || records.length === 0}
        >

          <Printer size={18} />
          Print Grade Slip

        </Button>

      </div>

      {/* Official Grade Slip Container - FORMAL STYLE */}

      <Card className="bg-white border border-slate-200 p-6 sm:p-14 print:p-10 relative overflow-hidden shadow-sm rounded-none">

        {/* Header - Formal Black/White */}

        <div className="flex flex-col items-center text-center space-y-1 mb-8">

          <div className="flex items-center gap-6">
            <div className="w-16 h-16 flex items-center justify-center">
              <Image
                src="/logocard.png"
                alt="logo"
                width={64}
                height={64}
                className="object-contain"
              />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none">
                AMA EDUCATION SYSTEM
              </h1>
              <p className="text-sm font-bold text-slate-800 mt-1 uppercase">
                Official Academic Grade Report
              </p>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                AMA Computer College – Lipa Campus
              </p>
            </div>
          </div>

          <div className="w-full border-b-2 border-slate-900 pt-6" />

        </div>

        {/* Student Info Grid - Grayscale */}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-2 mb-10 text-sm">

          <div className="flex items-center gap-2">
            <span className="font-bold whitespace-nowrap text-slate-900">Student Name:</span>
            <span className="text-slate-800 uppercase">{user?.name}</span>
          </div>

          <div className="flex items-center gap-2 sm:justify-end">
            <span className="font-bold whitespace-nowrap text-slate-900">Campus:</span>
            <span className="text-slate-800 uppercase">AMACC – Lipa</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold whitespace-nowrap text-slate-900">Student ID:</span>
            <span className="text-slate-800">{user?.id}</span>
          </div>

          <div className="flex items-center gap-2 sm:justify-end">
            <span className="font-bold whitespace-nowrap text-slate-900">Academic Term:</span>
            <span className="text-slate-800 uppercase">{currentTerm?.name || 'N/A'}</span>
          </div>

        </div>

        {/* Grade Table - Formal Grayscale */}

        <div className="border-2 border-slate-200 rounded-none overflow-hidden bg-white min-h-[450px] flex flex-col">

          <table className="w-full">

            <thead className="bg-slate-100 border-b-2 border-slate-200">

              <tr>

                <th className="p-5 text-left font-black uppercase tracking-tight text-[11px] text-slate-900 border-r border-slate-200">Subject</th>
                <th className="p-5 text-left font-black uppercase tracking-tight text-[11px] text-slate-900 border-r border-slate-200">Description</th>
                <th className="p-5 text-center font-black uppercase tracking-tight text-[11px] text-slate-900 border-r border-slate-200">Units Taken</th>
                <th className="p-5 text-center font-black uppercase tracking-tight text-[11px] text-slate-900 border-r border-slate-200">Official Grade</th>
                <th className="p-5 text-center font-black uppercase tracking-tight text-[11px] text-slate-900">Grade Letter</th>

              </tr>

            </thead>

            <tbody className="flex-1">

              {isTermActive ? (
                <tr>
                  <td colSpan={5} className="p-10 sm:p-24 text-center">
                    <div className="flex flex-col items-center gap-6 py-10">
                      <div className="h-24 w-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-400 border-4 border-slate-100 rotate-3">
                        <Lock size={40} strokeWidth={2.5} />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900">GRADES NOT YET FINALIZED</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] max-w-sm mx-auto leading-relaxed">
                          The current academic term is still active. <br/>
                          Final records will be available once the term <br/>
                          is officially closed.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (

                <tr>

                  <td colSpan={5} className="text-center py-24 text-slate-400">

                    <Info className="mx-auto mb-4 opacity-20" size={48} />

                    <p className="font-black uppercase tracking-widest text-[10px]">No academic records found for this period.</p>

                  </td>

                </tr>

              ) : (

                records.map((record, i) => (

                  <tr key={i} className="border-t border-slate-200 hover:bg-slate-50 transition-colors group h-16">

                    <td className="p-5 font-bold text-slate-900 uppercase tracking-tight border-r border-slate-200">{record.code}</td>
                    <td className="p-5 font-medium text-slate-800 uppercase text-[11px] border-r border-slate-200">{record.description}</td>
                    <td className="p-5 text-center font-bold text-slate-800 border-r border-slate-200">{record.units}</td>
                    <td className="p-5 text-center font-black text-lg text-slate-900 border-r border-slate-200">{record.grade}</td>
                    <td className="p-5 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-slate-100 text-slate-900 font-black text-xs border border-slate-200">{record.letter}</span>
                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

        {/* Footer Area - Registrar Section */}

        <div className="mt-16 pt-10 flex flex-col md:flex-row justify-between items-end gap-10">

          <div className="space-y-10 w-full md:w-auto">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 mb-16">
                AUTHORIZED ACADEMIC SIGNATURE
              </p>

              <div className="max-w-xs">
                <div className="border-b-2 border-slate-900" />
                <p className="text-[11px] font-black uppercase tracking-[0.1em] mt-3 text-slate-900">
                  Ms. Fatima L. Layyo
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">
                  School Registrar
                </p>
              </div>
            </div>
          </div>

          {!isTermActive && records.length > 0 && (
            <div className="bg-[#6D1B0A] text-white p-10 px-14 rounded-[3rem] shadow-3xl flex flex-col items-center min-w-[280px]">
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/70 mb-4 text-center w-full">
                WEIGHTED AVERAGE
              </p>
              <p className="text-7xl font-black tracking-tighter leading-none">
                {calculateGWA()}
              </p>
            </div>
          )}

        </div>

      </Card>

      <div className="text-center print:hidden px-4 mt-8">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 leading-relaxed max-w-lg mx-auto opacity-60">
          This digital grade report is a certified copy generated by the Academic Management System (AMS:AMACC). 
          Any unauthorized alteration renders this document invalid.
        </p>
      </div>

    </div>

  );

}
