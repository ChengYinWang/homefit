// 服裝人物插畫：共用關節動畫、身體輪廓、鞋子、臉部與動作方向提示。
//
// 角度一律是「絕對方向」：0 = 朝下、90 = 朝前（畫面右邊）、180 = 朝上、-90 = 朝後（畫面左邊）
// t 軀幹（髖 → 肩）、hd 頭、ua/la 上臂/前臂、th/sh 大腿/小腿、ft 腳掌；1 = 近側（正面圖為右側）、2 = 遠側
// bend 脊椎彎曲（+ 拱背、- 塌腰）、hx 水平位移、lift 離地高度
// view: side 側面、front 正面、top 俯視（不畫地板）

const LEN = { torso: 50, neck: 9, head: 9, ua: 27, la: 25, th: 40, sh: 38, ft: 10 };
const W = 240, H = 180, GROUND = 166;

const BASE = { sl: 1, t: 180, hd: null, bend: 0, ua1: 8, la1: 18, ua2: -4, la2: 6, th1: 2, sh1: 0, th2: -2, sh2: 0, ft1: null, ft2: null, hx: 0, lift: 0 };
const FBASE = { ...BASE, ua1: 12, la1: 8, ua2: -12, la2: -8, th1: 5, sh1: 2, th2: -5, sh2: -2 };
const P = o => ({ ...BASE, ...o });
const F = o => ({ ...FBASE, ...o });

// ---------- 常用姿勢 ----------
const STAND = P({});
const SQUAT = P({ t: 145, hd: 160, th1: 95, sh1: -18, th2: 93, sh2: -20, ua1: 88, la1: 90, ua2: 84, la2: 88 });
const LUNGE = P({ th1: 88, sh1: -4, th2: -30, sh2: -85, ua1: 5, la1: 12, ua2: -6, la2: 2 });
const LUNGE_B = P({ th2: 88, sh2: -4, th1: -30, sh1: -85, ua1: 5, la1: 12, ua2: -6, la2: 2 });
const QUAD = P({ t: 106, hd: 100, ua1: 0, la1: 0, ua2: 2, la2: 2, th1: 0, sh1: -90, th2: 2, sh2: -90, ft1: -90, ft2: -90 });
const PLANK_HI = P({ t: 115, hd: 112, ua1: 0, la1: 0, ua2: 2, la2: 2, th1: -65, sh1: -65, th2: -65, sh2: -65, ft1: 15, ft2: 15 });
const PLANK_LO = P({ t: 98, hd: 96, ua1: -100, la1: 66, ua2: -98, la2: 66, th1: -82, sh1: -82, th2: -82, sh2: -82, ft1: 5, ft2: 5 });
const PLANK_ARM = P({ t: 103, hd: 100, ua1: 0, la1: 90, ua2: 2, la2: 90, th1: -77, sh1: -77, th2: -77, sh2: -77, ft1: 100, ft2: 100 });
const KNEE_PLANK = P({ t: 108, hd: 105, ua1: 0, la1: 90, ua2: 2, la2: 90, th1: -72, sh1: -90, th2: -72, sh2: -90, ft1: -90, ft2: -90 });
const KPUSH_TOP = P({ t: 127, hd: 122, ua1: 0, la1: 0, ua2: 2, la2: 2, th1: -53, sh1: -90, th2: -53, sh2: -90, ft1: -90, ft2: -90 });
const KPUSH_LO = P({ t: 102, hd: 100, ua1: -100, la1: 66, ua2: -98, la2: 66, th1: -78, sh1: -90, th2: -78, sh2: -90, ft1: -90, ft2: -90 });
// 仰躺（頭在左）
const SUPINE = P({ t: -90, hd: -90, ua1: 90, la1: 90, ua2: 90, la2: 90, th1: 130, sh1: 0, th2: 128, sh2: 2 });
const SUPINE_FLAT = P({ t: -90, hd: -90, ua1: 90, la1: 90, ua2: 90, la2: 90, th1: 90, sh1: 90, th2: 90, sh2: 90 });
const BRIDGE = P({ t: -70, hd: -80, ua1: 90, la1: 90, ua2: 90, la2: 90, th1: 110, sh1: 0, th2: 110, sh2: 2 });
const TABLETOP = P({ t: -90, hd: -90, ua1: 180, la1: 180, ua2: 178, la2: 178, th1: 180, sh1: 90, th2: 178, sh2: 90 });
// 趴姿（頭在右）
const PRONE = P({ t: 90, hd: 92, ua1: 95, la1: 95, ua2: 95, la2: 95, th1: -90, sh1: -90, th2: -90, sh2: -90, ft1: -90, ft2: -90 });
// 坐姿（面向右）
const SEATED = P({ t: 175, hd: 175, ua1: 30, la1: 60, ua2: 28, la2: 58, th1: 90, sh1: 90, th2: 90, sh2: 90 });
// 正面
const FSTAND = F({});
const JACK_OUT = F({ th1: 22, sh1: 22, th2: -22, sh2: -22, ua1: 160, la1: 172, ua2: -160, la2: -172 });
const STEP_OUT = F({ th1: 30, sh1: 30, ua1: 150, la1: 168, ua2: -150, la2: -168 });
const STEP_OUT_L = F({ th2: -30, sh2: -30, ua1: 150, la1: 168, ua2: -150, la2: -168 });

