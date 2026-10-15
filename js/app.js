import { load, save, defaultState, today, addDays, parseDate, dateStr } from './store.js';
import { byId, INJURIES, AREA_NAMES } from './exercises.js';
import { animateFigure, figureStatic } from './figure.js';
import { SAFETY_VERSION, STOP_MESSAGE } from './safety.js';
import { generatePlan, buildSteps, applyFeedback, kcalFor, workSeconds } from './planner.js';
import {
  applyFreezes, currentStreak, bestStreak, awardFreeze, nextMilestone, dayStatus,
  MILESTONES, MAX_FREEZES, bmr, kcalOn,
} from './streak.js';

let state = load();
let view = state.profile ? 'home' : 'onboarding';
let session = null;     // 進行中的運動
let lastResult = null;  // 剛完成的運動
let feedbackFor = null; // 正在填回饋的紀錄 id
let feedbackNotes = [];
let calMonth = (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); })();
let freezeMsg = 0;

const app = document.getElementById('app');
const commit = () => save(state);

// ---------- 小工具 ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MOODS = ['😫', '😕', '🙂', '😄', '🤩'];
const WEEK = ['一', '二', '三', '四', '五', '六', '日'];
const GOALS = { posture: '改善體態（骨盆前傾／駝背／腰痛）', fat: '減脂', muscle: '增肌塑形', fitness: '提升體能' };
const LEVELS = { 1: '幾乎沒在運動', 2: '偶爾運動', 3: '規律運動' };
const BADGE_EMOJI = { 3: '🌱', 7: '🔥', 14: '⭐', 30: '🏅', 60: '💎', 100: '🏆', 180: '👑', 365: '🦄' };

function fmtAmount(item) {
  const ex = byId(item.id);
  const unit = ex.type === 'time' ? '秒' : '下';
  return `${ex.perSide ? '每邊 ' : ''}${item.amount} ${unit}`;
}
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const minutesText = s => `${Math.max(1, Math.round(s / 60))} 分鐘`;

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove('show'), 2600);
}

function go(v) {
  view = v;
  render();
  window.scrollTo(0, 0);
}

function ensurePlan() {
  const d = today();
  if (!state.plan || state.plan.date !== d || state.plan.safetyVersion !== SAFETY_VERSION) {
    state.plan = generatePlan(state, d, 0);
    commit();
  }
  return state.plan;
}

// ---------- 音效、語音、螢幕常亮 ----------
let actx = null;
function unlockAudio() {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    actx.resume();
  } catch { /* 不支援就略過 */ }
}
function beep(freq = 880, dur = 0.12) {
  if (!state.settings.sound || !actx) return;
  try {
    const o = actx.createOscillator(), g = actx.createGain();
    o.frequency.value = freq;
    o.connect(g); g.connect(actx.destination);
    g.gain.setValueAtTime(0.25, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
    o.start(); o.stop(actx.currentTime + dur);
  } catch { /* 略過 */ }
}
function say(text) {
  if (!state.settings.voice || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-TW'; u.rate = 1.05;
    speechSynthesis.speak(u);
  } catch { /* 略過 */ }
}
let wakeLock = null;
async function requestWakeLock() {
  try { wakeLock = await navigator.wakeLock?.request('screen'); } catch { /* 略過 */ }
}
function releaseWakeLock() {
  try { wakeLock?.release(); } catch { /* 略過 */ }
  wakeLock = null;
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && session && view === 'player') requestWakeLock();
});

// ======================================================
// 畫面
// ======================================================
function render() {
  app.classList.toggle('full', ['player', 'summary', 'feedback', 'onboarding'].includes(view));
  const views = { onboarding, home, history, settings, player, summary, feedback };
  stopFigure();
  app.innerHTML = (views[view] || home)();
  if (['home', 'history', 'settings'].includes(view)) app.insertAdjacentHTML('beforeend', tabbar());
  if (view === 'player') {
    const step = curStep();
    const showId = step.kind === 'exercise' ? step.id : session.steps.slice(session.idx + 1).find(x => x.kind === 'exercise')?.id;
    if (showId) stopFigure = animateFigure(document.getElementById('fig'), showId);
    updateTimer();
  }
}

let stopFigure = () => {};

function tabbar() {
  const t = (v, i, l) => `<button data-action="tab" data-v="${v}" class="${view === v ? 'on' : ''}"><span class="i">${i}</span>${l}</button>`;
  return `<nav class="tabbar"><div class="inner">${t('home', '🏠', '今天')}${t('history', '📅', '紀錄')}${t('settings', '⚙️', '設定')}</div></nav>`;
}

