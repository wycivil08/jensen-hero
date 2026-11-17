'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{makeRuntime}=require('./harness.cjs');
const html=fs.readFileSync(require('./candidate.cjs').html,'utf8').replace('window.JensenDebug={','window.JensenDebug={Sfx,');
const dt=1/120,step=(r,n=1)=>{for(let i=0;i<n;i++)r.step(dt);};
function ptr(r,type,id=2,x=800,y=300,target='btnAtk'){r.dispatch(r.ids.get(target),type,{pointerType:'touch',pointerId:id,button:0,isPrimary:id===1,clientX:x,clientY:y});}
function patch(r,section,p,existing=false){const result=r.api.R7.lab.patch(section,r.api.R7Store.clone(p),existing);assert(result.ok,result.error);}
async function fresh(stage=2){const r=makeRuntime(html,{coarse:true,width:900,height:450,search:'?lab=1&debug=1'});await r.api.R7.start();r.api.R7.lab.reset(stage);r.api.R7.lab.clear();r.api.R7.lab.staticAI(true);Object.assign(r.api.G.hero,{x:650,y:500,oldX:650,oldY:500,aim:0,bodyAng:0,headAng:0,vx:0,vy:0});r.ids.get('joyBase').getBoundingClientRect=()=>({left:20,top:200,width:104,height:104});patch(r,'auto',{critChance:0});step(r,45);return r;}
function spawn(r,type='gunner',x=690,y=500){patch(r,'enemy:'+type,{hp:2000000});assert(r.api.R7.lab.spawn(type,1).ok);const e=r.api.G.enemies.at(-1);Object.assign(e,{x,y,oldX:x,oldY:y,entered:true,state:'recover',t:100});return e;}
function release(r,angle=0){ptr(r,'pointerdown');ptr(r,'pointermove',2,800+Math.cos(angle)*35,300+Math.sin(angle)*35);ptr(r,'pointerup',2,800+Math.cos(angle)*35,300+Math.sin(angle)*35);}
function commands(){const calls=[],stack=[],state={globalAlpha:1,globalCompositeOperation:'source-over'};return new Proxy({calls},{get(o,k){if(k in o)return o[k];if(k in state)return state[k];return(...args)=>{calls.push([k,...args]);if(k==='save')stack.push({...state});if(k==='restore')Object.assign(state,stack.pop());};},set(o,k,v){state[k]=v;return true;}});}
let groups=0;async function check(name,fn){await fn();groups++;console.log('PASS '+name);}
(async()=>{
await check('floating touchdown uses zero vector, saturates, captures beyond region and preserves right owner',async()=>{
 const r=await fresh();const captured=[];r.ids.get('game').setPointerCapture=id=>captured.push(id);ptr(r,'pointerdown',1,260,220,'game');assert.equal(r.api.Input.st.joyId,1);assert.equal(r.api.Input.st.jx,0);assert.equal(r.api.Input.st.jy,0);assert.equal(r.ids.get('joyBase').style.left,'208px');assert.deepEqual(captured,[1]);ptr(r,'pointermove',1,800,280,'game');assert(Math.hypot(r.api.Input.st.jx,r.api.Input.st.jy)<=1.000001);assert(r.api.Input.st.jx>.9);ptr(r,'pointerdown',2);ptr(r,'pointercancel',99,0,0,'game');assert.equal(r.api.Input.st.joyId,1);ptr(r,'pointercancel',1,0,0,'game');assert.equal(r.api.Input.st.joyId,null);assert.equal(r.api.Input.st.atkId,2);assert(r.api.R7.inspect().aim);ptr(r,'pointercancel',2);step(r,90);assert.equal(r.api.R7.inspect().action,null);
});
await check('world preview describes actual carrier radius and remains read-only until one release',async()=>{
 const r=await fresh(8),e=spawn(r);ptr(r,'pointerdown');ptr(r,'pointermove',2,835,300);step(r,100);assert.equal(e.hp,e.maxHp);assert.equal(r.api.R7.inspect().action,null);const ctx=commands(),before=JSON.stringify([r.api.R7.inspect(),r.api.G,r.rng()]);r.api.R7.foreground(ctx);assert(ctx.calls.some(c=>c[0]==='arc'&&c[3]===36&&c[4]===-.9&&c[5]===.9));assert.equal(JSON.stringify([r.api.R7.inspect(),r.api.G,r.rng()]),before);ptr(r,'pointerup',2,835,300);const root=r.api.R7.inspect().action.id;ptr(r,'lostpointercapture',2);for(let i=0;i<70;i++)step(r);assert.equal(r.api.R7.inspect().action,null);assert(r.api.R7.inspect().damageLog.some(h=>h.rootId===root));assert.equal(new Set(r.api.R7.inspect().damageLog.filter(h=>h.source==='auto').map(h=>h.rootId)).size,1);
});
await check('release buffer freezes direction, replaces on new gesture, expires at 750ms and resets on Tab',async()=>{
 const r=await fresh();release(r,0);const first=r.api.R7.inspect().action.id;step(r,5);release(r,Math.PI);assert(r.api.R7.inspect().releaseRequest);assert.equal(r.api.R7.inspect().releaseRequest.angle,Math.PI);let second;for(let i=0;i<80;i++){step(r);const a=r.api.R7.inspect().action;if(a&&a.id!==first){second=a;break;}}assert(second);assert.equal(second.angle,Math.PI);step(r,80);assert.equal(r.api.R7.inspect().action,null);
 release(r,0);step(r,2);release(r,Math.PI);assert(r.api.R7.inspect().releaseRequest);ptr(r,'pointerdown');assert.equal(r.api.R7.inspect().releaseRequest,null);ptr(r,'pointercancel');step(r,80);assert.equal(r.api.R7.inspect().action,null);
 patch(r,'auto',{cycle:2});release(r);step(r,2);release(r,Math.PI);assert(r.api.R7.inspect().releaseRequest);step(r,100);assert.equal(r.api.R7.inspect().releaseRequest,null);assert.match(r.ids.get('r14Status').textContent,/已过期/);step(r,180);assert.equal(r.api.R7.inspect().action,null,'expired input never restarts');release(r);step(r,1);release(r);assert(r.api.R7.inspect().releaseRequest);r.emit('keydown',{code:'Tab'});assert.equal(r.api.R7.inspect().releaseRequest,null);assert.equal(r.api.R7.inspect().aim,null);assert.match(r.ids.get('r14Status').textContent,/已取消/);step(r,300);assert.equal(r.api.R7.inspect().action,null);
});
await check('bare GPU hammer get one swing/context hit, bounded collision push and contact-only impact',async()=>{
 for(const [stage,material,bound]of [[1,'bare',3],[2,'gpu',5],[8,'hammer',10]]){
  const r=await fresh(stage),e=spawn(r),sounds=[];r.api.Sfx.swing=(...args)=>sounds.push(['swing',...args]);r.api.Sfx.hit=(...args)=>sounds.push(['hit',...args]);release(r);for(let i=0;i<90;i++)step(r);assert.equal(sounds.filter(s=>s[0]==='swing').length,1);assert.equal(sounds.find(s=>s[0]==='swing')[1],material);assert.equal(sounds.filter(s=>s[0]==='hit').length,1);assert.equal(sounds.find(s=>s[0]==='hit')[4],material);assert(e.x>690);assert(e.x<=690+bound+1e-7);assert(r.api.World.walkable(e.x,e.y,e.r));assert.equal(e.recoil,0,'AI-stop does not freeze hit reaction');assert.equal(e.flash,0);assert(r.api.G.flashes.length<=12);assert(r.api.R7.inspect().damageLog.some(h=>h.source==='auto'));
  r.api.R7.lab.clear();sounds.length=0;step(r,80);release(r);step(r,90);assert.equal(sounds.filter(s=>s[0]==='swing').length,1);assert.equal(sounds.filter(s=>s[0]==='hit').length,0,'empty swing has no contact sound');
 }
 const r=await fresh(8),boss=spawn(r,'champion');release(r);step(r,80);assert.equal(boss.x,690,'boss is not translated by ordinary hit');
});
await check('ordinary recoil cannot move accepted tells or tunnel into arena walls',async()=>{
 const r=await fresh(8),e=spawn(r);e.state='tell';e.t=100;release(r);step(r,80);assert.equal(e.x,690);assert(!e.kick?.remaining);assert(r.api.R7.inspect().damageLog.length);
 r.api.R7.lab.clear();const edge=r.api.World.W-r.api.World.WALL-14-1;Object.assign(r.api.G.hero,{x:edge-40,y:720});const wall=spawn(r,'gunner',edge,720);release(r);step(r,90);assert(r.api.World.walkable(wall.x,wall.y,wall.r));assert(wall.x<=r.api.World.W-r.api.World.WALL-wall.r+1e-8);
});
await check('footsteps follow actual movement and lab draw uses layered materials without state/RNG mutation',async()=>{
 const r=await fresh(2),sounds=[];r.api.Sfx.step=()=>sounds.push('step');ptr(r,'pointerdown',1,180,250,'game');ptr(r,'pointermove',1,250,250,'game');step(r,100);assert(sounds.length>=2);ptr(r,'pointerup',1,250,250,'game');step(r,80);const n=sounds.length;step(r,80);assert.equal(sounds.length,n);
 const ctx=commands(),before=JSON.stringify([r.api.G,r.api.R7.inspect(),r.rng()]);r.api.R7.drawHero(ctx,r.api.G.hero);assert.equal(JSON.stringify([r.api.G,r.api.R7.inspect(),r.rng()]),before);assert(ctx.calls.filter(c=>c[0]==='ellipse').length>15);assert(ctx.calls.some(c=>c[0]==='clip'));assert(!ctx.calls.some(c=>c[0]==='fillRect'&&c.slice(1).join(',')==='-10,-8,20,16'));assert(html.includes('../warrior/four.html'));assert(html.includes('../warrior/six.html'));
});
await check('taller rig and hand-depth layers preserve exact tool sides without covering rear faces',async()=>{
 const r=await fresh(8),h=r.api.G.hero,renderer=r.sandbox.CharacterRenderer;
 for(const angle of[-Math.PI/2,Math.PI/2]){
  Object.assign(h,{bodyAng:angle,headAng:angle,aim:angle});const ctx=commands(),records=[];
  r.sandbox.CharacterRenderer={...renderer,drawCharacter(g,s,a,options){const rig=renderer.computeRig(s);records.push({s,rig});return renderer.drawCharacter(g,s,a,{...options,drawEquipment(c,layer,rr){c.calls.push(['equipmentLayer',layer]);options.drawEquipment(c,layer,rr);}});}};
  r.api.R7.drawHero(ctx,h);const {rig,s}=records[0],hm=1-s.pose.cr;assert(Math.abs(rig.headY-(h.y+Math.sin(angle)*s.pose.ld*1.15-35*hm))<1e-8);assert(Math.abs(rig.bodyY-(h.y+Math.sin(angle)*s.pose.ld*.9-22*hm))<1e-8);
  const rear=ctx.calls.findIndex(c=>c[0]==='equipmentLayer'&&c[1]==='back'),front=ctx.calls.findIndex(c=>c[0]==='equipmentLayer'&&c[1]==='front'),head=ctx.calls.findIndex(c=>c[0]==='translate'&&c[1]===rig.headX&&c[2]===rig.headY);assert(rear<head&&head<front);assert(s.prototypeHands.left);assert(s.prototypeHands.right);
 }
 r.sandbox.CharacterRenderer=renderer;
 const e=spawn(r);const ctx=commands();r.api.R7.drawEnemy(ctx,e);assert(!ctx.calls.some(c=>c[0]==='fillText'&&c[1]===e.config.label),'idle normal names do not cover the body');e.flash=.1;r.api.R7.drawEnemy(ctx,e);assert(ctx.calls.some(c=>c[0]==='fillText'&&c[1]===e.config.label));assert(html.includes("#btnAtk::before{content:'';position:absolute;inset:-12px"));
});
console.log(JSON.stringify({status:'PASS',groups,scope:'R17 source-level input/material/audio-call/recoil checks; no subjective art, audible playback or real-device claim.'}));
})().catch(e=>{console.error(e);process.exitCode=1;});
