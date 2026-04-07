'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, setAuth, clearAuth } from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import Cookies from 'js-cookie';
import type { User } from '@/types';

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale ?? 'nl';

  const hasToken = typeof window !== 'undefined' ? !!Cookies.get('access_token') : false;

  const { data: user, isLoading, refetch } = useQuery<User>({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then((r) => r.data.data),
    retry: false,
    staleTime: 5 * 60 * 1000,
    enabled: hasToken,
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      api.post('/auth/login', { email, password }).then((r) => r.data.data),
    onSuccess: (data) => {
      setAuth(data.accessToken, data.refreshToken);
      queryClient.setQueryData(['me'], data.user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (dto: Record<string, unknown>) =>
      api.post('/auth/register', dto).then((r) => r.data.data),
    onSuccess: (data) => {
      setAuth(data.accessToken, data.refreshToken);
      queryClient.setQueryData(['me'], data.user);
    },
  });

  const logout = async () => {
    try {
      const refreshToken = Cookies.get('refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken }).catch(() => {});
      }
    } finally {
      clearAuth();
      queryClient.removeQueries({ queryKey: ['me'] });
      router.push(`/${locale}`);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: (email: string, password: string) => loginMutation.mutateAsync({ email, password }),
    register: (dto: Record<string, unknown>) => registerMutation.mutateAsync(dto),
    logout,
    refetchUser: refetch,
  };
}
