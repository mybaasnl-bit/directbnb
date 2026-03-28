import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BASE_STYLE = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .header { background: #0f172a; padding: 24px 32px; }
  .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; }
  .header span { color: #FF5000; }
  .body { padding: 32px; }
  .body h2 { margin: 0 0 16px; font-size: 18px; color: #0f172a; }
  .body p { margin: 0 0 12px; color: #475569; line-height: 1.6; font-size: 15px; }
  .detail-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin: 20px 0; }
  .detail-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
  .detail-row:last-child { border-bottom: none; }
  .detail-label { color: #64748b; }
  .detail-value { color: #0f172a; font-weight: 500; }
  .button { display: inline-block; background: #FF5000; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 20px 0; }
  .footer { padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
  .footer p { margin: 0; font-size: 13px; color: #94a3b8; }
`;

function layout(content: string, lang: string): string {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>${BASE_STYLE}</style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Direct<span>BnB</span></h1></div>
    <div class="body">${content}</div>
    <div class="footer"><p>DirectBnB &mdash; Direct reserveren, geen commissie</p></div>
  </div>
</body>
</html>`;
}

const templates = [
  {
    name: 'beta_signup_confirmation',
    subjectNl: 'Welkom bij de DirectBnB beta, {{name}}!',
    subjectEn: 'Welcome to the DirectBnB beta, {{name}}!',
    htmlNl: layout(`
      <h2>Welkom bij DirectBnB!</h2>
      <p>Hallo {{name}},</p>
      <p>Bedankt voor je aanmelding voor de DirectBnB beta. We zijn verheugd je te mogen verwelkomen!</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">B&amp;B naam</span><span class="detail-value">{{bnb_name}}</span></div>
        <div class="detail-row"><span class="detail-label">Aanmelddatum</span><span class="detail-value">{{signup_date}}</span></div>
      </div>
      <p>We nemen binnenkort contact met je op om je toegang te verlenen. Heb je vragen? Mail ons op <a href="mailto:hallo@directbnb.nl">hallo@directbnb.nl</a>.</p>
      <a href="https://directbnb.nl" class="button">Ga naar DirectBnB</a>
    `, 'nl'),
    htmlEn: layout(`
      <h2>Welcome to DirectBnB!</h2>
      <p>Hello {{name}},</p>
      <p>Thank you for signing up for the DirectBnB beta. We're excited to have you on board!</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">B&amp;B name</span><span class="detail-value">{{bnb_name}}</span></div>
        <div class="detail-row"><span class="detail-label">Sign-up date</span><span class="detail-value">{{signup_date}}</span></div>
      </div>
      <p>We'll be in touch shortly to grant you access. Questions? Email us at <a href="mailto:hello@directbnb.nl">hello@directbnb.nl</a>.</p>
      <a href="https://directbnb.nl" class="button">Go to DirectBnB</a>
    `, 'en'),
  },
  {
    name: 'booking_request_owner',
    subjectNl: 'Nieuwe boekingsaanvraag — {{property_name}}',
    subjectEn: 'New booking request — {{property_name}}',
    htmlNl: layout(`
      <h2>Nieuwe boekingsaanvraag ontvangen</h2>
      <p>Hallo {{owner_name}},</p>
      <p>U heeft een nieuwe boekingsaanvraag ontvangen voor <strong>{{property_name}}</strong>.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Gast</span><span class="detail-value">{{guest_name}}</span></div>
        <div class="detail-row"><span class="detail-label">E-mail</span><span class="detail-value">{{guest_email}}</span></div>
        <div class="detail-row"><span class="detail-label">Kamer</span><span class="detail-value">{{room_name}}</span></div>
        <div class="detail-row"><span class="detail-label">Inchecken</span><span class="detail-value">{{check_in}}</span></div>
        <div class="detail-row"><span class="detail-label">Uitchecken</span><span class="detail-value">{{check_out}}</span></div>
        <div class="detail-row"><span class="detail-label">Gasten</span><span class="detail-value">{{num_guests}}</span></div>
        <div class="detail-row"><span class="detail-label">Totaalbedrag</span><span class="detail-value">€{{total_price}}</span></div>
      </div>
      <p>Ga naar uw dashboard om de aanvraag te bevestigen of af te wijzen.</p>
      <a href="https://directbnb.nl/dashboard/bookings" class="button">Bekijk aanvraag</a>
    `, 'nl'),
    htmlEn: layout(`
      <h2>New booking request received</h2>
      <p>Hello {{owner_name}},</p>
      <p>You have received a new booking request for <strong>{{property_name}}</strong>.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Guest</span><span class="detail-value">{{guest_name}}</span></div>
        <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">{{guest_email}}</span></div>
        <div class="detail-row"><span class="detail-label">Room</span><span class="detail-value">{{room_name}}</span></div>
        <div class="detail-row"><span class="detail-label">Check-in</span><span class="detail-value">{{check_in}}</span></div>
        <div class="detail-row"><span class="detail-label">Check-out</span><span class="detail-value">{{check_out}}</span></div>
        <div class="detail-row"><span class="detail-label">Guests</span><span class="detail-value">{{num_guests}}</span></div>
        <div class="detail-row"><span class="detail-label">Total</span><span class="detail-value">€{{total_price}}</span></div>
      </div>
      <p>Go to your dashboard to confirm or decline this request.</p>
      <a href="https://directbnb.nl/dashboard/bookings" class="button">View request</a>
    `, 'en'),
  },
  {
    name: 'booking_request_guest',
    subjectNl: 'Boekingsaanvraag ontvangen — {{property_name}}',
    subjectEn: 'Booking request received — {{property_name}}',
    htmlNl: layout(`
      <h2>Aanvraag ontvangen</h2>
      <p>Hallo {{guest_name}},</p>
      <p>Uw boekingsaanvraag voor <strong>{{property_name}}</strong> is ontvangen. De eigenaar neemt zo snel mogelijk contact met u op.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Kamer</span><span class="detail-value">{{room_name}}</span></div>
        <div class="detail-row"><span class="detail-label">Inchecken</span><span class="detail-value">{{check_in}}</span></div>
        <div class="detail-row"><span class="detail-label">Uitchecken</span><span class="detail-value">{{check_out}}</span></div>
        <div class="detail-row"><span class="detail-label">Gasten</span><span class="detail-value">{{num_guests}}</span></div>
        <div class="detail-row"><span class="detail-label">Totaalbedrag</span><span class="detail-value">€{{total_price}}</span></div>
      </div>
      <p>U ontvangt een bevestiging zodra de eigenaar uw aanvraag heeft goedgekeurd.</p>
    `, 'nl'),
    htmlEn: layout(`
      <h2>Request received</h2>
      <p>Hello {{guest_name}},</p>
      <p>Your booking request for <strong>{{property_name}}</strong> has been received. The host will contact you as soon as possible.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Room</span><span class="detail-value">{{room_name}}</span></div>
        <div class="detail-row"><span class="detail-label">Check-in</span><span class="detail-value">{{check_in}}</span></div>
        <div class="detail-row"><span class="detail-label">Check-out</span><span class="detail-value">{{check_out}}</span></div>
        <div class="detail-row"><span class="detail-label">Guests</span><span class="detail-value">{{num_guests}}</span></div>
        <div class="detail-row"><span class="detail-label">Total</span><span class="detail-value">€{{total_price}}</span></div>
      </div>
      <p>You'll receive a confirmation once the host approves your request.</p>
    `, 'en'),
  },
  {
    name: 'booking_confirmed',
    subjectNl: 'Boeking bevestigd — {{property_name}}',
    subjectEn: 'Booking confirmed — {{property_name}}',
    htmlNl: layout(`
      <h2>Boeking bevestigd! 🎉</h2>
      <p>Hallo {{guest_name}},</p>
      <p>Geweldig nieuws! Uw boeking voor <strong>{{property_name}}</strong> is bevestigd.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Kamer</span><span class="detail-value">{{room_name}}</span></div>
        <div class="detail-row"><span class="detail-label">Inchecken</span><span class="detail-value">{{check_in}}</span></div>
        <div class="detail-row"><span class="detail-label">Uitchecken</span><span class="detail-value">{{check_out}}</span></div>
        <div class="detail-row"><span class="detail-label">Totaalbedrag</span><span class="detail-value">€{{total_price}}</span></div>
      </div>
      <p>Bij vragen kunt u contact opnemen via {{owner_email}}.</p>
    `, 'nl'),
    htmlEn: layout(`
      <h2>Booking confirmed! 🎉</h2>
      <p>Hello {{guest_name}},</p>
      <p>Great news! Your booking at <strong>{{property_name}}</strong> has been confirmed.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Room</span><span class="detail-value">{{room_name}}</span></div>
        <div class="detail-row"><span class="detail-label">Check-in</span><span class="detail-value">{{check_in}}</span></div>
        <div class="detail-row"><span class="detail-label">Check-out</span><span class="detail-value">{{check_out}}</span></div>
        <div class="detail-row"><span class="detail-label">Total</span><span class="detail-value">€{{total_price}}</span></div>
      </div>
      <p>For any questions please contact the host at {{owner_email}}.</p>
    `, 'en'),
  },
  {
    name: 'booking_cancelled',
    subjectNl: 'Boeking geannuleerd — {{property_name}}',
    subjectEn: 'Booking cancelled — {{property_name}}',
    htmlNl: layout(`
      <h2>Boeking geannuleerd</h2>
      <p>Hallo {{guest_name}},</p>
      <p>Helaas is uw boeking voor <strong>{{property_name}}</strong> ({{check_in}} – {{check_out}}) geannuleerd.</p>
      <p>Neem contact op met de eigenaar voor meer informatie.</p>
    `, 'nl'),
    htmlEn: layout(`
      <h2>Booking cancelled</h2>
      <p>Hello {{guest_name}},</p>
      <p>Unfortunately your booking at <strong>{{property_name}}</strong> ({{check_in}} – {{check_out}}) has been cancelled.</p>
      <p>Please contact the host for more information.</p>
    `, 'en'),
  },
  {
    name: 'booking_cancelled_guest',
    subjectNl: 'Boeking geannuleerd — {{property_name}}',
    subjectEn: 'Booking cancelled — {{property_name}}',
    htmlNl: layout(`
      <h2>Boeking geannuleerd</h2>
      <p>Hallo {{guest_name}},</p>
      <p>Helaas is uw boeking voor <strong>{{property_name}}</strong> geannuleerd.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Kamer</span><span class="detail-value">{{room_name}}</span></div>
        <div class="detail-row"><span class="detail-label">Inchecken</span><span class="detail-value">{{check_in}}</span></div>
        <div class="detail-row"><span class="detail-label">Uitchecken</span><span class="detail-value">{{check_out}}</span></div>
      </div>
      <p>Neem contact op met de eigenaar via voor meer informatie.</p>
    `, 'nl'),
    htmlEn: layout(`
      <h2>Booking cancelled</h2>
      <p>Hello {{guest_name}},</p>
      <p>Unfortunately your booking at <strong>{{property_name}}</strong> has been cancelled.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Room</span><span class="detail-value">{{room_name}}</span></div>
        <div class="detail-row"><span class="detail-label">Check-in</span><span class="detail-value">{{check_in}}</span></div>
        <div class="detail-row"><span class="detail-label">Check-out</span><span class="detail-value">{{check_out}}</span></div>
      </div>
      <p>Please contact the host for more information.</p>
    `, 'en'),
  },
  {
    name: 'booking_cancelled_owner',
    subjectNl: 'Boeking geannuleerd door gast — {{property_name}}',
    subjectEn: 'Booking cancelled by guest — {{property_name}}',
    htmlNl: layout(`
      <h2>Boeking geannuleerd</h2>
      <p>Hallo {{owner_name}},</p>
      <p>De gast <strong>{{guest_name}}</strong> heeft de boeking voor <strong>{{property_name}}</strong> geannuleerd.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Kamer</span><span class="detail-value">{{room_name}}</span></div>
        <div class="detail-row"><span class="detail-label">Inchecken</span><span class="detail-value">{{check_in}}</span></div>
        <div class="detail-row"><span class="detail-label">Uitchecken</span><span class="detail-value">{{check_out}}</span></div>
      </div>
      <p>De data zijn nu weer beschikbaar voor nieuwe boekingen.</p>
      <a href="https://directbnb.nl/dashboard/bookings" class="button">Bekijk boekingen</a>
    `, 'nl'),
    htmlEn: layout(`
      <h2>Booking cancelled</h2>
      <p>Hello {{owner_name}},</p>
      <p>Guest <strong>{{guest_name}}</strong> has cancelled their booking at <strong>{{property_name}}</strong>.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Room</span><span class="detail-value">{{room_name}}</span></div>
        <div class="detail-row"><span class="detail-label">Check-in</span><span class="detail-value">{{check_in}}</span></div>
        <div class="detail-row"><span class="detail-label">Check-out</span><span class="detail-value">{{check_out}}</span></div>
      </div>
      <p>Those dates are now available for new bookings.</p>
      <a href="https://directbnb.nl/dashboard/bookings" class="button">View bookings</a>
    `, 'en'),
  },
];

async function main() {
  console.log('🌱 Seeding email templates…');

  for (const template of templates) {
    await prisma.emailTemplate.upsert({
      where: { name: template.name },
      update: template,
      create: template,
    });
    console.log(`  ✓ ${template.name}`);
  }

  console.log('✅ Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
