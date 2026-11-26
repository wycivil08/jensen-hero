'use strict';
// Actual core/model/Havok probe. DOM/canvas/audio presentation only is stubbed.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'../../combat'),B=require(root+'/vendor/babylon.js'),Havok=require(root+'/vendor/HavokPhysics_umd.js');
const hashes=Object.fromEntries(['game.js','index.html','models.js','campaign-data.js','render-style.js'].map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+file)).digest('hex')]));
function el(){const o={style:{setProperty(k,v){this[k]=v;}},dataset:{},hidden:false,value:'',checked:false,children:[],handlers:{},setAttribute(k,v){this[k]=v;},remove(){},focus(){},addEventListener(name,cb){this.handlers[name]=cb;},getBoundingClientRect:()=>({left:0,top:0,width:1600,height:900}),appendChild(x){this.children.push(x);return x;},replaceChildren(...x){this.children=x;}};o.parentElement={};o.firstElementChild={style:{}};o.lastElementChild={style:{}};return o;}
global.OffscreenCanvas=class{constructor(w,h){this.width=w;this.height=h;}getContext(){return{fillRect(){},strokeRect(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},stroke(){},drawImage(){},save(){},restore(){},translate(){},scale(){},fillText(){},measureText:()=>({width:0})};}};
const nodes=new Map(),ctx={window:{BABYLON:B,addEventListener(){},location:{search:''}},document:{getElementById:id=>{if(!nodes.has(id))nodes.set(id,el());return nodes.get(id);},createElement:el,addEventListener(){},hidden:false},devicePixelRatio:1,performance,console,URLSearchParams};
for(const file of ['models.js','campaign-data.js','render-style.js','journey-setpiece.js','survivor-skills.js'])vm.runInNewContext(fs.readFileSync(root+'/'+file,'utf8'),ctx);
const source=fs.readFileSync(root+'/game.js','utf8');vm.runInNewContext(source.slice(0,source.lastIndexOf('(async()=>{'))+'\nwindow.review={Training,C,queryOptions,ui,setApp:value=>app=value};})();',ctx);

