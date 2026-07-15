// Runtime for the standalone 견적/계약 app.
// SAFETY: writes ONLY to the `quotes` table (adds new docs — they show up in the
// dashboard '발급 내역' too). Reads clients + app_config (presets) read-only.
// Preset edits are kept in localStorage, so the shared dashboard config is never modified.
import * as N from 'react';
import * as _jsx from 'react/jsx-runtime';
import { createPortal } from 'react-dom';
import { createClient } from '@supabase/supabase-js';

export { N };
export const r = { jsx: _jsx.jsx, jsxs: _jsx.jsxs, Fragment: _jsx.Fragment };
export const bx = { createPortal };

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const Z = createClient(URL, KEY);

export const AuthCtx = N.createContext({});
export function ht() { return N.useContext(AuthCtx); }

// ---- minimal external store (config / clients / quotes) ----
let I = { config: {}, clients: [], quotes: [] };
const subs = new Set();
const snap = () => I;
const emit = () => subs.forEach((f) => f());

export function xe() {
  return N.useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, snap, snap);
}

function unwrap(rows) { return (rows || []).map((x) => (x && x.data ? x.data : x)); }

export async function loadAll() {
  const [c, q, cfg] = await Promise.all([
    Z.from('clients').select('*'),
    Z.from('quotes').select('*'),
    Z.from('app_config').select('data').eq('id', 'main').maybeSingle(),
  ]);
  const config = (cfg && cfg.data && cfg.data.data) || {};
  const localPresets = localStorage.getItem('hm_docPresets');
  if (localPresets) { try { config.docPresets = JSON.parse(localPresets); } catch (e) {} }
  I = { config, clients: unwrap(c.data), quotes: unwrap(q.data) };
  emit();
}

const uid = () => (globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + subs.size);

export async function dn(table, obj, userId) {
  const row = { ...obj, id: obj.id || uid(), createdBy: userId };
  I = { ...I, [table]: [row, ...(I[table] || []).filter((x) => x.id !== row.id)] };
  emit();
  const { error } = await Z.from(table).upsert({ id: row.id, data: row });
  if (error) alert('저장 중 오류가 발생했습니다: ' + error.message);
}

export async function Ss(table, id) {
  I = { ...I, [table]: (I[table] || []).filter((x) => x.id !== id) };
  emit();
  const { error } = await Z.from(table).delete().eq('id', id);
  if (error) alert('삭제 중 오류가 발생했습니다: ' + error.message);
}

// Preset edits stay LOCAL (localStorage) — the shared dashboard config is untouched.
export function tt(patch) {
  if ('docPresets' in patch) {
    if (patch.docPresets == null) localStorage.removeItem('hm_docPresets');
    else localStorage.setItem('hm_docPresets', JSON.stringify(patch.docPresets));
  }
  I = { ...I, config: { ...I.config, ...patch } };
  emit();
}
