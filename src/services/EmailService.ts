/**
 * SmartFarm AI — Centralized Email Automation & Delivery Service
 *
 * Delivery priority:
 *  1. Resend HTTPS API           (RESEND_API_KEY set)
 *  2. SMTP via Nodemailer        (SMTP_HOST + SMTP_USER + SMTP_PASS set)
 *  3. Local-outbox simulation    (no credentials — dev/CI fallback only)
 *
 * When no credentials are configured, every email is logged with
 * status = "simulated" / provider = "local_outbox".  NO email leaves
 * the server in that mode.  Configure an SMTP or Resend credential in
 * .env to enable real delivery.
 */

import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import {
  renderEmailTemplate,
  type EmailLocale,
  type EmailTemplateKey,
} from '@/lib/email-templates';

export interface SendEmailInput {
  userId?: string | null;
  toEmail: string;
  templateKey: EmailTemplateKey;
  locale?: EmailLocale;
  data: Record<string, any>;
  dedupeKey?: string;
  preferenceType?: string;
  isTransactional?: boolean;
}

export interface SendEmailResult {
  delivered: boolean;
  status: 'sent' | 'simulated' | 'skipped_duplicate' | 'skipped_preference' | 'failed';
  provider: string;
  logId?: string;
  error?: string;
}

