'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BookOpen, 
  Search, 
  Library as LibraryIcon, 
  Send, 
  CheckCircle, 
  Clock, 
  History, 
  Bookmark, 
  AlertCircle,
  Loader2,
  Download
} from 'lucide-react';
import { Book, BorrowRequest, LibraryBorrowing } from '@/utils/storage';
import { getBooksAction, getBorrowRequestsAction, addBorrowRequestAction, getLibraryBorrowingsAction } from '@/app/actions/dbActions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function Library() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState('');
  const [myRequests, setMyRequests] = useState<BorrowRequest[]>([]);
  const [myBorrowings, setMyBorrowings] = useState<LibraryBorrowing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [allBooks, allRequests, allBorrowings] = await Promise.all([
        getBooksAction(),
        getBorrowRequestsAction(),
        getLibraryBorrowingsAction()
      ]);

      setBooks(allBooks);
      setMyRequests(allRequests.filter(r => r.studentId === user.id));
      setMyBorrowings(allBorrowings.filter(b => b.studentId === user.id));
    } catch (e) {
      toast.error("Failed to sync library data.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleRequestBorrow = async (book: Book) => {
    if (!user) return;

    const existingRequest = myRequests.find(r => r.bookId === book.id && (r.status === 'pending' || r.status === 'approved'));
    if (existingRequest) {
      toast.warning(`Protocol Active: You already have a '${existingRequest.status}' request for this asset.`);
      return;
    }

    if (!confirm(`Confirm request to borrow "${book.title.toUpperCase()}"?`)) return;

    try {
      await addBorrowRequestAction({
        bookId: book.id,
        bookBarcode: book.barcode,
        bookTitle: book.title,
        studentId: user.id,
        studentName: user.name,
        requestedAt: new Date().toISOString(),
        status: 'pending'
      });
      toast.success("Request Transmitted! Awaiting librarian validation.");
      loadData();
    } catch(e) {
      toast.error("Transmission failed.");
    }
  }

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(search.toLowerCase()) || 
    b.author.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'declined': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-32 space-y-4">
      <Loader2 className="animate-spin h-12 w-12 text-primary" />
      <p className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Accessing Knowledge Base...</p>
    </div>
  );
  
  return (
    <div className="max-w-[1400px] mx-auto space-y-10 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col gap-1">
        <h1 className="text-[3.5rem] font-black text-primary tracking-tighter uppercase leading-none">Library Hub</h1>
        <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-2">Academic Resource Inventory</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Column: Catalogue */}
        <div className="lg:col-span-7 space-y-10">
          <Card className="rounded-[3rem] border-none shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] overflow-hidden bg-white">
            <div className="h-2 bg-primary" />
            <CardContent className="p-10 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                    <Search size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">Browse Catalogue</h3>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">SEARCH BY TITLE, AUTHOR, OR BARCODE</p>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/20 group-focus-within:text-primary transition-colors" size={24} />
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Query collection..."
                  className="h-20 pl-16 pr-8 rounded-[1.5rem] border-2 border-primary/5 bg-slate-50/50 shadow-inner font-bold text-lg focus:ring-0 focus:border-primary/20 transition-all placeholder:text-muted-foreground/30"
                />
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto no-scrollbar pr-2">
                {filteredBooks.length === 0 ? (
                  <div className="py-20 text-center border-4 border-dashed rounded-[2.5rem] border-black/5">
                    <BookOpen size={48} className="mx-auto text-muted-foreground opacity-10 mb-4" />
                    <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em]">No matching assets found</p>
                  </div>
                ) : (
                  filteredBooks.map(book => (
                    <div key={book.id} className="p-8 rounded-[2rem] bg-white border border-primary/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-start gap-6">
                        <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors shadow-inner">
                          <Bookmark size={24} />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-black text-xl text-primary uppercase leading-tight tracking-tight group-hover:scale-[1.01] transition-transform origin-left">{book.title}</h4>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Author: {book.author}</p>
                          <div className="flex items-center gap-2 pt-2">
                            <Badge className={cn(
                              "px-3 py-1 rounded-full font-black text-[8px] uppercase tracking-widest border-none shadow-sm",
                              book.status === 'available' ? "bg-green-500 text-white" : "bg-primary text-white"
                            )}>
                              {book.status === 'available' ? 'IN STOCK' : 'BORROWED'}
                            </Badge>
                            <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">ID: {book.barcode}</span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleRequestBorrow(book)} 
                        disabled={book.status !== 'available'}
                        className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:grayscale"
                      >
                        <Send size={16} className="mr-2" /> REQUEST ASSET
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Personal Activity */}
        <div className="lg:col-span-5 space-y-10">
          
          {/* Active Loans Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 ml-2">
              <CheckCircle className="text-primary h-5 w-5" />
              <h2 className="text-xl font-black uppercase tracking-widest text-primary">ACTIVE LOANS</h2>
            </div>

            <div className="space-y-4">
              {myBorrowings.filter(b => b.status === 'borrowed').length === 0 ? (
                <div className="p-12 text-center border-4 border-dashed rounded-[3rem] border-black/5 bg-white/50">
                  <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em]">No active holdings</p>
                </div>
              ) : (
                myBorrowings.filter(b => b.status === 'borrowed').map(borrowing => {
                  const book = books.find(b => b.id === borrowing.bookId);
                  return (
                    <Card key={borrowing.id} className="rounded-[2.5rem] border-none shadow-[0_15px_40px_-10px_rgba(0,0,0,0.08)] bg-white overflow-hidden group">
                      <div className="p-8 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="h-12 w-12 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0 shadow-lg border-4 border-green-50">
                            <LibraryIcon size={18} />
                          </div>
                          <div>
                            <h3 className="text-lg font-black uppercase tracking-tight text-foreground leading-none">{book?.title || 'Unknown Asset'}</h3>
                            <div className="flex items-center gap-2 text-[9px] font-bold text-red-500 uppercase tracking-widest mt-2 bg-red-50 px-2 py-1 rounded-full w-fit border border-red-100">
                              <Clock size={10} />
                              DUE: {new Date(borrowing.dueDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* Request Registry Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 ml-2">
              <History className="text-muted-foreground h-5 w-5" />
              <h2 className="text-xl font-black uppercase tracking-widest text-muted-foreground">REQUEST REGISTRY</h2>
            </div>

            <div className="space-y-4">
              {myRequests.length === 0 ? (
                <div className="p-12 text-center border-4 border-dashed rounded-[3rem] border-black/5 bg-white/50">
                  <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em]">Registry clear</p>
                </div>
              ) : (
                myRequests.map((request) => (
                  <Card key={request.id} className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="p-6 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                          <History size={16} />
                        </div>
                        <div className="overflow-hidden">
                          <h3 className="text-sm font-black uppercase tracking-tight text-foreground truncate max-w-[200px]">{request.bookTitle}</h3>
                          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Requested: {new Date(request.requestedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Badge className={cn(
                        "px-4 py-1.5 rounded-full font-black text-[8px] uppercase tracking-widest border shadow-none",
                        getStatusColor(request.status)
                      )}>
                        {request.status}
                      </Badge>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div className="p-10 bg-[#E5EAEB] rounded-[3rem] border-2 border-primary/5 flex items-start gap-6 shadow-inner">
            <div className="h-12 w-12 rounded-[1.25rem] bg-white flex items-center justify-center text-primary shadow-lg border border-primary/5 shrink-0"><AlertCircle size={24} /></div>
            <div>
              <h4 className="font-black uppercase tracking-tight text-primary text-lg">Knowledge Protocol</h4>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed mt-2">
                All borrowing requests must be validated by the head librarian. Ensure you return items before the due date to avoid account restrictions.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
