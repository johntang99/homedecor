import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FALLBACK_EMAIL = process.env.CONTACT_FALLBACK_TO || 'support@baamplatform.com';

interface ConsultationPayload {
  name?: string;
  email?: string;
  phone?: string;
  projectType?: string;
  scope?: string;
  budget?: string;
  location?: string;
  referral?: string;
  preferredLanguage?: string;
  message?: string;
  siteId?: string;
  locale?: string;
  type?: string;
  // legacy fields
  reason?: string;
}

async function saveToSupabase(payload: ConsultationPayload) {
  if (!SUPABASE_URL || !SERVICE_KEY) return;
  await fetch(`${SUPABASE_URL}/rest/v1/consultation_requests`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      site_id: payload.siteId || 'julia-studio',
      name: payload.name || '',
      email: payload.email || '',
      phone: payload.phone || '',
      project_type: payload.projectType || payload.reason || '',
      scope: payload.scope || '',
      budget: payload.budget || '',
      location: payload.location || '',
      referral: payload.referral || '',
      preferred_language: payload.preferredLanguage || payload.locale || 'en',
      message: payload.message || '',
      status: 'new',
    }),
  });
}

function buildEmailHtml(payload: ConsultationPayload): string {
  const isCn = payload.locale === 'zh';
  const rows = [
    ['Name', payload.name],
    ['Email', payload.email],
    ['Phone', payload.phone],
    ['Project Type', payload.projectType],
    ['Scope', payload.scope],
    ['Budget', payload.budget],
    ['Location', payload.location],
    ['Preferred Language', payload.preferredLanguage],
    ['How they found us', payload.referral],
    ['Message', payload.message],
  ].filter(([, v]) => v).map(([k, v]) => `<tr><td style="padding:6px 12px;background:#f9f6f2;color:#6B6B6B;font-size:12px;width:140px">${k}</td><td style="padding:6px 12px;color:#2C2C2C;font-size:14px">${v}</td></tr>`).join('');

  return `<!DOCTYPE html><html><body style="font-family:'Georgia',serif;background:#FAF8F5;margin:0;padding:20px">
  <div style="max-width:580px;margin:0 auto;background:#fff;border:1px solid #E5E2DD">
    <div style="background:#2C2C2C;padding:24px 32px">
      <p style="color:#C4A265;font-size:11px;letter-spacing:3px;margin:0">JULIA STUDIO</p>
      <p style="color:#fff;font-size:22px;margin:8px 0 0;font-family:'Georgia',serif">New Consultation Request</p>
    </div>
    <table style="width:100%;border-collapse:collapse;margin:0">${rows}</table>
    <div style="padding:16px 32px;border-top:1px solid #E5E2DD">
      <p style="color:#6B6B6B;font-size:12px;margin:0">Julia Studio Admin — Reply directly to ${payload.email}</p>
    </div>
  </div></body></html>`;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json() as ConsultationPayload;

    if (!payload.name || !payload.email) {
      return NextResponse.json({ message: 'Name and email are required' }, { status: 400 });
    }

    // Save to Supabase (non-blocking on failure)
    await saveToSupabase(payload).catch(console.error);

    // Send email notification
    if (!resend) {
      console.warn('RESEND_API_KEY not configured — skipping email notification');
    } else {
      const from = process.env.RESEND_FROM || 'no-reply@baamplatform.com';
      await resend.emails.send({
        from,
        to: [FALLBACK_EMAIL],
        reply_to: payload.email,
        subject: `New Consultation Request — ${payload.name}`,
        html: buildEmailHtml(payload),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Contact route error:', error);
    return NextResponse.json({ message: 'Internal error' }, { status: 500 });
  }
}
