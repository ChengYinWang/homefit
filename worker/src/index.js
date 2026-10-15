// 每日運動推播提醒（Cloudflare Workers 免費方案）
// - APP 開啟提醒時呼叫 /sync 存下訂閱、提醒時間、今天是否已運動
// - 每 15 分鐘的排程檢查：到了提醒時間、今天還沒運動 → 發推播；晚上再追一次
import { sendPush } from './webpush.js';

const KEY = 'subs';
const MAX_SUBS = 5; // 自己用，最多 5 台裝置；超過時移除最舊的
const PUSH_HOSTS = [/\.push\.apple\.com$/, /^fcm\.googleapis\.com$/, /\.push\.services\.mozilla\.com$/, /\.notify\.windows\.com$/];

// ---------- 小工具 ----------
const json = (data, status, cors) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...cors } });

function corsHeaders(req, env) {
  const origin = req.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim());
  if (!allowed.includes(origin)) return {};
  return { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' };
}

const isTime = t => typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
const toMin = t => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
const isDate = d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);

function validTz(tz) {
  try { new Intl.DateTimeFormat('en', { timeZone: tz }); return true; } catch { return false; }
}

function validSubscription(sub) {
  try {
    const u = new URL(sub.endpoint);
    return u.protocol === 'https:' && PUSH_HOSTS.some(r => r.test(u.hostname))
      && typeof sub.keys?.p256dh === 'string' && sub.keys.p256dh.length > 80 && sub.keys.p256dh.length < 100
      && typeof sub.keys?.auth === 'string' && sub.keys.auth.length >= 16 && sub.keys.auth.length < 32;
  } catch { return false; }
}

// 某時區的當地日期與「當天第幾分鐘」
export function localParts(date, tz) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).map(p => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

function prevDate(d) {
  const t = new Date(`${d}T12:00:00Z`);
  t.setUTCDate(t.getUTCDate() - 1);
  return t.toISOString().slice(0, 10);
}

const loadSubs = async env => (await env.SUBS.get(KEY, 'json')) || [];
const saveSubs = (env, subs) => env.SUBS.put(KEY, JSON.stringify(subs));

function vapid(env) {
  return { privateJwk: JSON.parse(env.VAPID_PRIVATE_JWK), publicKey: env.VAPID_PUBLIC_KEY, subject: env.VAPID_SUBJECT };
}

// ---------- 提醒內容 ----------
export function reminderMessage(rec, local, kind) {
  const alive = rec.streak > 0 && rec.doneDate === prevDate(local.date);
  if (kind === 'late') {
    return {
      title: '🔥 連勝快斷了！',
      body: alive ? `今天還沒運動，${rec.streak} 天連勝別斷在今天，10 分鐘也算數！` : '睡前動 10 分鐘也算數，明天的你會感謝自己 💪',
    };
  }
  return {
    title: '該運動囉！💪',
    body: alive ? `你的 ${rec.streak} 天連勝在等你，今天練完就 ${rec.streak + 1} 天！` : '今天花幾分鐘動一動，開始新的連勝吧！',
  };
}

// 決定這次排程要發哪一種提醒（null 表示不用發）
export function dueReminder(rec, local) {
  if (rec.doneDate === local.date) return null;
  const sent = rec.sent?.date === local.date ? rec.sent : { date: local.date };
  if (local.minutes < toMin(rec.time)) return null;
  if (rec.late && !sent.late && local.minutes >= toMin(rec.late)) return 'late';
  if (!sent.main && !sent.late) return 'main';
  return null;
}

async function runReminders(env, now = new Date()) {
  const subs = await loadSubs(env);
  let changed = false;
  const keep = [];
  for (const rec of subs) {
    const local = localParts(now, rec.tz);
    const kind = dueReminder(rec, local);
    if (!kind) { keep.push(rec); continue; }
    const msg = reminderMessage(rec, local, kind);
    let status = 0;
    try {
      status = await sendPush(rec, { ...msg, tag: 'daily-reminder', url: './' }, vapid(env));
    } catch (e) {
      console.log('push error', e.message);
    }
    if (status === 404 || status === 410) { changed = true; continue; } // 訂閱失效，移除
    if (status >= 200 && status < 300) {
      const sent = rec.sent?.date === local.date ? rec.sent : { date: local.date };
      rec.sent = { ...sent, main: true, [kind]: true };
      changed = true;
    } else {
      console.log('push failed', status);
    }
    keep.push(rec);
  }
  if (changed) await saveSubs(env, keep);
}

// ---------- API ----------
async function handle(req, env, cors) {
  const url = new URL(req.url);
  if (req.method === 'GET' && url.pathname === '/vapid') return json({ publicKey: env.VAPID_PUBLIC_KEY }, 200, cors);
  if (req.method !== 'POST') return json({ error: 'not found' }, 404, cors);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400, cors); }

  if (url.pathname === '/sync') {
    const { subscription: sub, time, late, tz, streak, doneDate } = body;
    if (!validSubscription(sub)) return json({ error: 'bad subscription' }, 400, cors);
    if (!isTime(time) || (late != null && !isTime(late)) || !validTz(tz)) return json({ error: 'bad settings' }, 400, cors);
    if (doneDate != null && !isDate(doneDate)) return json({ error: 'bad date' }, 400, cors);
    const subs = await loadSubs(env);
    const old = subs.find(s => s.endpoint === sub.endpoint);
    const rec = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      time, late: late || null, tz,
      streak: Math.max(0, Math.min(100000, Number(streak) || 0)),
      doneDate: doneDate || null,
      sent: old?.sent || null,
      lastTest: old?.lastTest || 0,
    };
    // 內容沒變就不寫入（KV 免費方案每天寫入次數有限）
    const sig = r => JSON.stringify([r.keys, r.time, r.late, r.tz, r.streak, r.doneDate]);
    if (old && sig(old) === sig(rec)) return json({ ok: true, unchanged: true }, 200, cors);
    const rest = subs.filter(s => s.endpoint !== sub.endpoint);
    rec.updated = Date.now();
    const next = [...rest, rec].sort((a, b) => (b.updated || 0) - (a.updated || 0)).slice(0, MAX_SUBS);
    await saveSubs(env, next);
    return json({ ok: true }, 200, cors);
  }

  if (url.pathname === '/unsubscribe') {
    const subs = await loadSubs(env);
    const next = subs.filter(s => s.endpoint !== body.endpoint);
    if (next.length !== subs.length) await saveSubs(env, next);
    return json({ ok: true }, 200, cors);
  }

  if (url.pathname === '/test') {
    const subs = await loadSubs(env);
    const rec = subs.find(s => s.endpoint === body.endpoint);
    if (!rec) return json({ error: 'not subscribed' }, 404, cors);
    if (rec.lastTest && Date.now() - rec.lastTest < 30_000) return json({ error: 'too soon' }, 429, cors);
    rec.lastTest = Date.now();
    await saveSubs(env, subs);
    const status = await sendPush(rec, { title: '測試通知 ✅', body: '收到這則通知，代表每日提醒設定成功！', tag: 'test', url: './' }, vapid(env));
    return json({ ok: status >= 200 && status < 300, status }, 200, cors);
  }

  return json({ error: 'not found' }, 404, cors);
}

export default {
  async fetch(req, env) {
    const cors = corsHeaders(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    try {
      return await handle(req, env, cors);
    } catch (e) {
      console.log('error', e.stack);
      return json({ error: 'server error' }, 500, cors);
    }
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runReminders(env, new Date(event.scheduledTime)));
  },
};
