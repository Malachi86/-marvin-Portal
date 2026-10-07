'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

import { toast } from 'sonner'
import { UserPlus, Loader2, ArrowLeft } from 'lucide-react'

import {
  addUserAction,
  getUsersAction,
  getSettingsAction
} from '@/app/actions/dbActions'

import { Department } from '@/utils/storage'

type Role = 'student' | 'teacher'

interface RegisterForm {
  id: string
  name: string
  email: string
  password: string
  role: Role
  department: Department
  program: string
  strand: string
  year: number
  teacherSecret: string
  emergencyContactName: string;
  emergencyContactAddress: string;
  emergencyContactPhone: string;
}

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [systemSettings, setSystemSettings] = useState<any>(null)

  const [formData, setFormData] = useState<RegisterForm>({
    id: '',
    name: '',
    email: '',
    password: '',
    role: 'student',
    department: 'college',
    program: '',
    strand: '',
    year: 1,
    teacherSecret: '',
    emergencyContactName: '',
    emergencyContactAddress: '',
    emergencyContactPhone: ''
  })

  useEffect(() => {
    getSettingsAction().then(setSystemSettings)
  }, [])

  const updateField = (field: keyof RegisterForm, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateID = () => {
    const cleanId = formData.id.trim();
    if (!cleanId) return "ID is required.";
    if (formData.role === 'student' && cleanId.length !== 11) {
      return "Student USN must be exactly 11 digits.";
    }
    if (formData.role === 'teacher' && cleanId.length < 4) {
      return "Employee ID must be at least 4 digits.";
    }
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const idError = validateID();
    if (idError) {
      toast.error(idError);
      return;
    }

    if (loading) return
    setLoading(true)

    try {
      const users = await getUsersAction()

      if (users.some(u => u.id === formData.id.trim())) {
        toast.error('User with this ID already exists.')
        setLoading(false)
        return
      }

      if (formData.role === 'teacher') {
        const settings = await getSettingsAction()
        const requiredSecret = settings.teacherSecret || 'AMACC_FACULTY_2026';
        if (formData.teacherSecret !== requiredSecret) {
          toast.error('Invalid teacher secret code.')
          setLoading(false)
          return
        }
      }

      // EXPLICITLY build the newUser object to avoid undefined keys
      // Firestore will throw an error if any property is undefined
      const newUser: any = {
        id: formData.id.trim(),
        usn_emp: formData.id.trim(), // Map to usn_emp for backend schema compatibility
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        department: formData.department,
        profilePic: '',
        isApproved: formData.role === 'teacher',
        isBanned: false
      }

      // Add conditional fields only if role is student
      if (formData.role === 'student') {
        if (formData.department === 'college') {
          newUser.program = formData.program || 'BSCS';
        } else {
          newUser.strand = formData.strand || 'STEM';
        }
        newUser.year = Number(formData.year);
        newUser.emergencyContactName = formData.emergencyContactName || '';
        newUser.emergencyContactAddress = formData.emergencyContactAddress || '';
        newUser.emergencyContactPhone = formData.emergencyContactPhone || '';
      }

      await addUserAction(newUser)

      if (formData.role === 'student') {
        toast.success('Registration successful!', {
          description: 'Please wait for admin approval before logging in.'
        });
      } else {
        toast.success('Registration successful!', {
          description: 'You can now sign in to your faculty dashboard.'
        });
      }

      router.push('/')
    } catch (error: any) {
      console.error("Registration error:", error)
      toast.error(error.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const availablePrograms = systemSettings?.programs || ['BSCS', 'BSIT', 'BSCpE', 'BSHM', 'BSTM'];
  const availableStrands = systemSettings?.strands || ['STEM', 'ABM', 'HUMSS', 'ICT', 'HE'];

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <header className="bg-primary shadow-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="AMA Portal" width={150} height={40} style={{ height: 'auto' }} />
          </Link>
          <Button variant="ghost" asChild className="text-white hover:bg-white/10 rounded-full">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white rounded-theme-xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
          
          <div className="w-full md:w-2/5 bg-primary text-white p-10 md:p-12 flex flex-col justify-center items-start">
            <h1 className="text-3xl md:text-4xl font-black mb-6 uppercase tracking-tighter leading-tight">
              JOIN ACADEMIC HUB
            </h1>
            <p className="text-white/80 text-sm leading-relaxed font-bold">
              Secure access to AMA Student Portal. Select your correct department to see appropriate course loads.
            </p>
          </div>

          <div className="w-full md:w-3/5 p-8 md:p-12 overflow-y-auto max-h-[85vh] no-scrollbar">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Registration</h2>
            <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest mb-10">Fill in your identity details.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Identity Type</Label>
                  <Select value={formData.role} onValueChange={(v: Role) => updateField('role', v)}>
                    <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="student" className="font-bold">Student</SelectItem>
                      <SelectItem value="teacher" className="font-bold">Teacher</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Department</Label>
                  <Select value={formData.department} onValueChange={(v: Department) => updateField('department', v)}>
                    <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="college" className="font-bold">College</SelectItem>
                      <SelectItem value="shs" className="font-bold">Senior High (SHS)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">
                  {formData.role === 'student' ? 'Student ID / USN (11 digits)' : 'Employee ID Number'}
                </Label>
                <Input
                  value={formData.id}
                  onChange={e => updateField('id', e.target.value)}
                  required
                  disabled={loading}
                  className="h-14 rounded-xl font-black text-xl tracking-widest px-6"
                  placeholder={formData.role === 'student' ? "e.g. 25001198310" : "e.g. 12345678"}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Full Name</Label>
                <Input value={formData.name} onChange={e => updateField('name', e.target.value)} required disabled={loading} className="h-12 rounded-xl font-bold px-6" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Email</Label>
                  <Input type="email" value={formData.email} onChange={e => updateField('email', e.target.value)} required disabled={loading} className="h-12 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Password</Label>
                  <Input type="password" value={formData.password} onChange={e => updateField('password', e.target.value)} required disabled={loading} className="h-12 rounded-xl font-bold" />
                </div>
              </div>

              {formData.role === 'student' && (
                <>
                  <div className="grid grid-cols-2 gap-4 border-t border-primary/5 pt-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1">
                        {formData.department === 'college' ? 'Program' : 'Strand'}
                      </Label>
                      <Select 
                        value={formData.department === 'college' ? formData.program : formData.strand} 
                        onValueChange={v => updateField(formData.department === 'college' ? 'program' : 'strand', v)}
                      >
                        <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {(formData.department === 'college' ? availablePrograms : availableStrands).map((opt: string) => (
                            <SelectItem key={opt} value={opt} className="font-bold">{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1">
                        {formData.department === 'college' ? 'Year Level' : 'Grade Level'}
                      </Label>
                      <Select value={String(formData.year)} onValueChange={v => updateField('year', Number(v))}>
                        <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {formData.department === 'college' ? (
                            ['1', '2', '3', '4'].map(y => {
                              const label = y === '1' ? '1st' : y === '2' ? '2nd' : y === '3' ? '3rd' : '4th';
                              return <SelectItem key={y} value={y} className="font-bold">{label} Year</SelectItem>;
                            })
                          ) : (
                            ['11', '12'].map(g => <SelectItem key={g} value={g} className="font-bold">Grade {g}</SelectItem>)
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border-t border-primary/5 pt-8 space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Emergency Contact</h3>
                    <div className="space-y-4">
                      <Input placeholder="Contact Name" value={formData.emergencyContactName} onChange={e => updateField('emergencyContactName', e.target.value)} className="h-12 rounded-xl font-bold" />
                      <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="Relationship/Address" value={formData.emergencyContactAddress} onChange={e => updateField('emergencyContactAddress', e.target.value)} className="h-12 rounded-xl font-bold" />
                        <Input placeholder="Phone Number" value={formData.emergencyContactPhone} onChange={e => updateField('emergencyContactPhone', e.target.value)} className="h-12 rounded-xl font-bold" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {formData.role === 'teacher' && (
                <div className="space-y-2 border-t border-primary/5 pt-6">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Instructor Authentication Code</Label>
                  <Input type="password" value={formData.teacherSecret} onChange={e => updateField('teacherSecret', e.target.value)} required className="h-12 rounded-xl font-bold px-6" placeholder="Enter Secret Code" />
                </div>
              )}

              <Button type="submit" className="w-full h-16 text-sm font-black uppercase tracking-[0.2em] gap-3 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95" disabled={loading}>
                {loading ? "AUTHENTICATING..." : "COMMIT REGISTRATION"}
              </Button>
            </form>

            <div className="text-center mt-8 text-sm font-bold text-muted-foreground uppercase tracking-tight">
              Already have an account? <Link href="/" className="font-black text-primary hover:underline ml-1">Sign In</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
