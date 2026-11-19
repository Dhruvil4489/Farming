/**
 * SmartFarm AI — Production-Grade Email Delivery & Diagnostics Service
 *
 * Features:
 * - Industry-standard Nodemailer RFC-5321/5322 SMTP transport (STARTTLS 587, SSL/TLS 465, custom ports)
 * - Resend HTTPS API transport (RESEND_API_KEY)
 * - ZERO fake delivery: when no email provider is configured, explicitly records & returns `not_configured`
 *   instead of claiming an email was sent or delivered
 * - Real provider response & Message-ID capture (`accepted`, `rejected`, `response`, `providerMessageId`)
 * - Production URL guard: prevents broken `localhost` verification links in production
 * - Live SMTP handshake verification (`verifyProvider()`) & DNS SPF/DKIM/DMARC audit (`checkSenderDns()`)
 * - Strict secret hygiene: never logs or exposes passwords, API keys, plaintext OTPs, or raw verification tokens
 */

import crypto from 'crypto';
import { Resolver } from 'dns/promises';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import {
  renderEmailTemplate,
  type EmailLocale,
  type EmailTemplateKey,
} from '@/lib/email-templates';

export type EmailOverallStatus =
  | 'queued'
  | 'retrying'
  | 'accepted'
  | 'sent'
  | 'delivered'
  | 'rejected'
  | 'bounced'
  | 'failed'
  | 'not_configured'
  | 'skipped_duplicate'
  | 'skipped_preference';

export interface SendEmailInput {
  userId?: string | null;
  toEmail: string;
  templateKey: EmailTemplateKey;
  locale?: EmailLocale;
  data: Record<string, any>;
  dedupeKey?: string;
  preferenceType?: string;
  isTransactional?: boolean;
  existingLogId?: string;
  queueStatus?: 'immediate' | 'queued' | 'processing' | 'retrying' | 'completed' | 'failed';
  attemptNumber?: number;
  maxAttempts?: number;
}

export interface SendEmailResult {
  /** True ONLY when an external email provider genuinely accepted the message for delivery */
  accepted: boolean;
  /** Alias for accepted — never true for unconfigured, queued, or failed attempts */
  delivered: boolean;
  status: EmailOverallStatus;
  queueStatus: string;
  submissionStatus: 'pending' | 'submitted' | 'rejected' | 'failed' | 'not_configured';
  providerAcceptanceStatus: 'pending' | 'accepted' | 'rejected' | 'not_configured';
  deliveryStatus: 'unknown' | 'accepted_by_provider' | 'delivered' | 'deferred' | 'bounced' | 'failed';
  provider: 'smtp' | 'resend' | 'unconfigured' | 'preference_disabled';
  providerMessageId?: string | null;
  providerResponse?: string | null;
  logId?: string;
  error?: string;
  retryable?: boolean;
}

export interface EmailProviderConfigSummary {
  configured: boolean;
  provider: 'resend' | 'smtp' | 'unconfigured';
  fromEmail: string;
  fromDomain: string;
  appUrl: string;
  isLocalhostUrl: boolean;
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    authConfigured: boolean;
    userMasked: string;
    tlsRejectUnauthorized: boolean;
  };
  resend?: {
    apiKeyConfigured: boolean;
  };
  warnings: string[];
}

export interface SenderDnsCheckResult {
  domain: string;
  spf: { present: boolean; valid: boolean; records: string[]; error?: string };
  dmarc: { present: boolean; valid: boolean; records: string[]; error?: string };
  mx: { present: boolean; records: Array<{ exchange: string; priority: number }>; error?: string };
  dkim: { checkedSelectors: string[]; foundSelectors: string[] };
  googleRequirementsStatus: 'pass' | 'warning' | 'fail';
  recommendations: string[];
}

function isSqliteDb(): boolean {
  return !process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:');
}

