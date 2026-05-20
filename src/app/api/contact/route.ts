import { NextRequest, NextResponse } from 'next/server';

const rateLimitMap = new Map<string, number[]>();
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    return true;
  }

  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

function sanitize(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[<>]/g, '');
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const name = sanitize(body.name);
  const email = sanitize(body.email);
  const message = sanitize(body.message);

  if (!name || name.length < 2 || name.length > 100) {
    return NextResponse.json({ error: 'Name must be between 2 and 100 characters' }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }
  if (!message || message.length < 10 || message.length > 5000) {
    return NextResponse.json({ error: 'Message must be between 10 and 5000 characters' }, { status: 400 });
  }

  // Log contact submission (replace with email service in production)
  console.log('[CONTACT]', JSON.stringify({ name, email, messageLength: message.length, ip, timestamp: new Date().toISOString() }));

  // TODO: Integrate with email service (SendGrid, Resend, AWS SES)
  // Example with Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'PacTrack <noreply@pactrack.pl>',
  //   to: process.env.CONTACT_EMAIL || 'kontakt@pactrack.pl',
  //   subject: `[PacTrack Contact] from ${name}`,
  //   text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
  // });

  return NextResponse.json({ success: true });
}
