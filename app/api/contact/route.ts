import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { loadSiteInfo } from '@/lib/content';
import { getDefaultSite, getSiteByHost } from '@/lib/sites';
import type { Locale, SiteInfo } from '@/lib/types';

const resend = new Resend(process.env.RESEND_API_KEY);

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  reason: string;
  message: string;
  locale?: string;
}

interface ContactEmailContext {
  locale: Locale;
  clinicName: string;
  phone: string;
  addressLine: string;
}

function toLocale(rawLocale: unknown): Locale {
  return rawLocale === 'zh' ? 'zh' : 'en';
}

async function resolveRequestSiteInfo(request: NextRequest, locale: Locale): Promise<SiteInfo | null> {
  const host = request.headers.get('host');
  const site = (await getSiteByHost(host)) || (await getDefaultSite());
  if (!site) return null;
  return loadSiteInfo(site.id, locale) as Promise<SiteInfo | null>;
}

function getReasonLabel(reason: string): string {
  return reason?.trim() || 'General inquiry';
}

function getAddressLine(siteInfo: SiteInfo | null): string {
  if (!siteInfo) return '';
  return [siteInfo.address, siteInfo.city, siteInfo.state, siteInfo.zip].filter(Boolean).join(', ');
}

function createEmailHTML(data: ContactFormData, context: ContactEmailContext): string {
  const { name, email, phone, reason, message } = data;
  const { clinicName, locale } = context;
  const reasonLabel = getReasonLabel(reason);
  const timestamp = new Date().toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', { 
    timeZone: 'America/New_York',
    dateStyle: 'full',
    timeStyle: 'short'
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Form Submission</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; color: #111827;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 32px 32px 24px; background: linear-gradient(135deg, #059669 0%, #047857 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">📧 New Contact Form Submission</h1>
                    <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">${clinicName} Website</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 32px;">
                    <div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
                      <p style="margin: 0; color: #065f46; font-weight: 600; font-size: 14px;">⚡ Action Required: New customer inquiry</p>
                    </div>

                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                          <strong style="color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Reason for Contact</strong>
                          <p style="margin: 4px 0 0; color: #111827; font-size: 16px; font-weight: 600;">${reasonLabel}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                          <strong style="color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Name</strong>
                          <p style="margin: 4px 0 0; color: #111827; font-size: 16px;">${name}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                          <strong style="color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Email</strong>
                          <p style="margin: 4px 0 0;">
                            <a href="mailto:${email}" style="color: #059669; text-decoration: none; font-size: 16px;">${email}</a>
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                          <strong style="color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Phone</strong>
                          <p style="margin: 4px 0 0;">
                            <a href="tel:${phone.replace(/\D/g, '')}" style="color: #059669; text-decoration: none; font-size: 16px;">${phone}</a>
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <strong style="color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Message</strong>
                          <div style="margin: 8px 0 0; padding: 16px; background-color: #f9fafb; border-radius: 6px; color: #111827; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</div>
                        </td>
                      </tr>
                    </table>

                    <div style="margin-top: 24px; padding: 16px; background-color: #f9fafb; border-radius: 6px;">
                      <p style="margin: 0; color: #6b7280; font-size: 13px;">
                        <strong>Submitted:</strong> ${timestamp} (EST)
                      </p>
                    </div>

                    <!-- Action Button -->
                    <div style="margin-top: 32px; text-align: center;">
                      <a href="mailto:${email}?subject=Re: ${reasonLabel}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Reply to Customer</a>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 32px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
                      This email was sent from the ${clinicName} contact form.<br>
                      <strong>Remember:</strong> Respond quickly for best patient experience.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function createAutoReplyHTML(name: string, context: ContactEmailContext): string {
  const { clinicName, phone, addressLine } = context;
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank You for Contacting ${clinicName}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; color: #111827;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 32px; text-align: center; background: linear-gradient(135deg, #059669 0%, #047857 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Thank You!</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 32px;">
                    <p style="margin: 0 0 16px; color: #111827; font-size: 16px; line-height: 1.6;">Dear ${name},</p>
                    
                    <p style="margin: 0 0 16px; color: #111827; font-size: 16px; line-height: 1.6;">
                      Thank you for contacting <strong>${clinicName}</strong>. We've received your message and will respond shortly.
                    </p>

                    <div style="margin: 24px 0; padding: 20px; background-color: #f0fdf4; border-left: 4px solid #059669; border-radius: 4px;">
                      <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.6;">
                        <strong>🕐 Need immediate assistance?</strong><br>
                        Call us at <a href="tel:${phone.replace(/\D/g, '')}" style="color: #059669; text-decoration: none; font-weight: 600;">${phone}</a><br>
                        <span style="color: #6b7280; font-size: 13px;">Mon-Fri: 8am-8pm | Sat-Sun: 9am-6pm</span>
                      </p>
                    </div>

                    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      We look forward to supporting your health and wellness journey.
                    </p>

                    <p style="margin: 16px 0 0; color: #111827; font-size: 16px;">
                      <strong>${clinicName} Support Team</strong><br>
                      <span style="color: #6b7280; font-size: 14px;">Traditional Chinese Medicine & Patient Care</span>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 32px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="text-align: center; padding-bottom: 16px;">
                          <p style="margin: 0; color: #111827; font-size: 14px; font-weight: 600;">${clinicName}</p>
                          <p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">Traditional Chinese Medicine & Acupuncture</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="text-align: center; color: #6b7280; font-size: 12px; line-height: 1.5;">
                          ${addressLine ? `📍 ${addressLine}<br>` : ''}📞 ${phone}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, reason, message, locale: rawLocale } = body as ContactFormData;
    const locale = toLocale(rawLocale);
    const siteInfo = await resolveRequestSiteInfo(request, locale);
    const clinicName = siteInfo?.businessName || siteInfo?.clinicName || 'Business';
    const clinicPhone = siteInfo?.phone || process.env.CONTACT_PHONE_FALLBACK || '(845) 381-1106';
    const clinicEmail = siteInfo?.email || process.env.CONTACT_FALLBACK_TO || 'support@baamplatform.com';
    const context: ContactEmailContext = {
      locale,
      clinicName,
      phone: clinicPhone,
      addressLine: getAddressLine(siteInfo),
    };

    // Validate required fields
    if (!name || !email || !phone || !reason || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate phone (basic)
    if (phone.replace(/\D/g, '').length < 10) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    // Prepare email data
    const reasonLabel = getReasonLabel(reason);
    const emailHTML = createEmailHTML({ name, email, phone, reason, message, locale }, context);
    const autoReplyHTML = createAutoReplyHTML(name, context);

    // Send notification email to clinic
    const notificationEmail = await resend.emails.send({
      from: process.env.RESEND_FROM || 'No-Reply<no-reply@baamplatform.com>',
      to: process.env.CONTACT_FALLBACK_TO || clinicEmail,
      cc: process.env.ALERT_TO ? [process.env.ALERT_TO] : undefined,
      reply_to: email,
      subject: `🌿 New Contact: ${reasonLabel} - ${name}`,
      html: emailHTML,
    });

    // Send auto-reply to patient
    const autoReplyEmail = await resend.emails.send({
      from: process.env.RESEND_FROM || 'No-Reply<no-reply@baamplatform.com>',
      to: email,
      subject: locale === 'zh' ? `感谢联系${clinicName}` : `Thank you for contacting ${clinicName}`,
      html: autoReplyHTML,
    });

    console.log('Emails sent successfully:', {
      notification: notificationEmail.data?.id,
      autoReply: autoReplyEmail.data?.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { 
        success: true, 
        message: locale === 'zh'
          ? '您的消息已发送成功。我们的团队将尽快与您联系，并请留意邮箱确认邮件。'
          : 'Your message has been sent successfully. Our team will contact you soon. Please check your email for confirmation.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    
    // Return user-friendly error
    return NextResponse.json(
      { 
        error: 'An error occurred while sending your message. Please try calling us directly.',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

// Optional: Add rate limiting in production
// You could use packages like 'rate-limiter-flexible' or Upstash Redis
