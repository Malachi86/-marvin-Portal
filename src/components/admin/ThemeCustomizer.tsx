
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useDesign } from '@/contexts/DesignContext';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { 
  Palette, 
  RotateCcw, 
  Save, 
  Layout, 
  Shapes, 
  Sparkles,
  Loader2,
  Maximize,
  Smartphone,
  Monitor,
  Home,
  MessageCircle,
  ShieldAlert,
  School,
  Settings,
  FileText,
  BarChart3,
  FileCheck,
  Type,
  Droplets,
  Layers,
  X,
  GraduationCap,
  Users,
  BookOpen,
  Scan,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type Role = 'student' | 'teacher' | 'admin' | 'library';

interface NavItem {
  id: string;
  label: string;
  icon: any;
}

const ROLE_NAV: Record<Role, NavItem[]> = {
  student: [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'chat', label: 'Messages', icon: MessageCircle },
    { id: 'grades', label: 'Grade Slip', icon: GraduationCap },
    { id: 'subjects', label: 'My Subjects', icon: BookOpen },
    { id: 'classwork', label: 'Classwork', icon: FileCheck },
    { id: 'request', label: 'Make Request', icon: FileText },
  ],
  teacher: [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'chat', label: 'Messages', icon: MessageCircle },
    { id: 'scanner', label: 'QR Scanner', icon: Scan },
    { id: 'grading', label: 'Grading Console', icon: BarChart3 },
    { id: 'reservations', label: 'Reservations', icon: MapPin },
    { id: 'attendance', label: 'Records', icon: FileCheck },
  ],
  admin: [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'design', label: 'Design Lab', icon: Palette },
    { id: 'security', label: 'Security Center', icon: ShieldAlert },
    { id: 'terms', label: 'Term Management', icon: School },
    { id: 'users', label: 'Manage Users', icon: Users },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ],
  library: [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'books', label: 'Manage Books', icon: BookOpen },
    { id: 'scan-lend', label: 'Scan & Lend', icon: Scan },
    { id: 'requests', label: 'Borrow Requests', icon: FileText },
  ]
};

const ColorInput = React.memo(({ label, value, field, description, onChange }: { 
  label: string, 
  value: string, 
  field: string, 
  description: string,
  onChange: (field: string, val: string) => void 
}) => {
  const [localColor, setLocalColor] = useState(value);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) setLocalColor(value);
  }, [value, isOpen]);

  const handleInteraction = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setLocalColor(newVal);
    onChange(field, newVal);
  };

  return (
    <div className="relative bg-white rounded-theme-xl p-8 shadow-sm border border-primary/5 hover:border-primary/20 transition-all group overflow-hidden">
      <div className="flex justify-between items-start mb-8">
        <div className="space-y-1.5">
          <Label className="font-black uppercase text-sm tracking-widest text-foreground leading-none block">{label}</Label>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider leading-tight">{description}</p>
        </div>
        <div 
          className="h-16 w-16 rounded-theme border-4 border-white shadow-2xl transition-transform group-hover:scale-110 shrink-0" 
          style={{ backgroundColor: localColor }} 
        />
      </div>
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button 
            className="h-24 w-full rounded-theme bg-muted/20 border-2 border-transparent hover:border-primary/10 flex items-center px-8 transition-all active:scale-[0.98]"
          >
            <div className="flex-1 text-center font-black text-2xl tracking-tighter">
              {localColor?.toUpperCase()}
            </div>
            <div className="h-10 w-10 bg-white/40 rounded-full flex items-center justify-center text-foreground/40">
              <Palette size={22} />
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent 
          onInteractOutside={(e) => e.preventDefault()} 
          className="w-[360px] p-0 border-none rounded-theme-xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] overflow-hidden z-[120]"
        >
          <div className="bg-white p-10 space-y-8">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-[0.3em] text-primary">Precision Palette</span>
              <button 
                onClick={() => setIsOpen(false)}
                className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-primary hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="relative aspect-square w-full rounded-theme-lg overflow-hidden border-8 border-muted shadow-inner group">
              <div className="absolute inset-0" style={{ backgroundColor: localColor }} />
              <input 
                type="color" 
                value={localColor} 
                onInput={handleInteraction}
                onChange={handleInteraction}
                className="absolute inset-0 w-full h-full cursor-crosshair opacity-0"
              />
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                 <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center border-2 border-white/40 shadow-2xl">
                    <Droplets size={32} className="text-white drop-shadow-md" />
                 </div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-muted/50 p-3 rounded-full">
              <div className="flex-1 h-14 bg-white rounded-full flex items-center px-8 font-black text-primary tracking-tighter text-xl shadow-inner">
                {localColor.toUpperCase()}
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="h-14 w-14 rounded-full bg-primary text-white shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
              >
                <Save size={24} strokeWidth={3} />
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
});

ColorInput.displayName = 'ColorInput';

