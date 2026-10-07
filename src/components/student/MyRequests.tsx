
'use client';

import React, { useState, useEffect } from 'react';

import { useAuth } from '../../contexts/AuthContext';

import {
FileText,
Clock,
CheckCircle,
XCircle,
Loader2
} from 'lucide-react';

import {
getLabRequestsAction,
getSubjectsAction,
getLabsAction,
getRoomsAction
} from '@/app/actions/dbActions';

import {
LabRequest,
Subject,
Lab,
Room
} from '@/utils/storage';

type PopulatedRequest = LabRequest & {
  subjectName: string;
  locationName: string;
  pcNumber?: string;
};

export default function MyRequests() {

  const { user } = useAuth();

  const [requests,setRequests] = useState<PopulatedRequest[]>([]);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{

    if(user){

      loadRequests();

    }

  },[user]);

  const loadRequests = async () => {

    if(!user) return;

    setLoading(true);

    const [
      allRequests,
      allSubjects,
      allLabs,
      allRooms
    ] = await Promise.all([

      getLabRequestsAction(),
      getSubjectsAction(),
      getLabsAction(),
      getRoomsAction()

    ]);

    const myRequests =
      allRequests.filter(
        r => r.studentId === user.id
      );

    const populated =
      myRequests.map(req=>{

        const subject =
          allSubjects.find(
            s=>s.id === req.subjectId
          );

        const location =
          req.pcId
            ? allLabs.find(l=>l.id === req.labId)
            : allRooms.find(r=>r.id === req.labId);

        return {

          ...req,
          // FIX: Handle special IDs for Exam and Personal Use
          subjectName: req.subjectId === 'personal_use' ? 'Personal Use' : (req.subjectId === 'exam' ? 'Exam' : (subject?.name || 'Unknown Subject')),
          locationName: location?.name || 'Unknown Location',
          pcNumber: req.pcId?.split('-').pop()

        };

      });

    const sorted =
      populated.sort(
        (a,b)=>
          new Date(b.startTime).getTime() -
          new Date(a.startTime).getTime()
      );

    setRequests(sorted);

    setLoading(false);

  };

  const getStatusIcon = (status:string)=>{

    switch(status){

      case 'approved':
        return <CheckCircle size={18} className="text-green-500"/>;

      case 'declined':
        return <XCircle size={18} className="text-red-500"/>;

      default:
        return <Clock size={18} className="text-yellow-500"/>;

    }

  };

  const getStatusBadge = (status:string)=>{

    const colors:Record<string,string> = {

      pending:'bg-yellow-100 text-yellow-800',
      approved:'bg-green-100 text-green-800',
      declined:'bg-red-100 text-red-800'

    };

    return colors[status] || colors.pending;

  };

  if(loading){

    return(

      <div className="flex justify-center py-16">

        <Loader2
          className="animate-spin text-primary"
          size={36}
        />

      </div>

    );

  }

  return(

    <div className="space-y-6">

      {/* Header */}

      <div>

        <h2 className="text-2xl sm:text-3xl font-bold">

          My Requests

        </h2>

        <p className="text-gray-500">

          Review your lab and room booking requests

        </p>

      </div>

      {/* Empty */}

      {requests.length === 0 ? (

        <div className="
        bg-white
        border
        rounded-xl
        p-12
        text-center
        ">

          <FileText
            size={48}
            className="mx-auto mb-4 text-gray-300"
          />

          <p className="text-gray-500">

            You haven't submitted any requests yet.

          </p>

        </div>

      ) : (

        <div className="space-y-4">

          {requests.map(request=>{

            const start =
              new Date(request.startTime);

            const end =
              new Date(request.endTime);

            return(

              <div
                key={request.id}
                className="
                bg-white
                border
                rounded-xl
                p-5
                hover:shadow-md
                transition
                "
              >

                <div className="
                flex
                flex-col
                sm:flex-row
                sm:items-start
                sm:justify-between
                gap-3
                ">

                  {/* Request Info */}

                  <div>

                    <div className="
                    flex
                    items-center
                    gap-2
                    mb-1
                    ">

                      {getStatusIcon(request.status)}

                      <h3 className="font-semibold text-lg">

                        {request.subjectName}

                      </h3>

                    </div>

                    <p className="text-sm text-muted-foreground">

                      {request.locationName}

                      {request.pcNumber &&
                        ` • PC ${request.pcNumber}`
                      }

                    </p>

                    <p className="text-sm text-muted-foreground">

                      {start.toLocaleDateString([],{
                        dateStyle:'medium'
                      })}

                      •

                      {start.toLocaleTimeString([],{
                        hour:'2-digit',
                        minute:'2-digit'
                      })}

                      -

                      {end.toLocaleTimeString([],{
                        hour:'2-digit',
                        minute:'2-digit'
                      })}

                    </p>

                  </div>

                  {/* Status */}

                  <span
                    className={`
                    text-xs
                    px-3
                    py-1
                    rounded-full
                    capitalize
                    ${getStatusBadge(request.status)}
                    `}
                  >

                    {request.status}

                  </span>

                </div>

                {request.reason && (

                  <div className="
                  border-t
                  mt-3
                  pt-3
                  text-sm
                  text-muted-foreground
                  ">

                    <span className="font-medium">
                      Reason:
                    </span>

                    {' '}{request.reason}

                  </div>

                )}

              </div>

            );

          })}

        </div>

      )}

    </div>

  );

}
