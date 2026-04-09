'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { ChatBubble } from '@/components/layout/chat-bubble';
import { ImpersonationBanner } from '@/components/admin/impersonation-banner';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams, usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { locale } = useParams();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdminRoute = pathname.includes('/admin');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/${locale}/login`);
      return;
    }

    // Block non-admins from /admin/* routes
    if (!isLoading && user && isAdminRoute && user.role !== 'ADMIN') {
      router.push(`/${locale}/dashboard`);
      return;
    }

    // Redirect new users to onboarding if they haven't completed it
    if (!isLoading && user && user.role !== 'ADMIN') {
      const key = `onboarding_${user.id}`;
      try {
        const saved = localStorage.getItem(key);
        const parsed = saved ? JSON.parse(saved) : null;
        const noProperties = (user._count?.properties ?? 0) === 0;

        if (!parsed?.completed && noProperties) {
          router.push(`/${locale}/onboarding`);
          return;
        }
      } catch {
        // ignore corrupt localStorage
      }
    }
  }, [user, isLoading, router, locale, pathname, isAdminRoute]);

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
    <>
      {/* Impersonation banner — fixed at very top, only shown when active */}
      <ImpersonationBanner />

      <div className="min-h-screen bg-page flex relative">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 md:p-8 overflow-auto">
            {children}
          </main>
        </div>

        {/* Chat bubble — altijd zichtbaar rechtsonder */}
        <ChatBubble />
      </div>
    </>
  );
}
