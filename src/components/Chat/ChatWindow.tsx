'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Conversation, ChatMessage, User } from '@/utils/storage';
import { Hash, MoreVertical, PlusCircle, Smile, Send, User as UserIcon, FileIcon, FileText, FileImage, Download, Zap, Gem, Loader2, Menu, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { compressImage } from '@/lib/compression';

interface ChatWindowProps {
    conversation: Conversation;
    messages: ChatMessage[];
    users: User[];
    onSend: (text: string, file?: { name: string, data: string }) => void;
    onToggleSidebar?: () => void;
}

const EMOJIS = ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖'];

export default function ChatWindow({ conversation, messages, users, onSend, onToggleSidebar }: ChatWindowProps) {
    const { user } = useAuth();
    const [inputText, setInputText] = useState('');
    const [showNitro, setShowNitro] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isPartnerActive = useMemo(() => {
        if (conversation.type !== 'private') return true;
        
        const otherId = conversation.memberIds.find(id => id !== user?.id);
        const partner = users.find(u => u.id === otherId);
        
        if (!partner?.lastSeen) return false;
        
        const lastSeen = new Date(partner.lastSeen);
        const now = new Date();
        return (now.getTime() - lastSeen.getTime()) < 120000; 
    }, [conversation, users, user?.id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: messages.length > 20 ? 'auto' : 'smooth'
            });
        }
    }, [messages.length]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSend = () => {
        const trimmed = inputText.trim();
        if (trimmed) {
            onSend(trimmed);
            setInputText('');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            let data = reader.result as string;
            if (file.type.startsWith('image/')) {
                // Apply Neural Compression before sending to save GB
                data = await compressImage(data);
            }
            onSend('', { name: file.name, data });
        };
        reader.readAsDataURL(file);
    };

    const addEmoji = (emoji: string) => {
        setInputText(prev => prev + emoji);
    };

    const isImage = (fileName?: string) => {
        if (!fileName) return false;
        const ext = fileName.split('.').pop()?.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
    };

    const getFileIcon = (fileName?: string) => {
        if (!fileName) return <FileIcon size={20} />;
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return <FileImage size={20} />;
        if (ext === 'pdf') return <FileText size={20} />;
        if (['doc', 'docx'].includes(ext || '')) return <FileText size={20} />;
        return <FileIcon size={20} />;
    };

    const renderedMessages = useMemo(() => {
        return messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            const isOptimistic = msg.id.startsWith('TEMP-');
            const senderProfile = users.find(u => u.id === msg.senderId);
            const msgIsImage = isImage(msg.fileName);
            
            return (
                <div 
                    key={msg.id} 
                    className={cn(
                        "flex items-start gap-4 transition-opacity duration-300",
                        isMe ? "flex-row-reverse" : "flex-row",
                        isOptimistic ? "opacity-60" : "opacity-100"
                    )}
                >
                    {!isMe && (
                        <Avatar className="h-10 w-10 shrink-0 border-2 border-white/5">
                            <AvatarImage src={senderProfile?.profilePic} />
                            <AvatarFallback className="bg-primary text-white font-black uppercase text-[10px]">{msg.senderName[0]}</AvatarFallback>
                        </Avatar>
                    )}

                    <div className={cn(
                        "flex flex-col max-w-[85%] md:max-w-[70%] space-y-1",
                        isMe ? "items-end" : "items-start"
                    )}>
                        <div className={cn(
                            "flex items-baseline gap-2",
                            isMe ? "flex-row-reverse" : "flex-row"
                        )}>
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                                {msg.senderName}
                            </span>
                            <span className="text-[8px] font-bold text-white/20 uppercase">
                                {isOptimistic ? 'Processing Payload...' : format(new Date(msg.timestamp), 'h:mm a')}
                            </span>
                        </div>

                        <div className={cn(
                            "px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap transition-all shadow-xl",
                            isMe 
                                ? "bg-primary text-white rounded-tr-none" 
                                : "bg-white/10 text-white/90 rounded-tl-none border border-white/5"
                        )}>
                            {msg.text}

                            {msg.fileUrl && (
                                <div className="mt-2 min-w-[200px]">
                                    {msg.fileUrl === 'pending' ? (
                                        <div className="flex items-center gap-3 p-3 bg-black/20 rounded-xl border border-white/5">
                                            <Loader2 className="animate-spin text-white/40 h-5 w-5"/>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Encrypting File...</span>
                                        </div>
                                    ) : msgIsImage ? (
                                        <div className="relative group">
                                            <img 
                                                src={msg.fileUrl} 
                                                alt="uploaded" 
                                                className="max-w-full rounded-lg shadow-sm max-h-60 object-cover border border-white/10" 
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                                                <Button size="icon" variant="ghost" className="h-10 w-10 bg-white/10 hover:bg-white/20 text-white" onClick={() => window.open(msg.fileUrl!, '_blank')}>
                                                    <Eye size={18} />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-10 w-10 bg-white/10 hover:bg-white/20 text-white" asChild>
                                                    <a href={msg.fileUrl} download={msg.fileName}><Download size={18} /></a>
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={cn(
                                            "rounded-xl p-3 border inline-flex items-center gap-3 w-full",
                                            isMe ? "bg-white/10 border-white/10" : "bg-black/20 border-white/5"
                                        )}>
                                            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                                                {getFileIcon(msg.fileName)}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-white font-bold text-[11px] truncate">{msg.fileName || 'Shared File'}</p>
                                                <p className="text-white/30 text-[8px] uppercase font-black tracking-widest">
                                                    Click to download
                                                </p>
                                            </div>
                                            <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-full text-white/40 hover:text-white hover:bg-white/10">
                                                <a href={msg.fileUrl} download={msg.fileName}>
                                                    <Download size={14} />
                                                </a>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        });
    }, [messages, user?.id, users]);

    const otherUser = useMemo(() => {
        if (conversation.type !== 'private') return null;
        const otherId = conversation.memberIds.find(id => id !== user?.id);
        return users.find(u => u.id === otherId);
    }, [conversation, users, user?.id]);

    return (
        <div className="flex-1 flex flex-col h-full bg-[#14343A] overflow-hidden">
            {/* Chat Header */}
            <div className="h-16 px-4 md:px-6 shadow-md border-b border-white/5 flex items-center justify-between bg-[#14343A]/95 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={onToggleSidebar}
                        className="md:hidden h-10 w-10 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
                        {conversation.type === 'private' ? (
                            <UserIcon size={20} />
                        ) : (
                            <Hash size={20} />
                        )}
                    </div>
                    <div className="overflow-hidden">
                        <span className="text-white font-black text-sm uppercase tracking-tighter block truncate">
                            {conversation.type === 'private' ? otherUser?.name : conversation.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <div className={cn("w-2 h-2 rounded-full", isPartnerActive ? "bg-accent animate-pulse" : "bg-white/10")} />
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">
                                {isPartnerActive ? "Authorized Workspace" : "Encrypted Workspace"}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-white/40">
                    <button className="hover:text-white transition-all hover:bg-white/5 p-2 rounded-full"><MoreVertical size={20}/></button>
                </div>
            </div>

            {/* Messages Area */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 no-scrollbar scroll-smooth"
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 p-8">
                        <div className="h-24 w-24 rounded-[2.5rem] bg-white/5 flex items-center justify-center text-white/10 shadow-2xl border border-white/5 rotate-3">
                            {conversation.type === 'private' ? <UserIcon size={48}/> : <Hash size={48}/>}
                        </div>
                        <div>
                            <h3 className="text-white font-black text-3xl tracking-tighter uppercase leading-none mb-2">Workspace Initialized</h3>
                            <p className="text-white/20 font-bold uppercase text-[10px] tracking-[0.3em]">Establishing secure connection with #{conversation.name}</p>
                        </div>
                    </div>
                ) : renderedMessages}
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-8 bg-[#14343A]">
                <div className="bg-white/5 rounded-[1.5rem] px-4 py-2 flex items-center gap-3 md:gap-4 border border-white/5 focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-2xl">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp,.xls,.xlsx,.ppt,.pptx"
                        className="hidden" 
                    />
                    
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="h-10 w-10 rounded-full flex items-center justify-center text-white/40 hover:text-accent hover:bg-accent/10 transition-all"
                        >
                            <PlusCircle size={22}/>
                        </button>
                        <button 
                            onClick={() => setShowNitro(true)}
                            className="hidden sm:flex h-10 w-10 rounded-full items-center justify-center text-accent hover:bg-accent/10 transition-all"
                        >
                            <Zap size={22} fill="currentColor" className="opacity-50" />
                        </button>
                    </div>

                    <textarea 
                        rows={1}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`Message ${conversation.type === 'private' ? '@' + (otherUser?.name || 'User') : '#' + conversation.name}`}
                        className="flex-1 bg-transparent text-white border-none outline-none resize-none font-bold text-sm no-scrollbar placeholder:text-white/10 py-3"
                    />

                    <div className="flex items-center gap-1">
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="h-10 w-10 rounded-full flex items-center justify-center text-white/40 hover:text-accent hover:bg-accent/10 transition-all">
                                    <Smile size={22}/>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] md:w-96 bg-[#14343A] border-none p-6 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] mb-4">
                                <div className="grid grid-cols-6 md:grid-cols-8 gap-3 max-h-72 overflow-y-auto pr-2 no-scrollbar">
                                    {EMOJIS.map((emoji, index) => (
                                        <button 
                                            key={`${emoji}-${index}`} 
                                            onClick={() => addEmoji(emoji)}
                                            className="text-2xl hover:bg-white/10 rounded-xl p-2 transition-all active:scale-90"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        <button 
                            onClick={handleSend} 
                            disabled={!inputText.trim()}
                            className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center transition-all",
                                inputText.trim() ? "text-accent scale-110 shadow-lg shadow-accent/20" : "text-white/10"
                            )}
                        >
                            <Send size={22} className={cn(inputText.trim() && "animate-in zoom-in")} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Nitro Perks Dialog */}
            <Dialog open={showNitro} onOpenChange={setShowNitro}>
                <DialogContent className="bg-[#14343A] border-none text-white rounded-[3rem] p-10 max-w-[90vw] md:max-w-[480px] shadow-2xl">
                    <div className="flex flex-col items-center text-center">
                        <div className="h-24 w-24 bg-accent rounded-[2.5rem] mb-8 flex items-center justify-center text-secondary shadow-2xl shadow-accent/30 rotate-3">
                            <Zap size={48} fill="currentColor" />
                        </div>
                        
                        <DialogTitle className="text-3xl md:text-[2.8rem] font-black uppercase tracking-tighter leading-none mb-4">
                            ACADEMIC NITRO
                        </DialogTitle>
                        <p className="text-accent font-black uppercase tracking-[0.2em] text-[11px] mb-10">
                            UNLEASH ULTIMATE ACADEMIC POWER
                        </p>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center gap-5 bg-white/5 p-6 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-xl shrink-0"><Download size={24} className="text-white"/></div>
                            <div className="flex-1">
                                <p className="font-black text-[13px] uppercase tracking-wide">MAXIMUM PAYLOAD</p>
                                <p className="text-white/40 text-[11px] font-bold mt-0.5">Share massive datasets up to 1GB.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-5 bg-white/5 p-6 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center shadow-xl shrink-0"><Gem size={24} className="text-white"/></div>
                            <div className="flex-1">
                                <p className="font-black text-[13px] uppercase tracking-wide">CUSTOM EMBLEMS</p>
                                <p className="text-white/40 text-[11px] font-bold mt-0.5">Stylize your workspace identity.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10">
                        <Button className="w-full h-16 bg-accent hover:bg-accent/90 text-white font-black uppercase text-sm tracking-[0.2em] rounded-2xl shadow-2xl shadow-accent/20 transition-transform active:scale-95">
                            UPGRADE WORKSPACE
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
