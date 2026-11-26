'use strict';
// Actual core/model/Havok probe. DOM/canvas/audio presentation only is stubbed.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'../../combat'),B=require(root+'/vendor/babylon.js'),Havok=require(root+'/vendor/HavokPhysics_umd.js');
const hashes=Object.fromEntries(['game.js','index.html','models.js','campaign-data.js','render-style.js'].map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+file)).digest('hex')]));
function el(){const o={style:{setProperty(k,v){this[k]=v;}},dataset:{},hidden:false,value:'',checked:false,children:[],handlers:{},setAttribute(k,v){this[k]=v;},remove(){},focus(){},addEventListener(name,cb){this.handlers[name]=cb;},getBoundingClientRect:()=>({left:0,top:0,width:1600,height:900}),appendChild(x){this.children.push(x);return x;},replaceChildren(...x){this.children=x;}};o.parentElement={};o.firstElementChild={style:{}};o.lastElementChild={style:{}};return o;}
global.OffscreenCanvas=class{constructor(w,h){this.width=w;this.height=h;}getContext(){return{fillRect(){},strokeRect(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},stroke(){},drawImage(){},save(){},restore(){},translate(){},scale(){},fillText(){},measureText:()=>({width:0})};}};
const keys={},nodes=new Map(),ctx={window:{BABYLON:B,addEventListener(name,fn){keys[name]=fn;},location:{search:''}},document:{getElementById:id=>{if(!nodes.has(id))nodes.set(id,el());return nodes.get(id);},createElement:el,addEventListener(){},hidden:false},devicePixelRatio:1,performance,console,URLSearchParams};
for(const file of ['models.js','campaign-data.js','render-style.js','journey-setpiece.js','survivor-skills.js'])vm.runInNewContext(fs.readFileSync(root+'/'+file,'utf8'),ctx);
const source=fs.readFileSync(root+'/game.js','utf8');vm.runInNewContext(source.slice(0,source.lastIndexOf('(async()=>{'))+'\nwindow.review={Training,C,queryOptions,ui,setApp:value=>app=value};})();',ctx);

