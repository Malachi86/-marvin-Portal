
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

import {
getUsersAction,
getSubjectsAction,
getEnrollmentsAction,
updateEnrollmentAction
} from '@/app/actions/dbActions';

import {
Users,
Search,
CheckCircle,
XCircle,
Eye,
Loader2
} from 'lucide-react';

import { toast } from 'sonner';

export default function PendingEnrollments() {

const { user } = useAuth();

const [enrollments,setEnrollments] = useState<any[]>([]);
const [loading,setLoading] = useState(true);
const [batchProcessing, setBatchProcessing] = useState(false);

const [search,setSearch] = useState('');

const [selected,setSelected] = useState<any|null>(null);

/* Pagination */

const [currentPage,setCurrentPage] = useState(1);
const [rowsPerPage,setRowsPerPage] = useState(5);

useEffect(()=>{

if(user) loadEnrollments();

},[user]);

const loadEnrollments = async () => {

if(!user) return;

setLoading(true);

const allEnrollments = await getEnrollmentsAction();
const allSubjects = await getSubjectsAction();
const allUsers = await getUsersAction();

const teacherSubjects =
allSubjects.filter(s => s.teacherId === user.id);

const teacherSubjectIds =
teacherSubjects.map(s => s.id);

const pending =
allEnrollments
.filter((e:any)=>
teacherSubjectIds.includes(e.subjectId)
&& e.status === 'pending'
)
.map(e=>{

const student =
allUsers.find(u=>u.id===e.studentId);

const subject =
teacherSubjects.find(s=>s.id===e.subjectId);

return {
...e,
student_name: student?.name || 'Unknown',
subject_name: subject?.name || 'Unknown'
};

});

setEnrollments(pending);

setLoading(false);

};

/* Search */

const filtered =
enrollments.filter(e=>

e.student_name
.toLowerCase()
.includes(search.toLowerCase())

|| e.studentId
.toLowerCase()
.includes(search.toLowerCase())

|| e.subject_name
.toLowerCase()
.includes(search.toLowerCase())

);

/* Pagination */

const totalPages =
Math.ceil(filtered.length / rowsPerPage);

const start =
(currentPage-1) * rowsPerPage;

const paginated =
filtered.slice(start,start+rowsPerPage);

const goToPage=(p:number)=>{

if(p<1||p>totalPages) return;

setCurrentPage(p);

};

/* Approve / Reject */

const handleAction = async (
enrollmentId:string,
approve:boolean
) => {

const status = approve ? 'approved':'rejected';

try{

await updateEnrollmentAction(
enrollmentId,
{status}
);

toast.success(
`Enrollment ${status}.`
);

loadEnrollments();

}catch{

toast.error(
'Failed to update enrollment.'
);

}

};

/* Approve All */

const handleApproveAll = async () => {
    if (filtered.length === 0) return;
    if (!confirm(`Are you sure you want to authorize all ${filtered.length} pending enrollment requests?`)) return;

    setBatchProcessing(true);
    let successCount = 0;
    try {
        for (const enrollment of filtered) {
            await updateEnrollmentAction(enrollment.id, { status: 'approved' });
            successCount++;
        }
        toast.success(`Batch Success: Authorized ${successCount} student(s) into their subjects.`);
        loadEnrollments();
    } catch (e) {
        toast.error("Batch approval failed.");
    } finally {
        setBatchProcessing(false);
    }
};

/* Loading */

if(loading){

return(

<div className="flex justify-center py-20">

<Loader2
className="animate-spin text-primary"
size={40}
/>

</div>

);

}

return(

<div className="space-y-6 animate-in fade-in duration-500">

{/* Header */}

<div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
    <div>
        <h2 className="text-3xl font-black text-primary uppercase tracking-tighter flex items-center gap-3">
            <Users size={32}/>
            Pending Enrollments
        </h2>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Review student enrollment requests</p>
    </div>
    {filtered.length > 0 && (
        <button
            onClick={handleApproveAll}
            disabled={batchProcessing}
            className="flex items-center gap-3 px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-green-900/10 active:scale-95 disabled:opacity-50"
        >
            {batchProcessing ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
            Approve All ({filtered.length})
        </button>
    )}
</div>


{/* Search */}

<div className="bg-white border rounded-xl p-4">

<div className="relative">

<Search
size={18}
className="absolute left-3 top-2.5 text-gray-400"
/>

<input
type="text"
placeholder="Search student or subject..."
value={search}
onChange={(e)=>{
setSearch(e.target.value);
setCurrentPage(1);
}}
className="
w-full
pl-9
py-2
border
rounded-lg
"
/>

</div>

</div>


{/* Empty */}

{filtered.length === 0 && (

<div className="
bg-white
border
rounded-xl
p-12
text-center
">

<Users size={48} className="mx-auto text-gray-300 mb-3"/>

<p className="text-gray-500">

No pending enrollments

</p>

</div>

)}


{/* Enrollment Cards */}

<div className="space-y-4">

{paginated.map(enrollment=>(

<div
key={enrollment.id}
className="
bg-white
border
rounded-xl
p-5
flex
flex-col
md:flex-row
md:items-center
md:justify-between
gap-4
"
>

<div>

<h3 className="font-semibold text-lg">

{enrollment.subject_name}

</h3>

<p className="text-sm text-gray-600">

{enrollment.student_name}
({enrollment.studentId})

</p>

<p className="text-xs text-gray-500">

Requested:
{new Date(
enrollment.enrolledAt
).toLocaleDateString()}

</p>

</div>


<div className="flex gap-2">

<button
onClick={()=>setSelected(enrollment)}
className="
flex items-center gap-1
px-3 py-2
border
rounded-lg
text-sm
hover:bg-gray-100
"
>

<Eye size={16}/>
View

</button>


<button
disabled={batchProcessing}
onClick={()=>
handleAction(
enrollment.id,
true
)
}
className="
flex items-center gap-1
px-3 py-2
bg-green-600
hover:bg-green-700
text-white
rounded-lg
text-sm
disabled:opacity-50
"
>

<CheckCircle size={16}/>
Approve

</button>


<button
disabled={batchProcessing}
onClick={()=>
handleAction(
enrollment.id,
false
)
}
className="
flex items-center gap-1
px-3 py-2
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


{/* Pagination */}

{totalPages>1 &&(

<div className="
flex
justify-between
items-center
pt-4
">

<select
value={rowsPerPage}
onChange={(e)=>{
setRowsPerPage(
Number(e.target.value)
);
setCurrentPage(1);
}}
className="border px-2 py-1 rounded"
>

<option value={5}>5</option>
<option value={10}>10</option>
<option value={20}>20</option>

</select>


<div className="flex gap-2">

<button
onClick={()=>goToPage(currentPage-1)}
disabled={currentPage===1}
className="px-3 py-1 border rounded disabled:opacity-40"
>

Prev

</button>

{Array.from(
{length:totalPages},
(_,i)=>i+1
).map(p=>(

<button
key={p}
onClick={()=>goToPage(p)}
className={`px-3 py-1 border rounded ${
currentPage===p
?'bg-primary text-white':''
}`}
>
{p}
</button>

))}

<button
onClick={()=>goToPage(currentPage+1)}
disabled={currentPage===totalPages}
className="px-3 py-1 border rounded disabled:opacity-40"
>

Next

</button>

</div>

</div>

)}


{/* Modal */}

{selected && (

<div className="
fixed
inset-0
bg-black/40
flex
items-center
justify-center
z-50
">

<div className="
bg-white
rounded-xl
p-6
w-full
max-w-md
">

<h3 className="font-bold text-lg mb-4">

Enrollment Request

</h3>

<div className="space-y-2 text-sm">

<p>
<b>Student:</b>
{selected.student_name}
</p>

<p>
<b>Student ID:</b>
{selected.studentId}
</p>

<p>
<b>Subject:</b>
{selected.subject_name}
</p>

<p>
<b>Requested:</b>
{new Date(
selected.enrolledAt
).toLocaleDateString()}
</p>

</div>

<button
onClick={()=>setSelected(null)}
className="
mt-6
w-full
bg-primary
text-white
py-2
rounded-lg
"
>

Close

</button>

</div>

</div>

)}

</div>

);

}
