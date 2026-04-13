import type { Block, BlockType } from './types';

let _counter = 0;
export function uid(): string {
  _counter += 1;
  return `blk_${Date.now().toString(36)}_${_counter}`;
}

export function createDefaultBlock(type: BlockType): Block {
  switch (type) {
    case 'header':
      return { id: uid(), type: 'header', props: { title: 'Welkom!', subtitle: '', bgColor: '#FF5000', textColor: '#ffffff' } };
    case 'text':
      return { id: uid(), type: 'text', props: { content: 'Beste {{guest_name}},\n\nSchrijf hier uw bericht.', align: 'left', fontSize: 16, color: '#374151', bold: false } };
    case 'button':
      return { id: uid(), type: 'button', props: { label: 'Klik hier', url: 'https://', bgColor: '#FF5000', textColor: '#ffffff', align: 'center' } };
    case 'image':
      return { id: uid(), type: 'image', props: { src: '', alt: 'Afbeelding', align: 'center', width: 100 } };
    case 'divider':
      return { id: uid(), type: 'divider', props: { color: '#e2e8f0', thickness: 1 } };
    case 'spacer':
      return { id: uid(), type: 'spacer', props: { height: 32 } };
    case 'footer':
      return { id: uid(), type: 'footer', props: { text: '© {{property_name}} · DirectBnB\nDeze e-mail is automatisch verstuurd.', textColor: '#94a3b8', bgColor: '#f8fafc' } };
    case 'booking_details':
      return { id: uid(), type: 'booking_details', props: { bgColor: '#f8fafc', showProperty: true, showRoom: true, showCheckin: true, showCheckout: true, showGuests: true, showPrice: true } };
  }
}

export function bookingConfirmationTemplate(): Block[] {
  return [
    { id: uid(), type: 'header', props: { title: 'Boeking bevestigd! ✓', subtitle: 'Hartelijk dank voor uw boeking.', bgColor: '#FF5000', textColor: '#ffffff' } },
    { id: uid(), type: 'spacer', props: { height: 32 } },
    { id: uid(), type: 'text', props: { content: 'Beste {{guest_name}},\n\nHartelijk dank voor uw boeking bij {{property_name}}. Wij bevestigen hierbij uw reservering en kijken ernaar uit u te mogen verwelkomen!', align: 'left', fontSize: 16, color: '#374151', bold: false } },
    { id: uid(), type: 'spacer', props: { height: 16 } },
    { id: uid(), type: 'booking_details', props: { bgColor: '#f0f4ff', showProperty: true, showRoom: true, showCheckin: true, showCheckout: true, showGuests: true, showPrice: true } },
    { id: uid(), type: 'spacer', props: { height: 16 } },
    { id: uid(), type: 'text', props: { content: 'Heeft u vragen? Neem dan contact met ons op via {{owner_email}}.', align: 'left', fontSize: 15, color: '#374151', bold: false } },
    { id: uid(), type: 'spacer', props: { height: 32 } },
    { id: uid(), type: 'footer', props: { text: '© {{property_name}} · DirectBnB\nDeze e-mail is automatisch verstuurd.', textColor: '#94a3b8', bgColor: '#f8fafc' } },
  ];
}

export function bookingCancellationTemplate(): Block[] {
  return [
    { id: uid(), type: 'header', props: { title: 'Boeking geannuleerd', subtitle: 'Uw boeking is helaas geannuleerd.', bgColor: '#ef4444', textColor: '#ffffff' } },
    { id: uid(), type: 'spacer', props: { height: 32 } },
    { id: uid(), type: 'text', props: { content: 'Beste {{guest_name}},\n\nLeider moeten wij u informeren dat uw boeking bij {{property_name}} is geannuleerd. Wij bieden hiervoor onze oprechte excuses aan.', align: 'left', fontSize: 16, color: '#374151', bold: false } },
    { id: uid(), type: 'spacer', props: { height: 16 } },
    { id: uid(), type: 'booking_details', props: { bgColor: '#fff1f2', showProperty: true, showRoom: true, showCheckin: true, showCheckout: true, showGuests: true, showPrice: false } },
    { id: uid(), type: 'spacer', props: { height: 32 } },
    { id: uid(), type: 'footer', props: { text: '© {{property_name}} · DirectBnB\nDeze e-mail is automatisch verstuurd.', textColor: '#94a3b8', bgColor: '#f8fafc' } },
  ];
}

