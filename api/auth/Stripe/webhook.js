// api/stripe/webhook.js
// Receives Stripe subscription lifecycle events and writes to Supabase.
// This is the ONLY thing that grants or revokes Pro access.

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { buffer } from 'micro';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Disable body parsing — Stripe needs the raw body to verify the signature
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  const body = await buffer(req);

  // ── Verify webhook signature ─────────────────────────────────────────────
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`Stripe event received: ${event.type}`);

  // ── Handle subscription lifecycle events ─────────────────────────────────
  switch (event.type) {

    // User completed checkout — first payment succeeded
    case 'checkout.session.completed': {
      const session = event.data.object;
      const email = session.customer_details?.email;

      if (!email) {
        console.error('checkout.session.completed: no email found');
        break;
      }

      // Look up the Supabase user by email to get their user_id
      const { data: authUser } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', email)
        .single();

      await supabase.from('subscriptions').upsert({
        user_id: authUser?.id ?? null,
        email,
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        status: 'active',
        plan: 'pro',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });

      console.log(`Subscription created for ${email}`);
      break;
    }

    // Recurring payment succeeded — refresh period end date
    case 'invoice.paid': {
      const invoice = event.data.object;
      if (!invoice.subscription) break;

      const subscription = await stripe.subscriptions.retrieve(
        invoice.subscription
      );

      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          plan: 'pro',
          current_period_end: new Date(
            subscription.current_period_end * 1000
          ).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', invoice.subscription);

      console.log(`Invoice paid, subscription renewed: ${invoice.subscription}`);
      break;
    }

    // Subscription changed (upgrade, downgrade, pause, past_due, etc.)
    case 'customer.subscription.updated': {
      const sub = event.data.object;

      await supabase
        .from('subscriptions')
        .update({
          status: sub.status,
          plan: sub.status === 'active' ? 'pro' : 'free',
          current_period_end: new Date(
            sub.current_period_end * 1000
          ).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', sub.id);

      console.log(`Subscription updated: ${sub.id} → ${sub.status}`);
      break;
    }

    // Subscription canceled — revoke Pro access
    case 'customer.subscription.deleted': {
      const sub = event.data.object;

      await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          plan: 'free',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', sub.id);

      console.log(`Subscription canceled: ${sub.id}`);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  // Always return 200 so Stripe doesn't retry
  return res.json({ received: true });
}