// Injects public Supabase config into the page at runtime from Vercel env vars.
// The anon key is NOT committed to the repo — it comes from the project's
// Environment Variables (same values the dashboard already used at build time).
export default function handler(req, res) {
  // Public Supabase config (anon key — designed to be client-visible; data protected by RLS).
  // User explicitly authorized embedding these public values so no manual env setup is needed.
  const u = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://nzutcgwrknvgogsuphpr.supabase.co';
  const k = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56dXRjZ3dya252Z29nc3VwaHByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxOTc1NzYsImV4cCI6MjA5ODc3MzU3Nn0.9RbZicwBbGDebKV3EHao0BD3gEiH84q5ibICL2OdwvA';
  res.setHeader('content-type', 'text/javascript; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.status(200).send('window.__HM_ENV=' + JSON.stringify({ u, k }) + ';');
}
