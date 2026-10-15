const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8123/動作動畫/精緻動作圖庫.html');
 await page.locator('#search').fill('臀橋');
 if(await page.locator('article:visible').count()!==3)throw Error('gallery search');
 await page.locator('article:visible button').first().click();
 await page.locator('article:visible img').first().evaluate(im=>im.decode());
 await page.screenshot({path:'dev/gallery-mobile.png',fullPage:false});
 await page.locator('#pause').click();
 if(await page.locator('article[data-playing="true"]').count())throw Error('pause');
 await page.goto('http://127.0.0.1:8123/');
 await page.evaluate(()=>localStorage.setItem('homefit.v1',JSON.stringify({profile:{name:'測試',sex:'female',age:35,height:165,weight:60,goal:'posture',level:1,minutes:15,injuries:['back']},history:[],adapt:{factor:1,level:1,familyAdj:{}},streak:{freezes:0,frozenDates:[],awardedAt:0},plan:{date:'2026-10-16',main:[]},settings:{voice:false,sound:false}})));
 await page.reload();
 await page.locator('[data-action="preview"]').first().click();
 await page.locator('#preview-fig svg').waitFor();
 if(!(await page.locator('body').innerText()).includes('疼痛增加'))throw Error('safety cue missing');
 await page.screenshot({path:'dev/app-preview-mobile.png'});
 const plan=await page.evaluate(()=>JSON.parse(localStorage.getItem('homefit.v1')).plan);
 if(!plan.safetyVersion)throw Error('old plan not invalidated');
 await page.keyboard.press('Escape');
 await page.locator('[data-close]').click();
 await page.locator('[data-action="start"]').click();
 await page.locator('#fig svg').waitFor();
 for(let i=0;i<12&&!await page.locator('.btn.ok[data-action="next"]').count();i++){
   if(await page.locator('[data-action="skip"]').count())await page.locator('[data-action="skip"]').click();
   else await page.locator('[data-action="next"]').click();
 }
 await page.locator('.btn.ok[data-action="next"]').click();
 page.once('dialog',d=>d.accept());
 await page.locator('[data-action="quit"]').click();
 await page.locator('[data-action="feedback"]').click();
 await page.locator('label').filter({has:page.locator('input[name="rpe"][value="1"]')}).click();
 await page.locator('label').filter({has:page.locator('input[name="mood"][value="3"]')}).click();
 await page.locator('input[name="pain"]').check();
 await page.locator('#feedback-form button').click();
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('homefit.v1')));
 if(!after.history.at(-1).feedback.pain||after.adapt.factor>=1)throw Error('pain feedback did not reduce load');
 // 直接開啟所有關鍵影格圖庫，確認模組與渲染器在瀏覽器能正常載入。
 await page.goto('http://127.0.0.1:8123/dev/gallery.html?still&only=glute_bridge,dead_bug,ytw,knee_side_plank,wall_pushup');
 await page.locator('.figure').first().waitFor();
 if(await page.locator('svg').count()!==12)throw Error('figure keyframes');
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS: mobile gallery search/play/pause, cached plan refresh, APP preview/player, pain feedback reduces load, keyframes, no browser errors');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
