/**
 * SmartFarm AI — Multilingual Responsive Email Templates (EN / HI / GU)
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
      ? `<div style="margin:24px 0;">
          <a href="${escapeHtml(params.ctaUrl)}" style="display:inline-block;background:#2F7D4F;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:10px;font-size:14px;">
            ${escapeHtml(params.ctaLabel)}
          </a>
        </div>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7F8F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1C1917;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E7E5E4;">
          <tr>
            <td style="background:#143D2A;padding:20px 28px;color:#ffffff;">
              <div style="font-size:18px;font-weight:800;letter-spacing:-0.01em;">SmartFarm AI</div>
              <div style="font-size:12px;color:#A7F3D0;margin-top:2px;">Intelligent Agriculture &amp; Crop Lifecycle Platform</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 12px;font-size:20px;color:#143D2A;">${escapeHtml(params.title)}</h1>
              <p style="margin:0 0 16px;font-size:14px;color:#44403C;">${escapeHtml(params.greeting)}</p>
              <div style="font-size:14px;line-height:1.6;color:#292524;">${params.bodyHtml}</div>
              ${ctaBlock}
              <hr style="border:none;border-top:1px solid #E7E5E4;margin:24px 0;" />
              <p style="margin:0;font-size:12px;color:#78716C;line-height:1.5;">${escapeHtml(params.footerNote)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
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
        : 'Sent by SmartFarm AI. You can manage email notification preferences anytime in Settings.';

  switch (templateKey) {
    case 'verification': {
      const expiresHours = data.expiresHours || 24;
      const subject =
        locale === 'hi'
          ? 'SmartFarm AI — अपना खाता सत्यापित करें'
          : locale === 'gu'
            ? 'SmartFarm AI — તમારું ખાતું ચકાસો'
            : 'Verify Your SmartFarm AI Account';
      const title =
        locale === 'hi'
          ? 'अपना SmartFarm AI खाता सत्यापित करें'
          : locale === 'gu'
            ? 'તમારું SmartFarm AI ખાતું ચકાસો'
            : 'Verify Your SmartFarm AI Account';
      const verifyGreeting =
        locale === 'hi'
          ? `नमस्ते ${name},`
          : locale === 'gu'
            ? `નમસ્તે ${name},`
            : `Hello ${name},`;
      const bodyHtml = `
        <p style="margin:0 0 12px;">Welcome to <strong>SmartFarm AI</strong>!</p>
        <p style="margin:0 0 16px;">To secure your account and access your personalized farming dashboard, please verify your email address.</p>
        <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:12px;padding:18px 20px;margin:20px 0;text-align:center;">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#065F46;font-weight:700;">Your verification code</div>
          <div style="font-size:32px;font-weight:800;letter-spacing:8px;color:#143D2A;margin-top:8px;font-family:'Courier New',Courier,monospace;">${escapeHtml(data.otpCode)}</div>
        </div>
        <p style="margin:0 0 8px;">You can also verify your account using the button below:</p>
        <p style="margin:14px 0 0;font-size:12px;color:#57534E;">This code and link are valid for ${escapeHtml(expiresHours)} hours.</p>
        <p style="margin:8px 0 0;font-size:12px;color:#57534E;">If the button does not work, copy and paste this link into your browser:<br />
          <a href="${escapeHtml(data.verifyUrl)}" style="color:#2F7D4F;word-break:break-all;">${escapeHtml(data.verifyUrl)}</a>
        </p>
        <p style="margin:14px 0 0;font-size:12px;color:#78716C;">If you did not request this account, you can safely ignore this email.</p>
        <p style="margin:16px 0 0;font-size:13px;color:#292524;">Regards,<br /><strong>SmartFarm AI Team</strong></p>
      `;
      const plainText = [
        verifyGreeting,
        '',
        'Welcome to SmartFarm AI!',
        '',
        'To secure your account and access your personalized farming dashboard, please verify your email address.',
        '',
        'Your verification code:',
        String(data.otpCode || ''),
        '',
        'You can also verify your account using the link below:',
        String(data.verifyUrl || ''),
        '',
        `This code and link are valid for ${expiresHours} hours.`,
        '',
        'If you did not request this account, you can ignore this email.',
        '',
        'Regards,',
        'SmartFarm AI Team',
      ].join('\n');

      return {
        subject,
        html: wrapLayout({
          title,
          greeting: verifyGreeting,
          bodyHtml,
          ctaLabel: 'Verify My Email',
          ctaUrl: data.verifyUrl,
          footerNote: footer,
        }),
        text: plainText,
      };
    }

    case 'registration_success': {
      const subject =
        locale === 'hi'
          ? 'SmartFarm AI में आपका स्वागत है — खाता सक्रिय हो गया'
          : locale === 'gu'
            ? 'SmartFarm AI માં તમારું સ્વાગત છે — ખાતું સક્રિય થઈ ગયું'
            : 'Welcome to SmartFarm AI — Your Account Is Active';
      const title =
        locale === 'hi'
          ? 'खाता सफलतापूर्वक सक्रिय हुआ'
          : locale === 'gu'
            ? 'ખાતું સફળતાપૂર્વક સક્રિય થયું'
            : 'Your Account Is Ready!';
      const bodyHtml = `
        <p>Your email address has been verified and your SmartFarm AI farmer account is now active.</p>
        <p>You can now sign in with your email address and password to add your farms and fields, launch crop-specific lifecycle plans across 60+ Indian crops, check live weather and mandi rates, and consult the AI Farming Assistant.</p>
      `;
      return {
        subject,
        html: wrapLayout({
          title,
          greeting,
          bodyHtml,
          ctaLabel: 'Sign In to SmartFarm AI',
          ctaUrl: data.loginUrl,
          footerNote: footer,
        }),
        text: `${greeting}\n\nYour SmartFarm AI email is verified and your account is active.\nSign in: ${data.loginUrl}`,
      };
    }

    case 'password_reset': {
      const subject =
        locale === 'hi'
          ? 'SmartFarm AI — पासवर्ड रीसेट अनुरोध'
          : locale === 'gu'
            ? 'SmartFarm AI — પાસવર્ડ રીસેટ વિનંતી'
            : 'Reset your password — SmartFarm AI';
      const title =
        locale === 'hi'
          ? 'पासवर्ड रीसेट करें'
          : locale === 'gu'
            ? 'પાસવર્ડ રીસેટ કરો'
            : 'Reset Your Password';
      const bodyHtml = `
        <p>We received a request to reset your SmartFarm AI password. Use the secure button or 6-digit code below:</p>
        <div style="background:#FEF3C7;border:1px solid #FCD34D;border-radius:10px;padding:14px 18px;margin:16px 0;">
          <div style="font-size:12px;color:#92400E;font-weight:600;">Password Reset Code</div>
          <div style="font-size:26px;font-weight:800;letter-spacing:6px;color:#78350F;margin-top:4px;">${escapeHtml(data.otpCode)}</div>
        </div>
        <p style="font-size:12px;color:#57534E;">This link and code expire in 30 minutes. If you did not request a password reset, your password has not changed.</p>
      `;
      return {
        subject,
        html: wrapLayout({
          title,
          greeting,
          bodyHtml,
          ctaLabel: 'Reset Password',
          ctaUrl: data.resetUrl,
          footerNote: footer,
        }),
        text: `${greeting}\n\nReset your SmartFarm AI password.\nCode: ${data.otpCode}\nLink: ${data.resetUrl}\n\nExpires in 30 minutes.`,
      };
    }

    case 'security_login': {
      const subject = 'New Sign-In to Your SmartFarm AI Account';
      const bodyHtml = `
        <p>A sign-in to your SmartFarm AI account was recorded.</p>
        <ul style="padding-left:18px;color:#44403C;">
          <li><strong>Time:</strong> ${escapeHtml(data.loginTime || new Date().toISOString())}</li>
          <li><strong>Source:</strong> ${escapeHtml(data.ip || 'Web Browser')}</li>
        </ul>
        <p style="font-size:12px;color:#57534E;">If this was you, no action is needed. If you do not recognize this sign-in, please reset your password immediately.</p>
      `;
      return {
        subject,
        html: wrapLayout({
          title: 'Account Sign-In Notice',
          greeting,
          bodyHtml,
          ctaLabel: 'Review Security Settings',
          ctaUrl: data.settingsUrl,
          footerNote: footer,
        }),
        text: `${greeting}\n\nA new sign-in was recorded on your SmartFarm AI account at ${data.loginTime || new Date().toISOString()}.`,
      };
    }

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
        html: wrapLayout({
          title: `${cropName} — ${stageName}`,
          greeting,
          bodyHtml,
          ctaLabel: 'Open Crop Lifecycle Plan',
          ctaUrl: data.actionUrl,
          footerNote: footer,
        }),
        text: `${greeting}\n\n${cropName} (${fieldName}) entered ${stageName}.\nRecommended Action: ${data.whatToDo || 'Open SmartFarm AI to inspect tasks.'}`,
      };
    }

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
        html: wrapLayout({
          title: 'Upcoming Farm Task Reminder',
          greeting,
          bodyHtml,
          ctaLabel: 'View My Tasks',
          ctaUrl: data.actionUrl,
          footerNote: footer,
        }),
        text: `${greeting}\n\nFarming Reminder: ${taskTitle}\n${data.body || ''}`,
      };
    }

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
        html: wrapLayout({
          title: 'Farm Weather Alert',
          greeting,
          bodyHtml,
          ctaLabel: 'View Weather Forecast',
          ctaUrl: data.actionUrl,
          footerNote: footer,
        }),
        text: `${greeting}\n\nWeather Alert (${data.location || 'Farm'}): ${data.alertTitle}\n${data.body || ''}`,
      };
    }

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
        html: wrapLayout({
          title: 'Crop Disease & IPM Alert',
          greeting,
          bodyHtml,
          ctaLabel: 'View Diagnosis Report',
          ctaUrl: data.actionUrl,
          footerNote: footer,
        }),
        text: `${greeting}\n\nCrop Health Alert: ${data.diseaseName} on ${data.cropName}. ${data.guidance || ''}`,
      };
    }

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
        html: wrapLayout({
          title: 'Order Confirmation',
          greeting,
          bodyHtml,
          ctaLabel: 'Track My Order',
          ctaUrl: data.actionUrl,
          footerNote: footer,
        }),
        text: `${greeting}\n\nOrder ${data.orderNumber} confirmed. Total: INR ${data.totalAmount}.`,
      };
    }

    case 'order_status': {
      const subject = `Order Update (${data.orderNumber}): ${data.status}`;
      const bodyHtml = `
        <p>Your SmartFarm AI store order <strong>${escapeHtml(data.orderNumber)}</strong> status has been updated to <strong style="text-transform:uppercase;">${escapeHtml(data.status)}</strong>.</p>
      `;
      return {
        subject,
        html: wrapLayout({
          title: 'Order Status Update',
          greeting,
          bodyHtml,
          ctaLabel: 'View Order Details',
          ctaUrl: data.actionUrl,
          footerNote: footer,
        }),
        text: `${greeting}\n\nOrder ${data.orderNumber} status updated to: ${data.status}.`,
      };
    }
  }
}