// ---------- 個人資料 ----------
function onboarding() {
  const p = state.profile || { sex: 'female', level: 1, goal: 'fat', minutes: 20, injuries: [] };
  const editing = !!state.profile;
  const radio = (name, val, label, cur) =>
    `<label class="chip"><input type="radio" name="${name}" value="${val}" ${String(cur) === String(val) ? 'checked' : ''} required><span>${label}</span></label>`;
  const check = (name, val, label, list) =>
    `<label class="chip"><input type="checkbox" name="${name}" value="${val}" ${list.includes(val) ? 'checked' : ''}><span>${label}</span></label>`;
  return `
  ${editing ? '<button class="btn ghost sm" data-action="tab" data-v="settings">‹ 返回</button>' : ''}
  <h1>${editing ? '編輯個人資料' : '歡迎！先認識一下你 👋'}</h1>
  <p class="muted">${editing ? '修改後會重新安排今天的課表。' : '教練會依照這些資料幫你安排每天的居家徒手運動。'}</p>
  <form id="profile-form" class="card">
    <label class="field"><span>暱稱</span><input type="text" name="name" value="${esc(p.name)}" maxlength="20" placeholder="例如：小明" required></label>
    <div class="fieldset-title">性別（用於估算熱量）</div>
    <div class="chips">${radio('sex', 'female', '女', p.sex)}${radio('sex', 'male', '男', p.sex)}</div>
    <div class="grid3" style="margin-top:14px">
      <label class="field"><span>年齡</span><input type="number" name="age" inputmode="numeric" min="10" max="99" value="${p.age ?? ''}" required></label>
      <label class="field"><span>身高 cm</span><input type="number" name="height" inputmode="decimal" min="100" max="230" step="0.1" value="${p.height ?? ''}" required></label>
      <label class="field"><span>體重 kg</span><input type="number" name="weight" inputmode="decimal" min="25" max="250" step="0.1" value="${p.weight ?? ''}" required></label>
    </div>
    <div class="fieldset-title">目前的運動習慣</div>
    <div class="chips">${Object.entries(LEVELS).map(([v, l]) => radio('level', v, l, p.level)).join('')}</div>
    <div class="fieldset-title">主要目標</div>
    <div class="chips">${Object.entries(GOALS).map(([v, l]) => radio('goal', v, l, p.goal)).join('')}</div>
    <p class="muted small" style="margin:6px 0 0">「改善體態」以核心穩定、臀部與上背訓練為主，搭配髖屈肌與胸口伸展，並自動避開對下背負擔大的動作。</p>
    <div class="fieldset-title">每天想運動多久</div>
    <div class="chips">${[10, 15, 20, 30, 45].map(m => radio('minutes', m, `${m} 分鐘`, p.minutes)).join('')}</div>
    <div class="fieldset-title">有沒有容易不舒服的部位？</div>
    <p class="muted small" style="margin:0 0 8px">勾選後會避開對該部位負擔大的動作</p>
    <div class="chips">${Object.entries(INJURIES).map(([v, l]) => check('injuries', v, l, p.injuries || [])).join('')}</div>
    <button class="btn primary block big" style="margin-top:22px">${editing ? '儲存' : '開始我的計畫 🚀'}</button>
  </form>
  <p class="muted small center">若有心血管疾病、懷孕或正在復健，請先諮詢醫師。</p>`;
}

function saveProfile(form) {
  const f = new FormData(form);
  const prev = state.profile;
  const profile = {
    name: f.get('name').trim(),
    sex: f.get('sex'),
    age: Number(f.get('age')),
    height: Number(f.get('height')),
    weight: Number(f.get('weight')),
    level: Number(f.get('level')),
    goal: f.get('goal'),
    minutes: Number(f.get('minutes')),
    injuries: f.getAll('injuries'),
  };
  if (!prev || prev.level !== profile.level) state.adapt = { factor: 1, level: profile.level, familyAdj: {} };
  state.profile = profile;
  state.plan = null;
  commit();
  toast(prev ? '已儲存' : `${profile.name}，我們開始吧！`);
  go('home');
}

