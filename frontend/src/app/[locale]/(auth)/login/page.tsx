'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type LoginForm = z.infer<typeof loginSchema>;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function SocialButton({
  provider,
  label,
  icon,
  locale,
}: {
  provider: 'google' | 'microsoft';
  label: string;
  icon: React.ReactNode;
  locale: string | string[];
}) {
  const handleClick = () => {
    // Navigate to NestJS OAuth initiation endpoint
    window.location.href = `${API_URL}/auth/${provider}`;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors"
    >
      {icon}
      {label}
    </button>
  );
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M0 0h8.571v8.571H0z" fill="#F25022"/>
    <path d="M9.429 0H18v8.571H9.429z" fill="#7FBA00"/>
    <path d="M0 9.429h8.571V18H0z" fill="#00A4EF"/>
    <path d="M9.429 9.429H18V18H9.429z" fill="#FFB900"/>
  </svg>
);

export default function LoginPage() {
  const t = useTranslations('auth');
  const { locale } = useParams();
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const oauthError = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('error')
    : null;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setError('');
    try {
      await login(data.email, data.password);
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      setError(err?.response?.data?.message || t('errorInvalidCredentials'));
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{t('loginTitle')}</h1>
          <p className="text-slate-500 mt-1 text-sm">{t('loginSubtitle')}</p>
        </div>

        {/* OAuth error from redirect */}
        {oauthError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-red-600 text-sm">
              {decodeURIComponent(oauthError).includes('disabled')
                ? t('errorAccountDisabled')
                : t('errorOAuthFailed')}
            </p>
          </div>
        )}

        {/* ─── Social login ─── */}
        <div className="space-y-2.5 mb-6">
          <SocialButton
            provider="google"
            label={t('continueWithGoogle')}
            icon={<GoogleIcon />}
            locale={locale}
          />
          <SocialButton
            provider="microsoft"
            label={t('continueWithMicrosoft')}
            icon={<MicrosoftIcon />}
            locale={locale}
          />
        </div>

        {/* ─── Divider ─── */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-xs text-slate-400">{t('orContinueWith')}</span>
          </div>
        </div>

        {/* ─── Email form ─── */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('email')}
            </label>
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              placeholder="jan@example.nl"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('password')}
            </label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-3 py-2.5 pr-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end">
            <Link
              href={`/${locale}/forgot-password`}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              {t('forgotPassword')}
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            {isSubmitting ? t('loggingIn') : t('loginButton')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            {t('noAccount')}{' '}
            <Link href={`/${locale}/register`} className="text-indigo-600 hover:text-indigo-700 font-medium">
              {t('registerLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