function getAppBaseUrl(): string {
  return (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(
    /\/+$/,
    ''
  );
}

export class EmailService {
  static getAppUrl(path = ''): string {
    return `${getAppBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  }

  static getProviderInfo() {
    if (process.env.RESEND_API_KEY?.trim()) {
      return { configured: true, provider: 'resend' };
    }
    if (process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim()) {
      return { configured: true, provider: 'smtp' };
    }
    return { configured: false, provider: 'local_outbox' };
  }

  /**
   * Sends an email via Resend HTTPS API.
   * Returns the Resend message ID on success.
   */
  private static async sendViaResend(params: {
    from: string;
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<string> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: params.from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
      signal: AbortSignal.timeout(12000),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.message || body?.name || `Resend HTTP ${res.status}`);
    }
    return body?.id || `resend_${Date.now()}`;
  }

  /**
   * Sends an email via SMTP using Nodemailer.
   * Supports Gmail App Passwords, Brevo (SendinBlue), Mailgun, Zoho, etc.
   * Returns a provider message reference.
   */
  private static async sendViaSmtp(params: {
    from: string;
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<string> {
    const host = process.env.SMTP_HOST!.trim();
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER!.trim();
    const pass = process.env.SMTP_PASS!.trim();
    const secure = port === 465 || process.env.SMTP_SECURE === 'true';

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
        minVersion: 'TLSv1.2',
      },
    });

    const info = await transporter.sendMail({
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    return (info.messageId as string) || `smtp_${Date.now()}`;
  }

  /**
   * Checks SMTP or Resend connectivity. Returns diagnostics without sending a real message.
   */
  static async testConnection(): Promise<{
    provider: string;
    configured: boolean;
    reachable: boolean;
    error?: string;
  }> {
    const info = this.getProviderInfo();
    if (!info.configured) {
      return { provider: 'local_outbox', configured: false, reachable: false,
        error: 'No email provider configured. Set SMTP_HOST/SMTP_USER/SMTP_PASS or RESEND_API_KEY in .env' };
    }

    if (info.provider === 'resend') {
      try {
        // Verify API key is valid by calling the domains endpoint
        const res = await fetch('https://api.resend.com/domains', {
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
          signal: AbortSignal.timeout(10000),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.message || `Resend auth failed HTTP ${res.status}`);
        return { provider: 'resend', configured: true, reachable: true };
      } catch (err: any) {
        return { provider: 'resend', configured: true, reachable: false, error: err?.message };
      }
    }

    // SMTP
    try {
      const host = process.env.SMTP_HOST!.trim();
      const port = parseInt(process.env.SMTP_PORT || '587', 10);
      const secure = port === 465 || process.env.SMTP_SECURE === 'true';

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user: process.env.SMTP_USER!.trim(), pass: process.env.SMTP_PASS!.trim() },
        connectionTimeout: 10000,
        tls: { rejectUnauthorized: false },
      });

      await transporter.verify();
      return { provider: 'smtp', configured: true, reachable: true };
    } catch (err: any) {
      return { provider: 'smtp', configured: true, reachable: false, error: err?.message };
    }
  }

  static async sendTemplate(input: SendEmailInput): Promise<SendEmailResult> {
    const toEmail = input.toEmail.trim().toLowerCase();
    const locale: EmailLocale =
      input.locale === 'hi' || input.locale === 'gu' ? input.locale : 'en';

    // ── 1. Deduplication check ───────────────────────────────────────────────
    if (input.dedupeKey) {
      try {
        if ((prisma.emailDeliveryLog as any)?.isResilientFallback) {
          throw new Error('Use parameterized SQL dedupe');
        }
        const existing = await prisma.emailDeliveryLog.findFirst({
          where: { dedupeKey: input.dedupeKey, status: { in: ['sent', 'simulated'] } },
        });
        if (existing) {
          return { delivered: false, status: 'skipped_duplicate', provider: existing.provider, logId: existing.id };
        }
      } catch {
        const sqlite = !process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:');
        const rows = await prisma
          .$queryRawUnsafe<Array<{ id: string; provider: string }>>(
            `SELECT "id","provider" FROM "EmailDeliveryLog" WHERE "dedupeKey" = ${sqlite ? '?' : '$1'} AND "status" IN ('sent','simulated') LIMIT 1`,
            input.dedupeKey
          )
          .catch(() => [] as Array<{ id: string; provider: string }>);
        if (rows?.[0]) {
          return { delivered: false, status: 'skipped_duplicate', provider: rows[0].provider, logId: rows[0].id };
        }
      }
    }

    // ── 2. Notification preference check ────────────────────────────────────
    if (!input.isTransactional && input.userId && input.preferenceType) {
      try {
        const pref = await prisma.notificationPreference.findUnique({
          where: { userId_type_channel: { userId: input.userId, type: input.preferenceType, channel: 'email' } },
        });
        if (pref && !pref.enabled) {
          return { delivered: false, status: 'skipped_preference', provider: 'preference_disabled' };
        }
      } catch {
        // non-blocking — if prefs fail, send anyway
      }
    }

    const rendered = renderEmailTemplate(input.templateKey, locale, input.data);
    const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'SmartFarm AI <no-reply@smartfarm.ai>';
    const providerInfo = this.getProviderInfo();

    // ── 3. Dispatch ──────────────────────────────────────────────────────────
    let status: 'sent' | 'simulated' | 'failed' = 'simulated';
    let providerMessageId: string | null = null;
    let errorMessage: string | null = null;
    let attempts = 1;

    if (providerInfo.provider === 'resend') {
      for (let attempt = 1; attempt <= 2; attempt++) {
        attempts = attempt;
        try {
          providerMessageId = await this.sendViaResend({
            from: fromEmail,
            to: toEmail,
            subject: rendered.subject,
            html: rendered.html,
            text: rendered.text,
          });
          status = 'sent';
          errorMessage = null;
          break;
        } catch (err: any) {
          status = 'failed';
          errorMessage = err?.message || 'Resend delivery failed';
          if (attempt < 2) await new Promise(r => setTimeout(r, 1500));
        }
      }
    } else if (providerInfo.provider === 'smtp') {
      for (let attempt = 1; attempt <= 2; attempt++) {
        attempts = attempt;
        try {
          providerMessageId = await this.sendViaSmtp({
            from: fromEmail,
            to: toEmail,
            subject: rendered.subject,
            html: rendered.html,
            text: rendered.text,
          });
          status = 'sent';
          errorMessage = null;
          break;
        } catch (err: any) {
          status = 'failed';
          errorMessage = err?.message || 'SMTP delivery failed';
          if (attempt < 2) await new Promise(r => setTimeout(r, 1500));
        }
      }
    } else {
      // ⚠️  NO PROVIDER CONFIGURED — local simulation only. Email does NOT leave server.
      status = 'simulated';
      providerMessageId = `local_outbox_${Date.now()}`;
      console.warn(
        `[EmailService:UNCONFIGURED] Email NOT delivered. Configure SMTP_HOST/SMTP_USER/SMTP_PASS or RESEND_API_KEY in .env to send real emails.\n` +
        `  To=${toEmail}  Template=${input.templateKey}  Subject="${rendered.subject}"`
      );
    }

    // ── 4. Persist delivery log ──────────────────────────────────────────────
    try {
      const log = await prisma.emailDeliveryLog.create({
        data: {
          userId: input.userId || null,
          toEmail,
          templateKey: input.templateKey,
          subject: rendered.subject,
          locale,
          dedupeKey: input.dedupeKey || null,
          status,
          provider: providerInfo.provider,
          providerMessageId,
          attempts,
          errorMessage,
          sentAt: status === 'sent' ? new Date() : null,
        },
      });
      return {
        delivered: status === 'sent',
        status,
        provider: providerInfo.provider,
        logId: log.id,
        error: errorMessage || undefined,
      };
    } catch (logErr: any) {
      // Fallback raw SQL log on HMR stale client
      try {
        const logId = crypto.randomUUID();
        const sqlite = !process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:');
        const p = (i: number) => (sqlite ? '?' : `$${i}`);
        const nowIso = new Date().toISOString();
        const sentIso = status === 'sent' ? nowIso : null;
        await prisma.$executeRawUnsafe(
          `INSERT INTO "EmailDeliveryLog" ("id","userId","toEmail","templateKey","subject","locale","dedupeKey","status","provider","providerMessageId","attempts","errorMessage","sentAt","createdAt") VALUES (${p(1)},${p(2)},${p(3)},${p(4)},${p(5)},${p(6)},${p(7)},${p(8)},${p(9)},${p(10)},${p(11)},${p(12)},${p(13)},${p(14)})`,
          logId, input.userId || null, toEmail, input.templateKey, rendered.subject,
          locale, input.dedupeKey || null, status, providerInfo.provider,
          providerMessageId, attempts, errorMessage, sentIso, nowIso
        );
        return { delivered: status === 'sent', status, provider: providerInfo.provider, logId, error: errorMessage || undefined };
      } catch (sqlErr: any) {
        console.error('[EmailService] Failed to persist EmailDeliveryLog:', logErr?.message, sqlErr?.message);
        return { delivered: status === 'sent', status, provider: providerInfo.provider, error: errorMessage || undefined };
      }
    }
  }
}
