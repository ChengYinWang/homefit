import { SAFETY } from './safety.js';
// 徒手動作庫
// area: warmup 暖身 / stretch 伸展 / lower 下半身 / upper 上半身 / core 核心 / cardio 有氧
// family: 同一類動作的不同難度（level 1 簡單 → 3 進階），用來做退階 / 進階
// type: reps 次數 / time 秒數；base 為基準量；perSide 表示左右各做一次
// met: 代謝當量，用來估算熱量；tempo: 每下大約幾秒
// avoid: 有這些不適部位時不排入（knee 膝蓋 / back 下背 / wrist 手腕 / shoulder 肩膀）

export const INJURIES = {
  knee: '膝蓋',
  back: '下背',
  wrist: '手腕',
  shoulder: '肩膀',
};

export const AREA_NAMES = {
  warmup: '暖身',
  stretch: '伸展',
  lower: '下半身',
  upper: '上半身',
  core: '核心',
  cardio: '有氧',
};

const W = (id, name, met, tips, extra = {}) => ({
  id, name, area: 'warmup', family: id, level: 1, type: 'time', base: 30, met, avoid: [], tips, ...extra,
});
const S = (id, name, tips, extra = {}) => ({
  id, name, area: 'stretch', family: id, level: 1, type: 'time', base: 30, met: 2.3, avoid: [], tips, ...extra,
});

