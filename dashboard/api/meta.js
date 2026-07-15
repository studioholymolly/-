// /api/meta — Meta(Facebook) Ads 프록시 (관측된 클라이언트 동작 기반 복원).
// 원본 서버 함수 소스가 없어 클라이언트가 기대하는 응답 형태에 맞춰 재작성했습니다.
// 필요한 환경변수(Vercel Project Settings → Environment Variables):
//   META_AD_ACCOUNT_ID  — 광고 계정 번호 (예: 492650513247259)  ← 클라이언트 UI에서 확인된 이름
//   META_ACCESS_TOKEN   — 장기 액세스 토큰 (아래 후보 이름들도 자동 탐색)
const GRAPH = 'https://graph.facebook.com/v21.0';

function getToken() {
  const names = ['META_ACCESS_TOKEN', 'META_TOKEN', 'META_SYSTEM_USER_TOKEN', 'FB_ACCESS_TOKEN', 'FACEBOOK_ACCESS_TOKEN', 'META_LONG_LIVED_TOKEN'];
  for (const n of names) if (process.env[n]) return process.env[n];
  return '';
}
function getAcctId() {
  let id = process.env.META_AD_ACCOUNT_ID || process.env.META_ACCOUNT_ID || '492650513247259';
  id = String(id).replace(/^act_/, '');
  return id;
}
async function g(path, params, token) {
  const u = new URL(GRAPH + path);
  u.searchParams.set('access_token', token);
  for (const [k, v] of Object.entries(params || {})) u.searchParams.set(k, v);
  const r = await fetch(u.toString());
  const j = await r.json();
  if (j && j.error) throw new Error(j.error.message || 'graph error');
  return j;
}

export default async function handler(req, res) {
  res.setHeader('content-type', 'application/json; charset=utf-8');
  const q = (req.query && req.query.q) || 'overview';
  const token = getToken();
  const acct = 'act_' + getAcctId();

  if (!token) {
    // 토큰 미설정 — 클라이언트는 connected:false 를 그대로 표시
    return res.status(200).json({ connected: false, reason: 'no_token', message: 'META_ACCESS_TOKEN 환경변수가 설정되어 있지 않습니다.' });
  }

  try {
    if (q === 'overview') {
      const a = await g('/' + acct, { fields: 'name,account_status,currency,amount_spent,balance,spend_cap,funding_source_details,min_daily_budget' }, token);
      return res.status(200).json({ connected: true, account: a });
    }
    if (q === 'campaigns') {
      const camp = await g('/' + acct + '/campaigns', { fields: 'id,name,effective_status,objective,daily_budget,lifetime_budget', limit: '200' }, token);
      const list = (camp.data || []);
      // 캠페인별 인사이트 병합
      const ins = await g('/' + acct + '/insights', {
        level: 'campaign', date_preset: 'maximum', limit: '500',
        fields: 'campaign_id,spend,impressions,reach,frequency,inline_link_clicks,clicks,actions,cpc,ctr',
      }, token).catch(() => ({ data: [] }));
      const byId = {};
      for (const row of (ins.data || [])) byId[row.campaign_id] = row;
      const campaigns = list.map((c) => ({ ...c, ...(byId[c.id] || {}) }));
      return res.status(200).json({ campaigns });
    }
    if (q === 'daily') {
      const d = await g('/' + acct + '/insights', {
        time_increment: '1', date_preset: 'last_30d', limit: '500',
        fields: 'date_start,date_stop,spend,impressions,reach,inline_link_clicks,clicks,actions',
      }, token);
      const daily = (d.data || []).map((x) => ({ ...x, date: x.date_start }));
      return res.status(200).json({ daily });
    }
    if (q === 'summary') {
      const s = await g('/' + acct + '/insights', {
        date_preset: 'last_30d',
        fields: 'spend,impressions,reach,frequency,inline_link_clicks,clicks,actions',
      }, token);
      return res.status(200).json({ summary: (s.data && s.data[0]) || null });
    }
    if (q === 'ads') {
      const a = await g('/' + acct + '/ads', {
        limit: '200',
        fields: 'id,campaign_id,effective_status,creative{thumbnail_url,instagram_permalink_url,object_type}',
      }, token);
      return res.status(200).json({ ads: a.data || [] });
    }
    if (q === 'fx') {
      try {
        const r = await fetch('https://open.er-api.com/v6/latest/USD');
        const j = await r.json();
        const krw = (j && j.rates && j.rates.KRW) || null;
        return res.status(200).json({ krw });
      } catch { return res.status(200).json({ krw: null }); }
    }
    return res.status(200).json({});
  } catch (e) {
    return res.status(200).json({ connected: false, reason: 'error', message: String(e && e.message || e) });
  }
}
