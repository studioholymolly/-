// Injects public Supabase config into the page at runtime from Vercel env vars.
// The anon key is NOT committed to the repo — it comes from the project's
// Environment Variables (same values the dashboard already used at build time).
export default function handler(req, res) {
  const u = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const k = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';
  res.setHeader('content-type', 'text/javascript; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.status(200).send('window.__HM_ENV=' + JSON.stringify({ u, k }) + ';');
}
