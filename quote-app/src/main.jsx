import { createRoot } from 'react-dom/client';
import { r, N, bx, Z, AuthCtx, xe, ht, dn, tt, Ss, loadAll } from './runtime.js';
import { makeDocs } from './docs.js';
import './index.css';

const { Dw } = makeDocs({ r, N, bx, xe, ht, dn, tt, Ss });

function LoginGate() {
  const [email, setEmail] = N.useState('');
  const [pw, setPw] = N.useState('');
  const [err, setErr] = N.useState('');
  const [busy, setBusy] = N.useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    const { error } = await Z.auth.signInWithPassword({ email: email.trim(), password: pw });
    setBusy(false);
    if (error) setErr('로그인 실패 — 이메일/비밀번호를 확인해 주세요.');
  }
  return r.jsx('div', { className: 'login-wrap', children:
    r.jsxs('form', { className: 'login-card', onSubmit: submit, children: [
      r.jsx('div', { className: 'brand', style: { fontWeight: 800, letterSpacing: '0.04em', marginBottom: 4 }, children: 'STUDIO. HOLYMOLLY' }),
      r.jsx('div', { className: 'mut3', style: { fontSize: 13, marginBottom: 16 }, children: '견적서 · 계약서' }),
      r.jsx('input', { type: 'email', placeholder: '이메일', value: email, onChange: (e) => setEmail(e.target.value), autoFocus: true }),
      r.jsx('input', { type: 'password', placeholder: '비밀번호', value: pw, onChange: (e) => setPw(e.target.value), style: { marginTop: 8 } }),
      err && r.jsx('div', { className: 'err', style: { marginTop: 8 }, children: err }),
      r.jsx('button', { className: 'btn primary', type: 'submit', disabled: busy, style: { marginTop: 14, width: '100%' }, children: busy ? '확인 중…' : '로그인' }),
      r.jsx('div', { className: 'hint', style: { marginTop: 12, fontSize: 12 }, children: '대시보드와 동일한 계정으로 로그인하세요.' }),
    ] }),
  });
}

function Header({ user }) {
  return r.jsxs('div', { className: 'topbar', style: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderBottom: '1px solid var(--line)' }, children: [
    r.jsx('div', { style: { fontWeight: 800, letterSpacing: '0.04em' }, children: 'STUDIO. HOLYMOLLY' }),
    r.jsx('div', { className: 'mut3', style: { fontSize: 13 }, children: '견적서 · 계약서' }),
    r.jsx('div', { style: { flex: 1 } }),
    r.jsx('span', { className: 'mut3', style: { fontSize: 12.5 }, children: user.email || '' }),
    r.jsx('button', { className: 'btn sm ghost', onClick: () => Z.auth.signOut(), children: '로그아웃' }),
  ] });
}

function App() {
  const [user, setUser] = N.useState(undefined); // undefined = booting
  N.useEffect(() => {
    Z.auth.getSession().then(({ data }) => setUser((data.session && data.session.user) || null));
    const { data: sub } = Z.auth.onAuthStateChange((_e, s) => setUser((s && s.user) || null));
    return () => sub.subscription.unsubscribe();
  }, []);
  N.useEffect(() => { if (user) loadAll(); }, [user]);

  if (user === undefined) return r.jsx('div', { className: 'login-wrap', children: r.jsx('div', { className: 'mut3', children: '불러오는 중…' }) });
  if (!user) return r.jsx(LoginGate, {});
  return r.jsx(AuthCtx.Provider, { value: { user }, children:
    r.jsxs('div', { className: 'content', style: { maxWidth: 1400, margin: '0 auto' }, children: [
      r.jsx(Header, { user }),
      r.jsx('div', { style: { padding: 18 }, children: r.jsx(Dw, {}) }),
    ] }),
  });
}

createRoot(document.getElementById('root')).render(r.jsx(App, {}));
