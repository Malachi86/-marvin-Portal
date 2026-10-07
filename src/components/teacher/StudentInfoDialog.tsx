'use client';

import { User, Subject } from '@/utils/storage';

import {
Dialog,
DialogContent,
DialogHeader,
DialogTitle,
DialogDescription
} from '@/components/ui/dialog';

import {
User as UserIcon,
Mail,
School,
ShieldCheck
} from 'lucide-react';

interface StudentInfoDialogProps {
  student: User;
  subject: Subject;
  onClose: () => void;
}

export default function StudentInfoDialog({
  student,
  subject,
  onClose
}: StudentInfoDialogProps) {

  const firstSchedule = subject.schedules?.[0];

  return (

    <Dialog open={true} onOpenChange={onClose}>

      <DialogContent
        className="
        max-w-2xl
        p-0
        overflow-hidden
        border-0
        rounded-2xl
        shadow-2xl
        "
      >

        {/* Hidden Accessibility Header */}

        <DialogHeader className="sr-only">

          <DialogTitle>
            Student Profile
          </DialogTitle>

          <DialogDescription>
            Student information dialog
          </DialogDescription>

        </DialogHeader>

        {/* PROFILE HEADER */}

        <div
          className="
          bg-primary
          text-white
          p-6
          sm:p-10
          flex
          flex-col
          sm:flex-row
          gap-6
          items-center
          "
        >

          {/* Avatar */}

          <div
            className="
            w-24
            h-24
            sm:w-32
            sm:h-32
            rounded-xl
            bg-white/20
            border
            border-white/40
            flex
            items-center
            justify-center
            overflow-hidden
            "
          >

            {student.profilePic ? (

              <img
                src={student.profilePic}
                alt={student.name}
                className="w-full h-full object-cover"
              />

            ) : (

              <UserIcon className="w-12 h-12 text-white" />

            )}

          </div>

          {/* Student Info */}

          <div className="text-center sm:text-left">

            <p className="text-xs uppercase tracking-widest opacity-70">
              Verified Student
            </p>

            <h3 className="text-2xl sm:text-3xl font-bold mt-1">

              {student.name}

            </h3>

            <div className="mt-3 text-sm space-y-1">

              <p>
                <span className="opacity-70">ID:</span> {student.id}
              </p>

              <p>
                <span className="opacity-70">Year:</span>{" "}
                {student.year || "N/A"}
              </p>

              <p>
                <span className="opacity-70">Program:</span>{" "}
                {student.program || "N/A"}
              </p>

            </div>

          </div>

        </div>

        {/* CONTENT */}

        <div className="p-6 sm:p-8 space-y-6 bg-white">

          {/* Subject Info */}

          <div>

            <h4
              className="
              text-xs
              uppercase
              tracking-widest
              text-muted-foreground
              mb-3
              "
            >

              Enrolled Subject

            </h4>

            <div
              className="
              flex
              items-center
              gap-4
              p-4
              border
              rounded-xl
              "
            >

              <div
                className="
                w-12
                h-12
                rounded-lg
                bg-primary
                text-white
                flex
                items-center
                justify-center
                "
              >

                <School size={22} />

              </div>

              <div>

                <p className="font-semibold">

                  {subject.name}

                </p>

                <p className="text-xs text-muted-foreground">

                  {firstSchedule
                    ? `${firstSchedule.day} • ${firstSchedule.startTime}`
                    : "No schedule"}

                </p>

              </div>

            </div>

          </div>

          {/* Contact + Status */}

          <div
            className="
            grid
            grid-cols-1
            sm:grid-cols-2
            gap-4
            "
          >

            {/* Email */}

            <div
              className="
              p-4
              border
              rounded-xl
              flex
              items-center
              gap-3
              "
            >

              <Mail className="text-primary" size={18} />

              <div>

                <p className="text-xs text-muted-foreground">
                  Email
                </p>

                <p className="text-sm font-medium truncate">

                  {student.email || "No email"}

                </p>

              </div>

            </div>

            {/* Status */}

            <div
              className="
              p-4
              border
              rounded-xl
              flex
              items-center
              gap-3
              bg-green-50
              "
            >

              <ShieldCheck
                className="text-green-600"
                size={18}
              />

              <div>

                <p className="text-xs text-green-700">
                  Status
                </p>

                <p className="text-sm font-semibold text-green-700">

                  Verified Active

                </p>

              </div>

            </div>

          </div>
          
          <div>
            <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
              Emergency Contact
            </h4>
            <div className="p-4 border rounded-xl space-y-2 text-sm">
                <div className="flex">
                    <span className="w-28 font-semibold">Name:</span>
                    <span>{student.emergencyContactName || 'N/A'}</span>
                </div>
                <div className="flex">
                    <span className="w-28 font-semibold">Address:</span>
                    <span>{student.emergencyContactAddress || 'N/A'}</span>
                </div>
                <div className="flex">
                    <span className="w-28 font-semibold">Tel. No:</span>
                    <span>{student.emergencyContactPhone || 'N/A'}</span>
                </div>
            </div>
          </div>

        </div>

      </DialogContent>

    </Dialog>

  );

}
