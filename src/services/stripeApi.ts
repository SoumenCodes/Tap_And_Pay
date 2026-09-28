import { config } from '../constants/config';
import type { PaymentMethodType } from '../utils/feeCalculator';

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  amountInDollars?: number;
  formattedAmount?: string;
  currency: string;
  status?: string;
  charges?: any[];
  requiresAction?: boolean;
  redirectUrl?: string;
  returnUrl?: string;
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

let cachedPublishableKey: string | null = null;

export function getCachedPublishableKey(): string | null {
  return cachedPublishableKey || config.publishableKey || null;
}

/**
 * Fetch Terminal config including location ID and publishable key from backend
 */
export async function fetchTerminalConfig(): Promise<{
  locationId: string;
  publishableKey?: string;
  stripeConfigured: boolean;
}> {
  try {
    const res = await fetch(`${config.backendUrl}/terminal_config`);
    if (res.ok) {
      const data = await res.json();
      if (data.locationId) {
        cachedLocationId = data.locationId;
      }
      if (data.publishableKey) {
        cachedPublishableKey = data.publishableKey;
      }
      return data;
    }
    return { locationId: 'loc_simulated', stripeConfigured: false };
  } catch {
    return { locationId: 'loc_simulated', stripeConfigured: false };
  }
}

/**
 * Tokenize card details directly with Stripe using the Publishable Key.
 * Permitted by Stripe because "Enable card data collection with a publishable key" is enabled.
 */
export async function tokenizeCardWithStripe(
  card: { number: string; expMonth: string; expYear: string; cvc: string },
  publishableKey?: string
): Promise<{ id: string; brand: string; last4: string }> {
  let pk = publishableKey || getCachedPublishableKey();
  if (!pk) {
    const termConfig = await fetchTerminalConfig();
    pk = termConfig.publishableKey || getCachedPublishableKey();
  }

  if (!pk) {
    throw new Error(
      'Stripe Publishable Key not found. Please ensure STRIPE_PUBLISHABLE_KEY is configured on Render.'
    );
  }

  const params = new URLSearchParams();
  params.append('type', 'card');
  params.append('card[number]', card.number.replace(/\s/g, ''));
  params.append('card[exp_month]', String(parseInt(card.expMonth, 10)));
  params.append('card[exp_year]', String(parseInt(card.expYear, 10)));
  params.append('card[cvc]', card.cvc.trim());

  console.log('💳 [STRIPE CLIENT TOKENIZE] Tokenizing card directly with Stripe using publishable key...');
  const res = await fetch('https://api.stripe.com/v1/payment_methods', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${pk}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('❌ [STRIPE CLIENT TOKENIZE ERROR]:', data);
    throw new Error(data.error?.message || 'Failed to tokenize card with Stripe');
  }

  console.log('✅ [STRIPE CLIENT TOKENIZE SUCCESS] Created PaymentMethod:', data.id);
  return {
    id: data.id,
    brand: data.card?.brand ? data.card.brand.charAt(0).toUpperCase() + data.card.brand.slice(1) : 'Card',
    last4: data.card?.last4 || card.number.slice(-4),
  };
}

/**
 * Create a Stripe PaymentIntent on the backend for card_present (Tap to Pay) or card
 */
export async function createPaymentIntentOnBackend(
  amount: number,
  currency: string = 'aud',
  paymentMethodType: PaymentMethodType = 'tap',
  card?: { number: string; expMonth: string; expYear: string; cvc: string },
  paymentMethodId?: string
): Promise<CreatePaymentIntentResponse> {
  const url = `${config.backendUrl}/create_payment_intent`;
  try {
    const maskedBody = {
      amount,
      currency,
      paymentMethodType,
      paymentMethodId,
      card: card ? { ...card, number: `•••• ${card.number.slice(-4)}`, cvc: '•••' } : undefined,
    };
    console.log(`📡 [API POST ${url}] Request:`, JSON.stringify(maskedBody, null, 2));

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        currency,
        paymentMethodType,
        paymentMethodId,
        card,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      let parsedMessage = errText;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error) {
          parsedMessage = parsed.error;
        }
      } catch {
        // use raw text
      }
      console.error(`❌ [API POST ${url}] Error (${res.status}):`, parsedMessage);
      throw new Error(parsedMessage);
    }

    const data = await res.json();
    console.log(`✅ [API POST ${url}] Response from backend:`, JSON.stringify(data, null, 2));
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

/**
 * Retrieve PaymentIntent status by ID (used to check status after 3D Secure verification)
 */
export async function retrievePaymentIntentStatus(paymentIntentId: string): Promise<{
  id: string;
  status: string;
  amount: number;
  amountInDollars?: number;
  formattedAmount?: string;
  currency: string;
  charges?: any[];
}> {
  const url = `${config.backendUrl}/payment_intent/${paymentIntentId}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to check payment status (${res.status})`);
    }
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error(`Error checking payment intent status for ${paymentIntentId}:`, err);
    throw err;
  }
}
