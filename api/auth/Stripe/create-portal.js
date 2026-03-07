// api/stripe/create-portal.js
// Creates a Stripe Billing Portal session so Pro users can manage
// their subscription (cancel, update card, view invoices) without
// you having to build any of that UI yourself.

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // Verify user is authenticated
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get their Stripe customer ID from the subscriptions table
  const { data: sub, error: subError } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  if (subError || !sub?.stripe_customer_id) {
    return res.status(404).json({ error: 'No active subscription found' });
  }

  // Create a Stripe Billing Portal session
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourdomain.com',
  });

  return res.json({ url: portalSession.url });
}