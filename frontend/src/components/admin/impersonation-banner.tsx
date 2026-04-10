'use client';

import { useEffect, useState } from 'react';
import { UserX } from 'lucide-react';
import { api, setAuth, clearAuth } from '@/lib/api';
import Cookies from 'js-cookie';

interface ImpersonationState {
  isImpersonating: boolean;
  targetName: string;
  adminAccessToken: string;
  adminRefreshToken: string;
}

export function useImpersonation() {
  const [state, setState] = useState<ImpersonationState | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('impersonation');
      if (raw) setState(JSON.parse(raw));
    } catch {
      // ignore corrupt state
    }
  }, []);

  const startImpersonation = async (userId: string, targetName: string) => {
    // Save current admin tokens before swapping
    const currentAccess  = Cookies.get('access_token')  ?? '';
    const currentRefresh = Cookies.get('refresh_token') ?? '';

    const res = await api.post(`/admin/impersonate/${userId}`);
    const { accessToken, refreshToken } = res.data.data;

    const impState: ImpersonationState = {
      isImpersonating: true,
      targetName,
      adminAccessToken: currentAccess,
      adminRefreshToken: currentRefresh,
    };

    localStorage.setItem('impersonation', JSON.stringify(impState));
    setAuth(accessToken, refreshToken);
    setState(impState);

    // Reload so React Query re-fetches user context
    window.location.href = window.location.origin + window.location.pathname.replace(/\/admin.*/, '/dashboard');
  };

  const stopImpersonation = () => {
    try {
      const raw = localStorage.getItem('impersonation');
      if (!raw) return;
      const saved: ImpersonationState = JSON.parse(raw);

      if (saved.adminAccessToken && saved.adminRefreshToken) {
        setAuth(saved.adminAccessToken, saved.adminRefreshToken);
      } else {
        clearAuth();
      }
    } catch {
      clearAuth();
    } finally {
      localStorage.removeItem('impersonation');
      setState(null);
      window.location.href = window.location.href.split('/').slice(0, 3).join('/') + '/' +
        (window.location.pathname.split('/')[1] ?? 'nl') + '/admin/users';
    }
  };

  return { impersonationState: state, startImpersonation, stopImpersonation };
}

export function ImpersonationBanner() {
  const [state, setState] = useState<ImpersonationState | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('impersonation');
      if (raw) setState(JSON.parse(raw));
    } catch {}
  }, []);

  const stop = () => {
    try {
      const raw = localStorage.getItem('impersonation');
      if (!raw) return;
      const saved: ImpersonationState = JSON.parse(raw);
      if (saved.adminAccessToken && saved.adminRefreshToken) {
        setAuth(saved.adminAccessToken, saved.adminRefreshToken);
      } else {
        clearAuth();
      }
    } catch {
      clearAuth();
    } finally {
      localStorage.removeItem('impersonation');
      const locale = window.location.pathname.split('/')[1] ?? 'nl';
      window.location.href = `/${locale}/admin/users`;
    }
  };

  if (!state?.isImpersonating) return null;

  return (
    <button
      onClick={stop}
      className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold py-2.5 px-4 flex items-center justify-center gap-2 transition-colors w-full"
    >
      <UserX className="w-4 h-4 flex-shrink-0" />
      Je bekijkt als <span className="underline">{state.targetName}</span>
      &mdash; Klik hier om terug te gaan naar Admin
    </button>
  );
}
