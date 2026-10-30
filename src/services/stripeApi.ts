import { config } from '../constants/config';
import { apiClient } from './apiClient';
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
 * Live endpoint: POST /api/connection_token (requires Bearer token)
 */
export async function fetchConnectionToken(): Promise<string> {
  try {
    let data: any;
    try {
      const res = await apiClient.post('/api/connection_token');
      data = res.data;
    } catch (err: any) {
      if (err?.status === 404) {
        const res = await apiClient.post('/connection_token');
        data = res.data;
      } else {
        throw err;
      }
    }

    const secret = data?.secret || data?.data?.secret;
    const locationId = data?.locationId || data?.data?.locationId;

    if (!secret) {
      throw new Error('Connection token response did not contain a secret');
    }
    if (locationId) {
      cachedLocationId = locationId;
    }
    return secret;
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
  if (cachedLocationId && cachedPublishableKey) {
    return {
      locationId: cachedLocationId,
      publishableKey: cachedPublishableKey,
      stripeConfigured: true,
    };
  }

  try {
    let res: any;
    try {
      res = await apiClient.get('/api/terminal_config');
    } catch (err: any) {
      if (err?.status === 404) {
        res = await apiClient.get('/terminal_config');
      } else {
        throw err;
      }
    }

    const data = res.data?.data || res.data;
    if (data?.locationId) {
      cachedLocationId = data.locationId;
    }
    if (data?.publishableKey) {
      cachedPublishableKey = data.publishableKey;
    }
    return data;
  } catch {
    return {
      locationId: cachedLocationId || config.locationId || 'loc_simulated',
      stripeConfigured: false,
    };
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
 * Live endpoint: POST /api/payment/create-intent (requires Bearer token)
 */
export async function createPaymentIntentOnBackend(
  amount: number,
  currency: string = 'aud',
  paymentMethodType: PaymentMethodType = 'tap',
  card?: { number: string; expMonth: string | number; expYear: string | number; cvc: string },
  paymentMethodId?: string
): Promise<CreatePaymentIntentResponse> {
  const formattedCard = card
    ? {
        number: String(card.number).replace(/\s/g, ''),
        expMonth: typeof card.expMonth === 'number' ? card.expMonth : parseInt(String(card.expMonth), 10),
        expYear: typeof card.expYear === 'number' ? card.expYear : parseInt(String(card.expYear), 10),
        cvc: String(card.cvc).trim(),
      }
    : undefined;

  const payload = {
    amount,
    currency,
    paymentMethodType,
    paymentMethodId,
    card: formattedCard,
  };

  try {
    let res: any;
    try {
      res = await apiClient.post('/api/payment/create-intent', payload);
    } catch (err: any) {
      if (err?.status === 404) {
        try {
          res = await apiClient.post('/api/create_payment_intent', payload);
        } catch (innerErr: any) {
          if (innerErr?.status === 404) {
            res = await apiClient.post('/create_payment_intent', payload);
          } else {
            throw innerErr;
          }
        }
      } else {
        throw err;
      }
    }

    const data = res.data?.data || res.data;
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
    let res: any;
    try {
      res = await apiClient.get('/api/health');
    } catch (err: any) {
      if (err?.status === 404) {
        res = await apiClient.get('/health');
      } else {
        throw err;
      }
    }
    return res.data?.data || res.data;
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
  try {
    let res: any;
    try {
      res = await apiClient.get(`/api/payment_intent/${paymentIntentId}`);
    } catch (err: any) {
      if (err?.status === 404) {
        res = await apiClient.get(`/payment_intent/${paymentIntentId}`);
      } else {
        throw err;
      }
    }
    return res.data?.data || res.data;
  } catch (err: any) {
    console.error(`Error checking payment intent status for ${paymentIntentId}:`, err);
    throw err;
  }
}
