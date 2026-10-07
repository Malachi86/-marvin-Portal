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

interface StudentPCDialogProps {
  labId: string;
  onClose: () => void;
  onSubmit: (pcId: string) => void;
}

export default function StudentPCDialog({
  labId,
  onClose,
  onSubmit
}: StudentPCDialogProps) {

  const [availablePcs,setAvailablePcs] = useState<Pc[]>([]);
  const [loading,setLoading] = useState(true);
  const [selectedPcId,setSelectedPcId] = useState<string | null>(null);

  useEffect(()=>{

    const fetchPcs = async () => {

      setLoading(true);

      try{

        const allPcs = await getPcsAction();

        const labPcs =
          allPcs.filter(
            pc =>
              pc.labId === labId &&
              pc.status === 'available'
          );

        setAvailablePcs(labPcs);

      }catch{

        toast.error("Failed to load available PCs.");

        onClose();

      }finally{

        setLoading(false);

      }

    };

    fetchPcs();

  },[labId,onClose]);

  const handleSubmit = () => {

    if(!selectedPcId){

      toast.warning("Please select a PC to proceed.");

      return;

    }

    onSubmit(selectedPcId);

  };

  return (

    <Dialog open={true} onOpenChange={onClose}>

      <DialogContent
        className="
        max-w-lg
        "
      >

        {/* Header */}

        <DialogHeader>

          <DialogTitle className="flex items-center gap-2">

            <Monitor size={18}/>

            Select Your PC

          </DialogTitle>

          <DialogDescription>

            Choose the computer you will use for this lab session.

          </DialogDescription>

        </DialogHeader>

        {/* PC GRID */}

        <div className="py-4">

          {loading ? (

            <div className="flex justify-center items-center h-40">

              <Loader2
                className="animate-spin text-primary"
                size={28}
              />

            </div>

          ) : availablePcs.length === 0 ? (

            <p className="
            text-center
            text-muted-foreground
            py-6
            ">

              No available PCs in this lab.

            </p>

          ) : (

            <div
              className="
              grid
              grid-cols-3
              sm:grid-cols-4
              md:grid-cols-5
              gap-3
              max-h-72
              overflow-y-auto
              pr-1
              "
            >

              {availablePcs.map(pc=>{

                const selected =
                  selectedPcId === pc.id;

                return(

                  <button
                    key={pc.id}
                    onClick={()=>setSelectedPcId(pc.id)}
                    className={`
                    flex
                    flex-col
                    items-center
                    justify-center
                    gap-1
                    h-20
                    border
                    rounded-lg
                    transition
                    ${
                      selected
                        ? 'bg-primary text-white border-primary'
                        : 'hover:bg-muted'
                    }
                    `}
                  >

                    <Monitor size={18}/>

                    <span className="text-sm font-semibold">

                      PC {pc.pcNumber}

                    </span>

                  </button>

                );

              })}

            </div>

          )}

        </div>

        {/* Footer */}

        <DialogFooter
          className="
          flex
          flex-col
          sm:flex-row
          gap-2
          "
        >

          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >

            Cancel

          </Button>

          <Button
            onClick={handleSubmit}
            disabled={!selectedPcId || loading}
            className="w-full sm:w-auto"
          >

            Confirm PC

          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>

  );

}