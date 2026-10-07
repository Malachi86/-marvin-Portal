// Storage utilities for managing user data, subjects, and enrollments
export type UserRole = 'admin' | 'teacher' | 'student' | 'library_admin' | 'guard';
export type Department = 'college' | 'shs' | 'elementary' | 'jhs';
export type SHSStrand = 'STEM' | 'ABM' | 'HUMSS' | 'GAS' | 'TVL-ICT' | 'HE';

export interface ThemeConfig {
  primary: string; // Hex
  secondary: string;
  sidebar: string; 
  header: string; 
  accent: string;
  background: string;
  radius: number; 
  glassIntensity: number;
  fontFamily: string;
  layoutDensity: 'compact' | 'standard' | 'spacious';
  campusLabel?: string;
  logoScale?: number;
  idFrameFront?: string; // Base64
  idFrameBack?: string; // Base64
}

export interface User {
  id: string; // USN or EMP number
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: Department;
  program?: string; 
  strand?: SHSStrand; 
  year?: number; 
  sectionId?: string;
  isAdvisoryTeacher?: boolean;
  advisorySectionId?: string;
  profilePic?: string;
  emergencyContactName?: string;
  emergencyContactAddress?: string;
  emergencyContactPhone?: string;
  lastSeen?: string;
  isBanned?: boolean;
  isApproved?: boolean;
  deviceFingerprint?: string;
}

export interface Section {
  id: string;
  name: string; // Group Name
  gradeLevel: number;
  department: Department;
  strand?: SHSStrand;
  advisoryTeacherId: string;
  advisoryTeacherName: string;
  roomNumber: string; // The assigned room
  capacity: number; // Seat capacity
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  units?: number;
  teacherId: string;
  teacherName: string;
  termId: string;
  department: Department;
  gradeLevel?: number;
  strandRequirement?: SHSStrand;
  schedules: Schedule[];
  description?: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  subjectId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  timeIn?: string;
  timeOut?: string;
  locationId?: string;
  pcId?: string;
  isSynced?: boolean; // For offline sync
}

export interface Submission {
  id: string;
  classworkId: string;
  studentId: string;
  submittedAt: string;
  files?: { name: string; url: string }[];
  textAnswer?: string;
  quizAnswers?: QuizAnswer[];
  status: 'submitted' | 'late' | 'graded';
  grade?: number;
  feedback?: string;
  timestamp?: number; // For "Check Later" logic
}

export interface Schedule { day: string; startTime: string; dismissalTime: string; }
export interface Term { id: string; name: string; status: 'active' | 'ended'; createdAt: string; startDate: string; endDate: string; endedAt?: string; }
export interface TermEnrollment { id: string; studentId: string; termId: string; status: 'pending' | 'approved' | 'rejected'; enrolledAt: string; }
export interface Enrollment { id: string; studentId: string; subjectId: string; enrolledAt: string; status: 'pending' | 'approved' | 'rejected'; }
export interface Lab { id: string; name: string; capacity: number; }
export interface Pc { id: string; pcNumber: string; labId: string; status: 'available' | 'occupied' | 'maintenance'; }
export interface LabRequest { id: string; studentId: string; teacherId: string; subjectId: string; labId: string; pcId?: string; startTime: string; endTime: string; reason?: string; status: 'pending' | 'approved' | 'declined'; }
export interface Room { id: string; name: string; capacity: number; }
export interface Reservation { id: string; teacherId: string; subjectId: string; locationId: string; locationType: 'room' | 'lab'; date: string; startTime: string; endTime: string; }
export interface Book { id: string; barcode: string; title: string; author: string; status: 'available' | 'borrowed'; borrowerId?: string; borrowedAt?: string; dueDate?: string; }
export interface LibraryBorrowing { id: string; bookId: string; studentId: string; borrowDate: string; dueDate: string; returnDate?: string; status: 'borrowed' | 'returned'; }
export interface BorrowRequest { id: string; bookId: string; bookBarcode: string; bookTitle: string; studentId: string; studentName: string; requestedAt: string; status: 'pending' | 'approved' | 'declined'; dueDate?: string; }
export interface QuizQuestion { id: string; text: string; type: 'mcq' | 'tf' | 'identification' | 'enumeration' | 'explanation'; options?: string[]; correctAnswer?: string; points: number; }
export interface Classwork { id: string; subjectId: string; teacherId: string; title: string; description: string; type: 'quiz' | 'activity' | 'performance' | 'final_output'; submissionType: 'file' | 'quiz'; questions?: QuizQuestion[]; attachments?: { name: string; url: string }[]; exemptedStudentIds?: string[]; createdAt: string; dueDate: string; status: 'published' | 'draft'; totalPoints: number; }
export interface Material { id: string; subjectId: string; teacherId: string; title: string; description: string; attachments: { name: string; url: string }[]; createdAt: string; }
export interface QuizAnswer { questionId: string; value: string; earnedPoints?: number; }
export interface GradingWeights { subjectId: string; attendance: number; activities: number; quizzes: number; performance: number; finalOutput: number; lateMultiplier: number; absentMultiplier: number; }
export interface AcademicRecord { id: string; studentId: string; subjectId: string; subjectName: string; subjectCode: string; termId: string; termName: string; grade: number; score: number; units: number; recordedAt: string; }
export interface AuditLog { id: string; userId: string; userName: string; action: string; details: string; timestamp: string; }
export interface Conversation { id: string; name: string; type: 'subject' | 'private' | 'general'; memberIds: string[]; teacherId?: string; subjectId?: string; lastMessage?: string; lastTimestamp?: string; }
export interface ChatMessage { id: string; conversationId: string; senderId: string; senderName: string; text: string; timestamp: string; type: 'text' | 'call_log'; fileUrl?: string | null; fileName?: string; fileType?: string; }
export interface CampusLog { id: string; userId: string; userName: string; role: string; type: 'entry' | 'exit'; timestamp: string; location: string; }
export interface Announcement { id: string; senderId: string; title: string; message: string; targetType: 'all' | 'students' | 'teachers' | 'specific'; targetUserId?: string; createdAt: string; active: boolean; dismissedBy: string[]; attemptType: 'limited' | 'unlimited'; maxAttempts?: number; }
