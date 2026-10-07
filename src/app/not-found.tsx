'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', background: '#1c1c1c', color: 'white' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>404 - Page Not Found</h1>
      <p style={{ margin: '1rem 0' }}>The page you are looking for does not exist.</p>
      <Link href="/">
        <Button>Go Back to Home</Button>
      </Link>
    </div>
  );
}
