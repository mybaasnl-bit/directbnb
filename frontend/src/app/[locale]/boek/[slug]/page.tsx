'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import {
  MapPin, ChevronDown, Check, Loader2, Users, Calendar, MessageSquare, Phone, User, Mail,
  CreditCard, ArrowRight, ShieldCheck,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RoomPhoto { id: string; url: string; altText?: string; }
interface Room {
  id: string;
  name: string;
  descriptionNl: string | null;
  descriptionEn: string | null;
  pricePerNight: string;
  maxGuests: number;
  photos: RoomPhoto[];
}
interface PropertyPhoto { id: string; url: string; altText?: string; isCover: boolean; }
interface Property {
  id: string;
  name: string;
  slug: string;
  descriptionNl: string | null;
  descriptionEn: string | null;
  addressCity: string | null;
  addressCountry: string;
  photos: PropertyPhoto[];
  rooms: Room[];
}

type PaymentStep = 'form' | 'payment' | 'redirecting';
type PaymentMethod = 'ideal' | 'wero' | 'banktransfer';

// ─── Payment method config ────────────────────────────────────────────────────

const PAYMENT_METHODS: { id: PaymentMethod; label: string; labelEn: string; icon: string; desc: string; descEn: string }[] = [
  {
    id: 'ideal',
    label: 'iDEAL',
    labelEn: 'iDEAL',
    icon: '🏦',
    desc: 'Betaal direct via jouw bank',
    descEn: 'Pay directly via your bank',
  },
  {
    id: 'wero',
    label: 'Wero',
    labelEn: 'Wero',
    icon: '💳',
    desc: 'Europese digitale portemonnee',
    descEn: 'European digital wallet',
  },
  {
    id: 'banktransfer',
    label: 'Bankoverschrijving',
    labelEn: 'Bank transfer',
    icon: '🏧',
    desc: 'Overschrijving op rekening (2–3 werkdagen)',
    descEn: 'Transfer to account (2–3 business days)',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BookingPage() {
  const { slug, locale } = useParams<{ slug: string; locale: string }>();
  const lang = (locale === 'en' ? 'en' : 'nl') as 'nl' | 'en';

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [checkIn, setCheckIn] = useState(today());
  const [checkOut, setCheckOut] = useState(tomorrow());
  const [numGuests, setNumGuests] = useState(2);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const [step, setStep] = useState<PaymentStep>('form');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<number>(0);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('ideal');
  const [mollieEnabled, setMollieEnabled] = useState<boolean | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    axios.get(`${API}/public/properties/${slug}`)
      .then(res => {
        const p: Property = res.data?.data ?? res.data;
        setProperty(p);
        if (p.rooms.length > 0) setSelectedRoom(p.rooms[0]);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

    // Check if Mollie is configured
    axios.get(`${API}/mollie/status`)
      .then(res => setMollieEnabled(res.data?.data?.enabled ?? res.data?.enabled ?? false))
      .catch(() => setMollieEnabled(false));
  }, [slug]);

  const nights = calcNights(checkIn, checkOut);
  const totalPrice = selectedRoom ? (Number(selectedRoom.pricePerNight) * nights).toFixed(2) : '0.00';
  const deposit30 = selectedRoom ? (Number(selectedRoom.pricePerNight) * nights * 0.3).toFixed(2) : '0.00';

  // ─── Step 1: Submit booking form ───────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || nights <= 0) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await axios.post(`${API}/public/bookings`, {
        roomId: selectedRoom.id,
        checkIn,
        checkOut,
        numGuests,
        guestFirstName: firstName,
        guestLastName: lastName,
        guestEmail: email,
        guestPhone: phone || undefined,
        guestMessage: message || undefined,
      });

      const booking = res.data?.data ?? res.data;
      setBookingId(booking.id);
      setDepositAmount(Number(deposit30));

      if (mollieEnabled) {
        setStep('payment');
      } else {
        // No payment configured — show pure success
        setStep('redirecting');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message ?? err.response?.data?.error;
      setSubmitError(
        Array.isArray(msg) ? msg[0] :
        msg ?? (lang === 'nl'
          ? 'Er is een fout opgetreden. Controleer je gegevens en probeer opnieuw.'
          : 'Something went wrong. Please check your details and try again.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Step 2: Initiate Mollie payment ──────────────────────────────────────

  const handlePay = async () => {
    if (!bookingId) return;
    setPaymentLoading(true);
    setPaymentError(null);

    try {
      const res = await axios.post(`${API}/mollie/public/pay`, {
        bookingId,
        method: selectedMethod,
      });

      const data = res.data?.data ?? res.data;
      const checkoutUrl: string = data.checkoutUrl;

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message ?? err.response?.data?.error;
      setPaymentError(
        Array.isArray(msg) ? msg[0] :
        msg ?? (lang === 'nl'
          ? 'Betaling kon niet worden gestart. Probeer opnieuw.'
          : 'Could not start payment. Please try again.')
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  // ─── Translations ─────────────────────────────────────────────────────────

  const t = {
    nl: {
      notFound: 'Boekingspagina niet gevonden',
      notFoundSub: 'Deze B&B pagina bestaat niet of is niet meer beschikbaar.',
      checkIn: 'Incheckdatum',
      checkOut: 'Uitcheckdatum',
      guests: 'Aantal gasten',
      guest: 'gast',
      room: 'Kamer',
      pricePerNight: 'per nacht',
      nights: 'nachten',
      night: 'nacht',
      total: 'Totaal',
      deposit: 'Aanbetaling (30%)',
      personalDetails: 'Jouw gegevens',
      firstName: 'Voornaam',
      lastName: 'Achternaam',
      email: 'E-mailadres',
      phone: 'Telefoonnummer (optioneel)',
      messageLabel: 'Bericht aan de eigenaar (optioneel)',
      submit: 'Ga naar betaling',
      submitNoPay: 'Boekingsaanvraag versturen',
      submitting: 'Versturen...',
      successTitle: 'Aanvraag verstuurd!',
      successMsg: 'Je boekingsaanvraag is ontvangen. Je ontvangt een bevestigingsmail en de eigenaar neemt zo snel mogelijk contact met je op.',
      maxGuests: 'Max',
      commission: '0% commissie — directe boeking',
      noRooms: 'Geen kamers beschikbaar',
      paymentTitle: 'Kies betaalmethode',
      paymentSub: 'Betaal nu 30% aanbetaling om je boeking te bevestigen.',
      payNow: 'Nu betalen',
      paying: 'Doorsturen naar betaling...',
      securePayment: 'Beveiligde betaling via Mollie',
      skipPayment: 'Overslaan, later betalen',
    },
    en: {
      notFound: 'Booking page not found',
      notFoundSub: 'This B&B page does not exist or is no longer available.',
      checkIn: 'Check-in date',
      checkOut: 'Check-out date',
      guests: 'Number of guests',
      guest: 'guest',
      room: 'Room',
      pricePerNight: 'per night',
      nights: 'nights',
      night: 'night',
      total: 'Total',
      deposit: 'Deposit (30%)',
      personalDetails: 'Your details',
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email address',
      phone: 'Phone number (optional)',
      messageLabel: 'Message to the host (optional)',
      submit: 'Continue to payment',
      submitNoPay: 'Send booking request',
      submitting: 'Sending...',
      successTitle: 'Request sent!',
      successMsg: 'Your booking request has been received. You will receive a confirmation email and the host will contact you as soon as possible.',
      maxGuests: 'Max',
      commission: '0% commission — direct booking',
      noRooms: 'No rooms available',
      paymentTitle: 'Choose payment method',
      paymentSub: 'Pay a 30% deposit now to confirm your booking.',
      payNow: 'Pay now',
      paying: 'Redirecting to payment...',
      securePayment: 'Secure payment via Mollie',
      skipPayment: 'Skip, pay later',
    },
  }[lang];

  // ─── Loading / not-found states ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (notFound || !property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <div className="text-5xl mb-4">🏡</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{t.notFound}</h1>
        <p className="text-slate-500">{t.notFoundSub}</p>
      </div>
    );
  }

  // ─── Payment step ──────────────────────────────────────────────────────────

  if (step === 'payment') {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <span className="text-lg font-bold text-slate-900">
              Direct<span className="text-indigo-600">BnB</span>
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              {t.commission}
            </span>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-12">
          {/* Booking summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-900">{property.name}</p>
                <p className="text-sm text-slate-500">{selectedRoom?.name} · {nights} {nights === 1 ? t.night : t.nights}</p>
                <p className="text-xs text-slate-400 mt-0.5">{checkIn} → {checkOut}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">{t.total}</p>
                <p className="font-bold text-slate-900">€{totalPrice}</p>
                <p className="text-xs text-indigo-600 font-medium">{t.deposit}: €{deposit30}</p>
              </div>
            </div>
          </div>

          {/* Payment method picker */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-bold text-slate-900 text-lg mb-1">{t.paymentTitle}</h2>
            <p className="text-sm text-slate-500 mb-5">{t.paymentSub}</p>

            <div className="space-y-3 mb-6">
              {PAYMENT_METHODS.map(pm => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setSelectedMethod(pm.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                    selectedMethod === pm.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-indigo-200 bg-white'
                  }`}
                >
                  <span className="text-2xl">{pm.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 text-sm">{lang === 'nl' ? pm.label : pm.labelEn}</p>
                    <p className="text-xs text-slate-500">{lang === 'nl' ? pm.desc : pm.descEn}</p>
                  </div>
                  {selectedMethod === pm.id && (
                    <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {paymentError && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-700 mb-4">
                {paymentError}
              </div>
            )}

            <button
              type="button"
              onClick={handlePay}
              disabled={paymentLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {paymentLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{t.paying}</>
              ) : (
                <><ArrowRight className="w-4 h-4" />{t.payNow} — €{deposit30}</>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep('redirecting')}
              className="w-full mt-3 text-slate-400 hover:text-slate-600 text-sm py-2 transition-colors"
            >
              {t.skipPayment}
            </button>

            <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t.securePayment}
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ─── Success state (no payment / skipped) ─────────────────────────────────

  if (step === 'redirecting') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <Check className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">{t.successTitle}</h1>
        <p className="text-slate-600 max-w-md leading-relaxed">{t.successMsg}</p>
        <div className="mt-6 text-sm text-slate-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
          {t.commission}
        </div>
      </div>
    );
  }

  // ─── Main booking form ────────────────────────────────────────────────────

  const coverPhoto = property.photos.find(p => p.isCover) ?? property.photos[0];
  const description = lang === 'nl' ? property.descriptionNl : property.descriptionEn;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-lg font-bold text-slate-900">
            Direct<span className="text-indigo-600">BnB</span>
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            {t.commission}
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ─── Left: property info ─────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-6">

            {/* Cover photo */}
            {coverPhoto ? (
              <div className="rounded-2xl overflow-hidden aspect-video bg-slate-200">
                <img
                  src={coverPhoto.url}
                  alt={coverPhoto.altText ?? property.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="rounded-2xl aspect-video bg-gradient-to-br from-indigo-100 to-slate-200 flex items-center justify-center">
                <span className="text-5xl">🏡</span>
              </div>
            )}

            {/* Property info */}
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">{property.name}</h1>
              {property.addressCity && (
                <p className="text-slate-500 flex items-center gap-1.5 text-sm">
                  <MapPin className="w-4 h-4" />
                  {property.addressCity}, {property.addressCountry}
                </p>
              )}
              {description && (
                <p className="text-slate-600 leading-relaxed mt-4 text-sm">{description}</p>
              )}
            </div>

            {/* Room picker */}
            {property.rooms.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center text-amber-700">
                {t.noRooms}
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="font-semibold text-slate-800">{t.room}</h2>
                {property.rooms.map(room => {
                  const desc = lang === 'nl' ? room.descriptionNl : room.descriptionEn;
                  const photo = room.photos[0];
                  const isSelected = selectedRoom?.id === room.id;
                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => { setSelectedRoom(room); setNumGuests(Math.min(numGuests, room.maxGuests)); }}
                      className={`w-full text-left flex gap-4 p-4 rounded-2xl border-2 transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-200 bg-white hover:border-indigo-200'
                      }`}
                    >
                      {photo ? (
                        <img src={photo.url} alt={room.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-2xl">🛏️</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-slate-900">{room.name}</h3>
                          <span className="font-bold text-indigo-600 text-sm flex-shrink-0">
                            €{Number(room.pricePerNight).toFixed(0)}<span className="font-normal text-slate-400">/{t.pricePerNight}</span>
                          </span>
                        </div>
                        {desc && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{desc}</p>}
                        <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {t.maxGuests} {room.maxGuests} {t.guest}s
                        </p>
                      </div>
                      {isSelected && (
                        <div className="flex-shrink-0 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ─── Right: booking form ──────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-24">
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      <Calendar className="w-3.5 h-3.5 inline mr-1" />
                      {t.checkIn}
                    </label>
                    <input
                      type="date"
                      value={checkIn}
                      min={today()}
                      onChange={e => setCheckIn(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      <Calendar className="w-3.5 h-3.5 inline mr-1" />
                      {t.checkOut}
                    </label>
                    <input
                      type="date"
                      value={checkOut}
                      min={checkIn || today()}
                      onChange={e => setCheckOut(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Guests */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    <Users className="w-3.5 h-3.5 inline mr-1" />
                    {t.guests}
                  </label>
                  <select
                    value={numGuests}
                    onChange={e => setNumGuests(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {Array.from({ length: selectedRoom?.maxGuests ?? 4 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>{n} {t.guest}{n !== 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Price summary */}
                {nights > 0 && selectedRoom && (
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>€{Number(selectedRoom.pricePerNight).toFixed(0)} × {nights} {nights === 1 ? t.night : t.nights}</span>
                      <span>€{totalPrice}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
                      <span>{t.total}</span>
                      <span>€{totalPrice}</span>
                    </div>
                    {mollieEnabled && (
                      <div className="flex justify-between text-indigo-600 text-xs font-medium pt-1">
                        <span>{t.deposit}</span>
                        <span>€{deposit30}</span>
                      </div>
                    )}
                  </div>
                )}

                <hr className="border-slate-100" />

                {/* Personal details */}
                <h3 className="font-semibold text-slate-800 text-sm">{t.personalDetails}</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">{t.firstName}</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        required
                        placeholder="Jan"
                        className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">{t.lastName}</label>
                    <input
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      required
                      placeholder="Jansen"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{t.email}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="jan@example.nl"
                      className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{t.phone}</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+31 6 12345678"
                      className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
                    {t.messageLabel}
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>

                {submitError && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-700">
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !selectedRoom || nights <= 0}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />{t.submitting}</>
                  ) : mollieEnabled ? (
                    <><CreditCard className="w-4 h-4" />{t.submit}</>
                  ) : (
                    t.submitNoPay
                  )}
                </button>

                <p className="text-center text-xs text-slate-400">
                  {t.commission}
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
