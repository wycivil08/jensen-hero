'use strict';
// Actual core/model/Havok probe. DOM/canvas/audio presentation only is stubbed.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'../../combat'),B=require(root+'/vendor/babylon.js'),Havok=require(root+'/vendor/HavokPhysics_umd.js');
const hashes=Object.fromEntries(['game.js','index.html','models.js','campaign-data.js','render-style.js'].map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+file)).digest('hex')]));
function el(){const o={style:{setProperty(k,v){this[k]=v;}},dataset:{},hidden:false,value:'',checked:false,children:[],handlers:{},setAttribute(k,v){this[k]=v;},remove(){},focus(){},addEventListener(name,cb){this.handlers[name]=cb;},getBoundingClientRect:()=>({left:0,top:0,width:1600,height:900}),appendChild(x){this.children.push(x);return x;},replaceChildren(...x){this.children=x;}};o.parentElement={};o.firstElementChild={style:{}};o.lastElementChild={style:{}};return o;}
global.OffscreenCanvas=class{constructor(w,h){this.width=w;this.height=h;}getContext(){return{fillRect(){},strokeRect(){},clearRect(){},drawImage(){},save(){},restore(){},translate(){},scale(){},fillText(){},measureText:()=>({width:0})};}};
const nodes=new Map(),ctx={window:{BABYLON:B,addEventListener(){},location:{search:''}},document:{getElementById:id=>{if(!nodes.has(id))nodes.set(id,el());return nodes.get(id);},createElement:el,addEventListener(){},hidden:false},devicePixelRatio:1,performance,console,URLSearchParams};
for(const file of ['models.js','campaign-data.js','render-style.js'])vm.runInNewContext(fs.readFileSync(root+'/'+file,'utf8'),ctx);
const source=fs.readFileSync(root+'/game.js','utf8');vm.runInNewContext(source.slice(0,source.lastIndexOf('(async()=>{'))+'\nwindow.review={Training,C,queryOptions,ui,setApp:value=>app=value};})();',ctx);

(async()=>{
  const {Training,C,queryOptions,ui,setApp}=ctx.window.review;
  assert.equal(queryOptions('?mode=story&stage=invalid').journeyMode,'story');
  assert.equal(queryOptions('?mode=challenge&v=1').journeyMode,'challenge');
  assert.equal(queryOptions('?mode=challenge&v=2').journeyMode,'challenge'); // UI declines unknown versions before engine boot.
  assert.equal(queryOptions('?mode=finale').finale,true);
  const engine=new B.NullEngine({renderWidth:1600,renderHeight:900});
  const h=await Havok({wasmBinary:fs.readFileSync(root+'/vendor/HavokPhysics.wasm')});
  const results=[];
  for(const chapter of ['diner','arcade','cuda','seats']){
    const scene=new B.Scene(engine),plugin=new B.HavokPlugin(true,h);
    scene.useRightHandedSystem=true;scene.enablePhysics(new B.Vector3(0,-18,0),plugin);scene.physicsEnabled=false;scene.animationsEnabled=false;
    const options={journeyMode:'story',chapter,stage:chapter==='diner'?1:chapter==='seats'?8:2,style:'3d',lab:false,finale:chapter==='seats'};
    const app=new Training(engine,scene,plugin,options);setApp(app);app.hud=()=>{};
    let start,retry,finishes=[];ctx.window.JensenJourney={ready:(cb,again)=>{start=cb;retry=again;},finish:result=>finishes.push(result)};
    let staged=[],cleared=[];ctx.window.JourneySetpiece={stage:(s,c)=>staged.push(c),cleared:c=>cleared.push(c)};
    // Native logic probe: GPU readiness and image decode are presentation stubs.
    scene.whenReadyAsync=async()=>{};const floorImage=ctx.document.getElementById('finaleFloor');floorImage.decode=async()=>{};
    await app.load();assert.deepEqual(staged,[chapter]);assert.equal(typeof retry,'function');
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
      // Only the real mouse handler selects enemies; no HP, actor positions, AI, cooldown or damage intervention.
      let target=null;for(let step=0;step<120*180&&!app.ended;step++){
        if(!target||target.dead||target.retired){target=app.actors.filter(a=>app.isHostile(a)).sort((a,b)=>B.Vector3.DistanceSquared(a.root.position,app.hero.root.position)-B.Vector3.DistanceSquared(b.root.position,app.hero.root.position))[0];if(target)click(target);}
        app.tick(C.step);
      }
      assert.equal(app.ended,true,chapter+' did not finish');
      assert.equal(finishes.length,1);assert.equal(finishes[0].won,true,chapter+' cannot win with ordinary clicks');
      assert(finishes[0].hp>0);assert.deepEqual([...finishes[0].seatsDown],[]);assert.deepEqual(cleared,[chapter]);
      if(chapter==='cuda'){assert(app.cudaEvents.some(e=>e.edges.length),'CUDA must hit an extra owner in the natural encounter');assert(app.damageEvents.some(e=>e.type==='beam'&&e.actual>0),'champion beam must resolve during ordinary pursuit');}
      if(chapter==='diner')assert.equal(app.stageIndex,1);else assert.equal(app.stageIndex,2);
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
    }
    scene.dispose();
  }
  engine.dispose();console.log(JSON.stringify({pass:true,results}));
})().catch(e=>{console.error(e);process.exitCode=1;});