// ---------- 首頁 ----------
function home() {
  const p = state.profile;
  const d = today();
  const streak = currentStreak(state);
  const doneToday = dayStatus(state, d) === 'done';
  const next = nextMilestone(streak);
  const prevM = [...MILESTONES].reverse().find(m => m <= streak) || 0;
  const pct = next ? Math.round(((streak - prevM) / (next - prevM)) * 100) : 100;

  const mondayOffset = (new Date().getDay() + 6) % 7;
  const week = WEEK.map((w, i) => {
    const day = addDays(d, i - mondayOffset);
    const st = dayStatus(state, day);
    const icon = st === 'done' ? '🔥' : st === 'frozen' ? '🧊' : '';
    return `<div class="d ${day === d ? 'today' : ''}"><div class="dot ${st}">${icon}</div>${w}</div>`;
  }).join('');

  const hello = new Date().getHours() < 11 ? '早安' : new Date().getHours() < 18 ? '午安' : '晚安';
  let freezeNote = '';
  if (freezeMsg > 0) freezeNote = `<div class="notice">🧊 你錯過了 ${freezeMsg} 天，已自動使用連勝凍結，連勝保住了！</div>`;
  else if (freezeMsg < 0) freezeNote = '<div class="notice warn">連勝中斷了，沒關係，今天重新開始 💪</div>';

  const todayEntries = state.history.filter(h => h.date === d);
  const pending = todayEntries.find(h => !h.feedback);
  const kToday = kcalOn(state, d);
  const base = bmr(p);
  const nudge = !doneToday && streak > 0 ? `<p class="small" style="margin:8px 0 0">今天還沒運動，別讓 ${streak} 天連勝斷掉！</p>` : '';

  return `
  <div class="row between"><div><div class="muted small">${d.replaceAll('-', '/')}</div><h1>${hello}，${esc(p.name)}</h1></div></div>
  ${freezeNote}
  <section class="card streak-card">
    <div class="flame ${streak ? '' : 'off'}">🔥</div>
    <div class="num">${streak}</div>
    <div class="sub">天連勝</div>
    <div class="row" style="justify-content:center;margin-top:8px">
      <span class="pill">🧊 凍結 ${state.streak.freezes}/${MAX_FREEZES}</span>
      ${next ? `<span class="pill">${BADGE_EMOJI[next]} 再 ${next - streak} 天解鎖 ${next} 天徽章</span>` : '<span class="pill">👑 所有徽章已解鎖</span>'}
    </div>
    <div class="progress" style="margin-top:10px"><i style="width:${pct}%"></i></div>
    <div class="week">${week}</div>
    ${nudge}
  </section>
  ${doneToday ? doneCard(todayEntries, pending) : planCard()}
  <section class="card">
    <h2>🔥 今日熱量</h2>
    <div class="stats">
      <div><div class="v">${kToday}</div><div class="l">運動消耗 kcal</div></div>
      <div><div class="v">${base}</div><div class="l">基礎代謝 kcal</div></div>
      <div><div class="v">${Math.round(base * 1.2) + kToday}</div><div class="l">估計全天消耗</div></div>
    </div>
    <p class="muted small" style="margin:10px 0 0">全天消耗＝基礎代謝 × 1.2（日常活動）＋ 運動消耗，皆為估算值。</p>
  </section>`;
}

function planCard() {
  const plan = ensurePlan();
  const row = (i, label) => {
    const ex = byId(i.id);
    return `<li data-action="preview" data-id="${ex.id}"><div class="ex-thumb">${figureStatic(ex.id)}</div><div class="grow"><div><b>${ex.name}</b></div><div class="muted small">${label || AREA_NAMES[ex.area]}・${fmtAmount(i)}</div></div><span class="muted">›</span></li>`;
  };
  const items = plan.main.map(i => row(i)).join('');
  const extra = [...plan.warmup.map(i => row(i, '暖身')), ...plan.cooldown.map(i => row(i, '伸展'))].join('');
  return `
  <section class="card">
    <div class="row between"><h2 style="margin:0">今天的課表</h2><span class="tag">${plan.focus}</span></div>
    <p class="muted small" style="margin:6px 0 4px">約 ${minutesText(plan.estSec)}・約 ${plan.estKcal} kcal・暖身 → 主訓練 ${plan.rounds} 輪 → 伸展</p>
    <ul class="ex-list">${items}</ul>
    <details class="more"><summary class="small muted">暖身與伸展（${plan.warmup.length + plan.cooldown.length} 個動作）</summary><ul class="ex-list">${extra}</ul></details>
    <p class="muted small" style="margin:6px 0 0">點動作可以看動畫示範</p>
    <button class="btn primary block big" data-action="start" style="margin-top:12px">開始運動</button>
    <button class="btn ghost block sm" data-action="reroll" style="margin-top:6px">🔄 換一組動作</button>
  </section>`;
}

function doneCard(entries, pending) {
  const kcal = entries.reduce((s, e) => s + e.kcal, 0);
  const sec = entries.reduce((s, e) => s + e.durationSec, 0);
  return `
  <section class="card done-card">
    <h2>✅ 今天完成了！</h2>
    <div class="stats">
      <div><div class="v">${minutesText(sec).replace(' 分鐘', '')}</div><div class="l">分鐘</div></div>
      <div><div class="v">${Math.round(kcal)}</div><div class="l">kcal</div></div>
      <div><div class="v">${entries.length}</div><div class="l">次訓練</div></div>
    </div>
    ${pending ? `<button class="btn primary block" data-action="feedback" data-id="${pending.id}" style="margin-top:14px">📝 填寫今天的感受</button>` : '<p class="small center" style="margin:12px 0 0">明天見！教練已依你的回饋調整明天的課表 👍</p>'}
    <button class="btn ghost block sm" data-action="start" style="margin-top:6px">想再練一次</button>
  </section>`;
}

// ---------- 運動播放器 ----------
function startWorkout() {
  const plan = ensurePlan();
  unlockAudio();
  requestWakeLock();
  session = {
    plan, steps: buildSteps(plan), idx: -1,
    log: [], restSec: 0, paused: false, pauseAt: 0, pausedMs: 0,
    stepStart: 0, lastBeep: null, sideAnnounced: false,
  };
  view = 'player';
  nextStep();
  clearInterval(session.tick);
  session.tick = setInterval(updateTimer, 250);
}

