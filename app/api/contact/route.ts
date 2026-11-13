// Contact page enquiries are appended to the "TUKlogic Enquiry form" Google Sheet through a
// Google Apps Script web app bound to that sheet (source: scripts/google-sheet-enquiry.gs).
// The web app URL can be overridden with the GOOGLE_SHEET_WEBHOOK_URL environment variable.
const SHEET_WEBHOOK_URL = process.env.GOOGLE_SHEET_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbzSDbRmUzdczQrG8PZbBdhPzFPb0kNAQKD35I3K_AR9uqULJORy3GpCnlHBlIy4EV_Yrg/exec';

const SERVICES: Record<string, string> = {
  'web-mobile-game-development': 'Web, Mobile & Game Development',
  'generative-ai': 'Generative AI Solutions',
  'computer-vision': 'Computer Vision Solutions',
  nlp: 'Natural Language Processing (NLP)',
  'ai-solutions': 'Artificial Intelligence (AI) Solutions',
  iot: 'Internet of Things (IoT) Solutions',
  cloud: 'Cloud Solutions',
  crm: 'CRM Solution',
  servicenow: 'ServiceNow Solutions',
  'digital-marketing': 'Digital Marketing',
};

const field = (body: Record<string, unknown>, key: string, max: number) =>
  typeof body[key] === 'string' ? (body[key] as string).trim().slice(0, max) : '';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }

  const service = field(body, 'service-you-re-interested-in', 100);
  const row = {
    service: SERVICES[service] || service,
    name: field(body, 'your-name', 100),
    email: field(body, 'your-email', 200),
    phone: field(body, 'your-phone', 30),
    company: field(body, 'your-company', 100),
    summary: field(body, 'your-project-summary', 2000),
    locale: field(body, 'locale', 5),
  };

  if (!row.service || row.name.length < 3 || !/^\S+@\S+\.\S+$/.test(row.email) || row.phone.length < 7 || row.company.length < 3 || row.summary.length < 20) {
    return Response.json({ success: false, error: 'Missing or invalid fields' }, { status: 400 });
  }
  if (!SHEET_WEBHOOK_URL) {
    console.error('contact: GOOGLE_SHEET_WEBHOOK_URL is not set');
    return Response.json({ success: false, error: 'Enquiries are not configured' }, { status: 503 });
  }

  try {
    // Apps Script answers a POST with a redirect to the script's output; fetch follows it.
    const res = await fetch(SHEET_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(row),
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();
    let result: { success?: boolean } = {};
    try {
      result = JSON.parse(text);
    } catch {}
    if (!res.ok || !result.success) {
      console.error('contact: sheet webhook failed', res.status, text.slice(0, 300));
      return Response.json({ success: false }, { status: 502 });
    }
    return Response.json({ success: true });
  } catch (error) {
    console.error('contact: sheet webhook error', error);
    return Response.json({ success: false }, { status: 502 });
  }
}
