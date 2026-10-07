'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  ChevronRight, 
  ChevronLeft, 
  HelpCircle, 
  BookOpen, 
  QrCode, 
  ShieldCheck, 
  GraduationCap,
  Monitor,
  CheckCircle2,
  Settings,
  Scan,
  MessageCircle,
  FileText,
  BarChart3,
  Users,
  Search,
  History,
  Palette,
  Clock,
  Zap,
  Lock,
  LogOut,
  Smartphone,
  School,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Step {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function UserGuide({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  const getSteps = (): Step[] => {
    if (!user) return [];

    const commonSteps: Step[] = [
      {
        title: "Welcome to AMS:AMACC",
        description: "Your centralized Academic Management System. This guide provides a full operational walkthrough of your dashboard, sidebar features, and core protocols like attendance and enrollment.",
        icon: <HelpCircle className="w-12 h-12 text-primary" />
      },
      {
        title: "Account & Digital ID Protocol",
        description: "Your Digital ID is your universal key. Accessible via the 'QR icon' in the top header or your 'Profile' in the sidebar. This ID must be scanned by Guards at the gate and Teachers in the classroom to verify your identity and log your presence.",
        icon: <QrCode className="w-12 h-12 text-primary" />
      }
    ];

    if (user.role === 'student') {
      return [
        ...commonSteps,
        {
          title: "Sidebar: Academic Navigation",
          description: "Use your sidebar to navigate: 'Messages' for group/private chat, 'Grade slip' for official certified results, and 'Classwork' to submit assignments and view scores.",
          icon: <LayoutDashboardIcon className="w-12 h-12 text-primary" />
        },
        {
          title: "Attendance: Identity Capture",
          description: "To mark your attendance, open your Digital ID and have your Instructor scan it using the 'QR Scanner'. Once scanned, your attendance (Present or Late) is recorded in real-time. If you are in a lab class, the system will also assign you a specific PC unit.",
          icon: <CheckCircle2 className="w-12 h-12 text-primary" />
        },
        {
          title: "Enrollment Lifecycle",
          description: "Follow the chain: 1. Join an 'Academic Term' on your Dashboard. 2. Once approved by Admin, use the 'Enroll subject' menu to request specific classes from your teachers.",
          icon: <GraduationCap className="w-12 h-12 text-primary" />
        },
        {
          title: "The Session Terminal",
          description: "When you check into a lab, a 'Station Timer' appears in your sidebar. This tracks your remaining time. Ensure you 'Check Out' via the sidebar button before your time expires to avoid the siren alarm.",
          icon: <Monitor className="w-12 h-12 text-primary" />
        },
        {
          title: "Live Ledger & Grade Slip",
          description: "The 'Live ledger' shows your running weighted average in real-time as teachers grade your work. The 'Grade slip' is your official formal document that is generated only after the academic term is closed.",
          icon: <BarChart3 className="w-12 h-12 text-primary" />
        }
      ];
    }

    if (user.role === 'teacher') {
      return [
        ...commonSteps,
        {
          title: "Sidebar: Faculty Control",
          description: "Your sidebar contains: 'QR scanner' for attendance, 'Grading setup' for ECR configuration, 'Manage subjects' for course loads, and 'Room reservations' to book specific labs.",
          icon: <Settings className="w-12 h-12 text-primary" />
        },
        {
          title: "Attendance: Capture Protocol",
          description: "Use the 'Scanner' in your sidebar or dashboard. Switch between 'Class Entrance' and 'Class Dismissal' modes. Scanning a student's QR code will log their status and automatically assign a PC if applicable.",
          icon: <Scan className="w-12 h-12 text-primary" />
        },
        {
          title: "Classwork & Submissions",
          description: "Create 'Classwork' (Files or Quizzes) and 'Learning Modules' for your subjects. You can choose to 'Notify Students' which triggers an email blast to all enrolled students.",
          icon: <FileText className="w-12 h-12 text-primary" />
        },
        {
          title: "Grading: The ECR Matrix",
          description: "In 'Grading setup', define your category weights. The system automatically calculates running grades and generates a downloadable Electronic Class Record (ECR).",
          icon: <BarChart3 className="w-12 h-12 text-primary" />
        },
        {
          title: "Management & Requests",
          description: "Use 'Pending enrollments' to authorize students into your class and 'Pending requests' to approve students who want to use the lab outside regular class hours.",
          icon: <Users className="w-12 h-12 text-primary" />
        }
      ];
    }

    if (user.role === 'admin') {
      return [
        ...commonSteps,
        {
          title: "Sidebar: System Directives",
          description: "Control the Institute via: 'Design lab' for branding, 'Security center' for the blacklist, 'Term management' for academic cycles, and 'Manage users' for global identity control.",
          icon: <ShieldCheck className="w-12 h-12 text-primary" />
        },
        {
          title: "Design Lab: Visual Protocol",
          description: "Customize the entire system interface. Change brand colors, corner rounding, and logo scaling. Changes are deployed to all campus terminals instantly.",
          icon: <Palette className="w-12 h-12 text-primary" />
        },
        {
          title: "Term Lifecycle & Finalization",
          description: "Use 'Term management' to activate new trimesters. When a term is ended, the system automatically calculates all student final grades and archives them.",
          icon: <School className="w-12 h-12 text-primary" />
        }
      ];
    }

    if (user.role === 'library_admin') {
      return [
        ...commonSteps,
        {
          title: "Sidebar: Library Ops",
          description: "Manage the knowledge base via: 'Manage books' for inventory, 'Scan & Lend' for transactions, and 'Borrow requests'.",
          icon: <BookOpen className="w-12 h-12 text-primary" />
        }
      ];
    }

    if (user.role === 'guard') {
      return [
        ...commonSteps,
        {
          title: "Sidebar: Security Registry",
          description: "Maintain campus safety via: 'Identity Scanner' for real-time verification and 'Activity Log' to track entry/exit signals.",
          icon: <ShieldCheck className="w-12 h-12 text-primary" />
        }
      ];
    }

    return commonSteps;
  };

  const steps = getSteps();

  const next = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else onOpenChange(false);
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) setTimeout(() => setCurrentStep(0), 300);
    }}>
      <DialogContent className="sm:max-w-md rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-white p-10 flex flex-col items-center text-center">
          <div className="w-full flex justify-between items-center mb-10">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40">Step {currentStep + 1} of {steps.length}</span>
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all ${i === currentStep ? 'w-6 bg-primary' : 'w-2 bg-muted'}`} />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center"
            >
              <div className="h-24 w-24 rounded-[2rem] bg-primary/5 flex items-center justify-center mb-8 border-2 border-primary/5">
                {steps[currentStep]?.icon}
              </div>
              
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-foreground mb-4">
                {steps[currentStep]?.title}
              </DialogTitle>
              
              <DialogDescription className="font-bold text-sm text-muted-foreground leading-relaxed px-4">
                {steps[currentStep]?.description}
              </DialogDescription>
            </motion.div>
          </AnimatePresence>

          <div className="w-full grid grid-cols-2 gap-4 mt-12">
            <Button 
              variant="ghost" 
              onClick={prev} 
              disabled={currentStep === 0}
              className="h-14 rounded-2xl font-black uppercase text-xs tracking-widest"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button 
              onClick={next}
              className="h-14 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20"
            >
              {currentStep === steps.length - 1 ? "Start Session" : "Continue"} <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LayoutDashboardIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  )
}
