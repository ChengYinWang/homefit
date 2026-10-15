import assert from 'node:assert/strict';
import { EXERCISES, byId } from '../js/exercises.js';
import { SAFETY, SAFETY_VERSION } from '../js/safety.js';
import { ANIM, exportAnimation } from '../js/figure.js';
import { generatePlan, effectiveInjuries, applyFeedback, workSeconds, buildSteps } from '../js/planner.js';
import { defaultState } from '../js/store.js';
assert.equal(EXERCISES.length,68);
assert.deepEqual(new Set(EXERCISES.map(e=>e.id)),new Set(Object.keys(SAFETY)));
assert.deepEqual(new Set(EXERCISES.map(e=>e.id)),new Set(Object.keys(ANIM)));
let cases=0;
for(const goal of ['posture','fat','muscle','fitness']) for(const level of [1,2,3]) for(let mask=0;mask<16;mask++) for(const variant of [0,1,2]) {
  const s=defaultState();s.profile={goal,level,minutes:15,weight:65,injuries:['back','knee','wrist','shoulder'].filter((_,i)=>mask&(1<<i))};
  const plan=generatePlan(s,'2026-10-16',variant);
  assert.equal(plan.safetyVersion,SAFETY_VERSION);
  assert(plan.main.length>0);
  for(const item of [...plan.warmup,...plan.main,...plan.cooldown]) {
    const e=byId(item.id);
    assert(!e.avoid.some(i=>effectiveInjuries(s.profile).includes(i)),`${goal}/${mask}/${e.id} fails injury filter`);
    if(goal==='posture')assert(e.tags?.includes('posture'));
    assert(Number.isFinite(workSeconds(item))&&item.amount>0);
  }
  assert(buildSteps(plan).every(step=>step.kind==='rest'||byId(step.id)));
  assert.deepEqual(plan,generatePlan(s,'2026-10-16',variant));
  cases++;
}
for(const fb of [{rpe:1,pain:true},{rpe:1,sore:['back']},{rpe:1,failed:['plank']}]){
  const s=defaultState();s.profile={level:1};s.adapt.factor=1.34;
  applyFeedback(s,fb,1);assert.equal(s.adapt.level,1);assert(s.adapt.factor<=1.34);
}
for(const day of ['2026-10-15','2026-10-16']){
  const s=defaultState();s.profile={goal:'fitness',level:3,minutes:30,weight:65,injuries:[]};
  s.history=[{date:day,feedback:{sore:['back'],pain:true}}];
  const p=generatePlan(s,'2026-10-16');
  for(const i of [...p.warmup,...p.main,...p.cooldown])assert(!byId(i.id).avoid.includes('back'));
}
assert.equal(workSeconds({id:'hip_flexor_stretch',amount:20}),40);
for(const e of EXERCISES){const a=exportAnimation(e.id,80);assert(a.frames.length>=2);assert(!a.frames.some(f=>/NaN|undefined|Infinity/.test(f)));}
console.log(`PASS: ${cases} plan combinations, pain/failure progression, recent pain, bilateral time, 68 animation exports`);
