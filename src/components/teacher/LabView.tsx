'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

import {
  Monitor,
  ArrowLeft
} from 'lucide-react';

import {
  getLabsAction,
  getPcsAction,
  getAttendancesAction,
  cleanupExpiredSessionsAction
} from '@/app/actions/dbActions';

import { Lab } from '@/utils/storage';

export default function LabView() {

  const { user } = useAuth();

  const [labs, setLabs] = useState<Lab[]>([]);
  const [selectedLab, setSelectedLab] = useState<any>(null);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [selectedPc, setSelectedPc] = useState<any | null>(null);

  useEffect(() => {

    const init = async () => {

      await cleanupExpiredSessionsAction();

      await loadLabs();
      await loadActiveSessions();

    };

    init();

  }, []);

  /* Load labs */

  const loadLabs = async () => {

    const labsData = await getLabsAction();

    setLabs(labsData);

  };

  /* Load active sessions */

  const loadActiveSessions = async () => {

    const allAttendances = await getAttendancesAction();

    const active = allAttendances.filter(a => !a.timeOut);

    setActiveSessions(active);

  };

  /* View lab details */

  const viewLabDetails = async (lab: Lab) => {

    const allPcs = await getPcsAction();

    const labPcs = allPcs.filter(p => p.labId === lab.id);

    const updatedPcs = labPcs.map(pc => {

      const session = activeSessions.find(s => s.pcId === pc.id);

      if (session) {

        return {
          ...pc,
          status: 'in-use',
          currentUser: session.studentName || session.studentId || 'Unknown',
          currentSubject: session.subjectName || session.subjectId || 'Unknown',
          startTime: session.timeIn
        };

      }

      return {
        ...pc,
        status: 'available',
        currentUser: null,
        currentSubject: null,
        startTime: null
      };

    });

    setSelectedLab({
      ...lab,
      pcs: updatedPcs
    });

  };

  /* =========================================
     LAB DETAILS VIEW
  ========================================= */

  if (selectedLab) {

    return (

      <div className="space-y-6">

        {/* Header */}

        <div className="flex justify-between items-center">

          <div>

            <h2 className="text-2xl font-bold">
              {selectedLab.name}
            </h2>

            <p className="text-gray-500 text-sm">
              PC Usage Monitor
            </p>

          </div>

          <button
            onClick={() => setSelectedLab(null)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-100"
          >

            <ArrowLeft size={16} />

            Back

          </button>

        </div>

        {/* PC GRID */}

        <div className="
          grid
          grid-cols-2
          sm:grid-cols-3
          md:grid-cols-4
          lg:grid-cols-6
          xl:grid-cols-8
          gap-4
        ">

          {selectedLab.pcs.map((pc: any) => {

            const inUse = pc.status === 'in-use';

            return (

              <div
                key={pc.id}
                onClick={() => setSelectedPc(pc)}
                className={`
                  p-4
                  border
                  rounded-xl
                  text-center
                  cursor-pointer
                  transition
                  hover:shadow-md
                  ${inUse
                    ? 'bg-blue-50 border-blue-400'
                    : 'bg-green-50 border-green-300'}
                `}
              >

                <Monitor
                  size={28}
                  className={
                    inUse
                      ? 'text-blue-600'
                      : 'text-green-600'
                  }
                />

                <p className="mt-2 font-semibold">
                  PC {pc.pcNumber}
                </p>

                <p className={`text-xs mt-1 ${
                  inUse ? 'text-blue-600' : 'text-green-600'
                }`}>

                  {inUse ? 'In Use' : 'Available'}

                </p>

              </div>

            );

          })}

        </div>

        {/* PC DETAILS MODAL */}

        {selectedPc && (

          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

            <div className="bg-white rounded-xl p-6 w-full max-w-sm">

              <h3 className="text-lg font-bold mb-4">

                PC {selectedPc.pcNumber}

              </h3>

              {selectedPc.status === 'in-use' ? (

                <div className="space-y-2 text-sm">

                  <p>
                    <b>Student:</b> {selectedPc.currentUser}
                  </p>

                  <p>
                    <b>Subject:</b> {selectedPc.currentSubject}
                  </p>

                  <p>
                    <b>Start Time:</b> {selectedPc.startTime}
                  </p>

                </div>

              ) : (

                <p className="text-green-600 text-sm">

                  This PC is currently available.

                </p>

              )}

              <button
                onClick={() => setSelectedPc(null)}
                className="mt-6 w-full bg-primary text-white py-2 rounded-lg"
              >

                Close

              </button>

            </div>

          </div>

        )}

      </div>

    );

  }

  /* =========================================
     LAB LIST VIEW
  ========================================= */

  return (

    <div className="space-y-6">

      <div>

        <h2 className="text-2xl font-bold">
          Lab View
        </h2>

        <p className="text-gray-500 text-sm">
          Monitor student lab usage in real-time
        </p>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

        {labs.map((lab) => {

          const inUseCount =
            activeSessions.filter(s => s.labId === lab.id).length;

          const percentage =
            Math.round((inUseCount / lab.capacity) * 100);

          return (

            <div
              key={lab.id}
              onClick={() => viewLabDetails(lab)}
              className="
                bg-white
                border
                rounded-xl
                p-6
                cursor-pointer
                hover:shadow-lg
                transition
              "
            >

              <div className="flex items-center gap-3 mb-4">

                <Monitor className="text-primary" />

                <h3 className="font-semibold text-lg">
                  {lab.name}
                </h3>

              </div>

              <p className="text-sm">
                Capacity: {lab.capacity}
              </p>

              <p className="text-sm">
                In Use:
                <span className="text-blue-600 ml-1">
                  {inUseCount}
                </span>
              </p>

              <p className="text-sm">
                Available:
                <span className="text-green-600 ml-1">
                  {lab.capacity - inUseCount}
                </span>
              </p>

              <div className="mt-4">

                <div className="w-full bg-gray-200 h-2 rounded-full">

                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />

                </div>

                <p className="text-xs text-gray-500 mt-1 text-center">
                  {percentage}% occupied
                </p>

              </div>

            </div>

          );

        })}

      </div>

    </div>

  );

}