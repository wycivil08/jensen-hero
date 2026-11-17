const {attackFixture,primeTell}=require('./attack-fixture.cjs');
const {advance,finish}=require('./story-input.cjs');
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {makeRuntime}=require('./harness.cjs'),current=require('./candidate.cjs');
const html=fs.readFileSync(current.html,'utf8'),dt=1/120,flush=()=>new Promise(setImmediate);
const step=(r,n=1)=>{for(let i=0;i<n;i++)r.step(dt);};
const angle=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
function click(r,x,y){const [clientX,clientY]=r.api.w2s(x,y);r.dispatch(r.ids.get('game'),'pointerdown',{clientX,clientY,button:0,isPrimary:true});}
async function fresh(level=1){const data=new Map();const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},locks={request:async(k,o,f)=>f()};const r=makeRuntime(html,{storage,locks});await flush();
 if(level===2){const p=r.api.R7Store.reward(r.api.R7.inspect().profile);p.phase='combat2';p.revision++;storage.setItem(r.api.R7Store.KEY,JSON.stringify(p));await r.api.R7.start();}
 else{await finish(r);}
 for(const [i,e]of r.api.G.enemies.entries())Object.assign(e,{x:1120,y:130+i*100,state:'recover',t:100,wait:100});return r;
}
function snapshot(r){let value;const renderer=r.sandbox.CharacterRenderer;r.sandbox.CharacterRenderer={...renderer,drawCharacter(ctx,s){value=JSON.parse(JSON.stringify(s));}};r.api.R7.drawHero(r.ids.get('game').getContext('2d'),r.api.G.hero);r.sandbox.CharacterRenderer=renderer;return value;}
const checks=[];async function check(name,fn){await fn();checks.push(name);console.log('PASS '+name);}
(async()=>{
await check('gradual velocity, responsive turn, separate gait settling and persistent secondary springs',async()=>{
 const r=await fresh(),h=r.api.G.hero,sp=r.api.CFG.hero.speed;h.x=650;h.y=500;h.bodyAng=h.headAng=h.aim=0;
 r.emit('keydown',{code:'KeyD'});step(r);const first=h.vx;assert(first>0&&first<sp*.2);step(r,30);assert(h.vx>sp*.95);const visual=h.visual,walk=h.walk;assert(visual.age>0);assert(Math.abs(visual.hem)>0);
 r.emit('keyup',{code:'KeyD'});step(r);assert(h.vx>0&&h.vx<sp);assert(h.walk>walk);const release=h.x;step(r,120);assert.equal(h.vx,0);assert(h.x>release);assert(h.moveAmt<.001);assert.equal(h.visual,visual);assert(Math.abs(visual.hem)>0,'cloth retains a damped tail after translation stops');
 r.emit('keydown',{code:'KeyW'});step(r);assert(h.bodyAng<0&&h.bodyAng>-Math.PI/2);assert(Math.abs(h.headAng)>Math.abs(h.bodyAng));assert.equal(snapshot(r).visual.age,h.visual.age);r.emit('keyup',{code:'KeyW'});
 h.bodyAng=h.headAng=h.aim=Math.PI-.01;r.emit('keydown',{code:'KeyA'});r.emit('keydown',{code:'KeyW'});step(r);assert(Math.abs(h.bodyAng-(Math.PI-.01))<.2,'turn crosses PI along the short arc');
});
await check('short clicks and sharp target changes arrive once without overshoot, drift or table penetration',async()=>{
 const r=await fresh(),h=r.api.G.hero;h.x=650;h.y=500;
 for(const [x,y]of [[652.5,500],[651,500],[656,502],[700,500],[680,480],[681,480],[650,500]]){click(r,x,y);for(let i=0;i<800&&r.api.R7.inspect().destination;i++){step(r);assert(r.api.World.walkable(h.x,h.y,h.r-.01));}assert(!r.api.R7.inspect().destination);assert(Math.hypot(h.x-x,h.y-y)<2.01);const at={x:h.x,y:h.y};step(r,100);assert(Math.hypot(h.x-at.x,h.y-at.y)<1e-8);assert.equal(h.vx,0);}
 h.x=770;h.y=620;for(const [x,y]of [[930,620],[930,540],[770,620]]){click(r,x,y);for(let i=0;i<1400&&r.api.R7.inspect().destination;i++){step(r);assert(r.api.World.walkable(h.x,h.y,h.r-.01));}assert(Math.hypot(h.x-x,h.y-y)<2.01);}
 click(r,1050,600);step(r,40);click(r,740,550);for(let i=0;i<1200&&r.api.R7.inspect().destination;i++)step(r);assert(Math.hypot(h.x-740,h.y-550)<2.01);
});
await check('ground arrival near an unselected body never snaps inside its collider or bounces next step',async()=>{
 const r=await fresh(),h=r.api.G.hero,e=r.api.G.enemies[0];h.x=650;h.y=500;Object.assign(e,{x:760,y:500,state:'recover',t:100});
 click(r,789.5,500);assert.equal(r.api.R7.inspect().targetId,null,'click is outside hostile selection region');assert(r.api.R7.inspect().destination);
 for(let i=0;i<1000&&r.api.R7.inspect().destination;i++){step(r);assert(Math.hypot(h.x-e.x,h.y-e.y)>=h.r+e.r-1e-7);}
 assert.equal(r.api.R7.inspect().destination,null);assert(Math.hypot(h.x-789.5,h.y-500)<=2);const at={x:h.x,y:h.y};step(r,100);assert(Math.hypot(h.x-at.x,h.y-at.y)<1e-8,'no collision correction bounce after arrival');
});
await check('windup/contact/recovery move torso and hips, visible hand follows exact combat sweep; contact once per root',async()=>{
 for(const kit of ['bare','tray','gpu']){const r=await fresh(kit==='gpu'?2:1),h=r.api.G.hero,e=r.api.G.enemies[0];h.x=720;h.y=620;
  if(kit==='tray'){Object.assign(r.api.G.enemies[0],{state:'recover',t:dt/2});h.x=620;h.y=610;step(r,2);assert(r.api.R7.inspect().tray);h.x=720;h.y=620;}
  Object.assign(e,{x:755,y:620,hp:1000,maxHp:1000,state:'recover',t:100});click(r,e.x,e.y-16);while(!r.api.R7.inspect().action)step(r);
  const poses=[];let id=r.api.R7.inspect().action.id,seenContact=false,maxHits=0;
  for(let i=0;i<120;i++){const a=r.api.R7.inspect().action;if(!a||a.id!==id)break;const s=snapshot(r);poses.push({phase:h.phase,tw:s.pose.tw,hip:s.pose.hip,ld:s.pose.ld});
   if(a.age>=.1&&a.age<=.18){const q=Math.max(0,Math.min(1,(a.age-.1)/.08)),ang=a.angle+(a.side?1:-1)*(.9-1.8*q),reach=a.profile.reach-a.profile.radius,hand=s.prototypeHands[a.side?'right':'left'];assert(Math.hypot(hand.x-h.x-Math.cos(ang)*reach,hand.y+17-h.y-Math.sin(ang)*reach)<1e-8);seenContact=true;}
   maxHits=Math.max(maxHits,a.hits.length);step(r);
  }
  assert(seenContact);assert(poses.some(p=>p.phase==='windup'));assert(poses.some(p=>p.phase==='swing'));assert(poses.some(p=>p.phase==='recover'));assert(Math.max(...poses.map(p=>p.tw))-Math.min(...poses.map(p=>p.tw))>.6);assert(Math.max(...poses.map(p=>p.hip))-Math.min(...poses.map(p=>p.hip))>.3);assert.equal(maxHits,1);assert.equal(e.hp,1000-(kit==='bare'?8:12));
 }
});
await check('hitstop freezes combat clocks together for two steps, cannot stack cleave targets, leaves commands/UI responsive',async()=>{
 const r=await fresh(2),h=r.api.G.hero;h.x=720;h.y=620;const enemies=r.api.G.enemies.slice(0,3);for(const [i,e]of enemies.entries())Object.assign(e,{x:755+i*2,y:620+i*2,hp:1000,state:'tell',t:50,attack:attackFixture(e,1.4,'tell-'+i)});
 click(r,enemies[0].x,enemies[0].y-16);for(let i=0;i<200&&!r.api.G.hitStop;i++)step(r);assert(r.api.G.hitStop>0&&r.api.G.hitStop<=2*dt);const c=r.api.R7.inspect().clock,t=enemies[0].t,age=r.api.R7.inspect().action.age,x=h.x,rt=r.api.G.rt;
 step(r,2);assert.equal(r.api.R7.inspect().clock,c);assert.equal(enemies[0].t,t);assert.equal(r.api.R7.inspect().action.age,age);assert.equal(h.x,x);assert(r.api.G.rt>rt);assert.equal(r.api.G.hitStop,0);const root=r.api.R7.inspect().action.id;let frozenAgain=0;for(let i=0;i<14;i++){step(r);if(r.api.G.hitStop)frozenAgain++;}assert.equal(r.api.R7.inspect().action.id,root);assert(r.api.R7.inspect().action.hits.length>=2,'fixture hits multiple opponents');assert.equal(frozenAgain,0,'later contacts in one cleave cannot restart freeze');
 step(r);assert(r.api.R7.inspect().clock>c);assert(enemies[0].t<t);assert.equal(enemies[0].state,'tell');assert.equal(enemies[0].attack.angle,1.4);assert(enemies[0].recoil>0);
 click(r,650,580);assert.equal(r.api.R7.inspect().targetId,null);assert.equal(r.api.R7.inspect().action,null);assert(r.api.R7.inspect().destination);step(r,150);assert.equal(r.api.G.flashes.length,0);assert.equal(r.api.G.numbers.length,0);assert.equal(enemies[0].recoil,0);assert.equal(enemies[0].state,'tell');assert.equal(enemies[0].attack.angle,1.4);
});
await check('pause/focus/portrait freeze animation and feedback, clear translation and pursuit, no stale restart velocity',async()=>{
 for(const stop of ['pause','blur','portrait','storage']){const r=await fresh(),h=r.api.G.hero;click(r,1000,600);step(r,35);assert(Math.hypot(h.vx,h.vy)>0);if(stop==='pause')r.api.setPause(true);else if(stop==='blur')r.emit('blur');else if(stop==='portrait')r.setViewport(390,844,true);else r.emit('storage',{key:r.api.R7Store.KEY});const before=JSON.stringify({x:h.x,y:h.y,pose:h.pose,visual:h.visual,clock:r.api.R7.inspect().clock});assert.equal(h.vx,0);assert.equal(h.vy,0);assert.equal(r.api.R7.inspect().destination,null);step(r,100);assert.equal(JSON.stringify({x:h.x,y:h.y,pose:h.pose,visual:h.visual,clock:r.api.R7.inspect().clock}),before);}
 const r=await fresh(2),h=r.api.G.hero,e=r.api.G.enemies[0];Object.assign(e,{x:h.x+35,y:h.y,state:'recover',t:100});click(r,e.x,e.y-16);for(let i=0;i<200&&!r.api.G.flashes.length;i++)step(r);r.api.setPause(true);const fx=JSON.stringify([r.api.G.flashes,r.api.G.numbers]);step(r,120);assert.equal(JSON.stringify([r.api.G.flashes,r.api.G.numbers]),fx);r.api.setPause(false);step(r,120);assert.equal(r.api.G.flashes.length+r.api.G.numbers.length,0);
});
console.log(JSON.stringify({status:'PASS',groups:checks.length,scope:'Deterministic motion/pose/contact/clock/state tests; no subjective visual quality or hardware claim.'},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