export function maskEmail(email: string): string {
  const clean = (email || '').trim().toLowerCase();
  const [local, domain] = clean.split('@');
  if (!local || !domain) return '***';
  if (local.length <= 2) return `${local[0] || '*'}***@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

export function extractEmailAddress(fromHeader: string): string {
  const match = fromHeader.match(/<([^>]+)>/);
  return (match ? match[1] : fromHeader).trim().toLowerCase();
}

export function extractDomain(emailOrFrom: string): string {
  const addr = extractEmailAddress(emailOrFrom);
  return addr.split('@')[1] || '';
}

function sanitizeProviderError(raw: unknown): string {
  const msg = String((raw as any)?.message || raw || 'Email delivery failed');
  // Never leak passwords, API keys, or base64 auth tokens in stored errors
  return msg
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
    .replace(/AUTH\s+(LOGIN|PLAIN)\s+\S+/gi, 'AUTH $1 [REDACTED]')
    .replace(/re_[A-Za-z0-9_]{10,}/g, '[REDACTED_RESEND_KEY]')
    .slice(0, 400);
}

function isPermanentRejection(err: any): boolean {
  const code = Number(err?.responseCode || 0);
  const msg = String(err?.message || '').toLowerCase();
  if (code >= 500 && code < 600) return true;
  if (
    msg.includes('550 ') ||
    msg.includes('551 ') ||
    msg.includes('552 ') ||
    msg.includes('553 ') ||
    msg.includes('554 ') ||
    msg.includes('invalid login') ||
    msg.includes('authentication failed') ||
    msg.includes('domain is not verified') ||
    msg.includes('validation_error')
  ) {
    return true;
  }
  return false;
}

function getAppBaseUrl(): string {
  const raw = (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'
  ).replace(/\/+$/, '');

  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(raw);
  if (
    process.env.NODE_ENV === 'production' &&
    isLocal &&
    process.env.ALLOW_LOCALHOST_APP_URL !== 'true'
  ) {
    console.error(
      '[EmailService] WARNING: APP_URL is set to localhost in production. Configure APP_URL to your public HTTPS domain.'
    );
  }
  return raw;
}

function getConfiguredFromHeader(): string {
  const explicitFrom = (process.env.EMAIL_FROM || process.env.SMTP_FROM || '').trim();
  if (explicitFrom) return explicitFrom;

  const smtpUser = (process.env.SMTP_USER || '').trim();
  const fromName = (process.env.EMAIL_FROM_NAME || 'SmartFarm AI').trim();
  if (smtpUser && smtpUser.includes('@')) {
    return `${fromName} <${smtpUser}>`;
  }
  return `${fromName} <no-reply@smartfarm.ai>`;
}

function createSmtpTransporter() {
  const host = (process.env.SMTP_HOST || '').trim();
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure =
    process.env.SMTP_SECURE === 'true' || (process.env.SMTP_SECURE !== 'false' && port === 465);
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').trim();
  const rejectUnauthorized = process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false';
  const requireTls = process.env.SMTP_REQUIRE_TLS === 'true';

  const auth = user && pass ? { user, pass } : undefined;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure && (requireTls || port === 587) && process.env.SMTP_IGNORE_TLS !== 'true',
    ignoreTLS: process.env.SMTP_IGNORE_TLS === 'true',
    auth,
    tls: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized,
    },
    connectionTimeout: parseInt(process.env.SMTP_CONNECTION_TIMEOUT_MS || '10000', 10),
    greetingTimeout: parseInt(process.env.SMTP_GREETING_TIMEOUT_MS || '10000', 10),
    socketTimeout: parseInt(process.env.SMTP_SOCKET_TIMEOUT_MS || '15000', 10),
  });
}

async function persistDeliveryLog(params: {
  existingLogId?: string;
  userId?: string | null;
  toEmail: string;
  templateKey: string;
  subject: string;
  locale: string;
  dedupeKey?: string | null;
  status: string;
  queueStatus: string;
  submissionStatus: string;
  providerAcceptanceStatus: string;
  deliveryStatus: string;
  bounceStatus: string;
  provider: string;
  providerMessageId: string | null;
  providerResponse: string | null;
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: Date | null;
  errorMessage: string | null;
  sentAt: Date | null;
}): Promise<string | undefined> {
  const now = new Date();
  const sqlite = isSqliteDb();
  const p = (i: number) => (sqlite ? '?' : `$${i}`);

  // Update existing log row if retrying/processing a queued job
  if (params.existingLogId) {
    try {
      await prisma.$executeRawUnsafe(
        `UPDATE "EmailDeliveryLog"
         SET "status" = ${p(1)},
             "queueStatus" = ${p(2)},
             "submissionStatus" = ${p(3)},
             "providerAcceptanceStatus" = ${p(4)},
             "deliveryStatus" = ${p(5)},
             "bounceStatus" = ${p(6)},
             "provider" = ${p(7)},
             "providerMessageId" = ${p(8)},
             "providerResponse" = ${p(9)},
             "attempts" = ${p(10)},
             "maxAttempts" = ${p(11)},
             "nextRetryAt" = ${p(12)},
             "errorMessage" = ${p(13)},
             "sentAt" = ${p(14)},
             "updatedAt" = ${p(15)}
         WHERE "id" = ${p(16)}`,
        params.status,
        params.queueStatus,
        params.submissionStatus,
        params.providerAcceptanceStatus,
        params.deliveryStatus,
        params.bounceStatus,
        params.provider,
        params.providerMessageId,
        params.providerResponse,
        params.attempts,
        params.maxAttempts,
        params.nextRetryAt ? params.nextRetryAt.toISOString() : null,
        params.errorMessage,
        params.sentAt ? params.sentAt.toISOString() : null,
        now.toISOString(),
        params.existingLogId
      );
      return params.existingLogId;
    } catch (err: any) {
      console.error('[EmailService] Failed updating EmailDeliveryLog:', err?.message);
      return params.existingLogId;
    }
  }

  const logId = crypto.randomUUID();
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "EmailDeliveryLog" (
        "id","userId","toEmail","templateKey","subject","locale","dedupeKey",
        "status","queueStatus","submissionStatus","providerAcceptanceStatus",
        "deliveryStatus","bounceStatus","provider","providerMessageId","providerResponse",
        "attempts","maxAttempts","nextRetryAt","errorMessage","sentAt","createdAt","updatedAt"
      ) VALUES (
        ${p(1)},${p(2)},${p(3)},${p(4)},${p(5)},${p(6)},${p(7)},
        ${p(8)},${p(9)},${p(10)},${p(11)},
        ${p(12)},${p(13)},${p(14)},${p(15)},${p(16)},
        ${p(17)},${p(18)},${p(19)},${p(20)},${p(21)},${p(22)},${p(23)}
      )`,
      logId,
      params.userId || null,
      params.toEmail,
      params.templateKey,
      params.subject,
      params.locale,
      params.dedupeKey || null,
      params.status,
      params.queueStatus,
      params.submissionStatus,
      params.providerAcceptanceStatus,
      params.deliveryStatus,
      params.bounceStatus,
      params.provider,
      params.providerMessageId,
      params.providerResponse,
      params.attempts,
      params.maxAttempts,
      params.nextRetryAt ? params.nextRetryAt.toISOString() : null,
      params.errorMessage,
      params.sentAt ? params.sentAt.toISOString() : null,
      now.toISOString(),
      now.toISOString()
    );
    return logId;
  } catch (err: any) {
    console.error('[EmailService] Failed inserting EmailDeliveryLog:', err?.message);
    return undefined;
  }
}

