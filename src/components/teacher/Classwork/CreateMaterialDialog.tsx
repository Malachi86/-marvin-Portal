'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { addMaterialAction } from '@/app/actions/dbActions';
import { toast } from 'sonner';
import { Loader2, FileText, Plus, Link as LinkIcon, Trash2 } from 'lucide-react';

interface CreateMaterialDialogProps {
  subjectId: string;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateMaterialDialog({ subjectId, onClose, onCreated }: CreateMaterialDialogProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [links, setLinks] = useState<{ name: string, url: string }[]>([]);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const addLink = () => {
    if (!newLinkName || !newLinkUrl) {
      toast.error("Please provide both Link Name and URL.");
      return;
    }
    setLinks(prev => [...prev, { name: newLinkName, url: newLinkUrl }]);
    setNewLinkName('');
    setNewLinkUrl('');
  };

  const removeLink = (index: number) => {
    setLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title || links.length === 0) {
      toast.error("Module Title and at least one Link are required.");
      return;
    }
    setLoading(true);
    try {
      await addMaterialAction({
        subjectId,
        teacherId: user.id,
        title,
        description,
        attachments: links, 
      });
      toast.success("Learning Module uploaded successfully!");
      onCreated();
    } catch (err) {
      toast.error("Failed to upload module.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl rounded-t-[2rem] sm:rounded-[2.5rem] p-0 overflow-hidden border-none shadow-3xl flex flex-col h-[95vh] sm:h-[90vh]">
        <div className="bg-primary p-6 md:p-12 text-white relative flex-none">
            <DialogHeader>
                <DialogTitle className="text-2xl md:text-4xl font-black uppercase tracking-tighter flex items-center gap-4">
                    <FileText className="h-8 w-8 md:h-10 md:w-10" /> REGISTER MODULE
                </DialogTitle>
                <DialogDescription className="text-white/80 font-bold uppercase text-[9px] md:text-[11px] tracking-widest mt-2 md:mt-3">
                    SHARE CLOUD ASSETS WITH YOUR STUDENTS
                </DialogDescription>
            </DialogHeader>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-12 space-y-10 bg-white">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">MODULE IDENTIFICATION *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} required className="h-14 md:h-16 rounded-2xl border-none bg-muted/10 px-6 md:px-8 font-bold text-lg" placeholder="e.g. Chapter 1: Intro" />
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">INSTRUCTIONAL NOTES</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} className="rounded-2xl md:rounded-3xl p-6 md:p-8 border-primary/5 bg-white shadow-inner min-h-[120px] font-medium" placeholder="Additional details..." />
          </div>

          <div className="space-y-6 pt-6 md:pt-10 border-t border-primary/5">
              <div className="flex items-center gap-3 px-2">
                  <LinkIcon size={16} className="text-primary" />
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary">MODULE ASSETS (CLOUD LINKS)</Label>
              </div>
              
              <div className="flex flex-col md:flex-row gap-2">
                  <Input placeholder="Link Name" value={newLinkName} onChange={e => setNewLinkName(e.target.value)} className="h-14 rounded-2xl border-none bg-muted/20 px-6 font-bold" />
                  <div className="flex gap-2">
                      <Input placeholder="Cloud URL" value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} className="h-14 rounded-2xl border-none bg-muted/20 px-6 font-bold flex-1" />
                      <Button type="button" onClick={addLink} variant="outline" className="h-14 w-14 rounded-2xl border-primary/10 hover:bg-primary hover:text-white"><Plus size={24} /></Button>
                  </div>
              </div>

              <div className="space-y-3">
                  {links.map((link, i) => (
                      <div key={i} className="flex items-center justify-between p-4 md:p-5 bg-white rounded-2xl border-2 border-primary/5 shadow-sm">
                          <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                              <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0"><LinkIcon size={18} /></div>
                              <div className="overflow-hidden">
                                  <p className="font-black text-xs uppercase tracking-tight leading-none text-foreground truncate">{link.name}</p>
                                  <p className="text-[9px] font-bold text-muted-foreground mt-1.5 truncate max-w-[200px] md:max-w-md">{link.url}</p>
                              </div>
                          </div>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeLink(i)} className="text-red-500"><Trash2 size={18} /></Button>
                      </div>
                  ))}
              </div>
          </div>
        </div>

        <div className="p-6 md:p-10 bg-slate-50/50 border-t border-slate-100 flex-none flex flex-col-reverse sm:flex-row items-center justify-between px-6 md:px-16 gap-4">
            <button type="button" onClick={onClose} className="font-black uppercase text-sm tracking-[0.2em] text-foreground w-full sm:w-auto py-2">CANCEL</button>
            <Button onClick={handleSubmit} disabled={loading} className="w-full sm:w-auto h-14 md:h-20 px-12 md:px-16 rounded-2xl bg-primary text-white font-black uppercase text-sm tracking-[0.2em] shadow-2xl gap-4">
              {loading ? <Loader2 className="animate-spin h-6 w-6" /> : <Plus className="h-6 w-6 mr-2" />} DEPLOY MODULE
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
