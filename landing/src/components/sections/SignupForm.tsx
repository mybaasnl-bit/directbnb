'use client';

import { useState } from 'react';

interface FormData {
  name: string;
  email: string;
  bnbName: string;
  location: string;
}

const initialState: FormData = { name: '', email: '', bnbName: '', location: '' };

const stats = [
  { value: '€0', label: 'Commissies' },
  { value: '5 min', label: 'Setup tijd' },
  { value: '100%', label: 'Jouw winst' },
];

export default function SignupForm() {
  const [data, setData] = useState<FormData>(initialState);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('success');
      setData(initialState);
    } catch {
      setStatus('error');
    }
  };

  return (
    <section id="signup" className="bg-slate-50 py-20 lg:py-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Klaar om te starten?
          </h2>
          <p className="text-slate-500 text-lg">
            Vraag gratis beta toegang aan en ontvang directe boekingen zonder commissies.
          </p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 mb-10">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-extrabold text-brand-500">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          {status === 'success' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Aanvraag ontvangen!</h3>
              <p className="text-slate-500 text-sm">We nemen binnen 24 uur contact met je op.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { name: 'name', label: 'Jouw naam', placeholder: 'Jan de Vries', type: 'text', required: true },
                { name: 'email', label: 'E-mailadres', placeholder: 'jan@bnb.nl', type: 'email', required: true },
                { name: 'bnbName', label: 'Naam van je B&B', placeholder: 'Hotel de Roos', type: 'text', required: true },
                { name: 'location', label: 'Locatie', placeholder: 'Amsterdam, Nederland', type: 'text', required: true },
              ].map((field) => (
                <div key={field.name}>
                  <label htmlFor={field.name} className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {field.label}
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    required={field.required}
                    value={data[field.name as keyof FormData]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white transition-all"
                  />
                </div>
              ))}

              {status === 'error' && (
                <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  Er is iets misgegaan. Probeer het opnieuw.
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold py-4 rounded-2xl text-base transition-colors mt-2"
              >
                {status === 'loading' ? 'Versturen...' : 'Vraag beta toegang aan →'}
              </button>

              <p className="text-center text-slate-400 text-xs flex items-center justify-center gap-1.5 pt-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Geen spam. Gegevens worden nooit gedeeld.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