(async()=>{
  const {Training,C,queryOptions,ui,setApp}=ctx.window.review;
  assert.equal(queryOptions('?mode=story&stage=invalid').journeyMode,'story');
  assert.equal(queryOptions('?mode=challenge&v=1').journeyMode,'challenge');
  assert.equal(queryOptions('?mode=challenge&v=2').journeyMode,'challenge'); // UI declines unknown versions before engine boot.
  assert.equal(queryOptions('?mode=finale').finale,true);
  const engine=new B.NullEngine({renderWidth:1600,renderHeight:900});
  const h=await Havok({wasmBinary:fs.readFileSync(root+'/vendor/HavokPhysics.wasm')});
  const results=[],setpiece=ctx.window.JourneySetpiece;
  for(const chapter of ['diner','arcade','cuda','seats']){
    const scene=new B.Scene(engine),plugin=new B.HavokPlugin(true,h);
    scene.useRightHandedSystem=true;scene.enablePhysics(new B.Vector3(0,-18,0),plugin);scene.physicsEnabled=false;scene.animationsEnabled=false;
    const options={journeyMode:'story',chapter,stage:chapter==='diner'?1:chapter==='seats'?8:2,style:'3d',lab:false,finale:chapter==='seats'};
    const app=new Training(engine,scene,plugin,options);setApp(app);app.hud=()=>{};
    let start,retry,finishes=[];ctx.window.JensenJourney={ready:(cb,again)=>{start=cb;retry=again;},finish:result=>finishes.push(result)};
    let staged=[],cleared=[];ctx.window.JourneySetpiece={stage:(s,c)=>{staged.push(c);if(chapter==='cuda')setpiece.stage(s,c);},lesson:l=>{if(chapter==='cuda')setpiece.lesson(l);},cleared:c=>cleared.push(c)};
    // Native logic probe: GPU readiness and image decode are presentation stubs.
    scene.whenReadyAsync=async()=>{};const floorImage=ctx.document.getElementById('finaleFloor');floorImage.decode=async()=>{};
    await app.load();assert.deepEqual(staged,[chapter]);assert.equal(typeof retry,'function');
    assert.equal(app.survivor,true);assert(app.field.arenaX>2*C.arenaX);assert(app.camera.orthoRight*2<app.field.arenaX);
    assert.equal(app.settings.immortal,false);assert.equal(app.lab,false);assert.equal(app.settings.override,false);
    assert.equal(app.settings.heroOverride,false);assert.equal(app.settings.scenario,'all');
    const before=app.simTime;app.tick(C.step);assert.equal(app.simTime,before);
    for(const action of [()=>ctx.window.engineC.reset(),()=>ctx.window.engineC.stage(8),()=>ctx.window.engineC.scenario('dummy'),()=>ctx.window.engineC.moveTo(0,0),()=>ctx.window.engineC.attackAt(0,0),()=>ctx.window.engineC.freeze(true)])assert.equal(action(),false);
    assert.equal(app.beginFinale(),false);assert.equal(start(),true);assert.equal(start(),false);
    const click=(a,event={})=>{const saved=app.pointerRay;app.pointerRay=()=>new B.Ray(a.root.position.add(new B.Vector3(0,20,0)),new B.Vector3(0,-1,0));try{ui.view.handlers.pointerdown({button:0,pointerType:'mouse',...event,preventDefault(){}});}finally{app.pointerRay=saved;}};
    const first=app.actors.find(a=>app.isHostile(a)),touch={pointerType:'touch',isPrimary:true};
    click(first,{...touch,isPrimary:false});assert.equal(app.selectedID,null);
    click(first,touch);assert.equal(app.selectedID,first.id);assert.equal(app.order.type,'attack');
    click({root:{position:new B.Vector3(0,0,5)}},touch);assert.equal(app.selectedID,null);assert.equal(app.order.type,'move');
    const groundOrder=app.order;click(first,{...touch,isPrimary:false});assert.equal(app.order,groundOrder);
    app.journey=null;click(first,touch);assert.equal(app.order,groundOrder);assert.equal(app.selectedID,null);app.journey=chapter;
    if(chapter==='seats'){
      // Real death order is independent of target clicks and actor array order.
      click(app.actors.find(a=>a.seat===1));
      const defeated=[5,2,9];
      for(const n of defeated){const a=app.actors.find(a=>a.seat===n),r=app.rootEvent(app.hero,'basic',a.hp*2,.43,.1,.24);app.damage(r,a,a.root.position,app.hero.root.position,'direct');}
      assert.deepEqual([...app.seatsDown],defeated);
      const enemy=app.actors.find(a=>a.seat===1),r=app.rootEvent(enemy,'shoot',100000,1,.1,.2);r.damageKind='ground_heat';app.damage(r,app.hero,app.hero.root.position,enemy.root.position,'ground','loss');
      app.tick(C.step);assert.equal(finishes.length,1);assert.equal(finishes[0].won,false);assert.equal(finishes[0].hp,0);assert.deepEqual([...finishes[0].seatsDown],defeated);
    }else{
      if(chapter==='cuda'){
        assert.equal(app.cudaLesson.phase,'serial');assert.equal(app.activeProfile().cap,1);assert.equal(app.start(app.hero,'skill1',0),null);assert.equal(app.requestSkill(0),false);assert.equal(app.requestSkill(1),false);
        app.lessonHUD();assert.match(ui.cudaLesson.textContent,/Click or tap a ringed rival/);assert.equal(ui.cudaLesson.hidden,false);
        // Ordinary automatic attacks without an explicit target cannot earn the manual lesson.
        const automaticBefore=app.damageEvents.length;
        for(let i=0;i<120*6&&!app.ended;i++)app.tick(C.step);
        assert(app.damageEvents.slice(automaticBefore).some(e=>e.source===app.hero.id&&e.actual>0),'nearby automatic attacks actually connect');
        assert.equal(app.cudaLesson.phase,'serial');assert.equal(app.cudaLesson.serialTarget,null);assert.equal(app.cudaEvents.length,0);
        const relay=app.actors.find(a=>app.isHostile(a)&&a.kind==='rusher');click(relay);
        for(let i=0;i<120*7&&app.cudaLesson.phase==='serial'&&!app.ended;i++)app.tick(C.step);
        assert.equal(app.cudaLesson.phase,'ready');app.lessonHUD();assert.match(ui.cudaLesson.textContent,/click or tap a DIFFERENT nearby/);
        assert.equal(relay.cudaCue.isEnabled(),false,'the first target must not be offered again');
        const next=app.actors.find(a=>a.cudaCue&&a.id!==relay.id&&app.lessonCohort(a));assert(next,'a connected alternative is offered');
        const readyAt=app.cudaLesson.readyAt;
        // Re-click the same rival through the real input handler; it cannot unlock or restart the cue.
        click(relay);
        for(let i=0;i<36;i++)app.tick(C.step);
        app.lessonHUD();assert(next.cudaCue.scaling.x>1,'eligible alternatives visibly pulse after first contact');
        const scale=next.cudaCue.scaling.x,time=app.simTime;app.paused=true;
        for(let i=0;i<60;i++)app.tick(C.step);app.lessonHUD();
        assert.equal(app.simTime,time);assert.equal(next.cudaCue.scaling.x,scale,'pause freezes cue animation with simulation time');app.paused=false;
        app.settings.reduced=true;app.lessonHUD();assert.equal(next.cudaCue.scaling.x,1);assert(next.cudaCue.isEnabled(),'reduced motion retains the static target cue');app.settings.reduced=false;
        assert.equal(app.cudaLesson.readyAt,readyAt);assert.equal(app.cudaLesson.phase,'ready');
        // The pulse never advertises an impossible broadcast; neutral focus rings stay available.
        const refresh=()=>{app.cudaLesson.cueNextAt=app.simTime;app.lessonHUD();};
        const saved=next.root.position.clone();next.root.position.set(50,0,50);refresh();assert.equal(next.cudaCue.scaling.x,1);assert(next.cudaCue.isEnabled());next.root.position.copyFrom(saved);
        const blocked=app.blocked;app.blocked=()=>true;refresh();assert.equal(next.cudaCue.scaling.x,1);assert.equal(app.lessonCohort(next),false);app.blocked=blocked;
        const positions=app.actors.filter(a=>app.isHostile(a)&&a!==next&&a!==relay).map(a=>[a,a.root.position.clone()]);
        for(const [actor]of positions)actor.root.position.set(50,0,50);
        refresh();assert.equal(next.cudaCue.scaling.x,1,'one extra recipient is insufficient');assert.equal(app.lessonCohort(next),false);
        for(const [actor,position]of positions)actor.root.position.copyFrom(position);
        for(let i=0;i<120*7&&!app.ended;i++)app.tick(C.step);
        app.lessonHUD();assert.equal(next.cudaCue.scaling.x,1,'the brief pulse ends while the explicit retarget instruction remains');
        assert.equal(app.cudaLesson.phase,'ready');assert.equal(app.cudaLesson.serialTarget,relay.id);
        assert.equal(app.cudaEvents.length,0,'repeating one selected relay cannot broadcast');
        assert.equal(relay.hp,1,'serial damage reseals instead of killing the lesson target');
        assert.equal(app.waveIndex,0);
        const screens=scene.meshes.filter(m=>m.name==='journey-arcade-display');
        assert.equal(screens.filter(m=>m.material.name==='journey-screen-on').length,1,'one serial cabinet flickers');
        const delta=engine.getDeltaTime;engine.getDeltaTime=()=>1000/60;
        for(let i=0;i<60;i++)scene.onBeforeRenderObservable.notifyObservers(scene);engine.getDeltaTime=delta;
        assert(screens.every(m=>m.material.name==='journey-screen-off'),'serial cabinet reseals before broadcast');
        assert.equal(app.progressEvents.filter(e=>e.type==='cuda-serial-resealed').length,1,'serial feedback occurs once');
      }
      if(chapter==='arcade'){
        assert.equal(app.slotAvailable(0),true);assert.equal(app.slotAvailable(1),false);
        assert(app.requestSkill(0));app.tick(C.step);assert.equal(app.hero.action.warrior,'cyclone');
      }
      // Only the real mouse handler selects enemies; no HP, actor positions, AI, cooldown or damage intervention.
      let sawShotLane=false,sawMeleeCone=false,peak=0,target=null;for(let step=0;step<120*180&&!app.ended;step++){
        if(!target||target.dead||target.retired){target=app.actors.filter(a=>app.isHostile(a)&&!(chapter==='cuda'&&app.cudaLesson.phase==='ready'&&a.id===app.cudaLesson.serialTarget)).sort((a,b)=>B.Vector3.DistanceSquared(a.root.position,app.hero.root.position)-B.Vector3.DistanceSquared(b.root.position,app.hero.root.position))[0];if(target){click(target,chapter==='cuda'&&app.cudaLesson.phase==='ready'?touch:{});assert.equal(app.selectedID,target.id);}}
        app.tick(C.step);peak=Math.max(peak,app.actors.filter(a=>app.isHostile(a)).length);
        assert(peak<=app.stageData.activeCap,'active simulation cap');
        if(chapter==='arcade')for(const foe of app.actors){
          if(!foe.action?.warning||foe.action.age>=foe.action.windup)continue;
          if(foe.action.type==='shoot'){assert(foe.tellBands[0].mesh.isEnabled());assert.equal(foe.tell.isEnabled(),false);sawShotLane=true;}
          if(foe.action.type==='guardCharge'){assert(foe.tell.isEnabled());sawMeleeCone=true;}
        }
      }
      if(chapter==='arcade')assert(sawShotLane&&sawMeleeCone,'both kinds of threat must appear in the encounter');
      const arrivals=app.progressEvents.filter(e=>e.type==='ingress');
      assert(arrivals.some(e=>e.time>0)&&arrivals.length>app.stageData.activeCap,'finite reinforcements arrive after the opening');
      const quadrants=new Set(arrivals.map(e=>[e.position[0]>e.hero[0],e.position[1]>e.hero[1]].join('/')));
      assert.equal(quadrants.size,4,'arrivals surround the hero');
      assert.equal(app.ended,true,chapter+' did not finish');
      assert.equal(finishes.length,1);assert.equal(finishes[0].won,true,chapter+' cannot win with ordinary clicks');
      assert(finishes[0].hp>0);assert.deepEqual([...finishes[0].seatsDown],[]);assert.deepEqual(cleared,[chapter]);
      if(chapter==='cuda'){
        app.lessonHUD();assert.match(ui.cudaLesson.textContent,/CUDA online/);assert(app.actors.filter(a=>a.cudaCue).every(a=>!a.cudaCue.isEnabled()));
        assert.equal(app.cudaLesson.phase,'parallel');assert.equal(app.slotAvailable(0),true);assert.equal(app.slotAvailable(1),false);assert.equal(app.cudaLesson.targets.length,3);
        assert(scene.meshes.filter(m=>m.name==='journey-arcade-display'||m.name==='journey-parallel-floor-circuit').every(m=>m.material.name==='journey-screen-on'),'the actual broadcast opens cabinets and floor circuits');
        const event=app.cudaEvents.find(e=>e.rootId===app.cudaLesson.rootId);
        assert.notEqual(event.seed,app.cudaLesson.serialTarget,'the real second click/tap targets a distinct rival');
        assert.equal(event.edges.length,2);assert(event.edges.every(e=>e.from===event.seed&&e.depth===1));
        const hits=app.damageEvents.filter(e=>e.rootId===event.rootId&&e.actual>0);
        assert.equal(new Set(hits.map(e=>e.time)).size,1,'direct hit and both extra recipients resolve at the same time');
        assert.equal(new Set(hits.map(e=>e.target)).size,3,'one connected basic damages three distinct real owners');
        assert(app.progressEvents.find(e=>e.type==='cuda-parallel-open').time<app.progressEvents.find(e=>e.type==='journey-victory').time);
        assert(app.cudaEvents.some(e=>e.edges.length),'CUDA must hit an extra owner in the natural encounter');assert(app.damageEvents.some(e=>e.type==='beam'&&e.actual>0),'champion beam must resolve during ordinary pursuit');}
      const rally=app.healEvents.filter(e=>e.type==='rally');assert(rally.length>0);
      for(const [index,e]of rally.entries()){
        assert.equal(e.mobs,(index+1)*5);assert.equal(e.hpAfter-e.hpBefore,e.actual);
        assert.equal(e.actual,Math.min(app.hero.maxHP-e.hpBefore,Math.round(app.hero.maxHP*.12)));
      }
      if(chapter==='diner'){assert.equal(app.stageIndex,1);assert(rally.some(e=>e.actual>0),'diner restores actual missing health');}else assert.equal(app.stageIndex,2);
    }
    const time=app.simTime;for(let i=0;i<30;i++)app.tick(C.step);assert.equal(app.simTime,time);app.endJourney(true);app.endJourney(false);assert.equal(finishes.length,1);
    assert.equal(ui.finaleResult.hidden,true);assert.equal(ui.finaleIntro.hidden,true);
    results.push({chapter,time:Math.round(time*100)/100,hp:app.hero.hp,won:finishes[0].won,tray:app.tray,cudaLinks:app.cudaEvents.reduce((n,e)=>n+e.edges.length,0),seatsDown:[...app.seatsDown]});
    if(chapter==='seats'){
      assert.equal(retry(),true);assert.equal(app.hero.hp,3800);assert.deepEqual([...app.seatsDown],[]);assert.equal(app.finaleState,'playing');assert.equal(app.ended,false);assert.equal(retry(),false);
      // A real capped block-regeneration result can leave half a hit point after integer damage.
      const source=app.actors.find(a=>a.seat===1),hurt=(amount,key)=>{const r=app.rootEvent(source,'shoot',amount,1,.1,.2);r.damageKind='ground_heat';app.damage(r,app.hero,app.hero.root.position,source.root.position,'ground',key);};
      hurt(1000,'first');const block=app.rootEvent(source,'shoot',225,1,.1,.2);block.damageKind='discrete_projectile';block.shieldDecisions.set(app.hero.id,true);app.damage(block,app.hero,app.hero.root.position,source.root.position,'projectile','block');assert.equal(app.healEvents.at(-1).actual,112.5);hurt(2912,'fractional');
      assert.equal(app.hero.hp,.5);assert.equal(app.hero.dead,false);app.endJourney(true);assert.equal(finishes.length,2);assert.equal(finishes[1].won,true);assert.equal(finishes[1].hp,.5);
    }else {
      assert.equal(retry(),false);
      app.reset();app.finaleState='intro';assert.equal(app.beginJourney(),true);
      const enemy=app.actors.find(a=>app.isHostile(a)),r=app.rootEvent(enemy,'shoot',100000,1,.1,.2);r.damageKind='ground_heat';app.damage(r,app.hero,app.hero.root.position,enemy.root.position,'ground','loss');app.tick(C.step);
      assert.equal(finishes.length,2);assert.equal(finishes[1].won,false);assert.equal(retry(),true);assert.equal(app.hero.hp,app.stageData.hp);assert.equal(app.ended,false);
      if(chapter==='cuda'){
        assert.equal(app.cudaLesson.phase,'serial');assert.equal(app.cudaLesson.serialTarget,null);assert.equal(app.cudaLesson.rootId,null);
        assert.equal(app.cudaEvents.length,0);assert.equal(app.activeProfile().cap,1);
        assert(scene.meshes.filter(m=>m.name==='journey-arcade-display'||m.name==='journey-parallel-floor-circuit').every(m=>m.material.name==='journey-screen-off'),'retry clears cabinet and field state');
        // Overpowered direct damage cannot bypass the real retarget-and-broadcast decision.
        const victim=app.actors.find(a=>app.isHostile(a)),hit=app.rootEvent(app.hero,'basic',100000,.43,.1,.24);
        app.damage(hit,victim,victim.root.position,app.hero.root.position,'direct');
        assert.equal(victim.hp,1);assert.equal(victim.dead,false);assert.equal(app.cudaLesson.phase,'serial');
        const relays=app.actors.filter(a=>app.isHostile(a)&&a.kind==='rusher');
        click(relays[0]);const serial=app.rootEvent(app.hero,'basic',60,.43,.1,.24);app.damage(serial,relays[0],relays[0].root.position,app.hero.root.position,'direct');
        assert.equal(app.cudaLesson.phase,'ready');
        click(relays[1]);const denied=app.rootEvent(app.hero,'basic',100000,.43,.1,.24),blocked=app.blocked;
        // Inject obstruction on the origin-to-seed ray while relay-to-relay rays remain clear.
        app.blocked=from=>from.y<.1;
        app.damage(denied,relays[1],relays[1].root.position,app.hero.root.position,'direct');app.blocked=blocked;
        assert.equal(app.cudaLesson.phase,'ready','a blocked seed must not release the field');
        assert.equal(app.cudaLesson.rootId,null);assert.equal(app.progressEvents.filter(e=>e.type==='cuda-parallel-open').length,0);
        assert.equal(app.cudaEvents.at(-1).reason,'seed-blocked-or-out-of-range');
        assert.equal(relays[1].hp,1,'failed broadcast keeps even an overpowered seed alive');
        // The next real damage packet must hurt this depleted seed as well as both CUDA recipients.
        const earned=app.rootEvent(app.hero,'basic',60,.43,.1,.24);
        app.damage(earned,relays[1],relays[1].root.position,relays[1].root.position,'direct');
        const earnedHits=app.damageEvents.filter(e=>e.rootId===earned.id&&e.actual>0);
        assert.equal(app.cudaLesson.phase,'parallel');assert.equal(relays[1].dead,true);
        assert.equal(earnedHits.length,3,'depleted seed still takes actual damage in the three-owner broadcast');
        assert.equal(new Set(earnedHits.map(e=>e.target)).size,3);assert.equal(new Set(earnedHits.map(e=>e.time)).size,1);
        assert.equal(earnedHits.filter(e=>e.target===relays[1].id).length,1,'the original direct packet is not duplicated');
        let target=null;for(let i=0;i<120*120&&!app.ended;i++){
          if(!target||target.dead||target.retired){target=app.actors.filter(a=>app.isHostile(a)).sort((a,b)=>B.Vector3.DistanceSquared(a.root.position,app.hero.root.position)-B.Vector3.DistanceSquared(b.root.position,app.hero.root.position))[0];if(target)click(target);}
          app.tick(C.step);
        }
        assert.equal(app.finaleState,'won','a depleted-seed unlock cannot softlock the remaining waves');
      }
    }
    scene.dispose();
  }
  // Guest editions are selected after the invitation parser validates the version.
  function guest(edition){
    const scene=new B.Scene(engine),plugin=new B.HavokPlugin(true,h);
    scene.useRightHandedSystem=true;scene.enablePhysics(new B.Vector3(0,-18,0),plugin);scene.physicsEnabled=false;
    const app=new Training(engine,scene,plugin,{journeyMode:'challenge',survivorEdition:edition===3,chapter:'seats',stage:8,finale:true,style:'3d'});
    app.hud=()=>{};app.reset();app.ready=true;app.beginJourney();return app;
  }
  const key=(type,code)=>keys[type]({code,preventDefault(){}});
  function point(app,x,z,actor,event={}){
    const ray=app.pointerRay,ground=app.groundAt,target=actor?actor.root.position:new B.Vector3(x,0,z);
    app.groundAt=()=>target;app.pointerRay=()=>new B.Ray(target.add(new B.Vector3(0,20,0)),new B.Vector3(0,-1,0));
    try{ui.view.handlers.pointerdown({button:0,pointerType:'mouse',...event,preventDefault(){}});}finally{app.pointerRay=ray;app.groundAt=ground;}
  }
  const legacy=[];
  for(const version of [1,2]){
    const app=guest(version);assert.equal(app.survivor,false);assert.equal(app.field,C);
    assert.equal(app.actors.filter(a=>a.seat).length,10);
    assert.equal(app.actors.find(a=>a.seat===5).spec.speed,0);
    assert.equal(app.actors.find(a=>a.seat===1).maxHP,42000);
    key('keydown','KeyD');for(let i=0;i<180;i++)app.tick(C.step);
    assert(Math.abs(app.hero.root.position.x)<.01);assert.equal(app.autoTarget,null);
    legacy.push(app.actors.map(a=>[a.kind,a.hp,a.root.position.x,a.root.position.z,a.action?.type]));app.scene.dispose();
  }
  assert.deepEqual(legacy[0],legacy[1],'legacy editions reproduce their native combat rules');
  {
    const app=guest(3),seats=app.actors.filter(a=>a.seat);
    assert.equal(seats.length,10);assert(seats.every(a=>a.spec.speed>0));
    const start=seats.map(a=>a.root.position.clone()),focus=app.camera.getTarget().clone();
    for(const [code,modifier]of [['KeyW','metaKey'],['KeyA','ctrlKey'],['ArrowLeft','altKey']]){
      keys.keydown({code,[modifier]:true,preventDefault(){assert.fail('browser shortcut consumed');}});
      assert.equal(app.steerKeys.size,0);
    }
    key('keydown','ArrowDown');assert(app.steerKeys.has('ArrowDown'));
    keys.keyup({code:'ArrowDown',ctrlKey:true});assert.equal(app.steerKeys.size,0);
    key('keydown','KeyD');
    for(let i=0;i<300;i++)app.tick(C.step);
    key('keyup','KeyD');
    app.camera.getViewMatrix(true);assert(app.hero.root.position.x>9);assert(app.camera.getTarget().x>focus.x+8);
    assert(seats.every((a,i)=>a.travel>.05||a.action?.warning),'every seat independently pursues or commits');
    assert(seats.some((a,i)=>['shoot','sniper','volley'].includes(a.spec.action)&&B.Vector3.Distance(a.root.position,start[i])>.5),'ranged fighters close on the moving player');
    const pursuit=seats.map(a=>({seat:a.seat,meters:+a.travel.toFixed(2)}));
    const heldWorldX=app.hero.root.position.x+3;
    point(app,heldWorldX,3,null,{pointerId:7});
    for(let i=0;i<320;i++)app.tick(C.step);
    ui.view.handlers.pointerup({pointerId:7});
    assert.equal(app.dragId,null);assert(app.hero.root.position.x>heldWorldX+2,'holding a floor direction steers along with the following camera');
    assert(app.hero.root.position.x>C.arenaX+3,'normal floor walk traverses beyond old arena');
    assert(app.camera.orthoRight<app.field.arenaX/2);
    results.push({guest:3,pursuit,worldX:+app.hero.root.position.x.toFixed(2)});app.scene.dispose();
  }
  {
    const app=guest(3),hero=app.hero,foe=app.actors.find(a=>a.seat===4);
    for(const a of [...app.actors])if(a!==hero&&a!==foe){app.disposeActor(a);app.actors.splice(app.actors.indexOf(a),1);}
    const place=(a,x,z)=>{a.controller.setPosition(new B.Vector3(x,a.m.height/2+.025,z));a.root.position.set(x,.025,z);app.pose(a);};
    place(hero,0,0);place(foe,1.5,0);app.simTime=2;app.spawnAt=0;foe.nextAttack=100;
    key('keydown','KeyW');for(let i=0;i<24;i++)app.tick(C.step);key('keyup','KeyW');
    assert.equal(app.selectedID,null);assert.equal(app.autoTarget,foe.id);assert(hero.root.position.z<-.5);
    assert(app.damageEvents.some(e=>e.type==='basic'&&e.target===foe.id&&e.actual>0),'automatic fan deals damage while steering across its path');
    app.scene.dispose();
  }
  // A real committed charge can be seen, frozen in pause, and avoided with ordinary keyboard steering.
  for(const sidestep of [false,true]){
    const app=guest(3),v=app.actors.find(a=>a.seat===1);let rush;
    for(const a of [...app.actors])if(a!==app.hero&&a!==v){app.disposeActor(a);app.actors.splice(app.actors.indexOf(a),1);}
    for(let i=0;i<120*10&&!rush;i++){app.tick(C.step);if(v.action?.geometry?.shape==='rush-capsule')rush=v.action;}
    assert(rush);assert(v.tell.isEnabled());assert(B.Vector3.Distance(rush.origin,app.hero.root.position)<5.5);
    app.pauseGame();const frozen=rush.age;app.tick(C.step);assert.equal(v.action,rush);assert.equal(rush.age,frozen);
    app.resumeGame();if(sidestep)key('keydown','KeyD');
    for(let i=0;i<120*2;i++)app.tick(C.step);
    const hits=app.damageEvents.filter(e=>e.rootId===rush.id&&e.target===app.hero.id&&e.actual>0);
    assert.equal(hits.length,sidestep?0:1);if(sidestep)assert.equal(rush.punishOpen,true);
    key('keyup','KeyD');app.scene.dispose();
  }
  {
    const app=guest(3);for(let i=0;i<120*90&&!app.ended;i++)app.tick(C.step);
    assert.equal(app.finaleState,'lost','automatic basics alone leave the idle hero vulnerable');
    const incoming=app.damageEvents.filter(e=>e.target===app.hero.id&&e.actual>0);
    assert(incoming.every(e=>e.source.startsWith('seat_')));assert(incoming.length>0);
    results.push({guest:3,idle:'lost',time:+app.simTime.toFixed(2),seatsDown:[...app.seatsDown]});app.scene.dispose();
  }
  for(const opening of [1,3]){
    const app=guest(3),first=app.actors.find(a=>a.seat===opening);
    point(app,0,0,first);let target=first;
    for(let i=0;i<120*110&&!app.ended;i++){
      if(!target||target.dead){
        target=app.actors.filter(a=>app.isHostile(a)).sort((a,b)=>B.Vector3.DistanceSquared(a.root.position,app.hero.root.position)-B.Vector3.DistanceSquared(b.root.position,app.hero.root.position))[0];
        if(target)point(app,0,0,target);
      }
      // Track the moving rival with the pointer so Thunder Leap lands on the current lane.
      if(target&&!target.dead&&i%20===0){
        const ground=app.groundAt;app.groundAt=()=>target.root.position.clone();
        try{ui.view.handlers.pointermove({pointerType:'mouse'});}finally{app.groundAt=ground;}
      }
      if(target&&B.Vector3.Distance(target.root.position,app.hero.root.position)<(app.seatsDown.length?3.3:2.4)){
        if(!app.requestSkill(1))app.requestSkill(0);
      }
      app.tick(C.step);
    }
    assert.equal(app.finaleState,'won','Survivor full-loadout ordinary inputs win');assert.equal(app.seatsDown[0],opening);
    assert.equal(new Set(app.seatsDown).size,10);
    results.push({guest:3,opening,seatsDown:[...app.seatsDown],hp:app.hero.hp,time:+app.simTime.toFixed(2)});
    app.scene.dispose();
  }
  engine.dispose();console.log(JSON.stringify({pass:true,results}));
})().catch(e=>{console.error(e);process.exitCode=1;});