export function bookingRequestTemplate(): Block[] {
  return [
    { id: uid(), type: 'header', props: { title: 'Boekingsaanvraag ontvangen', subtitle: 'Uw aanvraag is in behandeling.', bgColor: '#0ea5e9', textColor: '#ffffff' } },
    { id: uid(), type: 'spacer', props: { height: 32 } },
    { id: uid(), type: 'text', props: { content: 'Beste {{guest_name}},\n\nWij hebben uw boekingsaanvraag voor {{property_name}} ontvangen en zullen deze zo spoedig mogelijk verwerken.', align: 'left', fontSize: 16, color: '#374151', bold: false } },
    { id: uid(), type: 'spacer', props: { height: 16 } },
    { id: uid(), type: 'booking_details', props: { bgColor: '#f0f9ff', showProperty: true, showRoom: true, showCheckin: true, showCheckout: true, showGuests: true, showPrice: true } },
    { id: uid(), type: 'spacer', props: { height: 32 } },
    { id: uid(), type: 'footer', props: { text: '© {{property_name}} · DirectBnB\nDeze e-mail is automatisch verstuurd.', textColor: '#94a3b8', bgColor: '#f8fafc' } },
  ];
}

export function checkInWelcomeTemplate(): Block[] {
  return [
    { id: uid(), type: 'header', props: { title: 'Welkom, {{guest_name}}! 🏡', subtitle: 'Wij kijken uit naar uw verblijf.', bgColor: '#10b981', textColor: '#ffffff' } },
    { id: uid(), type: 'spacer', props: { height: 32 } },
    { id: uid(), type: 'text', props: { content: 'Beste {{guest_name}},\n\nHartelijk welkom bij {{property_name}}! Uw check-in staat gepland op {{check_in}}. Hieronder vindt u alle praktische informatie voor uw verblijf.', align: 'left', fontSize: 16, color: '#374151', bold: false } },
    { id: uid(), type: 'spacer', props: { height: 16 } },
    { id: uid(), type: 'booking_details', props: { bgColor: '#ecfdf5', showProperty: true, showRoom: true, showCheckin: true, showCheckout: true, showGuests: true, showPrice: false } },
    { id: uid(), type: 'spacer', props: { height: 16 } },
    { id: uid(), type: 'text', props: { content: '🔑 Check-in instructies\n\nU kunt inchecken vanaf 15:00 uur. Bij aankomst treft u de sleutel op de afgesproken locatie. Heeft u vragen? Bereik ons via {{owner_email}}.', align: 'left', fontSize: 15, color: '#374151', bold: false } },
    { id: uid(), type: 'spacer', props: { height: 32 } },
    { id: uid(), type: 'footer', props: { text: '© {{property_name}} · DirectBnB\nDeze e-mail is automatisch verstuurd.', textColor: '#94a3b8', bgColor: '#f8fafc' } },
  ];
}

export function thankYouReviewTemplate(): Block[] {
  return [
    { id: uid(), type: 'header', props: { title: 'Bedankt voor uw verblijf! ⭐', subtitle: 'Uw mening is waardevol voor ons.', bgColor: '#f59e0b', textColor: '#ffffff' } },
    { id: uid(), type: 'spacer', props: { height: 32 } },
    { id: uid(), type: 'text', props: { content: 'Beste {{guest_name}},\n\nHartelijk dank voor uw verblijf bij {{property_name}}! Wij hopen dat u een prettige tijd heeft gehad en dat alles naar wens was.\n\nZou u een moment willen nemen om uw ervaring te delen? Uw review helpt andere gasten en stelt ons in staat onze service te verbeteren.', align: 'left', fontSize: 16, color: '#374151', bold: false } },
    { id: uid(), type: 'spacer', props: { height: 16 } },
    { id: uid(), type: 'button', props: { label: '⭐ Schrijf een review', url: 'https://', bgColor: '#f59e0b', textColor: '#ffffff', align: 'center' } },
    { id: uid(), type: 'spacer', props: { height: 16 } },
    { id: uid(), type: 'text', props: { content: 'Wij hopen u snel weer te mogen verwelkomen bij {{property_name}}!', align: 'center', fontSize: 15, color: '#374151', bold: false } },
    { id: uid(), type: 'spacer', props: { height: 32 } },
    { id: uid(), type: 'footer', props: { text: '© {{property_name}} · DirectBnB\nDeze e-mail is automatisch verstuurd.', textColor: '#94a3b8', bgColor: '#f8fafc' } },
  ];
}

export const STARTER_TEMPLATES = [
  { id: 'booking_confirmation', label: '✓ Boeking bevestigd', create: bookingConfirmationTemplate },
  { id: 'booking_cancellation', label: '✕ Boeking geannuleerd', create: bookingCancellationTemplate },
  { id: 'booking_request', label: '📬 Aanvraag ontvangen', create: bookingRequestTemplate },
  { id: 'checkin_welcome', label: '🏡 Welkomstmail voor aankomst', create: checkInWelcomeTemplate },
  { id: 'thank_you_review', label: '⭐ Bedankje & Review verzoek', create: thankYouReviewTemplate },
];
