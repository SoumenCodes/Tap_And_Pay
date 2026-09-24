import { config } from '../constants/config';
import type { PaymentMethodType } from '../utils/feeCalculator';

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status?: string;
  charges?: any[];
}

let cachedLocationId: string | null = null;

export function getCachedLocationId(): string | null {
  return cachedLocationId;
}

/**
 * Fetch a connection token from the backend for Stripe Terminal SDK initialization
 */
export async function fetchConnectionToken(): Promise<string> {
  const url = `${config.backendUrl}/connection_token`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to fetch connection token (${res.status}): ${errText}`);
    }

    const data = await res.json();
    if (!data.secret) {
      throw new Error('Connection token response did not contain a secret');
    }
    if (data.locationId) {
      cachedLocationId = data.locationId;
    }
    return data.secret;
  } catch (err: any) {
    console.error('Error fetching connection token from backend:', err);
    throw err;
  }
}

/**
 * Fetch Terminal config including location ID from backend
 */
export async function fetchTerminalConfig(): Promise<{ locationId: string; stripeConfigured: boolean }> {
  try {
    const res = await fetch(`${config.backendUrl}/terminal_config`);
    if (res.ok) {
      const data = await res.json();
      if (data.locationId) {
        cachedLocationId = data.locationId;
      }
      return data;
    }
    return { locationId: 'loc_simulated', stripeConfigured: false };
  } catch {
    return { locationId: 'loc_simulated', stripeConfigured: false };
  }
}

/**
 * Create a Stripe PaymentIntent on the backend for card_present (Tap to Pay) or card
 */
export async function createPaymentIntentOnBackend(
  amount: number,
  currency: string = 'aud',
  paymentMethodType: PaymentMethodType = 'tap'
): Promise<CreatePaymentIntentResponse> {
  const url = `${config.backendUrl}/create_payment_intent`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        currency,
        paymentMethodType,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to create payment intent (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('Error creating payment intent on backend:', err);
    throw err;
  }
}

/**
 * Verify backend health
 */
export async function checkBackendHealth(): Promise<{ status: string; stripeConfigured: boolean }> {
  try {
    const res = await fetch(`${config.backendUrl}/health`);
    return await res.json();
  } catch {
    return { status: 'unreachable', stripeConfigured: false };
  }
}