const same = (pose, d = {}) => [pose, { ...pose, ...d }];

export const ANIM = {
  // ---------- 暖身 ----------
  march: { frames: [P({ th1: 70, sh1: 0, ua1: -30, la1: -10, ua2: 40, la2: 80 }), P({ th2: 70, sh2: 0, ua2: -30, la2: -10, ua1: 40, la1: 80 })], dur: 450 },
  arm_circle: { view: 'front', frames: [F({ ua1: 75, la1: 75, ua2: -75, la2: -75 }), F({ ua1: 100, la1: 100, ua2: -100, la2: -100 })], dur: 350 },
  hip_circle: { view: 'front', frames: [F({ t: 172, hx: -5, ua1: 40, la1: -40, ua2: -40, la2: 40 }), F({ t: 188, hx: 5, ua1: 40, la1: -40, ua2: -40, la2: 40 })], dur: 700 },
  torso_twist: { view: 'front', frames: [F({ ua1: 85, la1: 90, ua2: 60, la2: 100 }), F({ ua1: -60, la1: -100, ua2: -85, la2: -90 })], dur: 600 },
  cat_cow: { frames: [{ ...QUAD, bend: 12, hd: 45 }, { ...QUAD, bend: -9, hd: 125 }], dur: 1400 },
  warm_jack: { view: 'front', frames: [FSTAND, STEP_OUT, FSTAND, STEP_OUT_L], dur: 450 },
  thoracic_rot: { frames: [{ ...QUAD, ua1: -20, la1: -60, hd: 80 }, { ...QUAD, ua1: 178, la1: 180, hd: 160 }], dur: 1300 },
  chin_tuck: { frames: [P({ hd: 150 }), P({ hd: 186 })], dur: 900, zoom: 1.3 },

  // ---------- 伸展 ----------
  quad_stretch: { frames: same(P({ th1: -8, sh1: -172, ua1: -25, la1: -35, ua2: 90, la2: 95, ft1: -100 }), { ua2: 92 }), dur: 1500, props: [{ type: 'wall', x: 55 }] },
  hamstring_stretch: { frames: [{ ...SEATED, ua1: 80, la1: 85, ua2: 78, la2: 83 }, { ...SEATED, t: 125, hd: 115, ua1: 92, la1: 92, ua2: 90, la2: 90 }], dur: 1600 },
  chest_stretch: { frames: same(P({ ua1: -90, la1: -95, ua2: 0, la2: 5 }), { t: 177 }), dur: 1500, props: [{ type: 'wall', x: -48 }] },
  child_pose: { frames: same(P({ t: 78, hd: 75, bend: 6, th1: 62, sh1: -90, th2: 62, sh2: -90, ua1: 97, la1: 97, ua2: 97, la2: 97, ft1: -90, ft2: -90 }), { t: 84 }), dur: 1600 },
  shoulder_stretch: { view: 'front', frames: same(F({ ua1: -80, la1: -82, ua2: -25, la2: 70 }), { ua1: -85 }), dur: 1500 },
  figure_four: { frames: [{ ...SUPINE, th2: 150, sh2: 60, th1: 115, sh1: -140 }, { ...SUPINE, th2: 165, sh2: 95, th1: 125, sh1: -150 }], dur: 1600 },
  hip_flexor_stretch: { frames: [P({ th1: 88, sh1: 0, th2: -22, sh2: -90, ft2: -90, ua1: 40, la1: -40, ua2: 40, la2: -40 }), P({ hx: 6, th1: 80, sh1: -6, th2: -38, sh2: -90, ft2: -90, ua1: 175, la1: 178, ua2: 172, la2: 176 })], dur: 1600 },

  // ---------- 下半身 ----------
  chair_squat: { frames: [STAND, { ...SQUAT, th1: 85, th2: 83, t: 150 }], dur: 1100, props: [{ type: 'chair', x: -30 }] },
  squat: { frames: [STAND, SQUAT], dur: 1000 },
  jump_squat: { frames: [SQUAT, P({ lift: 18, ua1: 170, la1: 175, ua2: 165, la2: 172, th1: -5, sh1: -10, th2: -8, sh2: -12, ft1: 30, ft2: 30 })], dur: 550 },
  wall_lunge: { frames: [P({ ua1: 95, la1: 100 }), { ...LUNGE, ua1: 95, la1: 100, th1: 85 }], dur: 1100, props: [{ type: 'wall', x: 58 }] },
  reverse_lunge: { frames: [STAND, LUNGE], dur: 1000 },
  jump_lunge: { frames: [LUNGE, P({ lift: 22, th1: 40, sh1: -20, th2: -10, sh2: -60, ua1: 60, ua2: -40 }), LUNGE_B, P({ lift: 22, th2: 40, sh2: -20, th1: -10, sh1: -60, ua2: 60, ua1: -40 })], dur: 380 },
  glute_bridge: { frames: [SUPINE, BRIDGE], dur: 1100 },
  single_bridge: { frames: [{ ...SUPINE, th1: 120, sh1: 120 }, { ...BRIDGE, th1: 110, sh1: 110 }], dur: 1100 },
  bridge_march: { frames: [{ ...BRIDGE, th1: 175, sh1: 90 }, BRIDGE, { ...BRIDGE, th2: 175, sh2: 90 }, BRIDGE], dur: 600 },
  calf_raise: { frames: [STAND, P({ ft1: 30, ft2: 30 })], dur: 700, zoom: 1.1 },
  single_calf: { frames: [P({ th1: -10, sh1: -100 }), P({ th1: -10, sh1: -100, ft2: 30 })], dur: 700, props: [{ type: 'wall', x: 45 }] },
  side_leg_raise: { narrow: true, frames: [P({ t: -90, hd: -110, ua2: -150, la2: -30, ua1: 90, la1: 90, th1: 90, sh1: 90, th2: 90, sh2: 90, ft1: 180, ft2: 180 }), P({ t: -90, hd: -110, ua2: -150, la2: -30, ua1: 90, la1: 90, th1: 125, sh1: 125, th2: 90, sh2: 90, ft1: 215, ft2: 180 })], view: 'front', dur: 900 },
  side_lunge: { view: 'front', frames: [FSTAND, F({ hx: 12, t: 172, th1: 55, sh1: 8, th2: -38, sh2: -38, ua1: 30, la1: 60, ua2: -10, la2: 40 })], dur: 1000 },
  wall_sit: { frames: same(P({ th1: 90, sh1: 0, th2: 88, sh2: 2, ua1: 90, la1: 90, ua2: 88, la2: 88 }), { ua1: 92 }), dur: 1500, props: [{ type: 'wall', x: -11 }] },
  hip_hinge: { frames: [P({ ua1: 20, la1: 160, ua2: 18, la2: 158 }), P({ t: 108, hd: 106, th1: 12, sh1: -10, th2: 10, sh2: -12, ua1: -52, la1: 88, ua2: -54, la2: 86 })], dur: 1300 },

  // ---------- 上半身 ----------
  wall_pushup: { frames: [P({ t: 152, hd: 150, th1: -28, sh1: -28, th2: -28, sh2: -28, ua1: 95, la1: 95, ua2: 93, la2: 93 }), P({ t: 140, hd: 138, th1: -40, sh1: -40, th2: -40, sh2: -40, ua1: 78, la1: 173, ua2: 76, la2: 171 })], dur: 1000, props: [{ type: 'wall', x: 96 }] },
  knee_pushup: { frames: [KPUSH_TOP, KPUSH_LO], dur: 1000 },
  pushup: { frames: [PLANK_HI, PLANK_LO], dur: 1000 },
  ytw: { frames: [{ ...PRONE, ua1: 100, la1: 100, ua2: 100, la2: 100 }, { ...PRONE, hd: 98, ua1: 125, la1: 125, ua2: 123, la2: 123 }], dur: 1000 },
  superman: { frames: [PRONE, { ...PRONE, t: 95, hd: 102, ua1: 115, la1: 115, ua2: 113, la2: 113, th1: -105, sh1: -105, th2: -105, sh2: -105 }], dur: 1000 },
  arm_hold: { view: 'front', frames: [F({ ua1: 84, la1: 84, ua2: -84, la2: -84 }), F({ ua1: 96, la1: 96, ua2: -96, la2: -96 })], dur: 250 },
  chair_dip: { frames: [P({ t: 180, th1: 80, sh1: 2, th2: 80, sh2: 2, ua1: -12, la1: -12, ua2: -10, la2: -10 }), P({ t: 175, th1: 103, sh1: 0, th2: 103, sh2: 0, ua1: -65, la1: 22, ua2: -63, la2: 24 })], dur: 1000, props: [{ type: 'chair', x: -26 }] },
  plank_tap: { frames: [PLANK_HI, { ...PLANK_HI, ua1: 60, la1: -120 }, PLANK_HI, { ...PLANK_HI, ua2: 60, la2: -120 }], dur: 500 },
  inchworm: { frames: [STAND, P({ t: 30, hd: 25, ua1: 45, la1: 45, ua2: 47, la2: 47 }), P({ t: 70, hd: 70, ua1: 35, la1: 35, ua2: 35, la2: 35, th1: -20, sh1: -20, th2: -20, sh2: -20 }), PLANK_HI], dur: 900, cycle: 'pingpong' },
  pike_pushup: { frames: [P({ t: 35, hd: 30, ua1: 35, la1: 35, ua2: 37, la2: 37, th1: -35, sh1: -35, th2: -35, sh2: -35, ft1: 60, ft2: 60 }), P({ t: 25, hd: 15, ua1: -50, la1: 70, ua2: -48, la2: 70, th1: -35, sh1: -35, th2: -35, sh2: -35, ft1: 60, ft2: 60 })], dur: 1000 },
  wall_angel: { view: 'front', frames: [F({ ua1: 90, la1: 178, ua2: -90, la2: -178 }), F({ ua1: 155, la1: 172, ua2: -155, la2: -172 })], dur: 1300 },
  snow_angel: { view: 'top', frames: [F({ ua1: 10, la1: 8, ua2: -10, la2: -8, hd: 180 }), F({ ua1: 170, la1: 175, ua2: -170, la2: -175 })], dur: 1500 },

  // ---------- 核心 ----------
  knee_plank: { frames: same(KNEE_PLANK, { bend: 1 }), dur: 1500 },
  plank: { frames: same(PLANK_ARM, { bend: 1 }), dur: 1500 },
  plank_lift: { frames: [PLANK_ARM, { ...PLANK_ARM, th1: -98, sh1: -98 }, PLANK_ARM, { ...PLANK_ARM, th2: -98, sh2: -98 }], dur: 700 },
  heel_tap: { frames: [TABLETOP, { ...TABLETOP, th1: 140, sh1: 8 }, TABLETOP, { ...TABLETOP, th2: 140, sh2: 8 }], dur: 800 },
  dead_bug: { frames: [TABLETOP, { ...TABLETOP, ua1: -100, la1: -100, th2: 100, sh2: 100 }, TABLETOP, { ...TABLETOP, ua2: -100, la2: -100, th1: 100, sh1: 100 }], dur: 1000 },
  bird_dog: { frames: [QUAD, { ...QUAD, ua1: 100, la1: 100, th2: -92, sh2: -92, ft2: -60 }, QUAD, { ...QUAD, ua2: 100, la2: 100, th1: -92, sh1: -92, ft1: -60 }], dur: 1000 },
  crunch: { frames: [{ ...SUPINE, ua1: -150, la1: 40, ua2: -150, la2: 40 }, { ...SUPINE, t: -125, hd: -135, ua1: -170, la1: 30, ua2: -170, la2: 30 }], dur: 900 },
  curl_up: { frames: [{ ...SUPINE, th2: 90, sh2: 90 }, { ...SUPINE, th2: 90, sh2: 90, t: -102, hd: -112 }], dur: 1200 },
  pelvic_tilt: { frames: [{ ...SUPINE, bend: -8 }, { ...SUPINE, bend: 5, t: -88 }], dur: 1300 },
  bicycle: { frames: [P({ t: -110, hd: -120, ua1: -160, la1: 40, ua2: -160, la2: 40, th1: 165, sh1: 70, th2: 100, sh2: 100 }), P({ t: -110, hd: -120, ua1: -160, la1: 40, ua2: -160, la2: 40, th2: 165, sh2: 70, th1: 100, sh1: 100 })], dur: 700 },
  knee_side_plank: { view: 'front', narrow: true, frames: same(F({ t: -125, hd: -125, th1: 65, sh1: 65, th2: 65, sh2: 65, sl: 0.2, ft1: 0, ft2: 0, ua2: 0, la2: -90, ua1: 178, la1: 180 }), { t: -127 }), dur: 1500 },
  side_plank: { view: 'front', narrow: true, frames: same(F({ t: -110, hd: -110, th1: 70, sh1: 70, th2: 70, sh2: 70, ua2: 0, la2: -90, ua1: 178, la1: 180 }), { t: -112 }), dur: 1500 },
  leg_raise: { frames: [{ ...SUPINE_FLAT, th1: 97, sh1: 97, th2: 97, sh2: 97 }, { ...SUPINE_FLAT, th1: 172, sh1: 172, th2: 172, sh2: 172 }], dur: 1100 },
  russian_twist: { frames: [P({ t: -155, hd: -160, th1: 130, sh1: 65, th2: 130, sh2: 65, ua1: 50, la1: 95, ua2: 50, la2: 95 }), P({ t: -155, hd: -160, th1: 130, sh1: 65, th2: 130, sh2: 65, ua1: 120, la1: 80, ua2: 120, la2: 80 })], dur: 600 },
  hollow_hold: { frames: same(P({ t: -102, hd: -108, ua1: -105, la1: -105, ua2: -105, la2: -105, th1: 102, sh1: 102, th2: 102, sh2: 102 }), { t: -100 }), dur: 1500 },

  // ---------- 有氧 ----------
  shadow_box: { frames: [P({ th1: 12, th2: -14, ua1: 90, la1: 90, ua2: 30, la2: 150 }), P({ th1: 12, th2: -14, ua1: 30, la1: 150, ua2: 90, la2: 90 })], dur: 300 },
  step_jack: { view: 'front', frames: [FSTAND, STEP_OUT, FSTAND, STEP_OUT_L], dur: 380 },
  jumping_jack: { view: 'front', frames: [FSTAND, { ...JACK_OUT, lift: 10 }], dur: 350 },
  knee_march: { frames: [P({ th1: 85, sh1: 0, ua1: -40, la1: -20, ua2: 50, la2: 100 }), P({ th2: 85, sh2: 0, ua2: -40, la2: -20, ua1: 50, la1: 100 })], dur: 330 },
  high_knees: { frames: [P({ lift: 6, th1: 95, sh1: -10, th2: -10, sh2: -30, ua1: -40, la1: -20, ua2: 60, la2: 110 }), P({ lift: 6, th2: 95, sh2: -10, th1: -10, sh1: -30, ua2: -40, la2: -20, ua1: 60, la1: 110 })], dur: 260 },
  wall_climber: { frames: [P({ t: 150, hd: 148, th1: 60, sh1: -20, th2: -30, sh2: -30, ua1: 95, la1: 95, ua2: 93, la2: 93 }), P({ t: 150, hd: 148, th2: 60, sh2: -20, th1: -30, sh1: -30, ua1: 95, la1: 95, ua2: 93, la2: 93 })], dur: 400, props: [{ type: 'wall', x: 85 }] },
  mountain_climber: { frames: [{ ...PLANK_HI, th1: 30, sh1: -70 }, { ...PLANK_HI, th2: 30, sh2: -70 }], dur: 300 },
  skater_step: { view: 'front', frames: [F({ hx: -14, th1: 10, sh1: -5, th2: 20, sh2: 35, ua1: -30, la1: -20, ua2: 40, la2: 30 }), F({ hx: 14, th2: -10, sh2: 5, th1: -20, sh1: -35, ua2: 30, la2: 20, ua1: -40, la1: -30 })], dur: 550 },
  skater: { view: 'front', frames: [F({ hx: -22, th1: 15, sh1: -5, th2: 25, sh2: 40, ua1: -40, la1: -30, ua2: 50, la2: 40 }), F({ hx: 0, lift: 14, th1: 5, sh1: 5, th2: -5, sh2: -5 }), F({ hx: 22, th2: -15, sh2: 5, th1: -25, sh1: -40, ua2: 40, la2: 30, ua1: -50, la1: -40 }), F({ hx: 0, lift: 14, th1: 5, sh1: 5, th2: -5, sh2: -5 })], dur: 330 },
  squat_thrust: { frames: [STAND, { ...SQUAT, t: 120, ua1: 10, la1: 10, ua2: 12, la2: 12 }, PLANK_HI, { ...SQUAT, t: 120, ua1: 10, la1: 10, ua2: 12, la2: 12 }], dur: 700 },
  burpee: { frames: [P({ lift: 18, ua1: 170, la1: 175, ua2: 168, la2: 172, ft1: 30, ft2: 30 }), { ...SQUAT, t: 120, ua1: 10, la1: 10, ua2: 12, la2: 12 }, PLANK_HI, { ...SQUAT, t: 120, ua1: 10, la1: 10, ua2: 12, la2: 12 }], dur: 500 },
};

