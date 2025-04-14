'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from './components/Header';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/whiteboard');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to whiteboard...</p>
    </div>
  );
} 