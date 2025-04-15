'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Loading component to show while the Whiteboard is loading
const Loading = () => (
  <div className="h-screen w-full bg-background flex items-center justify-center">
    <div className="text-xl">Loading Flow Whiteboard...</div>
  </div>
);

// Dynamically import the Whiteboard component with SSR disabled
// This is needed because ReactFlow uses browser APIs
const WhiteboardWithNoSSR = dynamic(
  () => import('./components/Whiteboard'),
  { 
    ssr: false,
    loading: () => <Loading />
  }
);

// Main page component
export default function Home() {
  return (
    <main className="h-screen w-full bg-background">
      <Suspense fallback={<Loading />}>
        <WhiteboardWithNoSSR />
      </Suspense>
    </main>
  );
} 