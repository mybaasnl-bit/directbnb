'use client';

// Mini calendar for mockup
function MockCalendar() {
  const booked = [5, 6, 11, 12, 16, 17, 18];
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  // April starts on Wednesday = offset 2 (Mon-start)
  const offset = 2;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-slate-900 text-sm">April 2026</span>
        <div className="flex gap-1">
          <button className="w-6 h-6 rounded text-slate-400 hover:text-slate-600 flex items-center justify-center text-xs">‹</button>
          <button className="w-6 h-6 rounded text-slate-400 hover:text-slate-600 flex items-center justify-center text-xs">›</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {['M','D','W','D','V','Z','Z'].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-slate-400 py-0.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array(offset).fill(null).map((_, i) => <div key={`e${i}`} />)}
        {days.map((d) => (
          <div key={d} className={`aspect-square flex items-center justify-center text-[11px] font-semibold rounded-lg transition-colors
            ${booked.includes(d) ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="bg-slate-50 min-h-screen flex items-center pt-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: copy */}
          <div className="animate-fade-up">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6">
              Meer boekingen,{' '}
              <span className="text-brand-500">zonder<br />commissies</span>
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
              Ontvang directe reserveringen en houd tot €30 per nacht zelf.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <a href="#signup"
                onClick={(e) => { e.preventDefault(); document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold text-base px-7 py-3.5 rounded-xl transition-colors">
                Start gratis beta
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <a href="#how-it-works"
                onClick={(e) => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="inline-flex items-center justify-center gap-2 bg-white border-2 border-slate-200 hover:border-brand-500 hover:text-brand-500 text-slate-700 font-bold text-base px-7 py-3.5 rounded-xl transition-colors">
                Bekijk demo
              </a>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[
                  { initials: 'MV', bg: 'bg-brand-500' },
                  { initials: 'HJ', bg: 'bg-slate-700' },
                  { initials: 'EV', bg: 'bg-brand-400' },
                ].map((a) => (
                  <div key={a.initials} className={`w-8 h-8 rounded-full ${a.bg} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}>
                    {a.initials}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((s) => (
                  <svg key={s} className="w-4 h-4 text-brand-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-slate-500 font-medium">Al meer dan 200 B&B eigenaren</p>
            </div>
          </div>

          {/* Right: dashboard mockup */}
          <div className="hidden lg:block relative animate-float">

            {/* Main dashboard card */}
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 relative">
              <h3 className="font-bold text-slate-900 text-base mb-5">Dashboard Overzicht</h3>

              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-slate-50 rounded-2xl p-4">
                  <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900">24</p>
                  <p className="text-xs text-slate-400 mt-0.5">Boekingen</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4">
                  <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900">€4.850</p>
                  <p className="text-xs text-slate-400 mt-0.5">Inkomsten</p>
                </div>
              </div>

              {/* Mini calendar */}
              <MockCalendar />

              {/* Aankomende gasten */}
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="font-semibold text-slate-700">Aankomende Gasten</span>
              </div>
            </div>

            {/* Floating card: users */}
            <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 w-48">
              <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-2xl font-extrabold text-slate-900">200+</p>
              <p className="text-xs text-slate-400 leading-snug">B&B eigenaren gebruiken DirectBnB</p>
            </div>

            {/* Floating card: savings */}
            <div className="absolute -bottom-4 -right-6 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 w-44">
              <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <p className="text-2xl font-extrabold text-slate-900">€720</p>
              <p className="text-xs text-slate-400 leading-snug">Gem. besparing per maand</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
