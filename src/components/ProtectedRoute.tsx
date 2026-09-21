"use client";

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/context/StoreContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !currentUser && pathname !== '/login' && pathname !== '/signup') {
      router.replace('/login');
    }
  }, [currentUser, loading, pathname, router]);

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center">Carregando...</div>;
  }

  if (!currentUser && pathname !== '/login' && pathname !== '/signup') {
    return null;
  }

  return <>{children}</>;
}
