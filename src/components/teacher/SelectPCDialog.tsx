'use client';

import { useState, useEffect } from 'react';

import {
Dialog,
DialogContent,
DialogHeader,
DialogTitle,
DialogDescription,
DialogFooter
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';

import {
Loader2,
Monitor
} from 'lucide-react';

import { getPcsAction } from '@/app/actions/dbActions';
import { Pc } from '@/utils/storage';

import { toast } from 'sonner';

interface SelectPCDialogProps {
  labId: string;
  studentName: string;
  subjectName: string;
  onClose: () => void;
  onSubmit: (pcId: string) => void;
}

export default function SelectPCDialog({
  labId,
  studentName,
  subjectName,
  onClose,
  onSubmit
}: SelectPCDialogProps) {

  const [availablePcs, setAvailablePcs] = useState<Pc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPcId, setSelectedPcId] = useState<string | null>(null);

  useEffect(() => {

    const fetchPcs = async () => {

      setLoading(true);

      try {

        const allPcs = await getPcsAction();

        const labPcs =
          allPcs.filter(
            pc => pc.labId === labId && pc.status === 'available'
          );

        setAvailablePcs(labPcs);

      } catch {

        toast.error("Failed to load available PCs.");

        onClose();

      } finally {

        setLoading(false);

      }

    };

    fetchPcs();

  }, [labId, onClose]);

  const handleSubmit = () => {

    if (!selectedPcId) {

      toast.warning("Please select a PC for the student.");

      return;

    }

    onSubmit(selectedPcId);

  };

  return (

    <Dialog open={true} onOpenChange={onClose}>

      <DialogContent className="max-w-lg">

        {/* Header */}

        <DialogHeader>

          <DialogTitle className="flex items-center gap-2">

            <Monitor size={20} />

            Assign PC

          </DialogTitle>

          <DialogDescription>

            Select which PC will be used for the lab session.

          </DialogDescription>

        </DialogHeader>

        {/* Student Info */}

        <div className="bg-muted/40 rounded-lg p-4 text-sm">

          <p>

            <b>Student:</b> {studentName}

          </p>

          <p>

            <b>Subject:</b> {subjectName}

          </p>

        </div>

        {/* PC Grid */}

        <div className="py-4">

          {loading ? (

            <div className="flex justify-center items-center h-40">

              <Loader2 className="animate-spin text-primary" />

            </div>

          ) : availablePcs.length === 0 ? (

            <p className="text-center text-muted-foreground">

              No available PCs found in this lab.

            </p>

          ) : (

            <div className="
              grid
              grid-cols-3
              sm:grid-cols-4
              md:grid-cols-5
              gap-3
              max-h-64
              overflow-y-auto
              pr-1
            ">

              {availablePcs.map(pc => {

                const selected = selectedPcId === pc.id;

                return (

                  <Button
                    key={pc.id}
                    variant={selected ? 'default' : 'outline'}
                    onClick={() => setSelectedPcId(pc.id)}
                    className={`
                      flex
                      flex-col
                      h-20
                      transition
                      ${selected ? 'scale-105 shadow-lg' : ''}
                    `}
                  >

                    <Monitor className="h-6 w-6 mb-1" />

                    <span className="font-bold text-xs">

                      PC {pc.pcNumber}

                    </span>

                  </Button>

                );

              })}

            </div>

          )}

        </div>

        {/* Footer */}

        <DialogFooter className="gap-2 sm:gap-0">

          <Button
            variant="ghost"
            onClick={onClose}
          >

            Cancel

          </Button>

          <Button
            onClick={handleSubmit}
            disabled={!selectedPcId || loading}
          >

            Confirm Assignment

          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>

  );

}