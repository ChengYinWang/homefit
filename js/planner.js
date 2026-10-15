// 規則式教練：依個人資料、近期回饋產生每日課表
import { EXERCISES, byId } from './exercises.js';
import { addDays } from './store.js';
import { SAFETY_VERSION } from './safety.js';

// 每種目標的訓練輪替（每完成一天換下一個重點）
const FOCUS = {
  // 改善骨盆前傾、駝背、久坐腰痛：核心穩定＋臀部＋上背，搭配髖屈肌與胸口伸展
  posture: [
    { name: '核心穩定＋臀部', slots: ['core', 'lower', 'core', 'lower', 'core', 'upper'] },
    { name: '上背＋體態', slots: ['upper', 'core', 'upper', 'lower', 'core', 'upper'] },
    { name: '全身體態＋燃脂', slots: ['core', 'lower', 'upper', 'cardio', 'core', 'lower'] },
  ],
  fat: [
    { name: '全身燃脂', slots: ['cardio', 'lower', 'upper', 'cardio', 'core', 'lower'] },
    { name: '下半身＋有氧', slots: ['lower', 'cardio', 'lower', 'core', 'cardio', 'lower'] },
    { name: '上半身＋核心', slots: ['upper', 'core', 'cardio', 'upper', 'core', 'cardio'] },
    { name: '核心＋有氧', slots: ['core', 'cardio', 'core', 'lower', 'cardio', 'core'] },
  ],
  muscle: [
    { name: '下半身', slots: ['lower', 'lower', 'core', 'lower', 'lower', 'core'] },
    { name: '上半身', slots: ['upper', 'upper', 'core', 'upper', 'upper', 'core'] },
    { name: '核心', slots: ['core', 'core', 'lower', 'core', 'upper', 'core'] },
    { name: '全身', slots: ['lower', 'upper', 'core', 'lower', 'upper', 'cardio'] },
  ],
  fitness: [
    { name: '全身', slots: ['lower', 'upper', 'cardio', 'core', 'lower', 'upper'] },
    { name: '下半身＋有氧', slots: ['lower', 'cardio', 'lower', 'core', 'cardio', 'lower'] },
    { name: '上半身＋核心', slots: ['upper', 'core', 'cardio', 'upper', 'core', 'upper'] },
  ],
};

// 痠痛部位今天改練別的
const SORE_TO_AREA = { legs: 'lower', upper: 'upper', core: 'core' };
const SWAP_AREA = { lower: 'upper', upper: 'lower', core: 'cardio', cardio: 'core' };

export const DEFAULT_TEMPO = 3; // 每下約 3 秒

