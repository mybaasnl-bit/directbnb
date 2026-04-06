'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [user, isLoading, router, locale]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
