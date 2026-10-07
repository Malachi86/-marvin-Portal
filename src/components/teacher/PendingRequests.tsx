
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

import {
FileText,
CheckCircle,
XCircle,
Loader2
} from 'lucide-react';

import {
getLabRequestsAction,
updateLabRequestAction,
addAttendanceAction,
getSubjectsAction,
getUsersAction
} from '@/app/actions/dbActions';

import { LabRequest, Subject } from '@/utils/storage';

import { toast } from 'sonner';

export default function PendingRequests() {

const { user } = useAuth();

const [requests,setRequests] = useState<any[]>([]);
const [subjects, setSubjects] = useState<Subject[]>([]);
const [loading,setLoading] = useState(true);
const [processing,setProcessing] = useState<string | null>(null);
const [batchProcessing, setBatchProcessing] = useState(false);

/* -----------------------------
   LOAD REQUESTS
----------------------------- */

useEffect(()=>{

if(user){
loadRequests();
}

},[user]);

const loadRequests = async ()=>{

if(!user) return;

setLoading(true);

try{

const [
allRequests,
allSubjects,
allUsers
] = await Promise.all([
getLabRequestsAction(),
getSubjectsAction(),
getUsersAction()
]);

const teacherSubjects =
allSubjects.filter(s=>s.teacherId===user.id);

setSubjects(allSubjects);

const teacherSubjectIds =
teacherSubjects.map(s=>s.id);

const pendingRequests =
allRequests
.filter(r=>
teacherSubjectIds.includes(r.subjectId) &&
r.status==='pending'
)
.map(r=>{

const student =
allUsers.find(u=>u.id===r.studentId);

const subject =
teacherSubjects.find(s=>s.id===r.subjectId);

return{
...r,
student_name:student?.name || 'Unknown',
// FIX: Handle special IDs for Exam and Personal Use
subject_name: r.subjectId === 'personal_use' ? 'Personal Use' : (r.subjectId === 'exam' ? 'Exam' : (subject?.name || 'Unknown Subject'))
};

});

setRequests(pendingRequests);

}catch{

toast.error('Failed to load requests');

}finally{

setLoading(false);

}

};

/* -----------------------------
   APPROVE REQUEST
----------------------------- */

const handleApprove = async (request:LabRequest)=>{

setProcessing(request.id);

try{
// DETERMINE STATUS (PRESENT VS LATE)
let status: 'present' | 'late' = 'present';
const subject = subjects.find(s => s.id === request.subjectId);

if (subject && subject.id !== 'personal_use' && subject.id !== 'exam') {
    const requestDate = new Date(request.startTime);
    const dayName = requestDate.toLocaleDateString('en-US', { weekday: 'long' });
    const schedule = subject.schedules?.find(s => s.day === dayName);

    if (schedule && schedule.startTime) {
        const reqTimePart = request.startTime.split('T')[1];
        if (reqTimePart) {
            const [reqH, reqM] = reqTimePart.split(':').map(Number);
            const [schH, schM] = schedule.startTime.split(':').map(Number);
            
            const reqTotalMins = reqH * 60 + reqM;
            const schTotalMins = schH * 60 + schM;
            
            // If request start is more than 10 mins after class start
            if (reqTotalMins > schTotalMins + 10) {
                status = 'late';
            }
        }
    }
}

await updateLabRequestAction(
request.id,
{status:'approved'}
);

const attendanceEntry = {

studentId:request.studentId,
subjectId:request.subjectId,

date:new Date(request.startTime).toISOString(),

status: status,

timeIn:new Date(request.startTime)
.toLocaleTimeString('en-US',{hour12:false}),

sessionId:`SESS-REQ-${request.id}`,

locationId:request.labId,
locationType:'lab' as const,
pcId:request.pcId

};

await addAttendanceAction(attendanceEntry);

toast.success(
`Request approved. Marked as ${status.toUpperCase()}.`
);

loadRequests();

}catch{

toast.error('Failed to approve request');

}finally{

setProcessing(null);

}

};

/* -----------------------------
   APPROVE ALL REQUESTS
----------------------------- */

const handleApproveAll = async () => {
    if (requests.length === 0) return;
    if (!confirm(`Are you sure you want to approve all ${requests.length} pending requests?`)) return;

    setBatchProcessing(true);
    let successCount = 0;

    try {
        for (const request of requests) {
            // DETERMINE STATUS (PRESENT VS LATE)
            let status: 'present' | 'late' = 'present';
            const subject = subjects.find(s => s.id === request.subjectId);

            if (subject && subject.id !== 'personal_use' && subject.id !== 'exam') {
                const requestDate = new Date(request.startTime);
                const dayName = requestDate.toLocaleDateString('en-US', { weekday: 'long' });
                const schedule = subject.schedules?.find(s => s.day === dayName);

                if (schedule && schedule.startTime) {
                    const reqTimePart = request.startTime.split('T')[1];
                    if (reqTimePart) {
                        const [reqH, reqM] = reqTimePart.split(':').map(Number);
                        const [schH, schM] = schedule.startTime.split(':').map(Number);
                        
                        const reqTotalMins = reqH * 60 + reqM;
                        const schTotalMins = schH * 60 + schM;
                        
                        // If request start is more than 10 mins after class start
                        if (reqTotalMins > schTotalMins + 10) {
                            status = 'late';
                        }
                    }
                }
            }

            await updateLabRequestAction(request.id, { status: 'approved' });

            const attendanceEntry = {
                studentId: request.studentId,
                subjectId: request.subjectId,
                date: new Date(request.startTime).toISOString(),
                status: status,
                timeIn: new Date(request.startTime).toLocaleTimeString('en-US', { hour12: false }),
                sessionId: `SESS-REQ-${request.id}`,
                locationId: request.labId,
                locationType: 'lab' as const,
                pcId: request.pcId
            };

            await addAttendanceAction(attendanceEntry);
            successCount++;
        }
        toast.success(`Batch Action Complete: ${successCount} requests approved.`);
        loadRequests();
    } catch (e) {
        toast.error("Batch processing encountered an error.");
    } finally {
        setBatchProcessing(false);
    }
};

/* -----------------------------
   DECLINE REQUEST
----------------------------- */

const handleDecline = async (requestId:string)=>{

if(!confirm('Decline this request?')) return;

setProcessing(requestId);

try{

await updateLabRequestAction(
requestId,
{status:'declined'}
);

toast.info('Request declined');

loadRequests();

}catch{

toast.error('Failed to decline request');

}finally{

setProcessing(null);

}

};

/* -----------------------------
   LOADING
----------------------------- */

if(loading){

return(

<div className="flex justify-center py-20">

<Loader2 className="animate-spin h-10 w-10 text-primary"/>

</div>

);

}

/* -----------------------------
   EMPTY STATE
----------------------------- */

if(requests.length===0){

return(

<div>

<h2 className="text-2xl font-semibold mb-2">
Pending Requests
</h2>

<p className="text-muted-foreground mb-6">
Review student lab session requests
</p>

<div className="bg-white border rounded-xl shadow p-12 text-center">

<FileText
size={60}
className="mx-auto mb-4 text-muted-foreground opacity-40"
/>

<p className="text-muted-foreground">
No pending requests
</p>

</div>

</div>

);

}

/* -----------------------------
   UI
----------------------------- */

return(

<div className="animate-in fade-in duration-500">

<div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
    <div>
        <h2 className="text-3xl font-black text-primary uppercase tracking-tighter leading-none">Pending Requests</h2>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Review student lab session requests</p>
    </div>
    {requests.length > 0 && (
        <button
            onClick={handleApproveAll}
            disabled={batchProcessing}
            className="flex items-center gap-3 px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-green-900/10 active:scale-95 disabled:opacity-50"
        >
            {batchProcessing ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
            Approve All ({requests.length})
        </button>
    )}
</div>

<div className="space-y-4">

{requests.map(request=>(

<div
key={request.id}
className="
bg-white
border
rounded-xl
shadow-sm
p-6
flex
flex-col
md:flex-row
md:items-center
md:justify-between
gap-6
"
>

{/* REQUEST INFO */}

<div className="space-y-1">

<h3 className="text-lg font-semibold">
{request.subject_name}
</h3>

<p className="text-sm text-muted-foreground">

Student:
<strong className="ml-1">
{request.student_name}
</strong>

<span className="ml-2 text-xs">
({request.studentId})
</span>

</p>

<p className="text-sm text-muted-foreground">

Lab:
<strong className="ml-1">
{request.labId}
</strong>

<span className="ml-2">

PC
{request.pcId?.split('-').pop()}

</span>

</p>

<p className="text-sm text-muted-foreground">

Time:

{new Date(request.startTime)
.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}

—

{new Date(request.endTime)
.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}

</p>

{request.reason && (

<p className="text-sm mt-2">

<span className="font-medium">
Reason:
</span>

<span className="ml-1 text-muted-foreground">
{request.reason}
</span>

</p>

)}

</div>

{/* ACTIONS */}

<div className="flex gap-3">

<button

disabled={processing===request.id || batchProcessing}

onClick={()=>handleApprove(request)}

className="
flex
items-center
gap-2
px-4
py-2
bg-green-600
hover:bg-green-700
text-white
rounded-lg
text-sm
disabled:opacity-50
"

>

{processing===request.id
? <Loader2 className="animate-spin" size={16}/>
: <CheckCircle size={16}/>
}

Approve

</button>

<button

disabled={processing===request.id || batchProcessing}

onClick={()=>handleDecline(request.id)}

className="
flex
items-center
gap-2
px-4
py-2
bg-red-600
hover:bg-red-700
text-white
rounded-lg
text-sm
disabled:opacity-50
"

>

<XCircle size={16}/>

Decline

</button>

</div>

</div>

))}

</div>

</div>

);

}