// 核對後修正易被簡化圖誤導的動作；俯視圖顯示真正的 Y → T。
ANIM.ytw = { view: 'top', frames: [F({ ua1: 150, la1: 150, ua2: -150, la2: -150 }), F({ ua1: 90, la1: 90, ua2: -90, la2: -90 })], dur: 1800 };
ANIM.chin_tuck.frames = [P({ hd: 180, headShift: 4 }), P({ hd: 180, headShift: 0 })];
ANIM.cat_cow.frames = [{ ...QUAD, bend: 5, hd: 100 }, { ...QUAD, bend: -3, hd: 108 }];
ANIM.cat_cow.dur = 2200;
ANIM.hip_flexor_stretch.frames[1] = { ...ANIM.hip_flexor_stretch.frames[0], hx: 3, th1: 83, th2: -27 };
ANIM.pelvic_tilt.frames = [{ ...SUPINE, bend: -2 }, { ...SUPINE, bend: 1 }];
ANIM.curl_up.frames = [{ ...SUPINE, th2: 90, sh2: 90, ua1: 78, la1: -140, ua2: 78, la2: -140 }, { ...SUPINE, th2: 90, sh2: 90, t: -96, hd: -96, ua1: 78, la1: -140, ua2: 78, la2: -140 }];
ANIM.wall_pushup.props[0].x = 70;
ANIM.wall_climber.props[0].x = 70;
ANIM.chest_stretch.props[0].x = -52;
ANIM.chair_squat.props[0].x = -10;
ANIM.knee_side_plank.frames = same(F({ t: -107.5, hd: -107.5, th1: 72.5, sh1: 162.5, th2: 72.5, sh2: 162.5, ft1: 90, ft2: 90, ua2: 0, la2: -90, ua1: 28, la1: -30 }), { bend: 0.5 });
ANIM.side_plank.frames = same(F({ t: -102, hd: -102, th1: 78, sh1: 78, th2: 78, sh2: 78, ft1: 90, ft2: 90, ua2: 0, la2: -90, ua1: 28, la1: -30 }), { bend: 0.5 });
// 教學循環留出看清姿勢的時間；有氧 GIF 也不作速度目標。
for (const [id, anim] of Object.entries(ANIM)) { anim.id = id; anim.dur = Math.max(anim.dur, 800); }

