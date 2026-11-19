/**
 * SmartFarm AI — Multilingual Responsive Email Templates (EN / HI / GU)
 *
 * Designed for Indian farmers with:
 * - Clear agricultural branding (#143D2A, #2F7D4F)
 * - Mobile-first table layouts compatible with Gmail, Apple Mail, Outlook
 * - Full translations for English, Hindi, and Gujarati
 * - Plain-text fallback for every email
 */

export type EmailLocale = 'en' | 'hi' | 'gu';

export type EmailTemplateKey =
  | 'verification'
  | 'registration_success'
  | 'password_reset'
  | 'password_changed'
  | 'security_login'
  | 'crop_cycle_created'
  | 'crop_stage'
  | 'task_reminder'
  | 'task_overdue'
  | 'crop_cycle_completed'
  | 'weather_alert'
  | 'disease_alert'
  | 'irrigation_alert'
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
  badge?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote: string;
}): string {
  const badgeBlock = params.badge
    ? `<div style="display:inline-block;background:#E7F5EC;color:#143D2A;border:1px solid #A3D9B5;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;margin-bottom:12px;">
        ${escapeHtml(params.badge)}
      </div>`
    : '';

  const ctaBlock =
    params.ctaLabel && params.ctaUrl
      ? `<div style="margin:24px 0 16px;">
          <a href="${escapeHtml(params.ctaUrl)}" style="display:inline-block;background:#2F7D4F;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:10px;font-size:14px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
            ${escapeHtml(params.ctaLabel)} &rarr;
          </a>
        </div>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(params.title)}</title>
</head>
<body style="margin:0;padding:0;background:#FAF6EF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1C1917;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;background:#FAF6EF;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E7E5E4;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background:#143D2A;padding:22px 28px;color:#ffffff;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size:20px;font-weight:900;letter-spacing:-0.02em;color:#ffffff;">SmartFarm AI</div>
                    <div style="font-size:12px;color:#A7F3D0;margin-top:3px;font-weight:500;">Intelligent Agriculture &amp; Crop Lifecycle Engine</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 28px;">
              ${badgeBlock}
              <h1 style="margin:0 0 14px;font-size:22px;color:#143D2A;line-height:1.25;font-weight:800;">${escapeHtml(params.title)}</h1>
              <p style="margin:0 0 18px;font-size:15px;color:#44403C;font-weight:600;">${escapeHtml(params.greeting)}</p>
              <div style="font-size:14px;line-height:1.65;color:#292524;">${params.bodyHtml}</div>
              ${ctaBlock}
              <hr style="border:none;border-top:1px solid #F0EEE6;margin:28px 0 20px;" />
              <p style="margin:0;font-size:12px;color:#78716C;line-height:1.5;">${escapeHtml(params.footerNote)}</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#F7F8F5;padding:16px 28px;border-top:1px solid #E7E5E4;text-align:center;">
              <div style="font-size:11px;color:#78716C;">
                SmartFarm AI &bull; ICAR &bull; SAU &bull; IMD &bull; AGMARKNET Aligned Agricultural Guidance
              </div>
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
      ? 'यह संदेश SmartFarm AI द्वारा भेजा गया है। आप Dashboard > Settings से ईमेल प्राथमिकताएं बदल सकते हैं।'
      : locale === 'gu'
        ? 'આ સંદેશ SmartFarm AI દ્વારા મોકલવામાં આવ્યો છે. તમે Dashboard > Settings માંથી ઈમેઈલ પસંદગીઓ બદલી શકો છો.'
        : 'Sent by SmartFarm AI. You can manage your email notification preferences anytime in Dashboard > Settings.';

  switch (templateKey) {
    // -------------------------------------------------------------
    // ACCOUNT & SECURITY
    // -------------------------------------------------------------
    case 'verification': {
      const subject =
        locale === 'hi'
          ? 'SmartFarm AI — अपना खाता सत्यापित करें'
          : locale === 'gu'
            ? 'SmartFarm AI — તમારું ખાતું ચકાસો'
            : 'Verify Your SmartFarm AI Account';
      const title =
        locale === 'hi'
          ? 'अपना ईमेल सत्यापित करें'
          : locale === 'gu'
            ? 'તમારું ઈમેઈલ ચકાસો'
            : 'Verify Your Email Address';
      const bodyHtml = `
        <p>${
          locale === 'hi'
            ? 'SmartFarm AI पर आपका स्वागत है! अपने किसान खाते को सक्रिय करने के लिए कृपया नीचे दिए गए बटन पर क्लिक करें:'
            : locale === 'gu'
              ? 'SmartFarm AI માં આપનું સ્વાગત છે! તમારા ખેડૂત ખાતાને સક્રિય કરવા માટે કૃપા કરીને નીચેના બટન પર ક્લિક કરો:'
              : 'Welcome to SmartFarm AI! To activate your farmer account and access crop lifecycle advisories, please verify your email address:'
        }</p>
        ${
          data.otpCode
            ? `<div style="background:#F4FBF7;border:1px dashed #2F7D4F;padding:16px;border-radius:12px;text-align:center;margin:18px 0;">
                <div style="font-size:12px;color:#2F7D4F;font-weight:700;text-transform:uppercase;letter-spacing:1px;">
                  ${locale === 'hi' ? 'आपका 6-अंकीय सत्यापन कोड' : locale === 'gu' ? 'તમારો 6-અંકનો ચકાસણી કોડ' : 'Your 6-Digit Verification Code'}
                </div>
                <div style="font-size:32px;font-weight:900;letter-spacing:8px;color:#143D2A;margin-top:6px;font-family:monospace;">
                  ${escapeHtml(data.otpCode)}
                </div>
              </div>`
            : ''
        }
        <p style="font-size:12px;color:#78716C;">${
          locale === 'hi'
            ? 'यह लिंक 24 घंटे के लिए मान्य है। यदि आपने यह अनुरोध नहीं किया था, तो आप इस ईमेल को अनदेखा कर सकते हैं।'
            : locale === 'gu'
              ? 'આ લિંક 24 કલાક માટે માન્ય છે. જો તમે આ વિનંતી નથી કરી, તો તમે આ ઈમેઈલને અવગણી શકો છો.'
              : 'This link is valid for 24 hours. If you did not create an account, you can safely ignore this email.'
        }</p>
      `;
      return {
        subject,
        html: wrapLayout({
          title,
          greeting,
          bodyHtml,
          ctaLabel: locale === 'hi' ? 'खाता सत्यापित करें' : locale === 'gu' ? 'ખાતું ચકાસો' : 'Verify My Email',
          ctaUrl: data.verifyUrl,
          footerNote: footer,
        }),
        text: `${greeting}\n\nVerify your SmartFarm AI account.\nCode: ${data.otpCode || ''}\nLink: ${data.verifyUrl || ''}`,
      };
    }

    case 'registration_success': {
      const subject =
        locale === 'hi'
          ? 'SmartFarm AI पर आपका स्वागत है — आपका खाता तैयार है'
          : locale === 'gu'
            ? 'SmartFarm AI માં સ્વાગત છે — તમારું ખાતું તૈયાર છે'
            : 'Welcome to SmartFarm AI — Your Farmer Account is Ready';
      const bodyHtml = `
        <p>${
          locale === 'hi'
            ? 'आपका SmartFarm AI खाता सफलतापूर्वक सक्रिय कर दिया गया है। अब आप अपने खेत जोड़ सकते हैं, 60+ फसलों के विकास चक्र का पालन कर सकते हैं और स्वचालित अनुस्मारक प्राप्त कर सकते हैं।'
            : locale === 'gu'
              ? 'તમારું SmartFarm AI ખાતું સફળતાપૂર્વક સક્રિય કરવામાં આવ્યું છે. હવે તમે તમારા ખેતરો ઉમેરી શકો છો, 60+ પાકોના વિકાસ ચક્રનું પાલન કરી શકો છો અને આપમેળે રીમાઇન્ડર્સ મેળવી શકો છો.'
              : 'Your SmartFarm AI account has been successfully verified. You can now add your farms, configure field boundaries, start crop cycles for 60+ Indian crops, and receive automatic stage reminders.'
        }</p>
        <ul style="padding-left:18px;color:#44403C;margin:12px 0;">
          <li>${locale === 'hi' ? 'खेत और भूखंड (Fields) जोड़ें' : locale === 'gu' ? 'ખેતર અને પ્લોટ ઉમેરો' : 'Add your farms & fields'}</li>
          <li>${locale === 'hi' ? 'फसल चक्र शुरू करें और स्वचालित कार्य पाएं' : locale === 'gu' ? 'પાક ચક્ર શરૂ કરો અને કાર્યો મેળવો' : 'Start a crop cycle with sowing date for automated stage tasks'}</li>
          <li>${locale === 'hi' ? 'पत्ती रोग AI जांच और मंडी भाव देखें' : locale === 'gu' ? 'પાક રોગ તપાસ અને એપીએમસી બજાર ભાવ જુઓ' : 'Diagnose leaf diseases and check live APMC mandi prices'}</li>
        </ul>
      `;
      return {
        subject,
        html: wrapLayout({
          title: locale === 'hi' ? 'स्वागत है SmartFarm AI में' : locale === 'gu' ? 'સ્વાગત છે SmartFarm AI માં' : 'Welcome to SmartFarm AI',
          greeting,
          bodyHtml,
          ctaLabel: locale === 'hi' ? 'डैशबोर्ड खोलें' : locale === 'gu' ? 'ડેશબોર્ડ ખોલો' : 'Go to Farmer Dashboard',
          ctaUrl: data.loginUrl || data.actionUrl,
          footerNote: footer,
        }),
        text: `${greeting}\n\nWelcome to SmartFarm AI! Your account is active.\nLog in: ${data.loginUrl || ''}`,
      };
    }

    case 'password_reset': {
      const subject =
        locale === 'hi'
          ? 'SmartFarm AI — पासवर्ड रीसेट अनुरोध'
          : locale === 'gu'
            ? 'SmartFarm AI — પાસવર્ડ રીસેટ વિનંતી'
            : 'Reset Your SmartFarm AI Password';
      const bodyHtml = `
        <p>${
          locale === 'hi'
            ? 'आपके SmartFarm AI खाते के पासवर्ड को रीसेट करने का अनुरोध प्राप्त हुआ है। नीचे दिए गए बटन पर क्लिक करके नया पासवर्ड सेट करें:'
            : locale === 'gu'
              ? 'તમારા SmartFarm AI ખાતાનો પાસવર્ડ રીસેટ કરવાની વિનંતી પ્રાપ્ત થઈ છે. નવો પાસવર્ડ સેટ કરવા માટે નીચેના બટન પર ક્લિક કરો:'
              : 'We received a request to reset your SmartFarm AI password. Click the button below to set a new password:'
        }</p>
        ${
          data.otpCode
            ? `<div style="background:#FFFBEB;border:1px dashed #D97706;padding:14px;border-radius:12px;text-align:center;margin:16px 0;">
                <div style="font-size:12px;color:#92400E;font-weight:700;">6-Digit Reset Code</div>
                <div style="font-size:28px;font-weight:900;letter-spacing:6px;color:#78350F;margin-top:4px;font-family:monospace;">${escapeHtml(data.otpCode)}</div>
              </div>`
            : ''
        }
        <p style="font-size:12px;color:#78716C;">${
          locale === 'hi'
            ? 'यह लिंक 30 मिनट में समाप्त हो जाएगा। यदि आपने यह अनुरोध नहीं किया था, तो आप इसे अनदेखा कर सकते हैं।'
            : locale === 'gu'
              ? 'આ લિંક 30 મિનિટમાં સમાપ્ત થઈ જશે. જો તમે આ વિનંતી નથી કરી, તો તમે તેને અવગણી શકો છો.'
              : 'This reset link expires in 30 minutes. If you did not request this, please ensure your account is secure.'
        }</p>
      `;
      return {
        subject,
        html: wrapLayout({
          title: locale === 'hi' ? 'पासवर्ड रीसेट करें' : locale === 'gu' ? 'પાસવર્ડ રીસેટ કરો' : 'Reset Your Password',
          greeting,
          bodyHtml,
          ctaLabel: locale === 'hi' ? 'नया पासवर्ड बनाएं' : locale === 'gu' ? 'નવો પાસવર્ડ બનાવો' : 'Reset Password',
          ctaUrl: data.resetUrl,
          footerNote: footer,
        }),
        text: `${greeting}\n\nReset your SmartFarm AI password.\nLink: ${data.resetUrl}\nCode: ${data.otpCode || ''}`,
      };
    }

    case 'password_changed': {
      const subject =
        locale === 'hi'
          ? 'सुरक्षा सूचना: आपका SmartFarm AI पासवर्ड बदल दिया गया है'
          : locale === 'gu'
            ? 'સુરક્ષા સૂચના: તમારો SmartFarm AI પાસવર્ડ બદલાઈ ગયો છે'
            : 'Security Notice: Your SmartFarm AI Password Was Changed';
      const bodyHtml = `
        <p>${
          locale === 'hi'
            ? 'यह पुष्टि करने के लिए है कि आपके SmartFarm AI खाते का पासवर्ड हाल ही में सफलतापूर्वक बदल दिया गया है।'
            : locale === 'gu'
              ? 'આ પુષ્ટિ કરવા માટે છે કે તમારા SmartFarm AI ખાતાનો પાસવર્ડ તાજેતરમાં સફળતાપૂર્વક બદલાઈ ગયો છે.'
              : 'This is a confirmation that your SmartFarm AI password was successfully changed.'
        }</p>
        <p style="font-size:12px;color:#92400E;background:#FEF3C7;padding:12px;border-radius:8px;">
          ${
            locale === 'hi'
              ? 'यदि आपने यह परिवर्तन नहीं किया था, तो कृपया तुरंत अपना खाता सुरक्षित करने के लिए सहायता टीम से संपर्क करें।'
              : locale === 'gu'
                ? 'જો તમે આ ફેરફાર નથી કર્યો, તો કૃપા કરીને તરત જ અમારો સંપર્ક કરો.'
                : 'If you did not perform this change, please reset your password immediately or contact support.'
          }
        </p>
      `;
      return {
        subject,
        html: wrapLayout({
          title: 'Account Security Notice',
          greeting,
          bodyHtml,
          ctaLabel: locale === 'hi' ? 'साइन इन करें' : locale === 'gu' ? 'સાઇન ઇન કરો' : 'Sign In to Account',
          ctaUrl: data.loginUrl,
          footerNote: footer,
        }),
        text: `${greeting}\n\nYour SmartFarm AI password was successfully changed. If this wasn't you, reset it immediately.`,
      };
    }

    case 'security_login': {
      const subject = 'New Sign-In to Your SmartFarm AI Account';
      const bodyHtml = `
        <p>A sign-in to your SmartFarm AI account was recorded.</p>
        <ul style="padding-left:18px;color:#44403C;">
          <li><strong>Time:</strong> ${escapeHtml(data.loginTime || new Date().toISOString())}</li>
          <li><strong>Source IP:</strong> ${escapeHtml(data.ip || 'Web Browser')}</li>
        </ul>
        <p style="font-size:12px;color:#57534E;">If this was you, no action is needed.</p>
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
        text: `${greeting}\n\nA new sign-in was recorded at ${data.loginTime || ''}.`,
      };
    }

    // -------------------------------------------------------------
    // CROP LIFECYCLE AUTOMATION
    // -------------------------------------------------------------
    case 'crop_cycle_created': {
      const cropName = data.cropName || 'Crop';
      const fieldName = data.fieldName || 'Field';
      const subject =
        locale === 'hi'
          ? `फसल चक्र प्रारंभ: ${cropName} — ${fieldName}`
          : locale === 'gu'
            ? `પાક ચક્ર શરૂ: ${cropName} — ${fieldName}`
            : `Crop Cycle Started: ${cropName} in ${fieldName}`;
      const bodyHtml = `
        <p>${
          locale === 'hi'
            ? `आपके <strong>${escapeHtml(fieldName)}</strong> में <strong>${escapeHtml(cropName)}</strong> का फसल चक्र सफलतापूर्वक शुरू हो गया है।`
            : locale === 'gu'
              ? `તમારા <strong>${escapeHtml(fieldName)}</strong> માં <strong>${escapeHtml(cropName)}</strong> નું પાક ચક્ર સફળતાપૂર્વક શરૂ થઈ ગયું છે.`
              : `A new crop cycle for <strong>${escapeHtml(cropName)}</strong> has started on <strong>${escapeHtml(fieldName)}</strong>.`
        }</p>
        <div style="background:#F4FBF7;border-left:4px solid #2F7D4F;padding:14px 16px;border-radius:8px;margin:16px 0;">
          <div style="font-weight:700;color:#143D2A;">${escapeHtml(cropName)} Lifecycle Plan Activated</div>
          <div style="font-size:12px;color:#57534E;margin-top:4px;">
            ${data.sowingDate ? `Sowing Date: ${escapeHtml(data.sowingDate)}` : ''}
            ${data.totalDurationDays ? ` &bull; Expected Duration: ~${escapeHtml(data.totalDurationDays)} days` : ''}
          </div>
          ${data.initialGuidance ? `<p style="margin:8px 0 0;font-size:13px;color:#292524;">${escapeHtml(data.initialGuidance)}</p>` : ''}
        </div>
        <p style="font-size:13px;color:#44403C;">
          ${
            locale === 'hi'
              ? 'SmartFarm AI आपको बुवाई, प्रारंभिक सिंचाई, पोषक तत्व प्रबंधन और कटाई तक प्रत्येक विकास चरण पर समय पर अनुस्मारक भेजेगा।'
              : locale === 'gu'
                ? 'SmartFarm AI તમને વાવણી, પ્રારંભિક પિયત, પોષક તત્વોનું વ્યવસ્થાપન અને કાપણી સુધી દરેક તબક્કે સમયસર રીમાઇન્ડર્સ મોકલશે.'
                : 'SmartFarm AI will automatically send you timely notifications for every phenological stage from germination to harvest.'
          }
        </p>
      `;
      return {
        subject,
        html: wrapLayout({
          title: `${cropName} — Lifecycle Activated`,
          greeting,
          badge: 'Crop Lifecycle Engine',
          bodyHtml,
          ctaLabel: locale === 'hi' ? 'फसल योजना देखें' : locale === 'gu' ? 'પાક યોજના જુઓ' : 'View Lifecycle Plan',
          ctaUrl: data.actionUrl,
          footerNote: footer,
        }),
        text: `${greeting}\n\n${cropName} cycle started in ${fieldName}.\nPlan: ${data.actionUrl}`,
      };
    }

    case 'crop_stage': {
      const cropName = data.cropName || 'Crop';
      const stageName = data.stageName || 'New Growth Stage';
      const fieldName = data.fieldName || 'Your Field';
      const dasText = data.das != null ? `Day ${data.das} DAS` : '';

      const subject =
        locale === 'hi'
          ? `फसल चरण सूचना: ${cropName} — ${stageName} (${fieldName})`
          : locale === 'gu'
            ? `પાક તબક્કો અપડેટ: ${cropName} — ${stageName} (${fieldName})`
            : `Crop Stage Guidance: ${cropName} entered ${stageName} (${fieldName})`;

      const bodyHtml = `
        <p>${
          locale === 'hi'
            ? `आपके <strong>${escapeHtml(fieldName)}</strong> में <strong>${escapeHtml(cropName)}</strong> अब <strong>${escapeHtml(stageName)}</strong> चरण में प्रवेश कर चुकी है ${dasText ? `(${escapeHtml(dasText)})` : ''}।`
            : locale === 'gu'
              ? `તમારા <strong>${escapeHtml(fieldName)}</strong> માં <strong>${escapeHtml(cropName)}</strong> હવે <strong>${escapeHtml(stageName)}</strong> તબક્કામાં પ્રવેશી ચૂકી છે ${dasText ? `(${escapeHtml(dasText)})` : ''}.`
              : `Your <strong>${escapeHtml(cropName)}</strong> in <strong>${escapeHtml(fieldName)}</strong> has entered the <strong>${escapeHtml(stageName)}</strong> stage ${dasText ? `(${escapeHtml(dasText)})` : ''}.`
        }</p>

        <!-- Recommended Action Card -->
        ${
          data.whatToDo
            ? `<div style="background:#F4FBF7;border-left:4px solid #2F7D4F;padding:14px 16px;border-radius:10px;margin:16px 0;">
                <div style="font-size:12px;font-weight:700;color:#2F7D4F;text-transform:uppercase;letter-spacing:0.5px;">
                  ${locale === 'hi' ? 'अनुशंसित कार्य (Recommended Action)' : locale === 'gu' ? 'ભલામણ કરેલ પગલાં (Action)' : 'Recommended Action'}
                </div>
                <div style="font-size:14px;color:#143D2A;font-weight:600;margin-top:4px;">
                  ${escapeHtml(data.whatToDo)}
                </div>
              </div>`
            : ''
        }

        <!-- Why It Matters -->
        ${
          data.whyImportant
            ? `<div style="margin:12px 0;">
                <strong style="color:#143D2A;">${locale === 'hi' ? 'यह क्यों महत्वपूर्ण है:' : locale === 'gu' ? 'આ શા માટે મહત્વપૂર્ણ છે:' : 'Why this matters:'}</strong>
                <span style="color:#44403C;"> ${escapeHtml(data.whyImportant)}</span>
              </div>`
            : ''
        }

        <!-- How To Do It -->
        ${
          data.howToDo
            ? `<div style="margin:12px 0;">
                <strong style="color:#143D2A;">${locale === 'hi' ? 'कैसे करें (Method):' : locale === 'gu' ? 'કેવી રીતે કરવું:' : 'How to do it:'}</strong>
                <span style="color:#44403C;"> ${escapeHtml(data.howToDo)}</span>
              </div>`
            : ''
        }

        <!-- Precautions & Materials -->
        ${
          data.precautions
            ? `<div style="background:#FFFBEB;border:1px solid #FDE68A;padding:12px 14px;border-radius:8px;margin:14px 0;font-size:13px;color:#92400E;">
                <strong>${locale === 'hi' ? 'सावधानी:' : locale === 'gu' ? 'સાવચેતી:' : 'Precaution:'}</strong> ${escapeHtml(data.precautions)}
              </div>`
            : ''
        }

        ${
          data.materials
            ? `<div style="font-size:12px;color:#57534E;margin-top:8px;">
                <strong>${locale === 'hi' ? 'आवश्यक सामग्री:' : locale === 'gu' ? 'જરૂરી સામગ્રી:' : 'Materials needed:'}</strong> ${escapeHtml(data.materials)}
              </div>`
            : ''
        }
      `;

      return {
        subject,
        html: wrapLayout({
          title: `${cropName} &bull; ${stageName}`,
          greeting,
          badge: dasText || 'Stage Milestone',
          bodyHtml,
          ctaLabel: locale === 'hi' ? 'फसल योजना देखें' : locale === 'gu' ? 'પાક યોજના જુઓ' : 'Open Crop Lifecycle Plan',
          ctaUrl: data.actionUrl,
          footerNote: footer,
        }),
        text: `${greeting}\n\n${cropName} entered ${stageName} in ${fieldName}.\nAction: ${data.whatToDo || ''}\nWhy: ${data.whyImportant || ''}\nOpen: ${data.actionUrl}`,
      };
    }

    case 'task_reminder': {
      const taskTitle = data.title || 'Scheduled Farming Activity';
      const subject =
        locale === 'hi'
          ? `कृषि कार्य अनुस्मारक: ${taskTitle}`
          : locale === 'gu'
            ? `ખેતી કાર્ય રીમાઇન્ડર: ${taskTitle}`
            : `Farming Reminder: ${taskTitle}`;

      const bodyHtml = `
        <p>${
          locale === 'hi'
            ? 'आपके खेत के लिए एक महत्वपूर्ण कृषि कार्य निर्धारित है:'
            : locale === 'gu'
              ? 'તમારા ખેતર માટે એક મહત્વપૂર્ણ કાર્ય નિર્ધારિત છે:'
              : 'You have an upcoming scheduled agricultural activity:'
        }</p>
        <div style="background:#F5F5F4;border-left:4px solid #2F7D4F;padding:14px 16px;border-radius:10px;margin:16px 0;">
          <div style="font-weight:700;color:#143D2A;font-size:15px;">${escapeHtml(taskTitle)}</div>
          ${data.fieldName ? `<div style="font-size:12px;color:#57534E;margin-top:4px;">Field: <strong>${escapeHtml(data.fieldName)}</strong></div>` : ''}
          ${data.dueDate ? `<div style="font-size:12px;color:#57534E;margin-top:2px;">Scheduled Date: <strong>${escapeHtml(data.dueDate)}</strong></div>` : ''}
          ${data.body ? `<p style="margin:10px 0 0;font-size:13px;color:#292524;line-height:1.5;">${escapeHtml(data.body)}</p>` : ''}
        </div>
      `;
      return {
        subject,
        html: wrapLayout({
          title: 'Upcoming Farm Activity',
          greeting,
          bodyHtml,
          ctaLabel: locale === 'hi' ? 'कार्य देखें और पूरा करें' : locale === 'gu' ? 'કાર્ય જુઓ' : 'View & Complete Task',
          ctaUrl: data.actionUrl,
          footerNote: footer,
        }),
        text: `${greeting}\n\nFarming Reminder: ${taskTitle}\nDue: ${data.dueDate || ''}\n${data.body || ''}`,
      };
    }

    case 'task_overdue': {
      const taskTitle = data.title || 'Critical Farming Task';
      const subject = `Urgent: Overdue Farm Activity — ${taskTitle}`;
      const bodyHtml = `
        <div style="background:#FEF2F2;border-left:4px solid #DC2626;padding:14px 16px;border-radius:10px;margin:16px 0;">
          <div style="font-weight:700;color:#991B1B;font-size:15px;">${escapeHtml(taskTitle)} is Pending</div>
          <p style="margin:8px 0 0;font-size:13px;color:#7F1D1D;">
            This critical activity was due on ${escapeHtml(data.dueDate || 'earlier this week')} on ${escapeHtml(data.fieldName || 'your field')}. Timely execution protects crop health and yield.
          </p>
        </div>
      `;
      return {
        subject,
        html: wrapLayout({
          title: 'Overdue Activity Alert',
          greeting,
          bodyHtml,
          ctaLabel: 'Complete Task Now',
          ctaUrl: data.actionUrl,
          footerNote: footer,
        }),
        text: `${greeting}\n\nOverdue task: ${taskTitle}\n${data.actionUrl}`,
      };
    }

    case 'crop_cycle_completed': {
      const cropName = data.cropName || 'Crop';
      const fieldName = data.fieldName || 'Field';
      const subject =
        locale === 'hi'
          ? `कटाई पूर्ण: ${cropName} (${fieldName}) — फसल चक्र समापन`
          : locale === 'gu'
            ? `કાપણી પૂર્ણ: ${cropName} (${fieldName}) — પાક ચક્ર પૂર્ણ`
            : `Harvest Complete: ${cropName} in ${fieldName} — Cycle Summary`;

      const bodyHtml = `
        <p>${
          locale === 'hi'
            ? `बधाई हो! आपके <strong>${escapeHtml(fieldName)}</strong> में <strong>${escapeHtml(cropName)}</strong> का फसल चक्र सफलतापूर्वक पूरा हो गया है।`
            : locale === 'gu'
              ? `અભિનંદન! તમારા <strong>${escapeHtml(fieldName)}</strong> માં <strong>${escapeHtml(cropName)}</strong> નું પાક ચક્ર સફળતાપૂર્વક પૂર્ણ થયું છે.`
              : `Congratulations! The crop cycle for <strong>${escapeHtml(cropName)}</strong> on <strong>${escapeHtml(fieldName)}</strong> has completed.`
        }</p>
        <div style="background:#F4FBF7;border:1px solid #A3D9B5;padding:16px;border-radius:12px;margin:16px 0;">
          <div style="font-weight:700;color:#143D2A;">Post-Harvest &amp; Soil Recovery Recommendations:</div>
          <ul style="padding-left:18px;margin:8px 0 0;font-size:13px;color:#292524;">
            <li>Incorporate crop residues or prepare compost to replenish soil organic matter.</li>
            <li>Take a fresh soil sample for testing before sowing your next rotation crop.</li>
            <li>Inspect APMC mandi modal prices on SmartFarm AI before selling your produce.</li>
          </ul>
        </div>
      `;
      return {
        subject,
        html: wrapLayout({
          title: `${cropName} Harvest Completed`,
          greeting,
          badge: 'Cycle Completed',
          bodyHtml,
          ctaLabel: 'View Harvest Summary',
          ctaUrl: data.actionUrl,
          footerNote: footer,
        }),
        text: `${greeting}\n\n${cropName} harvest completed in ${fieldName}.\nView summary: ${data.actionUrl}`,
      };
    }

    // -------------------------------------------------------------
    // WEATHER, IRRIGATION & PEST ALERTS
    // -------------------------------------------------------------
    case 'weather_alert': {
      const subject = `Weather Alert for ${data.location || 'Your Farm'}: ${data.alertTitle || 'Advisory'}`;
      const bodyHtml = `
        <div style="background:#FEF3C7;border-left:4px solid #D97706;padding:14px 16px;border-radius:10px;">
          <div style="font-weight:700;color:#92400E;font-size:15px;">${escapeHtml(data.alertTitle || 'Weather Advisory')}</div>
          <p style="margin:6px 0 0;color:#78350F;font-size:13px;">${escapeHtml(data.body || 'Check your farm weather forecast before spraying or irrigating.')}</p>
        </div>
      `;
      return {
        subject,
        html: wrapLayout({
          title: 'Farm Weather Advisory',
          greeting,
          bodyHtml,
          ctaLabel: 'View Weather Forecast',
          ctaUrl: data.actionUrl,
          footerNote: footer,
        }),
        text: `${greeting}\n\nWeather Alert (${data.location || 'Farm'}): ${data.alertTitle}\n${data.body || ''}`,
      };
    }

    case 'irrigation_alert': {
      const fieldName = data.fieldName || 'Your Field';
      const subject = `Irrigation Notice: Moisture Deficit Detected on ${fieldName}`;
      const bodyHtml = `
        <div style="background:#EFF6FF;border-left:4px solid #3B82F6;padding:14px 16px;border-radius:10px;">
          <div style="font-weight:700;color:#1E40AF;font-size:15px;">Soil Moisture Deficit Alert</div>
          <p style="margin:6px 0 0;color:#1E3A8A;font-size:13px;">
            ${escapeHtml(data.body || `Soil moisture on ${fieldName} has dropped below the optimal threshold for your active crop growth stage. Plan an irrigation cycle.`)}
          </p>
        </div>
      `;
      return {
        subject,
        html: wrapLayout({
          title: 'Soil Moisture Advisory',
          greeting,
          bodyHtml,
          ctaLabel: 'Check Soil Moisture',
          ctaUrl: data.actionUrl,
          footerNote: footer,
        }),
        text: `${greeting}\n\nIrrigation alert for ${fieldName}: ${data.body || ''}`,
      };
    }

    case 'disease_alert': {
      const subject = `Crop Health Alert: ${data.diseaseName || 'Condition Detected'} (${data.cropName || 'Crop'})`;
      const bodyHtml = `
        <p>A leaf disease screening was recorded for <strong>${escapeHtml(data.cropName || 'your crop')}</strong> on <strong>${escapeHtml(data.fieldName || 'your field')}</strong>.</p>
        <div style="background:#FFFBEB;border-left:4px solid #D97706;padding:14px 16px;border-radius:10px;margin:14px 0;">
          <div style="font-weight:700;color:#92400E;">Detected: ${escapeHtml(data.diseaseName || 'Pest / Disease Condition')}</div>
          ${data.guidance ? `<p style="margin:6px 0 0;color:#78350F;font-size:13px;"><strong>Recommended IPM Action:</strong> ${escapeHtml(data.guidance)}</p>` : ''}
        </div>
        <p style="font-size:12px;color:#57534E;">Always follow certified biological and chemical hierarchies with CIB&amp;RC-registered labels.</p>
      `;
      return {
        subject,
        html: wrapLayout({
          title: 'Crop Disease & IPM Alert',
          greeting,
          bodyHtml,
          ctaLabel: 'View Diagnosis & Medicines',
          ctaUrl: data.actionUrl,
          footerNote: footer,
        }),
        text: `${greeting}\n\nDisease Alert: ${data.diseaseName} on ${data.cropName}.\nAction: ${data.guidance || ''}`,
      };
    }

    // -------------------------------------------------------------
    // STORE & COMMERCE
    // -------------------------------------------------------------
    case 'order_confirmation': {
      const subject = `Order Confirmed: #${data.orderNumber || 'SmartFarm Store'}`;
      const bodyHtml = `
        <p>Thank you for your order with the SmartFarm AI Fertilizer &amp; Agri-Input Cooperative Store.</p>
        <ul style="padding-left:18px;margin:12px 0;">
          <li><strong>Order Number:</strong> #${escapeHtml(data.orderNumber)}</li>
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
        text: `${greeting}\n\nOrder #${data.orderNumber} confirmed. Total: INR ${data.totalAmount}.`,
      };
    }

    case 'order_status': {
      const subject = `Order Update (#${data.orderNumber}): ${data.status}`;
      const bodyHtml = `
        <p>Your SmartFarm AI store order <strong>#${escapeHtml(data.orderNumber)}</strong> status has been updated to <strong style="text-transform:uppercase;">${escapeHtml(data.status)}</strong>.</p>
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
        text: `${greeting}\n\nOrder #${data.orderNumber} status updated to: ${data.status}.`,
      };
    }
  }
}
