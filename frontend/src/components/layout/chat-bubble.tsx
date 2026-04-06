'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, CheckCircle, ChevronDown } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

type Step = 'idle' | 'open' | 'sent';
type Category = 'QUESTION' | 'BUG' | 'FEATURE' | 'GENERAL';

const CATEGORIES: { value: Category; label: string; emoji: string }[] = [
  { value: 'QUESTION', label: 'Ik heb een vraag',      emoji: '❓' },
  { value: 'BUG',      label: 'Er gaat iets fout',     emoji: '🐛' },
  { value: 'FEATURE',  label: 'Idee of suggestie',     emoji: '💡' },
  { value: 'GENERAL',  label: 'Iets anders',           emoji: '💬' },
];

export function ChatBubble() {
  const [step, setStep]         = useState<Step>('idle');
  const [message, setMessage]   = useState('');
  const [category, setCategory] = useState<Category>('QUESTION');
  const textareaRef             = useRef<HTMLTextAreaElement>(null);
  const bubbleRef               = useRef<HTMLDivElement>(null);

  // Focus textarea als chat opent
  useEffect(() => {
    if (step === 'open' && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [step]);

  // Sluit op Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setStep('idle'); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  const submit = useMutation({
    mutationFn: () => api.post('/feedback', { message: message.trim(), category }),
    onSuccess: () => {
      setStep('sent');
      setMessage('');
    },
  });

  const handleOpen  = () => { window.location.href = 'mailto:jesse@directbnb.nl'; };
  const handleClose = () => { setStep('idle'); setMessage(''); submit.reset(); };
  const handleSent  = () => { setStep('idle'); setMessage(''); submit.reset(); };

  const canSend = message.trim().length >= 3 && !submit.isPending;

  return (
    <div ref={bubbleRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* Chat venster */}
      {step !== 'idle' && (
        <div className="w-[340px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-200">

          {/* Header van chat */}
          <div className="bg-brand px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">DirectBnB Support</p>
                <p className="text-white/70 text-xs">Wij reageren zo snel mogelijk</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              aria-label="Sluit chat"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Inhoud */}
          {step === 'sent' ? (
            // Bevestiging
            <div className="px-5 py-10 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Bericht verzonden!</h3>
              <p className="text-sm text-slate-500">
                Bedankt voor uw bericht. We nemen zo snel mogelijk contact met u op.
              </p>
              <button
                onClick={handleSent}
                className="mt-6 w-full bg-brand hover:bg-brand-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                Sluiten
              </button>
            </div>
          ) : (
            // Formulier
            <div className="p-5 space-y-4">
              {/* Introductie ballon */}
              <div className="bg-slate-50 rounded-2xl rounded-tl-sm px-4 py-3">
                <p className="text-sm text-slate-700">
                  Hallo! Hoe kunnen we u helpen? Stel gerust een vraag of stuur ons een bericht. 😊
                </p>
              </div>

              {/* Categorie knoppen */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Onderwerp
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(({ value, label, emoji }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCategory(value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all border-2 ${
                        category === value
                          ? 'border-brand bg-brand-light text-brand'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-base leading-none">{emoji}</span>
                      <span className="leading-tight">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Berichtveld */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Uw bericht
                </p>
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canSend) {
                      submit.reset();
                      submit.mutate();
                    }
                  }}
                  rows={3}
                  placeholder="Typ hier uw vraag of opmerking..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                />
                <p className="text-xs text-slate-400 mt-1">Tip: Ctrl+Enter om te verzenden</p>
              </div>

              {/* Foutmelding */}
              {submit.isError && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                  Versturen mislukt. Probeer het opnieuw.
                </p>
              )}

              {/* Verstuur knop */}
              <button
                onClick={() => { submit.reset(); submit.mutate(); }}
                disabled={!canSend}
                className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-sm transition-colors"
              >
                <Send className="w-4 h-4" />
                {submit.isPending ? 'Versturen...' : 'Verstuur bericht'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating knop */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-2.5 px-5 py-3 rounded-full shadow-lg font-semibold text-sm text-white transition-all duration-200 hover:scale-105 active:scale-95 bg-brand hover:bg-brand-600"
        aria-label="Stuur feedback"
      >
        <>
            <MessageCircle className="w-4 h-4" />
            Feedback geven
          </>
      </button>
    </div>
  );
}