// ---------- 運算 ----------
const rad = a => (a * Math.PI) / 180;
const dir = a => [Math.sin(rad(a)), Math.cos(rad(a))];
const add = (p, a, len) => { const d = dir(a); return [p[0] + d[0] * len, p[1] + d[1] * len]; };

function solve(p, view, narrow = false) {
  const hip = [p.hx || 0, 0];
  const td = dir(p.t);
  const sh = add(hip, p.t, LEN.torso);
  const hd = p.hd ?? p.t;
  const neck = add(sh, hd, LEN.neck);
  const head = add(neck, hd, LEN.head);
  neck[0] += p.headShift || 0;
  head[0] += p.headShift || 0;
  const front = view !== 'side';
  const perp = [-td[1], td[0]];
  const off = (c, w) => (front ? [c[0] + perp[0] * w, c[1] + perp[1] * w] : c);
  const sw = narrow ? 4 : 13, hw = narrow ? 3 : 8;
  const s1 = off(sh, sw), s2 = off(sh, -sw), h1 = off(hip, hw), h2 = off(hip, -hw);
  const limb = (root, a1, a2, l1, l2) => { const m = add(root, a1, l1); return [root, m, add(m, a2, l2)]; };
  let arm1 = limb(s1, p.ua1, p.la1, LEN.ua, LEN.la);
  let arm2 = limb(s2, p.ua2, p.la2, LEN.ua, LEN.la);
  const shin = LEN.sh * (p.sl ?? 1);
  const leg1 = limb(h1, p.th1, p.sh1, LEN.th, shin);
  const leg2 = limb(h2, p.th2, p.sh2, LEN.th, shin);
  const ft1 = p.ft1 ?? (front ? p.sh1 + 75 : p.sh1 + 90);
  const ft2 = p.ft2 ?? (front ? p.sh2 - 75 : p.sh2 + 90);
  const fl = (front ? 7 : LEN.ft) * (p.sl ?? 1);
  const foot1 = [leg1[2], add(leg1[2], ft1, fl)];
  const foot2 = [leg2[2], add(leg2[2], ft2, fl)];
  // 脊椎曲線控制點
  const mid = [(hip[0] + sh[0]) / 2, (hip[1] + sh[1]) / 2];
  const bp = [td[1], -td[0]];
  const ctrl = [mid[0] + bp[0] * p.bend * 2, mid[1] + bp[1] * p.bend * 2];
  return { hip, sh, neck, head, ctrl, s1, s2, h1, h2, arm1, arm2, leg1, leg2, foot1, foot2, lift: p.lift || 0 };
}

