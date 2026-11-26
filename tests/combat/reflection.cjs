'use strict';
// Actual core/model/Havok probe. DOM/canvas/audio presentation only is stubbed.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../../combat'),B=require(root+'/vendor/babylon.js'),Havok=require(root+'/vendor/HavokPhysics_umd.js');
function el(){const o={style:{setProperty(k,v){this[k]=v;}},dataset:{},hidden:false,value:'',checked:false,children:[],handlers:{},setAttribute(k,v){this[k]=v;},remove(){},focus(){},addEventListener(name,cb){this.handlers[name]=cb;},getBoundingClientRect:()=>({left:0,top:0,width:1600,height:900}),appendChild(x){this.children.push(x);return x;},replaceChildren(...x){this.children=x;}};o.parentElement={};o.firstElementChild={style:{}};o.lastElementChild={style:{}};return o;}
global.OffscreenCanvas=class{constructor(w,h){this.width=w;this.height=h;}getContext(){return{createLinearGradient:()=>({addColorStop(){}}),fillRect(){},strokeRect(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},stroke(){},drawImage(){},save(){},restore(){},translate(){},scale(){},fillText(){},measureText:()=>({width:0})};}};
const keys={},nodes=new Map(),ctx={window:{BABYLON:B,addEventListener(name,fn){keys[name]=fn;},location:{search:''}},document:{getElementById:id=>{if(!nodes.has(id))nodes.set(id,el());return nodes.get(id);},createElement:el,addEventListener(){},hidden:false},devicePixelRatio:1,performance,console,URLSearchParams};
for(const file of ['models.js','campaign-data.js','render-style.js','journey-setpiece.js','survivor-skills.js','reflection-combat.js','reflection-stage.js'])vm.runInNewContext(fs.readFileSync(root+'/'+file,'utf8'),ctx);
const source=fs.readFileSync(root+'/game.js','utf8');vm.runInNewContext(source.slice(0,source.lastIndexOf('(async()=>{'))+'\nwindow.review={Training,C,queryOptions,ui,setApp:value=>app=value};})();',ctx);

