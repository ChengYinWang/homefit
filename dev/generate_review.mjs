import { writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { EXERCISES, AREA_NAMES } from '../js/exercises.js';
import { SOURCES } from '../js/safety.js';
const root = new URL('../', import.meta.url);
const write = (p,s) => writeFileSync(new URL(p,root),s);
const table = EXERCISES.map((e,i)=>`| ${i+1} | ${e.name} | ${e.safety.decision} | ${e.safety.evidence} [${e.safety.source}](${SOURCES[e.safety.source][1]}) | ${e.safety.cue} |`).join('\n');
write('運動安全查核.md',`# 居家運動：68 個動作的證據與安全查核

查核日期：2026-10-16。範圍：專案說明、68 個動作、選課與回饋規則、原始 SVG 動畫。

## 結論與適用範圍

目前方向可作為一般居家活動、肌力與動作控制訓練，但不能聲稱「解決所有長期駝背、骨盆前傾與腰痛」，也不能保證任何動作都不會加重某個人的症狀。

- **慢性原發性／非特異性腰痛**：指引支持依耐受安排肌力、控制與有氧運動；不能把類別證據當成某一動作必定有效。[WHO](${SOURCES.WHO[1]})、[APTA/JOSPT](${SOURCES.CPG[1]})。
- **骨盆前傾**：站姿角度不是腰痛診斷。回顧只有少量、品質很低的研究，不能證明靠「練腹臀＋拉髖屈肌」就能永久矯正或消除腰痛；原說明的「臀部無力是常見原因」應改為待個別評估的假設。[Brekke 2020](${SOURCES.PELVIS[1]})。
- **頭前伸／圓肩／胸椎後凸**：綜合訓練可能改善部分姿勢量測；結構性駝背、骨質疏鬆壓迫性骨折等不能照這套自練處理。姿勢角度改善也不等於疼痛或功能一定改善。[Sepehri 2024](${SOURCES.POSTURE[1]})、[2026 系統性回顧](https://link.springer.com/article/10.1186/s13102-026-01707-8)。

本次採「動作名稱＋同義名＋臨床指引／醫療機構教學／系統性回顧」交叉檢索。同家族依共同來源核對；**並非每個動作都有獨立臨床試驗**。下表清楚標出直接教學、同類間接依據與未找到直接證據；「未找到」不是證明無效。NASM 教學只支持技術描述，不能當成治療試驗。

## 每個動作的處理

「保留／條件保留」仍須不增加症狀；「一般」僅有一般活動用途；「進階選用／評估後選用／暫不預設」不代表動作本身必然傷腰。這些是本 APP 的保守選課決策，並非經正式 GRADE 評定的證據等級。表內安全提示為針對本 APP 的實作建議，並非逐字引述或來源背書。

| # | 動作 | APP 判斷 | 找到的依據與限制 | 安全提示／退階 |
|---|---|---|---|---|
${table}

## 已落實到程式的修正

1. 暖身、主訓練、伸展均套用同一套不適部位篩選；修正原本伸展完全沒篩選的漏洞。
2. 補上肩、腕、膝等承重條件。腰痛／體態預設排除單腳橋式、橋式踏步、麥吉爾捲腹、俯臥雪天使等較需個別判斷的版本；仍保留雙腳橋式等入門選項。
3. 修正「下背一定用力壓地」「全天骨盆後傾」「手臂一定貼牆」「重心只在腳跟」等提示。保留可控制的舒服範圍與正常呼吸。
4. 六個單邊計時動作改成真正的「每邊 15 或 20 秒」，由播放器中途提示換邊；不再僅在文字寫左右各做。
5. 入門體態動作由最多 8 下、棒式 10 秒起算（每邊標示依動作）；這是保守起始設定，不是通用醫療處方。
6. 區分腹部肌肉痠感與下背不適；新增疼痛／麻刺回饋，有不適或做不標準時不因 RPE 低而升級。疼痛回饋降低強度。近期下背不適套用下背篩選。
7. 更新當日課表版本，避免舊快取仍排出已移除的版本；離線快取亦已更新。

## 實際開始與停止原則

長期或反覆腰痛、明顯駝背，先由復健科／物理治療師確認是否屬於上述適用範圍。急性外傷、術後、已知骨折、骨質疏鬆或神經疾病，不直接套用本課表。

開始時先選短課表，動作寧可縮幅／退階；若做完或隔天症狀明顯增加，減少量或停止該動作並評估。不要為湊滿 APP 時間或維持連勝硬做。每日習慣可以是舒服的走動、活動與休息調整，不需要每日把同一組肌肉練到疲勞。

疼痛增加、放射到腿、麻刺或無力，停止誘發動作並就醫評估。若有新發大小便功能改變、會陰麻木、雙腿無力，或重大外傷後疼痛，應立即急診；發燒伴腰痛或疼痛快速惡化也應盡速就醫。[NHS](${SOURCES.NHS[1]})。

## 動畫交付與限制

已重製全部 68 個 code-native 人物插畫動畫，輸出 640×640 GIF 與 SVG，並同步套用 APP 播放器。附服裝輪廓、近遠側層次、鞋子、視角標示、慢速停留、循環進度、安全提示。箭頭只示意移動方向，**並非需追到的幅度**。部份單邊動作循環只示範一側，另一側鏡像執行；左右劑量以 APP 文字與語音為準。

Y-T 舉改成俯視；收下巴改為水平回縮；貓牛式縮幅；髖屈肌伸展取消過頭舉手；側棒式重畫支撐；扶牆伏地挺身／登山者固定手的接觸點。仍是 2D 教學插畫，不是動作捕捉，也未經物理治療師逐格審核；旋轉及交叉肢體需同時讀文字，不能拿動畫判定個人是否做對。

完整圖庫：打開「動作動畫/精緻動作圖庫.html」。原檔備份：「動作動畫/原版動畫備份.zip」。

## 來源清單

${Object.entries(SOURCES).map(([k,[name,url]])=>`- [${k}：${name}](${url})`).join('\n')}
- [2026：Corrective exercises strongly improve posture but fail to produce consistent clinical or functional benefits](https://link.springer.com/article/10.1186/s13102-026-01707-8)
`);
mkdirSync(new URL('動作動畫/poster/',root),{recursive:true});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cards=EXERCISES.map((e,i)=>{
  const base=`${String(i+1).padStart(2,'0')}_${AREA_NAMES[e.area]}_${e.name}`.replaceAll('/','／');
  const [source,url]=SOURCES[e.safety.source];
  return `<article data-search="${e.name} ${e.safety.decision}" data-posture="${e.tags?.includes('posture')||false}"><img loading="lazy" width="640" height="640" src="poster/${base}.png" data-gif="gif/${base}.gif" data-poster="poster/${base}.png" alt="${e.name}人物動作示範"><div class="content"><div class="eyebrow">${AREA_NAMES[e.area]} · ${e.safety.decision}</div><h2>${e.name}</h2><p>${e.safety.cue}</p><p class="muted">${e.safety.evidence}</p><a href="${url}" target="_blank" rel="noopener">依據：${source}</a><p><button type="button">播放動畫</button> <a href="gif/${base}.gif" download>下載 GIF</a></p></div></article>`;
}).join('');
write('動作動畫/精緻動作圖庫.html',`<!doctype html><html lang="zh-Hant-TW"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>居家運動｜人物動作圖庫</title><style>
*{box-sizing:border-box}body{margin:0;background:#edf3ef;color:#203d48;font:16px/1.65 'Microsoft JhengHei',sans-serif}header{padding:42px max(20px,calc((100% - 1220px)/2));background:#173f44;color:#fff}h1{font-size:clamp(26px,5vw,44px);line-height:1.2;margin:10px 0}header p{max-width:850px;color:#d3e7df}.controls{position:sticky;top:0;z-index:3;background:#edf3eff5;padding:16px 20px;display:flex;gap:10px;flex-wrap:wrap;border-bottom:1px solid #d1dfd8}.controls input{flex:1;min-width:190px}input,select,button{font:inherit;border:1px solid #b6cac1;border-radius:9px;padding:9px 12px;background:#fff;color:#203d48}button{cursor:pointer}button:hover{background:#d7eee5}.grid{max-width:1260px;margin:24px auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(285px,1fr));gap:22px;padding:0 20px}article{background:#fff;border:1px solid #d6e2db;border-radius:18px;overflow:hidden;box-shadow:0 9px 24px #284b4010}article[hidden]{display:none}img{display:block;width:100%;height:auto}.content{padding:0 22px 16px}.eyebrow{font-size:12px;letter-spacing:1px;color:#32877a}h2{font-size:23px;margin:5px 0}p{margin:9px 0}.muted{font-size:13px;color:#647a80}a{color:#16796e;font-size:13px}footer{max-width:1220px;margin:30px auto;padding:20px}.count{align-self:center;font-size:13px}</style>
<header><small>HOME MOVEMENT / 2026.10.16</small><h1>把動作看清楚，<br>再慢慢開始。</h1><p>68 個穿著運動服的人物示範。點選播放，搭配文字查看安全要領與證據範圍。姿勢改善不等於疼痛一定改善；沒有任何 GIF 能保證個人適用。</p></header><div class="controls"><input id="search" placeholder="搜尋動作名稱或選課判斷" aria-label="搜尋動作"><select id="filter" aria-label="篩選"><option value="all">全部動作</option><option value="posture">目前體態課表候選</option></select><button id="pause">全部暫停</button><span class="count" id="count"></span></div><main class="grid">${cards}</main><footer>疼痛增加、向腿放射、麻刺或無力：立即停止。新發大小便障礙、會陰麻木或雙腿無力請立即急診。<br>圖庫為 2D 示意，未經物理治療師逐格審核。原始檔已保存於「原版動畫備份.zip」。</footer><script>
const articles=[...document.querySelectorAll('article')];function stop(a){const im=a.querySelector('img');im.src=im.dataset.poster;a.querySelector('button').textContent='播放動畫'}
articles.forEach(a=>a.querySelector('button').onclick=()=>{const im=a.querySelector('img');if(a.dataset.playing==='true'){stop(a);a.dataset.playing='false'}else{im.src=im.dataset.gif;a.dataset.playing='true';a.querySelector('button').textContent='暫停動畫'}});
function filter(){const q=document.querySelector('#search').value.trim(),v=document.querySelector('#filter').value;let count=0;articles.forEach(a=>{a.hidden=!a.dataset.search.includes(q)||(v==='posture'&&a.dataset.posture!=='true');if(!a.hidden)count++;else{stop(a);a.dataset.playing='false'}});document.querySelector('#count').textContent=count+' / 68 個動作'}document.querySelector('#search').oninput=filter;document.querySelector('#filter').onchange=filter;document.querySelector('#pause').onclick=()=>articles.forEach(a=>{stop(a);a.dataset.playing='false'});filter();
</script></html>`);
console.log('Wrote 68-row evidence report and offline gallery');
