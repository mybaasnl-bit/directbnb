'use client';

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Mail, PartyPopper } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

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

const registerSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8, 'Minimum 8 characters'),
  phone: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

function RegisterForm() {
  const t = useTranslations('auth');
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [error, setError] = useState('');
  const searchParams = useSearchParams();

  // Invite params pre-filled from the invite email link
  const inviteToken = searchParams.get('token') ?? '';
  const inviteEmail = decodeURIComponent(searchParams.get('email') ?? '');
  const inviteName = decodeURIComponent(searchParams.get('name') ?? '');
  const isInvite = !!inviteToken;

  // Split full name → firstName + lastName
  const nameParts = inviteName.trim().split(/\s+/);
  const defaultFirstName = nameParts[0] ?? '';
  const defaultLastName = nameParts.slice(1).join(' ');

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: defaultFirstName,
      lastName: defaultLastName,
      email: inviteEmail,
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setError('');
    try {
      await registerUser({
        ...data,
        preferredLanguage: locale as string,
      });
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg ?? t('errorGeneral'));
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        {/* Invite banner */}
        {isInvite && (
          <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
            <PartyPopper className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-indigo-900">
                {t('inviteBannerTitle')}
              </p>
              <p className="text-xs text-indigo-700 mt-0.5">
                {t('inviteBannerBody')}
              </p>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{t('registerTitle')}</h1>
          <p className="text-slate-500 mt-1 text-sm">{t('registerSubtitle')}</p>
        </div>

        {/* Social login — not shown on invite flow (email is pre-filled & locked) */}
        {!isInvite && (
          <>
            <div className="space-y-2.5 mb-6">
              <button
                type="button"
                onClick={() => { window.location.href = `${API_URL}/auth/google`; }}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors"
              >
                <GoogleIcon />
                {t('continueWithGoogle')}
              </button>
              <button
                type="button"
                onClick={() => { window.location.href = `${API_URL}/auth/microsoft`; }}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors"
              >
                <MicrosoftIcon />
                {t('continueWithMicrosoft')}
              </button>
            </div>
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-slate-400">{t('orContinueWith')}</span>
              </div>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('firstName')}
              </label>
              <input
                {...register('firstName')}
                type="text"
                placeholder="Jan"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('lastName')}
              </label>
              <input
                {...register('lastName')}
                type="text"
                placeholder="de Vries"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('email')}
            </label>
            <div className="relative">
              <input
                {...register('email')}
                type="email"
                placeholder="jan@example.nl"
                readOnly={isInvite}
                className={`w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isInvite ? 'bg-slate-50 text-slate-500 cursor-not-allowed pr-10' : ''
                }`}
              />
              {isInvite && (
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              )}
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('phone')} <span className="text-slate-400">({t('optional')})</span>
            </label>
            <input
              {...register('phone')}
              type="tel"
              placeholder="+31 6 12 34 56 78"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('password')}
            </label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder={t('passwordPlaceholder')}
                className="w-full px-3 py-2.5 pr-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {!isInvite && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3">
              <p className="text-indigo-700 text-xs">{t('betaNotice')}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            {isSubmitting ? t('registering') : t('registerButton')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            {t('hasAccount')}{' '}
            <Link href={`/${locale}/login`} className="text-indigo-600 hover:text-indigo-700 font-medium">
              {t('loginLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md h-[480px] bg-slate-100 rounded-xl animate-pulse" />}>
      <RegisterForm />
    </Suspense>
  );
}
