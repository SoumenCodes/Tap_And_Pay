require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const app = express();
const port = process.env.PORT || 3001;

// Initialize Stripe with secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.warn('⚠️ WARNING: STRIPE_SECRET_KEY is not set in server/.env. Please add your sk_test_... key.');
}
const stripe = stripeSecretKey ? Stripe(stripeSecretKey) : null;

app.use(cors());
app.use(express.json());

// Helper to resolve or create a Stripe Terminal Location
async function getOrCreateLocation() {
  if (process.env.STRIPE_LOCATION_ID && !process.env.STRIPE_LOCATION_ID.includes('placeholder')) {
    return process.env.STRIPE_LOCATION_ID;
  }
  if (!stripe) return null;

  try {
    const locations = await stripe.terminal.locations.list({ limit: 1 });
    if (locations.data && locations.data.length > 0) {
      return locations.data[0].id;
    }

    // Attempt creating a test location in Australia (for AUD)
    try {
      const newLoc = await stripe.terminal.locations.create({
        display_name: 'Demo Tap to Pay Store',
        address: {
          line1: '100 George Street',
          city: 'Sydney',
          state: 'NSW',
          country: 'AU',
          postal_code: '2000',
        },
      });
      console.log('📍 Created default AU Stripe Terminal location:', newLoc.id);
      return newLoc.id;
    } catch {
      // Fallback for US accounts
      const newLoc = await stripe.terminal.locations.create({
        display_name: 'Demo Tap to Pay Store',
        address: {
          line1: '123 Market Street',
          city: 'San Francisco',
          state: 'CA',
          country: 'US',
          postal_code: '94103',
        },
      });
      console.log('📍 Created fallback US Stripe Terminal location:', newLoc.id);
      return newLoc.id;
    }
  } catch (err) {
    console.warn('⚠️ Could not resolve Terminal location:', err.message);
    return null;
  }
}

// 1. Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    stripeConfigured: Boolean(stripeSecretKey && !stripeSecretKey.includes('placeholder')),
    livemode: Boolean(stripeSecretKey && stripeSecretKey.startsWith('sk_live_')),
    mode: stripeSecretKey?.startsWith('sk_live_') ? 'live' : 'test',
    timestamp: new Date().toISOString(),
  });
});

