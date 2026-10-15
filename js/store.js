// 資料存在手機本機（localStorage），不需要帳號
const KEY = 'homefit.v1';

export function defaultState() {
  return {
    profile: null,
    history: [],                                   // 每次運動紀錄
    adapt: { factor: 1, level: null, familyAdj: {} }, // 依回饋自動調整的強度
    streak: { freezes: 0, frozenDates: [], awardedAt: 0 },
    plan: null,                                    // 今天的課表（快取）
    settings: { voice: true, sound: true },
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const data = JSON.parse(raw);
    const base = defaultState();
    return {
      ...base,
      ...data,
      adapt: { ...base.adapt, ...data.adapt },
      streak: { ...base.streak, ...data.streak },
      settings: { ...base.settings, ...data.settings },
    };
  } catch {
    return defaultState();
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('儲存失敗', e);
  }
}

// ---------- 日期工具（一律使用本地時間的 YYYY-MM-DD） ----------
const pad = n => String(n).padStart(2, '0');

export function dateStr(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s, n) {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return dateStr(d);
}

export const today = () => dateStr();