function points(s) {
  return [s.hip, s.sh, s.neck, [s.head[0], s.head[1] + LEN.head], [s.head[0], s.head[1] - LEN.head], [s.head[0] - LEN.head, s.head[1]], [s.head[0] + LEN.head, s.head[1]],
    ...s.arm1, ...s.arm2, ...s.leg1, ...s.leg2, s.foot1[1], s.foot2[1]];
}

const lerp = (a, b, u) => a + (b - a) * u;
function mix(a, b, u) {
  const o = {};
  for (const k of Object.keys(a)) {
    const va = a[k], vb = b[k];
    if (typeof va === 'number' && typeof vb === 'number') o[k] = lerp(va, vb, u);
    else if (va == null && vb == null) o[k] = null;
    else o[k] = (va ?? vb) == null ? null : lerp(va ?? vb, vb ?? va, u);
  }
  return o;
}

// 依所有關鍵影格算出置中、縮放
function layout(anim) {
  const view = anim.view || 'side';
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const f of anim.frames) {
    const s = solve(f, view, anim.narrow);
    const pts = points(s);
    const bottom = Math.max(...pts.map(p => p[1]));
    for (const [x, y] of pts) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      const gy = y - bottom - s.lift;
      minY = Math.min(minY, gy); maxY = Math.max(maxY, gy);
    }
  }
  for (const pr of anim.props || []) {
    minX = Math.min(minX, pr.x - 16); maxX = Math.max(maxX, pr.x + 16);
    minY = Math.min(minY, pr.type === 'wall' ? -140 : -62);
  }
  let cy = 0;
  if (view === 'top') {
    const ys = anim.frames.flatMap(f => points(solve(f, view, anim.narrow)).map(p => p[1]));
    minY = Math.min(...ys); maxY = Math.max(...ys);
    cy = (minY + maxY) / 2;
  }
  const w = maxX - minX, h = maxY - minY;
  const scale = Math.min(anim.zoom ? 1.6 : 1.25, (W - 48) / (w + 18), (GROUND - 26) / (h + 16));
  return { view, scale, cx: (minX + maxX) / 2, cy };
}

