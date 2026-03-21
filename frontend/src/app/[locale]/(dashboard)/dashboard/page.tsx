'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { StatsCard } from '@/components/dashboard/stats-card';
import { RecentBookings } from '@/components/dashboard/recent-bookings';
import { UpcomingBookings } from '@/components/dashboard/upcoming-bookings';
import {
  Building2,
  BedDouble,
  Users,
  CalendarCheck,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
  Check,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

function OnboardingBanner({ locale }: { locale: string }) {
  const t = useTranslations('dashboard.onboarding');

  const steps = [
    { label: t('step1'), done: true },
    { label: t('step2'), done: false },
    { label: t('step3'), done: false },
    { label: t('step4'), done: false },
  ];

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-slate-900">{t('title')}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{t('subtitle')}</p>

          {/* Steps */}
          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                {i > 0 && (
                  <div className="hidden sm:block w-6 h-px bg-slate-200 flex-shrink-0 -ml-1" />
                )}
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium flex-1 ${
                    step.done
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.done ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}>
                    {step.done
                      ? <Check className="w-2.5 h-2.5 text-white" />
                      : <span className="text-slate-400 text-[9px] font-bold">{i + 1}</span>
                    }
                  </span>
                  {step.label}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-4">
            <Link
              href={`/${locale}/properties/new`}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('ctaButton')}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const { locale } = useParams<{ locale: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-40 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const showOnboarding = !isLoading && (stats?.totalProperties ?? 0) === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
        <p className="text-slate-500 text-sm mt-0.5">{t('subtitle')}</p>
      </div>

      {/* Onboarding banner — only shown when user has no properties */}
      {showOnboarding && <OnboardingBanner locale={locale} />}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard
          title={t('stats.properties')}
          value={stats?.totalProperties ?? 0}
          icon={Building2}
          color="indigo"
        />
        <StatsCard
          title={t('stats.rooms')}
          value={stats?.totalRooms ?? 0}
          icon={BedDouble}
          color="blue"
        />
        <StatsCard
          title={t('stats.guests')}
          value={stats?.totalGuests ?? 0}
          icon={Users}
          color="purple"
        />
        <StatsCard
          title={t('stats.pending')}
          value={stats?.pendingBookings ?? 0}
          icon={Clock}
          color="amber"
          highlight={stats?.pendingBookings > 0}
        />
        <StatsCard
          title={t('stats.confirmed')}
          value={stats?.confirmedBookings ?? 0}
          icon={CalendarCheck}
          color="green"
        />
        <StatsCard
          title={t('stats.revenueMonth')}
          value={`€${(stats?.revenueThisMonth ?? 0).toFixed(0)}`}
          icon={TrendingUp}
          color="emerald"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <UpcomingBookings bookings={data?.upcomingBookings ?? []} />
        <RecentBookings bookings={data?.recentBookings ?? []} />
      </div>
    </div>
  );
}
