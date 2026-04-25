'use client';

import { useEffect, useState } from 'react';
import {
  LayoutDashboard, BookOpen, CalendarDays, BedDouble,
  Mail, Banknote, Settings, Sparkles, X,
} from 'lucide-react';
import { useDynamicCopy } from '@/components/providers/dynamic-copy-provider';
import { useOnboarding } from '@/hooks/use-onboarding';

// ─── Page config map ──────────────────────────────────────────────────────────

const PAGE_CONFIG: Record<string, {
  icon: React.ElementType;
  titleFallback: string;
  descFallback: string;
}> = {
  dashboard: {
    icon: LayoutDashboard,
    titleFallback: 'Welkom bij je Dashboard',
    descFallback:
      'Dit is jouw command center. Hier zie je een live overzicht van openstaande boekingen, je inkomsten deze maand en alle recente activiteit in één oogopslag.',
  },
  bookings: {
    icon: BookOpen,
    titleFallback: 'Beheer al je boekingen',
    descFallback:
      'Nieuwe boekingsverzoeken verschijnen bovenaan in het geel. Accepteer of weiger ze direct. Je kunt ook handmatig boekingen aanmaken en betalingslinks versturen.',
  },
  agenda: {
    icon: CalendarDays,
    titleFallback: 'Je beschikbaarheidskalender',
    descFallback:
      'Klik op een dag om deze te blokkeren of deblokkeren. Boekingen zijn automatisch zichtbaar in de kalender. Synchroniseer met Google of Apple Agenda via de knoppen bovenaan.',
  },
  rooms: {
    icon: BedDouble,
    titleFallback: "Je kamers & accommodaties",
    descFallback:
      "Hier beheer je al jouw kamers. Klik op 'Bewerken' om de prijs, beschrijving of voorzieningen aan te passen. Zet een accommodatie online of offline via de publicatieknop.",
  },
  emails: {
    icon: Mail,
    titleFallback: 'Automatische e-mailcommunicatie',
    descFallback:
      'DirectBnB verstuurt automatisch e-mails bij boekingen en bevestigingen. Pas de inhoud van de sjablonen hier aan voor een persoonlijke uitstraling. Je kunt altijd resetten naar de standaard.',
  },
  payouts: {
    icon: Banknote,
    titleFallback: 'Automatische uitbetalingen',
    descFallback:
      'Koppel eenmalig je bankrekening via Stripe. Daarna ontvang je betalingen automatisch na elke check-in — binnen 2 werkdagen op je rekening. Volledig veilig en geautomatiseerd.',
  },
  settings: {
    icon: Settings,
    titleFallback: 'Je B&B instellingen',
    descFallback:
      'Stel hier je accommodatiegegevens in, beheer je accountprofiel, configureer meldingen en regel beveiliging en betalingen. Wijzigingen worden direct opgeslagen.',
  },
};

// ─── Inner popup ─────────────────────────────────────────────────────────────

function OnboardingPopup({
  pageKey,
  onClose,
  isPending,
}: {
  pageKey: string;
  onClose: () => void;
  isPending: boolean;
}) {
  const config = PAGE_CONFIG[pageKey] ?? {
    icon: Sparkles,
    titleFallback: 'Welkom',
    descFallback: 'Leer hoe deze pagina werkt.',
  };

  const Icon = config.icon;
  const title = useDynamicCopy(`${pageKey}.onboarding.title`, config.titleFallback);
  const description = useDynamicCopy(`${pageKey}.onboarding.description`, config.descFallback);

  // Delayed mount so the page renders before the popup slides in — prevents layout-shift perception
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 350);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div
        className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transition-transform duration-300 ${
          visible ? 'translate-y-0' : 'translate-y-4'
        }`}
      >
        {/* Brand header strip */}
        <div className="bg-gradient-to-br from-brand to-brand-600 px-6 pt-6 pb-8">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              aria-label="Sluiten"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <h2 className="mt-4 text-xl font-extrabold text-white leading-tight">
            {title}
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-slate-600 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-600 disabled:opacity-60 text-white font-bold py-3 rounded-2xl text-sm transition-colors shadow-lg shadow-brand/25"
          >
            {isPending ? 'Even geduld…' : 'Ik begrijp het ✓'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Self-contained trigger ───────────────────────────────────────────────────
//
// Drop <OnboardingTrigger pageKey="dashboard" /> anywhere in a page's JSX.
// It renders null if the user has already seen this step, or while loading.

export function OnboardingTrigger({ pageKey }: { pageKey: string }) {
  const { showPopup, markComplete, isPending } = useOnboarding(pageKey);

  if (!showPopup) return null;

  return (
    <OnboardingPopup
      pageKey={pageKey}
      onClose={markComplete}
      isPending={isPending}
    />
  );
}
