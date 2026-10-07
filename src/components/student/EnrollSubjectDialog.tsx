'use client';

import { useState, useEffect } from 'react';

import { useAuth } from '@/contexts/AuthContext';

import {
getSubjectsAction,
getEnrollmentsAction,
addEnrollmentAction
} from '@/app/actions/dbActions';

import { Subject } from '@/utils/storage';

import {
Dialog,
DialogContent,
DialogDescription,
DialogHeader,
DialogTitle,
DialogTrigger
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';

import {
Plus,
CheckCircle,
School,
BookOpen,
Loader2
} from 'lucide-react';

import { toast } from 'sonner';

interface EnrollSubjectDialogProps {
  onEnrolled: () => void;
}

export default function EnrollSubjectDialog({ onEnrolled }: EnrollSubjectDialogProps) {

  const { user } = useAuth();

  const [open,setOpen] = useState(false);

  const [availableSubjects,setAvailableSubjects] = useState<Subject[]>([]);
  const [loading,setLoading] = useState(false);

  useEffect(()=>{

    if(open){

      loadAvailableSubjects();

    }

  },[open,user]);

  const loadAvailableSubjects = async () => {

    if(!user) return;

    setLoading(true);

    const subjects = await getSubjectsAction();
    const enrollments = await getEnrollmentsAction();

    const myEnrollments =
      enrollments.filter(e=>e.studentId===user.id);

    const enrolledSubjectIds =
      myEnrollments.map(e=>e.subjectId);

    const available =
      subjects.filter(
        s=>!enrolledSubjectIds.includes(s.id)
      );

    setAvailableSubjects(available);

    setLoading(false);

  };

  const handleEnroll = async (subject:Subject) => {

    if(!user) return;

    const enrollment = {

      id:`ENR-${Date.now()}`,
      studentId:user.id,
      subjectId:subject.id,
      enrolledAt:new Date().toISOString(),
      status:'pending' as const

    };

    await addEnrollmentAction(enrollment);

    toast.success(
      `Request sent for ${subject.name}! Awaiting approval.`
    );

    setOpen(false);

    onEnrolled();

  };

  return (

    <Dialog open={open} onOpenChange={setOpen}>

      <DialogTrigger asChild>

        <Button
          className="
          bg-primary
          hover:bg-primary/90
          text-white
          font-semibold
          h-12
          px-6
          rounded-xl
          flex
          items-center
          gap-2
          "
        >

          <Plus size={18}/>

          Request Enrollment

        </Button>

      </DialogTrigger>

      <DialogContent
        className="
        sm:max-w-2xl
        max-h-[85vh]
        overflow-hidden
        flex
        flex-col
        p-0
        "
      >

        {/* Header */}

        <div className="bg-primary text-white p-6 sm:p-8">

          <DialogHeader>

            <DialogTitle
              className="flex items-center gap-2 text-xl"
            >

              <School size={20}/>

              Available Subjects

            </DialogTitle>

            <DialogDescription
              className="text-white/70 text-xs mt-1"
            >

              Choose a subject to request enrollment.

            </DialogDescription>

          </DialogHeader>

        </div>

        {/* Body */}

        <div
          className="
          flex-1
          overflow-y-auto
          p-6
          space-y-4
          "
        >

          {loading ? (

            <div className="flex justify-center py-16">

              <Loader2
                className="animate-spin text-primary"
                size={32}
              />

            </div>

          ) : availableSubjects.length === 0 ? (

            <div className="
            text-center
            py-16
            text-muted-foreground
            ">

              <BookOpen size={40} className="mx-auto mb-3 opacity-40"/>

              No subjects available for enrollment

            </div>

          ) : (

            availableSubjects.map(subject=>{

              const schedule =
                subject.schedules?.[0];

              return(

                <div
                  key={subject.id}
                  className="
                  border
                  rounded-xl
                  p-5
                  flex
                  flex-col
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                  gap-4
                  hover:bg-muted/30
                  transition
                  "
                >

                  <div>

                    <h4 className="font-semibold text-lg">

                      {subject.name}

                    </h4>

                    <p className="text-xs text-muted-foreground">

                      Teacher: {subject.teacherName || 'N/A'}

                    </p>

                    <p className="text-xs text-primary mt-1">

                      {schedule
                        ? `${schedule.day} • ${schedule.startTime}`
                        : "No schedule"
                      }

                    </p>

                  </div>

                  <Button
                    onClick={()=>handleEnroll(subject)}
                    size="sm"
                    className="
                    bg-primary
                    hover:bg-primary/90
                    text-white
                    flex
                    items-center
                    gap-1
                    "
                  >

                    <CheckCircle size={14}/>

                    Enroll

                  </Button>

                </div>

              )

            })

          )}

        </div>

      </DialogContent>

    </Dialog>

  );

}