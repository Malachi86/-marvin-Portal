'use client';
import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Edit, Loader2, Scan } from 'lucide-react';
import { Book } from '@/utils/storage';
import { getBooksAction, addBookAction, updateBookAction, deleteBookAction } from '@/app/actions/dbActions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BarcodeScanner from './BarcodeScanner';

export default function ManageBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState({ id: '', barcode: '', title: '', author: '' });
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    setLoading(true);
    try {
        const booksData = await getBooksAction();
        setBooks(booksData);
    } catch(e) {
        toast.error("Failed to load books.");
    } finally {
        setLoading(false);
    }
  };

  const handleOpenDialog = (book: Book | null) => {
    setEditingBook(book);
    if (book) {
        setFormData({ id: book.id, barcode: book.barcode, title: book.title, author: book.author });
    } else {
        setFormData({ id: '', barcode: '', title: '', author: '' });
    }
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.barcode || !formData.title) {
      toast.error('Please fill barcode and title');
      return;
    }
    
    try {
        if (editingBook) {
            await updateBookAction(editingBook.id, formData);
            toast.success("Book updated!");
        } else {
            await addBookAction({ 
                barcode: formData.barcode, 
                title: formData.title, 
                author: formData.author, 
                status: 'available' 
            });
            toast.success("Book added!");
        }
        setDialogOpen(false);
        loadBooks();
    } catch (err) {
        toast.error("Failed to save book.");
    }
  };

  const handleDelete = async (book: Book) => {
    if (!window.confirm(`Delete "${book.title}"? This cannot be undone.`)) return;

    try {
        await deleteBookAction(book.id);
        toast.success("Book deleted.");
        loadBooks();
    } catch(e) {
        toast.error("Failed to delete book.");
    }
  };

  const handleScanResult = (scannedBarcode: string) => {
    setFormData(prev => ({ ...prev, barcode: scannedBarcode }));
    setShowScanner(false);
  };

  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>

  return (
    <div>
      {showScanner && <BarcodeScanner onScan={handleScanResult} onCancel={() => setShowScanner(false)} />}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl mb-2">Manage Books</h2>
          <p className="text-gray-600">Add and manage library books</p>
        </div>
        <Button onClick={() => handleOpenDialog(null)} className="gap-2">
            <Plus size={20} />
            Add Book
        </Button>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left">Barcode</th>
              <th className="px-6 py-4 text-left">Title</th>
              <th className="px-6 py-4 text-left">Author</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-left">Borrowed By</th>
              <th className="px-6 py-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book.id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-4">{book.barcode}</td>
                <td className="px-6 py-4">{book.title}</td>
                <td className="px-6 py-4">{book.author || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm capitalize ${
                    book.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {book.status}
                  </span>
                </td>
                <td className="px-6 py-4">{book.borrowerId || '-'}</td>
                <td className="px-6 py-4 flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleOpenDialog(book)}><Edit className="h-4 w-4"/></Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDelete(book)}><Trash2 className="h-4 w-4"/></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingBook ? "Edit Book" : "Add New Book"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 pt-4">
                <div className="space-y-2">
                    <Label htmlFor="barcode">Barcode</Label>
                    <div className="relative">
                      <Input id="barcode" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} required />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={() => setShowScanner(true)}
                      >
                        <Scan className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="author">Author</Label>
                    <Input id="author" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} />
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                    <Button type="submit">Save Book</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
