'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { ChatBubble } from '@/components/layout/chat-bubble';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { locale } = useParams();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [user, isLoading, router, locale]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">D</span>
          </div>
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-page flex relative">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>

      {/* Chat bubble — altijd zichtbaar rechtsonder */}
      <ChatBubble />
    </div>
  );
}
