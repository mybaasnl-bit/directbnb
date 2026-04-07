'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Code2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Globe,
  Image,
  Star,
  DollarSign,
  BedDouble,
  ExternalLink,
  ChevronDown,
  Info,
} from 'lucide-react';

interface Property {
  id: string;
  name: string;
  slug: string;
}

const FRONTEND_BASE = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://directbnb.nl';

function Toggle({
  checked,
  onChange,
  label,
  description,
  icon: Icon,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${checked ? 'bg-brand/10 text-brand' : 'bg-slate-100 text-slate-400'}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-brand' : 'bg-slate-200'}`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex-shrink-0">
      {n}
    </span>
  );
}

interface PlatformInstructionsProps {
  steps: { title: string; body: React.ReactNode }[];
}

function PlatformInstructions({ steps }: PlatformInstructionsProps) {
  return (
    <div className="space-y-4 pt-1">
      {steps.map((s, i) => (
        <div key={i} className="flex gap-4">
          <StepBadge n={i + 1} />
          <div>
            <p className="text-sm font-semibold text-slate-800">{s.title}</p>
            <div className="text-sm text-slate-500 mt-0.5">{s.body}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

const PLATFORMS = [
  {
    id: 'squarespace',
    label: 'Squarespace',
    emoji: '🟫',
    steps: [
      {
        title: 'Kopieer de widget-code',
        body: <>Klik op de oranje knop <strong>"Kopieer code"</strong> hierboven.</>,
      },
      {
        title: 'Open de pagina-editor',
        body: <>Ga in Squarespace naar <strong>Pagina's</strong> en open de pagina waar je de widget wilt plaatsen. Klik op <strong>Bewerken</strong>.</>,
      },
      {
        title: 'Voeg een Code-blok toe',
        body: <>Klik op het <strong>+</strong>-icoontje op de plek waar je de widget wilt. Zoek naar <strong>"Code"</strong> en selecteer dat blok.</>,
      },
      {
        title: 'Plak de code',
        body: <>Plak de gekopieerde iframe-code in het tekstveld van het Code-blok en zet de modus op <strong>HTML</strong>.</>,
      },
      {
        title: 'Sla op en publiceer',
        body: <>Klik op <strong>"Opslaan"</strong> en vervolgens op <strong>"Publiceren"</strong>. De widget verschijnt direct op je pagina.</>,
      },
    ],
  },
  {
    id: 'wix',
    label: 'Wix',
    emoji: '⬜',
    steps: [
      {
        title: 'Kopieer de widget-code',
        body: <>Klik op de oranje knop <strong>"Kopieer code"</strong> hierboven.</>,
      },
      {
        title: 'Open de Wix Editor',
        body: <>Ga naar je Wix-dashboard en open de pagina-editor via <strong>"Site bewerken"</strong>.</>,
      },
      {
        title: 'Voeg een HTML-element toe',
        body: <>Klik op het <strong>+</strong>-icoontje (Toevoegen) → <strong>Embed</strong> → <strong>HTML Embed</strong>. Sleep het element naar de gewenste positie.</>,
      },
      {
        title: 'Plak de code',
        body: <>Klik op het HTML-element → <strong>"Code invoeren"</strong>. Plak de iframe-code in het venster en klik op <strong>"Bijwerken"</strong>.</>,
      },
      {
        title: 'Sla op en publiceer',
        body: <>Klik rechtsboven op <strong>"Opslaan"</strong> en daarna op <strong>"Publiceren"</strong>.</>,
      },
    ],
  },
  {
    id: 'webflow',
    label: 'Webflow',
    emoji: '🔷',
    steps: [
      {
        title: 'Kopieer de widget-code',
        body: <>Klik op de oranje knop <strong>"Kopieer code"</strong> hierboven.</>,
      },
      {
        title: 'Open de Webflow Designer',
        body: <>Open je project in de Webflow Designer en navigeer naar de pagina waar je de widget wilt plaatsen.</>,
      },
      {
        title: 'Voeg een HTML Embed-component toe',
        body: <>Zoek in het <strong>Add Elements</strong>-paneel (links, <kbd>A</kbd>) naar <strong>"HTML Embed"</strong> en sleep het naar de gewenste sectie.</>,
      },
      {
        title: 'Plak de code',
        body: <>Dubbelklik op het Embed-element. Plak de iframe-code in het veld en klik op <strong>"Save &amp; Close"</strong>.</>,
      },
      {
        title: 'Publiceer de site',
        body: <>Klik rechtsboven op <strong>"Publish"</strong> en selecteer je domein om de wijzigingen live te zetten.</>,
      },
    ],
  },
] as const;

function OtherPlatformsAccordion() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Code2 className="w-5 h-5 text-slate-500" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900">Andere website-builders</h2>
          <p className="text-xs text-slate-400 mt-0.5">Klik op je platform voor stap-voor-stap instructies.</p>
        </div>
      </div>

      <div className="space-y-2">
        {PLATFORMS.map(({ id, label, emoji, steps }) => {
          const isOpen = openId === id;
          return (
            <div key={id} className="border border-slate-100 rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenId(isOpen ? null : id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="flex items-center gap-2.5 text-sm font-semibold text-slate-800">
                  <span className="text-base">{emoji}</span>
                  {label}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 border-t border-slate-50">
                  <PlatformInstructions steps={steps as any} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function WidgetPage() {
  const { locale } = useParams<{ locale: string }>();

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ['properties-list'],
    queryFn: () => api.get('/properties').then((r) => r.data.data ?? []),
  });

  const [selectedSlug, setSelectedSlug] = useState('');
  const [showPhoto,   setShowPhoto]   = useState(true);
  const [showPrice,   setShowPrice]   = useState(true);
  const [showRooms,   setShowRooms]   = useState(true);
  const [showReviews, setShowReviews] = useState(true);
  const [lang,        setLang]        = useState<'nl' | 'en'>('nl');
  const [copied,      setCopied]      = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);

  // Auto-select first property
  useEffect(() => {
    if (properties.length && !selectedSlug) {
      setSelectedSlug(properties[0].slug);
    }
  }, [properties, selectedSlug]);

  const params = [
    !showPhoto   && 'photo=0',
    !showPrice   && 'price=0',
    !showRooms   && 'rooms=0',
    !showReviews && 'reviews=0',
    lang !== 'nl' && `lang=${lang}`,
  ].filter(Boolean).join('&');

  const embedUrl  = selectedSlug
    ? `${FRONTEND_BASE}/${lang}/embed/${selectedSlug}${params ? `?${params}` : ''}`
    : '';
  const iframeCode = embedUrl
    ? `<iframe\n  src="${embedUrl}"\n  width="360"\n  height="640"\n  frameborder="0"\n  scrolling="no"\n  style="border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.10);"\n></iframe>`
    : '';

  const handleCopy = async () => {
    if (!iframeCode) return;
    await navigator.clipboard.writeText(iframeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Website Widget</h1>
        <p className="mt-1 text-sm text-slate-500">
          Voeg een boekingswidget toe aan je eigen website — kopieer gewoon de code.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left: configuration */}
        <div className="space-y-5">

          {/* Property selector */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
            <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Configuratie</h2>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Accommodatie
              </label>
              {properties.length === 0 ? (
                <p className="text-sm text-slate-400">Geen accommodaties gevonden.</p>
              ) : (
                <div className="relative">
                  <select
                    value={selectedSlug}
                    onChange={(e) => setSelectedSlug(e.target.value)}
                    className="w-full appearance-none border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.slug}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Taal widget
              </label>
              <div className="flex gap-2">
                {(['nl', 'en'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                      lang === l
                        ? 'bg-brand text-white border-brand'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {l === 'nl' ? '🇳🇱 Nederlands' : '🇬🇧 English'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide mb-1">Weergave-opties</h2>
            <p className="text-xs text-slate-400 mb-4">Kies wat er zichtbaar is in de widget.</p>

            <Toggle
              icon={Image}
              label="Omslagfoto"
              description="Toon de omslagfoto van je accommodatie"
              checked={showPhoto}
              onChange={setShowPhoto}
            />
            <Toggle
              icon={Star}
              label="Beoordelingen"
              description="Toon het gemiddelde cijfer en aantal reviews"
              checked={showReviews}
              onChange={setShowReviews}
            />
            <Toggle
              icon={BedDouble}
              label="Kamerkeuzelijst"
              description="Laat gasten een kamer kiezen als je meerdere kamers hebt"
              checked={showRooms}
              onChange={setShowRooms}
            />
            <Toggle
              icon={DollarSign}
              label="Prijsindicatie"
              description="Toon de geschatte totaalprijs op basis van de gekozen datums"
              checked={showPrice}
              onChange={setShowPrice}
            />
          </div>
        </div>

        {/* Right: code + preview */}
        <div className="space-y-5">

          {/* Generated code */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Jouw widget-code</h2>
              {embedUrl && (
                <a
                  href={embedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-brand hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  Voorbeeld openen
                </a>
              )}
            </div>

            {!selectedSlug ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-50 rounded-xl px-4 py-3">
                <Info className="w-4 h-4 flex-shrink-0" />
                Selecteer eerst een accommodatie.
              </div>
            ) : (
              <>
                <div className="relative">
                  <textarea
                    readOnly
                    value={iframeCode}
                    rows={7}
                    className="w-full font-mono text-xs bg-slate-50 border border-slate-100 rounded-xl p-3.5 pr-12 resize-none text-slate-700 focus:outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    title="Kopieer code"
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-brand hover:border-brand transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  onClick={handleCopy}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#FF5000' }}
                >
                  {copied ? <><Check className="w-4 h-4" /> Gekopieerd!</> : <><Copy className="w-4 h-4" /> Kopieer code</>}
                </button>
              </>
            )}
          </div>

          {/* Live preview toggle */}
          {selectedSlug && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Live voorbeeld</h2>
                <button
                  onClick={() => setShowPreview((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-brand hover:opacity-80 transition-opacity"
                >
                  {showPreview ? <><EyeOff className="w-3.5 h-3.5" /> Verbergen</> : <><Eye className="w-3.5 h-3.5" /> Tonen</>}
                </button>
              </div>

              {showPreview && (
                <div className="flex justify-center py-2">
                  <iframe
                    ref={previewRef}
                    key={embedUrl}
                    src={embedUrl}
                    width={340}
                    height={620}
                    frameBorder={0}
                    scrolling="no"
                    style={{ borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,.10)' }}
                    title="Widget preview"
                  />
                </div>
              )}

              {!showPreview && (
                <p className="text-xs text-slate-400">
                  Klik op "Tonen" om een live voorbeeld van je widget te zien.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* WordPress instructions */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center flex-shrink-0">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Zo voeg je de widget toe aan je WordPress-website</h2>
            <p className="text-xs text-slate-400 mt-0.5">Geen technische kennis nodig — volg de stappen hieronder.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4">
            <StepBadge n={1} />
            <div>
              <p className="text-sm font-semibold text-slate-800">Kopieer de widget-code</p>
              <p className="text-sm text-slate-500 mt-0.5">
                Klik hierboven op de oranje knop <strong>"Kopieer code"</strong>. De volledige iframe-code staat nu op je klembord.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <StepBadge n={2} />
            <div>
              <p className="text-sm font-semibold text-slate-800">Open de pagina in WordPress</p>
              <p className="text-sm text-slate-500 mt-0.5">
                Ga naar je WordPress-dashboard → <strong>Pagina's</strong> (of <strong>Berichten</strong>) en open de pagina waar je de widget wilt plaatsen.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <StepBadge n={3} />
            <div>
              <p className="text-sm font-semibold text-slate-800">Voeg een "Aangepaste HTML"-blok toe</p>
              <p className="text-sm text-slate-500 mt-0.5">
                Klik in de editor op het <strong>+</strong>-icoontje om een nieuw blok toe te voegen. Zoek naar <strong>"Aangepaste HTML"</strong> (of <em>Custom HTML</em>) en selecteer dat blok.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <StepBadge n={4} />
            <div>
              <p className="text-sm font-semibold text-slate-800">Plak de code in het HTML-blok</p>
              <p className="text-sm text-slate-500 mt-0.5">
                Klik in het lege tekstveld van het HTML-blok en druk op <strong>Ctrl+V</strong> (Windows) of <strong>⌘+V</strong> (Mac) om de code te plakken.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <StepBadge n={5} />
            <div>
              <p className="text-sm font-semibold text-slate-800">Sla op en publiceer</p>
              <p className="text-sm text-slate-500 mt-0.5">
                Klik rechtsbovenin op <strong>"Bijwerken"</strong> of <strong>"Publiceren"</strong>. De boekingswidget verschijnt nu direct op je pagina — helemaal up-to-date met jouw beschikbaarheid.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Other platform instructions */}
      <OtherPlatformsAccordion />

    </div>
  );
}
