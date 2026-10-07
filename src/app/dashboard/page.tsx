'use client';

import { useState, useEffect } from 'react';

import { useAuth } from '@/contexts/AuthContext';

import TeacherDashboard from '@/components/teacher/TeacherDashboard';
import StudentDashboard from '@/components/student/StudentDashboard';
import AdminDashboard from '@/components/admin/AdminDashboard';

import { Loader2 } from 'lucide-react';

export default function DashboardPage() {

  const { user } = useAuth();

  const [mounted,setMounted] = useState(false);

  useEffect(()=>{
    setMounted(true);
  },[]);

  /* ------------------------------------------------ */
  /* PREVENT HYDRATION MISMATCH */
  /* ------------------------------------------------ */

  if(!mounted){

    return (

      <div className="
      flex
      items-center
      justify-center
      min-h-screen
      bg-muted/10
      ">

        <Loader2 className="h-10 w-10 animate-spin text-primary"/>

      </div>

    );

  }

  /* ------------------------------------------------ */
  /* NOT LOGGED IN */
  /* ------------------------------------------------ */

  if(!user){

    return (

      <div className="
      flex
      flex-col
      items-center
      justify-center
      min-h-screen
      bg-white
      p-6
      text-center
      ">

        <div className="
        flex
        flex-col
        items-center
        gap-4
        animate-pulse
        ">

          <a 
            href="https://myportfolio-48bb2.web.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m8 3 4 8 5-5 5 15H2L8 3z"/>
            </svg>
          </a>

          <p className="
          text-muted-foreground
          text-sm
          font-semibold
          tracking-widest
          uppercase
          ">

            AMS : AMA Computer College

          </p>

        </div>

      </div>

    );

  }

  /* ------------------------------------------------ */
  /* ROLE DASHBOARDS */
  /* ------------------------------------------------ */

  if(user.role === 'admin'){

    return <AdminDashboard/>

  }

  if(user.role === 'teacher'){

    return <TeacherDashboard/>

  }

  if(user.role === 'student'){

    return <StudentDashboard/>

  }

  /* ------------------------------------------------ */
  /* FALLBACK */
  /* ------------------------------------------------ */

  return (

    <div className="
    flex
    items-center
    justify-center
    min-h-screen
    ">

      <Loader2 className="
      h-10 w-10
      animate-spin
      text-primary
      "/>

    </div>

  );

}