const curStep = () => session.steps[session.idx];

function stepDuration(step) {
  if (step.kind === 'rest') return step.secs;
  const ex = byId(step.id);
  return ex.type === 'time' ? step.amount * (ex.perSide ? 2 : 1) : null;
}

function elapsedSec() {
  const now = session.paused ? session.pauseAt : Date.now();
  return (now - session.stepStart - session.pausedMs) / 1000;
}

function nextStep(status = 'done') {
  if (session.idx >= 0) {
    const step = curStep();
    // 手機鎖屏時計時器可能延後觸發，記錄的秒數不超過該步驟應有長度
    const dur = stepDuration(step);
    const cap = dur ?? Math.max(60, workSeconds(step) * 3);
    const sec = Math.min(Math.round(elapsedSec()), cap);
    if (step.kind === 'exercise') session.log.push({ id: step.id, phase: step.phase, round: step.round, status, sec });
    else session.restSec += sec;
  }
  session.idx += 1;
  session.paused = false;
  session.pausedMs = 0;
  session.lastBeep = null;
  session.sideAnnounced = false;
  if (session.idx >= session.steps.length) return finishWorkout(false);
  session.stepStart = Date.now();
  const step = curStep();
  if (step.kind === 'rest') {
    const nxt = session.steps[session.idx + 1];
    say(`${step.label}。下一個，${nxt ? byId(nxt.id).name : ''}`);
  } else {
    const ex = byId(step.id);
    beep(660, 0.15);
    say(`${ex.name}，${fmtAmount(step)}`);
  }
  render();
}

function updateTimer() {
  if (!session || view !== 'player') return;
  const step = curStep();
  if (!step) return;
  const el = elapsedSec();
  const dur = stepDuration(step);
  const timer = document.getElementById('timer');
  if (dur == null) {
    if (timer) timer.textContent = mmss(el);
    return;
  }
  const remain = Math.max(0, dur - el);
  if (timer) timer.textContent = mmss(Math.ceil(remain));
  if (session.paused) return;
  const sec = Math.ceil(remain);
  if (sec <= 3 && sec >= 1 && session.lastBeep !== sec) {
    session.lastBeep = sec;
    beep(880, 0.1);
  }
  if (step.kind === 'exercise' && byId(step.id).perSide && !session.sideAnnounced && el >= dur / 2) {
    session.sideAnnounced = true;
    beep(520, 0.2);
    say('換邊');
  }
  if (remain <= 0) {
    beep(1046, 0.3);
    nextStep('done');
  }
}

function togglePause() {
  if (session.paused) {
    session.pausedMs += Date.now() - session.pauseAt;
    session.paused = false;
  } else {
    session.paused = true;
    session.pauseAt = Date.now();
    window.speechSynthesis?.cancel();
  }
  render();
}

function player() {
  const s = session;
  const step = curStep();
  const pct = Math.round((s.idx / s.steps.length) * 100);
  const totalRounds = s.plan.rounds;
  const phase = step.kind === 'rest' ? '休息' :
    step.phase === 'warmup' ? '暖身' : step.phase === 'cooldown' ? '伸展放鬆' : `主訓練 第 ${step.round}/${totalRounds} 輪`;
  const nextEx = s.steps.slice(s.idx + 1).find(x => x.kind === 'exercise');
  const pauseBtn = `<button class="btn" data-action="pause">${s.paused ? '▶️ 繼續' : '⏸ 暫停'}</button>`;

  let body;
  if (step.kind === 'rest') {
    const ex = nextEx ? byId(nextEx.id) : null;
    body = `
      <div class="name">${esc(step.label)}</div>
      <div class="timer rest" id="timer">--</div>
      ${ex ? `<div class="next">下一個：<b>${ex.name}</b>・${fmtAmount(nextEx)}</div><div class="fig-wrap small-fig" id="fig"></div>` : ''}
      <div class="actions" style="width:100%">
        <div class="row"><button class="btn" data-action="add10">＋10 秒</button>${pauseBtn}</div>
        <button class="btn primary block" data-action="next">跳過休息 ⏭</button>
      </div>`;
  } else {
    const ex = byId(step.id);
    const isTime = ex.type === 'time';
    body = `
      <div class="fig-wrap" id="fig"></div>
      <div class="name">${ex.name}</div>
      <div class="row" style="justify-content:center;gap:16px"><div class="target">${fmtAmount(step)}</div><div class="timer" id="timer">--</div></div>
      <div class="actions" style="width:100%">
        ${isTime ? '' : '<button class="btn ok block big" data-action="next">✓ 完成</button>'}
        <div class="row">${pauseBtn}<button class="btn" data-action="skip">跳過</button></div>
      </div>
      <ul class="tips">${ex.tips.map(t => `<li>${t}</li>`).join('')}</ul>
      <p class="notice small">${STOP_MESSAGE}</p>
      ${nextEx ? `<div class="next small">接下來：${byId(nextEx.id).name}</div>` : ''}`;
  }
  return `
  <div class="player ${s.paused ? 'paused' : ''}">
    <div class="top">
      <button class="icon-btn" data-action="quit" aria-label="結束">✕</button>
      <div class="progress"><i style="width:${pct}%"></i></div>
    </div>
    <div class="center muted small" style="margin-top:-8px;margin-bottom:8px">${phase}</div>
    <div class="body">${body}</div>
  </div>`;
}

