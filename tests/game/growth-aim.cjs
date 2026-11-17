'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const Data=require('../../game/combat-data.js'),{makeRuntime}=require('./harness.cjs');
const html=fs.readFileSync(require('./candidate.cjs').html,'utf8');
const dt=1/120;
function step(r,n=1){for(let i=0;i<n;i++)r.step(dt);}
function pointer(r,type,id=2,x=800,y=300,target='btnAtk'){r.dispatch(r.ids.get(target),type,{pointerType:'touch',pointerId:id,isPrimary:id===1,button:0,clientX:x,clientY:y});}
function patch(r,section,values,existing=false){const result=r.api.R7.lab.patch(section,r.api.R7Store.clone(values),existing);assert(result.ok,result.error);}
async function fresh(stage=8){const accesses=[],r=makeRuntime(html,{coarse:true,width:900,height:450,search:'?lab=1&debug=1',storage:{getItem(k){accesses.push(k);return null;},setItem(k){accesses.push(k);}}});await r.api.R7.start();assert(r.api.R7.lab.reset(stage).ok);r.api.R7.lab.clear();r.api.R7.lab.staticAI(true);Object.assign(r.api.G.hero,{x:650,y:500,oldX:650,oldY:500,aim:0,bodyAng:0,headAng:0,vx:0,vy:0});step(r,45);r.accesses=accesses;return r;}
function target(r,count=1,hp=100000,type='gunner'){patch(r,'enemy:'+type,{hp});assert(r.api.R7.lab.spawn(type,count).ok);const h=r.api.G.hero;for(const [i,e]of r.api.G.enemies.entries())Object.assign(e,{x:h.x+36+i*2,y:h.y+i*5,oldX:h.x+36+i*2,oldY:h.y+i*5,entered:true});return r.api.G.enemies;}
let groups=0;async function check(name,fn){await fn();groups++;console.log('PASS '+name);}
(async()=>{
await check('eight real growth kits validate, native enemies do not rescale, finite tuning remains atomic',async()=>{
 const damage=[20,60,180,500,1200,2400,4000,6000],hp=[100,180,300,500,800,1200,1800,2500],cycles=[.5,.36,.36,.36,.36,.36,.45,.45];
 const r=await fresh();for(let stage=1;stage<=8;stage++){const c=Data.growthDefaults(stage);assert.equal(c.auto.damage,damage[stage-1]);assert.equal(c.hero.hp,hp[stage-1]);assert.equal(c.auto.cycle,cycles[stage-1]);assert(Data.validatePatch(c,'auto',{}).ok);assert.equal(c.types.gunner.hp,120);r.api.R7.lab.reset(stage);assert.equal(r.api.G.hero.hp,hp[stage-1]);for(const e of r.api.G.enemies)assert.equal(e.hp,r.api.R7.lab.config().types[e.typeId].hp);assert.equal(r.api.G.growth.chapterId,'arcade');}
 const seats=Object.values(Data.growthDefaults(8).types).filter(t=>t.ownerKind==='independent_seat');assert.equal(seats.length,10);assert.equal(seats.reduce((n,t)=>n+t.hp,0),1200000);assert.equal(new Set(r.api.G.enemies.map(e=>e.ownerId)).size,10);
 const before=JSON.stringify(r.api.R7.lab.config());for(const bad of [{damage:100001},{critChance:1.01},{critMultiplier:0},{cycle:0},{damage:Infinity}])assert.equal(r.api.R7.lab.patch('auto',r.api.R7Store.clone(bad)).ok,false);assert.equal(JSON.stringify(r.api.R7.lab.config()),before);assert.deepEqual(r.accesses,[]);
 r.api.R7.lab.reset(1);r.api.R7.lab.tray(true);assert.equal(r.api.R7.lab.config().auto.damage,35);assert.equal(r.api.R7.lab.config().auto.cycle,.55);r.api.R7.lab.tray(false);assert.equal(r.api.R7.lab.config().auto.damage,20);
});
await check('G8 direct, skill and CUDA actual HP arithmetic shares one crit roll per accepted root',async()=>{
 for(const [slot,base]of [[0,6000],[1,4500],[2,12000]])for(const crit of [false,true]){
  const r=await fresh(),enemies=target(r,3);patch(r,'auto',{critChance:crit?1:0});let rolls=0;r.sandbox.Math.random=()=>{rolls++;return .1;};
  if(slot){r.emit('keydown',{code:'Digit'+slot});r.emit('keyup',{code:'Digit'+slot});}else{pointer(r,'pointerdown');pointer(r,'pointermove',2,820,300);pointer(r,'pointerup',2,820,300);}
  step(r);const action=r.api.R7.inspect().action,active=r.api.R7.inspect().activeState.active,root=action?.id||active?.rootId;assert(root);assert.equal(rolls,1,'one RNG draw at acceptance');
  patch(r,'auto',{damage:1,critChance:crit?0:1,critMultiplier:7});
  for(let i=0;i<100&&!r.api.R7.inspect().damageLog.some(h=>h.rootId===root);i++)step(r);
  const log=r.api.R7.inspect().damageLog.filter(h=>h.rootId===root),direct=log.filter(h=>h.source!=='cuda'),cuda=log.filter(h=>h.source==='cuda');assert(direct.length,'contact for slot '+slot);assert.equal(rolls,1);
  for(const hit of direct){assert.equal(hit.baseDamage,base);assert.equal(hit.critMultiplier,crit?2:1);assert.equal(hit.hpLoss,base*(crit?2:1));assert.equal(hit.hpBefore-hit.hpAfter,hit.hpLoss);}
  assert(cuda.length);assert(cuda.length<=4);for(const hit of cuda){assert.equal(hit.baseDamage,3000);assert.equal(hit.critMultiplier,1);assert.equal(hit.hpLoss,3000);}
  assert(r.api.R7.lab.inspect().latestDirect);assert(r.api.R7.lab.inspect().latestCuda);assert.match(r.ids.get('r15Damage').textContent,/最近直接/);assert.match(r.ids.get('r15Damage').textContent,/最近CUDA/);
  pointer(r,'pointerup');step(r,3);assert.equal(rolls,1,'release does not reroll or recurse');assert(enemies.some(e=>e.hp<e.maxHp));
 }
});
await check('damage evidence separates shield mitigation and low-HP clipping from raw crit',async()=>{
 const r=await fresh();patch(r,'auto',{critChance:1});const [e]=target(r,1,100,'shield_soldier');e.face=Math.PI;e.shieldClosed=true;
 pointer(r,'pointerdown');pointer(r,'pointermove',2,830,300);pointer(r,'pointerup',2,830,300);for(let i=0;i<60&&!r.api.R7.inspect().damageLog.length;i++)step(r);
 const hit=r.api.R7.inspect().damageLog[0];assert.equal(hit.baseDamage,6000);assert.equal(hit.rawDamage,12000);assert(hit.mitigation<1);assert.equal(hit.hpLoss,100);assert(hit.mitigatedDamage>hit.hpLoss);assert.equal(hit.hpAfter,0);r.api.R7.lab.clear();assert.equal(r.api.R7.lab.inspect().latestDirect,null);assert.equal(r.api.R7.lab.inspect().latestCuda,null);
});
await check('release-only aim preview, nearest behind assist and explicit direction lock',async()=>{
 const r=await fresh(2),[e]=target(r);e.x=r.api.G.hero.x-36;pointer(r,'pointerdown');step(r,40);assert.equal(r.api.R7.inspect().action,null,'held center does not shoot');pointer(r,'pointerup');const hit=r.api.R7.inspect().action;assert(hit);assert(Math.abs(Math.abs(hit.angle)-Math.PI)<1e-9,'nearest behind selected');pointer(r,'lostpointercapture');step(r,20);assert(r.api.R7.inspect().damageLog.some(h=>h.rootId===hit.id));step(r,60);
 r.api.R7.lab.clear();step(r,45);pointer(r,'pointerdown');pointer(r,'pointermove',2,809,300);assert.equal(r.api.R7.inspect().aim.explicit,false);pointer(r,'pointermove',2,830,300);step(r,60);assert.equal(r.api.R7.inspect().action,null,'drag preview causes no attack');assert.equal(r.api.R7.inspect().damageLog.length,0);pointer(r,'pointerup',2,830,300);assert.equal(r.api.R7.inspect().action.angle,0,'explicit empty swing accepted');step(r,80);assert.equal(r.api.R7.inspect().action,null);
});
await check('floating pointers, queued release, cancel cooldown and lifecycle boundaries',async()=>{
 const r=await fresh(8);r.ids.get('joyBase').getBoundingClientRect=()=>({left:20,top:200,width:104,height:104});pointer(r,'pointerdown',1,180,250,'game');assert.equal(r.api.Input.st.joyId,1);assert.equal(r.api.Input.st.jx,0);pointer(r,'pointermove',1,120,250,'game');assert(r.api.Input.st.jx<0);pointer(r,'pointerdown',2);pointer(r,'pointermove',2,830,300);step(r);assert.equal(r.api.R7.inspect().action,null);pointer(r,'pointerup',2,830,300);const first=r.api.R7.inspect().action;assert(first);const x=r.api.G.hero.x;step(r,5);assert(r.api.G.hero.x<x);assert.equal(r.api.R7.inspect().action.id,first.id);pointer(r,'pointerdown',2);pointer(r,'pointermove',2,770,300);pointer(r,'pointerup',2,770,300);assert(r.api.R7.inspect().releaseRequest);assert.equal(r.api.R7.inspect().releaseRequest.angle,Math.PI);assert.match(r.ids.get('r14Status').textContent,/已排队/);assert.equal(r.api.Input.st.joyId,1);
 r.emit('blur');assert.equal(r.api.Input.st.joyId,null);assert.equal(r.api.R7.inspect().releaseRequest,null);assert.equal(r.api.R7.inspect().action,null);r.api.setPause(false);step(r,80);assert.equal(r.api.R7.inspect().action,null);
 pointer(r,'pointerdown');pointer(r,'pointermove',2,830,300);step(r);r.setViewport(450,900,true);assert.equal(r.api.R7.inspect().action,null);assert.equal(r.api.Input.st.atkId,null);r.setViewport(900,450,true);step(r,80);assert.equal(r.api.R7.inspect().action,null);
});
await check('full-kit shortcut, current-stage first normal selection, summary and storage isolation',async()=>{
 const r=await fresh(1);for(let stage=1;stage<=8;stage++){r.ids.get('r14Stage').value=String(stage);r.dispatch(r.ids.get('r14Stage'),'change');const cfg=r.api.R7.lab.config(),options=r.ids.get('r14Enemy').children;assert.equal(options.length,29);assert.equal(cfg.types[options[0].value].stage,stage);assert.equal(cfg.types[r.ids.get('r14Enemy').value].stage,stage);if(stage<8)assert.equal(cfg.types[r.ids.get('r14Enemy').value].boss,false);assert.match(r.ids.get('r15Summary').textContent,new RegExp('普攻 '+cfg.auto.damage));}
 r.api.R7.lab.reset(1);r.ids.get('r15Full').click();assert.equal(r.api.R7.lab.config().stage,8);assert.equal(r.api.G.hero.hp,2500);assert.deepEqual(r.accesses,[]);
});
console.log(JSON.stringify({status:'PASS',groups,scope:'R17 numerical/pointer/snapshot acceptance; browser feel and real-device behavior not implied.'}));
})().catch(e=>{console.error(e);process.exitCode=1;});