(async()=>{
  const {Training,C}=ctx.window.review;ctx.window.SurvivorSkills.install(Training.prototype);
  const engine=new B.NullEngine({renderWidth:1600,renderHeight:900}),h=await Havok({wasmBinary:fs.readFileSync(root+'/vendor/HavokPhysics.wasm')});
  const scene=new B.Scene(engine),plugin=new B.HavokPlugin(true,h);scene.useRightHandedSystem=true;scene.enablePhysics(new B.Vector3(0,-18,0),plugin);scene.physicsEnabled=false;
  const app=new Training(engine,scene,plugin,{stage:8,style:'3d',finale:true,lab:false});
  app.reset();app.ready=true;app.finaleState='playing';app.simTime=2;app.spawnAt=Infinity;app.settings.D=100;app.settings.crit=0;app.stageData={...app.stageData,cuda:false,shield:false,regen:false};
  const hero=app.hero,targets=app.actors.filter(a=>app.isHostile(a));
  function place(a,x,z){a.root.position.set(x,0,z);a.controller?.setPosition(new B.Vector3(x,a.m.height/2,z));a.velocity.setAll(0);a.recoil.setAll(0);a.previousFeet.copyFrom(a.root.position);}
  function setup(){app.clearTransient();app.combo=0;hero.action=null;hero.hp=hero.maxHP;hero.stun=0;hero.cooldowns=[0,0];place(hero,0,3);for(const [i,a]of targets.entries()){a.hp=a.maxHP=100000;a.dead=false;a.retired=false;a.action=null;a.dummy=true;place(a,12+i*.4,-8);}app.ended=false;app.paused=false;app.survivor=true;app.field={arenaX:26,arenaZ:18};app.damageEvents.length=0;app.lightningEvents.length=0;app.blockEvents.length=0;app.order=null;app.steerKeys=new Set();}
  setup();
  const rules=ctx.window.SurvivorSkills.rules;
  for(const mutate of [()=>{rules.leap.factor=0;},()=>{rules.cyclone.cooldown=0;},()=>{rules.cyclone.pulses[0]=0;},()=>{rules.thunder.hop=99;}])assert.throws(mutate,e=>e.name==='TypeError');
  const readback=app.snapshot();assert.throws(()=>{readback.warrior.rules.leap.factor=0;},e=>e.name==='TypeError');assert.throws(()=>{readback.warrior.names[0]='Changed';},e=>e.name==='TypeError');assert.equal(rules.leap.factor,2.8);
  app.stageIndex=2;app.stageData={...app.stageData,slot2:false};app.hud();assert.match(nodes.get('skill2')['aria-label'],/Locked/);assert.doesNotMatch(nodes.get('skill2')['aria-label'],/lightning/);
  app.stageData={...app.stageData,slot2:true};hero.cooldowns[1]=app.simTime+3;app.hud();assert.match(nodes.get('skill2')['aria-label'],/Cooldown 3.0 seconds/);assert.doesNotMatch(nodes.get('skill2')['aria-label'],/lightning/);app.stageIndex=8;app.hud();assert.match(nodes.get('skill2')['aria-label'],/lightning forks/);
  setup();
  // Legacy lab and v1/v2 retain their exact native actions and guard rules.
  app.survivor=false;const legacy=app.start(hero,'skill1',0);assert.equal(legacy.warrior,undefined);assert.equal(hero.cooldowns[0],app.simTime+C.skill1.cooldown);app.cancel(hero);app.survivor=true;
  setup();const a=targets[0],b=targets[1];place(a,.8,3);place(b,0,4.2);
  const spin=app.start(hero,'skill1',0);assert.equal(spin.warrior,'cyclone');assert.equal(hero.cooldowns[0]-app.simTime,6);
  for(const age of [.21,.22,.22,.57,.92,.99]){spin.previousAge=spin.age;spin.age=age;app.contacts(hero);}
  const sweeps=app.damageEvents.filter(e=>e.rootId.startsWith(spin.id+':sweep-'));assert.equal(sweeps.length,6);assert.equal(a.hp,100000-240);assert.equal(b.hp,100000-240);assert.equal(new Set(sweeps.map(e=>e.rootId)).size,3);
  app.order={type:'move',point:new B.Vector3(5,0,3)};assert(app.decide(hero,C.step).length()>0,'cyclone permits deliberate movement');
  const incoming=app.rootEvent(a,'punch',100,1,.1,.4);incoming.damageKind='ground_heat';const guard=app.mitigateHero(incoming,hero,a.root.position,100,'test');assert.equal(guard.requested,80);assert.equal(guard.prevented,20);assert.equal(hero.action,spin);
  app.simTime+=2.01;assert.equal(app.mitigateHero(incoming,hero,a.root.position,100,'expired').requested,100);
  app.cancel(hero);assert.equal(app.warriorGuardUntil,0);
  // A shield-only opening rewards timing once, with no offensive or healing side effects.
  setup();app.stageData={...app.stageData,shield:true,regen:true};const nativeRandom=app.random;app.random=()=>1;hero.yaw=0;place(a,0,4.4);
  const stance=app.start(hero,'skill1',0);app.hud();assert.match(nodes.get('skill1')['aria-label'],/0.18 seconds can parry one frontal ordinary hit/);stance.age=.08;const parryHP=hero.hp,outHP=a.hp,healCount=app.healEvents.length,cooldown=hero.cooldowns[0];
  const simple=()=>{const r=app.rootEvent(a,'punch',100,1,.1,.4);r.damageKind='ordinary_light_melee';return r;};
  const parried=simple();app.damage(parried,hero,hero.root.position,a.root.position,'melee','first');assert.equal(hero.hp,parryHP);assert.equal(stance.parryUsed,true);assert.equal(app.blockEvents.at(-1).mode,'cyclone-parry');
  assert.equal(app.floats.filter(f=>f.life>0&&f.element.textContent==='PARRY').length,1);assert(app.lines.some(l=>l.life>0&&l.type==='cyclone-parry-spark'));
  app.damage(parried,hero,hero.root.position,a.root.position,'melee','first');assert.equal(app.blockEvents.filter(e=>e.mode==='cyclone-parry').length,1,'duplicate packet cannot repeat its parry event');
  app.damage(parried,hero,hero.root.position,a.root.position,'melee','second');assert.equal(hero.hp,parryHP-80,'second packet has only ordinary 20 percent guard when passive roll misses');
  assert.equal(a.hp,outHP);assert.equal(a.stun,0);assert.equal(hero.cooldowns[0],cooldown);assert.equal(app.healEvents.length,healCount,'timed parry earns no regen');
  for(const [name,age,front,kind,shield]of [['rear',.08,false,'ordinary_light_melee',true],['expired',.18,true,'ordinary_light_melee',true],['charge',.08,true,'heavy_body_charge',true],['boss punch',.08,true,'heavy_boss_punch',true],['zone',.08,true,'ground_heat',true],['beam',.08,true,'persistent_beam',true],['gauntlet',.08,true,'ordinary_light_melee',false]]){
    setup();app.stageData={...app.stageData,shield};hero.yaw=0;place(a,0,front?4.4:1.6);const cast=app.start(hero,'skill1',0);cast.age=age;const attack=simple();attack.damageKind=kind;const hp=hero.hp;app.damage(attack,hero,hero.root.position,a.root.position,'melee',name);
    assert.equal(hero.hp,hp-80,name+' remains damageable');assert.equal(cast.parryUsed,false,name+' cannot consume a parry');assert.equal(app.blockEvents.filter(e=>e.mode==='cyclone-parry').length,0,name+' has no misleading parry cue');if(!shield){app.hud();assert.doesNotMatch(nodes.get('skill1')['aria-label'],/parry/);}
  }
  // An eligible frontal projectile can be parried on a new activation.
  setup();app.stageData={...app.stageData,shield:true};hero.yaw=0;place(a,0,4.4);const refreshed=app.start(hero,'skill1',0);refreshed.age=.179;const arrow=simple();arrow.damageKind='discrete_projectile';const arrowHP=hero.hp;app.damage(arrow,hero,hero.root.position,a.root.position,'projectile','arrow');assert.equal(hero.hp,arrowHP);assert.equal(refreshed.parryUsed,true);app.random=nativeRandom;app.stageData={...app.stageData,shield:false,regen:false};
  // A late frame schedules all pulse times once; walls still reject radial hits.
  setup();place(a,.8,3);const blocked=app.blocked;app.blocked=()=>true;const closed=app.start(hero,'skill1',0);closed.age=1;app.contacts(hero);assert.equal(app.damageEvents.length,0);app.blocked=blocked;
  // Leap has a locked destination, bounded native travel and no aerial immunity.
  setup();place(a,1,3);app.aim.set(4,0,3);const leap=app.start(hero,'skill2',Math.PI/2);assert.equal(leap.warrior,'leap');assert.equal(hero.cooldowns[1]-app.simTime,8);app.aim.set(-9,0,-9);assert.equal(leap.landing.x,4);
  leap.age=.12;assert.equal(app.decide(hero,C.step).length(),0);leap.age=.4;assert(app.decide(hero,C.step).x>0);app.pose(hero);assert(hero.rig.pelvis.position.y>1,'actual rig lifts during flight');
  const before=hero.hp;app.damage(incoming,hero,hero.root.position,a.root.position,'ground','airborne');assert(hero.hp<before,'leap remains damageable');
  const hp=a.hp;leap.age=.65;app.contacts(hero);assert.equal(a.hp,hp,'no impact before landing');leap.age=.66;app.pose(hero);assert(hero.rig.limbs.l.shoulder.rotation.x>-.6,'hammer drops by actual landing contact');app.contacts(hero);const landed=a.hp;app.contacts(hero);assert.equal(a.hp,landed,'one landing cannot damage twice');assert.equal(hp-landed,280);assert(app.warriorThunder.length>0);
  // Native post-landing timed lightning deals positive HP damage and records it.
  app.cancel(hero,"followup-input");assert.equal(leap.cancelled,true);hero.stun=999;place(a,1,3);place(b,2,3);for(let i=0;i<90;i++)app.tick(C.step);
  const bolts=app.lightningEvents.filter(e=>e.cosmetic===false);assert(bolts.length>=2);assert(bolts.every(e=>e.damage>0));assert.equal(new Set(bolts.map(e=>e.time)).size,bolts.length,'forks resolve at separate times');
  assert(app.damageEvents.some(e=>e.channel==='lightning'&&e.actual===75));
  // Hammer basic earns actual thunder only after real contact; gauntlets do not.
  setup();place(a,1,3);const basic=app.rootEvent(hero,'basic',100,.45,.1,.3);app.damage(basic,a,a.root.position,hero.root.position,'direct');assert.equal(app.warriorThunder.length,1);app.damage(basic,a,a.root.position,hero.root.position,'direct');assert.equal(app.warriorThunder.length,1);
  app.clearTransient();assert.equal(app.warriorThunder.length,0);assert.equal(app.warriorGuardUntil,0);app.stageIndex=2;const fist=app.rootEvent(hero,'basic',100,.45,.1,.3);app.damage(fist,a,a.root.position,hero.root.position,'direct');assert.equal(app.warriorThunder.length,0);
  // The real target-click handler cancels a contacted swing without erasing its earned discharge.
  setup();app.stageIndex=8;place(a,1.2,3);place(b,0,4.2);app.selectedID=a.id;
  const contacted=app.start(hero,'basic',Math.PI/2);contacted.previousAge=contacted.windup-.01;contacted.age=contacted.windup+.02;app.pose(hero);app.contacts(hero);
  assert(app.damageEvents.some(e=>e.rootId===contacted.id&&e.actual>0));assert.equal(app.warriorThunder.length,1);
  const pointerRay=app.pointerRay;app.pointerRay=()=>new B.Ray(b.root.position.add(new B.Vector3(0,20,0)),new B.Vector3(0,-1,0));
  ctx.window.review.ui.view.handlers.pointerdown({button:0,pointerType:'mouse',preventDefault(){}});app.pointerRay=pointerRay;
  assert.equal(app.selectedID,b.id);assert.equal(contacted.cancelReason,'target-change');assert.equal(app.warriorThunder.length,1);
  hero.stun=999;for(let i=0;i<90;i++)app.tick(C.step);
  const earned=app.damageEvents.filter(e=>e.channel==='lightning');assert.equal(earned.length,2,'basic thunder keeps its two-target cap after retarget');assert(earned.every(e=>e.actual===45));assert.equal(new Set(earned.map(e=>e.target)).size,2);
  // A miss/precontact cancel earns nothing; a new skill cannot cancel already released thunder.
  setup();const missed=app.start(hero,'basic',0);app.cancel(hero,'target-change');assert.equal(missed.directRecords.length,0);assert.equal(app.warriorThunder.length,0);
  setup();place(a,1,3);const paid=app.start(hero,'basic',Math.PI/2);app.damage(paid,a,a.root.position,hero.root.position,'direct');app.cancel(hero,'skill-input');app.start(hero,'skill1',0);assert.equal(app.warriorThunder.length,1);
  hero.action=null;hero.stun=999;const occlusion=app.blocked;app.blocked=()=>true;for(let i=0;i<90;i++)app.tick(C.step);assert.equal(app.damageEvents.filter(e=>e.channel==='lightning').length,0,'released thunder still respects walls');app.blocked=occlusion;
  setup();place(a,1,3);const doomed=app.start(hero,'basic',Math.PI/2);app.damage(doomed,a,a.root.position,hero.root.position,'direct');hero.dead=true;app.tick(C.step);assert.equal(app.warriorThunder.length,0);hero.dead=false;
  setup();app.stageIndex=8;app.aim.set(12,0,3);const solid=app.solidHit;app.solidHit=()=>({t:.5});const cut=app.start(hero,'skill2',Math.PI/2);assert(cut.landing.x<=2.2,'solid truncates destination before flight');app.solidHit=solid;app.cancel(hero,'pause',true);assert.equal(app.warriorThunder.length,0);
  scene.dispose();engine.dispose();console.log(JSON.stringify({pass:true,checks:['immutable exported rules','accessible skill states','legacy isolation','three real cyclone pulses','movement','finite guard','guard expiry','wall rejection','locked leap aim','flight pose','aerial damage','single landing','timed real lightning','hammer-only passive','cleanup','solid truncation','post-contact target-change discharge','post-landing cancellation discharge','precontact cancellation','released wall/cap/death boundaries','one timed shield parry','duplicate parry suppression','rear/time/second/heavy/zone/gauntlet parry exclusions','projectile parry','no parry damage heal stun or cooldown bonus']}));
})().catch(e=>{console.error(e);process.exitCode=1;});
