import { writeFileSync } from 'node:fs';
globalThis.localStorage = { getItem(){return null}, setItem(){} };
const base = new URL('../js/', import.meta.url).href;
const { EXERCISES, AREA_NAMES } = await import(base+'exercises.js');
const { exportAnimation } = await import(base+'figure.js');
const out = EXERCISES.map(e => ({ id: e.id, name: e.name, area: AREA_NAMES[e.area], tips: e.tips, safety: e.safety, ...exportAnimation(e.id, 80) }));
writeFileSync(process.argv[2], JSON.stringify(out));
console.log(out.length, 'exercises,', out.reduce((s,o)=>s+o.frames.length,0), 'frames');
