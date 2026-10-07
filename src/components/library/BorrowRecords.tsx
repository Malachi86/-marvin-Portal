
'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { LibraryBorrowing } from '@/utils/storage';
import { getLibraryBorrowingsAction, getUsersAction, getBooksAction } from '@/app/actions/dbActions';
import { toast } from 'sonner';

type PopulatedRecord = LibraryBorrowing & {
  bookTitle: string;
  bookBarcode: string;
  studentName: string;
};

export default function BorrowRecords() {
  const [records, setRecords] = useState<PopulatedRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    try {
        const [borrowings, users, books] = await Promise.all([
            getLibraryBorrowingsAction(),
            getUsersAction(),
            getBooksAction()
        ]);
        
        const populated = borrowings.map(rec => {
            const student = users.find(u => u.id === rec.studentId);
            const book = books.find(b => b.id === rec.bookId);
            return {
                ...rec,
                studentName: student?.name || 'Unknown',
                bookTitle: book?.title || 'Unknown',
                bookBarcode: book?.barcode || 'Unknown',
            }
        });

        setRecords(populated.sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime()));
    } catch(e) {
        toast.error("Failed to load records.");
    } finally {
        setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary"/></div>

  return (
    <div>
      <h2 className="text-3xl mb-2">Borrow Records</h2>
      <p className="text-gray-600 mb-8">Complete history of book borrowing</p>

      <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-4 text-left">Book</th>
              <th className="px-4 py-4 text-left">Barcode</th>
              <th className="px-4 py-4 text-left">Student</th>
              <th className="px-4 py-4 text-left">Borrowed</th>
              <th className="px-4 py-4 text-left">Due Date</th>
              <th className="px-4 py-4 text-left">Returned</th>
              <th className="px-4 py-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              const isOverdue = !record.returnDate && new Date() > new Date(record.dueDate);
              const isActive = !record.returnDate;

              return (
                <tr key={record.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-4">{record.bookTitle}</td>
                  <td className="px-4 py-4">{record.bookBarcode}</td>
                  <td className="px-4 py-4">
                    {record.studentName}<br />
                    <span className="text-sm text-gray-500">({record.studentId})</span>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {new Date(record.borrowDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {new Date(record.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {record.returnDate ? new Date(record.returnDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      isOverdue ? 'bg-red-100 text-red-800' :
                      isActive ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {isOverdue ? 'Overdue' : isActive ? 'Active' : 'Returned'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