export const EXERCISES = [
  // ---------- 暖身 ----------
  W('march', '原地踏步', 3.5, ['膝蓋自然抬高，手臂前後擺動', '保持呼吸順暢'], { tags: ['posture'] }),
  W('arm_circle', '手臂繞圈', 2.5, ['雙臂側平舉，先向前繞 15 秒再向後繞', '肩膀放鬆不聳肩']),
  W('hip_circle', '髖關節繞圈', 2.5, ['雙手叉腰，骨盆畫大圓', '順時針、逆時針各一半時間'], { tags: ['posture'] }),
  W('torso_twist', '站姿轉體', 3, ['雙腳與肩同寬，上半身左右旋轉', '手臂放鬆跟著甩動']),
  W('cat_cow', '貓牛式', 2.5, ['四足跪姿，吸氣抬頭、腹部下沉', '吐氣拱背、低頭看肚臍'], { tags: ['posture'] }),
  W('warm_jack', '低衝擊開合', 4, ['一腳向側邊點地、雙手上舉', '左右交替，不需要跳']),
  W('thoracic_rot', '四足胸椎旋轉', 2.5, ['四足跪姿，一手放到另一手下方，再往天花板打開', '眼睛跟著手，轉動來自上背、腰不要扭', '左右各 15 秒'], { tags: ['posture'] }),
  W('chin_tuck', '收下巴', 2, ['站直，下巴水平往後收，像做出雙下巴', '感覺後頸拉長，停 2 秒再放鬆', '改善頭往前伸、圓肩'], { tags: ['posture'] }),

  // ---------- 伸展 ----------
  S('quad_stretch', '站姿大腿前側伸展', ['單手扶牆，抓住同側腳背往臀部拉', '左右各 15 秒，膝蓋朝下'], { tags: ['posture'] }),
  S('hamstring_stretch', '坐姿前彎', ['坐地雙腿伸直，背打直往前傾', '感覺大腿後側拉伸即可，不要彈震']),
  S('chest_stretch', '牆邊胸部伸展', ['手掌貼牆、身體慢慢轉離牆面', '左右各 15 秒'], { tags: ['posture'] }),
  S('child_pose', '嬰兒式', ['跪坐後臀部坐向腳跟，雙手往前延伸', '深呼吸，放鬆背部'], { tags: ['posture'] }),
  S('shoulder_stretch', '手臂交叉肩部伸展', ['一手橫過胸前，另一手輕壓手肘', '左右各 15 秒']),
  S('figure_four', '仰臥 4 字伸展', ['仰躺，一腳腳踝放在另一腳膝蓋上', '抱住下方大腿往胸口拉，左右各 15 秒'], { tags: ['posture'] }),
  S('hip_flexor_stretch', '半跪姿髖屈肌伸展', ['單膝跪地，另一腳在前踩地', '先收小腹、夾臀（骨盆後傾），再把身體往前推', '後腳大腿前側有拉伸感，左右各 20 秒'], { base: 40, tags: ['posture'] }),

  // ---------- 下半身 ----------
  { id: 'chair_squat', name: '椅子深蹲', area: 'lower', family: 'squat', level: 1, type: 'reps', base: 12, met: 5, avoid: [], tags: ['posture'],
    tips: ['身後放一張椅子，臀部往後坐到輕碰椅面再站起', '膝蓋與腳尖同方向，重心在腳跟'] },
  { id: 'squat', name: '徒手深蹲', area: 'lower', family: 'squat', level: 2, type: 'reps', base: 15, met: 5.5, avoid: [], tags: ['posture'],
    tips: ['雙腳略寬於肩，臀部往後往下坐', '背打直、胸口挺起，蹲到大腿約與地面平行'] },
  { id: 'jump_squat', name: '跳躍深蹲', area: 'lower', family: 'squat', level: 3, type: 'reps', base: 12, met: 8, tempo: 2.5, avoid: ['knee'],
    tips: ['深蹲後用力向上跳', '落地時膝蓋微彎、輕巧著地'] },

  { id: 'wall_lunge', name: '扶牆後跨步', area: 'lower', family: 'lunge', level: 1, type: 'reps', base: 8, perSide: true, met: 4.5, avoid: [], tags: ['posture'],
    tips: ['單手扶牆或椅背，一腳往後跨一大步', '前腳膝蓋不超過腳尖太多，身體保持直立'] },
  { id: 'reverse_lunge', name: '後跨步弓步', area: 'lower', family: 'lunge', level: 2, type: 'reps', base: 10, perSide: true, met: 5, avoid: ['knee'], tags: ['posture'],
    tips: ['一腳往後跨，雙膝彎曲約 90 度', '前腳腳跟用力把身體推回原位'] },
  { id: 'jump_lunge', name: '跳躍交替弓步', area: 'lower', family: 'lunge', level: 3, type: 'reps', base: 8, perSide: true, met: 8.5, tempo: 2.5, avoid: ['knee'],
    tips: ['弓步姿勢向上跳，空中換腳', '落地輕巧，核心收緊'] },

  { id: 'glute_bridge', name: '臀橋', area: 'lower', family: 'bridge', level: 1, type: 'reps', base: 15, met: 3.5, avoid: [], tags: ['posture'],
    tips: ['仰躺屈膝，腳跟踩地把臀部抬高', '頂端夾緊臀部停 1 秒，不要用腰硬撐'] },
  { id: 'single_bridge', name: '單腳臀橋', area: 'lower', family: 'bridge', level: 2, type: 'reps', base: 10, perSide: true, met: 4, avoid: [], tags: ['posture'],
    tips: ['一腳伸直抬起，另一腳踩地抬臀', '骨盆保持水平不歪斜'] },
  { id: 'bridge_march', name: '臀橋踏步', area: 'lower', family: 'bridge', level: 3, type: 'reps', base: 10, perSide: true, met: 4.5, avoid: [], tags: ['posture'],
    tips: ['臀橋撐在頂端，左右腳交替抬起', '臀部全程不要掉下來'] },

  { id: 'calf_raise', name: '提踵', area: 'lower', family: 'calf', level: 1, type: 'reps', base: 20, met: 3, tempo: 2, avoid: [],
    tips: ['可扶牆，踮腳到最高再慢慢放下', '放下時慢慢控制'] },
  { id: 'single_calf', name: '單腳提踵', area: 'lower', family: 'calf', level: 2, type: 'reps', base: 12, perSide: true, met: 3.5, tempo: 2, avoid: [],
    tips: ['單腳站立扶牆，踮腳到最高', '左右各做指定次數'] },

  { id: 'side_leg_raise', name: '側躺抬腿', area: 'lower', family: 'sideleg', level: 1, type: 'reps', base: 15, perSide: true, met: 3, tempo: 2, avoid: [], tags: ['posture'],
    tips: ['側躺，上方腿打直往上抬', '腳尖朝前不朝上，感覺臀部側邊出力'] },
  { id: 'side_lunge', name: '側弓步', area: 'lower', family: 'sideleg', level: 2, type: 'reps', base: 8, perSide: true, met: 5, avoid: ['knee'],
    tips: ['往側邊跨一大步，臀部往後坐', '另一腳伸直，回到中間換邊'] },

  { id: 'hip_hinge', name: '徒手髖鉸鏈', area: 'lower', family: 'hinge', level: 1, type: 'reps', base: 12, met: 3.5, avoid: [], tags: ['posture'],
    tips: ['雙手交叉放胸前，膝蓋微彎', '臀部往後推、上身前傾，背保持平直', '感覺大腿後側拉緊，再夾臀站直（不要往後仰）'] },
  { id: 'wall_sit', name: '靠牆蹲', area: 'lower', family: 'wallsit', level: 2, type: 'time', base: 30, met: 4, avoid: ['knee'],
    tips: ['背貼牆往下滑，膝蓋約 90 度', '雙手不要壓大腿，均勻呼吸'] },

  // ---------- 上半身 ----------
  { id: 'wall_pushup', name: '扶牆伏地挺身', area: 'upper', family: 'pushup', level: 1, type: 'reps', base: 12, met: 3.5, avoid: [],
    tips: ['雙手撐牆略寬於肩，身體成一直線', '胸口靠近牆面再推回'] },
  { id: 'knee_pushup', name: '跪姿伏地挺身', area: 'upper', family: 'pushup', level: 2, type: 'reps', base: 10, met: 4, avoid: ['wrist'],
    tips: ['膝蓋著地，從頭到膝蓋一直線', '手肘約 45 度往後，胸口接近地面'] },
  { id: 'pushup', name: '標準伏地挺身', area: 'upper', family: 'pushup', level: 3, type: 'reps', base: 10, met: 5, avoid: ['wrist', 'shoulder'],
    tips: ['身體從頭到腳一直線，臀部不塌不翹', '下到胸口接近地面再推起'] },

  { id: 'ytw', name: '俯臥 Y-T 舉', area: 'upper', family: 'ytw', level: 1, type: 'reps', base: 10, met: 3, avoid: [], tags: ['posture'],
    tips: ['趴地，雙手拇指朝上舉成 Y 字，再打開成 T 字', '夾緊肩胛骨，脖子放鬆'] },
  { id: 'superman', name: '超人式', area: 'upper', family: 'superman', level: 1, type: 'reps', base: 12, met: 3.5, avoid: ['back'],
    tips: ['趴地，手腳同時抬離地面', '頂端停 1 秒，視線看地板'] },
  { id: 'arm_hold', name: '手臂平舉畫小圈', area: 'upper', family: 'armhold', level: 1, type: 'time', base: 30, met: 3, avoid: ['shoulder'],
    tips: ['雙臂側平舉，快速畫小圈', '中途換方向，肩膀不要聳起'] },

  { id: 'wall_angel', name: '靠牆天使', area: 'upper', family: 'wallangel', level: 1, type: 'reps', base: 10, met: 3, tempo: 4, avoid: [], tags: ['posture'],
    tips: ['背靠牆，後腦、上背、臀部貼牆，小腹收緊讓腰不要拱起', '手臂成「ㄩ」字貼牆，慢慢往上滑再滑回', '肩膀下沉，不要聳肩'] },
  { id: 'snow_angel', name: '俯臥反向雪天使', area: 'upper', family: 'snow', level: 2, type: 'reps', base: 8, met: 3.5, tempo: 4, avoid: [], tags: ['posture'],
    tips: ['趴地，額頭輕放地面，手臂微微離地', '手從身體兩側畫半圓移到頭頂，再畫回來', '夾緊肩胛骨，腰不要用力抬'] },
  { id: 'chair_dip', name: '椅子撐體', area: 'upper', family: 'dip', level: 2, type: 'reps', base: 10, met: 4.5, avoid: ['shoulder', 'wrist'],
    tips: ['背對穩固的椅子，雙手撐椅緣', '彎曲手肘讓身體下沉，再推回'] },
  { id: 'plank_tap', name: '棒式點肩', area: 'upper', family: 'tap', level: 2, type: 'reps', base: 10, perSide: true, met: 4.5, avoid: ['wrist', 'shoulder'],
    tips: ['高棒式姿勢，一手輕碰對側肩膀', '雙腳打開一點，骨盆不要左右晃'] },
  { id: 'inchworm', name: '尺蠖爬行', area: 'upper', family: 'inchworm', level: 2, type: 'reps', base: 6, met: 5, tempo: 6, avoid: ['wrist', 'back'],
    tips: ['站姿彎腰手碰地，手往前爬到棒式', '再用手爬回來站起'] },
  { id: 'pike_pushup', name: '屈體伏地挺身', area: 'upper', family: 'pike', level: 3, type: 'reps', base: 8, met: 5, avoid: ['shoulder', 'wrist'],
    tips: ['臀部抬高成倒 V 字，頭往雙手之間下降', '主要練肩膀，動作放慢'] },

  // ---------- 核心 ----------
  { id: 'knee_plank', name: '跪姿棒式', area: 'core', family: 'plank', level: 1, type: 'time', base: 20, met: 3.3, avoid: [], tags: ['posture'],
    tips: ['手肘撐地、膝蓋著地', '從頭到膝蓋一直線，腹部收緊'] },
  { id: 'plank', name: '棒式', area: 'core', family: 'plank', level: 2, type: 'time', base: 30, met: 3.8, avoid: [], tags: ['posture'],
    tips: ['手肘在肩膀正下方，身體一直線', '收緊腹部與臀部，不要憋氣'] },
  { id: 'plank_lift', name: '棒式抬腿', area: 'core', family: 'plank', level: 3, type: 'time', base: 30, met: 4.5, avoid: ['back'],
    tips: ['棒式姿勢，左右腳輪流抬起', '骨盆保持穩定'] },

  { id: 'heel_tap', name: '仰臥腳跟點地', area: 'core', family: 'deadbug', level: 1, type: 'reps', base: 10, perSide: true, met: 3, avoid: [], tags: ['posture'],
    tips: ['仰躺，雙腳抬起成桌面姿勢（膝蓋 90 度）', '下背貼緊地板，一腳慢慢放下用腳跟點地', '換腳時腰不能離地'] },
  { id: 'dead_bug', name: '死蟲式', area: 'core', family: 'deadbug', level: 2, type: 'reps', base: 8, perSide: true, met: 3, avoid: [], tags: ['posture'],
    tips: ['仰躺，手舉向天花板、膝蓋 90 度', '對側手腳慢慢伸直，下背貼地'] },
  { id: 'bird_dog', name: '鳥狗式', area: 'core', family: 'birddog', level: 1, type: 'reps', base: 8, perSide: true, met: 3, avoid: [], tags: ['posture'],
    tips: ['四足跪姿，對側手腳伸直', '停 2 秒，身體不要旋轉'] },
  { id: 'curl_up', name: '麥吉爾捲腹', area: 'core', family: 'curlup', level: 1, type: 'reps', base: 8, met: 3, tempo: 6, avoid: [], tags: ['posture'],
    tips: ['仰躺，一腳彎曲一腳伸直，雙手墊在下背下方', '保持舒服的腰部弧度，頭和肩膀只微微離地', '不是每種腰痛都適合；症狀增加就停止'] },
  { id: 'pelvic_tilt', name: '骨盆後傾練習', area: 'core', family: 'ptilt', level: 1, type: 'reps', base: 15, met: 2.5, avoid: [], tags: ['posture'],
    tips: ['仰躺屈膝，腰下方會有一點空隙', '收小腹把下背壓向地板，骨盆往上捲，停 2 秒', '學會這個發力，站著和走路時也練習'] },
  { id: 'knee_side_plank', name: '跪姿側棒式', area: 'core', family: 'sideplank', level: 1, type: 'time', base: 20, perSide: true, met: 3.3, avoid: [], tags: ['posture'],
    tips: ['側躺，手肘在肩膀下方，膝蓋彎曲著地', '把臀部推離地面，從頭到膝蓋一直線', '左右各做'] },
  { id: 'crunch', name: '捲腹', area: 'core', family: 'crunch', level: 1, type: 'reps', base: 15, met: 3.8, avoid: ['back'],
    tips: ['仰躺屈膝，用腹部把肩膀捲離地面', '手輕放耳旁，不要拉脖子'] },
  { id: 'bicycle', name: '腳踏車捲腹', area: 'core', family: 'crunch', level: 2, type: 'reps', base: 12, perSide: true, met: 4.5, avoid: ['back'],
    tips: ['手肘碰對側膝蓋，另一腳伸直', '動作慢，感覺側腹出力'] },
  { id: 'side_plank', name: '側棒式', area: 'core', family: 'sideplank', level: 2, type: 'time', base: 20, perSide: true, met: 4, avoid: ['shoulder'], tags: ['posture'],
    tips: ['手肘撐地，身體側面一直線', '臀部不要往下掉，左右各做'] },
  { id: 'leg_raise', name: '仰臥抬腿', area: 'core', family: 'legraise', level: 2, type: 'reps', base: 12, met: 4, avoid: ['back'],
    tips: ['仰躺，雙手放臀部下方', '雙腿抬起再慢慢放下，下背貼地'] },
  { id: 'russian_twist', name: '俄羅斯轉體', area: 'core', family: 'twist', level: 2, type: 'reps', base: 12, perSide: true, met: 4, tempo: 2, avoid: ['back'],
    tips: ['坐姿身體後傾，雙手合握左右轉', '轉動來自軀幹，不是只動手'] },
  { id: 'hollow_hold', name: '空心撐', area: 'core', family: 'hollow', level: 3, type: 'time', base: 20, met: 4.5, avoid: ['back'],
    tips: ['仰躺，手腳伸直同時離地', '下背緊貼地面，太難可以屈膝'] },

  // ---------- 有氧 ----------
  { id: 'shadow_box', name: '原地出拳', area: 'cardio', family: 'box', level: 1, type: 'time', base: 30, met: 4.5, avoid: [], tags: ['posture'],
    tips: ['雙腳前後站，左右快速出拳', '腳跟著輕輕彈跳'] },
  { id: 'step_jack', name: '低衝擊開合', area: 'cardio', family: 'jack', level: 1, type: 'time', base: 30, met: 4.5, avoid: [], tags: ['posture'],
    tips: ['一腳向側邊點地、雙手上舉', '左右交替，節奏加快'] },
  { id: 'jumping_jack', name: '開合跳', area: 'cardio', family: 'jack', level: 2, type: 'time', base: 30, met: 8, avoid: ['knee'],
    tips: ['跳開雙腳同時雙手上舉', '用前腳掌輕巧落地'] },
  { id: 'knee_march', name: '快速抬膝踏步', area: 'cardio', family: 'knees', level: 1, type: 'time', base: 30, met: 4.5, avoid: [], tags: ['posture'],
    tips: ['快速交替抬膝到腰的高度', '手臂配合擺動'] },
  { id: 'high_knees', name: '原地高抬腿跑', area: 'cardio', family: 'knees', level: 2, type: 'time', base: 30, met: 8, avoid: ['knee'],
    tips: ['原地跑步，膝蓋抬到腰的高度', '前腳掌著地，保持節奏'] },
  { id: 'wall_climber', name: '扶牆登山者', area: 'cardio', family: 'climber', level: 1, type: 'time', base: 30, met: 4.5, avoid: [],
    tips: ['雙手撐牆、身體前傾', '左右膝蓋交替往胸口抬'] },
  { id: 'mountain_climber', name: '登山者', area: 'cardio', family: 'climber', level: 2, type: 'time', base: 30, met: 8, avoid: ['wrist', 'shoulder'],
    tips: ['高棒式姿勢，雙腳交替往胸口跑', '臀部不要抬太高'] },
  { id: 'skater_step', name: '側跨步', area: 'cardio', family: 'skater', level: 1, type: 'time', base: 30, met: 4.5, avoid: [],
    tips: ['往側邊大步跨，後腳往斜後方點地', '左右來回，手臂擺動'] },
  { id: 'skater', name: '溜冰者跳', area: 'cardio', family: 'skater', level: 2, type: 'time', base: 30, met: 7, avoid: ['knee'],
    tips: ['往側邊單腳跳，另一腳往後交叉', '落地膝蓋微彎，穩住再換邊'] },
  { id: 'squat_thrust', name: '簡易波比（不跳）', area: 'cardio', family: 'burpee', level: 2, type: 'reps', base: 8, met: 6.5, tempo: 4, avoid: ['wrist', 'back'],
    tips: ['蹲下手撐地，雙腳一步步往後成棒式', '再一步步收回站起'] },
  { id: 'burpee', name: '波比跳', area: 'cardio', family: 'burpee', level: 3, type: 'reps', base: 8, met: 8, tempo: 4, avoid: ['knee', 'wrist', 'back'],
    tips: ['蹲下撐地、跳成棒式、跳回來、向上跳', '累了可以放慢，但動作要完整'] },
];