// 固定種子的亂數，讓同一天重新整理時課表不變
function rng(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const shuffle = (arr, rand) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// 單一動作實際做多久（秒）
export function workSeconds(item) {
  const ex = byId(item.id);
  const sides = ex.perSide ? 2 : 1;
  if (ex.type === 'time') return item.amount * sides;
  return Math.round(item.amount * (ex.tempo || DEFAULT_TEMPO) * sides);
}

export function kcalFor(met, weightKg, seconds) {
  return (met * weightKg * seconds) / 3600;
}

function dose(ex, factor, goal) {
  let amt = ex.base * factor;
  if (goal === 'muscle' && ex.type === 'reps') amt *= 1.1;
  if (goal === 'fat' && ex.type === 'time') amt *= 1.1;
  if (ex.type === 'reps') return Math.max(4, Math.round(amt));
  return Math.max(goal === 'posture' ? 10 : 15, Math.round(amt / 5) * 5);
}

// 最近一次回饋的痠痛部位（昨天或今天稍早）
function recentSoreAreas(state, date) {
  const from = addDays(date, -1);
  const areas = new Set();
  for (const h of state.history) {
    if (h.date >= from && h.date <= date && h.feedback) {
      for (const s of h.feedback.sore || []) if (SORE_TO_AREA[s]) areas.add(SORE_TO_AREA[s]);
    }
  }
  return areas;
}

// 該動作家族目前應該做到哪個難度
function targetLevel(state, family) {
  const base = state.adapt.level || state.profile.level;
  const adj = state.adapt.familyAdj[family]?.adj || 0;
  return clamp(base + adj, 0, 3); // 0 代表這類動作暫時不排
}

// 在某個部位挑一個動作：每個家族取「不超過目標難度、且沒有受傷禁忌」中最難的版本
export function effectiveInjuries(profile) {
  const list = profile.injuries || [];
  return profile.goal === 'posture' && !list.includes('back') ? [...list, 'back'] : list;
}

function pickFromArea(state, area, usedFamilies, rand) {
  const injuries = effectiveInjuries(state.profile);
  const posture = state.profile.goal === 'posture';
  const families = {};
  for (const ex of EXERCISES) {
    if (ex.area !== area || usedFamilies.has(ex.family)) continue;
    if (posture && !ex.tags?.includes('posture')) continue;
    if (ex.avoid.some(i => injuries.includes(i))) continue;
    if (ex.level > targetLevel(state, ex.family)) continue;
    if (!families[ex.family] || families[ex.family].level < ex.level) families[ex.family] = ex;
  }
  const options = Object.values(families);
  if (!options.length) return null;
  return options[Math.floor(rand() * options.length)];
}

function sessionInjuries(state, date) {
  const injuries = effectiveInjuries(state.profile);
  const recent = state.history.filter(h => h.date >= addDays(date, -1) && h.date <= date && h.feedback);
  if (recent.some(h => h.feedback.pain || h.feedback.sore?.includes('back')) && !injuries.includes('back')) return [...injuries, 'back'];
  return injuries;
}

export function generatePlan(state, date, variant = 0) {
  const p = state.profile;
  const rand = rng(`${date}#${variant}#${p.goal}`);
  const doneDays = new Set(state.history.filter(h => h.date < date).map(h => h.date)).size;
  const cycle = FOCUS[p.goal] || FOCUS.fitness;
  const focus = cycle[(doneDays + variant) % cycle.length];
  const minutes = p.minutes;
  const factor = state.adapt.factor;
  const injuries = sessionInjuries(state, date);
  // 選主訓練也使用相同日期範圍的傷痛篩選。
  const selectionState = { ...state, profile: { ...p, injuries } };

  const soreAreas = recentSoreAreas(state, date);
  const mainCount = minutes <= 10 ? 4 : minutes <= 20 ? 5 : 6;
  let slots = focus.slots.slice(0, mainCount).map(a => (soreAreas.has(a) ? SWAP_AREA[a] : a));
  // 若交換後仍是痠痛部位，就改成有氧或核心
  slots = slots.map(a => (soreAreas.has(a) ? (soreAreas.has('core') ? 'cardio' : 'core') : a));

  const used = new Set();
  const main = [];
  for (const area of slots) {
    let ex = pickFromArea(selectionState, area, used, rand);
    if (!ex) for (const alt of ['core', 'cardio', 'lower', 'upper']) {
      if (soreAreas.has(alt)) continue;
      ex = pickFromArea(selectionState, alt, used, rand);
      if (ex) break;
    }
    if (!ex) continue;
    used.add(ex.family);
    main.push({ id: ex.id, amount: dose(ex, factor, p.goal) });
  }

  const level = state.adapt.level || p.level;
  const warmCount = minutes <= 10 ? 2 : 3;
  const warmPool = EXERCISES.filter(e => e.area === 'warmup' && !e.avoid.some(i => injuries.includes(i)));
  const coolPool = EXERCISES.filter(e => e.area === 'stretch' && !e.avoid.some(i => injuries.includes(i)));
  // 體態目標：固定放入最關鍵的活動度與伸展，其餘隨機
  const prefer = (pool, ids) => {
    const first = ids.map(id => pool.find(e => e.id === id)).filter(Boolean);
    return [...first, ...shuffle(pool.filter(e => !ids.includes(e.id)), rand)];
  };
  const posture = p.goal === 'posture';
  const warmList = posture ? prefer(warmPool.filter(e => e.tags?.includes('posture')), ['march', 'chin_tuck', 'cat_cow']) : shuffle(warmPool, rand);
  const coolList = posture ? prefer(coolPool.filter(e => e.tags?.includes('posture')), ['hip_flexor_stretch', 'chest_stretch', 'child_pose']) : shuffle(coolPool, rand);
  const warmup = warmList.slice(0, warmCount).map(e => ({ id: e.id, amount: e.base }));
  const cooldown = coolList.slice(0, warmCount).map(e => ({ id: e.id, amount: e.base }));

  const restSec = level === 1 ? 30 : level === 2 ? 25 : 20;
  const roundRestSec = 60;
  const transition = 5;
  const warmSec = warmup.reduce((s, i) => s + workSeconds(i) + transition, 0);
  const coolSec = cooldown.reduce((s, i) => s + workSeconds(i) + transition, 0);
  const roundSec = main.reduce((s, i) => s + workSeconds(i), 0) + restSec * (main.length - 1);
  const budget = minutes * 60 - warmSec - coolSec;
  const rounds = clamp(Math.round((budget + roundRestSec) / (roundSec + roundRestSec)), 1, 5);

  const plan = { safetyVersion: SAFETY_VERSION, date, variant, focus: focus.name, minutes, warmup, main, cooldown, rounds, restSec, roundRestSec };
  const est = estimate(plan, p.weight);
  return { ...plan, estSec: est.sec, estKcal: est.kcal };
}

function estimate(plan, weight) {
  let sec = 0, kcal = 0;
  const add = items => items.forEach(i => {
    const s = workSeconds(i);
    sec += s;
    kcal += kcalFor(byId(i.id).met, weight, s);
  });
  add(plan.warmup);
  for (let r = 0; r < plan.rounds; r++) add(plan.main);
  add(plan.cooldown);
  const rest = plan.restSec * (plan.main.length - 1) * plan.rounds + plan.roundRestSec * (plan.rounds - 1);
  sec += rest;
  kcal += kcalFor(2, weight, rest);
  return { sec, kcal: Math.round(kcal) };
}

// 把課表展開成播放器的步驟
export function buildSteps(plan) {
  const steps = [];
  const ex = (item, phase, round) => ({ kind: 'exercise', phase, round, id: item.id, amount: item.amount });
  plan.warmup.forEach(i => steps.push(ex(i, 'warmup', 0)));
  steps.push({ kind: 'rest', secs: 15, label: '準備開始主訓練' });
  for (let r = 1; r <= plan.rounds; r++) {
    plan.main.forEach((i, idx) => {
      steps.push(ex(i, 'main', r));
      const last = idx === plan.main.length - 1;
      if (!last) steps.push({ kind: 'rest', secs: plan.restSec, label: '休息' });
      else if (r < plan.rounds) steps.push({ kind: 'rest', secs: plan.roundRestSec, label: `第 ${r} 輪完成！休息一下` });
    });
  }
  steps.push({ kind: 'rest', secs: 10, label: '主訓練完成，準備伸展' });
  plan.cooldown.forEach(i => steps.push(ex(i, 'cooldown', 0)));
  return steps;
}

// ---------- 依運動後回饋調整 ----------
export function applyFeedback(state, fb, workoutCount) {
  const a = state.adapt;
  const notes = [];
  if (!a.level) a.level = state.profile.level;

  const discomfort = fb.pain || (fb.failed || []).length || (fb.sore || []).some(s => s !== 'none');
  // RPE 低也不能蓋過疼痛或動作品質問題；有不適當次不升級。
  const delta = discomfort ? (fb.pain ? -0.1 : 0) : ({ 1: 0.04, 2: 0.04, 3: 0.03, 4: 0.03, 5: 0.02, 6: 0, 7: 0, 8: 0, 9: -0.06, 10: -0.1 }[fb.rpe] ?? 0);
  a.factor = Math.round(clamp(a.factor + delta, 0.6, 1.6) * 100) / 100;
  if (delta >= 0.05) notes.push('今天感覺輕鬆，下次次數 / 秒數會增加 💪');
  else if (delta > 0) notes.push('強度剛好，下次會再加一點點');
  else if (delta < 0) notes.push('今天比較吃力，下次會降低一些強度');

  if (!discomfort && a.factor >= 1.35 && a.level < 3) {
    a.level += 1; a.factor = 1;
    notes.push('🎉 你進步了！之後會換成更進階的動作');
  } else if (a.factor <= 0.7 && a.level > 1) {
    a.level -= 1; a.factor = 1;
    notes.push('之後會換成較簡單的動作版本，先把基礎打穩');
  }

  for (const id of fb.failed || []) {
    const ex = byId(id);
    if (!ex) continue;
    // 下次改做比這次低一級的版本；已經是最簡單的就暫時不排
    const cur = a.familyAdj[ex.family]?.adj || 0;
    const want = ex.level - 1;
    a.familyAdj[ex.family] = { adj: Math.min(cur, want - a.level), until: workoutCount + 4 };
    const easiest = Math.min(...EXERCISES.filter(e => e.family === ex.family).map(e => e.level));
    notes.push(want >= easiest
      ? `「${ex.name}」接下來會換成較簡單的版本`
      : `「${ex.name}」接下來幾次先換成其他動作`);
  }
  // 過期的退階設定移除
  for (const [fam, v] of Object.entries(a.familyAdj)) {
    if (v.until <= workoutCount && !(fb.failed || []).some(id => byId(id)?.family === fam)) delete a.familyAdj[fam];
  }

  if ((fb.sore || []).length && !fb.sore.includes('none')) notes.push('明天會避開痠痛的部位，讓肌肉恢復');
  if (fb.pain) notes.push('已降低強度；疼痛、放射痛或麻刺請停止誘發動作，先請醫師或物理治療師評估，不要靠連勝硬練。');
  return notes;
}
