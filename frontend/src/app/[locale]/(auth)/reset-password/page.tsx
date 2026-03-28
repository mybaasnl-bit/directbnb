'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Eye, EyeOff, KeyRound, Loader2, Check } from 'lucide-react';

function ResetPasswordForm() {
  const { locale } = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const isNl = locale !== 'en';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = {
    title: isNl ? 'Nieuw wachtwoord instellen' : 'Set new password',
    subtitle: isNl ? 'Kies een nieuw wachtwoord voor je account.' : 'Choose a new password for your account.',
    passwordLabel: isNl ? 'Nieuw wachtwoord' : 'New password',
    confirmLabel: isNl ? 'Bevestig wachtwoord' : 'Confirm password',
    submit: isNl ? 'Wachtwoord opslaan' : 'Save password',
    submitting: isNl ? 'Opslaan...' : 'Saving...',
    successTitle: isNl ? 'Wachtwoord opgeslagen!' : 'Password saved!',
    successMsg: isNl ? 'Je kunt nu inloggen met je nieuwe wachtwoord.' : 'You can now log in with your new password.',
    loginLink: isNl ? 'Ga naar inloggen' : 'Go to login',
    noMatch: isNl ? 'Wachtwoorden komen niet overeen' : 'Passwords do not match',
    tooShort: isNl ? 'Minimaal 8 tekens vereist' : 'Minimum 8 characters required',
    noToken: isNl ? 'Ongeldige resetlink. Vraag een nieuwe aan.' : 'Invalid reset link. Please request a new one.',
    forgotLink: isNl ? 'Nieuw verzoek' : 'New request',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError(t.tooShort); return; }
    if (password !== confirm) { setError(t.noMatch); return; }

    setLoading(true);
    setError(null);

    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.message ?? err.response?.data?.error;
      setError(Array.isArray(msg) ? msg[0] : msg ?? (isNl ? 'Er is een fout opgetreden. Probeer opnieuw.' : 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">{t.noToken}</h2>
          <Link href={`/${locale}/forgot-password`} className="inline-block mt-4 text-brand text-sm font-medium hover:underline">
            {t.forgotLink}
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-6 h-6 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">{t.successTitle}</h2>
          <p className="text-slate-500 text-sm mb-6">{t.successMsg}</p>
          <Link
            href={`/${locale}/login`}
            className="inline-flex items-center justify-center w-full bg-brand hover:bg-brand-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            {t.loginLink}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <div className="mb-8">
          <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center mb-4">
            <KeyRound className="w-6 h-6 text-brand" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
          <p className="text-slate-500 mt-1 text-sm">{t.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.passwordLabel}</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-10 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="mt-1.5 flex gap-1">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      password.length >= (i + 1) * 3
                        ? password.length >= 12 ? 'bg-emerald-400' : password.length >= 8 ? 'bg-amber-400' : 'bg-red-400'
                        : 'bg-slate-100'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.confirmLabel}</label>
            <input
              type={showPw ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              placeholder="••••••••"
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-sm ${
                confirm && confirm !== password ? 'border-red-300' : 'border-slate-200'
              }`}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password || !confirm}
            className="w-full bg-brand hover:bg-brand-600 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />{t.submitting}</> : t.submit}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md h-64 bg-slate-100 rounded-xl animate-pulse" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
