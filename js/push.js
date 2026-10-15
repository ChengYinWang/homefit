// 每日推播提醒：向 Cloudflare Worker 登記訂閱、提醒時間與今天是否已運動
// 部署 worker/ 後，把網址填在這裡
export const PUSH_SERVER = 'https://homefit-push.estherwang93.workers.dev';

const SYNC_KEY = 'homefit.pushSync';

const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

// ok / not-configured / need-install / unsupported / denied
export function pushStatus() {
  if (!PUSH_SERVER) return 'not-configured';
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (!supported) return isIOS() && !isStandalone() ? 'need-install' : 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  return 'ok';
}

function b64ToBytes(b64) {
  const s = b64.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64.length + 3) % 4);
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}

async function post(path, data) {
  const res = await fetch(PUSH_SERVER + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  return body;
}

async function currentSubscription() {
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

// 開啟提醒：必須由使用者點按觸發（iOS 規定）
export async function enablePush(info) {
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error(perm === 'denied' ? 'denied' : 'dismissed');
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const { publicKey } = await fetch(PUSH_SERVER + '/vapid').then(r => r.json());
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(publicKey) });
  }
  await syncPush(info, true);
}

export async function disablePush() {
  const sub = await currentSubscription();
  if (sub) {
    await post('/unsubscribe', { endpoint: sub.endpoint }).catch(() => {});
    await sub.unsubscribe();
  }
  try { localStorage.removeItem(SYNC_KEY); } catch { /* 略過 */ }
}

// 把提醒時間、連勝、今天是否已運動同步給伺服器（內容沒變就不送）
export async function syncPush(info, force = false) {
  if (pushStatus() !== 'ok') return;
  const sub = await currentSubscription();
  if (!sub) return;
  const data = {
    subscription: sub.toJSON(),
    time: info.time,
    late: info.late || null,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    streak: info.streak,
    doneDate: info.doneDate,
  };
  const sig = JSON.stringify(data);
  let last = null;
  try { last = localStorage.getItem(SYNC_KEY); } catch { /* 略過 */ }
  if (!force && last === sig) return;
  await post('/sync', data);
  try { localStorage.setItem(SYNC_KEY, sig); } catch { /* 略過 */ }
}

export async function sendTestPush() {
  const sub = await currentSubscription();
  if (!sub) throw new Error('not subscribed');
  return post('/test', { endpoint: sub.endpoint });
}