function finishWorkout(early) {
  const s = session;
  clearInterval(s.tick);
  if (early && s.idx >= 0 && s.idx < s.steps.length) {
    const step = curStep();
    if (step.kind === 'exercise') {
      const sec = Math.min(Math.round(elapsedSec()), stepDuration(step) ?? 300);
      s.log.push({ id: step.id, phase: step.phase, round: step.round, status: sec >= 10 ? 'done' : 'skipped', sec });
    }
  }
  releaseWakeLock();
  window.speechSynthesis?.cancel();
  session = null;

  const w = state.profile.weight;
  const done = s.log.filter(l => l.status === 'done');
  const mainTotal = s.steps.filter(x => x.kind === 'exercise' && x.phase === 'main').length;
  const mainDone = done.filter(l => l.phase === 'main').length;
  if (!done.length) {
    toast('這次沒有完成任何動作，所以不會記錄');
    return go('home');
  }
  const kcal = done.reduce((sum, l) => sum + kcalFor(byId(l.id).met, w, l.sec), 0) + kcalFor(2, w, s.restSec);
  const counted = mainDone >= Math.ceil(mainTotal / 2);
  const before = currentStreak(state);
  const entry = {
    id: Date.now(),
    date: today(),
    focus: s.plan.focus,
    durationSec: s.log.reduce((sum, l) => sum + l.sec, 0) + s.restSec,
    kcal: Math.round(kcal),
    counted,
    mainDone, mainTotal,
    exercises: s.log,
    feedback: null,
  };
  state.history.push(entry);
  const after = currentStreak(state);
  const freezeAwarded = counted && awardFreeze(state);
  freezeMsg = 0;
  commit();
  lastResult = { entry, before, after, freezeAwarded, milestone: after > before && MILESTONES.includes(after) ? after : null };
  if (counted) say(after > before ? `太棒了！連勝 ${after} 天` : '太棒了，今天也完成了');
  go('summary');
}

function summary() {
  const { entry, before, after, freezeAwarded, milestone } = lastResult;
  const up = after > before;
  return `
  <div class="celebrate">
    <div class="flame">${entry.counted ? '🔥' : '👏'}</div>
    ${entry.counted
      ? `<div class="num">${after} 天連勝</div><p class="muted">${up ? (after === 1 ? '連勝開始了！明天繼續！' : '連勝 +1，繼續保持！') : '今天的連勝已經算過囉，多練的部分也記錄下來了。'}</p>`
      : `<h2>有動就有收穫！</h2><p class="muted">這次完成的主訓練不到一半（${entry.mainDone}/${entry.mainTotal}），熱量已記錄，但還不算今天的連勝。</p>`}
  </div>
  ${milestone ? `<div class="notice ok center">${BADGE_EMOJI[milestone]} 解鎖「${milestone} 天連勝」徽章！</div>` : ''}
  ${freezeAwarded ? '<div class="notice center">🧊 連續 7 天！獲得 1 個連勝凍結，哪天沒空運動會自動幫你保住連勝。</div>' : ''}
  <section class="card">
    <div class="stats">
      <div><div class="v">${mmss(entry.durationSec)}</div><div class="l">運動時間</div></div>
      <div><div class="v">${entry.kcal}</div><div class="l">消耗 kcal</div></div>
      <div><div class="v">${entry.exercises.filter(e => e.status === 'done').length}</div><div class="l">完成動作</div></div>
    </div>
  </section>
  <button class="btn primary block big" data-action="feedback" data-id="${entry.id}">📝 告訴教練今天的感受</button>
  <button class="btn ghost block" data-action="tab" data-v="home" style="margin-top:8px">稍後再填</button>`;
}

