import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { PrismaService } from '../prisma/prisma.service';
import { EmailTemplatesService } from '../email-templates/email-templates.service';

interface SendOptions {
  to: string;
  subject: string;
  html: string;
}

interface TemplatedEmailOptions {
  to: string;
  templateName: string;
  language: 'nl' | 'en';
  variables: Record<string, string>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly from: string;
  private readonly apiKeySet: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly templates: EmailTemplatesService,
  ) {
    const apiKey = config.get<string>('RESEND_API_KEY') || 'placeholder';
    this.apiKeySet = !!config.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
    this.from = config.get('EMAIL_FROM', 'DirectBnB <onboarding@resend.dev>');

    if (!this.apiKeySet) {
      this.logger.warn('RESEND_API_KEY not set — emails will be skipped in development');
    }
  }

  // ─── Template-driven sending ─────────────────────────────────────────────────

  /**
   * Load a DB template, replace variables, and send via Resend.
   * Logs result to email_logs regardless of success/failure.
   */
  async sendTemplatedEmail(opts: TemplatedEmailOptions): Promise<void> {
    const { to, templateName, language, variables } = opts;

    let subject: string;
    let html: string;

    try {
      ({ subject, html } = await this.templates.render(templateName, language, variables));
    } catch (err) {
      this.logger.error(`Template '${templateName}' not found`, err);
      await this.logEmail({ to, templateName, language, status: 'FAILED', error: `Template not found: ${templateName}` });
      return;
    }

    await this.sendAndLog({ to, subject, html, templateName, language });
  }

  /**
   * Send beta signup confirmation email to a new beta user.
   */
  async sendBetaSignupConfirmation(signup: {
    name: string;
    email: string;
    bnbName: string;
    location: string;
    language: 'nl' | 'en';
  }): Promise<void> {
    const signupDate = new Date().toLocaleDateString(
      signup.language === 'nl' ? 'nl-NL' : 'en-GB',
      { day: 'numeric', month: 'long', year: 'numeric' },
    );

    await this.sendTemplatedEmail({
      to: signup.email,
      templateName: 'beta_signup_confirmation',
      language: signup.language,
      variables: {
        name: signup.name,
        bnb_name: signup.bnbName,
        location: signup.location,
        signup_date: signupDate,
      },
    });
  }

  // ─── Auth emails ─────────────────────────────────────────────────────────────

  /**
   * Welcome email after a new B&B owner registers.
   */
  async sendWelcomeEmail(opts: { firstName: string; email: string; language: 'nl' | 'en' }): Promise<void> {
    const { firstName, email, language } = opts;
    const isNl = language === 'nl';
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const dashboardUrl = `${frontendUrl}/${language}/dashboard`;

    const subject = isNl ? 'Welkom bij DirectBnB! 🏡' : 'Welcome to DirectBnB! 🏡';
    const content = isNl ? `
      <h2>Welkom bij DirectBnB, ${firstName}!</h2>
      <p>Je account is aangemaakt. Je kunt nu direct beginnen met het instellen van jouw B&B.</p>
      <p>Voeg jouw accommodatie toe, upload foto's en deel jouw unieke boekingslink — zonder commissie.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${dashboardUrl}" class="button">Naar mijn dashboard</a>
      </div>
      <p style="font-size:13px;color:#94a3b8;">Vragen? Gebruik de feedback-knop in het dashboard.</p>
    ` : `
      <h2>Welcome to DirectBnB, ${firstName}!</h2>
      <p>Your account has been created. You can now start setting up your B&B.</p>
      <p>Add your property, upload photos and share your unique booking link — commission-free.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${dashboardUrl}" class="button">Go to my dashboard</a>
      </div>
      <p style="font-size:13px;color:#94a3b8;">Questions? Use the feedback button inside the dashboard.</p>
    `;

    await this.send({ to: email, subject, html: this.baseLayout(content, language) });
  }

  /**
   * Password reset email with a time-limited link (2 hours).
   */
  async sendPasswordResetEmail(opts: {
    to: string;
    firstName: string;
    resetUrl: string;
    language: 'nl' | 'en';
  }): Promise<void> {
    const { to, firstName, resetUrl, language } = opts;
    const isNl = language === 'nl';

    const subject = isNl
      ? 'Wachtwoord opnieuw instellen — DirectBnB'
      : 'Reset your password — DirectBnB';

    const content = isNl ? `
      <h2>Wachtwoord opnieuw instellen</h2>
      <p>Hallo ${firstName},</p>
      <p>Je hebt een verzoek ingediend om je wachtwoord opnieuw in te stellen. Klik op de knop hieronder.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${resetUrl}" class="button">Nieuw wachtwoord instellen</a>
      </div>
      <p style="font-size:13px;color:#94a3b8;">Deze link is 2 uur geldig. Heb je dit niet aangevraagd? Dan kun je deze e-mail negeren.</p>
      <p style="font-size:12px;color:#cbd5e1;word-break:break-all;">Of kopieer: ${resetUrl}</p>
    ` : `
      <h2>Reset your password</h2>
      <p>Hi ${firstName},</p>
      <p>You requested a password reset for your DirectBnB account. Click below to set a new password.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${resetUrl}" class="button">Set new password</a>
      </div>
      <p style="font-size:13px;color:#94a3b8;">This link expires in 2 hours. Didn't request this? You can safely ignore this email.</p>
      <p style="font-size:12px;color:#cbd5e1;word-break:break-all;">Or copy this link: ${resetUrl}</p>
    `;

    await this.send({ to, subject, html: this.baseLayout(content, language) });
  }

  /**
   * Invite email for beta signups — admin sends to convert them into registered users.
   */
  async sendInviteEmail(opts: {
    to: string;
    name: string;
    inviteUrl: string;
    language: 'nl' | 'en';
  }): Promise<void> {
    const { to, name, inviteUrl, language } = opts;
    const isNl = language === 'nl';
    const firstName = name.split(' ')[0];

    const subject = isNl
      ? 'Je bent uitgenodigd voor DirectBnB Beta 🎉'
      : "You're invited to DirectBnB Beta 🎉";

    const content = isNl ? `
      <h2>Je bent uitgenodigd, ${firstName}!</h2>
      <p>Je hebt je aangemeld voor de DirectBnB beta. We zijn blij je erbij te hebben!</p>
      <p>Klik op de knop hieronder om je account aan te maken en meteen te beginnen.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${inviteUrl}" class="button">Account aanmaken</a>
      </div>
      <p style="font-size:13px;color:#94a3b8;">Deze uitnodigingslink is 7 dagen geldig.</p>
      <p style="font-size:12px;color:#cbd5e1;word-break:break-all;">Of kopieer: ${inviteUrl}</p>
    ` : `
      <h2>You're invited, ${firstName}!</h2>
      <p>You signed up for the DirectBnB beta. We're excited to have you on board!</p>
      <p>Click the button below to create your account and get started.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${inviteUrl}" class="button">Create your account</a>
      </div>
      <p style="font-size:13px;color:#94a3b8;">This invitation link expires in 7 days.</p>
      <p style="font-size:12px;color:#cbd5e1;word-break:break-all;">Or copy this link: ${inviteUrl}</p>
    `;

    await this.send({ to, subject, html: this.baseLayout(content, language) });
  }

  // ─── Booking emails (via DB templates with host customization) ──────────────

  async sendBookingRequest(booking: any, owner: any) {
    const lang: 'nl' | 'en' = owner.preferredLanguage === 'en' ? 'en' : 'nl';
    const isNl = lang === 'nl';
    const checkIn = new Date(booking.checkIn).toLocaleDateString(isNl ? 'nl-NL' : 'en-GB');
    const checkOut = new Date(booking.checkOut).toLocaleDateString(isNl ? 'nl-NL' : 'en-GB');
    const guestName = `${booking.guest.firstName} ${booking.guest.lastName}`;
    const propertyName = booking.room.property.name;
    const roomName = booking.room.name;

    const vars: Record<string, string> = {
      owner_name: owner.firstName,
      guest_name: guestName,
      guest_email: booking.guest.email,
      guest_phone: booking.guest.phone ?? '',
      property_name: propertyName,
      room_name: roomName,
      check_in: checkIn,
      check_out: checkOut,
      num_guests: String(booking.numGuests),
      total_price: Number(booking.totalPrice).toFixed(2),
      guest_message: booking.guestMessage ?? '',
      booking_id: booking.id,
    };

    // Owner email — use host's custom template if available
    try {
      const { subject, html } = await this.templates.resolve('booking_request_owner', lang, vars, owner.id);
      await this.sendAndLog({ to: owner.email, subject, html, templateName: 'booking_request_owner', language: lang });
    } catch {
      this.logger.warn('booking_request_owner template not found, skipping owner email');
    }

    // Guest email
    try {
      const { subject, html } = await this.templates.resolve('booking_request_guest', lang, vars, owner.id);
      await this.sendAndLog({ to: booking.guest.email, subject, html, templateName: 'booking_request_guest', language: lang });
    } catch {
      this.logger.warn('booking_request_guest template not found, skipping guest email');
    }
  }

  async sendBookingConfirmed(booking: any, owner: any) {
    const lang: 'nl' | 'en' = owner.preferredLanguage === 'en' ? 'en' : 'nl';
    const isNl = lang === 'nl';
    const checkIn = new Date(booking.checkIn).toLocaleDateString(isNl ? 'nl-NL' : 'en-GB');
    const checkOut = new Date(booking.checkOut).toLocaleDateString(isNl ? 'nl-NL' : 'en-GB');

    const vars: Record<string, string> = {
      guest_name: booking.guest.firstName,
      property_name: booking.room.property.name,
      room_name: booking.room.name,
      check_in: checkIn,
      check_out: checkOut,
      total_price: Number(booking.totalPrice).toFixed(2),
      owner_email: owner.email,
      owner_name: owner.firstName,
    };

    try {
      const { subject, html } = await this.templates.resolve('booking_confirmed', lang, vars, owner.id);
      await this.sendAndLog({ to: booking.guest.email, subject, html, templateName: 'booking_confirmed', language: lang });
    } catch {
      this.logger.warn('booking_confirmed template not found, skipping');
    }
  }

  // ─── Payment emails ──────────────────────────────────────────────────────────

  /**
   * Email sent to the guest when the owner sends a payment link.
   */
  async sendPaymentLinkToGuest(opts: {
    guestEmail: string;
    guestFirstName: string;
    propertyName: string;
    roomName: string;
    checkIn: Date;
    checkOut: Date;
    amount: number;
    paymentUrl: string;
    language: 'nl' | 'en';
  }): Promise<void> {
    const { guestEmail, guestFirstName, propertyName, roomName, checkIn, checkOut, amount, paymentUrl, language } = opts;
    const isNl = language === 'nl';
    const locale = isNl ? 'nl-NL' : 'en-GB';
    const checkInStr = checkIn.toLocaleDateString(locale);
    const checkOutStr = checkOut.toLocaleDateString(locale);

    const subject = isNl
      ? `Betaallink ontvangen — ${propertyName}`
      : `Payment link — ${propertyName}`;

    const content = isNl ? `
      <h2>Uw betaallink is klaar</h2>
      <p>Hallo ${guestFirstName},</p>
      <p>Uw boeking bij <strong>${propertyName}</strong> is bevestigd. Klik op de knop hieronder om de betaling te voltooien.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Kamer</span><span class="detail-value">${roomName}</span></div>
        <div class="detail-row"><span class="detail-label">Inchecken</span><span class="detail-value">${checkInStr}</span></div>
        <div class="detail-row"><span class="detail-label">Uitchecken</span><span class="detail-value">${checkOutStr}</span></div>
        <div class="detail-row"><span class="detail-label">Totaalbedrag</span><span class="detail-value">€${amount.toFixed(2)}</span></div>
      </div>
      <div style="text-align:center;margin:32px 0;">
        <a href="${paymentUrl}" class="button">Nu betalen</a>
      </div>
      <p style="font-size:13px;color:#94a3b8;">Of kopieer deze link: ${paymentUrl}</p>
    ` : `
      <h2>Your payment link is ready</h2>
      <p>Hello ${guestFirstName},</p>
      <p>Your booking at <strong>${propertyName}</strong> has been confirmed. Click the button below to complete your payment.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Room</span><span class="detail-value">${roomName}</span></div>
        <div class="detail-row"><span class="detail-label">Check-in</span><span class="detail-value">${checkInStr}</span></div>
        <div class="detail-row"><span class="detail-label">Check-out</span><span class="detail-value">${checkOutStr}</span></div>
        <div class="detail-row"><span class="detail-label">Total</span><span class="detail-value">€${amount.toFixed(2)}</span></div>
      </div>
      <div style="text-align:center;margin:32px 0;">
        <a href="${paymentUrl}" class="button">Pay now</a>
      </div>
      <p style="font-size:13px;color:#94a3b8;">Or copy this link: ${paymentUrl}</p>
    `;

    await this.send({ to: guestEmail, subject, html: this.baseLayout(content, language) });
  }

  /**
   * Confirmation email to the guest after successful payment.
   */
  async sendPaymentConfirmationToGuest(opts: {
    guestEmail: string;
    guestFirstName: string;
    propertyName: string;
    roomName: string;
    checkIn: Date;
    checkOut: Date;
    amount: number;
    language: 'nl' | 'en';
  }): Promise<void> {
    const { guestEmail, guestFirstName, propertyName, roomName, checkIn, checkOut, amount, language } = opts;
    const isNl = language === 'nl';
    const locale = isNl ? 'nl-NL' : 'en-GB';

    const subject = isNl
      ? `Betaling ontvangen — ${propertyName} ✓`
      : `Payment received — ${propertyName} ✓`;

    const content = isNl ? `
      <h2>Betaling ontvangen!</h2>
      <p>Hallo ${guestFirstName},</p>
      <p>Wij hebben uw betaling van <strong>€${amount.toFixed(2)}</strong> ontvangen voor uw verblijf bij <strong>${propertyName}</strong>. Uw boeking is volledig bevestigd.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Kamer</span><span class="detail-value">${roomName}</span></div>
        <div class="detail-row"><span class="detail-label">Inchecken</span><span class="detail-value">${checkIn.toLocaleDateString(locale)}</span></div>
        <div class="detail-row"><span class="detail-label">Uitchecken</span><span class="detail-value">${checkOut.toLocaleDateString(locale)}</span></div>
        <div class="detail-row"><span class="detail-label">Bedrag</span><span class="detail-value">€${amount.toFixed(2)}</span></div>
      </div>
      <p>Tot ziens!</p>
    ` : `
      <h2>Payment received!</h2>
      <p>Hello ${guestFirstName},</p>
      <p>We have received your payment of <strong>€${amount.toFixed(2)}</strong> for your stay at <strong>${propertyName}</strong>. Your booking is fully confirmed.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Room</span><span class="detail-value">${roomName}</span></div>
        <div class="detail-row"><span class="detail-label">Check-in</span><span class="detail-value">${checkIn.toLocaleDateString(locale)}</span></div>
        <div class="detail-row"><span class="detail-label">Check-out</span><span class="detail-value">${checkOut.toLocaleDateString(locale)}</span></div>
        <div class="detail-row"><span class="detail-label">Amount</span><span class="detail-value">€${amount.toFixed(2)}</span></div>
      </div>
      <p>See you soon!</p>
    `;

    await this.send({ to: guestEmail, subject, html: this.baseLayout(content, language) });
  }

  /**
   * Notification to the host when a guest has paid.
   */
  async sendPaymentReceivedToHost(opts: {
    ownerEmail: string;
    ownerFirstName: string;
    guestName: string;
    propertyName: string;
    roomName: string;
    checkIn: Date;
    checkOut: Date;
    amount: number;
    language: 'nl' | 'en';
  }): Promise<void> {
    const { ownerEmail, ownerFirstName, guestName, propertyName, roomName, checkIn, checkOut, amount, language } = opts;
    const isNl = language === 'nl';
    const locale = isNl ? 'nl-NL' : 'en-GB';

    const subject = isNl
      ? `Betaling ontvangen van ${guestName} — ${propertyName}`
      : `Payment received from ${guestName} — ${propertyName}`;

    const content = isNl ? `
      <h2>Betaling ontvangen!</h2>
      <p>Hallo ${ownerFirstName},</p>
      <p><strong>${guestName}</strong> heeft de betaling van <strong>€${amount.toFixed(2)}</strong> voor hun verblijf bij <strong>${propertyName}</strong> voltooid.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Gast</span><span class="detail-value">${guestName}</span></div>
        <div class="detail-row"><span class="detail-label">Kamer</span><span class="detail-value">${roomName}</span></div>
        <div class="detail-row"><span class="detail-label">Inchecken</span><span class="detail-value">${checkIn.toLocaleDateString(locale)}</span></div>
        <div class="detail-row"><span class="detail-label">Uitchecken</span><span class="detail-value">${checkOut.toLocaleDateString(locale)}</span></div>
        <div class="detail-row"><span class="detail-label">Bedrag</span><span class="detail-value">€${amount.toFixed(2)}</span></div>
      </div>
    ` : `
      <h2>Payment received!</h2>
      <p>Hello ${ownerFirstName},</p>
      <p><strong>${guestName}</strong> has completed the payment of <strong>€${amount.toFixed(2)}</strong> for their stay at <strong>${propertyName}</strong>.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Guest</span><span class="detail-value">${guestName}</span></div>
        <div class="detail-row"><span class="detail-label">Room</span><span class="detail-value">${roomName}</span></div>
        <div class="detail-row"><span class="detail-label">Check-in</span><span class="detail-value">${checkIn.toLocaleDateString(locale)}</span></div>
        <div class="detail-row"><span class="detail-label">Check-out</span><span class="detail-value">${checkOut.toLocaleDateString(locale)}</span></div>
        <div class="detail-row"><span class="detail-label">Amount</span><span class="detail-value">€${amount.toFixed(2)}</span></div>
      </div>
    `;

    await this.send({ to: ownerEmail, subject, html: this.baseLayout(content, language) });
  }

  async sendBookingCancelled(booking: any, owner: any) {
    const lang: 'nl' | 'en' = owner.preferredLanguage === 'en' ? 'en' : 'nl';
    const isNl = lang === 'nl';
    const checkIn = new Date(booking.checkIn).toLocaleDateString(isNl ? 'nl-NL' : 'en-GB');
    const checkOut = new Date(booking.checkOut).toLocaleDateString(isNl ? 'nl-NL' : 'en-GB');

    const vars: Record<string, string> = {
      guest_name: booking.guest.firstName,
      property_name: booking.room.property.name,
      room_name: booking.room.name,
      check_in: checkIn,
      check_out: checkOut,
      owner_name: owner.firstName,
    };

    // Guest cancellation email
    try {
      const { subject, html } = await this.templates.resolve('booking_cancelled_guest', lang, vars, owner.id);
      await this.sendAndLog({ to: booking.guest.email, subject, html, templateName: 'booking_cancelled_guest', language: lang });
    } catch {
      this.logger.warn('booking_cancelled_guest template not found, skipping guest email');
    }

    // Owner notification email
    try {
      const { subject, html } = await this.templates.resolve('booking_cancelled_owner', lang, vars, owner.id);
      await this.sendAndLog({ to: owner.email, subject, html, templateName: 'booking_cancelled_owner', language: lang });
    } catch {
      this.logger.warn('booking_cancelled_owner template not found, skipping owner email');
    }
  }

  // ─── Private core ─────────────────────────────────────────────────────────────

  /**
   * Send an email and write the result to email_logs.
   */
  private async sendAndLog(opts: {
    to: string;
    subject: string;
    html: string;
    templateName: string;
    language: string;
  }): Promise<void> {
    const { to, subject, html, templateName, language } = opts;

    if (!this.apiKeySet) {
      this.logger.warn(`[DEV] Skipped email to ${to} — no RESEND_API_KEY`);
      await this.logEmail({ to, templateName, language, status: 'FAILED', error: 'RESEND_API_KEY not configured' });
      return;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
      });

      if (error) {
        throw new Error(error.message);
      }

      this.logger.log(`✉  Sent '${templateName}' to ${to} [${data?.id}]`);
      await this.logEmail({ to, templateName, language, status: 'SENT', providerMessageId: data?.id });
    } catch (err: any) {
      this.logger.error(`✗  Failed to send '${templateName}' to ${to}: ${err.message}`);
      await this.logEmail({ to, templateName, language, status: 'FAILED', error: err.message });
    }
  }

  /**
   * Low-level send without template logging (for booking emails that use inline HTML).
   */
  private async send({ to, subject, html }: SendOptions) {
    if (!this.apiKeySet) {
      this.logger.warn(`[DEV] Skipped email to ${to} — no RESEND_API_KEY`);
      return;
    }
    try {
      const { data, error } = await this.resend.emails.send({ from: this.from, to, subject, html });
      if (error) throw new Error(error.message);
      this.logger.log(`✉  Sent to ${to}: ${subject} [${data?.id}]`);
    } catch (err: any) {
      this.logger.error(`✗  Failed to send to ${to}: ${err.message}`);
    }
  }

  private async logEmail(opts: {
    to: string;
    templateName: string;
    language: string;
    status: 'SENT' | 'FAILED';
    providerMessageId?: string;
    error?: string;
  }) {
    try {
      await this.prisma.emailLog.create({
        data: {
          recipientEmail: opts.to,
          templateName: opts.templateName,
          language: opts.language,
          status: opts.status,
          providerMessageId: opts.providerMessageId ?? null,
          errorMessage: opts.error ?? null,
        },
      });
    } catch (err) {
      // Never crash the request over a logging failure
      this.logger.error('Failed to write email log', err);
    }
  }

  // ─── Booking email HTML helpers (unchanged) ──────────────────────────────────

  private baseLayout(content: string, lang: string): string {
    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DirectBnB</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #0f172a; padding: 24px 32px; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
    .header span { color: #FF5000; }
    .body { padding: 32px; }
    .body h2 { margin: 0 0 16px; font-size: 18px; color: #0f172a; }
    .body p { margin: 0 0 12px; color: #475569; line-height: 1.6; font-size: 15px; }
    .detail-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #64748b; }
    .detail-value { color: #0f172a; font-weight: 500; }
    .button { display: inline-block; background: #FF5000; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 20px 0; }
    .footer { padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
    .footer p { margin: 0; font-size: 13px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Direct<span>BnB</span></h1></div>
    <div class="body">${content}</div>
    <div class="footer"><p>DirectBnB — Direct reserveren, geen commissie</p></div>
  </div>
</body>
</html>`;
  }

  private ownerBookingRequestHtml(data: any): string {
    const isNl = data.lang === 'nl';
    const content = isNl ? `
      <h2>Nieuwe boekingsaanvraag ontvangen</h2>
      <p>Hallo ${data.ownerName},</p>
      <p>U heeft een nieuwe boekingsaanvraag ontvangen voor <strong>${data.propertyName}</strong>.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Gast</span><span class="detail-value">${data.guestName}</span></div>
        <div class="detail-row"><span class="detail-label">E-mail</span><span class="detail-value">${data.guestEmail}</span></div>
        ${data.guestPhone ? `<div class="detail-row"><span class="detail-label">Telefoon</span><span class="detail-value">${data.guestPhone}</span></div>` : ''}
        <div class="detail-row"><span class="detail-label">Kamer</span><span class="detail-value">${data.roomName}</span></div>
        <div class="detail-row"><span class="detail-label">Inchecken</span><span class="detail-value">${data.checkIn}</span></div>
        <div class="detail-row"><span class="detail-label">Uitchecken</span><span class="detail-value">${data.checkOut}</span></div>
        <div class="detail-row"><span class="detail-label">Gasten</span><span class="detail-value">${data.numGuests}</span></div>
        <div class="detail-row"><span class="detail-label">Totaalbedrag</span><span class="detail-value">€${data.totalPrice}</span></div>
        ${data.guestMessage ? `<div class="detail-row"><span class="detail-label">Bericht</span><span class="detail-value">${data.guestMessage}</span></div>` : ''}
      </div>
      <p>Ga naar uw dashboard om de aanvraag te bevestigen of af te wijzen.</p>
    ` : `
      <h2>New booking request received</h2>
      <p>Hello ${data.ownerName},</p>
      <p>You have received a new booking request for <strong>${data.propertyName}</strong>.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Guest</span><span class="detail-value">${data.guestName}</span></div>
        <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${data.guestEmail}</span></div>
        ${data.guestPhone ? `<div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">${data.guestPhone}</span></div>` : ''}
        <div class="detail-row"><span class="detail-label">Room</span><span class="detail-value">${data.roomName}</span></div>
        <div class="detail-row"><span class="detail-label">Check-in</span><span class="detail-value">${data.checkIn}</span></div>
        <div class="detail-row"><span class="detail-label">Check-out</span><span class="detail-value">${data.checkOut}</span></div>
        <div class="detail-row"><span class="detail-label">Guests</span><span class="detail-value">${data.numGuests}</span></div>
        <div class="detail-row"><span class="detail-label">Total</span><span class="detail-value">€${data.totalPrice}</span></div>
        ${data.guestMessage ? `<div class="detail-row"><span class="detail-label">Message</span><span class="detail-value">${data.guestMessage}</span></div>` : ''}
      </div>
      <p>Go to your dashboard to confirm or decline this request.</p>
    `;
    return this.baseLayout(content, data.lang);
  }

  private guestBookingRequestHtml(data: any): string {
    const isNl = data.lang === 'nl';
    const content = isNl ? `
      <h2>Aanvraag ontvangen</h2>
      <p>Hallo ${data.guestName},</p>
      <p>Uw boekingsaanvraag voor <strong>${data.propertyName}</strong> is ontvangen. De eigenaar neemt zo snel mogelijk contact met u op.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Kamer</span><span class="detail-value">${data.roomName}</span></div>
        <div class="detail-row"><span class="detail-label">Inchecken</span><span class="detail-value">${data.checkIn}</span></div>
        <div class="detail-row"><span class="detail-label">Uitchecken</span><span class="detail-value">${data.checkOut}</span></div>
        <div class="detail-row"><span class="detail-label">Gasten</span><span class="detail-value">${data.numGuests}</span></div>
        <div class="detail-row"><span class="detail-label">Totaalbedrag</span><span class="detail-value">€${data.totalPrice}</span></div>
      </div>
    ` : `
      <h2>Request received</h2>
      <p>Hello ${data.guestName},</p>
      <p>Your booking request for <strong>${data.propertyName}</strong> has been received. The host will contact you as soon as possible.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Room</span><span class="detail-value">${data.roomName}</span></div>
        <div class="detail-row"><span class="detail-label">Check-in</span><span class="detail-value">${data.checkIn}</span></div>
        <div class="detail-row"><span class="detail-label">Check-out</span><span class="detail-value">${data.checkOut}</span></div>
        <div class="detail-row"><span class="detail-label">Guests</span><span class="detail-value">${data.numGuests}</span></div>
        <div class="detail-row"><span class="detail-label">Total</span><span class="detail-value">€${data.totalPrice}</span></div>
      </div>
    `;
    return this.baseLayout(content, data.lang);
  }

  private bookingConfirmedHtml(data: any): string {
    const isNl = data.lang === 'nl';
    const content = isNl ? `
      <h2>Boeking bevestigd!</h2>
      <p>Hallo ${data.guestName},</p>
      <p>Geweldig nieuws! Uw boeking voor <strong>${data.propertyName}</strong> is bevestigd.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Kamer</span><span class="detail-value">${data.roomName}</span></div>
        <div class="detail-row"><span class="detail-label">Inchecken</span><span class="detail-value">${data.checkIn}</span></div>
        <div class="detail-row"><span class="detail-label">Uitchecken</span><span class="detail-value">${data.checkOut}</span></div>
        <div class="detail-row"><span class="detail-label">Totaalbedrag</span><span class="detail-value">€${data.totalPrice}</span></div>
      </div>
      <p>Bij vragen kunt u contact opnemen via ${data.ownerEmail}.</p>
    ` : `
      <h2>Booking confirmed!</h2>
      <p>Hello ${data.guestName},</p>
      <p>Great news! Your booking at <strong>${data.propertyName}</strong> has been confirmed.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Room</span><span class="detail-value">${data.roomName}</span></div>
        <div class="detail-row"><span class="detail-label">Check-in</span><span class="detail-value">${data.checkIn}</span></div>
        <div class="detail-row"><span class="detail-label">Check-out</span><span class="detail-value">${data.checkOut}</span></div>
        <div class="detail-row"><span class="detail-label">Total</span><span class="detail-value">€${data.totalPrice}</span></div>
      </div>
      <p>For any questions please contact the host at ${data.ownerEmail}.</p>
    `;
    return this.baseLayout(content, data.lang);
  }

  private bookingCancelledHtml(data: any): string {
    const isNl = data.lang === 'nl';
    const content = isNl ? `
      <h2>Boeking geannuleerd</h2>
      <p>Hallo ${data.guestName},</p>
      <p>Helaas is uw boeking voor <strong>${data.propertyName}</strong> (${data.checkIn} – ${data.checkOut}) geannuleerd.</p>
      <p>Neem contact op met de eigenaar voor meer informatie.</p>
    ` : `
      <h2>Booking cancelled</h2>
      <p>Hello ${data.guestName},</p>
      <p>Unfortunately your booking at <strong>${data.propertyName}</strong> (${data.checkIn} – ${data.checkOut}) has been cancelled.</p>
      <p>Please contact the host for more information.</p>
    `;
    return this.baseLayout(content, data.lang);
  }
}