// 保守的自練篩選，並不代表排除的動作必然會造成傷害。
const extraAvoid = {
  cat_cow: ['wrist', 'knee'], thoracic_rot: ['wrist', 'knee', 'shoulder'],
  quad_stretch: ['knee'], hip_flexor_stretch: ['knee'], child_pose: ['knee', 'shoulder'],
  chest_stretch: ['shoulder'], shoulder_stretch: ['shoulder'], figure_four: ['knee'],
  chair_squat: ['knee'], squat: ['knee'], wall_lunge: ['knee'],
  ytw: ['shoulder'], wall_angel: ['shoulder'], snow_angel: ['back', 'shoulder'],
  wall_pushup: ['wrist', 'shoulder'], knee_pushup: ['shoulder', 'back'], pushup: ['back'],
  knee_plank: ['knee', 'shoulder'], plank: ['shoulder'], bird_dog: ['wrist', 'knee', 'shoulder'],
  knee_side_plank: ['knee', 'shoulder'],
  hip_circle: ['back'], torso_twist: ['back'], hamstring_stretch: ['back'],
  single_bridge: ['back'], bridge_march: ['back'], curl_up: ['back'],
  jump_squat: ['back'], jump_lunge: ['back'], jumping_jack: ['back'], high_knees: ['back'],
  plank_tap: ['back'], mountain_climber: ['back'], pike_pushup: ['back'], skater: ['back'],
  wall_climber: ['wrist', 'shoulder'],
};
const bilateralTimed = ['thoracic_rot', 'quad_stretch', 'chest_stretch', 'shoulder_stretch', 'figure_four', 'hip_flexor_stretch'];
const SETUP = {};
const setupGroup = (ids, text) => ids.split(' ').forEach(id => SETUP[id] = text);
setupGroup('cat_cow thoracic_rot bird_dog', '四足跪姿，手在肩下、膝在髖下，先找到舒服的背部位置。');
setupGroup('glute_bridge single_bridge bridge_march pelvic_tilt crunch curl_up', '仰躺，先屈膝、全腳掌踩地，肩頸放鬆。');
setupGroup('heel_tap dead_bug', '仰躺，手朝天、髖膝約90度；太吃力先把一腳留地。');
setupGroup('ytw snow_angel superman', '俯臥，胸口與骨盆留地，頸部保持舒服的直線。');
setupGroup('knee_plank plank plank_lift', '前臂撐地，手肘在肩下；先以膝著地版本開始。');
setupGroup('side_plank knee_side_plank', '側躺，手肘在肩下、前臂撐地；先彎膝，再抬起骨盆。');
setupGroup('pushup knee_pushup plank_tap mountain_climber', '雙手在肩下撐地，先穩住軀幹，不聳肩或憋氣。');
setupGroup('wall_pushup wall_climber', '面向牆，雙手約肩高撐牆，腳向後退到舒服距離。');
setupGroup('hip_flexor_stretch', '半跪姿，一腳在前、後膝著地；需要時墊毛巾保護膝蓋。');
setupGroup('figure_four', '仰躺屈膝，一側腳踝放在另一側大腿、靠近膝上方。');
setupGroup('side_leg_raise', '側躺，上下骨盆疊好，下方手臂或枕頭支撐頭部。');
setupGroup('child_pose', '由四足跪姿開始，慢慢把臀部往後移，雙手放在舒服距離。');
setupGroup('hamstring_stretch', '坐姿、膝蓋可微彎，先坐穩，不強求背部或腿完全拉直。');
setupGroup('leg_raise hollow_hold bicycle', '仰躺，先屈膝、穩住腹部，再評估是否適合進階。');
setupGroup('russian_twist', '坐穩、腳先踩地，手放胸前；有腰痛時不預設此動作。');
for (const ex of EXERCISES) {
  ex.safety = SAFETY[ex.id];
  ex.avoid = [...new Set([...ex.avoid, ...(extraAvoid[ex.id] || [])])];
  // 將過時要領整組取代，避免新舊提示互相矛盾。
  ex.tips = [SETUP[ex.id] || '先站穩或扶住穩固支撐物，找到舒服的起始姿勢。', SAFETY[ex.id].cue, '在可控制且不增加症狀的範圍慢做；持續呼吸，疼痛或麻刺就停止。'];
  if (bilateralTimed.includes(ex.id)) {
    ex.perSide = true;
    ex.base = ex.id === 'hip_flexor_stretch' ? 20 : 15;
  }
  if (['hip_circle', 'curl_up', 'single_bridge', 'bridge_march', 'snow_angel'].includes(ex.id)) {
    ex.tags = (ex.tags || []).filter(t => t !== 'posture');
  }
  if (ex.tags?.includes('posture') && ex.type === 'reps') ex.base = Math.min(ex.base, 8);
  if (['knee_plank', 'plank', 'knee_side_plank', 'side_plank'].includes(ex.id)) ex.base = 10;
}

const MAP = Object.fromEntries(EXERCISES.map(e => [e.id, e]));
export const byId = id => MAP[id];