// ---------- 運動後回饋 ----------
function feedback() {
  const entry = state.history.find(h => h.id === feedbackFor);
  if (!entry) return home();
  if (entry.feedback && feedbackNotes) {
    return `
    <div class="celebrate"><div class="flame">🙌</div><h2>謝謝回饋！</h2></div>
    <section class="card">
      <h3>教練的調整</h3>
      ${feedbackNotes.length ? feedbackNotes.map(n => `<div class="notice ok">${n}</div>`).join('') : '<p class="muted">維持目前的強度，繼續保持！</p>'}
    </section>
    <button class="btn primary block big" data-action="tab" data-v="home">回首頁</button>`;
  }
  const mainIds = [...new Set(entry.exercises.filter(e => e.phase === 'main').map(e => e.id))];
  const rpeLabels = { 1: '超輕鬆', 3: '輕鬆', 5: '剛好', 7: '有點累', 9: '很累', 10: '極限' };
  const chip = (type, name, val, label, req = false) =>
    `<label class="chip"><input type="${type}" name="${name}" value="${val}" ${req ? 'required' : ''}><span>${label}</span></label>`;
  return `
  <button class="btn ghost sm" data-action="tab" data-v="home">‹ 稍後再填</button>
  <h1>今天感覺如何？</h1>
  <p class="muted">你的回答會讓明天的課表更適合你。</p>
  <form id="feedback-form" class="card">
    <div class="fieldset-title" style="margin-top:0">1. 整體強度（1 很輕鬆 → 10 極限）</div>
    <div class="chips rpe">${Array.from({ length: 10 }, (_, i) => chip('radio', 'rpe', i + 1, i + 1, true)).join('')}</div>
    <p class="muted small" id="rpe-label" style="margin:6px 0 0">請選一個數字</p>
    <div class="fieldset-title">2. 心情</div>
    <div class="chips mood">${MOODS.map((m, i) => chip('radio', 'mood', i + 1, m, true)).join('')}</div>
    <div class="fieldset-title">3. 哪裡痠痛或不舒服？</div>
    <div class="chips">${chip('checkbox', 'sore', 'legs', '🦵 腿部')}${chip('checkbox', 'sore', 'upper', '💪 手臂／胸／肩')}${chip('checkbox', 'sore', 'core', '🎯 腹部肌肉')}${chip('checkbox', 'sore', 'back', '下背不舒服')}${chip('checkbox', 'sore', 'none', '都還好')}</div>
    <label class="field"><span><input type="checkbox" name="pain"> 有疼痛、放射痛、麻刺或無力（不是一般肌肉疲勞）</span></label>
    <p class="small muted">若勾選，教練會降低強度。請停止誘發症狀的動作，必要時就醫評估。</p>
    ${mainIds.length ? `
    <div class="fieldset-title">4. 有沒有做不完或做不標準的動作？</div>
    <div class="chips">${mainIds.map(id => chip('checkbox', 'failed', id, byId(id).name)).join('')}</div>` : ''}
    <label class="field" style="margin-top:18px"><span>想對教練說的話（選填）</span><textarea name="note" maxlength="300" placeholder="例如：今天膝蓋有點卡卡的"></textarea></label>
    <button class="btn primary block big">送出</button>
  </form>
  <script type="application/json" id="rpe-labels">${JSON.stringify(rpeLabels)}</script>`;
}

function saveFeedback(form) {
  const f = new FormData(form);
  const entry = state.history.find(h => h.id === feedbackFor);
  if (!entry) return go('home');
  const fb = {
    rpe: Number(f.get('rpe')),
    pain: f.get('pain') === 'on',
    mood: Number(f.get('mood')),
    sore: f.getAll('sore').filter((v, _, all) => v !== 'none' || all.length === 1),
    failed: f.getAll('failed'),
    note: (f.get('note') || '').trim(),
  };
  entry.feedback = fb;
  const count = state.history.filter(h => h.counted).length;
  feedbackNotes = applyFeedback(state, fb, count);
  if (fb.note) feedbackNotes.push('已記下你的備註，可以在「紀錄」頁回顧');
  state.plan = null;
  commit();
  render();
  window.scrollTo(0, 0);
}

