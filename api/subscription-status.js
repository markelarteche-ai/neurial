// api/subscription-status.js
// Vercel Serverless Function
// Returns whether the current user has an active Pro subscription.
// Called by the frontend on mount and after Stripe redirect.

import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAILS = [
  'markelarteche@gmail.com',
];

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Extract JWT from Authorization header
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ isPro: false, reason: 'no_token' });
  }

  // Verify JWT and get user
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ isPro: false, reason: 'invalid_token' });
  }

  // Admin override — always Pro
  if (ADMIN_EMAILS.includes(user.email)) {
    return res.json({ isPro: true, plan: 'pro', isAdmin: true });
  }

  // Check subscriptions table
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status, plan, current_period_end')
    .eq('user_id', user.id)
    .single();

  const now = new Date();
  const isPro =
    sub?.plan === 'pro' &&
    sub?.status === 'active' &&
    sub?.current_period_end != null &&
    new Date(sub.current_period_end) > now;

  return res.json({
    isPro,
    plan: sub?.plan ?? 'free',
    status: sub?.status ?? 'none',
  });
}