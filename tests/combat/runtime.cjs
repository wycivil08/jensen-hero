'use strict';
// Actual core/model/Havok probe. DOM/canvas/audio presentation only is stubbed.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'../../combat'),B=require(root+'/vendor/babylon.js'),Havok=require(root+'/vendor/HavokPhysics_umd.js');
const hashes=Object.fromEntries(['game.js','index.html','models.js','campaign-data.js','render-style.js'].map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+file)).digest('hex')]));
function el(){const o={style:{setProperty(k,v){this[k]=v;}},dataset:{},hidden:false,value:'',checked:false,children:[],handlers:{},setAttribute(k,v){this[k]=v;},remove(){},focus(){},addEventListener(name,cb){this.handlers[name]=cb;},getBoundingClientRect:()=>({left:0,top:0,width:1600,height:900}),appendChild(x){this.children.push(x);return x;},replaceChildren(...x){this.children=x;}};o.parentElement={};o.firstElementChild={style:{}};o.lastElementChild={style:{}};return o;}
global.OffscreenCanvas=class{constructor(w,h){this.width=w;this.height=h;}getContext(){return{fillRect(){},strokeRect(){},clearRect(){},drawImage(){},save(){},restore(){},translate(){},scale(){},fillText(){},measureText:()=>({width:0})};}};
const nodes=new Map(),ctx={window:{BABYLON:B,addEventListener(){},location:{search:''}},document:{getElementById:id=>{if(!nodes.has(id))nodes.set(id,el());return nodes.get(id);},createElement:el,addEventListener(){},hidden:false},devicePixelRatio:1,performance,console,URLSearchParams};
for(const file of ['models.js','campaign-data.js','render-style.js'])vm.runInNewContext(fs.readFileSync(root+'/'+file,'utf8'),ctx);
const source=fs.readFileSync(root+'/game.js','utf8');vm.runInNewContext(source.slice(0,source.lastIndexOf('(async()=>{'))+'\nwindow.review={Training,C,queryOptions,ui};})();',ctx);
const results=[];function check(name,fn){try{const evidence=fn();results.push({name,pass:true,evidence});}catch(e){results.push({name,pass:false,error:e.message});}console.log(JSON.stringify(results.at(-1)));}
(async()=>{const engine=new B.NullEngine({renderWidth:1600,renderHeight:900}),scene=new B.Scene(engine);scene.useRightHandedSystem=true;const h=await Havok({wasmBinary:fs.readFileSync(root+'/vendor/HavokPhysics.wasm')}),plugin=new B.HavokPlugin(true,h);scene.enablePhysics(new B.Vector3(0,-18,0),plugin);scene.physicsEnabled=false;scene.animationsEnabled=false;
const {Training,C,queryOptions,ui}=ctx.window.review,D=ctx.window.R24Data,V=(x=0,y=0,z=0)=>new B.Vector3(x,y,z),app=new Training(engine,scene,plugin,{stage:8,style:'3d',lab:true});app.hud=()=>{};app.reset();app.ready=true;
const setup=stage=>{app.selectStage(stage);app.settings.crit=0;app.spawnAt=Infinity;app.clearTransient();};
const ticks=n=>{for(let i=0;i<n;i++)app.tick(C.step);};
const place=(a,x,z,owner=app)=>{a.root.position.set(x,.025,z);a.controller?.setPosition(V(x,a.m.height/2+.025,z));a.previousFeet.copyFrom(a.root.position);a.velocity.setAll(0);owner.pose(a);a.previousWeapon.copyFrom(owner.weapon(a));};
const isolate=()=>{for(const a of [...app.actors])if(a!==app.hero){app.disposeActor(a);app.actors.splice(app.actors.indexOf(a),1);}};
check('strict query rejection',()=>{for(const q of ['?stage=0','?stage=8.0','?stage=2&stage=3','?style=2d','?style=3d&style=painted'])assert.throws(()=>queryOptions(q));return queryOptions('?stage=7&style=painted');});
check('stage native waves, counts and repeated-reset resources',()=>{const out=[];for(let s=1;s<=8;s++){setup(s);const counts=()=>[scene.meshes.length,scene.transformNodes.length,scene.materials.length,app.physics.getBodies().length];const base=counts();app.reset();assert.deepEqual(counts(),base);assert.equal(app.actors.filter(a=>app.isHostile(a)).length,D.stages[s-1].waves[0].enemies.reduce((n,x)=>n+x.count,0));out.push({stage:s,enemies:app.actors.filter(a=>app.isHostile(a)).length});}return out;});
check('hammer fan 4 front, rear excluded, per-root dedupe and no extra lightning damage',()=>{setup(7);isolate();place(app.hero,0,0);app.hero.yaw=0;const enemies=[[-.75,1.2],[-.25,1.3],[.25,1.3],[.75,1.2],[0,-1.3]].map(([x,z],i)=>app.makeActor(['t'+i,'needle_creature',x,z,.85],true));const before=enemies.map(a=>a.hp);const r=app.start(app.hero,'basic',0);ticks(32);assert.equal(enemies.filter((a,i)=>a.hp<before[i]).length,4);assert.equal(enemies[4].hp,before[4]);assert.equal(app.lightningEvents.length,1);assert(app.damageEvents.filter(e=>e.channel==='direct').every(e=>e.actual===4000));assert.equal(r.directHit.size,4);return {direct:[...r.directHit],lightning:app.lightningEvents};});
check('real native geometry wall blocks fan, empty swing has no damage/lighting',()=>{setup(7);isolate();place(app.hero,0,0);app.hero.yaw=0;const target=app.makeActor(['wall-target','needle_creature',0,1.5,.85],true),wall=B.MeshBuilder.CreateBox('controlled-wall',{width:3,height:3,depth:.12},scene);wall.position.set(0,1.5,.8);const ag=new B.PhysicsAggregate(wall,B.PhysicsShapeType.BOX,{mass:0},scene);app.solids.add(wall);app.obstacles.push(wall);const hp=target.hp;app.start(app.hero,'basic',0);ticks(32);assert.equal(target.hp,hp);assert.equal(app.lightningEvents.length,0);app.solids.delete(wall);app.obstacles.splice(app.obstacles.indexOf(wall),1);ag.dispose();wall.dispose();app.cancel(app.hero,'probe',true);app.start(app.hero,'basic',Math.PI);ticks(32);assert.equal(target.hp,hp);return {hp,events:app.damageEvents.length};});
check('CUDA all three sources final direct exclusions and accepted D snapshot',()=>{const out=[];for(const type of ['basic','skill1','skill2']){setup(8);isolate();place(app.hero,0,0);app.hero.yaw=0;const seed=app.makeActor(['seed','seat_01',0,1,1],true),direct2=app.makeActor(['direct2','seat_04',.6,1,1],true),extra=app.makeActor(['extra','seat_08',0,3.3,1],true);const r=app.start(app.hero,type,0);assert(r);const pt=a=>a.root.position.add(V(0,.7,0));app.damage(r,seed,pt(seed),app.hero.root.position,'direct');app.damage(r,direct2,pt(direct2),app.hero.root.position,'direct');assert.equal(app.cudaEvents.length,0);const hp=extra.hp;app.settings.D=9999;app.finalizeRoot(r);const event=app.cudaEvents[0];assert(event);assert.equal(event.seedActual,0);assert(event.edges.every(e=>!r.directHit.has(e.to)&&e.depth<=2));assert.equal(extra.hp,hp-3000);assert.equal(event.edges.length,1);out.push({type,excluded:event.directExcluded,edges:event.edges});}return out;});
check('shield per incoming root, danger exclusions, regen cap/CD/fullHP/zeroHP',()=>{setup(8);isolate();place(app.hero,0,0);app.hero.yaw=0;const enemy=app.makeActor(['shooter','seat_02',0,2,1],true),r=app.rootEvent(enemy,'shoot',225,2,1,1.02);r.shieldDecisions.set(app.hero.id,true);const point=app.hero.root.position.add(V(0,.7,0));app.damage(r,app.hero,point,enemy.root.position,'projectile','shot0');assert.equal(app.hero.hp,2500);assert.equal(app.nextRegen,4);assert.equal(app.healEvents.at(-1).actual,0);const damageRoot=app.rootEvent(enemy,'shoot',100,2,1,1.02);damageRoot.damageKind='ground_heat';app.damage(damageRoot,app.hero,point,enemy.root.position,'ground','h0');assert.equal(app.hero.hp,2400);app.damage(r,app.hero,point,enemy.root.position,'projectile','shot1');assert.equal(app.hero.hp,2400);app.simTime=4;app.damage(r,app.hero,point,enemy.root.position,'projectile','shot2');assert.equal(app.hero.hp,2475);assert.equal(app.healEvents.at(-1).actual,75);const zero=app.rootEvent(enemy,'shoot',3000,2,1,1.02);zero.damageKind='ground_heat';app.damage(zero,app.hero,point,enemy.root.position,'ground','kill-to-immortal-zero');assert.equal(app.hero.hp,0);app.simTime=10;app.damage(r,app.hero,point,enemy.root.position,'projectile','shot3');assert.equal(app.hero.hp,0);return {events:app.healEvents,nextRegen:app.nextRegen};});
check('root crit snapshot and shared direct dedupe',()=>{setup(8);isolate();place(app.hero,0,0);const enemies=[1,2].map(i=>app.makeActor(['crit'+i,'seat_02',i*.5,1,1],true));app.settings.crit=1;const r=app.start(app.hero,'basic',0);app.settings.crit=0;app.settings.D=1;for(const a of enemies){const before=a.hp;app.damage(r,a,a.root.position,app.hero.root.position,'direct');app.damage(r,a,a.root.position,app.hero.root.position,'direct');assert.equal(a.hp,before-12000);}return {crit:r.crit,acceptedD:r.acceptedBaseD,owners:r.directHit.size};});
check('actual seeded shield probability, root reuse and back-ineligible no draw',()=>{setup(8);isolate();place(app.hero,0,0);app.hero.yaw=0;const enemy=app.makeActor(['rng','seat_02',0,2,1],true),real=app.random.bind(app);let draws=0,blocks=0;app.random=()=>{draws++;return real();};try{const r=app.rootEvent(enemy,'shoot',100,2,1,1.02);app.mitigateHero(r,app.hero,V(0,0,-2),100,'rear');assert.equal(draws,0);for(let i=0;i<1000;i++){const r=app.rootEvent(enemy,'shoot',100,2,1,1.02),first=app.mitigateHero(r,app.hero,enemy.root.position,100,'a'),second=app.mitigateHero(r,app.hero,enemy.root.position,100,'b');assert.equal(first.rolled,second.rolled);blocks+=first.mode==='random-block';}assert.equal(draws,1000);assert(blocks>250&&blocks<350);return {draws,blocks,roots:1000};}finally{app.random=real;}});
check('CUDA zero-loss/no-neighbor/cooldown/discard negative paths',()=>{setup(8);isolate();place(app.hero,0,0);const a=app.makeActor(['seed','seat_01',0,1,1],true);let r=app.start(app.hero,'basic',0);r.base=0;app.damage(r,a,a.root.position,app.hero.root.position,'direct');assert.equal(r.cudaReserved,false);assert.equal(app.nextCUDA,0);app.cancel(app.hero,'controlled-zero',true);r=app.start(app.hero,'basic',0);app.damage(r,a,a.root.position,app.hero.root.position,'direct');app.finalizeRoot(r);assert.equal(app.cudaEvents[0].reason,'no-extra-target');assert.equal(app.cudaEvents[0].edges.length,0);assert.equal(app.nextCUDA,1.2);app.cancel(app.hero,'controlled-next',true);const r2=app.start(app.hero,'basic',0);app.damage(r2,a,a.root.position,app.hero.root.position,'direct');assert.equal(r2.cudaReserved,false);app.finalizeRoot(r2);assert.equal(app.cudaEvents.length,1);app.cancel(app.hero,'controlled-discard',true);app.simTime=2;const r3=app.start(app.hero,'basic',0);app.damage(r3,a,a.root.position,app.hero.root.position,'direct');assert.equal(r3.cudaReserved,true);app.finalizeRoot(r3,true);assert.equal(app.cudaEvents.length,1);return {zeroNoReserve:true,noNeighborConsumes:true,cdNoResolve:true,discardNoResolve:true};});
check('slot1 guard window returns to equipment random block after active interval',()=>{setup(8);isolate();place(app.hero,0,0);app.hero.yaw=0;const enemy=app.makeActor(['shooter','seat_02',0,2,1],true),incoming=app.rootEvent(enemy,'shoot',200,2,1,1.02);incoming.shieldDecisions.set(app.hero.id,true);const own=app.start(app.hero,'skill1',0);const modes=[];for(const age of [.079,.08,.259,.26,.30]){own.age=age;const m=app.mitigateHero(incoming,app.hero,enemy.root.position,200,'a');modes.push([age,m.mode]);assert.equal(m.mode,age>=.08&&age<.26?'active-half':'random-block');}return modes;});
check('seat heal snapshot, no replacement and death/interrupt priority',()=>{setup(8);isolate();place(app.hero,0,0);const healer=app.makeActor(['seat_06','seat_06',0,3,1],true),targets=[1,4,7,8,10].map((n,i)=>app.makeActor(['seat_'+String(n).padStart(2,'0'),'seat_'+String(n).padStart(2,'0'),(i-2)*.5,3.5,1],true));const hr=app.rootEvent(app.hero,'basic',6000,.45,.1,.24);for(const a of targets)app.damage(hr,a,a.root.position,app.hero.root.position,'direct');const r=app.start(healer,'heal',0);assert.equal(r.castTargets.length,4);assert(!r.castTargets.includes(healer.id));const doomed=targets.find(a=>a.id===r.castTargets[0]);const killer=app.rootEvent(app.hero,'basic',600000,.45,.1,.24);app.damage(killer,doomed,doomed.root.position,app.hero.root.position,'direct');assert.equal(doomed.hp,0);r.age=r.windup;app.healQueue.push({actor:healer,root:r});app.resolveHeals();assert.equal(app.healEvents.at(-1).targets.length,3);assert.equal(doomed.hp,0);const r2=app.start(healer,'heal',0);app.cancel(healer,'interrupted');app.healQueue.push({actor:healer,root:r2});app.resolveHeals();assert.equal(app.healEvents.at(-1).reason,'cancelled');assert.equal(healer.healAttempts,2);return app.healEvents.map(e=>({type:e.type,targets:e.targets,reason:e.reason}));});
check('fan outer-corner circle intersection excludes true geometric miss',()=>{setup(7);isolate();place(app.hero,0,0);app.hero.yaw=0;const dist=3.8,theta=Math.PI/3+.25,target=app.makeActor(['corner','ember_beast',Math.sin(theta)*dist,Math.cos(theta)*dist,1.5],true),corner=V(Math.sin(Math.PI/3)*2.8,0,Math.cos(Math.PI/3)*2.8),center=target.root.position.clone();center.y=0;const nearest=B.Vector3.Distance(corner,center),radius=target.m.hurtRadius;assert(nearest>radius);const before=target.hp,r=app.start(app.hero,'basic',0);ticks(32);assert.equal(target.hp,before,'true sector-corner miss was damaged; nearest='+nearest+' radius='+radius);return {nearest,radius,hit:[...r.directHit]};});
check('slot2 true expanding ring cap six and no repeated direct owner',()=>{setup(7);isolate();place(app.hero,0,0);app.hero.yaw=0;const enemies=Array.from({length:8},(_,i)=>{const t=i*Math.PI/4;return app.makeActor(['ring'+i,'needle_creature',Math.sin(t)*1.5,Math.cos(t)*1.5,.85],true);});const before=enemies.map(a=>a.hp);const r=app.start(app.hero,'skill2',0);ticks(75);assert.equal(enemies.filter((a,i)=>a.hp<before[i]).length,8);assert.equal(r.directHit.size,6);assert.equal(app.damageEvents.filter(e=>e.channel==='direct').length,6);assert(app.damageEvents.filter(e=>e.channel==='direct').every(e=>e.actual===8000));return {direct:[...r.directHit],events:app.damageEvents.length};});
check('same-tick released heal can still be interrupted before resolution',()=>{setup(8);isolate();place(app.hero,0,0);const healer=app.makeActor(['seat_06','seat_06',0,2,1],false),target=app.makeActor(['seat_04','seat_04',1,2,1],true);const hit=app.rootEvent(app.hero,'basic',6000,.45,.1,.24);app.damage(hit,target,target.root.position,app.hero.root.position,'direct');const r=app.start(healer,'heal',0);r.age=1.805;r.previousAge=1.795;r.released=true;app.healQueue.push({actor:healer,root:r});const hp=target.hp,skill=app.rootEvent(app.hero,'skill1',4500,.4,.1,.26);app.damage(skill,healer,healer.root.position,app.hero.root.position,'direct');app.resolveHeals();assert.equal(target.hp,hp);assert.equal(app.healEvents.at(-1).reason,'cancelled');return {castSpent:healer.healAttempts,cancelled:r.cancelled,targetHP:target.hp};});
check('wave waits for actual released hazard and final stage has no ninth upgrade',()=>{setup(8);isolate();app.clearTransient();const p=app.projectiles[0],enemy=app.makeActor(['released-owner','seat_02',4,0,1],true),r=app.rootEvent(enemy,'shoot',225,2,1,1.02);app.launch(r,V(8,1,0),V(0,0,1),0,'bolt',{life:.3});app.disposeActor(enemy);app.actors.splice(app.actors.indexOf(enemy),1);app.checkProgress();assert.equal(app.ended,false);assert.equal(app.progressEvents.some(x=>x.type==='campaign-complete'),false);app.retireProjectile(p);app.checkProgress();assert.equal(app.ended,true);assert.equal(app.stageIndex,8);assert.equal(app.progressEvents.filter(x=>x.type==='upgrade').length,0);return {waited:true,finalStage:app.stageIndex};});
check('actual enemy update/release danger concurrency and resource bounds',()=>{const out=[];for(const stage of [2,3,4,5,6,7,8]){setup(stage);app.spawnAt=0;let max=0,projectile=0;for(let i=0;i<360;i++){app.tick(C.step);max=Math.max(max,app.warningRoots.size);projectile=Math.max(projectile,app.projectiles.filter(p=>p.root).length);assert(max<=2);assert(app.projectiles.filter(p=>p.root).length<=C.maxProjectiles);}out.push({stage,maxDanger:max,maxPackets:projectile,damageEvents:app.damageEvents.length});}return out;});
check('new healing admission waits for injured teammate; admitted lost target still spends attempt',()=>{setup(8);app.spawnAt=0;app.simTime=6;const healer=app.actors.find(a=>a.seat===6),target=app.actors.find(a=>a.seat===4);app.decide(healer,C.step);assert.equal(healer.action,null);assert.equal(healer.healAttempts,0);const hit=app.rootEvent(app.hero,'basic',6000,.45,.1,.24);app.damage(hit,target,target.root.position,app.hero.root.position,'direct');assert(app.healTargets(healer).includes(target.id));app.decide(healer,C.step);assert.equal(healer.action.type,'heal');assert.equal(healer.healAttempts,1);const r=healer.action,deadline=healer.nextHeal;place(target,10,5);r.age=r.windup;app.healQueue.push({actor:healer,root:r});app.resolveHeals();assert.equal(app.healEvents.at(-1).targets.length,0);assert.equal(healer.healAttempts,1);assert.equal(healer.nextHeal,deadline);return {emptyInitialAttempts:0,admittedAttempts:1,nextHeal:deadline,lostTargetNoReplacement:true};});
check('new board front/back array nonoverlap and two open side corridors',()=>{setup(8);const seats=app.actors.filter(a=>a.seat);assert.equal(seats.length,10);let gap=Infinity;for(let i=0;i<seats.length;i++)for(let j=i+1;j<seats.length;j++){const a=seats[i],b=seats[j],d=Math.hypot(a.root.position.x-b.root.position.x,a.root.position.z-b.root.position.z)-a.ctrlRadius-b.ctrlRadius;gap=Math.min(gap,d);assert(d>0);}for(const a of seats.filter(a=>[1,4,7].includes(a.seat)))assert(a.root.position.z>-.3);for(const a of seats.filter(a=>![1,4,7].includes(a.seat)))assert(a.root.position.z<=-2);let clearance=Infinity;for(const sign of [-1,1])for(let z=-4;z<=3;z+=.1){const x=sign*6;for(const a of seats)clearance=Math.min(clearance,Math.hypot(x-a.root.position.x,z-a.root.position.z)-a.ctrlRadius);for(const mesh of app.solids){mesh.computeWorldMatrix(true);const b=mesh.getBoundingInfo().boundingBox,min=b.minimumWorld,max=b.maximumWorld;const dx=Math.max(min.x-x,0,x-max.x),dz=Math.max(min.z-z,0,z-max.z);clearance=Math.min(clearance,Math.hypot(dx,dz));}}assert(clearance>=app.hero.ctrlRadius*2);return {minEnemyGap:gap,sideCorridorCenterClearance:clearance,requiredHalfWidth:app.hero.ctrlRadius*2,positions:seats.map(a=>[a.seat,a.root.position.x,a.root.position.z])};});
check('true-hit bolt pool bounded, cosmetic only, no empty or wall bolt',()=>{setup(7);isolate();place(app.hero,0,0);app.hero.yaw=0;assert.equal(app.lines.length,64);const target=app.makeActor(['bolt','needle_creature',0,1.2,.85],true),before=target.hp,r=app.start(app.hero,'basic',0);for(let i=0;i<15;i++)app.tick(C.step);assert.equal(target.hp,before-4000);assert.equal(app.lightningEvents.length,1);const edge=app.lines.filter(l=>l.root===r&&l.type==='hammer-bolt'),core=app.lines.filter(l=>l.root===r&&l.type==='hammer-bolt-core');assert.equal(edge.length,4);assert.equal(core.length,4);assert(edge.every(l=>l.max===.22));assert(core.every(l=>l.mesh.material===app.fx.lightning));assert(app.lines.filter(l=>l.life>0).length<=64);return {edges:edge.length,cores:core.length,actualDamage:before-target.hp,eventDamage:app.lightningEvents[0].damage,pool:app.lines.length};});
check('hero hand alternates independently of enemy root IDs; shield/hammer/tray always left',()=>{const out=[];for(const stage of [1,2,6,7,8]){setup(stage);const enemy=app.actors.find(a=>app.isHostile(a));app.rootEvent(enemy,'shoot',1,2,1,1.02);const hands=[];for(let i=0;i<2;i++){const r=app.start(app.hero,'basic',0);r.age=.18;app.pose(app.hero);const expected=stage>=6?'l':i===0?'l':'r';assert.equal(r.hand,expected);assert.equal(app.hero.rig.sockets.weapon.parent,app.hero.rig.limbs[expected].hand);hands.push(r.hand);app.cancel(app.hero,'controlled-hand-end',true);app.rootEvent(enemy,'shoot',1,2,1,1.02);}out.push({stage,hands});}setup(1);app.tray=true;app.hero.rig.setForm(1,true);app.syncMetrics(app.hero);for(let i=0;i<2;i++){const r=app.start(app.hero,'basic',0);r.age=.18;app.pose(app.hero);assert.equal(r.hand,'l');assert.equal(app.hero.rig.sockets.weapon.parent,app.hero.rig.limbs.l.hand);app.cancel(app.hero,'controlled-tray-end',true);}return {stages:out,tray:'l'};});
check('corrected finite-sector boundary preserves side and outer-corner positives',()=>{setup(7);isolate();place(app.hero,0,0);const a=app.makeActor(['edge','ember_beast',0,0,1.5],true),radius=a.m.hurtRadius,L=2.8,delta=.25,tangent=L*Math.cos(delta)+Math.sqrt(radius**2-L**2*Math.sin(delta)**2);for(const [distance,theta,hit]of [[L+radius-.001,0,true],[L+radius+.001,0,false],[1.4,Math.PI/3+.1,true],[tangent-.001,Math.PI/3+delta,true],[tangent+.001,Math.PI/3+delta,false]]){place(a,Math.sin(theta)*distance,Math.cos(theta)*distance);assert.equal(!!app.fanIntersection(app.hero.root.position,0,L,120,a),hit);}return {radius,tangentDistance:tangent,insideAndOutsideMargin:.001};});
check('normal G5/G7 all-wave spawn has no controller/prop penetration',()=>{const out=[];for(const stage of [5,7])for(let wave=0;wave<D.stages[stage-1].waves.length;wave++){app.selectStage(stage,wave);const enemies=app.actors.filter(a=>app.isHostile(a));let pairGap=Infinity,solidGap=Infinity;for(let i=0;i<enemies.length;i++){const a=enemies[i];for(let j=i+1;j<enemies.length;j++){const b=enemies[j];pairGap=Math.min(pairGap,Math.hypot(a.root.position.x-b.root.position.x,a.root.position.z-b.root.position.z)-a.ctrlRadius-b.ctrlRadius);}for(const mesh of app.solids){mesh.computeWorldMatrix(true);const b=mesh.getBoundingInfo().boundingBox,min=b.minimumWorld,max=b.maximumWorld,dx=Math.max(min.x-a.root.position.x,0,a.root.position.x-max.x),dz=Math.max(min.z-a.root.position.z,0,a.root.position.z-max.z);solidGap=Math.min(solidGap,Math.hypot(dx,dz)-a.ctrlRadius);}}assert(pairGap>=0);assert(solidGap>=0);out.push({stage,wave,count:enemies.length,pairGap,solidGap});}return out;});
check('normal untouched G5 spawn supports basic CUDA with click-equivalent chase',()=>{app.selectStage(5);const enemies=app.actors.filter(a=>app.isHostile(a)),target=enemies.reduce((a,b)=>B.Vector3.DistanceSquared(a.root.position,app.hero.root.position)<B.Vector3.DistanceSquared(b.root.position,app.hero.root.position)?a:b);const initial=enemies.map(a=>({id:a.id,hp:a.hp,position:a.root.position.asArray()}));app.selectedID=target.id;app.order={type:'attack'};app.aim.copyFrom(target.root.position);for(let i=0;i<1800&&!app.cudaEvents.some(e=>e.type==='basic'&&e.edges.length);i++)app.tick(C.step);const event=app.cudaEvents.find(e=>e.type==='basic'&&e.edges.length);assert(event,'no basic CUDA extra target from normal spawn within 15 simulated seconds');assert(event.edges.every(e=>!event.directExcluded.includes(e.to)));return {initial,target:target.id,time:event.time,hero:app.hero.root.position.asArray(),direct:event.directExcluded,edges:event.edges,controls:'same selectedID/order/aim as pointer target click; no actor relocation, HP override or direct damage invocation'};});
check('normal untouched G7 spawn supports multi-owner hammer basic',()=>{app.selectStage(7);const target=app.actors.filter(a=>app.isHostile(a)&&a.kind==='needle_creature').find(a=>Math.abs(a.root.position.x+1)<.01&&Math.abs(a.root.position.z)<.01);assert(target);const initial=app.actors.filter(a=>app.isHostile(a)).map(a=>({id:a.id,hp:a.hp,position:a.root.position.asArray()}));app.selectedID=target.id;app.order={type:'attack'};app.aim.copyFrom(target.root.position);let direct=[];for(let i=0;i<1800;i++){app.tick(C.step);const roots=new Map();for(const e of app.damageEvents.filter(e=>e.type==='basic'&&e.channel==='direct'&&e.actual>0)){if(!roots.has(e.rootId))roots.set(e.rootId,[]);roots.get(e.rootId).push(e);}direct=[...roots.values()].find(es=>new Set(es.map(e=>e.target)).size>=2)||[];if(direct.length)break;}assert(direct.length>=2,'no multi-owner hammer root from normal spawn within 15 simulated seconds');return {initial,target:target.id,time:app.simTime,hero:app.hero.root.position.asArray(),rootId:direct[0].rootId,direct:direct.map(e=>({target:e.target,actual:e.actual})),controls:'normal click-equivalent chase + native ticks only; no actor relocation or HP interventions'};});
check('debug illegal settings atomic and stage/slot gates',()=>{setup(1);const before=JSON.stringify({stage:app.stageIndex,run:app.run,settings:app.settings});ui.heroHP.value='100';ui.damage.value='20';ui.crit.value='15';ui.enemyHP.value='160000';ui.stageSelect.value='1';ui.waveSelect.value='0';ui.scenario.value='all';ui.styleSelect.value='3d';ui.heroOverride.checked=true;ui.damage.value='NaN';assert.throws(()=>app.applySettings());assert.equal(JSON.stringify({stage:app.stageIndex,run:app.run,settings:app.settings}),before);assert.equal(app.requestSkill(0),false);assert.equal(app.requestSkill(1),false);assert.equal(app.actors.filter(a=>a.friendly).length,2);return {unchanged:true,friendlies:2};});
const pointerHit=a=>{const saved=app.pointerRay;app.pointerRay=()=>new B.Ray(a.root.position.add(V(0,20,0)),V(0,-1,0));try{ui.view.handlers.pointerdown({button:0,pointerType:'mouse',preventDefault(){}});}finally{app.pointerRay=saved;}};
check('R28 repaired arm-before-pointer capture freezes real hit and removes waiting status',()=>{app.selectStage(7);const target=app.actors.find(a=>a.kind==='needle_creature'&&Math.abs(a.root.position.x+1)<.01&&Math.abs(a.root.position.z)<.01);assert(target);assert(app.captureContact());const armed=app.capture;pointerHit(target);assert.equal(app.selectedID,target.id);assert.equal(app.capture,armed);for(let i=0;i<360&&!app.damageEvents.some(e=>e.source==='hero'&&e.actual>0);i++)app.tick(C.step);assert(app.damageEvents.some(e=>e.source==='hero'&&e.actual>0));assert.equal(app.qaFrozen,true);assert.match(ui.status.textContent,/Real contact/);return{confirmedRepair:'arm survives pointer command and freezes actual HP-loss root',actualPositiveHeroHits:app.damageEvents.filter(e=>e.source==='hero'&&e.actual>0).length,originalArmedSince:armed.since,qaFrozen:app.qaFrozen};});
check('R28 baseline real native hit freezes if armed after pointer target selection; one-shot/no-hit negative',()=>{app.selectStage(7);const target=app.actors.find(a=>a.kind==='needle_creature'&&Math.abs(a.root.position.x+1)<.01&&Math.abs(a.root.position.z)<.01);pointerHit(target);assert(app.captureContact());for(let i=0;i<360&&!app.qaFrozen;i++)app.tick(C.step);assert(app.qaFrozen);const root=app.capture.rootId,hit=app.damageEvents.find(e=>e.rootId===root&&e.source==='hero'&&e.channel==='direct'&&e.actual>0);assert(hit);const time=app.simTime;app.frame(performance.now()+1000);assert.equal(app.simTime,time);assert.equal(app.capture.rootId,root);assert.equal(app.captureContact(),false);app.freeze(false);setup(7);isolate();place(app.hero,0,0);const far=app.makeActor(['negative-far','needle_creature',0,8,.85],true);assert(app.captureContact());app.start(app.hero,'basic',Math.PI);ticks(32);assert.equal(app.damageEvents.length,0);assert.equal(app.qaFrozen,false);assert(app.capture.wait);return{freezeRoot:root,positiveActual:hit.actual,oneShot:true,emptySwingWaiting:true};});
check('R28 controlled native 3+ slam direct targets and out-of-range negative',()=>{setup(8);isolate();place(app.hero,0,0);const enemies=[[-1.5,0],[0,1.5],[1.5,0]].map(([x,z],i)=>{const a=app.makeActor(['slam-'+i,'seat_02',x,z,1]);a.dummy=true;return a;});const before=enemies.map(a=>a.hp),r=app.start(app.hero,'skill2',0);ticks(75);assert.equal(r.directHit.size,3);assert(enemies.every((a,i)=>before[i]-a.hp===12000));const positive={direct:[...r.directHit],actual:enemies.map((a,i)=>before[i]-a.hp)};setup(8);isolate();place(app.hero,0,0);const far=app.makeActor(['slam-far','seat_02',0,7,1]);far.dummy=true;const hp=far.hp,negative=app.start(app.hero,'skill2',0);ticks(75);assert.equal(far.hp,hp);assert.equal(negative.directHit.size,0);assert.equal(app.cudaEvents.length,0);return{controlledNativeHP:120000,...positive,farHPUnchanged:hp};});
check('R28 controlled native CUDA reaches three extra targets; out-of-range candidate excluded',()=>{setup(8);isolate();place(app.hero,0,0);app.hero.yaw=0;const create=(id,x,z)=>{const a=app.makeActor([id,'seat_02',x,z,1]);a.dummy=true;return a;},seed=create('seed',0,1.5),extras=[create('extra-a',-1.5,3),create('extra-b',1.5,3),create('extra-c',0,4)],far=create('far',9,6),before=extras.map(a=>a.hp),seedHP=seed.hp,farHP=far.hp;const r=app.start(app.hero,'basic',0);ticks(75);assert(r.directHit.has(seed.id));assert.equal(seedHP-seed.hp,6000);assert.equal(app.cudaEvents.length,1);const e=app.cudaEvents[0];assert.equal(e.edges.length,3);assert(extras.every((a,i)=>before[i]-a.hp===3000));assert.equal(far.hp,farHP);assert(e.edges.every(x=>!r.directHit.has(x.to)));return{controlledNativeHP:120000,direct:[...r.directHit],edges:e.edges,farHPUnchanged:farHP};});
check('R28 native G8 focus-healer versus ignore-healer short strategy samples',()=>{const out=[];for(const focus of [true,false]){app.selectStage(8);app.settings.crit=.15;const healer=app.actors.find(a=>a.seat===6),target=app.actors.find(a=>a.seat===(focus?6:1));pointerHit(target);const samples=[];for(let i=0;i<3600;i++){app.tick(C.step);if(i%120===0)samples.push({time:app.simTime,healerHP:healer.hp,healerAction:healer.action?.type||null,attempts:healer.healAttempts,eligible:app.healTargets(healer),danger:app.warningRoots.size,selected:app.selectedID});}out.push({focus,heroHP:app.hero.hp,healerHP:healer.hp,healerDead:healer.dead,attempts:healer.healAttempts,heals:app.healEvents.filter(e=>e.type==='seat_heal'),casts:app.healEvents.filter(e=>e.type==='cast-start'),samples,scope:'native initial layout/HP/AI and selected-target pointer handler; practice immortality on;30 simulated seconds, not browser survival or timing evidence'});}return out;});
check('R28 controlled actual injury/heal cap and full-health admission negative',()=>{setup(8);isolate();place(app.hero,0,0);const healer=app.makeActor(['seat_06','seat_06',0,3,1]),target=app.makeActor(['seat_02','seat_02',1,3.5,1]);target.dummy=true;healer.yaw=Math.PI;app.spawnAt=0;app.simTime=6;app.decide(healer,C.step);assert.equal(healer.healAttempts,0);const hit=app.rootEvent(app.hero,'basic',6000,.45,.1,.24);app.damage(hit,target,target.root.position,app.hero.root.position,'direct');assert.equal(target.hp,target.maxHP-6000);app.decide(healer,C.step);assert.equal(healer.action.type,'heal');const root=healer.action;assert.deepEqual([...root.castTargets],[target.id]);ticks(220);const e=app.healEvents.find(e=>e.type==='seat_heal'&&e.rootId===root.id);assert(e);assert.equal(e.targets[0].actual,6000);assert.equal(target.hp,target.maxHP);assert.equal(healer.healAttempts,1);return{nativeTargetHP:target.maxHP,realDamage:6000,actualHeal:e.targets[0].actual,fullHealthNoAdmission:true,noOverheal:true};});
check('R28 controlled native slam interrupts admitted heal and spends attempt',()=>{setup(8);isolate();place(app.hero,0,0);const healer=app.makeActor(['seat_06','seat_06',0,3,1]),target=app.makeActor(['seat_02','seat_02',1,3.5,1]);target.dummy=true;healer.yaw=Math.PI;app.spawnAt=0;app.simTime=6;const hit=app.rootEvent(app.hero,'basic',6000,.45,.1,.24);app.damage(hit,target,target.root.position,app.hero.root.position,'direct');app.decide(healer,C.step);const cast=healer.action,deadline=healer.nextHeal;assert.equal(cast.type,'heal');app.start(app.hero,'skill2',0);ticks(240);assert(cast.cancelled);assert.equal(healer.healAttempts,1);assert.equal(healer.nextHeal,deadline);assert(!app.healEvents.some(e=>e.type==='seat_heal'&&e.rootId===cast.id&&e.targets.length));return{realSlamDamage:app.damageEvents.filter(e=>e.type==='skill2'&&e.target===healer.id).map(e=>e.actual),castCancelled:true,attemptSpent:1,nextEligible:deadline};});
check('R28 controlled receiver death and caster death prevent heal/resurrection',()=>{const out=[];for(const killCaster of [false,true]){setup(8);isolate();place(app.hero,0,0);const healer=app.makeActor(['seat_06','seat_06',0,3,1]),target=app.makeActor(['seat_02','seat_02',1,3.5,1]);target.dummy=true;healer.yaw=Math.PI;app.spawnAt=0;app.simTime=6;let hit=app.rootEvent(app.hero,'basic',6000,.45,.1,.24);app.damage(hit,target,target.root.position,app.hero.root.position,'direct');app.decide(healer,C.step);const cast=healer.action;assert.equal(cast.type,'heal');const doomed=killCaster?healer:target;while(doomed.hp>0){hit=app.rootEvent(app.hero,'basic',6000,.45,.1,.24);app.damage(hit,doomed,doomed.root.position,app.hero.root.position,'direct');}assert(doomed.dead);ticks(220);assert.equal(doomed.hp,0);assert(!app.healEvents.some(e=>e.type==='seat_heal'&&e.rootId===cast.id&&e.targets.some(t=>t.id===target.id)));out.push({killCaster,nativeTargetDead:true,hp:doomed.hp,castCancelled:!!cast.cancelled,attempts:healer.healAttempts});}return{out,scope:'controlled repeated native6000 root damage to reach real death; no HP assignment or screenshot claim'};});
const finaleScene=new B.Scene(engine),finalePhysics=new B.HavokPlugin(true,h);
finaleScene.useRightHandedSystem=true;finaleScene.enablePhysics(V(0,-18,0),finalePhysics);finaleScene.physicsEnabled=false;
ctx.window.matchMedia=()=>({matches:true});
const finale=new Training(engine,finaleScene,finalePhysics,queryOptions('?mode=finale&stage=no&style=unknown'));
finale.reset();finale.ready=true;
const stepFinale=n=>{for(let i=0;i<n;i++)finale.tick(C.step);};
const seat=n=>finale.actors.find(a=>a.seat===n);
const clickAt=point=>{
  const pick=finale.pointerRay;finale.pointerRay=()=>new B.Ray(point.add(V(0,20,0)),V(0,-1,0));
  try{ui.view.handlers.pointerdown({button:0,pointerType:'mouse',preventDefault(){}});}finally{finale.pointerRay=pick;}
};
const clickSeat=a=>clickAt(a.root.position);
check('Finale intro holds the clock, combat inputs and debugging',()=>{
  assert.equal(finale.settings.reduced,true);assert.equal(ui.finaleReduced.checked,true);
  ui.finaleReduced.checked=false;ui.finaleReduced.handlers.change();assert.equal(finale.settings.reduced,false);
  ui.finaleMute.checked=true;ui.finaleMute.handlers.change();assert.equal(finale.sound.muted,true);
  assert.equal(finale.finaleState,'intro');assert.equal(finale.settings.immortal,false);assert.equal(finale.actors.length,11);
  assert.equal(new Set(finale.actors.filter(a=>a.seat).map(a=>a.bar.title)).size,10);
  assert.equal(finale.requestSkill(1),false);assert.equal(finale.testMove(1,1),false);
  clickSeat(seat(5));finale.pauseGame();stepFinale(90);
  assert.equal(finale.simTime,0);assert.equal(finale.order,null);assert.equal(finale.paused,false);
  assert.equal(finale.beginFinale(true),false);ui.finaleStart.handlers.click({detail:0,isTrusted:false});assert.equal(finale.finaleState,'playing');
  assert.equal(finale.beginFinale(),false);assert.equal(finale.beginFinale(true),false);
  assert.equal(finale.requestSkill(0),false);assert.equal(finale.start(finale.hero,'basic',0),null);
  return {state:finale.finaleState,heroHP:finale.hero.hp,seats:10};
});
check('Finale front shield, exposure, fan volley and elimination',()=>{
  const gate=seat(4),gun=seat(8),p=gate.root.position;gate.yaw=0;
  assert.equal(finale.incomingDefense(gate,null,p.add(V(0,0,2)),6000),1500);
  assert.equal(finale.incomingDefense(gate,null,p.add(V(0,0,-2)),6000),6000);
  const bash=finale.start(gate,gate.spec.action,0);bash.age=.4;
  assert.equal(finale.incomingDefense(gate,null,p.add(V(0,0,2)),6000),6000);
  const volley=finale.start(gun,gun.spec.action,0);assert.equal(volley.type,'volley');stepFinale(1);
  assert.equal(gun.tell.isEnabled(),false);assert.equal(gun.tellBands.filter(b=>b.mesh.isEnabled()).length,3);
  volley.age=volley.windup;finale.enemyRelease(gun);
  assert.equal(finale.projectiles.filter(v=>v.root===volley).length,3);
  finale.die(gun);assert(!finale.projectiles.some(v=>v.root===volley));finale.reset();
  return {frontalDamage:1500,openOrRearDamage:6000,volley:3};
});
check('Finale hammer counts real swings once and commits the third',()=>{
  const hero=finale.hero;finale.settings.crit=0;finale.spawnAt=Infinity;stepFinale(55);place(hero,0,0);
  for(const a of [...finale.actors])if(a!==hero){finale.disposeActor(a);finale.actors.splice(finale.actors.indexOf(a),1);}
  const targets=[-.5,.5].map((x,i)=>finale.makeActor(['dummy'+i,'seat_02',x,1.4,1],true));
  const sweep=(yaw=0)=>{const r=finale.start(hero,'basic',yaw);stepFinale(Math.ceil(r.duration/C.step)+1);return r;};
  assert.equal(sweep().directRecords.length,2);assert.equal(finale.combo,1);
  assert.equal(sweep(Math.PI).directRecords.length,0);assert.equal(finale.combo,0);
  sweep();const deadline=finale.comboUntil;
  finale.start(hero,'basic',0);finale.testMove(0,0);finale.testMove(0,0);
  assert.equal(finale.combo,1);assert.equal(finale.comboUntil,deadline);
  stepFinale(305);assert.equal(finale.combo,0);
  sweep();sweep();finale.hud();assert.equal(ui.comboPips['aria-valuenow'],'2');
  const rear=finale.makeActor(['fresh-target','seat_08',0,-1.5,1],true);
  clickSeat(rear);assert.equal(finale.combo,2);
  for(let i=0;i<100&&!hero.action;i++)stepFinale(1);
  const heavy=hero.action;assert(heavy.finisher);assert.equal(heavy.swing,3);assert.equal(finale.combo,0);
  assert.equal(finale.requestSkill(1),false);finale.testMove(0,2);assert.equal(hero.action,heavy);
  stepFinale(90);assert.equal(finale.combo,0);assert.deepEqual([...heavy.directHit],[rear.id]);
  assert(finale.damageEvents.some(e=>e.rootId===heavy.id&&e.actual===12000&&e.finisher));
  const empty=finale.start(hero,'basic',0);empty.base=0;stepFinale(60);assert.equal(empty.directRecords.length,0);assert.equal(finale.combo,0);
  finale.reset();
  return {heavyDamage:12000,multiTargetCount:targets.length};
});
const duel=keep=>{
  finale.finaleState='playing';finale.reset();finale.settings.crit=0;finale.spawnAt=0;finale.simTime=1;
  for(const a of [...finale.actors])if(a!==finale.hero&&!keep.includes(a.seat)){
    finale.disposeActor(a);finale.actors.splice(finale.actors.indexOf(a),1);
  }
  for(const a of finale.actors)a.nextAttack=1000;
};
check('Vanguard locked capsule, clean hit, shield interception and whiff punish',()=>{
  const out=[];
  for(const style of ['hit','dodge','block','rush-block']){
    duel([1]);const v=seat(1),h=finale.hero;place(v,0,-3,finale);place(h,0,1,finale);
    h.yaw=style.includes('block')?Math.PI:0;v.yaw=0;
    const rush=finale.start(v,'guardCharge',0);stepFinale(2);
    assert.equal(rush.geometry.shape,'rush-capsule');assert.equal(rush.geometry.length,6);assert(v.tell.isEnabled());
    assert.equal(v.tell.position.z,rush.origin.z);assert.equal(v.tell.rotation.y,0);
    const bounds=v.tell.getBoundingInfo().boundingBox;
    assert(Math.abs(bounds.maximum.x-rush.geometry.radius)<.001);
    assert(Math.abs(bounds.maximum.z-(rush.geometry.length+rush.geometry.radius))<.001);
    assert.equal(rush.punishOpen,false);
    if(style==='dodge')finale.testMove(3,1);
    if(style==='block')rush.shieldDecisions.set(h.id,true); // isolate the successful frontal roll
    if(style==='rush-block'){stepFinale(132);assert(finale.requestSkill(0));stepFinale(62);}else stepFinale(194);
    const hits=finale.damageEvents.filter(e=>e.rootId===rush.id);assert.equal(rush.yaw,0);
    assert(Math.abs(v.root.position.x)<.06);
    assert.equal(rush.punishOpen,style==='dodge');assert.equal(hits.length,style==='dodge'?0:1);
    if(style==='hit')assert.equal(hits[0].actual,950);
    if(style==='block'){assert.equal(hits[0].actual,0);assert.equal(hits[0].guard,'random-block');}
    if(style==='rush-block'){assert.equal(hits[0].actual,475);assert.equal(hits[0].guard,'active-half');}
    if(style==='dodge'){
      assert(h.root.position.x>rush.geometry.radius);
      finale.hud();assert.equal(v.bar.dataset.exposed,'true');assert.match(v.bar.lastElementChild.textContent,/OPEN/);
      const hit=()=>{const r=finale.rootEvent(h,'basic',6000,.43,.1,.24);finale.damage(r,v,v.root.position,h.root.position,'direct');return finale.damageEvents.at(-1);};
      h.nextAttack=0;clickSeat(v);
      for(let i=0;i<140&&!finale.damageEvents.some(e=>e.punish);i++)stepFinale(1);
      const counter=finale.damageEvents.find(e=>e.punish);assert(counter);assert.equal(counter.type,'basic');assert.equal(counter.actual,9000);
      finale.testMove(h.root.position.x,h.root.position.z);
      const echo=finale.rootEvent(h,'basic',6000,.43,.1,.24);finale.damage(echo,v,v.root.position,h.root.position,'cuda');
      assert.equal(finale.damageEvents.at(-1).actual,3000);
      stepFinale(174);assert.equal(v.action,null);assert.equal(rush.punishOpen,false);
      assert.equal(hit().actual,6000);
    }
    out.push({style,heroHP:h.hp,actual:hits[0]?.actual||0,hitCount:hits.length});
  }
  duel([1]);const v=seat(1),h=finale.hero;place(v,0,-3,finale);place(h,0,1.6,finale);
  const wall=finale.bodyBox('test-vanguard-wall',[2,2,.4],V(0,1,0));
  try{
    const rush=finale.start(v,'guardCharge',0);assert(rush.geometry.length<3);
    stepFinale(200);assert(rush.punishOpen);assert.equal(h.hp,h.maxHP);assert(v.root.position.z<0);
    finale.cancel(v);place(v,0,-.53,finale);
    assert.equal(finale.start(v,'guardCharge',0),null);assert.equal(finale.warningRoots.size,0);
  }finally{finale.solids.delete(wall);finale.staticBodies.pop().dispose();wall.dispose();}
  finale.reset();return out;
});
check('Thunder Slam shoves lighter seats on native controllers; earned heavy breaks healing',()=>{
  duel([4,6]);const h=finale.hero,g=seat(4),healer=seat(6);
  place(h,0,0,finale);place(g,-1.6,0,finale);place(healer,1.6,0,finale);finale.spawnAt=Infinity;
  const slam=finale.start(h,'skill2',0);stepFinale(72);
  const lightMove=healer.root.position.x-1.6,bracedMove=-1.6-g.root.position.x;
  assert(slam.directHit.has(g.id)&&slam.directHit.has(healer.id));
  assert(lightMove>.95&&lightMove<2&&bracedMove>=0&&bracedMove<.35,'light '+lightMove+' braced '+bracedMove);
  assert.equal(healer.reactHeavy,true);assert.equal(g.reactHeavy,true);
  place(h,0,0,finale);place(healer,0,1.6,finale);place(g,-3,0,finale);
  healer.recoil.setAll(0);
  const cast=finale.start(healer,'heal',Math.PI);
  const first=finale.start(h,'basic',0);stepFinale(56);
  assert(first.directHit.has(healer.id));assert.equal(healer.action,cast);assert.equal(healer.reactHeavy,false);
  finale.start(h,'basic',0);stepFinale(56);const heavy=finale.start(h,'basic',0);
  assert(heavy.finisher);stepFinale(55);
  assert(cast.cancelled);assert.equal(cast.cancelReason,'interrupted');assert.equal(healer.healAttempts,1);
  assert(!finale.healEvents.some(e=>e.type==='seat_heal'&&e.rootId===cast.id&&e.targets.length));
  finale.reset();assert.equal(finale.combo,0);assert.equal(seat(1).action,null);
  return {lightMove,bracedMove,heavyCastBreak:true};
});
check('Finale impact edge follows net hero loss, full blocks, accessibility and retry',()=>{
  duel([1]);const hero=finale.hero,v=seat(1),origin=hero.root.position.add(V(0,0,-2));hero.yaw=0;
  const hit=(amount,front=false)=>{
    const root=finale.rootEvent(v,'guardCharge',amount,.8,.2,.35),from=front?hero.root.position.add(V(0,0,2)):origin;
    if(front)root.shieldDecisions.set(hero.id,true);
    finale.damage(root,hero,hero.root.position,from,'melee');finale.hud();return root;
  };
  const root=hit(950);assert.equal(hero.hp,2850);assert.equal(ui.hurtEdge.hidden,false);
  const first=Number(ui.hurtEdge.style.opacity);assert(Math.abs(first-.55)<1e-8);
  finale.damage(root,hero,hero.root.position,origin,'melee');assert.equal(finale.hurtStrength,first);
  hit(475);assert.equal(finale.hurtStrength,.62);stepFinale(20);assert(finale.hurtStrength>0&&finale.hurtStrength<first);
  stepFinale(100);finale.hud();assert.equal(ui.hurtEdge.hidden,true);
  const before=hero.hp;hit(300,true);assert(hero.hp>before);assert.equal(ui.hurtEdge.hidden,true);
  const gain=finale.healEvents.find(e=>e.type==='shield-regen').actual;
  assert(finale.floats.some(f=>f.life>0&&f.element.textContent==='+'+gain&&f.element.dataset.side==='hero'));
  assert(finale.floats.some(f=>f.life>0&&f.element.textContent==='BLOCK'));
  hit(100);ui.finaleReduced.checked=true;ui.finaleReduced.handlers.change();assert.equal(ui.hurtEdge.hidden,true);
  hit(250);assert.equal(finale.hurtStrength,0);assert.equal(ui.hp.textContent,hero.hp.toLocaleString('en-US')+' / 3,800');
  ui.finaleReduced.checked=false;ui.finaleReduced.handlers.change();hit(100);finale.endFinale(false);assert.equal(ui.hurtEdge.hidden,true);
  ui.finaleRetry.handlers.click({detail:0,isTrusted:false});assert.equal(finale.hurtStrength,0);assert.equal(finale.hero.hp,3800);
  return {first,max:.62,blockedRegeneration:gain};
});
check('Finale ranked recipient floats, exact signed damage, HP labels and bounds',()=>{
  duel([1,6]);const hero=finale.hero,v=seat(1),healer=seat(6);
  place(v,-2,0,finale);place(healer,1,0,finale);
  const saved=finale.project;finale.project=p=>({x:800+p.x*72,y:510-p.z*14-p.y*70,visible:true});
  try{
    finale.selectedID=v.id;const before=v.hp;
    const heavy=finale.rootEvent(hero,'basic',12000,.7,.24,.38);heavy.crit=true;heavy.finisher=true;
    finale.damage(heavy,v,v.root.position,hero.root.position,'direct');finale.hud();
    const loss=before-v.hp,label='−'+loss.toLocaleString('en-US')+'!';
    const f=finale.floats.find(e=>e.life>0&&e.recipient===v.id);assert(f);assert.equal(f.element.textContent,label);
    assert.match(f.element.className,/critical/);assert.match(f.element.className,/heavy/);assert.match(f.element.className,/outgoing/);
    assert.equal(f.element.dataset.side,'seat');assert.equal(f.element.hidden,false);assert.equal(v.bar.dataset.hp,v.hp.toLocaleString('en-US'));
    assert(parseFloat(v.bar.style["--lift"])>=25);
    const match=/translate\(([-\d.]+)px,([-\d.]+)px\)/.exec(f.element.style.transform);assert(match);
    const x=Number(match[1]),y=Number(match[2]);assert(x-f.halfWidth>=0&&x+f.halfWidth<=1600&&y-f.halfHeight>=0&&y+f.halfHeight<=900);
    const echo=finale.rootEvent(hero,'basic',6000,.43,.1,.24);
    finale.damage(echo,healer,healer.root.position,hero.root.position,'cuda');
    assert(finale.floats.some(e=>e.recipient===healer.id&&e.element.textContent==='−3,000'&&e.span<f.span));
    const cast=finale.start(healer,'heal',0);assert(cast.castTargets.includes(v.id));cast.age=cast.windup;
    finale.enemyRelease(healer);finale.resolveHeals();
    const gain=finale.healEvents.find(e=>e.type==='seat_heal').targets.find(e=>e.id===v.id).actual;
    assert(finale.floats.some(e=>e.recipient===v.id&&e.element.textContent==='+'+gain.toLocaleString('en-US')&&e.element.dataset.side==='seat'));
    // Saturating the visual pool cannot evict the selected seat's heavy or change any HP.
    const hp=healer.hp;for(let i=0;i<40;i++)finale.floatDamage(20,false,healer.root.position,'cuda',healer);
    assert.equal(f.element.textContent,label);assert.equal(healer.hp,hp);assert.equal(finale.floats.length,C.maxFloats);
    return {actualHeavy:loss,enemyHeal:gain,recipient:f.recipient,slots:finale.floats.length};
  }finally{finale.project=saved;finale.reset();}
});
check('Single-bolt warning follows its muzzle and committed shot after a sidestep',()=>{
  duel([2,6]);const gun=seat(2),hero=finale.hero,band=gun.tellBands[0].mesh;
  place(gun,0,-3,finale);place(hero,0,2,finale);
  const meshes=finale.scene.meshes.length,cast=finale.start(gun,'shoot',0),locked=cast.aim.clone();
  place(hero,3,2,finale);stepFinale(100);
  assert(locked.equals(cast.aim));assert.equal(gun.tell.isEnabled(),false);assert(band.isEnabled());
  band.computeWorldMatrix(true);
  const from=B.Vector3.TransformCoordinates(V(0,-.5,0),band.getWorldMatrix());
  const to=B.Vector3.TransformCoordinates(V(0,.5,0),band.getWorldMatrix());
  const muzzle=gun.rig.sockets.muzzle.getAbsolutePosition(),direction=to.subtract(from).normalize();
  assert(B.Vector3.Distance(from,muzzle)<1e-5);assert(band.scaling.x<.1);
  assert(B.Vector3.Dot(direction,locked.subtract(muzzle).normalize())>.99999);
  cast.age=cast.windup;finale.enemyRelease(gun);
  const bolts=finale.projectiles.filter(p=>p.root===cast);assert.equal(bolts.length,1);
  assert(B.Vector3.Dot(direction,bolts[0].velocity.normalizeToNew())>.99999);
  assert(!band.isEnabled());assert.equal(finale.scene.meshes.length,meshes);
  const healer=seat(6),heal=finale.start(healer,'heal',0);assert(heal);stepFinale(1);
  assert(healer.tellBands.every(b=>!b.mesh.isEnabled()));finale.reset();
  return {segments:1,shots:1,muzzleAndDirectionMatched:true,healHasNoShotLine:true};
});
check('Finale real projectile core and taper reuse their original packet and native speed',()=>{
  duel([8]);const gun=seat(8),cast=finale.start(gun,'volley',0);cast.age=cast.windup;
  const muzzle=gun.rig.sockets.muzzle.getAbsolutePosition().clone(),meshes=finale.scene.meshes.length;
  finale.enemyRelease(gun);const bolts=finale.projectiles.filter(p=>p.root===cast);assert.equal(bolts.length,3);
  for(const p of bolts){assert(B.Vector3.Distance(p.position,muzzle)<1e-6);assert(p.mesh.position.equals(p.position));assert.equal(p.trail.isEnabled(),false);}
  const p=bolts[0],velocity=p.velocity.clone(),start=p.position.clone(),trail=p.trail;
  for(let i=0;i<6;i++)finale.updateProjectiles(C.step);
  assert.equal(p.root,cast);assert(B.Vector3.Distance(p.position,start.add(velocity.scale(C.step*6)))<1e-5);
  assert(p.mesh.position.equals(p.position));assert.equal(p.mesh.material,finale.fx.boltCore);assert.equal(trail.isEnabled(),true);
  p.mesh.computeWorldMatrix(true);trail.computeWorldMatrix(true);
  assert(B.Vector3.Dot(trail.getAbsolutePosition().subtract(p.position),velocity)<0);assert.equal(trail.isPickable,false);
  for(const b of bolts)finale.retireProjectile(b);assert.equal(trail.isEnabled(),false);
  finale.launch(cast,muzzle,velocity,0,'heat',{radius:.1,life:1});assert.equal(p.trail,trail);
  assert.equal(p.mesh.material,finale.fx.heatCore);assert.equal(trail.isEnabled(),false);assert.equal(finale.scene.meshes.length,meshes);
  finale.reset();assert.equal(trail.isEnabled(),false);return {realStarts:3,speed:velocity.length(),pooledTrail:true};
});
const ringRadius=mesh=>{
  const v=mesh.getVerticesData(B.VertexBuffer.PositionKind),r=[];
  for(let i=0;i<v.length;i+=3)r.push(Math.hypot(v[i],v[i+2]));
  return (Math.min(...r)+Math.max(...r))/2;
};
const backlineCast=(actor,type=actor.spec.action)=>{
  const cast=finale.start(actor,type,0);assert(cast);actor.nextAttack=Infinity;return cast;
};
check('R34 Cinder mortar keeps its target, lands once, and ordinary movement escapes',()=>{
  const out=[];
  for(const evade of [false,true]){
    duel([3]);const caster=seat(3),hero=finale.hero;
    place(caster,0,-3,finale);place(hero,0,1,finale);hero.yaw=0;
    const cast=backlineCast(caster),target=cast.aim.clone();
    assert.equal(cast.geometry.shape,'mortar');stepFinale(1);
    assert(caster.floorRings.some(r=>r.isEnabled()));
    assert(Math.abs(ringRadius(caster.floorRings[0])-cast.geometry.radius)<1e-5);
    assert(Math.abs(caster.floorRings[0].position.x-target.x)<1e-6);assert(Math.abs(caster.floorRings[0].position.z-target.z)<1e-6);
    if(evade)assert(finale.testMove(target.x+cast.geometry.radius+1.5,target.z));
    let landing=null;const land=finale.landHeat;
    finale.landHeat=function(p,point){if(p.root===cast)landing=point.clone();return land.call(this,p,point);};
    try{stepFinale(Math.ceil((cast.duration+1.5)/C.step));}finally{finale.landHeat=land;}
    assert(landing);assert(Math.hypot(landing.x-target.x,landing.z-target.z)<.05,'mortar landed away from its warning centre');
    assert(cast.aim.equals(target));
    const hits=finale.damageEvents.filter(e=>e.rootId===cast.id&&e.target===hero.id&&e.actual>0);
    assert.equal(hits.length,evade?0:1);if(!evade)assert.equal(hits[0].actual,caster.spec.damage);
    assert.equal(finale.zones.filter(z=>z.root===cast).length,0);
    assert(caster.floorRings.every(r=>!r.isEnabled()));
    out.push({evade,target:target.asArray(),final:hero.root.position.asArray(),landing:landing.asArray(),hits:hits.map(e=>e.actual)});
  }
  finale.reset();return out;
});
check('R34 Ashfall annulus has a safe core and outside, one real band pulse, and closes',()=>{
  const out=[];
  for(const region of ['core','band','outside','escape-in']){
    duel([9]);const caster=seat(9),hero=finale.hero;place(caster,0,-3,finale);place(hero,0,0,finale);
    const cast=backlineCast(caster),g=cast.geometry;
    assert.equal(g.shape,'annulus');assert(g.innerRadius>hero.ctrlRadius*2&&g.radius>g.innerRadius);
    const distance=region==='core'?g.innerRadius/2:region==='band'||region==='escape-in'?(g.innerRadius+g.radius)/2:g.radius+1;
    place(hero,distance,-3,finale);stepFinale(1);
    assert.equal(caster.floorRings.filter(r=>r.isEnabled()).length,2);
    const radii=caster.floorRings.map(ringRadius).sort((a,b)=>a-b);
    assert(Math.abs(radii[0]-g.innerRadius)<1e-5&&Math.abs(radii[1]-g.radius)<1e-5);
    for(const ring of caster.floorRings){assert(Math.abs(ring.position.x-cast.origin.x)<1e-6);assert(Math.abs(ring.position.z-cast.origin.z)<1e-6);}
    if(region==='escape-in')assert(finale.testMove(g.innerRadius/2,-3));
    stepFinale(Math.ceil((cast.duration+.5)/C.step));
    const hits=finale.damageEvents.filter(e=>e.rootId===cast.id&&e.target===hero.id&&e.actual>0);
    assert.equal(hits.length,region==='band'?1:0);if(hits.length)assert.equal(hits[0].actual,caster.spec.damage);
    assert(caster.floorRings.every(r=>!r.isEnabled()));assert(!finale.hasHazards());
    out.push({region,distance,hits:hits.map(e=>e.actual)});
  }
  for(const n of [3,9])for(const stop of (n===3?['cancel','flight-cancel','pause','death']:['cancel','pause','death'])){
    duel([n]);const caster=seat(n),cast=backlineCast(caster);stepFinale(1);
    assert(caster.floorRings.some(r=>r.isEnabled()));
    if(stop==='flight-cancel'){
      for(let i=0;i<Math.ceil(cast.duration/C.step)&&!cast.released;i++)stepFinale(1);
      assert(finale.projectiles.some(p=>p.root===cast));finale.cancel(caster,'controlled-flight-cancel');
    }else if(stop==='cancel')finale.cancel(caster,'controlled-cancel');
    else if(stop==='pause'){finale.pauseGame();finale.resumeGame();}
    else finale.die(caster);
    assert(caster.floorRings.every(r=>!r.isEnabled()));stepFinale(Math.ceil((cast.duration+1)/C.step));
    assert(!finale.damageEvents.some(e=>e.rootId===cast.id&&e.target===finale.hero.id));
    assert(!finale.projectiles.some(p=>p.root===cast));assert(!finale.zones.some(p=>p.root===cast));
  }
  finale.reset();return out;
});
check('R34 Deadeye tracks, locks with a readable window, and a near late sidestep evades',()=>{
  duel([5]);const sniper=seat(5),hero=finale.hero,z=-3+2.26;
  place(sniper,0,-3,finale);place(hero,0,z,finale);
  const cast=backlineCast(sniper,'sniper'),initial=cast.aim.clone();
  stepFinale(30);place(hero,1,z,finale);stepFinale(30);
  assert(!cast.aim.equals(initial));assert(Math.abs(cast.aim.x-hero.root.position.x)<1e-5);
  assert.equal(sniper.spec.lockBeforeRelease,.48);assert.equal(D.rules.sniper.lockBeforeRelease,.25);
  const lockAt=cast.windup-sniper.spec.lockBeforeRelease;assert.equal(cast.lockAt,lockAt);
  while(cast.age<lockAt+C.step)stepFinale(1);
  assert.equal(cast.locked,true);const locked=cast.aim.clone();
  assert(finale.testMove(-2,z));
  let line=null,shot=null;const launch=finale.launch;
  finale.launch=function(root,from,velocity,...args){
    if(root===cast)shot={from:from.clone(),velocity:velocity.clone()};return launch.call(this,root,from,velocity,...args);
  };
  try{
    for(let i=0;i<Math.ceil(cast.duration/C.step)&&!cast.released;i++){
      const band=sniper.tellBands[0].mesh;
      if(band.isEnabled()){
        band.computeWorldMatrix(true);line={from:B.Vector3.TransformCoordinates(V(0,-.5,0),band.getWorldMatrix()),to:B.Vector3.TransformCoordinates(V(0,.5,0),band.getWorldMatrix())};
      }
      stepFinale(1);
    }
  }finally{finale.launch=launch;}
  assert(cast.aim.equals(locked));assert(cast.released&&cast.punishOpen);assert(shot&&line);
  const direction=shot.velocity.normalize(),lineDirection=line.to.subtract(line.from).normalize();
  const muzzleDelta=B.Vector3.Distance(line.from,shot.from),alignment=B.Vector3.Dot(direction,lineDirection);
  assert(muzzleDelta<.02,'released muzzle moved away from locked warning');assert(alignment>.9999);
  assert(B.Vector3.Dot(direction,locked.subtract(shot.from).normalize())>.99999);
  assert(finale.projectiles.some(p=>p.root===cast));stepFinale(Math.ceil((cast.duration+1)/C.step));
  assert(!finale.damageEvents.some(e=>e.rootId===cast.id&&e.target===hero.id&&e.actual>0));
  assert(!cast.punishOpen);assert.equal(sniper.action,null);
  finale.reset();return {lockAt,readWindow:sniper.spec.lockBeforeRelease,legacyWindow:D.rules.sniper.lockBeforeRelease,locked:locked.asArray(),muzzleDelta,alignment,nearLateMoveEvaded:true};
});
check('R34 Deadeye counter bonus requires a released shot, near direct damage and live recovery',()=>{
  duel([5]);const sniper=seat(5),hero=finale.hero;place(sniper,0,-3,finale);place(hero,0,-1,finale);
  const direct=channel=>{
    const r=finale.rootEvent(hero,'basic',6000,.43,.1,.24);
    finale.damage(r,sniper,sniper.root.position,hero.root.position,channel);return finale.damageEvents.at(-1);
  };
  const cancelled=backlineCast(sniper,'sniper');stepFinale(20);finale.cancel(sniper,'controlled-interrupt');
  assert.equal(direct('direct').actual,6000);assert(!cancelled.punishOpen);
  const cast=backlineCast(sniper,'sniper');assert.equal(direct('direct').actual,6000);
  for(let i=0;i<Math.ceil(cast.duration/C.step)&&!cast.released;i++)stepFinale(1);
  assert(cast.released&&cast.punishOpen);
  const base=6000,near=direct('direct');assert.equal(near.actual,Math.round(base*sniper.spec.punishMultiplier));assert(near.punish);
  const echo=direct('cuda');assert.equal(echo.actual,base*D.rules.cuda.factor);assert(!echo.punish);
  place(hero,sniper.spec.punishRange+.5,-3,finale);
  const far=direct('direct');assert.equal(far.actual,base);assert(!far.punish);
  stepFinale(Math.ceil(cast.duration/C.step));place(hero,0,-1,finale);
  const expired=direct('direct');assert.equal(expired.actual,base);assert(!expired.punish);
  const noShot=backlineCast(sniper,'sniper'),busy={owner:'capacity-probe'};
  for(const p of finale.projectiles)p.root=busy;
  try{noShot.age=noShot.windup;finale.enemyRelease(sniper);assert(noShot.released);assert.equal(noShot.punishOpen,false);}
  finally{for(const p of finale.projectiles)if(p.root===busy)p.root=null;}
  finale.reset();return {near:near.actual,far:far.actual,echo:echo.actual,expired:expired.actual,noShotNoBonus:true};
});
check('R34 Reclaimer flies out and back with one shared hit, then reuses its pool',()=>{
  duel([10]);const caster=seat(10),hero=finale.hero;place(caster,0,-3,finale);place(hero,0,0,finale);hero.yaw=0;
  assert.equal(caster.spec.action,'disc');const cast=backlineCast(caster,'disc');
  for(let i=0;i<Math.ceil(cast.duration/C.step)&&!cast.released;i++)stepFinale(1);
  assert(cast.released);const projectile=finale.projectiles.find(p=>p.root===cast);assert(projectile);assert.equal(projectile.type,'disc');
  const origin=projectile.returnPoint.clone(),outbound=projectile.outboundDistance,meshes=finale.scene.meshes.length;
  stepFinale(1);assert.equal(caster.rig.sockets.weapon.parent.isEnabled(),false);assert(projectile.discMesh.isEnabled());
  let furthest=0,returning=false,returnDistance=Infinity;
  for(let i=0;i<120*4&&projectile.root;i++){
    stepFinale(1);furthest=Math.max(furthest,B.Vector3.Distance(origin,projectile.position));
    if(projectile.returning){returning=true;returnDistance=Math.min(returnDistance,B.Vector3.Distance(origin,projectile.position));}
  }
  const hits=finale.damageEvents.filter(e=>e.rootId===cast.id&&e.target===hero.id&&e.actual>0);
  assert(returning);assert(furthest>=outbound-.1);assert(returnDistance<.15);assert.equal(projectile.root,null);
  assert.equal(hits.length,1);assert.equal(hits[0].actual,caster.spec.damage);
  assert.equal(finale.scene.meshes.length,meshes);
  stepFinale(1);assert(caster.rig.sockets.weapon.parent.isEnabled());assert(!projectile.discMesh.isEnabled());
  finale.cancel(caster);const next=backlineCast(caster,'disc');next.age=next.windup;finale.enemyRelease(caster);
  assert.equal(finale.projectiles.find(p=>p.root===next),projectile);
  finale.die(caster);assert.equal(projectile.root,null);assert(!projectile.mesh.isEnabled());
  finale.reset();return {furthest,returnDistance,hits:1,pooled:true};
});
check('R34 Reclaimer can hit only on return, and a real wall stops both legs',()=>{
  const out=[];
  for(const mode of ['return-only','wall']){
    duel([10]);const caster=seat(10),hero=finale.hero;place(caster,0,-3,finale);place(hero,0,0,finale);hero.yaw=0;
    const cast=backlineCast(caster,'disc');place(hero,3,0,finale);
    const wall=mode==='wall'?finale.bodyBox('test-reclaimer-wall',[3,3,.15],V(0,1.5,-1)):null;
    try{
      stepFinale(1);const cue=caster.tellBands[0];assert(cue.mesh.isEnabled());
      assert.equal(cue.turn.isEnabled(),mode!=='wall');assert.equal(cue.stop.isEnabled(),mode==='wall');
      assert(cue.notches.every(n=>!n.isEnabled()||n.position.z<cue.turn.position.z));
      for(let i=0;i<Math.ceil(cast.duration/C.step)&&!cast.released;i++)stepFinale(1);
      assert(cast.released);const p=finale.projectiles.find(p=>p.root===cast);assert(p);
      let turned=false;
      for(let i=0;i<120*4&&p.root;i++){
        stepFinale(1);
        if(p.returning&&!turned){turned=true;place(hero,0,0,finale);}
      }
      const hits=finale.damageEvents.filter(e=>e.rootId===cast.id&&e.target===hero.id&&e.actual>0);
      assert.equal(hits.length,mode==='wall'?0:1);assert.equal(turned,mode!=='wall');
      assert.equal(p.root,null);assert(!p.mesh.isEnabled());out.push({mode,turned,hits:hits.length});
    }finally{if(wall){finale.solids.delete(wall);finale.staticBodies.pop().dispose();wall.dispose();}}
  }
  finale.reset();return out;
});
check('R34 backline changes leave G8 laboratory actions and projectile rules intact',()=>{
  setup(8);
  for(const n of [3,5,9,10]){
    const a=app.actors.find(a=>a.seat===n),legacy=D.types[a.kind];
    assert.equal(a.spec.action,legacy.action);assert.equal(a.spec.damage,legacy.damage);assert.equal(a.maxHP,legacy.hp);
    assert.equal(a.floorRings?.length||0,0);
  }
  assert.equal(app.actors.find(a=>a.seat===10).spec.action,'shoot');
  const sniper=app.actors.find(a=>a.seat===5);
  for(const a of [...app.actors])if(a!==app.hero&&a!==sniper){app.disposeActor(a);app.actors.splice(app.actors.indexOf(a),1);}
  app.spawnAt=0;place(sniper,0,-3);place(app.hero,0,2);
  const cast=app.start(sniper,'sniper',0);assert.equal(cast.windup-cast.lockAt,.25);
  ticks(90);place(app.hero,1,2);ticks(6);assert(Math.abs(cast.aim.x-1)<1e-5);
  ticks(7);const locked=cast.aim.clone();place(app.hero,-1,2);ticks(8);assert(cast.aim.equals(locked));
  app.cancel(sniper);app.spawnAt=Infinity;
  finale.reset();const counts=()=>[finale.scene.meshes.length,finale.scene.transformNodes.length,finale.scene.materials.length,finale.physics.getBodies().length];
  const baseline=counts();for(let i=0;i<3;i++){finale.reset();assert.deepEqual(counts(),baseline);}
  return {legacyHeatSeats:[3,9],legacySniper:5,legacyShooter:10,legacyLockWindow:cast.windup-cast.lockAt};
});
check('Finale idle defeat, finite results, clean retry and active victory',()=>{
  finale.settings.crit=D.rules.crit.chance;finale.reset();
  for(let i=0;i<120*150&&!finale.ended;i++)finale.tick(C.step);
  assert.equal(finale.finaleState,'lost');assert.equal(finale.hero.hp,0);const idleTime=finale.simTime;
  stepFinale(120);assert.equal(finale.simTime,idleTime);assert.equal(finale.progressEvents.filter(e=>e.type==='finale-defeat').length,1);
  assert.equal(finale.requestSkill(0),false);finale.pauseGame();assert.equal(finale.paused,false);
  ui.finaleRetry.handlers.click({detail:0,isTrusted:false});assert.equal(finale.simTime,0);assert.equal(finale.hero.hp,D.finale.hp);
  assert.equal(finale.beginFinale(true),false);assert.equal(finale.sound.muted,true);
  assert.equal(finale.damageEvents.length,0);assert.equal(finale.progressEvents.length,1);assert.equal(finale.actors.length,11);
  // Use the normal pointer handler to bait Vanguard, then clear the western firing line.
  const priority=[1,5,3,2,4,10,7,6,9,8];let dodged=null;
  for(let i=0;i<120*90&&!finale.ended;i++){
    const rush=seat(1)?.action,pos=finale.hero.root.position;
    if(rush?.geometry?.shape==='rush-capsule'&&rush.age<rush.windup&&dodged!==rush.id&&!finale.hero.action?.finisher){
      const side=V(Math.cos(rush.yaw),0,-Math.sin(rush.yaw));
      const offset=B.Vector3.Dot(pos.subtract(rush.origin),side);
      if(Math.abs(offset)<rush.geometry.radius+.3){
        const safeOffset=(offset>=0?1:-1)*(rush.geometry.radius+1);
        clickAt(pos.add(side.scale(safeOffset-offset)));dodged=rush.id;
      }
    }
    if(!rush||dodged!==rush.id||rush.age>=rush.activeEnd){
      const target=priority.map(seat).find(a=>a&&!a.dead);
      if(target&&!finale.selectedID)clickSeat(target);
      if(target&&i%20===0&&B.Vector3.Distance(pos,target.root.position)<3){
        if(!finale.requestSkill(1))finale.requestSkill(0);
      }
    }
    finale.tick(C.step);
  }
  assert.equal(finale.finaleState,'won','state '+finale.finaleState+', HP '+finale.hero.hp+', remaining '+finale.actors.filter(a=>finale.isHostile(a)).map(a=>a.id));
  assert.equal(finale.progressEvents.filter(e=>e.type==='finale-victory').length,1);const winTime=finale.simTime,hp=finale.hero.hp;
  stepFinale(120);assert.equal(finale.simTime,winTime);assert.equal(ui.finaleResult.hidden,false);
  ui.finaleRetry.handlers.click({detail:0,isTrusted:false});assert.equal(finale.actors.length,11);assert.equal(finale.hero.hp,D.finale.hp);assert.equal(ui.finaleResult.hidden,true);
  return {idleTime,winTime,remainingHP:hp,scope:'native physics, deterministic pointer-handler selections and skill requests'};
});
console.log(JSON.stringify({hashes,passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass),scope:'controlled real native Havok and actual methods/models; explicit actor placement + actual HP damage calls, no browser/GPU/natural-clear evidence'}));engine.dispose();if(results.some(x=>!x.pass))process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