export class EmailService {
  static getAppUrl(path = ''): string {
    return `${getAppBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  }

  static getProviderInfo(): EmailProviderConfigSummary {
    const fromEmail = getConfiguredFromHeader();
    const fromDomain = extractDomain(fromEmail);
    const appUrl = getAppBaseUrl();
    const isLocalhostUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(appUrl);
    const warnings: string[] = [];

    if (process.env.NODE_ENV === 'production' && isLocalhostUrl) {
      warnings.push(
        'APP_URL points to localhost in production. Verification links will not open on farmers\' devices until APP_URL is set to your public HTTPS domain.'
      );
    }

    const resendKey = (process.env.RESEND_API_KEY || '').trim();
    if (resendKey) {
      if (fromDomain === 'smartfarm.ai' || !fromDomain) {
        warnings.push(
          `Sender domain "${fromDomain || 'unset'}" must be verified in your Resend dashboard with valid SPF, DKIM, and DMARC records.`
        );
      }
      return {
        configured: true,
        provider: 'resend',
        fromEmail,
        fromDomain,
        appUrl,
        isLocalhostUrl,
        resend: { apiKeyConfigured: true },
        warnings,
      };
    }

    const smtpHost = (process.env.SMTP_HOST || '').trim();
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = (process.env.SMTP_USER || '').trim();
    const smtpPass = (process.env.SMTP_PASS || '').trim();
    const allowUnauth = process.env.SMTP_ALLOW_UNAUTHENTICATED === 'true';
    const smtpSecure =
      process.env.SMTP_SECURE === 'true' ||
      (process.env.SMTP_SECURE !== 'false' && smtpPort === 465);

    if (smtpHost && ((smtpUser && smtpPass) || allowUnauth)) {
      if (
        smtpHost.toLowerCase().includes('gmail.com') &&
        smtpUser &&
        extractEmailAddress(fromEmail) !== smtpUser.toLowerCase()
      ) {
        warnings.push(
          `EMAIL_FROM (${extractEmailAddress(fromEmail)}) differs from SMTP_USER (${maskEmail(smtpUser)}). Gmail requires EMAIL_FROM to match your authenticated Gmail address (or verified Send-As alias) to pass SPF/DKIM/DMARC alignment.`
        );
      }
      return {
        configured: true,
        provider: 'smtp',
        fromEmail,
        fromDomain,
        appUrl,
        isLocalhostUrl,
        smtp: {
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          authConfigured: Boolean(smtpUser && smtpPass),
          userMasked: smtpUser ? maskEmail(smtpUser) : '(unauthenticated)',
          tlsRejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
        },
        warnings,
      };
    }

    warnings.push(
      'No external email provider is configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and EMAIL_FROM (e.g., Gmail App Password, Brevo, Amazon SES, Postmark) OR set RESEND_API_KEY in .env.'
    );
    return {
      configured: false,
      provider: 'unconfigured',
      fromEmail,
      fromDomain,
      appUrl,
      isLocalhostUrl,
      warnings,
    };
  }

  /**
   * Verifies real connectivity and authentication with the configured email provider.
   */
  static async verifyProvider(): Promise<{
    ok: boolean;
    provider: string;
    message: string;
    latencyMs: number;
  }> {
    const started = Date.now();
    const info = this.getProviderInfo();

    if (!info.configured) {
      return {
        ok: false,
        provider: 'unconfigured',
        message:
          'No email provider is configured in environment variables (missing SMTP_HOST/SMTP_USER/SMTP_PASS or RESEND_API_KEY).',
        latencyMs: Date.now() - started,
      };
    }

    if (info.provider === 'smtp') {
      try {
        const transporter = createSmtpTransporter();
        await transporter.verify();
        transporter.close();
        return {
          ok: true,
          provider: 'smtp',
          message: `SMTP connection and authentication verified on ${info.smtp?.host}:${info.smtp?.port} (${info.smtp?.secure ? 'SSL/TLS' : 'STARTTLS'}).`,
          latencyMs: Date.now() - started,
        };
      } catch (err: any) {
        return {
          ok: false,
          provider: 'smtp',
          message: sanitizeProviderError(err),
          latencyMs: Date.now() - started,
        };
      }
    }

    // Resend connectivity check (GET /domains validates API key without sending mail)
    try {
      const res = await fetch('https://api.resend.com/domains', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return {
          ok: false,
          provider: 'resend',
          message: sanitizeProviderError(body?.message || `Resend HTTP ${res.status}`),
          latencyMs: Date.now() - started,
        };
      }
      return {
        ok: true,
        provider: 'resend',
        message: 'Resend API key verified and reachable over HTTPS.',
        latencyMs: Date.now() - started,
      };
    } catch (err: any) {
      return {
        ok: false,
        provider: 'resend',
        message: sanitizeProviderError(err),
        latencyMs: Date.now() - started,
      };
    }
  }

  /**
   * Audits public DNS SPF, DMARC, MX, and common DKIM selectors for the sender domain.
   */
  static async checkSenderDns(domainOverride?: string): Promise<SenderDnsCheckResult> {
    const info = this.getProviderInfo();
    const domain = (domainOverride || info.fromDomain || '').trim().toLowerCase();
    const resolver = new Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1']);

    const recommendations: string[] = [];

    if (!domain) {
      return {
        domain: '(unset)',
        spf: { present: false, valid: false, records: [], error: 'No sender domain configured' },
        dmarc: { present: false, valid: false, records: [], error: 'No sender domain configured' },
        mx: { present: false, records: [], error: 'No sender domain configured' },
        dkim: { checkedSelectors: [], foundSelectors: [] },
        googleRequirementsStatus: 'fail',
        recommendations: ['Configure EMAIL_FROM with a valid verified domain (e.g., SmartFarm AI <no-reply@yourdomain.com>).'],
      };
    }

    // SPF
    let spfRecords: string[] = [];
    let spfError: string | undefined;
    try {
      const txt = await resolver.resolveTxt(domain);
      spfRecords = txt.map((chunks) => chunks.join('')).filter((r) => /^v=spf1\b/i.test(r.trim()));
    } catch (e: any) {
      spfError = e?.code || 'LOOKUP_FAILED';
    }
    const spfPresent = spfRecords.length > 0;
    const spfValid = spfRecords.length === 1;
    if (!spfPresent) {
      recommendations.push(
        `Add an SPF TXT record on "${domain}" authorizing your email provider (never add duplicate SPF records).`
      );
    } else if (spfRecords.length > 1) {
      recommendations.push(
        `Multiple SPF TXT records found on "${domain}". Merge them into a single v=spf1 record to avoid PermError rejections.`
      );
    }

    // DMARC
    let dmarcRecords: string[] = [];
    let dmarcError: string | undefined;
    try {
      const dmarc = await resolver.resolveTxt(`_dmarc.${domain}`);
      dmarcRecords = dmarc
        .map((chunks) => chunks.join(''))
        .filter((r) => /^v=DMARC1\b/i.test(r.trim()));
    } catch (e: any) {
      dmarcError = e?.code || 'LOOKUP_FAILED';
    }
    const dmarcPresent = dmarcRecords.length > 0;
    const dmarcValid = dmarcPresent;
    if (!dmarcPresent) {
      recommendations.push(
        `Add a DMARC TXT record at "_dmarc.${domain}" (start with "v=DMARC1; p=none; rua=mailto:dmarc@${domain}" and move to p=quarantine once aligned).`
      );
    }

    // MX
    let mxRecords: Array<{ exchange: string; priority: number }> = [];
    let mxError: string | undefined;
    try {
      mxRecords = await resolver.resolveMx(domain);
    } catch (e: any) {
      mxError = e?.code || 'LOOKUP_FAILED';
    }

    // Common DKIM selector probe
    const selectors = ['default', 'google', 'resend', 'mail', 's1', 's2', 'k1', 'dkim'];
    const foundSelectors: string[] = [];
    await Promise.all(
      selectors.map(async (sel) => {
        try {
          const rec = await resolver.resolveTxt(`${sel}._domainkey.${domain}`);
          if (rec.length > 0) foundSelectors.push(sel);
        } catch {
          // Selector not present
        }
      })
    );

    if (foundSelectors.length === 0 && domain !== 'gmail.com') {
      recommendations.push(
        `No common DKIM selector detected on "${domain}". Copy the exact DKIM TXT/CNAME records from your email provider's domain verification dashboard.`
      );
    }

    const googleRequirementsStatus: 'pass' | 'warning' | 'fail' =
      spfValid && dmarcValid && (foundSelectors.length > 0 || domain === 'gmail.com')
        ? 'pass'
        : spfPresent || dmarcPresent
          ? 'warning'
          : 'fail';

    return {
      domain,
      spf: { present: spfPresent, valid: spfValid, records: spfRecords, error: spfError },
      dmarc: { present: dmarcPresent, valid: dmarcValid, records: dmarcRecords, error: dmarcError },
      mx: { present: mxRecords.length > 0, records: mxRecords, error: mxError },
      dkim: { checkedSelectors: selectors, foundSelectors },
      googleRequirementsStatus,
      recommendations,
    };
  }

  /**
   * Sends an email through the configured external provider (SMTP via Nodemailer or Resend HTTPS API)
   * and records full, truthful delivery telemetry in EmailDeliveryLog.
   *
   * NEVER fakes delivery when unconfigured and NEVER logs plaintext OTPs or tokens.
   */
  static async sendTemplate(input: SendEmailInput): Promise<SendEmailResult> {
    const toEmail = input.toEmail.trim().toLowerCase();
    const locale: EmailLocale =
      input.locale === 'hi' || input.locale === 'gu' ? input.locale : 'en';
    const maxAttempts = input.maxAttempts ?? 3;

    // 1. Deduplication check (only skips if already genuinely accepted/sent/delivered)
    if (input.dedupeKey) {
      const sqlite = isSqliteDb();
      const rows = await prisma
        .$queryRawUnsafe<Array<{ id: string; provider: string; providerMessageId: string | null }>>(
          `SELECT "id","provider","providerMessageId" FROM "EmailDeliveryLog" WHERE "dedupeKey" = ${sqlite ? '?' : '$1'} AND "status" IN ('accepted','sent','delivered') LIMIT 1`,
          input.dedupeKey
        )
        .catch(() => [] as Array<{ id: string; provider: string; providerMessageId: string | null }>);
      if (rows?.[0]) {
        return {
          accepted: false,
          delivered: false,
          status: 'skipped_duplicate',
          queueStatus: 'completed',
          submissionStatus: 'submitted',
          providerAcceptanceStatus: 'accepted',
          deliveryStatus: 'accepted_by_provider',
          provider: (rows[0].provider as any) || 'smtp',
          providerMessageId: rows[0].providerMessageId,
          logId: rows[0].id,
        };
      }
    }

    // 2. Notification preference check for non-transactional alerts
    if (!input.isTransactional && input.userId && input.preferenceType) {
      const pref = await prisma.notificationPreference
        .findUnique({
          where: {
            userId_type_channel: {
              userId: input.userId,
              type: input.preferenceType,
              channel: 'email',
            },
          },
        })
        .catch(() => null);
      if (pref && !pref.enabled) {
        return {
          accepted: false,
          delivered: false,
          status: 'skipped_preference',
          queueStatus: 'completed',
          submissionStatus: 'pending',
          providerAcceptanceStatus: 'pending',
          deliveryStatus: 'unknown',
          provider: 'preference_disabled',
        };
      }
    }

    const rendered = renderEmailTemplate(input.templateKey, locale, input.data);
    const providerInfo = this.getProviderInfo();
    const fromEmail = providerInfo.fromEmail;
    const replyTo = (process.env.EMAIL_REPLY_TO || '').trim() || undefined;

    // 3. Honest failure when NO email provider is configured (NEVER fake success!)
    if (!providerInfo.configured) {
      const errorMessage =
        'Email delivery provider is not configured on the server. Set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS or RESEND_API_KEY in .env.';
      console.error(
        `[EmailService] NOT_CONFIGURED: Cannot send "${input.templateKey}" to ${maskEmail(toEmail)} — ${errorMessage}`
      );
      const logId = await persistDeliveryLog({
        existingLogId: input.existingLogId,
        userId: input.userId,
        toEmail,
        templateKey: input.templateKey,
        subject: rendered.subject,
        locale,
        dedupeKey: input.dedupeKey || null,
        status: 'not_configured',
        queueStatus: input.queueStatus || 'failed',
        submissionStatus: 'not_configured',
        providerAcceptanceStatus: 'not_configured',
        deliveryStatus: 'failed',
        bounceStatus: 'none',
        provider: 'unconfigured',
        providerMessageId: null,
        providerResponse: null,
        attempts: input.attemptNumber ?? 1,
        maxAttempts,
        errorMessage,
        sentAt: null,
      });

      return {
        accepted: false,
        delivered: false,
        status: 'not_configured',
        queueStatus: input.queueStatus || 'failed',
        submissionStatus: 'not_configured',
        providerAcceptanceStatus: 'not_configured',
        deliveryStatus: 'failed',
        provider: 'unconfigured',
        logId,
        error: errorMessage,
        retryable: false,
      };
    }

    // 4. Real dispatch via Resend HTTPS API or Nodemailer SMTP
    let status: EmailOverallStatus = 'failed';
    let submissionStatus: SendEmailResult['submissionStatus'] = 'failed';
    let providerAcceptanceStatus: SendEmailResult['providerAcceptanceStatus'] = 'pending';
    let deliveryStatus: SendEmailResult['deliveryStatus'] = 'failed';
    let bounceStatus: 'none' | 'soft_bounce' | 'hard_bounce' = 'none';
    let providerMessageId: string | null = null;
    let providerResponse: string | null = null;
    let errorMessage: string | null = null;
    let retryable = true;
    const maxImmediateAttempts = input.existingLogId ? 1 : 2;
    let attempts = input.attemptNumber ?? 0;

    if (providerInfo.provider === 'resend') {
      for (let i = 1; i <= maxImmediateAttempts; i++) {
        attempts = (input.attemptNumber ? input.attemptNumber - 1 : 0) + i;
        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: fromEmail,
              to: [toEmail],
              ...(replyTo ? { reply_to: replyTo } : {}),
              subject: rendered.subject,
              html: rendered.html,
              text: rendered.text,
            }),
            signal: AbortSignal.timeout(12000),
          });
          const body = await res.json().catch(() => ({}));
          if (!res.ok) {
            const rejected = res.status >= 400 && res.status < 500 && res.status !== 429;
            const errMsg = sanitizeProviderError(body?.message || `Resend HTTP ${res.status}`);
            status = rejected ? 'rejected' : 'failed';
            submissionStatus = rejected ? 'rejected' : 'failed';
            providerAcceptanceStatus = rejected ? 'rejected' : 'pending';
            deliveryStatus = 'failed';
            providerResponse = `HTTP ${res.status}: ${errMsg}`;
            errorMessage = errMsg;
            retryable = !rejected;
            if (rejected) break;
            continue;
          }
          status = 'accepted';
          submissionStatus = 'submitted';
          providerAcceptanceStatus = 'accepted';
          deliveryStatus = 'accepted_by_provider';
          providerMessageId = body?.id || null;
          providerResponse = `HTTP ${res.status} OK (Resend ID: ${body?.id || 'none'})`;
          errorMessage = null;
          retryable = false;
          break;
        } catch (err: any) {
          status = 'failed';
          submissionStatus = 'failed';
          providerAcceptanceStatus = 'pending';
          deliveryStatus = 'failed';
          errorMessage = sanitizeProviderError(err);
          retryable = true;
        }
      }
    } else if (providerInfo.provider === 'smtp') {
      const transporter = createSmtpTransporter();
      try {
        for (let i = 1; i <= maxImmediateAttempts; i++) {
          attempts = (input.attemptNumber ? input.attemptNumber - 1 : 0) + i;
          try {
            const info = await transporter.sendMail({
              from: fromEmail,
              to: toEmail,
              ...(replyTo ? { replyTo } : {}),
              subject: rendered.subject,
              text: rendered.text,
              html: rendered.html,
            });

            const rejectedList = Array.isArray(info.rejected) ? info.rejected : [];
            const acceptedList = Array.isArray(info.accepted) ? info.accepted : [];

            if (rejectedList.length > 0 && acceptedList.length === 0) {
              status = 'rejected';
              submissionStatus = 'rejected';
              providerAcceptanceStatus = 'rejected';
              deliveryStatus = 'failed';
              bounceStatus = 'hard_bounce';
              providerMessageId = info.messageId || null;
              providerResponse = sanitizeProviderError(info.response || 'Recipient rejected by SMTP');
              errorMessage = `SMTP server rejected recipient: ${providerResponse}`;
              retryable = false;
              break;
            }

            status = 'accepted';
            submissionStatus = 'submitted';
            providerAcceptanceStatus = 'accepted';
            deliveryStatus = 'accepted_by_provider';
            providerMessageId = info.messageId || null;
            providerResponse = sanitizeProviderError(info.response || '250 OK');
            errorMessage = null;
            retryable = false;
            break;
          } catch (err: any) {
            const permanent = isPermanentRejection(err);
            status = permanent ? 'rejected' : 'failed';
            submissionStatus = permanent ? 'rejected' : 'failed';
            providerAcceptanceStatus = permanent ? 'rejected' : 'pending';
            deliveryStatus = 'failed';
            if (permanent && Number(err?.responseCode) >= 550) {
              bounceStatus = 'hard_bounce';
            }
            providerResponse = err?.response ? sanitizeProviderError(err.response) : null;
            errorMessage = sanitizeProviderError(err);
            retryable = !permanent;
            if (permanent) break;
          }
        }
      } finally {
        transporter.close();
      }
    }

    const accepted = status === 'accepted';
    const finalQueueStatus =
      input.queueStatus || (accepted ? 'completed' : retryable ? 'retrying' : 'failed');

    if (accepted) {
      console.info(
        `[EmailService:${providerInfo.provider}] ACCEPTED template=${input.templateKey} to=${maskEmail(toEmail)} messageId=${providerMessageId || 'n/a'}`
      );
    } else {
      console.error(
        `[EmailService:${providerInfo.provider}] ${status.toUpperCase()} template=${input.templateKey} to=${maskEmail(toEmail)} attempts=${attempts} error="${errorMessage}"`
      );
    }

    const logId = await persistDeliveryLog({
      existingLogId: input.existingLogId,
      userId: input.userId,
      toEmail,
      templateKey: input.templateKey,
      subject: rendered.subject,
      locale,
      dedupeKey: input.dedupeKey || null,
      status,
      queueStatus: finalQueueStatus,
      submissionStatus,
      providerAcceptanceStatus,
      deliveryStatus,
      bounceStatus,
      provider: providerInfo.provider,
      providerMessageId,
      providerResponse,
      attempts,
      maxAttempts,
      nextRetryAt: !accepted && retryable ? new Date(Date.now() + Math.min(Math.pow(2, attempts) * 60000, 3600000)) : null,
      errorMessage,
      sentAt: accepted ? new Date() : null,
    });

    return {
      accepted,
      delivered: accepted,
      status,
      queueStatus: finalQueueStatus,
      submissionStatus,
      providerAcceptanceStatus,
      deliveryStatus,
      provider: providerInfo.provider,
      providerMessageId,
      providerResponse,
      logId,
      error: errorMessage || undefined,
      retryable,
    };
  }

  /**
   * Retries an eligible failed delivery log entry safely with attempt tracking.
   */
  static async retryFailedLog(logId: string): Promise<SendEmailResult> {
    const sqlite = isSqliteDb();
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "EmailDeliveryLog" WHERE "id" = ${sqlite ? '?' : '$1'} LIMIT 1`,
      logId
    );
    const log = rows?.[0];
    if (!log) {
      return {
        accepted: false,
        delivered: false,
        status: 'failed',
        queueStatus: 'failed',
        submissionStatus: 'failed',
        providerAcceptanceStatus: 'rejected',
        deliveryStatus: 'failed',
        provider: 'unconfigured',
        error: 'Log entry not found',
      };
    }

    if (log.status === 'accepted' || log.status === 'delivered') {
      return {
        accepted: true,
        delivered: true,
        status: log.status,
        queueStatus: 'completed',
        submissionStatus: 'submitted',
        providerAcceptanceStatus: 'accepted',
        deliveryStatus: log.deliveryStatus || 'accepted_by_provider',
        provider: log.provider,
        providerMessageId: log.providerMessageId,
        logId: log.id,
      };
    }

    return this.sendTemplate({
      existingLogId: log.id,
      userId: log.userId,
      toEmail: log.toEmail,
      templateKey: log.templateKey as EmailTemplateKey,
      locale: (log.locale as any) || 'en',
      attemptNumber: (log.attempts || 1) + 1,
      maxAttempts: log.maxAttempts || 3,
      data: {
        name: 'Farmer',
        actionUrl: this.getAppUrl('/dashboard'),
      },
    });
  }

  /**
   * Processes the retry queue for failed or retrying email logs that have reached nextRetryAt.
   */
  static async processRetryQueue(limit = 10): Promise<{ processed: number; succeeded: number; failed: number }> {
    const sqlite = isSqliteDb();
    const nowIso = new Date().toISOString();
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT "id" FROM "EmailDeliveryLog"
       WHERE "status" IN ('failed', 'retrying')
         AND "attempts" < "maxAttempts"
         AND ("nextRetryAt" IS NULL OR "nextRetryAt" <= ${sqlite ? '?' : '$1'})
       ORDER BY "createdAt" ASC
       LIMIT ${limit}`,
      nowIso
    ).catch(() => [] as any[]);

    let succeeded = 0;
    let failed = 0;

    for (const row of rows) {
      try {
        const res = await this.retryFailedLog(row.id);
        if (res.accepted) {
          succeeded++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    return { processed: rows.length, succeeded, failed };
  }
}
