// Diagnostic only — returns booleans (no secret values) so we can see which env vars are missing.
export default function handler(req, res) {
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.status(200).json({
    supabaseUrl: !!(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL),
    supabaseKey: !!(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY),
    metaToken: !!(process.env.META_ACCESS_TOKEN || process.env.META_TOKEN || process.env.META_SYSTEM_USER_TOKEN || process.env.FB_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN),
    metaAcct: !!(process.env.META_AD_ACCOUNT_ID || process.env.META_ACCOUNT_ID),
    // names present that look supabase/meta related (names only, never values)
    envNames: Object.keys(process.env).filter((k) => /SUPABASE|META|FB_|FACEBOOK/i.test(k)).sort(),
  });
}
