// 連勝、連勝凍結、徽章
import { today, addDays } from './store.js';

export const MILESTONES = [3, 7, 14, 30, 60, 100, 180, 365];
export const MAX_FREEZES = 2;

export function doneDates(state) {
  return new Set(state.history.filter(h => h.counted !== false).map(h => h.date));
}

function activeChecker(state) {
  const done = doneDates(state);
  const frozen = new Set(state.streak.frozenDates);
  return { done, frozen, active: d => done.has(d) || frozen.has(d) };
}

// 開 APP 時呼叫：如果有漏掉的日子且還有凍結，就自動用掉
export function applyFreezes(state) {
  const { done, active } = activeChecker(state);
  if (!done.size || done.has(today())) return 0;
  const yesterday = addDays(today(), -1);
  let last = yesterday;
  const missing = [];
  while (!active(last)) {
    missing.push(last);
    last = addDays(last, -1);
    if (missing.length > 400) return 0;
  }
  if (!missing.length) return 0;
  if (missing.length <= state.streak.freezes) {
    state.streak.freezes -= missing.length;
    state.streak.frozenDates.push(...missing);
    return missing.length;
  }
  state.streak.awardedAt = 0; // 連勝斷了，重新累積凍結獎勵
  return -1;
}

// 目前連勝（今天還沒練也不會斷，只要昨天有練）
export function currentStreak(state) {
  const { done, active } = activeChecker(state);
  let d = today();
  if (!active(d)) d = addDays(d, -1);
  let count = 0;
  while (active(d)) {
    if (done.has(d)) count++;
    d = addDays(d, -1);
  }
  return count;
}

export function bestStreak(state) {
  const { done, active } = activeChecker(state);
  if (!done.size) return 0;
  const dates = [...done].sort();
  let best = 0, cur = 0, d = dates[0];
  const end = today();
  while (d <= end) {
    if (active(d)) { if (done.has(d)) cur++; best = Math.max(best, cur); }
    else cur = 0;
    d = addDays(d, 1);
  }
  return best;
}

// 完成運動後呼叫：每連續 7 天送一個凍結
export function awardFreeze(state) {
  const s = currentStreak(state);
  if (s > 0 && s % 7 === 0 && s !== state.streak.awardedAt && state.streak.freezes < MAX_FREEZES) {
    state.streak.freezes += 1;
    state.streak.awardedAt = s;
    return true;
  }
  return false;
}

export function nextMilestone(streak) {
  return MILESTONES.find(m => m > streak) || null;
}

export function dayStatus(state, d) {
  const { done, frozen } = activeChecker(state);
  if (done.has(d)) return 'done';
  if (frozen.has(d)) return 'frozen';
  return 'none';
}

// ---------- 熱量 ----------
// Mifflin-St Jeor 基礎代謝
export function bmr(profile) {
  const { sex, weight, height, age } = profile;
  return Math.round(10 * weight + 6.25 * height - 5 * age + (sex === 'male' ? 5 : -161));
}

export function kcalOn(state, d) {
  return Math.round(state.history.filter(h => h.date === d).reduce((s, h) => s + h.kcal, 0));
}
