import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/core/auth';

/**
 * Simplified Creem checkout route for Animaker video credits
 * This is a dedicated route for Creem payment, separate from ShipAny's generic payment system
 */
export async function GET(request: NextRequest) {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // Check if user is logged in
  if (!session?.user?.id) {
    const loginUrl = new URL('/sign-in', request.url);
    loginUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const searchParams = request.nextUrl.searchParams;
  const productId = searchParams.get('product') || searchParams.get('productId');

  if (!productId) {
    return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
  }

  if (!process.env.CREEM_API_KEY) {
    return NextResponse.json(
      { error: 'Creem API key not configured', detail: 'CREEM_API_KEY environment variable is not set' },
      { status: 500 }
    );
  }

  const appUrl =
    process.env.AUTH_URL ||
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    request.nextUrl.origin;

  try {
    // Call Creem API to create checkout session
    const response = await fetch('https://api.creem.io/v1/checkouts', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.CREEM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: productId,
        // Creem: only one of customer.id or customer.email, not both
        customer: {
          email: session.user.email,
        },
        metadata: {
          referenceId: session.user.id,
        },
        success_url: `${appUrl}/dashboard?payment=success`,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error('[Creem Checkout] API error:', data);
      return NextResponse.json(
        { error: data.error?.message || 'Failed to create checkout', detail: data },
        { status: response.status }
      );
    }

    return NextResponse.redirect(data.checkout_url);
  } catch (error) {
    console.error('[Creem Checkout] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', detail: String(error) },
      { status: 500 }
    );
  }
}
