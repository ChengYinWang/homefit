// 直接從 APP 的 SVG 原稿輸出插畫；需 sharp，不呼叫外部圖像服務。
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const root = process.argv[3] || '動作動畫';
const selected = process.argv[4]?.split(',');
const escape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const fix = s => s.replaceAll('var(--fig-prop)', '#d3e2dc').replaceAll('var(--muted)', '#61767d');
function card(ex, frame, progress) {
  const cue = [...ex.safety.cue];
  const chunks = []; while(cue.length) chunks.push(cue.splice(0,25).join(''));
  const body = fix(ex.shell.replace('@@BODY@@',frame)).replace('<svg ', '<svg x="20" y="55" width="320" height="240" ');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 360 360">
    <rect width="360" height="360" fill="#fcfdfb"/>
    <g font-family="Microsoft JhengHei, sans-serif">
    <text x="20" y="29" font-size="21" font-weight="700" fill="#1c3746">${escape(ex.name)}</text>
    <text x="20" y="46" font-size="10" fill="#647b82">居家動作圖解 / ${escape(ex.area)} / 慢速示範</text>
    ${body}
    <rect x="23" y="292" width="314" height="3" rx="1.5" fill="#dce9e3"/>
    <rect x="23" y="292" width="${Math.max(2,314*progress)}" height="3" rx="1.5" fill="#198c86"/>
    ${chunks.slice(0,2).map((t,i)=>`<text x="20" y="${314+i*16}" font-size="12" fill="#294653">${escape(t)}</text>`).join('')}
    <text x="20" y="349" font-size="9" fill="#9c5529">疼痛／麻刺就停止 · 動畫不代表個人適用性</text>
    </g></svg>`;
}
(async()=>{
  fs.mkdirSync(path.join(root,'svg'),{recursive:true});
  fs.mkdirSync(path.join(root,'poster'),{recursive:true});
  fs.mkdirSync(path.join(root,'_frames'),{recursive:true});
  const manifest=data.map((ex,i)=>({id:ex.id,name:`${String(i+1).padStart(2,'0')}_${ex.area}_${ex.name}`.replaceAll('/','／'),frameMs:ex.frameMs,count:ex.frames.length}));
  for(const [i,ex] of data.entries()) {
    if(selected && !selected.includes(ex.id)) continue;
    const name=`${String(i+1).padStart(2,'0')}_${ex.area}_${ex.name}`.replaceAll('/','／');
    const dir=path.join(root,'_frames',ex.id); fs.mkdirSync(dir,{recursive:true});
    let groups='';
    for(let k=0;k<ex.frames.length;k++) {
      const svg=card(ex,ex.frames[k],k/(ex.frames.length-1));
      await sharp(Buffer.from(svg)).png().toFile(path.join(dir,`${String(k).padStart(4,'0')}.png`));
      const start=k/ex.frames.length, end=(k+1)/ex.frames.length;
      const times=k===0 ? `0;${end}` : k===ex.frames.length-1 ? `0;${start}` : `0;${start};${end}`;
      const values=k===0 ? 'visible;hidden' : k===ex.frames.length-1 ? 'hidden;visible' : 'hidden;visible;hidden';
      groups+=`<g visibility="hidden"><animate attributeName="visibility" values="${values}" keyTimes="${times}" dur="${ex.total/1000}s" calcMode="discrete" repeatCount="indefinite"/>${svg.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'')}</g>`;
    }
    fs.writeFileSync(path.join(root,'svg',name+'.svg'),`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 360 360" role="img" aria-label="${escape(ex.name)}">${groups}</svg>`);
    fs.copyFileSync(path.join(dir,`${String(Math.floor(ex.frames.length/2)).padStart(4,'0')}.png`),path.join(root,'poster',name+'.png'));
    console.log(`${i+1}/68 ${ex.name} (${ex.frames.length} frames)`);
  }
  fs.writeFileSync(path.join(root,'_frames','manifest.json'),JSON.stringify(manifest));
})();