// 2. Terminal Config (retrieves default location ID and publishable key)
app.get('/terminal_config', async (req, res) => {
  try {
    const locationId = await getOrCreateLocation();
    res.json({
      locationId: locationId || 'loc_simulated',
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      stripeConfigured: Boolean(stripeSecretKey && !stripeSecretKey.includes('placeholder')),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Create Connection Token for Stripe Terminal
app.post('/connection_token', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'STRIPE_SECRET_KEY is not configured in server/.env' });
    }
    const locationId = await getOrCreateLocation();
    const tokenParams = locationId ? { location: locationId } : {};
    const token = await stripe.terminal.connectionTokens.create(tokenParams);
    res.json({ secret: token.secret, locationId });
  } catch (err) {
    console.error('Error creating connection token:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Create PaymentIntent
app.post('/create_payment_intent', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'STRIPE_SECRET_KEY is not configured in server/.env' });
    }

    const { amount, currency = 'aud', paymentMethodType = 'tap' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount provided' });
    }

    // Amount in cents/subunits (e.g., $101.80 -> 10180 cents)
    const amountInCents = Math.round(Number(amount) * 100);

    // Normalize currency (e.g. 'aud')
    const normalizedCurrency = currency.toLowerCase().replace(/[^a-z]/g, '') || 'aud';

    if (paymentMethodType === 'card') {
      let paymentMethodId = req.body.paymentMethodId;

      // If client didn't tokenize, try creating from raw cardInput
      if (!paymentMethodId) {
        const cardInput = req.body.card;
        if (!cardInput || !cardInput.number) {
          return res.status(400).json({ error: 'Payment method or card details are required.' });
        }

        try {
          const pm = await stripe.paymentMethods.create({
            type: 'card',
            card: {
              number: cardInput.number.replace(/\s/g, ''),
              exp_month: parseInt(cardInput.expMonth, 10),
              exp_year: parseInt(cardInput.expYear, 10),
              cvc: String(cardInput.cvc || '').trim(),
            },
          });
          paymentMethodId = pm.id;
        } catch (pmErr) {
          console.error('❌ Failed to create Stripe PaymentMethod on backend:', pmErr.message);
          return res.status(400).json({
            error: `Stripe card validation error: ${pmErr.message}`,
          });
        }
      }

      let paymentIntent;
      const returnUrl = process.env.RETURN_URL || 'https://tap-and-pay.onrender.com/return';
      try {
        paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: normalizedCurrency,
          payment_method: paymentMethodId,
          confirm: true,
          return_url: returnUrl,
          description: 'TapToPay - Manual Card Entry',
        });
      } catch (confirmErr) {
        console.error('❌ Failed to confirm Stripe charge:', confirmErr.message);
        return res.status(400).json({
          error: `Stripe charge declined or failed: ${confirmErr.message}`,
        });
      }

      // Check if 3D Secure (Bank OTP) is required
      if (paymentIntent.status === 'requires_action') {
        const redirectUrl = paymentIntent.next_action?.redirect_to_url?.url;
        console.log(`🔐 3D Secure verification required for PaymentIntent ${paymentIntent.id}. Redirect URL:`, redirectUrl);
        return res.json({
          requiresAction: true,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          amountInDollars: Number((paymentIntent.amount / 100).toFixed(2)),
          formattedAmount: `$${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}`,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          redirectUrl,
          returnUrl,
        });
      }

      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({
          error: `Payment incomplete (Status: "${paymentIntent.status}"). The card was not billed.`,
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
        });
      }

      return res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount, // Stripe integer cents (e.g. 132 cents)
        amountInDollars: Number((paymentIntent.amount / 100).toFixed(2)), // Decimal dollars (e.g. 1.32)
        formattedAmount: `$${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}`,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        charges: paymentIntent.charges?.data || [],
      });
    }

    // Terminal Tap to Pay: Try 'card_present', and if region (e.g. IN) restricts it, fallback to 'card'
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: normalizedCurrency,
        payment_method_types: ['card_present'],
        capture_method: 'automatic',
        description: 'TapToPay Demo Payment - TAP TO PAY',
      });
    } catch (tapErr) {
      if (tapErr.message && (tapErr.message.includes('card_present') || tapErr.message.includes('not supported in'))) {
        console.warn(`⚠️ Account region does not support native 'card_present'. Fallback to 'card' payment intent: ${tapErr.message}`);
        paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: normalizedCurrency,
          payment_method_types: ['card'],
          description: 'TapToPay Demo Payment - TAP TO PAY (Simulated for IN)',
        });
      } else {
        throw tapErr;
      }
    }

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      amountInDollars: Number((paymentIntent.amount / 100).toFixed(2)),
      formattedAmount: `$${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}`,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    });
  } catch (err) {
    console.error('Error creating payment intent:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Payment Intent Status Check (used to verify status after 3D Secure OTP completion)
app.get('/payment_intent/:id', async (req, res) => {
  try {
    const pi = await stripe.paymentIntents.retrieve(req.params.id);
    res.json({
      id: pi.id,
      status: pi.status,
      amount: pi.amount,
      amountInDollars: Number((pi.amount / 100).toFixed(2)),
      formattedAmount: `$${(pi.amount / 100).toFixed(2)} ${pi.currency.toUpperCase()}`,
      currency: pi.currency,
      charges: pi.charges?.data || [],
    });
  } catch (err) {
    console.error(`Error retrieving payment intent ${req.params.id}:`, err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Return page for 3D Secure In-App Browser completion
app.get('/return', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Authentication Complete</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0F172A; color: white; text-align: center; }
          .card { padding: 36px 28px; background: #1E293B; border-radius: 16px; border: 1px solid #334155; max-width: 85%; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .icon { font-size: 52px; margin-bottom: 16px; color: #10B981; }
          h2 { margin: 0 0 10px; color: #F8FAFC; font-size: 22px; }
          p { color: #94A3B8; margin: 0; font-size: 14px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✓</div>
          <h2>Authentication Complete</h2>
          <p>Your bank verification has been submitted.<br>You may now close this window to return to TapToPay.</p>
        </div>
      </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`🚀 Stripe Terminal backend server running on http://localhost:${port}`);
  console.log(`- GET  /health`);
  console.log(`- GET  /terminal_config`);
  console.log(`- POST /connection_token`);
  console.log(`- POST /create_payment_intent`);
  console.log(`- GET  /payment_intent/:id`);
  console.log(`- GET  /return`);
});