export default function ThemeCustomizer() {
  const { config, updateConfig, saveConfig, resetToDefault } = useDesign();
  const [saving, setSaving] = useState(false);
  const [activeRole, setActiveRole] = useState<Role>('student');
  const [activePage, setActivePage] = useState('home');
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await saveConfig();
    setSaving(false);
    toast.success("UI preferences published successfully!");
  };

  const onColorChange = useCallback((field: string, val: string) => {
    updateConfig({ [field]: val });
  }, [updateConfig]);

  const renderPreviewPage = () => {
    switch(activePage) {
      case 'home':
        return (
          <div className="space-y-8 w-full p-8">
            <div className="flex justify-between items-center">
              <div className="h-8 w-48 rounded-md" style={{ backgroundColor: `${config.primary}20` }} />
              <div className="h-10 w-10 rounded-full" style={{ backgroundColor: `${config.accent}20` }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[1,2,3,4].map(i => (
                <Card key={i} className="p-6 border-none shadow-xl rounded-theme">
                  <div className="h-8 w-8 rounded-md mb-4" style={{ backgroundColor: `${config.primary}10` }} />
                  <div className="h-2 w-20 bg-muted-foreground/20 rounded-full" />
                </Card>
              ))}
            </div>
            <Card className="p-8 border-none shadow-2xl rounded-theme-lg">
              <div className="h-4 w-32 bg-primary/10 mb-6 rounded-full" />
              <div className="space-y-4">
                {[1,2].map(i => (
                  <div key={i} className="h-12 w-full bg-muted/30 rounded-theme" />
                ))}
              </div>
            </Card>
          </div>
        );
      default:
        return (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center">
            <div className="h-24 w-24 rounded-theme-xl bg-white/10 flex items-center justify-center mb-6 text-white/20">
              <Layers size={48} />
            </div>
            <h4 className="text-white/40 font-black uppercase text-xs tracking-widest">Workspace Emulator</h4>
            <p className="text-white/20 text-[10px] mt-2 font-bold uppercase tracking-widest">Live Workspace Active</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 h-full relative pb-32">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <h2 className="text-[3.5rem] font-black text-primary tracking-tighter uppercase leading-none">Universal Lab</h2>
          <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-2">Prototype Engine v2.0</p>
        </div>

        <div className="flex gap-4">
          <Button variant="outline" onClick={resetToDefault} className="h-16 px-8 rounded-theme font-black uppercase text-xs tracking-widest gap-2 bg-white shadow-lg border-primary/5 hover:bg-muted">
            <RotateCcw size={18} />
          </Button>
          <Button onClick={handleSave} disabled={saving} className="h-16 px-12 rounded-theme bg-primary text-white font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-primary/20 gap-3">
            {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
            Publish Design
          </Button>
        </div>
      </div>

      <div className="flex justify-center w-full">
        <div className="flex items-center bg-white p-2 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-primary/5 gap-2 max-w-fit px-10">
          {(['student', 'teacher', 'admin', 'library'] as Role[]).map(role => (
            <button 
              key={role}
              onClick={() => { setActiveRole(role); setActivePage('home'); }}
              className={cn(
                "flex items-center gap-3 px-6 py-4 rounded-full transition-all group",
                activeRole === role ? "bg-primary text-white shadow-xl" : "hover:bg-primary/5 text-muted-foreground"
              )}
            >
              <span className="font-black uppercase text-[10px] tracking-widest">{role} Dash</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        <div className="lg:col-span-4 space-y-10 h-[calc(100vh-280px)] overflow-y-auto no-scrollbar pr-4 pb-20">
          
          <Section label="Branding" icon={Palette}>
             <div className="grid grid-cols-1 gap-6">
               <ColorInput label="Primary Brand" value={config.primary} field="primary" description="Main buttons and branding elements" onChange={onColorChange} />
               <ColorInput label="Navigation Sidebar" value={config.sidebar} field="sidebar" description="Background for the left menu panel" onChange={onColorChange} />
               <ColorInput label="Top Header" value={config.header} field="header" description="Background for the top navigation bar" onChange={onColorChange} />
               <ColorInput label="Interactive Accent" value={config.accent} field="accent" description="Highlights and secondary action buttons" onChange={onColorChange} />
               <ColorInput label="Secondary Canvas" value={config.secondary} field="secondary" description="Page background color behind cards" onChange={onColorChange} />
             </div>
          </Section>

          <Section label="Chromatics" icon={Droplets}>
            <div className="space-y-8 p-8 bg-white rounded-theme-xl shadow-xl border border-primary/5">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <Label className="font-black uppercase text-[10px] tracking-widest">Glass Intensity</Label>
                  <Sparkles size={14} className="text-primary" />
                </div>
                <Slider value={[config.glassIntensity]} max={100} step={1} onValueChange={(val) => updateConfig({ glassIntensity: val[0] })} />
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <Label className="font-black uppercase text-[10px] tracking-widest">Corner Geometry</Label>
                  <Shapes size={14} className="text-primary" />
                </div>
                {/* 
                  IMPORTANT: The slider updates the 'radius' value in the config.
                  The DesignContext uses this to set the --radius CSS variable.
                */}
                <Slider value={[config.radius * 10]} max={40} min={0} step={1} onValueChange={(val) => updateConfig({ radius: val[0] / 10 })} />
              </div>
            </div>
          </Section>

          <Section label="Brand Variables" icon={Type}>
            <div className="rounded-theme-xl border-none shadow-xl bg-white p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Campus Label</Label>
                <input 
                  type="text" 
                  value={config.campusLabel || ''}
                  onChange={(e) => updateConfig({ campusLabel: e.target.value })}
                  className="w-full h-12 bg-muted/20 border-none rounded-theme px-4 font-black uppercase text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Logo Scale</Label>
                  <span className="text-[10px] font-bold text-primary">{config.logoScale}%</span>
                </div>
                <Slider value={[config.logoScale || 100]} max={150} min={50} step={5} onValueChange={(val) => updateConfig({ logoScale: val[0] })} />
              </div>
            </div>
          </Section>
        </div>

        <div className={cn(
          "lg:col-span-8 relative transition-all duration-700",
          isPreviewFullscreen ? "fixed inset-0 z-[100] p-12 bg-black/95 backdrop-blur-2xl" : "h-[calc(100vh-280px)]"
        )}>
          <div className={cn(
            "relative h-full rounded-theme-xl border-4 border-dashed border-primary/10 flex items-center justify-center overflow-hidden shadow-inner",
            isMobileView ? "max-w-[400px] mx-auto shadow-3xl border-solid bg-white" : "w-full",
            isPreviewFullscreen ? "bg-white/10 border-none shadow-[0_0_100px_rgba(0,0,0,0.5)] max-w-full" : ""
          )} style={{ backgroundColor: config.secondary }}>
            
            <div className="relative w-full h-full flex flex-col">
              <div className="h-20 w-full shadow-sm flex items-center justify-between px-10 border-b border-primary/5 sticky top-0 z-30 transition-colors" style={{ backgroundColor: config.header }}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-theme bg-white/10 flex items-center justify-center text-white"><Layout size={20}/></div>
                  <div className="h-8 rounded-theme-sm bg-white/10 flex items-center px-4">
                      <span className="text-[9px] font-black text-white uppercase tracking-widest">{config.campusLabel}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {!isMobileView && (
                  <motion.div 
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="w-64 h-full p-6 flex flex-col gap-6 border-r border-white/5 shadow-2xl relative z-20 transition-colors"
                    style={{ backgroundColor: config.sidebar }}
                  >
                    <div className="flex-1 space-y-1">
                      {ROLE_NAV[activeRole].map((item) => (
                        <button 
                          key={item.id} 
                          onClick={() => setActivePage(item.id)}
                          className={cn(
                            "w-full flex items-center gap-4 px-4 py-3 rounded-theme transition-all group",
                            activePage === item.id ? "bg-white/10 text-accent" : "text-white/40 hover:text-white"
                          )}
                        >
                          <item.icon size={18} className={cn(activePage === item.id ? "text-accent" : "text-white/20 group-hover:text-white")} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                <div className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar transition-colors" style={{ backgroundColor: config.secondary }}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${activeRole}-${activePage}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex-1"
                    >
                      {renderPreviewPage()}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-white/90 backdrop-blur-3xl p-4 px-10 rounded-full border border-primary/10 shadow-2xl z-30">
              <Button variant="ghost" onClick={() => setIsMobileView(false)} className={cn("rounded-full h-14 w-14 p-0 transition-all", !isMobileView && "bg-primary text-white shadow-lg scale-110")}>
                <Monitor size={20}/>
              </Button>
              <Button variant="ghost" onClick={() => setIsMobileView(true)} className={cn("rounded-full h-14 w-14 p-0 transition-all", isMobileView && "bg-primary text-white shadow-lg scale-110")}>
                <Smartphone size={20}/>
              </Button>
              <div className="h-8 w-px bg-primary/10" />
              <Button variant={isPreviewFullscreen ? "default" : "ghost"} onClick={() => setIsPreviewFullscreen(!isPreviewFullscreen)} className={cn("rounded-full h-14 px-8 font-black uppercase text-[10px] tracking-[0.2em] gap-3 transition-all", isPreviewFullscreen ? "bg-primary text-white scale-105" : "text-muted-foreground")}>
                {isPreviewFullscreen ? <X size={18}/> : <Maximize size={18}/>} 
                {isPreviewFullscreen ? "EXIT PREVIEW" : "FULLSCREEN"}
              </Button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

function Section({ label, icon: Icon, children }: { label: string, icon: any, children: React.ReactNode }) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3 px-2">
        <div className="h-8 w-8 rounded-theme bg-primary/10 flex items-center justify-center text-primary">
          <Icon size={16} />
        </div>
        <h3 className="font-black uppercase text-[11px] tracking-[0.3em] text-muted-foreground">{label}</h3>
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </section>
  );
}
