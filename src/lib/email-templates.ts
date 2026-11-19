/**
 * SmartFarm AI — Multilingual Responsive Email Templates (EN / HI / GU)
 *
 * Phase 10 upgrade: Professional verification email matching the Phase 10 spec:
 *  - Subject: "Verify Your SmartFarm AI Account"
 *  - Large readable OTP in a styled box
 *  - Clear "Verify My Email" CTA button
 *  - 24-hour expiry notice
 *  - Plain-text fallback
 *  - Mobile-responsive table layout
 *  - SmartFarm AI branding (dark green #143D2A header)
 */

export type EmailLocale = 'en' | 'hi' | 'gu';

export type EmailTemplateKey =
  | 'verification'
  | 'registration_success'
  | 'password_reset'
  | 'security_login'
  | 'crop_stage'
  | 'task_reminder'
  | 'weather_alert'
  | 'disease_alert'
  | 'order_confirmation'
  | 'order_status';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

function escapeHtml(input: unknown): string {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function wrapLayout(params: {
  title: string;
  greeting: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote: string;
}): string {
  const ctaBlock =
    params.ctaLabel && params.ctaUrl
      ? `<div style="text-align:center;margin:28px 0;">
          <a href="${escapeHtml(params.ctaUrl)}"
             style="display:inline-block;background:#2F7D4F;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 32px;border-radius:10px;font-size:15px;letter-spacing:0.01em;">
            ${escapeHtml(params.ctaLabel)}
          </a>
          <p style="margin:10px 0 0;font-size:12px;color:#78716C;">
            Or paste this link in your browser:<br>
            <a href="${escapeHtml(params.ctaUrl)}" style="color:#2F7D4F;word-break:break-all;">${escapeHtml(params.ctaUrl)}</a>
          </p>
        </div>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(params.title)}</title>
</head>
<body style="margin:0;padding:0;background:#F0F2EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1C1917;">
  <!--[if mso]><table role="presentation" width="100%"><tr><td><![endif]-->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F0F2EE;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"
               style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #D6D3D1;">

          <!-- Header -->
          <tr>
            <td style="background:#143D2A;padding:22px 28px;">
              <div style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.01em;">🌱 SmartFarm AI</div>
              <div style="font-size:12px;color:#A7F3D0;margin-top:3px;">Intelligent Agriculture &amp; Crop Lifecycle Platform</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 28px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#143D2A;line-height:1.2;">${escapeHtml(params.title)}</h1>
              <p style="margin:0 0 20px;font-size:14px;color:#57534E;line-height:1.6;">${escapeHtml(params.greeting)}</p>
              <div style="font-size:14px;line-height:1.7;color:#292524;">
                ${params.bodyHtml}
              </div>
              ${ctaBlock}
              <hr style="border:none;border-top:1px solid #E7E5E4;margin:28px 0;" />
              <p style="margin:0;font-size:11px;color:#A8A29E;line-height:1.6;">${escapeHtml(params.footerNote)}</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F5F5F4;padding:16px 28px;border-top:1px solid #E7E5E4;">
              <p style="margin:0;font-size:11px;color:#A8A29E;text-align:center;">
                &copy; ${new Date().getFullYear()} SmartFarm AI &nbsp;|&nbsp; Empowering Indian Farmers
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
  <!--[if mso]></td></tr></table><![endif]-->
</body>
</html>`;
}

export function renderEmailTemplate(
  templateKey: EmailTemplateKey,
  locale: EmailLocale,
  data: Record<string, any>
): RenderedEmail {
  const name = data.name || 'Farmer';
  const greeting =
    locale === 'hi'
      ? `नमस्ते ${name},`
      : locale === 'gu'
        ? `નમસ્તે ${name},`
        : `Hello ${name},`;

  const footer =
    locale === 'hi'
      ? 'यह संदेश SmartFarm AI द्वारा भेजा गया है। आप Settings > Notifications से ईमेल प्राथमिकताएँ बदल सकते हैं।'
      : locale === 'gu'
        ? 'આ સંદેશ SmartFarm AI દ્વારા મોકલવામાં આવ્યો છે. તમે Settings > Notifications માંથી ઈમેઈલ પસંદગીઓ બદલી શકો છો.'
        : 'Sent by SmartFarm AI. Manage your email notification preferences anytime in Settings > Notifications.';

  switch (templateKey) {
    // ────────────────────────────────────────────────────────────────────────
    // VERIFICATION
    // ────────────────────────────────────────────────────────────────────────
    case 'verification': {
      const subject =
        locale === 'hi'
          ? 'अपना SmartFarm AI खाता सत्यापित करें'
          : locale === 'gu'
            ? 'તમારું SmartFarm AI એકાઉન્ટ ચકાસો'
            : 'Verify Your SmartFarm AI Account';
      const title =
        locale === 'hi'
          ? 'ईमेल सत्यापन'
          : locale === 'gu'
            ? 'ઈમેઈલ ચકાસણી'
            : 'Confirm Your Email Address';

      const otpDisplay = String(data.otpCode || '------');

      const bodyHtml = `
        <p>Welcome to SmartFarm AI! To secure your account and unlock your personalised farming dashboard, please verify your email address.</p>

        <p style="margin-top:20px;margin-bottom:6px;font-size:13px;font-weight:600;color:#374151;">Your 6-digit verification code:</p>
        <div style="background:#ECFDF5;border:2px solid #6EE7B7;border-radius:12px;padding:20px 24px;margin:0 0 20px;text-align:center;">
          <div style="font-size:36px;font-weight:800;letter-spacing:10px;color:#065F46;font-family:'Courier New',Courier,monospace;">${escapeHtml(otpDisplay)}</div>
          <div style="font-size:12px;color:#6B7280;margin-top:8px;">Enter this code on the verification page</div>
        </div>

        <p style="font-size:13px;color:#57534E;">
          You can also click the button below to verify your email instantly — no code needed.
        </p>
        <p style="font-size:12px;color:#9CA3AF;margin-top:16px;">
          ⏰ This code and link are valid for <strong>24 hours</strong>.<br>
          If you did not create a SmartFarm AI account, you can safely ignore this email.
        </p>
      `;
      return {
        subject,
        html: wrapLayout({ title, greeting, bodyHtml, ctaLabel: 'Verify My Email', ctaUrl: data.verifyUrl, footerNote: footer }),
        text: [
          greeting,
          '',
          'Verify Your SmartFarm AI Account',
          '==================================',
          '',
          'Your 6-digit verification code: ' + otpDisplay,
          '',
          'Or click this link to verify your email:',
          data.verifyUrl,
          '',
          'This code and link expire in 24 hours.',
          "If you didn't create this account, ignore this email.",
          '',
          '— SmartFarm AI Team',
        ].join('\n'),
      };
    }

    // ────────────────────────────────────────────────────────────────────────
    // REGISTRATION SUCCESS / ACCOUNT ACTIVATED
    // ────────────────────────────────────────────────────────────────────────
    case 'registration_success': {
      const subject =
        locale === 'hi'
          ? 'SmartFarm AI में आपका स्वागत है — खाता सक्रिय हो गया'
          : locale === 'gu'
            ? 'SmartFarm AI માં તમારું સ્વાગત છે — ખાતું સક્રિય થઈ ગયું'
            : 'Welcome to SmartFarm AI — Your Account Is Active';
      const title =
        locale === 'hi'
          ? 'खाता सफलतापूर्वक सक्रिय हुआ 🎉'
          : locale === 'gu'
            ? 'ખાતું સફળતાપૂર્વક સક્રિય થયું 🎉'
            : 'Your Account Is Ready! 🎉';
      const bodyHtml = `
        <p>Your email address has been verified and your SmartFarm AI farmer account is now fully active.</p>
        <p>You can now:</p>
        <ul style="padding-left:18px;color:#374151;line-height:1.9;">
          <li>Add your farms and fields</li>
          <li>Launch crop-specific lifecycle plans (60+ Indian crops)</li>
          <li>Check live weather forecasts and mandi rates</li>
          <li>Use the AI Farming Assistant for expert advice</li>
          <li>Scan crop leaves for disease diagnosis</li>
        </ul>
      `;
      return {
        subject,
        html: wrapLayout({ title, greeting, bodyHtml, ctaLabel: 'Sign In to SmartFarm AI', ctaUrl: data.loginUrl, footerNote: footer }),
        text: `${greeting}\n\nYour SmartFarm AI email is verified and your account is now active.\nSign in: ${data.loginUrl}`,
      };
    }

    // ────────────────────────────────────────────────────────────────────────
    // PASSWORD RESET
    // ────────────────────────────────────────────────────────────────────────
    case 'password_reset': {
      const subject =
        locale === 'hi'
          ? 'SmartFarm AI — पासवर्ड रीसेट अनुरोध'
          : locale === 'gu'
            ? 'SmartFarm AI — પાસવર્ડ રીસેટ વિનંતી'
            : 'Reset your SmartFarm AI password';
      const title =
        locale === 'hi'
          ? 'पासवर्ड रीसेट करें'
          : locale === 'gu'
            ? 'પાસવર્ડ રીસેટ કરો'
            : 'Reset Your Password';
      const otpDisplay = String(data.otpCode || '------');
      const bodyHtml = `
        <p>We received a request to reset your SmartFarm AI password.</p>
        <p style="margin-top:20px;margin-bottom:6px;font-size:13px;font-weight:600;color:#374151;">Your 6-digit reset code:</p>
        <div style="background:#FEF3C7;border:2px solid #FCD34D;border-radius:12px;padding:20px 24px;margin:0 0 20px;text-align:center;">
          <div style="font-size:36px;font-weight:800;letter-spacing:10px;color:#78350F;font-family:'Courier New',Courier,monospace;">${escapeHtml(otpDisplay)}</div>
          <div style="font-size:12px;color:#6B7280;margin-top:8px;">Enter on the Reset Password page</div>
        </div>
        <p style="font-size:12px;color:#9CA3AF;">
          ⏰ This link and code are valid for <strong>30 minutes</strong>.<br>
          If you did not request a password reset, your password has not changed — no action is needed.
        </p>
      `;
      return {
        subject,
        html: wrapLayout({ title, greeting, bodyHtml, ctaLabel: 'Reset My Password', ctaUrl: data.resetUrl, footerNote: footer }),
        text: `${greeting}\n\nReset your SmartFarm AI password.\nCode: ${otpDisplay}\nLink: ${data.resetUrl}\n\nExpires in 30 minutes.`,
      };
    }

    // ────────────────────────────────────────────────────────────────────────
    // SECURITY LOGIN ALERT
    // ────────────────────────────────────────────────────────────────────────
    case 'security_login': {
      const subject = 'New Sign-In to Your SmartFarm AI Account';
      const bodyHtml = `
        <p>A new sign-in to your SmartFarm AI account was recorded.</p>
        <table role="presentation" style="border:1px solid #E7E5E4;border-radius:10px;width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:10px 14px;border-bottom:1px solid #F3F4F6;color:#6B7280;font-size:12px;">Time</td>
              <td style="padding:10px 14px;border-bottom:1px solid #F3F4F6;font-weight:600;">${escapeHtml(data.loginTime || new Date().toISOString())}</td></tr>
          <tr><td style="padding:10px 14px;color:#6B7280;font-size:12px;">Source</td>
              <td style="padding:10px 14px;font-weight:600;">${escapeHtml(data.ip || 'Web Browser')}</td></tr>
        </table>
        <p style="font-size:12px;color:#57534E;">
          If this was you, no action is needed. If you do not recognise this sign-in, please reset your password immediately.
        </p>
      `;
      return {
        subject,
        html: wrapLayout({ title: 'Account Sign-In Notice', greeting, bodyHtml, ctaLabel: 'Review Security Settings', ctaUrl: data.settingsUrl, footerNote: footer }),
        text: `${greeting}\n\nA new sign-in was recorded on your SmartFarm AI account at ${data.loginTime || new Date().toISOString()}.`,
      };
    }

    // ────────────────────────────────────────────────────────────────────────
    // CROP STAGE
    // ────────────────────────────────────────────────────────────────────────
    case 'crop_stage': {
      const cropName = data.cropName || 'Crop';
      const stageName = data.stageName || 'New Growth Stage';
      const fieldName = data.fieldName || 'Your Field';
      const subject = `Crop Stage Update: ${cropName} entered ${stageName} (${fieldName})`;
      const bodyHtml = `
        <p>Your <strong>${escapeHtml(cropName)}</strong> in <strong>${escapeHtml(fieldName)}</strong> is now at <strong>${escapeHtml(stageName)}</strong> (Day ${escapeHtml(data.das ?? '—')} after sowing).</p>
        ${data.whatToDo ? `<p><strong>Recommended Action:</strong> ${escapeHtml(data.whatToDo)}</p>` : ''}
        ${data.precautions ? `<p style="color:#92400E;"><strong>Precaution:</strong> ${escapeHtml(data.precautions)}</p>` : ''}
      `;
      return {
        subject,
        html: wrapLayout({ title: `${cropName} — ${stageName}`, greeting, bodyHtml, ctaLabel: 'Open Crop Lifecycle Plan', ctaUrl: data.actionUrl, footerNote: footer }),
        text: `${greeting}\n\n${cropName} (${fieldName}) entered ${stageName}.\nRecommended Action: ${data.whatToDo || 'Open SmartFarm AI to inspect tasks.'}`,
      };
    }

    // ────────────────────────────────────────────────────────────────────────
    // TASK REMINDER
    // ────────────────────────────────────────────────────────────────────────
    case 'task_reminder': {
      const taskTitle = data.title || 'Scheduled Farming Activity';
      const subject = `Farming Reminder: ${taskTitle}`;
      const bodyHtml = `
        <p>You have an upcoming farming activity scheduled:</p>
        <div style="background:#F5F5F4;border-left:4px solid #2F7D4F;padding:12px 16px;border-radius:8px;margin:14px 0;">
          <div style="font-weight:700;color:#143D2A;">${escapeHtml(taskTitle)}</div>
          ${data.fieldName ? `<div style="font-size:12px;color:#57534E;margin-top:4px;">Field: ${escapeHtml(data.fieldName)}</div>` : ''}
          ${data.dueDate ? `<div style="font-size:12px;color:#57534E;margin-top:2px;">Scheduled: ${escapeHtml(data.dueDate)}</div>` : ''}
          ${data.body ? `<p style="margin:8px 0 0;font-size:13px;">${escapeHtml(data.body)}</p>` : ''}
        </div>
      `;
      return {
        subject,
        html: wrapLayout({ title: 'Upcoming Farm Task Reminder', greeting, bodyHtml, ctaLabel: 'View My Tasks', ctaUrl: data.actionUrl, footerNote: footer }),
        text: `${greeting}\n\nFarming Reminder: ${taskTitle}\n${data.body || ''}`,
      };
    }

    // ────────────────────────────────────────────────────────────────────────
    // WEATHER ALERT
    // ────────────────────────────────────────────────────────────────────────
    case 'weather_alert': {
      const subject = `Weather Alert for ${data.location || 'Your Farm'}: ${data.alertTitle || 'Advisory'}`;
      const bodyHtml = `
        <div style="background:#FEF3C7;border-left:4px solid #D97706;padding:14px 16px;border-radius:8px;">
          <div style="font-weight:700;color:#92400E;">${escapeHtml(data.alertTitle || 'Weather Advisory')}</div>
          <p style="margin:6px 0 0;color:#78350F;">${escapeHtml(data.body || 'Check your farm weather dashboard before spraying or irrigating.')}</p>
        </div>
      `;
      return {
        subject,
        html: wrapLayout({ title: 'Farm Weather Alert', greeting, bodyHtml, ctaLabel: 'View Weather Forecast', ctaUrl: data.actionUrl, footerNote: footer }),
        text: `${greeting}\n\nWeather Alert (${data.location || 'Farm'}): ${data.alertTitle}\n${data.body || ''}`,
      };
    }

    // ────────────────────────────────────────────────────────────────────────
    // DISEASE ALERT
    // ────────────────────────────────────────────────────────────────────────
    case 'disease_alert': {
      const subject = `Crop Health Alert: ${data.diseaseName || 'Issue Detected'} (${data.cropName || 'Crop'})`;
      const bodyHtml = `
        <p>A crop health diagnosis was recorded for <strong>${escapeHtml(data.cropName || 'your crop')}</strong> on <strong>${escapeHtml(data.fieldName || 'your field')}</strong>.</p>
        <p><strong>Detected Condition:</strong> ${escapeHtml(data.diseaseName || 'Requires inspection')}</p>
        ${data.guidance ? `<p><strong>Recommended IPM Next Step:</strong> ${escapeHtml(data.guidance)}</p>` : ''}
        <p style="font-size:12px;color:#57534E;">Always inspect the affected plot in person and follow CIB&amp;RC-registered labels before applying any treatment.</p>
      `;
      return {
        subject,
        html: wrapLayout({ title: 'Crop Disease & IPM Alert', greeting, bodyHtml, ctaLabel: 'View Diagnosis Report', ctaUrl: data.actionUrl, footerNote: footer }),
        text: `${greeting}\n\nCrop Health Alert: ${data.diseaseName} on ${data.cropName}. ${data.guidance || ''}`,
      };
    }

    // ────────────────────────────────────────────────────────────────────────
    // ORDER CONFIRMATION
    // ────────────────────────────────────────────────────────────────────────
    case 'order_confirmation': {
      const subject = `Order Confirmed: ${data.orderNumber || 'SmartFarm Store'}`;
      const bodyHtml = `
        <p>Thank you for your order with the SmartFarm AI Fertilizer &amp; Agri-Input Store.</p>
        <ul style="padding-left:18px;">
          <li><strong>Order Number:</strong> ${escapeHtml(data.orderNumber)}</li>
          <li><strong>Total Amount:</strong> ₹${escapeHtml(data.totalAmount)}</li>
          <li><strong>Delivery To:</strong> ${escapeHtml(data.deliveryAddress || '')}</li>
        </ul>
      `;
      return {
        subject,
        html: wrapLayout({ title: 'Order Confirmation', greeting, bodyHtml, ctaLabel: 'Track My Order', ctaUrl: data.actionUrl, footerNote: footer }),
        text: `${greeting}\n\nOrder ${data.orderNumber} confirmed. Total: INR ${data.totalAmount}.`,
      };
    }

    // ────────────────────────────────────────────────────────────────────────
    // ORDER STATUS
    // ────────────────────────────────────────────────────────────────────────
    case 'order_status': {
      const subject = `Order Update (${data.orderNumber}): ${data.status}`;
      const bodyHtml = `
        <p>Your SmartFarm AI store order <strong>${escapeHtml(data.orderNumber)}</strong> status has been updated to <strong style="text-transform:uppercase;">${escapeHtml(data.status)}</strong>.</p>
      `;
      return {
        subject,
        html: wrapLayout({ title: 'Order Status Update', greeting, bodyHtml, ctaLabel: 'View Order Details', ctaUrl: data.actionUrl, footerNote: footer }),
        text: `${greeting}\n\nOrder ${data.orderNumber} status updated to: ${data.status}.`,
      };
    }
  }
}