// ---------- 紀錄 ----------
function history() {
  const d = today();
  const streak = currentStreak(state);
  const best = bestStreak(state);
  const days = new Set(state.history.filter(h => h.counted).map(h => h.date)).size;
  const total = state.history.reduce((s, h) => s + h.kcal, 0);

  const last7 = Array.from({ length: 7 }, (_, i) => addDays(d, i - 6));
  const vals = last7.map(x => kcalOn(state, x));
  const max = Math.max(50, ...vals);
  const bars = last7.map((x, i) => {
    const wd = WEEK[(parseDate(x).getDay() + 6) % 7];
    return `<div class="b"><span class="v">${vals[i] || ''}</span><i style="height:${(vals[i] / max) * 100}%"></i>${wd}</div>`;
  }).join('');

  const y = calMonth.getFullYear(), m = calMonth.getMonth();
  const first = new Date(y, m, 1);
  const lead = (first.getDay() + 6) % 7;
  const nDays = new Date(y, m + 1, 0).getDate();
  let cells = WEEK.map(w => `<div class="h">${w}</div>`).join('') + '<div></div>'.repeat(lead);
  for (let i = 1; i <= nDays; i++) {
    const ds = dateStr(new Date(y, m, i));
    cells += `<div class="c ${dayStatus(state, ds)} ${ds === d ? 'today' : ''}">${i}</div>`;
  }

  const badges = MILESTONES.map(ms =>
    `<div class="badge ${best >= ms ? '' : 'off'}"><div class="e">${BADGE_EMOJI[ms]}</div><div class="t">${ms} 天</div></div>`).join('');

  const list = [...state.history].reverse().slice(0, 30).map(h => {
    const fb = h.feedback;
    return `<div class="hist-item">
      <div class="row between"><b>${h.date.replaceAll('-', '/')}・${esc(h.focus)}</b>${fb ? `<span>${MOODS[fb.mood - 1] || ''}</span>` : ''}</div>
      <div class="muted small">${mmss(h.durationSec)}・${h.kcal} kcal${fb ? `・強度 ${fb.rpe}/10` : '・未填感受'}${h.counted ? '' : '・未計入連勝'}</div>
      ${fb?.note ? `<div class="small">💬 ${esc(fb.note)}</div>` : ''}
      ${!fb ? `<button class="btn sm" data-action="feedback" data-id="${h.id}" style="margin-top:6px">補填感受</button>` : ''}
    </div>`;
  }).join('');

  return `
  <h1>紀錄</h1>
  <section class="card">
    <div class="stats" style="grid-template-columns:repeat(4,1fr)">
      <div><div class="v">${streak}</div><div class="l">目前連勝</div></div>
      <div><div class="v">${best}</div><div class="l">最長連勝</div></div>
      <div><div class="v">${days}</div><div class="l">運動天數</div></div>
      <div><div class="v">${Math.round(total)}</div><div class="l">總 kcal</div></div>
    </div>
  </section>
  <section class="card"><h2>近 7 天消耗（kcal）</h2><div class="bars">${bars}</div></section>
  <section class="card">
    <div class="row between" style="margin-bottom:10px">
      <button class="btn sm" data-action="cal" data-d="-1" aria-label="上個月">‹</button>
      <h2 style="margin:0">${y} 年 ${m + 1} 月</h2>
      <button class="btn sm" data-action="cal" data-d="1" aria-label="下個月">›</button>
    </div>
    <div class="cal">${cells}</div>
    <p class="muted small" style="margin:8px 0 0">橘色＝有運動　藍色＝用了連勝凍結</p>
  </section>
  <section class="card"><h2>徽章</h2><div class="badges">${badges}</div></section>
  <section class="card"><h2>運動日誌</h2>${list || '<p class="muted">還沒有紀錄，今天就開始吧！</p>'}</section>`;
}

// ---------- 設定 ----------
function settings() {
  const p = state.profile;
  const a = state.adapt;
  return `
  <h1>設定</h1>
  <section class="card">
    <div class="row between"><h2 style="margin:0">個人資料</h2><button class="btn sm" data-action="edit-profile">編輯</button></div>
    <p class="small" style="margin:10px 0 0">${esc(p.name)}・${p.sex === 'male' ? '男' : '女'}・${p.age} 歲・${p.height} cm・${p.weight} kg<br>
    目標：${GOALS[p.goal]}・每天 ${p.minutes} 分鐘<br>
    避開部位：${p.injuries.length ? p.injuries.map(i => INJURIES[i]).join('、') : '無'}</p>
  </section>
  <section class="card">
    <h2>教練調整狀態</h2>
    <p class="small" style="margin:0">目前動作難度：<b>${LEVELS[a.level || p.level]}</b>（等級 ${a.level || p.level}/3）<br>
    強度倍率：<b>${Math.round(a.factor * 100)}%</b>（依你的回饋自動調整）</p>
    <button class="btn sm" data-action="reset-adapt" style="margin-top:10px">重設為預設強度</button>
  </section>
  <section class="card">
    <h2>運動中提示</h2>
    <label class="switch"><span>🔊 嗶聲倒數</span><input type="checkbox" data-setting="sound" ${state.settings.sound ? 'checked' : ''}></label>
    <label class="switch"><span>🗣 語音報動作名稱</span><input type="checkbox" data-setting="voice" ${state.settings.voice ? 'checked' : ''}></label>
  </section>
  <section class="card">
    <h2>每日提醒</h2>
    <p class="muted small" style="margin:0">推播提醒需要先把 APP 放上網並加入 iPhone 主畫面，下一階段會設定。</p>
  </section>
  <section class="card">
    <h2>資料備份</h2>
    <p class="muted small" style="margin:0 0 10px">資料只存在這台裝置上。換手機前記得先匯出備份。</p>
    <div class="row"><button class="btn grow" data-action="export">⬇️ 匯出備份</button><button class="btn grow" data-action="import">⬆️ 匯入備份</button></div>
    <input type="file" id="import-file" accept="application/json,.json" class="hidden">
  </section>
  <section class="card">
    <button class="btn danger block" data-action="reset-all">清除所有資料</button>
  </section>
  <p class="muted small center">熱量為依 MET 公式的估算值。運動中若感到疼痛、頭暈或胸悶，請立即停止。</p>`;
}

