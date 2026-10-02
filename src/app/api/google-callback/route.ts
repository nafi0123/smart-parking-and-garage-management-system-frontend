import { type NextRequest, NextResponse } from 'next/server';

// Google sends credential as POST to this endpoint when using ux_mode='redirect'
export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    const credential = body.get('credential') as string | null;

    if (!credential) {
      return NextResponse.redirect(new URL('/login?error=no_credential', request.url));
    }

    // Redirect to login page with credential as query param
    const url = new URL('/login', request.url);
    url.searchParams.set('credential', credential);
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.redirect(new URL('/login?error=google_failed', request.url));
  }
}

// Handle GET too (in case of redirect with params)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const credential = searchParams.get('credential');

  if (credential) {
    const url = new URL('/login', request.url);
    url.searchParams.set('credential', credential);
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(new URL('/login', request.url));
}