(async()=>{
  const {Training,C,queryOptions,ui}=ctx.window.review;
  assert.equal(queryOptions('?mode=reflection').journeyMode,'reflection');
  assert.equal(queryOptions('?mode=story&encounter=reflection').journeyMode,'story');
  // A player dodging impact can still be caught by the delayed bolt when
  // returning early. Neither that failed cycle nor the harmless preview opens.
  const d=new ctx.window.ReflectionCombat.Duel('leap'),hazards=[];
  const advance=(until,hero)=>{for(let i=0;i<2000&&d.phase!==until;i++)d.update(C.step,hero,e=>hazards.push(e));assert.equal(d.phase,until);};
  assert.equal(d.counter('early',0),false);advance('tell',{x:0,z:0});advance('aftershock',{x:4,z:0});
  advance('recovery',{x:0,z:0});assert.equal(d.open,false);assert.equal(d.counter('late',17),false);
  assert.deepEqual(hazards.map(e=>[e.kind,e.hit]),[['landing',false],['lightning',true]]);
  const engine=new B.NullEngine({renderWidth:1280,renderHeight:720});
  const h=await Havok({wasmBinary:fs.readFileSync(root+'/vendor/HavokPhysics.wasm')});
  function native(chapter,mode){
    const scene=new B.Scene(engine),plugin=new B.HavokPlugin(true,h);
    scene.useRightHandedSystem=true;scene.enablePhysics(new B.Vector3(0,-18,0),plugin);scene.physicsEnabled=false;
    return new Training(engine,scene,plugin,{stage:8,chapter,journeyMode:mode,style:'3d',finale:chapter==='seats'});
  }
  const key=(kind,code)=>keys[kind]({code,key:code.slice(3),preventDefault(){}});
  const step=app=>app.tick(C.step);
  const results=[];
  for(const signature of ['hammer','leap','cyclone']){
    const finishes=[];let start,retry;
    ctx.window.JensenJourney={ready:(a,b)=>{start=a;retry=b;},reflectionMove:()=>signature,finish:r=>finishes.push(r)};
    const app=native('reflection','reflection');app.scene.whenReadyAsync=async()=>{};await app.load();
    assert.equal(app.actors.length,2);assert.equal(app.echo.seat,0);assert.equal(app.actors.filter(a=>a.seat).length,0);
    assert.equal(app.hero.hp,3800);assert.equal(app.hero.hp,app.hero.maxHP);assert.equal(app.hero.hp,app.settings.hp);
    assert.equal(app.settings.immortal,false);assert.equal(start(),true);
    assert.equal(app.requestSkill(0),false,'display cannot prime a skill');
    while(app.duel.phase==='preview')step(app);
    assert.equal(app.damageEvents.length,0,'harmless display');assert.equal(app.duel.counters,0);
    while(app.duel.phase!=='tell')step(app);
    const root=app.rootEvent(app.hero,'basic',900,1,0,.1);
    assert.equal(app.damage(root,app.echo,app.echo.root.position,app.hero.root.position,'direct'),false,'locked tell cannot be countered');
    const frozen=JSON.stringify(app.duel.view());app.pauseGame();for(let i=0;i<180;i++)step(app);
    assert.equal(JSON.stringify(app.duel.view()),frozen);app.resumeGame();
    while(!app.ended&&app.simTime<95)step(app);
    assert.equal(finishes.length,1);assert.equal(finishes[0].won,false);assert.equal(finishes[0].hp,0);
    assert.equal(finishes[0].reflection.counters,0,'standing still and autoattacking earns no counter');
    const lostAt=app.simTime;
    assert(retry());assert.equal(app.simTime,0);assert.equal(app.duel.phase,'preview');assert.equal(app.duel.cycle,0);
    assert.equal(app.duel.counters,0);assert.equal(app.hero.hp,3800);assert.equal(app.actors.length,2);assert.equal(app.damageEvents.length,0);
    assert.equal(app.scene.getMeshesById('reflection-diner-floor').length,1);
    let handled=0,focusCycle=0,locked=null;
    while(!app.ended&&app.simTime<65){
      const d=app.duel;
      if(d.phase==='tell'&&d.cycle!==handled){
        handled=d.cycle;locked={...d.target};key('keydown',locked.x<=0?'KeyD':'KeyA');
      }
      if(d.phase==='tell'||d.phase==='strike')assert.deepEqual({...d.target},locked,'target follows no subsequent input');
      const gap=Math.hypot(app.hero.root.position.x-d.target.x,app.hero.root.position.z-d.target.z);
      if(d.phase==='tell'&&gap>3.35){key('keyup','KeyD');key('keyup','KeyA');}
      if(d.open&&focusCycle!==d.cycle){
        focusCycle=d.cycle;
        const passive=app.rootEvent(app.hero,'hammer-lightning',900,1,0,.1);
        assert.equal(app.damage(passive,app.echo,app.echo.root.position,app.hero.root.position,'lightning'),false,'passive damage cannot spend an opening');
        // Reuse the real focus-click handler. Native pathfinding and hit geometry
        // must bring the hero home and connect a swing before recovery ends.
        const ray=app.pointerRay;app.pointerRay=()=>new B.Ray(app.echo.root.position.add(new B.Vector3(0,20,0)),new B.Vector3(0,-1,0));
        ui.view.handlers.pointerdown({button:0,pointerType:'mouse',preventDefault(){}});app.pointerRay=ray;
      }
      step(app);
    }
    assert.equal(finishes.length,2);assert.equal(finishes[1].won,true,JSON.stringify({signature,events:app.progressEvents,hero:app.hero.root.position,echo:app.echo.root.position,hits:app.duel.hits}));assert.equal(finishes[1].reflection.counters,2);
    assert.equal(finishes[1].hp,3800);assert.equal(finishes[1].seatsDown.length,0);
    assert.equal(app.duel.hits.length,2);assert.equal(new Set(app.duel.hits.map(h=>h.cycle)).size,2);
    for(const hit of app.duel.hits)assert(app.damageEvents.some(e=>e.rootId===hit.rootId&&e.type==='basic'&&e.target==='reflection'&&e.channel==='direct'&&e.actual===1));
    assert(app.simTime>=35&&app.simTime<=50,'guided clean dodge and punish reaches target pacing');
    assert.equal(app.progressEvents.some(e=>e.type==='wave-start'),false);assert.equal(app.seatsDown.length,0);
    app.hud();assert.equal(app.snapshot().reflection.counters,2);
    results.push({signature,lostAt,wonAt:app.simTime});app.scene.dispose();
  }
  // Read a real native cast only at release. This is per fight and story only.
  for(const mode of ['story','challenge']){
    const app=native('seats',mode);app.survivor=true;app.reset();app.ready=true;app.beginJourney();app.simTime=2;
    let r=app.start(app.hero,'skill2',0);app.cancel(app.hero,'precontact');assert.equal(app.lastMove,null);
    r=app.start(app.hero,'skill1',0);r.age=.22;app.contacts(app.hero);assert.equal(app.lastMove,mode==='story'?'cyclone':null);app.cancel(app.hero,'switch');
    r=app.start(app.hero,'skill2',0);r.age=r.windup;app.contacts(app.hero);assert.equal(app.lastMove,mode==='story'?'leap':null);
    let report;ctx.window.JensenJourney={finish:r=>report=r};app.endJourney(true);
    assert.equal(report.lastMove,mode==='story'?'leap':undefined);
    app.reset();assert.equal(app.lastMove,null);app.scene.dispose();
  }
  engine.dispose();console.log(JSON.stringify({pass:true,results}));
})().catch(e=>{console.error(e);process.exitCode=1;});