async function exportData() {
  const json = JSON.stringify(state, null, 2);
  const name = `居家運動備份-${today()}.json`;
  const file = new File([json], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || !Array.isArray(data.history) || !data.profile) throw new Error('格式不對');
      if (!confirm(`要用備份覆蓋目前的資料嗎？（備份內有 ${data.history.length} 筆紀錄）`)) return;
      localStorage.setItem('homefit.v1', JSON.stringify(data));
      state = load();
      toast('已匯入備份');
      go('home');
    } catch {
      toast('這不是有效的備份檔');
    }
  };
  reader.readAsText(file);
}

// ---------- 動作預覽 ----------
const sheet = document.createElement('div');
sheet.className = 'sheet hidden';
document.body.appendChild(sheet);
let stopPreview = () => {};
function openPreview(id) {
  const ex = byId(id);
  sheet.innerHTML = `<div class="sheet-panel" role="dialog" aria-label="${ex.name}">
    <div class="row between"><h2 style="margin:0">${ex.name}</h2><button class="icon-btn" data-close aria-label="關閉">✕</button></div>
    <div class="fig-wrap" id="preview-fig"></div>
    <span class="tag">${AREA_NAMES[ex.area]}</span>
    <ul class="tips">${ex.tips.map(t => `<li>${t}</li>`).join('')}</ul>
    <p class="notice small">${STOP_MESSAGE}</p>
    <p class="muted small">${ex.safety.decision} · ${ex.safety.evidence}</p>
  </div>`;
  sheet.classList.remove('hidden');
  stopPreview = animateFigure(sheet.querySelector('#preview-fig'), id);
}
sheet.addEventListener('click', e => {
  if (e.target === sheet || e.target.closest('[data-close]')) {
    stopPreview();
    sheet.classList.add('hidden');
  }
});

// ======================================================
// 事件
// ======================================================
app.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const act = el.dataset.action;
  switch (act) {
    case 'tab': freezeMsg = 0; go(el.dataset.v); break;
    case 'start': startWorkout(); break;
    case 'reroll': {
      const v = (state.plan?.variant || 0) + 1;
      state.plan = generatePlan(state, today(), v);
      commit(); render(); toast('換了一組新動作');
      break;
    }
    case 'preview': openPreview(el.dataset.id); break;
    case 'next': nextStep('done'); break;
    case 'skip': nextStep('skipped'); break;
    case 'pause': togglePause(); break;
    case 'add10': curStep().secs += 10; updateTimer(); break;
    case 'quit':
      if (confirm('要提前結束今天的運動嗎？已完成的部分會被記錄。')) finishWorkout(true);
      break;
    case 'feedback':
      feedbackFor = Number(el.dataset.id);
      feedbackNotes = null;
      go('feedback');
      break;
    case 'cal':
      calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + Number(el.dataset.d), 1);
      render();
      break;
    case 'edit-profile': go('onboarding'); break;
    case 'reset-adapt':
      if (confirm('要把難度與強度重設為個人資料的預設值嗎？')) {
        state.adapt = { factor: 1, level: state.profile.level, familyAdj: {} };
        state.plan = null; commit(); render(); toast('已重設');
      }
      break;
    case 'export': exportData(); break;
    case 'import': document.getElementById('import-file').click(); break;
    case 'reset-all':
      if (confirm('確定要清除所有資料嗎？連勝和紀錄都會消失，無法復原。') && confirm('真的確定嗎？')) {
        state = defaultState(); commit(); go('onboarding');
      }
      break;
  }
});

app.addEventListener('submit', e => {
  e.preventDefault();
  if (e.target.id === 'profile-form') saveProfile(e.target);
  if (e.target.id === 'feedback-form') saveFeedback(e.target);
});

app.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.setting) {
    state.settings[t.dataset.setting] = t.checked;
    commit();
  }
  if (t.id === 'import-file' && t.files[0]) importData(t.files[0]);
  if (t.name === 'rpe') {
    const labels = JSON.parse(document.getElementById('rpe-labels').textContent);
    const v = Number(t.value);
    const key = Object.keys(labels).map(Number).filter(k => k <= v).pop();
    document.getElementById('rpe-label').textContent = `${v} 分：${labels[key]}`;
  }
  if (t.name === 'sore' && t.checked) {
    // 「都還好」與其他部位互斥
    const boxes = app.querySelectorAll('input[name=sore]');
    boxes.forEach(b => { if (t.value === 'none' ? b !== t : b.value === 'none') b.checked = false; });
  }
});

// ---------- 啟動 ----------
if (state.profile) {
  freezeMsg = applyFreezes(state);
  commit();
}
render();

// 每天第一次打開或從背景回來時，日期可能已經換了
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && state.profile && view === 'home') {
    freezeMsg = applyFreezes(state) || freezeMsg;
    commit();
    render();
  }
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  // 有新版時自動重新整理一次（運動中不打斷）
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !session) location.reload();
  });
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
navigator.storage?.persist?.();