const n = v => Math.round(v * 10) / 10;

function draw(anim, L, pose) {
  const s = solve(pose, L.view, anim.narrow);
  const phase = pose.animPhase || 0;
  if (['arm_circle', 'arm_hold'].includes(anim.id)) {
    const a = anim.id === 'arm_circle' ? 7 : 3;
    s.arm1 = [s.s1, [s.s1[0]+27,s.s1[1]+Math.sin(phase)*a*.5], [s.s1[0]+52+Math.cos(phase)*2,s.s1[1]+Math.sin(phase)*a]];
    s.arm2 = [s.s2, [s.s2[0]-27,s.s2[1]-Math.sin(phase)*a*.5], [s.s2[0]-52-Math.cos(phase)*2,s.s2[1]-Math.sin(phase)*a]];
  }
  if (anim.id === 'figure_four') {
    // 上腿腳踝搭在對側大腿靠膝處；雙手托住下方大腿。
    const knee=s.leg2[1], ankle=[knee[0]-3,knee[1]+4];
    s.leg1=[s.h1,[knee[0]+25,knee[1]+14],ankle];
    s.foot1=[ankle,[ankle[0]+8,ankle[1]-3]];
    const hold=[(s.h2[0]+knee[0])*.5,(s.h2[1]+knee[1])*.5+4];
    s.arm1=[s.s1,[s.s1[0]+22,s.s1[1]-12],hold];
    s.arm2=[s.s2,[s.s2[0]+23,s.s2[1]-10],[hold[0]+2,hold[1]+1]];
  }
  // 固定承重的手／肘；側棒式採側面投影，不能把前後肩高度誤作支撐長度。
  if (['knee_side_plank', 'side_plank'].includes(anim.id)) {
    const y = anim.id === 'knee_side_plank' ? s.leg2[1][1] : s.leg2[2][1];
    s.arm2 = [s.sh, [s.sh[0],y], [s.sh[0]-25,y]];
  }
  if (['wall_pushup', 'wall_climber'].includes(anim.id)) {
    const hand=[anim.props[0].x-4,-47];
    const ik = root => {
      const dx=hand[0]-root[0],dy=hand[1]-root[1],d=Math.hypot(dx,dy);
      const along=(LEN.ua**2-LEN.la**2+d*d)/(2*d);
      const height=Math.sqrt(Math.max(0,LEN.ua**2-along**2));
      return [root,[root[0]+dx/d*along-dy/d*height,root[1]+dy/d*along+dx/d*height],hand];
    };
    s.arm1=ik(s.s1);s.arm2=ik(s.s2);
  }
  const pts = points(s);
  const top = L.view === 'top';
  const bottom = top ? L.cy : Math.max(...pts.map(p => p[1]));
  const yOff = top ? H / 2 : GROUND;
  const T = ([x, y]) => [n(W / 2 + (x - L.cx) * L.scale), n(yOff + (y - bottom - s.lift) * L.scale)];
  const line = (a, b) => { const [x1, y1] = T(a), [x2, y2] = T(b); return `M${x1} ${y1}L${x2} ${y2}`; };
  const poly = arr => arr.map((p, i) => `${i ? 'L' : 'M'}${T(p).join(' ')}`).join('');
  const sw = n(7 * L.scale), swf = n(6.5 * L.scale);
  let out = '';
  // 道具
  for (const pr of anim.props || []) {
    const gx = T([pr.x, 0])[0];
    const gy = GROUND;
    if (pr.type === 'wall') out += `<rect x="${n(gx - 4)}" y="${n(gy - 145 * L.scale)}" width="8" height="${n(145 * L.scale)}" rx="2" fill="var(--fig-prop)"/>`;
    if (pr.type === 'chair') {
      const sh = 42 * L.scale, wd = 30 * L.scale;
      out += `<path d="M${n(gx - wd / 2)} ${n(gy - sh)}h${n(wd)}M${n(gx - wd / 2 + 2)} ${n(gy - sh)}V${gy}M${n(gx + wd / 2 - 2)} ${n(gy - sh)}V${gy}M${n(gx - wd / 2 + 2)} ${n(gy - sh)}V${n(gy - sh - 36 * L.scale)}" stroke="var(--fig-prop)" stroke-width="${n(5 * L.scale)}" stroke-linecap="round" fill="none"/>`;
    }
  }
  const skin = '#e6ad87', skinFar = '#c28d71', shirt = '#198c86', shirtFar = '#397a79', pants = '#243b54', pantsFar = '#52677b';
  const stroke = (d, col, width) => `<path d="${d}" stroke="${col}" stroke-width="${n(width * L.scale)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  const circle = (p, r, fill) => { const [x,y] = T(p); return `<circle cx="${x}" cy="${y}" r="${n(r*L.scale)}" fill="${fill}"/>`; };
  // 具厚度的上下肢分段：袖口、皮膚、長褲、鞋底，而非一條線代替全身。
  const leg = (v, foot, far) => stroke(poly(v), far ? pantsFar : pants, 12)
    + stroke(line(v[1], v[2]), far ? pantsFar : pants, 9)
    + stroke(line(foot[0],foot[1]), '#edf2f6', 9)
    + stroke(line(foot[0],foot[1]), far ? '#82949d' : '#163047', 5);
  const arm = (v, far) => stroke(poly(v), far ? skinFar : skin, 7)
    + stroke(line(v[0], [lerp(v[0][0],v[1][0],.52),lerp(v[0][1],v[1][1],.52)]), far ? shirtFar : shirt, 11)
    + circle(v[2], 3.8, far ? skinFar : skin);
  out += leg(s.leg2, s.foot2, true) + arm(s.arm2, true);
  const td = dir(pose.t), perp = [-td[1], td[0]];
  const offset = (p,w) => [p[0]+perp[0]*w,p[1]+perp[1]*w];
  const bodyWidth = L.view === 'side' ? 10 : 15;
  const hW = L.view === 'side' ? 9 : 11;
  const shA = offset(s.sh, bodyWidth), shB = offset(s.sh, -bodyWidth);
  const hipA = offset(s.hip,hW), hipB = offset(s.hip,-hW);
  const cpA = offset(s.ctrl,8), cpB = offset(s.ctrl,-8);
  const torso = `M${T(hipA)}Q${T(cpA)} ${T(shA)}L${T(shB)}Q${T(cpB)} ${T(hipB)}Z`;
  out += stroke(line(s.sh,s.neck),skin,9);
  out += `<path d="${torso}" fill="${shirt}" stroke="#116d6c" stroke-width="0.7"/>`;
  out += stroke(line(hipA,hipB),pants,11);
  // 衣料高光和側縫讓胸廓與骨盆朝向更清楚。
  out += stroke(line(offset(s.sh,bodyWidth*0.55), offset(s.ctrl,7)), '#43aaa2', 2);
  out += leg(s.leg1,s.foot1,false);
  out += circle(s.head,LEN.head,skin);
  const hd = pose.hd ?? pose.t;
  const hair = add(s.head,hd,3.4);
  out += circle(hair,7.7,'#263341');
  out += circle(add(s.head,hd+180,2.7),6.7,skin);
  if (!top) {
    const face = add(s.head,hd-90,6.8);
    out += circle(face,1.1,'#243b54');
    out += circle(add(s.head,hd+90,6),2.2,skinFar);
  }
  out += arm(s.arm1,false);
  // 對照一個活動末端的方向；靜態撐住的姿勢不畫移動箭頭。
  const a0 = solve(anim.frames[0], L.view, anim.narrow), a1 = solve(anim.frames[1] || anim.frames[0], L.view, anim.narrow);
  const candidates = [[a0.arm1[2],a1.arm1[2]],[a0.leg1[2],a1.leg1[2]],[a0.sh,a1.sh]];
  const motion = candidates.sort((a,b)=> Math.hypot(...b[0].map((v,i)=>v-b[1][i]))-Math.hypot(...a[0].map((v,i)=>v-a[1][i])))[0];
  if (Math.hypot(motion[1][0]-motion[0][0],motion[1][1]-motion[0][1]) > 13) {
    const [a,b]=motion.map(p=>[p[0]+10,p[1]]), [x,y]=T(b), [xx,yy]=T(a);
    const angle=Math.atan2(y-yy,x-xx), len=5;
    out += `<path d="M${xx} ${yy}L${x} ${y}M${n(x-len*Math.cos(angle-.5))} ${n(y-len*Math.sin(angle-.5))}L${x} ${y}L${n(x-len*Math.cos(angle+.5))} ${n(y-len*Math.sin(angle+.5))}" fill="none" stroke="#e79541" stroke-width="1.6" stroke-linecap="round" opacity="0.75"/>`;
  }
  return out;
}

function sequence(anim) {
  const fr = anim.frames;
  return anim.cycle === 'pingpong' && fr.length > 2 ? [...fr, ...fr.slice(1, -1).reverse()] : fr;
}

function frameAt(anim, ms) {
  const dur = anim.dur || 900;
  const seq = sequence(anim);
  const total = seq.length * dur;
  const t = ((ms % total) + total) % total; // rAF 時間戳可能略早於起點，避免負數
  const i = Math.floor(t / dur);
  const u = (t % dur) / dur;
  const moving = Math.max(0, Math.min(1, (u - 0.16) / 0.68));
  const e = (1 - Math.cos(Math.PI * moving)) / 2;
  return { ...mix(seq[i], seq[(i + 1) % seq.length], e), animPhase: t / total * Math.PI * 2 };
}

function svgShell(inner, anim, cls = '') {
  const ground = anim.view === 'top' ? '' : `<line x1="12" y1="${GROUND + 4}" x2="${W - 12}" y2="${GROUND + 4}" stroke="var(--fig-prop)" stroke-width="3" stroke-linecap="round"/>`;
  const viewName = anim.view === 'top' ? '俯視・身體朝地' : anim.view === 'front' ? '正面／側臥視角' : '側面';
  const tag = `<text x="${W - 10}" y="16" text-anchor="end" font-size="9" fill="#667b83">${viewName}</text>`;
  return `<svg class="figure ${cls}" viewBox="0 0 ${W} ${H}" role="img" aria-label="人物動作示範"><rect width="240" height="180" rx="12" fill="#f2f7f5"/>${ground}${tag}<g class="fig-body">${inner}</g></svg>`;
}

const cache = {};
function getLayout(id) {
  return (cache[id] ||= layout(ANIM[id]));
}

export function hasFigure(id) {
  return !!ANIM[id];
}

// 靜態縮圖（取第二個關鍵影格，比較看得出動作）
export function figureStatic(id, cls = 'thumb') {
  const anim = ANIM[id];
  if (!anim) return '';
  const pose = anim.frames[Math.min(1, anim.frames.length - 1)];
  return svgShell(draw(anim, getLayout(id), pose), anim, cls);
}

export function figureFrame(id, i) {
  const anim = ANIM[id];
  return svgShell(draw(anim, getLayout(id), anim.frames[i]), anim, '');
}

// 動畫：回傳停止函式
export function animateFigure(container, id) {
  const anim = ANIM[id];
  if (!anim || !container) return () => {};
  if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    container.innerHTML = figureStatic(id, 'live');
    return () => {};
  }
  container.innerHTML = svgShell('', anim, 'live');
  const g = container.querySelector('.fig-body');
  const L = getLayout(id);
  let raf = 0;
  const start = performance.now();
  const loop = now => {
    g.innerHTML = draw(anim, L, frameAt(anim, now - start));
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}

// 匯出用：取樣一整個循環的影格（每影格 frameMs 毫秒）
export function exportAnimation(id, frameMs = 50) {
  const anim = ANIM[id];
  const total = sequence(anim).length * (anim.dur || 900);
  const n = Math.max(2, Math.round(total / frameMs));
  const L = getLayout(id);
  const frames = Array.from({ length: n }, (_, i) => draw(anim, L, frameAt(anim, (i * total) / n)));
  return { total, frameMs: total / n, frames, shell: svgShell('@@BODY@@', anim, '') };
}
