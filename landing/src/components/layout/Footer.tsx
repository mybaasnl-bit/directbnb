import Link from 'next/link';

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Voordelen', href: '#features' },
      { label: 'Hoe werkt het', href: '#how-it-works' },
      { label: 'Besparing', href: '#besparing' },
    ],
  },
  {
    title: 'Bedrijf',
    links: [
      { label: 'Over ons', href: '#' },
      { label: 'Contact', href: '#' },
      { label: 'Dashboard', href: '/nl/login' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help center', href: '#' },
      { label: 'Privacy', href: '#' },
      { label: 'Voorwaarden', href: '#' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
              </div>
              <span className="text-white font-bold text-lg tracking-tight">
                Direct<span className="text-brand-400">BnB</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Directe boekingen voor B&B eigenaren. Geen commissies, volledige controle.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-white font-semibold text-sm mb-4">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-slate-400 hover:text-white text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-500 text-sm">© 2026 DirectBnB. Alle rechten voorbehouden.</p>
          <p className="text-slate-500 text-sm">Gemaakt in Nederland 🇳🇱</p>
        </div>
      </div>
    </footer>
  );
}
