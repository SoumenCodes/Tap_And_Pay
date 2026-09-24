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
    timestamp: new Date().toISOString(),
  });
});

// 2. Terminal Config (retrieves default location ID)
app.get('/terminal_config', async (req, res) => {
  try {
    const locationId = await getOrCreateLocation();
    res.json({
      locationId: locationId || 'loc_simulated',
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
      let paymentIntent;
      try {
        paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: normalizedCurrency,
          payment_method: 'pm_card_visa',
          confirm: true,
          return_url: 'https://example.com/return',
          description: 'TapToPay Demo - Manual Card Entry (Test Mode)',
        });
      } catch {
        paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: normalizedCurrency,
          payment_method_types: ['card'],
          description: 'TapToPay Demo - Manual Card Entry (Test Mode)',
        });
      }

      return res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
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
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    });
  } catch (err) {
    console.error('Error creating payment intent:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Stripe Terminal backend server running on http://localhost:${port}`);
  console.log(`- GET  /health`);
  console.log(`- GET  /terminal_config`);
  console.log(`- POST /connection_token`);
  console.log(`- POST /create_payment_intent`);
});
