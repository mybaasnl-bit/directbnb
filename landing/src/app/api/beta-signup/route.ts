import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3001';

interface SignupPayload {
  name: string;
  email: string;
  bnbName: string;
  location: string;
  website?: string;
  language?: 'nl' | 'en';
}

export async function POST(request: NextRequest) {
  try {
    const body: SignupPayload = await request.json();

    // Basic validation before hitting the backend
    if (!body.name || !body.email || !body.bnbName || !body.location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Forward to NestJS backend — handles DB storage + email sending
    const response = await fetch(`${BACKEND_URL}/api/v1/beta-signups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: body.name,
        email: body.email,
        bnbName: body.bnbName,
        location: body.location,
        website: body.website,
        language: body.language ?? 'nl',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Pass through conflict (duplicate email) or other backend errors
      const status = response.status === 409 ? 409 : 500;
      const message =
        response.status === 409
          ? 'Dit e-mailadres is al aangemeld voor de beta.'
          : 'Er is een fout opgetreden. Probeer het later opnieuw.';
      return NextResponse.json({ error: message }, { status });
    }

    console.log(`[Beta Signup] ${body.name} <${body.email}> — ${body.bnbName}, ${body.location}`);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('[Beta Signup] Error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden. Probeer het later opnieuw.' },
      { status: 500 },
    );
  }
}

// Keep GET for backwards compat — now proxies to backend
export async function GET() {
  try {
    // This endpoint requires admin auth in production;
    // for now just return a message directing to the backend
    return NextResponse.json({
      message: 'Beta signups are stored in the database. Use the admin dashboard to view them.',
      adminEndpoint: `${BACKEND_URL}/api/v1/beta-signups`,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
