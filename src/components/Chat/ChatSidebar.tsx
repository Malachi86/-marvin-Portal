'use client';

import React, { useState, useMemo } from 'react';
import { Conversation, User } from '@/utils/storage';
import {
  Hash,
  Plus,
  ChevronDown,
  Search,
  Volume2,
  Settings,
  X
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';

import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ChatSidebarProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conv: Conversation) => void;
  onStartDM: (userId: string) => void;
  users: User[];
  isOpen?: boolean;
  onClose?: () => void;
}

export default function ChatSidebar({
  conversations,
  selectedId,
  onSelect,
  onStartDM,
  users,
  isOpen,
  onClose
}: ChatSidebarProps) {

  const { user } = useAuth();

  const [dmSearch, setDmSearch] = useState('');

  const subjectConvs = useMemo(
    () => conversations.filter(
      c => c.type === 'subject' || c.type === 'general'
    ),
    [conversations]
  );

  const privateConvs = useMemo(
    () => conversations.filter(c => c.type === 'private'),
    [conversations]
  );

  const uniqueUsers = useMemo(() => {
    return Array.from(
      new Map(users.map(u => [u.id, u])).values()
    );
  }, [users]);

  const filteredUsers = useMemo(() => {
    return uniqueUsers.filter(u => {
      const name = u.name || "";
      const id = u.id || "";
      const searchTerm = dmSearch.toLowerCase();
      
      return u.id !== user?.id &&
      (
        name.toLowerCase().includes(searchTerm) ||
        id.toLowerCase().includes(searchTerm)
      );
    });
  }, [dmSearch, uniqueUsers, user]);

  return (
    <div className={cn(
      "w-72 bg-[#14343A] flex flex-col border-r border-white/5 shrink-0 transition-all duration-300 ease-in-out",
      "fixed inset-y-0 left-0 z-[70] md:relative md:translate-x-0 md:w-72",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      {/* SERVER HEADER */}
      <div className="h-16 px-4 border-b border-white/5 flex items-center justify-between hover:bg-white/5 transition cursor-pointer group">
        <span className="text-white font-black text-sm uppercase tracking-tight">Academic Hub</span>
        <button onClick={onClose} className="md:hidden text-white/50 hover:text-white">
          <X size={20}/>
        </button>
        <ChevronDown size={16} className="hidden md:block text-white/50 group-hover:text-white" />
      </div>

      {/* CHANNEL LIST */}
      <div className="flex-1 overflow-y-auto py-4 space-y-6 no-scrollbar">
        {/* SUBJECT CHANNELS */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between text-white/40 uppercase font-black text-[10px] tracking-widest">
            <div className="flex items-center gap-1">
              <ChevronDown size={12}/>
              SUBJECT CHANNELS
            </div>
            <Plus size={14} className="cursor-pointer hover:text-white" />
          </div>
          <div className="space-y-1 px-2">
            {subjectConvs.map(conv => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition",
                  selectedId === conv.id 
                    ? 'bg-white/10 text-white' 
                    : 'text-white/50 hover:bg-white/5 hover:text-white'
                )}
              >
                <Hash size={18} className={cn(selectedId === conv.id ? "text-white" : "text-white/30")} />
                <span className="text-sm font-bold truncate">{conv.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* DIRECT MESSAGES */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between text-white/40 uppercase font-black text-[10px] tracking-widest">
            <div className="flex items-center gap-1">
              <ChevronDown size={12}/>
              DIRECT MESSAGES
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Plus size={14} className="cursor-pointer hover:text-white transition" />
              </DialogTrigger>
              <DialogContent className="bg-[#14343A] border-none text-white rounded-[2rem] p-10 shadow-2xl w-[90vw] max-w-lg z-[110]">
                <DialogHeader>
                  <DialogTitle className="font-black text-3xl uppercase tracking-tighter mb-8 text-white">START A CONVERSATION</DialogTitle>
                </DialogHeader>
                <div className="space-y-8">
                  <div className="relative group">
                    <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent transition-colors" />
                    <Input 
                      placeholder="Search name or ID..." 
                      className="bg-black/20 border-2 border-primary focus:ring-0 focus:border-accent rounded-2xl pl-14 h-16 text-white text-lg font-bold transition-all shadow-xl placeholder:text-white/10" 
                      value={dmSearch} 
                      onChange={(e)=>setDmSearch(e.target.value)} 
                    />
                  </div>
                  <div className="max-h-[450px] overflow-y-auto space-y-3 no-scrollbar pr-2">
                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-16">
                        <Search size={48} className="mx-auto text-white/5 mb-4" />
                        <p className="text-white/20 text-xs font-black uppercase tracking-widest">No matching identities found</p>
                      </div>
                    ) : (
                      filteredUsers.map(u => (
                        <button 
                          key={u.id} 
                          onClick={() => { onStartDM(u.id); setDmSearch(''); }} 
                          className="w-full flex items-center gap-5 p-4 rounded-2xl hover:bg-white/5 transition-all group active:scale-[0.98]"
                        >
                          <Avatar className="h-14 w-14 border-2 border-white/5 group-hover:border-primary transition-colors">
                            <AvatarImage src={u.profilePic}/>
                            <AvatarFallback className="bg-primary text-white font-black text-lg">{u.name?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="text-left flex-1 overflow-hidden">
                            <p className="text-lg font-black text-white truncate group-hover:text-primary transition-colors">{u.name}</p>
                            <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-0.5">{(u.role || '').replace('_', ' ')} • {u.id}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-1 px-2">
            {privateConvs.map(conv => {
              const otherId = conv.memberIds.find(id => id !== user?.id);
              const otherUser = users.find(u => u.id === otherId);
              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv)}
                  className={cn(
                    "w-full flex items-center gap-3 px-2 py-2 rounded-md transition",
                    selectedId === conv.id ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={otherUser?.profilePic}/>
                    <AvatarFallback className="bg-primary text-white font-black text-xs">{otherUser?.name?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left overflow-hidden">
                    <p className="text-sm font-bold truncate leading-none mb-1">{otherUser?.name || conv.name}</p>
                    <p className="text-[10px] text-white/30 truncate leading-none font-medium">{conv.lastMessage || "Start chatting"}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* USER FOOTER */}
      <div className="bg-[#14343A] p-2 h-16 flex items-center gap-2 border-t border-white/5">
        <div className="flex-1 flex items-center gap-3 p-1.5 hover:bg-white/5 rounded-lg transition-colors cursor-pointer group">
          <div className="relative">
            <Avatar className="h-9 w-9 border border-white/10">
              <AvatarImage src={user?.profilePic}/>
              <AvatarFallback className="bg-primary text-white font-black text-xs">{user?.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-accent rounded-full border-2 border-black flex items-center justify-center shadow-lg">
              <div className="w-1.5 h-1.5 bg-background rounded-full animate-pulse" />
            </div>
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-black text-white truncate leading-none mb-1 uppercase tracking-tight">{user?.name || 'User'}</p>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-none truncate">{user?.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 pr-1">
          <button className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-md transition-all">
            <Volume2 size={18}/>
          </button>
          <button className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-md transition-all">
            <Settings size={18}/>
          </button>
        </div>
      </div>
    </div>
  );
}
