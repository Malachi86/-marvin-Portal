
'use client';

import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { BorrowRequest } from '@/utils/storage';
import { getBorrowRequestsAction, updateBorrowRequestAction, updateBookAction, addLibraryBorrowingAction } from '@/app/actions/dbActions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function BorrowRequests() {
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApproveDialogOpen, setApproveDialogOpen] = useState(false);
  const [requestToApprove, setRequestToApprove] = useState<BorrowRequest | null>(null);
  const [daysUntilDue, setDaysUntilDue] = useState('7');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
        const allRequests = await getBorrowRequestsAction();
        setRequests(allRequests.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));
    } catch(e) {
        toast.error("Failed to load requests.");
    } finally {
        setLoading(false);
    }
  };

  const openApproveDialog = (request: BorrowRequest) => {
    setRequestToApprove(request);
    setApproveDialogOpen(true);
  };
  
  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestToApprove) return;
    
    try {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + parseInt(daysUntilDue));

        // Update book status
        await updateBookAction(requestToApprove.bookId, {
            status: 'borrowed',
            borrowerId: requestToApprove.studentId,
            borrowedAt: new Date().toISOString(),
            dueDate: dueDate.toISOString(),
        });
        
        // Update request status
        await updateBorrowRequestAction(requestToApprove.id, {
            status: 'approved',
            approvedAt: new Date().toISOString(),
            dueDate: dueDate.toISOString(),
        });

        // Add to library borrowings record
        await addLibraryBorrowingAction({
            bookId: requestToApprove.bookId,
            studentId: requestToApprove.studentId,
            borrowDate: new Date().toISOString(),
            dueDate: dueDate.toISOString(),
            status: 'borrowed',
        });

        toast.success('Request approved!');
        setApproveDialogOpen(false);
        loadRequests();
    } catch(err) {
        toast.error("Failed to approve request.");
    }
  };

  const handleDecline = async (requestId: string) => {
    if(!confirm("Are you sure you want to decline this request?")) return;
    try {
        await updateBorrowRequestAction(requestId, { status: 'declined' });
        toast.info("Request declined.");
        loadRequests();
    } catch(e) {
        toast.error("Failed to decline request.");
    }
  };

  if(loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary"/></div>

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div>
        <h2 className="text-3xl mb-2">Borrow Requests</h2>
        <p className="text-gray-600 mb-8">Review and process borrow requests</p>

      <div className="space-y-4">
        {pendingRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <FileText size={64} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg">No pending borrow requests</p>
          </div>
        ) : (
          pendingRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl mb-2">{request.bookTitle}</h3>
                  <p className="text-gray-600 mb-1">
                    Student: {request.studentName} ({request.studentId})
                  </p>
                  <p className="text-gray-600 mb-1">Barcode: {request.bookBarcode}</p>
                  <p className="text-sm text-gray-500">
                    Requested: {new Date(request.requestedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => openApproveDialog(request)} className="gap-2 bg-green-600 hover:bg-green-700">
                    <CheckCircle size={18} /> Approve
                  </Button>
                  <Button onClick={() => handleDecline(request.id)} className="gap-2" variant="destructive">
                    <XCircle size={18} /> Decline
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

       <Dialog open={isApproveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Approve Borrow Request</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleApprove} className="space-y-4 pt-4">
                <div>
                  <p>Book: <strong>{requestToApprove?.bookTitle}</strong></p>
                  <p>Student: <strong>{requestToApprove?.studentName}</strong></p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="days">Days until due</Label>
                    <Input id="days" type="number" value={daysUntilDue} onChange={e => setDaysUntilDue(e.target.value)} required />
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                    <Button type="submit">Approve</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
