// api/auth/session.js
// Vercel Serverless Function (or any Node/Express route)
// Returns the current user + whether they have an active Pro subscription.

import { createClient } from '@supabase/supabase-js';

// ── Admin override: these emails are always Pro, no payment needed ──────────
const ADMIN_EMAILS = [
  'markelarteche@gmail.com', // ← replace with your email
];

export default async function handler(req, res) {
  // Use service role key — bypasses Row Level Security for server-side reads
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Extract Supabase JWT from Authorization header
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.json({ isPro: false, user: null });
  }

  // Verify the JWT and get the user
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.json({ isPro: false, user: null });
  }

  // ── Admin override ──────────────────────────────────────────────────────
  if (ADMIN_EMAILS.includes(user.email)) {
    return res.json({
      isPro: true,
      user,
      plan: 'pro',
      isAdmin: true,
    });
  }

  // ── Check subscription in database ─────────────────────────────────────
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
    user,
    plan: sub?.plan ?? 'free',
    status: sub?.status ?? 'free',
  });
}