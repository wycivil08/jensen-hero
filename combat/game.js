(function () {
"use strict";
const B=window.BABYLON,M=window.R20Models,DATA=window.R24Data,STYLE=window.R24RenderStyle,$=id=>document.getElementById(id);
const R=DATA?.rules||{},TYPES=DATA?.types||{};
const V=(x=0,y=0,z=0)=>new B.Vector3(x,y,z),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const angle=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const C=Object.freeze({version:"R28.READABILITY.1",engine:"9.36.0",step:1/120,maxFrame:.05,maxSteps:6,
  speed:4.5,accel:25,brake:34,turn:15,gravity:-18,arenaScale:1.35,
  arenaX:8.85*1.35,arenaZ:5.12*1.35,wallX:9.3*1.35,wallZ:5.65*1.35,floorX:18.8*1.35,floorZ:11.6*1.35,
  heroScale:1.30,maxProjectiles:40,maxZones:6,maxBeams:2,maxParticles:96,maxLines:64,maxWaves:4,maxFloats:24,
  breather:1.0,stageCue:1.6,bodyRetire:1.25,seed:271828,cuda:R.cuda||{},skill1:R.slot1||{},skill2:R.slot2||{}});
const SURVIVOR_FIELD=Object.freeze({arenaX:26,arenaZ:18,wallX:26.65,wallZ:18.65,floorX:54,floorZ:38});
const STEER_KEYS=new Set(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowLeft","ArrowDown","ArrowRight"]);
const PROPS=[
  ["planter_nw","planter",-8.05,-4.55],["planter_ne","planter",2.9,-4.65],
  ["planter_sw","planter",-8.30,4.60],["planter_se","planter",8.25,4.6],
  ["table_nw","table",-3.65,-4.65],["table_se","table",5.8,4.65],
  ["box_nw_gray","gray_box",-3.98,-4.65],["box_nw_yellow","yellow_box",-3.17,-4.65],
  ["box_se_gray","gray_box",5.47,4.65],["box_se_yellow","yellow_box",6.28,4.65],
  ["server_ne","server",8.15,-4.62],["server_sw","server",-6.95,4.62],
  ["loose_magazine","magazine",1.52,-2.48]
].map(([id,kind,x,z])=>[id,kind,x*C.arenaScale,z*C.arenaScale]);
const FINALE_WARNING={heal:"healing allies · interrupt",sniper:"lining up a shot · sidestep",volley:"three-shot fan",guardCharge:"charging · step aside",heat:"targeting the floor",shieldBash:"shield bash",shoot:"taking aim",disc:"returning disc · change lanes"};
const hpFormat=new Intl.NumberFormat("en-US",{maximumFractionDigits:2});
const SCENARIOS=["all","single","dummy","group",...Object.keys(TYPES)];
const ui={};for(const id of ["view","boot","bootText","progress","pause","resume","hp","hpFill","target","status","hint","skill1","skill2","cool1","cool2","settings","scenario","damage","heroHP","crit","enemyOverride","enemyHP","immortal","mute","reduced","settingsError","debug","floats","bossBars","resetButton","captureButton","stageSelect","waveSelect","styleSelect","heroOverride","freezeButton","stageLabel","gainCue","icon1","icon2","label1","label2","heroCue","health","lowHealth","finaleIntro","finaleStart","finaleResult","finaleRetry","finaleTitle","finaleMute","finaleReduced","comboPips","hurtEdge","cudaLesson"])ui[id]=$(id);
const seatRole=a=>a.fantasyTitle||(a.kind===R.heal.type?"HEALER":({guardCharge:"GUARD",sniper:"SNIPER",shoot:"GUNNER",heat:"ZONE"}[TYPES[a.kind]?.action]||"BOSS"));
let app=null,fatal="";
function immutable(x){const y=JSON.parse(JSON.stringify(x));const f=o=>{if(o&&typeof o==="object"){Object.values(o).forEach(f);Object.freeze(o);}return o;};return f(y);}
function fail(e){const panel=$("journeyPanel");if(panel)panel.hidden=true;fatal=e instanceof Error?e.message:String(e);if(app){app.failed=true;app.ready=false;app.engine.stopRenderLoop();}window.engineCBootFailure(fatal);console.error(e);}
function stageRow(n){if(!Number.isInteger(n))throw new RangeError("Stage must be an integer");const row=DATA?.stages?.find(s=>s.stage===n);if(!row)throw new RangeError("Stage must be 1–8");return row;}
function waveNumber(stage,index){if(!Number.isInteger(index)||index<0||index>=stage.waves.length)throw new RangeError("Unknown wave in this stage");return index;}
function queryOptions(search){const p=new URLSearchParams(search);if(["story","challenge","reflection"].includes(p.get("mode")))return{stage:1,style:"3d",lab:false,journeyMode:p.get("mode")};if(p.get("mode")==="finale")return{stage:8,style:"3d",lab:false,finale:true};const raw=p.get("stage"),style=p.get("style")===null?"3d":p.get("style");if(p.getAll("stage").length>1||p.getAll("style").length>1||raw!==null&&!/^[1-8]$/.test(raw))throw new RangeError("Invalid ?stage; use one integer 1–8");if(!["3d","painted"].includes(style))throw new RangeError("Invalid ?style; use 3d or painted");return{stage:raw===null?DATA.stages[0].stage:Number(raw),style,lab:raw!==null};}
function validateData(){
  if(!DATA||!Array.isArray(DATA.stages)||DATA.stages.length!==8||Object.keys(TYPES).length!==29||!R.basic||!R.heal||!R.projectiles)throw new Error("Missing or incompatible campaign-data.js");
  for(const [i,s]of DATA.stages.entries()){
    if(s.stage!==i+1||![s.hp,s.D,s.cycle,s.reach,s.arc,s.activeCap].every(Number.isFinite)||s.hp<=0||s.D<0||s.cycle<=0||s.reach<=0||s.arc<=0||s.arc>360||!Number.isInteger(s.activeCap)||s.activeCap<1||s.activeCap>12||s.cap!==null&&(!Number.isInteger(s.cap)||s.cap<1)||!Array.isArray(s.waves)||!s.waves.length)throw new Error("Invalid stage data "+s.stage);
    for(const w of s.waves){let total=0;for(const e of w.enemies){if(!TYPES[e.kind]||!Number.isInteger(e.count)||e.count<1)throw new Error("Invalid wave enemy");total+=e.count;}if(total>s.activeCap)throw new Error("Wave exceeds activeCap");}
  }
  for(const [kind,t]of Object.entries(TYPES))if(![t.hp,t.damage,t.speed,t.range,t.windup,t.end,t.duration,t.cycle,t.scale].every(Number.isFinite)||t.hp<=0||t.damage<0||t.speed<0||t.windup<0||t.end<t.windup||t.duration<t.end)throw new Error("Invalid enemy data: "+kind);
}
window.engineC=Object.freeze({config:immutable(C),nativeEnemies:immutable(TYPES),
  snapshot:()=>app?app.snapshot():immutable({ready:false,error:fatal}),
  reset:()=>{if(!app?.ready||app.finale||app.journey)return false;app.reset();return true;},
  scenario:name=>{if(!SCENARIOS.includes(name))throw new RangeError("Unknown scenario");if(!app?.ready||app.finale||app.journey)return false;app.settings.scenario=name;ui.scenario.value=name;app.reset();return true;},
  stage:(n,waveIndex=0)=>{const row=stageRow(n);waveNumber(row,waveIndex);return app?.ready&&!app.finale&&!app.journey?app.selectStage(n,waveIndex):false;},
  style:mode=>{if(!["3d","painted"].includes(mode))throw new RangeError("Unknown style");return app?.ready&&!app.finale&&!app.journey?app.setStyle(mode):false;},
  freeze:value=>{if(typeof value!=="boolean")throw new TypeError("freeze needs a boolean");return app?.ready&&!app.finale&&!app.journey?app.freeze(value):false;},
  captureContact:()=>app?.ready&&!app.finale&&!app.journey?app.captureContact():false,
  attackAt:(x,z,slot=0)=>app?.ready&&!app.finale&&!app.journey?app.testAttack(x,z,slot):false,
  moveTo:(x,z)=>app?.ready&&!app.finale&&!app.journey?app.testMove(x,z):false
});
class Sound {
  constructor() { this.ctx = null; this.noise = null; this.muted = false; this.voices = 0; this.state = "locked"; }
  unlock(event) {
    if (!event.isTrusted) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { this.state = "unavailable"; return; }
      if (!this.ctx) {
        this.ctx = new AC();
        this.noise = this.ctx.createBuffer(1, Math.ceil(this.ctx.sampleRate * 0.18), this.ctx.sampleRate);
        const data = this.noise.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      }
      this.ctx.resume().then(() => { this.state = "ready"; }).catch(() => { this.state = "unavailable"; });
    } catch (_) { this.state = "unavailable"; }
  }
  play(kind) {
    if (!this.ctx || this.ctx.state !== "running" || this.muted || this.voices >= 16) return;
    try {
      const t = this.ctx.currentTime, g = this.ctx.createGain(), filter = this.ctx.createBiquadFilter();
      const hammer = kind === "hammer", heavy = hammer || kind === "heavy";
      const duration = heavy ? 0.17 : kind === "step" ? 0.055 : 0.105;
      filter.type = "lowpass"; filter.frequency.value = kind === "swing" ? 1600 : kind === "step" ? 500 : 2300;
      g.gain.setValueAtTime(heavy ? 0.12 : kind === "hit" ? 0.08 : 0.027, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      filter.connect(g); g.connect(this.ctx.destination);
      const source = this.ctx.createBufferSource(); source.buffer = this.noise; source.connect(filter);
      this.voices++; source.start(t); source.stop(t + duration);
      source.onended = () => { source.disconnect(); filter.disconnect(); g.disconnect(); this.voices--; };
      if (kind === "hit" || heavy) {
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = hammer ? "sine" : "triangle"; osc.frequency.setValueAtTime(hammer ? 240 : heavy ? 105 : 180, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + duration);
        gain.gain.setValueAtTime(0.07, t); gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        osc.connect(gain); gain.connect(this.ctx.destination); osc.start(t); osc.stop(t + duration);
        osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      }
    } catch (_) {}
  }
}

function boxRay(origin, direction, min, max, maxDistance = Infinity) {
  let near = 0, far = maxDistance;
  for (const key of ["x", "y", "z"]) {
    if (Math.abs(direction[key]) < 1e-8) {
      if (origin[key] < min[key] || origin[key] > max[key]) return null;
    } else {
      let a = (min[key] - origin[key]) / direction[key], b = (max[key] - origin[key]) / direction[key];
      if (a > b) [a, b] = [b, a];
      near = Math.max(near, a); far = Math.min(far, b);
      if (near > far) return null;
    }
  }
  return near;
}
function segmentDistance(p1, q1, p2, q2) {
  const d1 = q1.subtract(p1), d2 = q2.subtract(p2), r = p1.subtract(p2);
  const a = B.Vector3.Dot(d1, d1), e = B.Vector3.Dot(d2, d2), f = B.Vector3.Dot(d2, r);
  let s = 0, t = 0;
  if (a <= 1e-10 && e <= 1e-10) return { distance: r.lengthSquared(), s: 0, t: 0 };
  if (a <= 1e-10) t = clamp(f / e, 0, 1);
  else {
    const c = B.Vector3.Dot(d1, r);
    if (e <= 1e-10) s = clamp(-c / a, 0, 1);
    else {
      const b = B.Vector3.Dot(d1, d2), denom = a * e - b * b;
      if (Math.abs(denom) > 1e-10) s = clamp((b * f - c * e) / denom, 0, 1);
      t = (b * s + f) / e;
      if (t < 0) { t = 0; s = clamp(-c / a, 0, 1); }
      else if (t > 1) { t = 1; s = clamp((b - c) / a, 0, 1); }
    }
  }
  const u = p1.add(d1.scale(s)), v = p2.add(d2.scale(t));
  return { distance: B.Vector3.DistanceSquared(u, v), s, t };
}

class Training {
  constructor(engine,scene,plugin,options={stage:DATA.stages[0].stage,style:"3d",lab:false}){
    this.engine=engine;this.scene=scene;this.plugin=plugin;this.physics=scene.getPhysicsEngine();
    this.ready=false;this.failed=false;this.paused=false;this.qaFrozen=false;this.ended=false;this.capture=null;
    this.journey=options.chapter||null;this.journeyMode=options.journeyMode||null;this.seatsDown=[];this.finale=!!options.finale;this.finaleState=this.finale||this.journey?"intro":null;
    this.reflection=this.journey==="reflection";
    this.survivor=this.reflection||this.journeyMode==="story"||this.journeyMode==="challenge"&&!!options.survivorEdition;
    this.field=this.reflection?{arenaX:5.25,arenaZ:4.5,wallX:5.9,wallZ:5.13,floorX:17,floorZ:16}:this.survivor?SURVIVOR_FIELD:C;this.steerKeys=new Set();
    this.stageData=this.reflection?{...stageRow(8),hp:DATA.finale.hp,cycle:DATA.finale.cycle,title:"The Reflection",waves:[{name:"The diner window"}]}:this.finale?{...stageRow(8),hp:DATA.finale.hp,cycle:DATA.finale.cycle,theme:DATA.finale.theme}:this.journey?{...stageRow(options.stage),...DATA.journey[this.journey]}:stageRow(options.stage);this.stageIndex=options.stage;this.waveIndex=0;this.startWave=0;this.styleMode=options.style;this.lab=options.lab;
    this.settings={scenario:"all",D:this.stageData.D,hp:this.stageData.hp,crit:R.crit.chance,heroOverride:false,override:false,enemyHP:160000,immortal:!this.finale&&!this.journey,reduced:false};
    this.sound=new Sound();this.actors=[];this.props=[];this.staticProps=[];this.staticBodies=[];this.solids=new Set();this.obstacles=[];this.objects=new Map();
    this.projectiles=[];this.zones=[];this.beams=[];this.particles=[];this.lines=[];this.waves=[];this.floats=[];
    this.damageEvents=[];this.cudaEvents=[];this.lightningEvents=[];this.blockEvents=[];this.healEvents=[];this.impulseEvents=[];this.progressEvents=[];this.pickupEvents=[];
    this.warningRoots=new Map();this.cudaQueue=[];this.healQueue=[];this.pendingRoots=new Set();this.order=null;this.selectedID=null;this.pendingSkill=null;this.aim=V(2,0,0);
    this.run=0;this.sequence=0;this.simTime=0;this.nextCUDA=0;this.nextRegen=0;this.accumulator=0;this.hitstop=0;this.shake=0;this.lastTime=performance.now();
    this.lastHealSniperStart=-Infinity;this.transition=null;this.spawnAt=0;this.stageStarted=0;this.waveStarted=0;this.aiCursor=0;this.tray=false;this.gainUntil=0;this.completedStages=[];this.resetCount=0;
    this.measures={steps:0,droppedSeconds:0,hitstopSeconds:0,fps:0};this.frameCount=0;this.fpsTime=performance.now();
    this.setupScene();this.setupUI();
  }
  material(name,color,emission=null,alpha=1){const m=new B.StandardMaterial(name,this.scene);m.diffuseColor=B.Color3.FromHexString(color);m.specularColor=B.Color3.Black();if(emission)m.emissiveColor=B.Color3.FromHexString(emission);m.alpha=alpha;m.backFaceCulling=false;return m;}
  bodyBox(name,size,pos,visibleMesh=null){
    const m=visibleMesh||B.MeshBuilder.CreateBox(name,{width:size[0],height:size[1],depth:size[2]},this.scene);
    if(!visibleMesh){m.position.copyFrom(pos);m.visibility=0;m.isPickable=false;}
    const aggregate=new B.PhysicsAggregate(m,B.PhysicsShapeType.BOX,{mass:0,friction:.8},this.scene);
    this.staticBodies.push(aggregate);this.solids.add(m);return m;
  }
  setupScene(){
    const s=this.scene;s.clearColor=this.reflection?new B.Color4(.025,.037,.066,1):this.finale?new B.Color4(.041,.067,.085,1):new B.Color4(.54,.59,.47,1);s.ambientColor=new B.Color3(.06,.065,.05);
    const sky=new B.HemisphericLight("soft-sky",V(-.2,1,.2),s);sky.intensity=this.finale?.79:.68;sky.groundColor=new B.Color3(.29,.30,.25);
    const sun=new B.DirectionalLight("warm-key",(this.finale?V(.57,-1,.44):V(.24,-1,.20)).normalize(),s);sun.position=V(-8,15,-6);sun.intensity=1.55;sun.diffuse=new B.Color3(1,.94,.86);sun.shadowMinZ=.1;sun.shadowMaxZ=60;
    if(this.reflection){sky.diffuse=new B.Color3(.60,.76,.85);sky.intensity=.55;sun.diffuse=new B.Color3(1,.79,.57);}
    if(this.finale){
      sky.diffuse=new B.Color3(.82,.91,1);sky.groundColor=new B.Color3(.20,.22,.25);
      const rim=new B.DirectionalLight("cold-steel-rim",V(-.8,-.35,-.55).normalize(),s);
      rim.diffuse=new B.Color3(.52,.75,1);rim.intensity=.48;
    }
    this.shadow=new B.ShadowGenerator(2048,sun);this.shadow.usePercentageCloserFiltering=true;this.shadow.filteringQuality=B.ShadowGenerator.QUALITY_HIGH;this.shadow.bias=.0004;this.shadow.normalBias=.018;this.shadow.setDarkness(this.finale?.45:.33);
    this.camera=new B.FreeCamera("fixed-composition",V(0,13.5,14),s);this.camera.mode=B.Camera.ORTHOGRAPHIC_CAMERA;this.camera.minZ=.1;this.camera.maxZ=70;this.camera.setTarget(V(0,.15,0));s.activeCamera=this.camera;
    this.p=M.createPalette(s,this.finale||this.reflection);this.themeParts=[];this.stageProps=[];this.pickups=[];this.fx={spark:this.material("impact-gold","#ffe3a2","#ffc55b"),cuda:this.material("cuda-teal","#6debe7","#48c4d4"),dust:this.material("dust","#d4c6a1"),danger:this.material("hostile-coral","#ff775f","#e5553d"),tell:this.material("warning-ground","#f56a51","#8b2c20",.42)};
    this.fx.lightning=this.material("lightning-core","#efffff","#d6ffff");
    this.fx.heal=this.material("enemy-healing","#ef9fcf","#b94c9b");
    this.fx.target=this.material("target-gold","#ffdc84","#bf8734");
    const ground=new B.PBRMaterial("moss-stone",s);ground.albedoColor=B.Color3.White();ground.roughness=.98;ground.metallic=0;
    const tex=new B.DynamicTexture(this.finale?"etched-wafer-floor":"painted-tiles",this.finale?{width:1586,height:992}:{width:768,height:768},s,true);
    if(this.finale){
      tex.wrapU=tex.wrapV=B.Texture.CLAMP_ADDRESSMODE;
      tex.anisotropicFilteringLevel=4;
    }else{
      const ctx=tex.getContext();
      let seed=91825;const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
      ctx.fillStyle="#8f987d";ctx.fillRect(0,0,768,768);
      for(let y=0;y<6;y++)for(let x=0;x<6;x++){
        const d=Math.floor(rnd()*9),v=143+d;ctx.fillStyle=`rgb(${v},${v+9},${v-20})`;ctx.fillRect(x*128+1,y*128+1,126,126);
        ctx.strokeStyle="rgba(224,221,184,.14)";ctx.strokeRect(x*128+2,y*128+2,124,124);
        for(let n=0;n<150;n++){ctx.fillStyle=n%2?"rgba(65,84,56,.035)":"rgba(244,236,201,.055)";ctx.fillRect(x*128+rnd()*128,y*128+rnd()*128,1+rnd()*3,1);}
      }
      tex.wrapU=tex.wrapV=B.Texture.WRAP_ADDRESSMODE;tex.uScale=2.6*C.arenaScale;tex.vScale=1.6*C.arenaScale;tex.update(false);
    }
    ground.albedoTexture=tex;
    this.floor=B.MeshBuilder.CreateBox("floor",{width:this.field.floorX,height:.3,depth:this.field.floorZ},s);this.floor.position.y=-.15;this.floor.material=ground;this.floor.receiveShadows=true;
    this.staticBodies.push(new B.PhysicsAggregate(this.floor,B.PhysicsShapeType.BOX,{mass:0,friction:.85},s));
    for(const [x,z,w,d] of [[0,-this.field.wallZ,this.field.floorX,.35],[0,this.field.wallZ,this.field.floorX,.35],[-this.field.wallX,0,.35,this.field.floorZ],[this.field.wallX,0,.35,this.field.floorZ]]){
      if(this.reflection){this.bodyBox("diner-aisle-edge",[w,2,d],V(x,1,z));continue;}
      const wall=M.roundedBox(s,"low-cream-wall",[w,.58,d],.08,this.p.wall);wall.position.set(x,.29,z);this.bodyBox("wall",[w,.58,d],wall.position,wall);this.shadow.addShadowCaster(wall);
      const cap=M.roundedBox(s,"wall-top",[w+.04,.13,d+.07],.045,this.p.wallTop);cap.position.set(x,.58,z);
    }
    if(!this.reflection)for(const z of [-this.field.wallZ,this.field.wallZ])for(const x of [-this.field.wallX,-5.8*C.arenaScale,-2.2*C.arenaScale,2.2*C.arenaScale,5.8*C.arenaScale,this.field.wallX]){
      const post=M.roundedBox(s,"wall-joint-cap",[.48,.78,.49],.075,this.p.wallTop);post.position.set(x,.39,z);this.shadow.addShadowCaster(post);
    }
    if(!this.reflection)for(const [id,kind,x,z] of PROPS.filter(row=>!row[1].endsWith("_box"))){
      const p=M.createProp(s,kind,id,this.p,this.finale);p.root.position.set(x,0,z);if(kind==="magazine")p.root.rotation.y=.4;
      p.meshes.forEach(m=>this.shadow.addShadowCaster(m));this.staticProps.push({...p,id,kind});this.objects.set(id,{id,kind,root:p.root,category:"prop"});
      if(kind!=="magazine"){
        const h=kind==="planter"?.53:p.size[1],solid=this.bodyBox(id+"-solid",[p.size[0],h,p.size[2]],V(x,h/2,z));this.obstacles.push(solid);
      }
    }
    const pool=(count,make)=>Array.from({length:count},(_,i)=>{const mesh=make(i);mesh.isPickable=false;mesh.setEnabled(false);return {mesh,root:null,life:0};});
    this.particles=pool(C.maxParticles,i=>B.MeshBuilder.CreateSphere("effect-"+i,{diameter:1,segments:6},s));
    this.lines=pool(C.maxLines,i=>B.MeshBuilder.CreateCylinder("event-line-"+i,{diameter:1,height:1,tessellation:6},s));
    this.projectiles=pool(C.maxProjectiles,i=>B.MeshBuilder.CreateCapsule("projectile-"+i,{height:.32,radius:.04,tessellation:8,subdivisions:1},s));
    if(this.finale){
      this.fx.boltCore=this.material("bolt-hot-core","#fff1ab","#fff0ba");
      this.fx.heatCore=this.material("heat-hot-core","#ff9c57","#ffae54");
      const trail=this.material("hostile-flight-streak","#ff763f","#f76a31");
      // The open throat, swept tooth and contrasting bevel stay visible as the blade spins.
      const bladePaths=[[],[],[]],segments=23;
      for(let i=0;i<=segments;i++){
        const f=i/segments,t=f*Math.PI*1.62,tip=f**5;
        const outer=.24+.09*Math.sin(f*Math.PI)+.07*tip,inner=.20-.12*Math.sin(f*Math.PI)-.09*tip;
        bladePaths[0].push(V(inner*Math.cos(t),0,inner*Math.sin(t)));
        bladePaths[1].push(V((outer-.038)*Math.cos(t),.045,(outer-.038)*Math.sin(t)));
        bladePaths[2].push(V(outer*Math.cos(t),0,outer*Math.sin(t)));
      }
      const rim=B.MeshBuilder.CreateRibbon("returning-disc-blade",{pathArray:bladePaths},s);
      const bladeColors=[];
      for(let row=0;row<3;row++)for(let i=0;i<=segments;i++)bladeColors.push(...(i>segments-5?[1,.63,.19,1]:row===2?[.98,1,1,1]:i<5?[.24,.26,.30,1]:[.60,.70,.77,1]));
      rim.setVerticesData(B.VertexBuffer.ColorKind,bladeColors);
      rim.material=this.material("disc-cut-metal","#fff4dc","#3a231a");rim.setEnabled(false);rim.isPickable=false;
      for(const [i,p] of this.projectiles.entries()){
        p.discMesh=i?rim.clone("returning-disc-rim-"+i):rim;p.discMesh.parent=p.mesh;p.discMesh.setEnabled(false);
        p.trail=B.MeshBuilder.CreateCylinder("flight-streak-"+i,{height:1,diameterTop:1,diameterBottom:.08,tessellation:6},s);
        p.trail.parent=p.mesh;p.trail.material=trail;p.trail.isPickable=false;
      }
    }
    this.zones=pool(C.maxZones,i=>B.MeshBuilder.CreateTorus("heat-warning-"+i,{diameter:2.2,thickness:.035,tessellation:48},s));
    this.beams=pool(C.maxBeams,i=>B.MeshBuilder.CreateCylinder("beam-"+i,{height:1,diameter:1,tessellation:8},s));
    this.waves=pool(C.maxWaves,i=>B.MeshBuilder.CreateTorus("clearance-wave-"+i,{diameter:1,thickness:.025,tessellation:48},s));
    for(let i=0;i<C.maxFloats;i++){const leader=document.createElement("i"),e=document.createElement("span");leader.className="floatLeader";leader.hidden=true;leader.setAttribute("aria-hidden","true");e.className="damageFloat";e.hidden=true;ui.floats.appendChild(leader);ui.floats.appendChild(e);this.floats.push({element:e,leader,life:0});}
    this.marker=B.MeshBuilder.CreateTorus("destination",{diameter:.32,thickness:.018,tessellation:24},s);this.marker.material=this.fx.cuda;this.marker.isPickable=false;this.marker.setEnabled(false);
    this.selection=B.MeshBuilder.CreateTorus("selected",{diameter:1,thickness:.040,tessellation:32},s);this.selection.material=this.fx.target;this.selection.isPickable=false;this.selection.setEnabled(false);this.resize();
    this.heroRim=B.MeshBuilder.CreateTorus("hero-foot-rim",{diameter:1,thickness:.058,tessellation:48},s);this.heroRim.material=this.material("hero-cue-rim","#243e3c");
    this.heroRing=B.MeshBuilder.CreateTorus("hero-foot-cue",{diameter:1,thickness:.030,tessellation:48},s);this.heroRing.material=this.material("hero-cue-mint","#b4efdb","#6ba99c");
    for(const cue of [this.heroRim,this.heroRing]){cue.isPickable=false;cue.setEnabled(false);}
  }
  resize(){this.engine.setHardwareScalingLevel(1/Math.min(devicePixelRatio||1,1.5));this.engine.resize();const aspect=this.engine.getRenderWidth()/this.engine.getRenderHeight(),v=this.reflection?Math.max(6.3,7.3/aspect):this.survivor?Math.max(4.85,8/aspect):Math.max(5.35*C.arenaScale,9.65*C.arenaScale/aspect);this.camera.orthoTop=v;this.camera.orthoBottom=-v;this.camera.orthoLeft=-v*aspect;this.camera.orthoRight=v*aspect;}
  makeProps(){for(const [id,kind,x,z] of PROPS.filter(row=>row[1].endsWith("_box"))){
    const p=M.createProp(this.scene,kind,id,this.p,this.finale);p.root.position.set(x,.82+p.size[1]/2+.012,z);p.root.computeWorldMatrix(true);
    const aggregate=new B.PhysicsAggregate(p.root,B.PhysicsShapeType.BOX,{mass:2,friction:.72,restitution:.08},this.scene);aggregate.body.setLinearDamping(.35);aggregate.body.setAngularDamping(.65);
    this.props.push({...p,id,kind,mesh:p.root,aggregate,mass:2});this.solids.add(p.root);p.meshes.forEach(m=>this.shadow.addShadowCaster(m));this.objects.set(id,{id,kind,category:"prop",root:p.root,dynamic:true});
  }}
  makeActor(row,dummy=false,elite=false,friendly=false){
    const [id,kind,x,z,scale]=row,rig=M.createActor(this.scene,kind,id,this.p,{stage:this.stageIndex,tray:this.tray,seat:TYPES[kind]?.seat||0,finale:this.finale||this.reflection});
    if(!rig?.sockets?.weapon||typeof rig.pose!=="function"||typeof rig.dispose!=="function"||kind==="hero"&&typeof rig.setForm!=="function")throw new Error("models.js does not implement the frozen R24 actor/setForm/socket interface");
    if(kind==="hero")rig.setForm(this.stageIndex,this.tray);
    const seat=this.finale&&DATA.finale.seats[kind],native=seat?{...TYPES[kind],...seat}:TYPES[kind]?{...TYPES[kind],...(this.journey?this.stageData.enemyTuning?.[kind]:null)}:null,special=elite?(R.elite.byType[kind]||{}):{};
    const spec=native?{...native,windup:native.windup+(special.windupAdd||0),end:native.end+(special.windupAdd||0),duration:native.duration+(special.windupAdd||0)+(special.recoveryAdd||0),cycle:native.cycle+(special.windupAdd||0)+(special.recoveryAdd||0),...special}:null;
    if(this.survivor&&spec){
      spec.speed=spec.boss?(spec.action==="guardCharge"?1.85:1.55):2.15;
      if(spec.seat)spec.hp=Math.round(spec.hp*1.25);
      if(this.cudaLesson&&this.waveIndex===0&&kind==="rusher")spec.hp=180;
    }
    const hp=kind==="hero"?this.settings.hp:friendly?1:dummy?Math.max(500000,this.settings.override?this.settings.enemyHP:0):this.settings.override?this.settings.enemyHP:elite?R.elite.hpInStageD*this.stageData.D:spec.hp;
    const a={id,kind,spec,fantasyTitle:seat?.label,elite,friendly,seat:native?.seat||0,boss:!!native?.boss,dummy,rig,root:rig.root,scale,hp,maxHP:hp,dead:false,retired:false,deathAge:0,yaw:0,velocity:V(),recoil:V(),actualSpeed:0,travel:0,turnVelocity:0,reactAge:99,stun:0,controlUntil:0,protected:false,action:null,cooldowns:[0,0],nextAttack:this.simTime+1.1+this.actors.length*.16,ammo:3,pattern:0,healAttempts:0,nextHeal:this.simTime+R.heal.firstAfter,path:[],pathAge:99,pathGoal:null,blockedAge:0,previousFeet:V(x,.015,z),previousWeapon:V(),stepTravel:0};
    this.syncMetrics(a);a.ctrlHeight=a.m.height;a.ctrlRadius=Math.min(a.m.radius,kind==="ember_beast"?.56*scale:a.m.height/2-.03);
    rig.root.scaling.setAll(scale);rig.root.position.set(x,.025,z);
    a.controller=new B.PhysicsCharacterController(V(x,a.m.height/2+.025,z),{capsuleHeight:a.m.height,capsuleRadius:a.ctrlRadius},this.scene);
    a.controller.keepDistance=.012;a.controller.keepContactTolerance=.04;a.controller.characterStrength=650;a.controller.maxCharacterSpeedForSolver=12;
    rig.meshes.forEach(mesh=>this.shadow.addShadowCaster(mesh));
    a.tell=new B.Mesh(id+"-warning",this.scene);const vd=new B.VertexData(),pos=[0,0,0],idx=[],nor=[];
    for(let i=0;i<=16;i++){const t=-.32+i*.64/16;pos.push(Math.sin(t),0,Math.cos(t));if(i)idx.push(0,i,i+1);}B.VertexData.ComputeNormals(pos,idx,nor);vd.positions=pos;vd.indices=idx;vd.normals=nor;vd.applyToMesh(a.tell);a.tell.material=this.fx.tell;a.tell.isPickable=false;a.tell.setEnabled(false);
    const edge=[V()];for(let i=0;i<=16;i++){const t=-.32+i*.64/16;edge.push(V(Math.sin(t),.006,Math.cos(t)));}edge.push(V());a.tellEdge=B.MeshBuilder.CreateLines(id+"-warning-edge",{points:edge},this.scene);a.tellEdge.parent=a.tell;a.tellEdge.color=B.Color3.FromHexString("#ffcaac");a.tellEdge.alpha=.9;a.tellEdge.isPickable=false;
    if(this.journey==="cuda"&&kind==="rusher"){
      a.cudaCue=B.MeshBuilder.CreateTorus(id+"-cuda-relay",{diameter:1.25,thickness:.065,tessellation:32},this.scene);
      a.cudaCue.material=this.fx.cuda;a.cudaCue.isPickable=false;
    }
    a.sourceCue=B.MeshBuilder.CreateTorus(id+"-danger-source",{diameter:.46,thickness:.055,tessellation:24},this.scene);a.sourceCue.material=this.fx.danger;a.sourceCue.isPickable=false;a.sourceCue.setEnabled(false);
    const aimedShot=(this.finale||this.survivor)&&(native?.action==="shoot"||native?.action==="heal"&&R.heal.fallbackAction==="shoot");
    a.tellBands=native&&(aimedShot||["volley","beam","sniper"].includes(native.action))?(native.action==="volley"?[-R.enemyPatterns.volley.fan*Math.PI/360,0,R.enemyPatterns.volley.fan*Math.PI/360]:[0]).map((offset,i)=>{const mesh=B.MeshBuilder.CreateCylinder(id+"-tell-"+i,{diameter:1,height:1,tessellation:6},this.scene);mesh.material=this.fx.danger;mesh.isPickable=false;mesh.setEnabled(false);return{mesh,offset};}):[];
    if(this.finale&&native?.action==="disc")a.tellBands.push(this.createDiscTell(id));
    a.floorRings=(native?.ground?[native.ground.innerRadius,native.ground.radius].filter(Boolean):[]).map((radius,i)=>{
      const mesh=B.MeshBuilder.CreateTorus(id+"-floor-ring-"+i,{diameter:2*radius,thickness:.075,tessellation:72},this.scene);
      mesh.material=this.fx.danger;mesh.isPickable=false;mesh.setEnabled(false);return mesh;
    });
    if(a.floorRings.length){
      // Tint only the damaging ground. The annulus leaves its entire inner eye clear.
      const outline=radius=>Array.from({length:72},(_,i)=>V(radius*Math.cos(i*Math.PI/36),-.015,radius*Math.sin(i*Math.PI/36)));
      const fill=B.MeshBuilder.CreateRibbon(id+"-floor-danger",{pathArray:[outline(native.ground.innerRadius||0),outline(native.ground.radius)],closePath:true},this.scene);
      fill.parent=a.floorRings[0];fill.material=this.fx.tell;fill.visibility=.48;fill.isPickable=false;
    }
    if(native?.ground?.shape==="annulus"){
      a.emitterCue=B.MeshBuilder.CreateTorus(id+"-emitter-ignition",{diameter:.39,thickness:.065,tessellation:24},this.scene);
      a.emitterCue.parent=rig.sockets.muzzle;a.emitterCue.material=this.fx.boltCore;a.emitterCue.isPickable=false;a.emitterCue.setEnabled(false);
    }
    if(a.boss||dummy||elite||this.journey&&!friendly&&kind!=="hero"){const bar=document.createElement("div");bar.className="bossBar"+(a.seat||elite?" named":"")+(a.seat?" seat":"")+(kind===R.heal.type?" healer":"");bar.innerHTML='<div class="fill"></div><small></small>';bar.lastElementChild.textContent=a.seat?seatRole(a)+" · "+String(a.seat).padStart(2,"0"):elite?"Elite · "+native.label:native?.label||"Training Dummy";bar.title=native?.label||"Training Dummy";if(seat)bar.dataset.seat=String(a.seat);ui.bossBars.appendChild(bar);a.bar=bar;}
    this.pose(a);a.previousWeapon.copyFrom(this.weapon(a));this.actors.push(a);this.objects.set(id,{id,kind,root:a.root,category:"actor",actor:a});return a;
  }
  createDiscTell(id){
    const mesh=new B.TransformNode(id+"-disc-lane",this.scene);
    const stroke=(name,path,width)=>{
      const mark=B.MeshBuilder.CreateTube(id+"-"+name,{path:path.map(([x,z])=>V(x,0,z)),radius:width,tessellation:6,cap:B.Mesh.CAP_ALL},this.scene);
      mark.parent=mesh;mark.material=this.fx.danger;mark.isPickable=false;return mark;
    };
    const crescent=stroke("outbound-notch",[[-.17,-.10],[-.12,.01],[0,.09],[.12,.01],[.16,-.10],[.08,-.05]],.033);
    const notches=[crescent];
    for(let i=1;i<5;i++)notches.push(crescent.clone(id+"-outbound-notch-"+i,mesh));
    const turn=stroke("return-hook",[[.15,-.44],[.15,-.14],[.10,-.05],[0,0],[-.10,-.05],[-.15,-.14],[-.15,-.37],[-.25,-.24]],.044);
    const stop=stroke("obstructed-end",[[-.19,0],[.19,0]],.04);
    mesh.setEnabled(false);return {mesh,notches,turn,stop};
  }
  drawDiscTell(band,from,to,blocked){
    const dx=to.x-from.x,dz=to.z-from.z,length=Math.hypot(dx,dz);
    band.mesh.position.set(from.x,.075,from.z);band.mesh.rotation.y=Math.atan2(dx,dz);
    for(let i=0;i<band.notches.length;i++){
      const distance=1.05+i*.92;
      band.notches[i].position.z=distance;band.notches[i].setEnabled(distance<length-.55);
    }
    band.turn.position.z=band.stop.position.z=length;
    band.turn.setEnabled(!blocked);band.stop.setEnabled(blocked);
  }
  pose(a){a.rig.pose({time:this.simTime,travel:a.travel,speed:a.actualSpeed,yawRate:a.turnVelocity,action:a.action,reactAge:a.reactAge,reactHeavy:!!a.reactHeavy,discOut:this.finale&&a.seat===10&&this.projectiles.some(p=>p.root?.owner===a.id&&p.type==="disc"),dead:a.dead,deathAge:a.deathAge,stage:this.stageIndex,tray:this.tray,shieldPresented:a===this.hero&&this.shieldPresented(a)});if(this.echo&&a===this.echo)window.ReflectionCombat.pose(a.rig,this.duel,this.settings.reduced);}
  weapon(a){return a.rig.sockets.weapon.getAbsolutePosition().clone();}
  rootEvent(a,type,damage,duration,windup,end){
    const hero=a.kind==="hero",profile=hero?this.activeProfile():null,cuda=Object.freeze({...R.cuda,enabled:hero&&this.stageData.cuda&&(!this.cudaLesson||this.cudaLesson.phase==="parallel")&&R.cuda.allowedTypes.includes(type)});
    return {id:this.run+":"+(++this.sequence),owner:a.id,sourceKind:a.kind,type,damageKind:hero?"hero":R.damageKinds[a.kind]||"ordinary_light_melee",acceptedAt:this.simTime,acceptedBaseD:hero?profile.D:damage,cuda,
      age:0,previousAge:0,duration,windup,activeEnd:end,yaw:a.yaw,startYaw:a.yaw,base:damage,crit:hero&&this.random()<this.settings.crit,critMultiplier:R.crit.multiplier,
      directHit:new Set(),cudaHit:new Set(),packetHit:new Map(),shieldDecisions:new Map(),props:new Set(),directRecords:[],selectedAtAccept:this.selectedID,
      released:false,feedback:false,cudaTried:false,cudaReserved:false,cudaResolved:false,directComplete:false,cancelled:false,dashDistance:0,guardPackets:0,lightning:false};
  }
  random(){let t=this.rng+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}
  start(a,type,yaw){
    const hero=a===this.hero,enemy=a.spec||TYPES[a.kind],profile=hero?this.activeProfile():null;let r,rush;
    if(hero&&this.finale&&this.simTime<.45)return null;
    if(hero&&type==="basic"){
      const swing=this.finale?this.combo+1:1,finisher=swing===3;
      const cycle=finisher?DATA.finale.heavyCycle:profile.cycle,windup=finisher?DATA.finale.heavyWindup:R.basic.contactStart;
      r=this.rootEvent(a,type,profile.D*(finisher?DATA.finale.heavyMultiplier:1),cycle,windup,Math.min(cycle,windup+R.basic.contactDuration));
      r.swing=swing;r.finisher=finisher;if(finisher)this.combo=0;
      r.geometry={shape:"fan",reach:profile.reach,arc:profile.arc,cap:profile.cap};a.punchCount=(a.punchCount||0)+1;r.hand=this.stageIndex>=6||this.tray||a.punchCount%2?"l":"r";
    }else if(hero&&type==="skill1"){
      if(!this.slotAvailable(0))return null;r=this.rootEvent(a,type,profile.D*R.slot1.damageMultiplier,R.slot1.duration,R.slot1.contactStart,R.slot1.contactEnd);
      r.geometry={shape:"dash",reach:Math.min(profile.reach,1.9),arc:this.stageData.shield?R.slot1.shield.guardArc:R.slot1.fist.guardArc,cap:R.slot1.cap};r.guardStage=this.stageData.shield?"shield":"fist";
    }else if(hero&&type==="skill2"){
      if(!this.stageData.slot2)return null;const form=this.stageIndex>=R.hammer.fromStage?R.slot2.hammer:R.slot2.gauntlet;
      r=this.rootEvent(a,type,profile.D*R.slot2.damageMultiplier,R.slot2.windup+R.slot2.active+R.slot2.recovery,R.slot2.windup,R.slot2.windup+R.slot2.active);
      r.geometry={shape:"radial",radius:form.radius,cap:R.slot2.cap};r.form=this.stageIndex>=R.hammer.fromStage?"hammer-slam":"gauntlet-pulse";
    }else if(type==="reload")r=this.rootEvent(a,type,0,1.0,1,1);
    else {
      if(!enemy||this.warningRoots.size>=R.waves.highDangerGroups)return null;
      if(enemy.punishMultiplier&&type==="guardCharge"){
        const forward=V(Math.sin(yaw),0,Math.cos(yaw)),from=a.root.position.add(V(0,.50,0));
        const wall=this.solidHit(from,from.add(forward.scale(enemy.range)),null,a.ctrlRadius);
        const length=wall?enemy.range*wall.t:enemy.range;
        if(length<a.ctrlRadius*2){a.nextAttack=this.simTime+.3;return null;}
        // Havok can stop one full native step short of touching the other solid capsule.
        const skin=.03+length*C.step/(enemy.end-enemy.windup);
        rush={shape:"rush-capsule",length,radius:a.ctrlRadius+Math.max(this.hero.ctrlRadius,this.hero.m.hurtRadius)+skin};
      }
      let windup=enemy.windup,end=enemy.end,duration=enemy.duration,damage=enemy.damage;
      if(type==="sniper"){windup=R.sniper.windup;end=windup+.02;duration=end+R.sniper.recovery;damage*=R.sniper.damageMultiplier;}
      if(type==="heal"){windup=R.heal.windup;end=windup+.02;duration=end+1.2;}
      if(a.kind===R.heal.type&&type==="shoot"){damage=R.heal.fallbackDamage;windup=.9;end=.92;duration=1.8;}
      if(type==="mechSweep")damage*=R.enemyPatterns.mechPunch.sweepDamageMultiplier;
      r=this.rootEvent(a,type,damage,duration,windup,end);r.warning=true;r.interruptible=type==="heal"||!a.protected;r.protectedWindup=type!=="heal"&&a.protected;this.warningRoots.set(r.id,r);
      if(type==="heal"){
        a.healAttempts++;a.nextHeal=this.simTime+R.heal.cycle;r.castTargets=this.healTargets(a);
        this.healEvents.push({type:"cast-start",rootId:r.id,owner:a.id,attempt:a.healAttempts,targets:[...r.castTargets],time:this.simTime});this.trimLog(this.healEvents);
      }
    }
    r.yaw=yaw;r.startYaw=a.yaw;r.aim=this.hero.root.position.add(V(0,Math.min(.8,this.hero.m.height*.55),0));r.origin=a.root.position.clone();
    if(type==="sniper"){
      r.lockAt=r.windup-(enemy.lockBeforeRelease??R.sniper.lockBeforeRelease);
      if(this.finale){r.locked=false;r.punishOpen=false;}
    }
    if(type==="heat"&&enemy?.ground){
      r.geometry={...enemy.ground};r.aim.y=0;
      const center=r.geometry.shape==="mortar"?r.aim:r.origin;
      for(const ring of a.floorRings){ring.position.set(center.x,.055,center.z);ring.visibility=.94;ring.material=this.fx.danger;ring.setEnabled(true);}
    }
    if(rush){r.geometry=rush;r.punishOpen=false;r.interruptible=false;a.recoil.setAll(0);this.drawRushTell(a,rush.length,rush.radius);}
    r.sourceColumn=a.column??null;r.curveSign=(a.pattern=(a.pattern||0)+1)%2?1:-1;
    a.action=r;a.velocity.setAll(0);a.path.length=0;if(this.survivor)a.pathAge=99;
    if(hero){this.pendingRoots.add(r);if(type==="basic")a.nextAttack=this.simTime+r.duration;else this.combo=0;if(type==="skill1")a.cooldowns[0]=this.simTime+R.slot1.cooldown;if(type==="skill2")a.cooldowns[1]=this.simTime+R.slot2.cooldown;this.sound.play("swing");}
    else if(type!=="reload")a.nextAttack=this.simTime+(a.kind===R.heal.type&&type==="shoot"?R.heal.fallbackCycle:enemy.cycle);
    a.previousWeapon.copyFrom(this.weapon(a));return r;
  }
  drawRushTell(a,length,radius){
    // These rounded ends show the footprint within which the hero centre can be struck.
    const outline=[];
    for(let end=0;end<2;end++)for(let i=0;i<=12;i++){
      const angle=(end+i/12)*Math.PI;
      outline.push(V(radius*Math.cos(angle),.006,(end?0:length)+radius*Math.sin(angle)));
    }
    const points=[V(0,0,length/2),...outline,outline[0]],data=new B.VertexData();
    data.positions=points.flatMap(p=>p.asArray());data.indices=outline.flatMap((_,i)=>[0,i+1,i+2]);
    data.normals=[];B.VertexData.ComputeNormals(data.positions,data.indices,data.normals);data.applyToMesh(a.tell);
    if(!a.rushOutline){a.tellEdge.dispose();a.tellEdge=B.MeshBuilder.CreateLines(a.id+"-rush-edge",{points:points.slice(1),updatable:true},this.scene);
      a.tellEdge.parent=a.tell;a.tellEdge.color=B.Color3.FromHexString("#ffc995");a.tellEdge.isPickable=false;a.rushOutline=true;
    }else B.MeshBuilder.CreateLines(a.id+"-rush-edge",{points:points.slice(1),instance:a.tellEdge},this.scene);
  }
  cancel(a,reason="input",discard=false){const r=a.action;if(!r)return;r.cancelled=true;r.punishOpen=false;r.cancelReason=reason;
    for(const ring of a.floorRings)ring.setEnabled(false);a.emitterCue?.setEnabled(false);
    if(r.geometry?.shape==="mortar")for(const p of this.projectiles)if(p.root===r)this.retireProjectile(p);
    if(a===this.hero)this.finalizeRoot(r,discard||a.dead);a.action=null;a.tell.setEnabled(false);a.tellBands.forEach(e=>e.mesh.setEnabled(false));a.velocity.setAll(0);this.pose(a);a.previousWeapon.copyFrom(this.weapon(a));this.pruneDanger();
  }
  disposeActor(a){if(a.controller)a.controller.dispose();a.rig.meshes.forEach(m=>this.shadow.removeShadowCaster(m));a.tell.dispose();a.sourceCue.dispose();a.cudaCue?.dispose();a.tellBands.forEach(e=>e.mesh.dispose());a.floorRings.forEach(e=>e.dispose());a.emitterCue?.dispose();a.rig.dispose();if(a.bar)a.bar.remove();this.objects.delete(a.id);}
  reset(){
    this.steerKeys.clear();this.nextReinforcement=0;this.ingressNumber=0;this.mobDefeats=0;this.autoTarget=null;this.dragId=null;
    this.reflectionStage?.dispose();this.reflectionStage=null;this.echo=null;this.lastMove=null;
    this.clearTransient();this.combo=0;this.comboUntil=0;this.lastWarning="";this.qaFrozen=false;this.actors.forEach(a=>this.disposeActor(a));this.actors.length=0;
    for(const p of this.props){this.solids.delete(p.mesh);p.meshes.forEach(m=>this.shadow.removeShadowCaster(m));p.aggregate.dispose();p.dispose();this.objects.delete(p.id);}this.props.length=0;
    for(const list of [this.damageEvents,this.cudaEvents,this.lightningEvents,this.blockEvents,this.healEvents,this.impulseEvents,this.progressEvents,this.pickupEvents])list.length=0;
    this.lastHealSniperStart=-Infinity;this.run++;this.resetCount++;this.rng=C.seed;this.sequence=0;this.simTime=0;this.nextCUDA=0;this.nextRegen=0;this.ended=false;this.completedStages=[];this.aiCursor=0;this.stageStarted=0;this.waveStarted=0;this.gainUntil=0;
    this.measures.steps=0;this.measures.droppedSeconds=0;this.measures.hitstopSeconds=0;
    this.cudaLesson=this.journey==="cuda"?{phase:"serial",serialTarget:null,rootId:null,targets:[],time:null}:null;
    window.JourneySetpiece?.lesson?.(this.cudaLesson);
    this.seatsDown=[];this.tray=false;this.waveIndex=this.startWave;if(!this.reflection){this.makeProps();this.applyTheme();}this.hero=this.makeActor(["hero","hero",0,this.reflection?1.8:3.0,C.heroScale]);
    this.hero.yaw=Math.PI;this.hero.root.rotation.y=this.hero.yaw;this.pose(this.hero);this.hero.previousWeapon.copyFrom(this.weapon(this.hero));
    if(this.reflection)this.spawnReflection();else{this.makeFriendlyStaff();this.makeTray();this.spawnWave();}this.aim.copyFrom(V(0,0,-2));this.paused=document.hidden&&this.finaleState!=="intro";ui.pause.hidden=!this.paused;ui.status.textContent="";ui.gainCue.hidden=true;
    this.marker.setEnabled(false);this.selection.setEnabled(false);this.lastTime=performance.now();this.cameraView();this.syncDebug();this.setStyle(this.styleMode);this.hud();
  }
  spawnReflection(){
    const {Duel,glass,arena}=window.ReflectionCombat;
    this.duel=new Duel(window.JensenJourney.reflectionMove());
    const echo=this.makeActor(["reflection","hero",glass.x,glass.z,C.heroScale]);
    this.echo=echo;echo.kind="reflection";echo.boss=true;echo.hp=echo.maxHP=2;
    this.objects.get(echo.id).kind="reflection";this.floor.visibility=0;
    this.reflectionStage=window.ReflectionStage.create(this.scene,{window:glass,arena,echo:echo.rig});
    this.reflectionStage.update(this.duel.view());this.pose(echo);
  }
  stepReflection(dt){
    if(this.hero.dead)return;
    const duel=this.duel,echo=this.echo,spot=this.hero.root.position;
    duel.update(dt,spot,event=>{
      if(event.kind==="complete"){this.endJourney(true);return;}
      const point=V(event.at.x,.05,event.at.z);
      const r=this.rootEvent(echo,"echo-"+event.kind,event.damage,.1,0,.1);
      r.damageKind="ground_heat";
      this.progressEvents.push({type:"reflection-release",cycle:event.cycle,attack:event.kind,target:[point.x,point.z],hit:event.hit,time:this.simTime});
      this.trimLog(this.progressEvents);this.sound.play(event.kind==="lightning"?"hit":"hammer");
      if(event.hit)this.damage(r,this.hero,spot.add(V(0,.5,0)),point,"ground",event.kind);
    });
    const x=duel.boss.x,z=duel.boss.z,old=echo.root.position;
    const speed=Math.hypot(x-old.x,z-old.z)/dt;
    echo.travel+=speed*dt;echo.actualSpeed=speed;echo.root.position.set(x,.025,z);
    echo.controller.setPosition(V(x,echo.m.height/2+.025,z));echo.controller.setVelocity(V());
    const aim=["tell","strike","aftershock"].includes(duel.phase)?duel.target:spot;
    if(Math.hypot(aim.x-x,aim.z-z)>.2)this.face(echo,Math.atan2(aim.x-x,aim.z-z),dt);
    echo.root.rotation.y=echo.yaw;this.pose(echo);
  }
  setupUI(){
    window.addEventListener("resize",()=>this.resize());window.addEventListener("blur",()=>this.pauseGame());document.addEventListener("visibilitychange",()=>{if(document.hidden)this.pauseGame();});
    document.addEventListener("pointerdown",e=>this.sound.unlock(e),{passive:true});ui.view.addEventListener("contextmenu",e=>e.preventDefault());
    if(this.finale){
      this.settings.reduced=!!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      ui.finaleReduced.checked=this.settings.reduced;ui.finaleMute.checked=this.sound.muted;
      ui.finaleReduced.addEventListener("change",()=>{this.settings.reduced=ui.finaleReduced.checked;if(this.settings.reduced)this.clearHurt();});
      ui.finaleMute.addEventListener("change",()=>{this.sound.muted=ui.finaleMute.checked;});
      for(const button of [ui.finaleStart,ui.finaleRetry])button.addEventListener("click",event=>{
        if(event.detail===0)this.sound.unlock(event);
        this.beginFinale(button===ui.finaleRetry);
      });
    }else if(!this.journey)this.setupLabUI();
    ui.view.addEventListener("pointermove",e=>{if(this.journey&&e.pointerType==="touch"&&!e.isPrimary)return;if(this.ready&&!this.paused&&!this.qaFrozen&&!this.ended&&this.finaleState!=="intro"){
      this.aim.copyFrom(this.groundAt(e));if(this.survivor&&this.dragId===e.pointerId)this.steerPointer(this.aim);
    }});
    const release=e=>{if(e.pointerId===this.dragId)this.dragId=null;};
    ui.view.addEventListener("pointerup",release);ui.view.addEventListener("pointercancel",release);ui.view.addEventListener("lostpointercapture",release);
    ui.view.addEventListener("pointerdown",e=>{
      if(e.button!==0||e.pointerType==="touch"&&(!this.journey||!e.isPrimary)||!this.ready||this.finaleState==="intro"||this.finale&&this.ended)return;e.preventDefault();ui.view.focus();if(this.paused){this.resumeGame();return;}if(this.qaFrozen||this.hero.dead||this.ended)return;
      const ray=this.pointerRay(e);let chosen=null,best=Infinity;
      for(const a of this.actors){if(!this.isHostile(a))continue;const p=a.root.position,r=Math.max(a.m.hurtRadius,.36),hit=boxRay(ray.origin,ray.direction,p.add(V(-r,.03,-r)),p.add(V(r,a.m.height,r)));if(hit!==null&&hit<best){chosen=a;best=hit;}}
      this.pendingSkill=null;
      if(chosen){const changed=chosen.id!==this.selectedID;this.selectedID=chosen.id;this.order={type:"attack"};this.aim.copyFrom(chosen.root.position);if(this.hero.action?.type==="basic"&&(!this.finale&&!this.survivor||changed)&&!this.hero.action.finisher)this.cancel(this.hero,"target-change");}
      else {this.selectedID=null;this.order={type:"move",point:this.groundAt(e)};this.aim.copyFrom(this.order.point);if(this.survivor&&e.pointerId!==undefined){this.dragId=e.pointerId;this.steerPointer(this.aim);ui.view.setPointerCapture?.(e.pointerId);}if(!this.survivor&&this.hero.action?.type==="basic"&&!this.hero.action.finisher)this.cancel(this.hero,"ground-click");}
      this.hero.path.length=0;this.hero.pathAge=99;this.hero.blockedAge=0;
    });
    window.addEventListener("keyup",e=>this.steerKeys.delete(e.code));
    window.addEventListener("keydown",e=>{
      if(this.survivor&&(e.ctrlKey||e.metaKey||e.altKey))return;
      if(this.survivor&&this.finaleState==="playing"&&!this.paused&&STEER_KEYS.has(e.code)&&!/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName||"")){
        e.preventDefault();this.steerKeys.add(e.code);this.dragId=null;this.order=null;return;
      }
      if(this.finaleState==="intro"||this.finale&&this.ended||e.repeat||/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName||""))return;
      if(e.code==="Digit1"||e.code==="Digit2"){e.preventDefault();this.requestSkill(e.code==="Digit1"?0:1);}
      if(e.code==="Enter"&&this.paused){e.preventDefault();this.resumeGame();}
      if(e.code==="Escape"){e.preventDefault();this.pauseGame();}
    });
    for(const [button,i]of [[ui.skill1,0],[ui.skill2,1]])button.addEventListener("click",()=>this.requestSkill(i));
    ui.resume.addEventListener("click",()=>this.resumeGame());
  }
  setupLabUI(){
    const option=(value,text)=>{const o=document.createElement("option");o.value=value;o.textContent=text;return o;};
    ui.scenario.replaceChildren(...[["all","Stage Waves"],["single","Single Wave Target"],["dummy","Stationary Wave Dummy"],["group","Stage Enemy Collection"],...Object.entries(TYPES).map(([k,t])=>[k,`G${t.stage} · ${t.seat?String(t.seat).padStart(2,"0")+" ":""}${t.label}`])].map(([v,t])=>option(v,t)));
    ui.stageSelect.replaceChildren(...DATA.stages.map(s=>option(String(s.stage),`G${s.stage} · ${s.title}`)));
    ui.stageSelect.addEventListener("change",()=>{const n=Number(ui.stageSelect.value);let row;try{row=stageRow(n);}catch(e){ui.settingsError.textContent=e.message;return;}
      ui.waveSelect.replaceChildren(...row.waves.map((w,i)=>option(String(i),`${i+1} · ${w.name}`)));ui.waveSelect.value="0";ui.heroOverride.checked=false;ui.enemyOverride.checked=false;ui.heroHP.value=String(row.hp);ui.damage.value=String(row.D);ui.crit.value=String(R.crit.chance*100);});
    ui.styleSelect.addEventListener("change",()=>{try{this.setStyle(ui.styleSelect.value);}catch(e){ui.styleSelect.value=this.styleMode;ui.settingsError.textContent=e.message;}});
    ui.freezeButton.addEventListener("click",()=>this.freeze(!this.qaFrozen));
    ui.resetButton.addEventListener("click",()=>this.reset());ui.captureButton.addEventListener("click",()=>this.captureContact());
    ui.settings.addEventListener("submit",e=>{e.preventDefault();try{this.applySettings();ui.settingsError.textContent="";}catch(error){ui.settingsError.textContent="Not applied: "+error.message;}});
    ui.mute.addEventListener("change",()=>{this.sound.muted=ui.mute.checked;});ui.reduced.addEventListener("change",()=>{this.settings.reduced=ui.reduced.checked;});
  }
  beginFinale(retry=false){
    if(this.journey||!this.ready||document.hidden||(retry?!["won","lost"].includes(this.finaleState):this.finaleState!=="intro"))return false;
    this.finaleState="playing";
    if(retry)this.reset();
    ui.finaleResult.hidden=true;ui.finaleIntro.hidden=true;ui.pause.hidden=true;
    this.paused=false;this.lastTime=performance.now();this.accumulator=0;ui.view.focus();return true;
  }
  endFinale(won){
    if(this.journey){this.endJourney(won);return;}
    if(this.finaleState!=="playing")return;
    this.clearHurt();this.finaleState=won?"won":"lost";this.ended=true;this.order=null;this.selectedID=null;this.pendingSkill=null;
    this.progressEvents.push({type:won?"finale-victory":"finale-defeat",stage:8,time:this.simTime});
    ui.status.textContent="";ui.finaleTitle.textContent=won?"All ten seats defeated":"Jensen falls";
    ui.finaleResult.hidden=false;ui.finaleRetry.focus();
  }
  beginJourney(event){
    if(!this.ready||this.finaleState!=="intro"||document.hidden)return false;
    if(event)this.sound.unlock(event);
    this.finaleState="playing";this.paused=false;this.accumulator=0;this.lastTime=performance.now();
    ui.finaleIntro.hidden=true;ui.finaleResult.hidden=true;ui.pause.hidden=true;ui.view.focus();return true;
  }
  retryJourney(event){
    if(!this.journey||this.finaleState!=="lost"&&!(["challenge","reflection"].includes(this.journeyMode)&&this.finaleState==="won"))return false;
    this.reset();this.finaleState="intro";this.paused=true;return this.beginJourney(event);
  }
  endJourney(won){
    if(this.finaleState!=="playing"||this.ended)return;
    this.finaleState=won?"won":"lost";this.ended=true;this.clearTransient();
    for(const a of this.actors){this.cancel(a,"journey-end",true);a.velocity.setAll(0);a.recoil.setAll(0);a.path.length=0;a.controller?.setVelocity(V());}
    ui.finaleIntro.hidden=true;ui.finaleResult.hidden=true;ui.pause.hidden=true;ui.status.textContent="";
    this.progressEvents.push({type:won?"journey-victory":"journey-defeat",chapter:this.journey,time:this.simTime});
    if(won&&!this.reflection)window.JourneySetpiece?.cleared(this.journey);
    Promise.resolve(window.JensenJourney.finish({won,hp:Math.max(0,this.hero.hp),seatsDown:[...this.seatsDown],...(this.journey==="seats"&&this.journeyMode==="story"?{lastMove:this.lastMove}:{}),...(this.reflection?{reflection:{counters:this.duel.counters}}:{})})).catch(fail);
  }
  pointerRay(e){const r=ui.view.getBoundingClientRect();return this.scene.createPickingRay(e.clientX-r.left,e.clientY-r.top,B.Matrix.Identity(),this.camera);}
  groundAt(e){const ray=this.pointerRay(e),pick=this.scene.pickWithRay(ray,m=>m===this.floor,false);const p=pick?.hit?pick.pickedPoint.clone():Math.abs(ray.direction.y)>1e-6?ray.origin.add(ray.direction.scale(-ray.origin.y/ray.direction.y)):this.aim.clone();return V(clamp(p.x,-this.field.arenaX,this.field.arenaX),0,clamp(p.z,-this.field.arenaZ,this.field.arenaZ));}
  requestSkill(slot){if(this.reflection&&["preview","enter","return","complete"].includes(this.duel.phase))return false;if(this.finale&&this.simTime<.45||!Number.isInteger(slot)||!this.slotAvailable(slot)||!this.ready||this.finaleState==="intro"||this.paused||this.qaFrozen||this.ended||this.hero.dead||this.pendingSkill!==null)return false;const a=this.hero;if(a.stun>0||a.cooldowns[slot]>this.simTime||a.action&&(a.action.type!=="basic"||a.action.finisher))return false;this.pendingSkill=slot;return true;}
  testAttack(x,z,slot){if(this.journey||this.finaleState==="intro"||![x,z].every(Number.isFinite)||![0,1,2].includes(slot)||this.paused||this.qaFrozen||this.hero.dead||this.ended)return false;this.aim.set(clamp(x,-this.field.arenaX,this.field.arenaX),0,clamp(z,-this.field.arenaZ,this.field.arenaZ));if(slot)return this.requestSkill(slot-1);if(this.hero.action||this.simTime<this.hero.nextAttack||this.hero.stun>0)return false;this.order=null;const d=this.aim.subtract(this.hero.root.position);this.start(this.hero,"basic",Math.atan2(d.x,d.z));return true;}
  testMove(x,z){if(this.journey||this.finaleState==="intro"||![x,z].every(Number.isFinite)||this.paused||this.qaFrozen||this.hero.dead||this.ended)return false;this.selectedID=null;this.pendingSkill=null;this.order={type:"move",point:V(clamp(x,-this.field.arenaX,this.field.arenaX),0,clamp(z,-this.field.arenaZ,this.field.arenaZ))};if(this.hero.action?.type==="basic"&&!this.hero.action.finisher)this.cancel(this.hero,"move-api");this.hero.pathAge=99;return true;}
  pauseGame(){if(this.journey&&this.finaleState!=="playing"||!this.ready||this.paused||this.finale&&this.finaleState!=="playing")return;if(this.finale)this.clearHurt();this.steerKeys.clear();this.dragId=null;this.paused=true;this.accumulator=0;this.hitstop=0;this.pendingSkill=null;this.order=null;
    // Pausing a Survivor encounter freezes committed attacks and their warning clocks.
    if(this.survivor){ui.pause.hidden=false;return;}
    for(const a of this.actors){if(!a.dead)this.cancel(a,"pause",true);a.velocity.setAll(0);a.recoil.setAll(0);a.path.length=0;if(a.controller)a.controller.setVelocity(V());}
    for(const r of this.pendingRoots){r.cudaResolved=true;r.discarded=true;}this.pendingRoots.clear();this.cudaQueue.length=0;this.healQueue.length=0;this.pruneDanger();ui.pause.hidden=false;
  }
  resumeGame(){if(this.journey&&this.finaleState!=="playing"||document.hidden||!this.ready||this.finale&&this.finaleState!=="playing")return;this.paused=false;this.pendingSkill=null;this.order=null;this.accumulator=0;this.lastTime=performance.now();ui.pause.hidden=true;ui.status.textContent=this.qaFrozen?"QA frozen · unfreeze in Debug":"";for(const a of this.actors)a.previousWeapon.copyFrom(this.weapon(a));}
  captureContact(){if(!this.ready||this.paused||this.qaFrozen||this.hero.dead)return false;this.capture={wait:true,frozen:false,since:this.simTime};ui.status.textContent="Waiting for a real direct hit · live positions and enemies";return true;}
  obstacleBoxes(a){return [...this.obstacles,...this.props.map(p=>p.mesh)].map(mesh=>{mesh.computeWorldMatrix(true);const b=mesh.getBoundingInfo().boundingBox,pad=a.ctrlRadius+.07;return {min:V(b.minimumWorld.x-pad,-10,b.minimumWorld.z-pad),max:V(b.maximumWorld.x+pad,10,b.maximumWorld.z+pad)};});}
  pathTo(a,goal){
    const from=V(a.root.position.x,0,a.root.position.z),boxes=this.obstacleBoxes(a),inside=(p,b)=>p.x>b.min.x&&p.x<b.max.x&&p.z>b.min.z&&p.z<b.max.z;
    if(boxes.some(b=>inside(goal,b)))return [];const clear=(p,q)=>!boxes.some(b=>!inside(p,b)&&boxRay(p,q.subtract(p),b.min,b.max,1)!==null);
    if(clear(from,goal))return [goal.clone()];const nodes=[from,goal.clone()];for(const b of boxes)for(const x of[b.min.x-.04,b.max.x+.04])for(const z of[b.min.z-.04,b.max.z+.04]){const n=V(x,0,z);if(Math.abs(x)<this.field.arenaX&&Math.abs(z)<this.field.arenaZ&&!boxes.some(o=>inside(n,o)))nodes.push(n);}
    const dist=nodes.map(()=>Infinity),prev=nodes.map(()=>-1),done=new Set();dist[0]=0;
    for(let k=0;k<nodes.length;k++){let u=-1;for(let i=0;i<nodes.length;i++)if(!done.has(i)&&(u<0||dist[i]<dist[u]))u=i;if(u<0||!Number.isFinite(dist[u])||u===1)break;done.add(u);for(let v=1;v<nodes.length;v++)if(!done.has(v)&&clear(nodes[u],nodes[v])){const d=dist[u]+B.Vector3.Distance(nodes[u],nodes[v]);if(d<dist[v]){dist[v]=d;prev[v]=u;}}}
    if(!Number.isFinite(dist[1]))return [];const out=[];for(let i=1;i>0;i=prev[i]){out.unshift(nodes[i]);if(prev[i]<0)return [];}return out;
  }
  seek(a,goal,speed,dt){a.pathAge+=dt;if(a.pathAge>.45||!a.pathGoal||B.Vector3.DistanceSquared(a.pathGoal,goal)>.3){a.path=this.pathTo(a,goal);a.pathGoal=goal.clone();a.pathAge=0;if(!a.path.length&&a===this.hero){this.order=null;ui.status.textContent="Path blocked. Click another route.";}}
    while(a.path.length&&Math.hypot(a.path[0].x-a.root.position.x,a.path[0].z-a.root.position.z)<.12)a.path.shift();if(!a.path.length)return V();const d=a.path[0].subtract(a.root.position);d.y=0;const n=d.length();return n>.001?d.scale(Math.min(speed,Math.sqrt(2*C.brake*Math.max(0,n-.04)),n/dt)/n):V();}
  face(a,yaw,dt){const old=a.yaw;a.yaw+=angle(a.yaw,yaw)*(1-Math.exp(-C.turn*dt));a.turnVelocity=angle(old,a.yaw)/dt;}
  steerPointer(point){
    this.dragOffset=V(point.x-this.camera.position.x,0,point.z-(this.camera.position.z-14));
    this.order={type:"move",point:point.clone()};
  }
  survivorMove(dt){
    const a=this.hero,keys=this.steerKeys;
    if(keys.size){
      const x=Number(keys.has("KeyD")||keys.has("ArrowRight"))-Number(keys.has("KeyA")||keys.has("ArrowLeft"));
      const z=Number(keys.has("KeyS")||keys.has("ArrowDown"))-Number(keys.has("KeyW")||keys.has("ArrowUp"));
      const pos=a.root.position,v=V(x,0,z).normalize().scale(C.speed);
      if(Math.abs(pos.x)>=this.field.arenaX&&Math.sign(pos.x)===Math.sign(v.x))v.x=0;
      if(Math.abs(pos.z)>=this.field.arenaZ&&Math.sign(pos.z)===Math.sign(v.z))v.z=0;
      return v;
    }
    if(this.order?.type!=="move")return V();
    if(this.dragId!==null&&this.dragOffset){
      this.order.point.set(clamp(this.camera.position.x+this.dragOffset.x,-this.field.arenaX,this.field.arenaX),0,clamp(this.camera.position.z-14+this.dragOffset.z,-this.field.arenaZ,this.field.arenaZ));
      this.aim.copyFrom(this.order.point);
    }
    const p=this.order.point;if(Math.hypot(p.x-a.root.position.x,p.z-a.root.position.z)<.09){this.order=null;return V();}
    return this.seek(a,p,C.speed,dt);
  }
  survivorBasic(dt){
    const a=this.hero,selected=this.actors.find(e=>e.id===this.selectedID&&this.isHostile(e));
    if(!selected){if(this.order?.type==="attack")this.order=null;this.selectedID=null;}
    const origin=a.root.position,manual=selected&&this.order?.type==="attack";
    const distance=t=>Math.hypot(t.root.position.x-origin.x,t.root.position.z-origin.z);
    const clear=t=>!this.blocked(origin.add(V(0,.82,0)),t.root.position.add(V(0,Math.min(.75,t.m.height*.55),0)));
    let target=null;
    if(selected&&distance(selected)<=this.comfort(selected)&&clear(selected))target=selected;
    if(manual&&!target)return this.seek(a,V(selected.root.position.x,0,selected.root.position.z),C.speed,dt);
    if(!target&&this.simTime>=a.nextAttack){
      target=this.actors.filter(e=>this.isHostile(e)&&distance(e)<=this.comfort(e)).sort((x,y)=>distance(x)-distance(y)).find(clear);
    }
    if(target&&this.simTime>=a.nextAttack){
      const p=target.root.position;this.autoTarget=target.id;
      this.start(a,"basic",Math.atan2(p.x-origin.x,p.z-origin.z));
    }
    return this.survivorMove(dt);
  }
  decide(a,dt){
    if(a===this.echo||a.dead||a.retired||a.friendly||a.dummy||a.stun>0||this.hero.dead||a!==this.hero&&(this.transition||this.simTime<this.spawnAt))return V();const r=a.action;
    if(r){
      if(this.survivor&&a===this.hero&&r.type==="basic")return this.survivorMove(dt);
      if(a===this.hero&&r.type==="skill1"&&r.age>=R.slot1.advanceStart&&r.age<R.slot1.advanceEnd&&r.dashDistance<R.slot1.distance){
        let remain=R.slot1.distance-r.dashDistance;const dir=V(Math.sin(r.yaw),0,Math.cos(r.yaw));
        for(const t of this.actors)if(t!==a&&!t.dead&&!t.retired){const d=t.root.position.subtract(a.root.position),along=B.Vector3.Dot(d,dir);if(along>0&&Math.abs(d.x*dir.z-d.z*dir.x)<t.ctrlRadius+a.ctrlRadius)remain=Math.min(remain,Math.max(0,along-t.ctrlRadius-a.ctrlRadius-.06));}
        return dir.scale(Math.min(R.slot1.distance/(R.slot1.advanceEnd-R.slot1.advanceStart),remain/dt));
      }
      if(a===this.hero&&r.type==="skill2"&&this.order?.type==="move")return this.seek(a,this.order.point,C.speed*R.slot2.moveMultiplier,dt);
      if(["guardCharge","beastCharge"].includes(r.type)&&r.age>=r.windup&&r.age<r.activeEnd){const distance=r.geometry?.shape==="rush-capsule"?r.geometry.length:a.spec.range*(a.spec.chargeDistanceMultiplier||1);return V(Math.sin(r.yaw),0,Math.cos(r.yaw)).scale(distance/(r.activeEnd-r.windup));}
      if(r.type==="mechPunch"&&r.age>=r.windup&&r.age<r.activeEnd)return V(Math.sin(r.yaw),0,Math.cos(r.yaw)).scale(1.4);
      if(r.type==="disc"&&r.released){const right=V(Math.cos(r.yaw),0,-Math.sin(r.yaw)).scale(r.curveSign);return right.scale(a.spec.speed);}
      if(r.type==="sniper"&&r.age<r.lockAt){r.aim=this.hero.root.position.add(V(0,Math.min(.8,this.hero.m.height*.55),0));const d=r.aim.subtract(a.root.position);r.yaw=Math.atan2(d.x,d.z);}
      return V();
    }
    if(a===this.hero){
      if(this.pendingSkill!==null){const slot=this.pendingSkill;this.pendingSkill=null;if(!this.slotAvailable(slot)||a.cooldowns[slot]>this.simTime)return V();const d=this.aim.subtract(a.root.position);this.start(a,slot?"skill2":"skill1",d.lengthSquared()>.01?Math.atan2(d.x,d.z):a.yaw);return V();}
      if(this.survivor)return this.survivorBasic(dt);
      if(!this.order)return V();if(this.order.type==="attack"){
        const t=this.actors.find(e=>e.id===this.selectedID&&this.isHostile(e));if(!t){this.order=null;this.selectedID=null;return V();}const d=t.root.position.subtract(a.root.position);d.y=0;const yaw=Math.atan2(d.x,d.z);
        if(d.length()<=this.comfort(t)){this.face(a,yaw,dt);if(Math.abs(angle(a.yaw,yaw))<.18&&this.simTime+1e-9>=a.nextAttack&&!this.blocked(a.root.position.add(V(0,.85,0)),t.root.position.add(V(0,Math.min(.75,t.m.height*.55),0))))this.start(a,"basic",yaw);return V();}
        return this.seek(a,V(t.root.position.x,0,t.root.position.z),C.speed,dt);
      }
      const d=this.order.point.subtract(a.root.position);d.y=0;if(d.length()<.07){this.order=null;a.velocity.setAll(0);return V();}return this.seek(a,this.order.point,C.speed,dt);
    }
    const spec=a.spec,delta=this.hero.root.position.subtract(a.root.position);delta.y=0;const d=delta.length(),yaw=Math.atan2(delta.x,delta.z);
    if(this.survivor){
      const attackRange=Math.min(spec.range,5.35);
      // Require the source to come into view and leave the hero a path around cover.
      if(d<=attackRange&&this.simTime>=(a.nextSightCheck||0)){
        a.coverBlocks=this.blocked(a.root.position.add(V(0,.8,0)),this.hero.root.position.add(V(0,.8,0)));a.nextSightCheck=this.simTime+.22;
      }
      if(d>attackRange||a.coverBlocks)
        return this.seek(a,V(this.hero.root.position.x,0,this.hero.root.position.z),spec.speed,dt);
    }
    if(["gun_column","gunner"].includes(a.kind)&&a.ammo<=0){this.start(a,"reload",yaw);return V();}
    let type=spec.action;
    if(type==="heal"){
      if(a.healAttempts<R.heal.attempts&&this.simTime>=a.nextHeal){if(R.heal.requireInjuredTarget&&!this.healTargets(a).length)return V();type="heal";}
      else if(a.healAttempts>=R.heal.attempts)type=R.heal.fallbackAction;
      else return V();
    }
    if(spec.action==="mechPunch")type=a.pattern%2?"mechSweep":"mechPunch";
    const canReach=type==="heal"||d<=spec.range;
    if(canReach){this.face(a,yaw,dt);if(a.kind==="gun_column"&&!this.columnOpen(a))return V();
      const separated=!(a.kind===R.heal.type||a.kind===R.sniper.type)||this.simTime-(this.lastHealSniperStart??-Infinity)>=R.board.healSniperStartSeparation;
      if(this.simTime+1e-9>=a.nextAttack&&this.warningRoots.size<R.waves.highDangerGroups&&separated&&Math.abs(angle(a.yaw,yaw))<.2&&(type==="heal"||!this.blocked(a.root.position.add(V(0,.8,0)),this.hero.root.position.add(V(0,.8,0))))){const action=this.start(a,type,yaw);if(action&&(a.kind===R.heal.type||a.kind===R.sniper.type))this.lastHealSniperStart=this.simTime;}
      return V();
    }
    return spec.speed>0?this.seek(a,V(this.hero.root.position.x,0,this.hero.root.position.z),spec.speed,dt):V();
  }
  comfort(target){const p=this.activeProfile();return Math.max(this.hero.ctrlRadius+target.ctrlRadius+.06,p.reach*.72+target.m.hurtRadius*.5);}
  move(a,want,dt){
    if(!a.controller||a.dead)return;if(a.action)a.velocity.copyFrom(want);else {const d=want.subtract(a.velocity),n=d.length(),amount=(want.lengthSquared()>a.velocity.lengthSquared()?C.accel:C.brake)*dt;if(n<=amount)a.velocity.copyFrom(want);else a.velocity.addInPlace(d.scale(amount/n));if(a.velocity.lengthSquared()>.01)this.face(a,Math.atan2(a.velocity.x,a.velocity.z),dt);}
    if(a.action)a.yaw=a.action.startYaw+angle(a.action.startYaw,a.action.yaw)*ease(a.action.age/.085);a.root.rotation.y=a.yaw;
    const support=a.controller.checkSupport(dt,V(0,-1,0)),current=a.controller.getVelocity(),supported=support.supportedState===B.CharacterSupportedState.SUPPORTED;
    const velocity=a.velocity.add(a.recoil);velocity.y=supported?Math.min(current.y,0):Math.max(-25,current.y+C.gravity*dt);a.controller.setVelocity(velocity);a.controller.integrate(dt,support,V(0,C.gravity,0));a.recoil.scaleInPlace(Math.exp(-9*dt));
  }
  solidHit(from,to,ignore=null,pad=0){let first=null;const d=to.subtract(from);for(const mesh of this.solids){if(mesh===ignore)continue;mesh.computeWorldMatrix(true);const inv=B.Matrix.Invert(mesh.getWorldMatrix()),p=B.Vector3.TransformCoordinates(from,inv),q=B.Vector3.TransformCoordinates(to,inv),box=mesh.getBoundingInfo().boundingBox,min=box.minimum.subtract(V(pad,pad,pad)),max=box.maximum.add(V(pad,pad,pad)),t=boxRay(p,q.subtract(p),min,max,1);if(t!==null&&t<.999&&(first===null||t<first.t))first={mesh,t,point:from.add(d.scale(t))};}return first;}
  blocked(from,to,ignore=null){return this.solidHit(from,to,ignore)!==null;}
  tick(dt){
    if(this.journey&&(this.finaleState!=="playing"||this.paused||this.ended)||this.finale&&this.finaleState!=="playing")return;
    this.simTime+=dt;if(this.combo&&this.simTime>=this.comboUntil)this.combo=0;this.measures.steps++;this.pruneDanger();
    if(this.pendingSkill!==null&&this.hero.action?.type==="basic")this.cancel(this.hero,"skill-input");
    const active=this.actors.filter(a=>!a.retired),enemies=active.filter(a=>a!==this.hero),rotation=this.aiCursor++%Math.max(1,enemies.length),ordered=[this.hero,...enemies.slice(rotation),...enemies.slice(0,rotation)];
    for(const a of ordered){if(a===this.echo)continue;a.previousFeet.copyFrom(a.root.position);a.previousWeapon.copyFrom(this.weapon(a));if(a.action)a.action.previousAge=a.action.age;a.reactAge+=dt;a.stun=Math.max(0,a.stun-dt);const d=this.decide(a,dt);a.wanted=d.length();this.move(a,d,dt);}
    this.plugin.executeStep(dt,this.physics.getBodies());
    for(const a of active){
      if(a===this.echo)continue;
      if(a.controller){const p=a.controller.getPosition();a.root.position.set(p.x,p.y-a.m.height/2,p.z);}const distance=Math.hypot(a.root.position.x-a.previousFeet.x,a.root.position.z-a.previousFeet.z);a.actualSpeed=distance/dt;a.travel+=distance;
      if(a.action){a.action.age+=dt;if(this.finale&&a.action.type==="sniper")a.action.locked=a.action.age+1e-9>=a.action.lockAt;if(a.action.type==="skill1")a.action.dashDistance+=distance;}
      if(!a.action&&a.wanted>.5&&a.actualSpeed<.1)a.blockedAge+=dt;else a.blockedAge=0;
      if(a===this.hero&&a.blockedAge>.7){this.order=null;a.velocity.setAll(0);a.blockedAge=0;ui.status.textContent="Path blocked. Click another route.";}
      if(a===this.hero&&!a.action){a.stepTravel+=distance;if(a.stepTravel>.72){a.stepTravel%=.72;this.sound.play("step");}}
      if(a.dead)a.deathAge+=dt;this.pose(a);
    }
    if(this.reflection)this.stepReflection(dt);
    // Hero contact and all existing harmful packets precede heal resolution.
    if(!this.hero.dead)this.contacts(this.hero);
    for(const a of active)if(a!==this.hero&&!a.dead&&!a.friendly){this.contacts(a);this.enemyRelease(a);}
    this.updateProjectiles(dt);this.updateZones(dt);this.updateBeams(dt);this.updateWaves(dt);
    for(const r of [...this.pendingRoots])if(r.age+1e-9>=r.activeEnd)this.finalizeRoot(r,this.hero.dead);
    this.resolveHeals();
    for(const a of active){const r=a.action,tell=r&&r.warning&&r.type!=="heal"&&r.age<r.windup&&!a.dead;a.tell.setEnabled(!!tell&&!(this.finale&&(a.tellBands.length||a.floorRings.length))&&!(this.survivor&&r.type==="shoot"&&a.tellBands.length));
      if(r?.geometry?.shape==="rush-capsule")r.punishOpen=r.age>=r.activeEnd&&r.age+1e-9<r.duration&&!r.packetHit.get("melee:contact")?.has(this.hero.id)&&!this.hero.dead;
      if(a.emitterCue){
        const charging=!!tell&&r.age>=r.windup-.36;a.emitterCue.setEnabled(charging);
        if(charging)a.emitterCue.scaling.setAll(.60+.75*clamp(1-(r.windup-r.age)/.36,0,1));
      }
      if(a.floorRings.length&&r?.geometry){
        const flight=r.geometry.shape==="mortar"&&this.projectiles.some(p=>p.root===r);
        const pulse=this.simTime-(r.groundImpactAt??-Infinity)<.16;
        for(const ring of a.floorRings){ring.setEnabled(!!tell||flight||pulse);ring.material=pulse?this.fx.boltCore:this.fx.danger;}
      }
      if(a.tell.isEnabled()){a.tell.position.copyFrom(r.origin);a.tell.position.y=.025;a.tell.rotation.y=r.yaw;const range=r.type==="heal"?R.heal.range:a.spec.range;if(r.geometry?.shape==="rush-capsule")a.tell.scaling.setAll(1);else a.tell.scaling.set(range,1,range);a.tell.material=r.type==="heal"?this.fx.heal:this.fx.tell;}
      for(const band of a.tellBands){
        band.mesh.setEnabled(!!tell);if(!tell)continue;
        if((this.finale||this.survivor)&&["shoot","sniper","disc"].includes(r.type)){
          const from=(a.rig.sockets.muzzle||a.rig.sockets.weapon).getAbsolutePosition();
          const shot=a.spec.projectile||R.projectiles[a.kind]||R.projectiles.seat_02;
          const end=from.add(this.shotDirection(from,r.aim,0,r.type==="disc"?shot.outboundDistance:0).scale(shot.outboundDistance||shot.speed*shot.life));
          const wall=this.solidHit(from,end,null,shot.radius);
          if(r.type==="disc"){this.drawDiscTell(band,from,wall?.point||end,!!wall);continue;}
          band.mesh.material=r.locked?this.fx.boltCore:this.fx.danger;
          this.align(band.mesh,from,wall?.point||end,shot.radius*(r.locked?1.8:1));
        }else{
          const from=r.origin.add(V(0,.04,0)),to=from.add(V(Math.sin(r.yaw+band.offset),0,Math.cos(r.yaw+band.offset)).scale(a.spec.range));
          this.align(band.mesh,from,to,this.finale?.075:.018);
        }
      }
      if(r&&r.age+1e-9>=r.duration){if(r.punishOpen)r.punishOpen=false;if(r.type==="reload")a.ammo=3;if(a!==this.hero&&r.protectedWindup)a.protected=false;if(a===this.hero)this.finalizeRoot(r);a.action=null;}
      if(a.dead&&!a.retired&&a.deathAge>C.bodyRetire){if(a===this.hero){if(this.journey)this.endJourney(false);else if(this.finale)this.endFinale(false);else this.ended=true;}else{a.retired=true;a.root.setEnabled(false);if(a.bar)a.bar.hidden=true;}}
    }
    this.pruneDanger();this.updatePickups();this.updateEffects(dt);
    // Released packets keep their roots, but dead actors/controllers/DOM do not accumulate.
    for(const a of [...this.actors])if(a!==this.hero&&a.retired){this.disposeActor(a);this.actors.splice(this.actors.indexOf(a),1);}
    if(this.capture?.wait&&this.damageEvents.some(e=>e.source===this.hero.id&&e.time>this.capture.since&&e.channel==="direct"&&e.actual>0)){this.capture={wait:false,frozen:true,rootId:this.damageEvents.findLast(e=>e.source===this.hero.id&&e.time>this.capture.since&&e.channel==="direct"&&e.actual>0)?.rootId};this.freeze(true);ui.status.textContent="Real contact frame · QA frozen";}
    if(this.journey&&this.hero.dead)this.endJourney(false);
    this.refillWave();this.checkProgress();this.cameraView();
  }
  contacts(a){
    const r=a.action;if(!r||a.friendly||a.dead)return;
    if(a===this.hero&&r.type==="skill2"&&!r.released&&r.age+1e-9>=r.windup){
      r.released=true;const w=this.waves.find(e=>!e.root);if(w){w.root=r;w.life=r.activeEnd-r.windup;w.age=0;w.radius=0;w.maxRadius=r.geometry.radius;w.position=a.root.position.add(V(0,.6,0));w.mesh.material=this.fx.cuda;w.mesh.setEnabled(true);}
    }
    if(r.age<r.windup||r.previousAge>=r.activeEnd||a===this.hero&&r.type==="skill2")return;
    if(!["basic","skill1","guardCharge","beastCharge","shieldBash","mechPunch","mechSweep"].includes(r.type))return;
    const end=this.weapon(a),span=r.age-r.previousAge||1,f0=clamp((r.windup-r.previousAge)/span,0,1),f1=clamp((r.activeEnd-r.previousAge)/span,0,1),p0=B.Vector3.Lerp(a.previousWeapon,end,f0),p1=B.Vector3.Lerp(a.previousWeapon,end,f1);
    if(a===this.hero){
      this.line(p0,p1,r.finisher ? .12 : .025,this.fx.cuda,r.finisher ? .20 : .08,r,"weapon-trail");const g=r.geometry,origin=a.root.position.clone();
      const candidates=this.actors.filter(t=>this.isHostile(t)&&!r.directHit.has(t.id)).map(t=>({t,point:this.fanIntersection(origin,r.yaw,g.reach,g.arc,t)})).filter(o=>o.point).sort((a,b)=>(this.survivor?Number(b.t.id===r.selectedAtAccept)-Number(a.t.id===r.selectedAtAccept):0)||B.Vector3.DistanceSquared(a.t.root.position,origin)-B.Vector3.DistanceSquared(b.t.root.position,origin)||(a.t.id<b.t.id?-1:1));
      for(const {t,point}of candidates){if(g.cap!==null&&r.directHit.size>=g.cap)break;
        const handOrigin=origin.add(V(0,Math.min(.8,a.m.height*.5),0));if(this.blocked(handOrigin,point)||this.blocked(p0,p1))continue;
        // The accepted fan is a form-specific melee volume, sampled only during
        // the real joint action's contact window. Weapon traces also drive prop hits.
        this.damage(r,t,point,origin,"direct");
      }
      this.strikeProps(r,p0,p1,origin,a.m.weaponRadius);return;
    }
    const t=this.hero;if(t.dead)return;const origin=a.root.position;
    if(r.type==="mechSweep"||r.type==="shieldBash"){
      const point=this.fanIntersection(origin,r.yaw,a.spec.range,r.type==="mechSweep"?R.enemyPatterns.mechPunch.sweepArc:100,t);if(point&&!this.blocked(origin.add(V(0,.7,0)),point))this.damage(r,t,point,origin,"melee","contact");return;
    }
    const body=["guardCharge","beastCharge"].includes(r.type),from=body?a.previousFeet.add(V(0,.55,0)):p0,to=body?a.root.position.add(V(0,.55,0)):p1;
    if(r.geometry?.shape==="rush-capsule"){
      const start=V(r.origin.x,0,r.origin.z),end=start.add(V(Math.sin(r.yaw),0,Math.cos(r.yaw)).scale(r.geometry.length));
      const before=V(t.previousFeet.x,0,t.previousFeet.z),after=V(t.root.position.x,0,t.root.position.z);
      if(segmentDistance(start,end,before,after).distance>r.geometry.radius**2)return;
    }
    const test=segmentDistance(from.subtract(t.previousFeet),to.subtract(t.root.position),V(0,t.m.hurtLow,0),V(0,t.m.hurtHigh,0));
    // Character controllers keep a small skin gap; contact must not require
    // two solid capsules to interpenetrate. This 3cm allowance is body-only.
    const radius=r.geometry?.shape==="rush-capsule"?r.geometry.radius-t.m.hurtRadius:body?a.ctrlRadius+Math.max(0,t.ctrlRadius-t.m.hurtRadius)+.03:a.m.weaponRadius;
    if(test.distance>(t.m.hurtRadius+radius)**2)return;const point=B.Vector3.Lerp(from,to,test.s);if(!this.blocked(origin.add(V(0,.7,0)),point)&&!this.blocked(from,point))this.damage(r,t,point,origin,"melee","contact");
  }
  strikeProps(r,p0,p1,origin,radius){for(const p of this.props){if(r.props.has(p.id))continue;p.mesh.computeWorldMatrix(true);const inv=B.Matrix.Invert(p.mesh.getWorldMatrix()),from=B.Vector3.TransformCoordinates(p0,inv),to=B.Vector3.TransformCoordinates(p1,inv),h=p.size.map(x=>x/2+radius),t=boxRay(from,to.subtract(from),V(-h[0],-h[1],-h[2]),V(...h),1);if(t!==null){const at=B.Vector3.Lerp(p0,p1,t);if(!this.blocked(origin.add(V(0,.9,0)),at,p.mesh))this.pushProp(r,p,at,origin);}}}
  pushProp(r,p,at,origin){if(r.props.has(p.id))return;r.props.add(p.id);const d=p.mesh.position.subtract(origin);d.y=0;if(d.lengthSquared()<1e-8)d.z=1;const power=r.type==="skill2"?3.6:r.type==="skill1"?2.7:1.7;d.normalize().scaleInPlace(power);d.y=power*.14;p.aggregate.body.applyImpulse(d,at);this.impulseEvents.push({rootId:r.id,prop:p.id,mass:2,impulse:d.asArray(),time:this.simTime});if(this.impulseEvents.length>64)this.impulseEvents.shift();this.emit(at,d.normalize(),5,r);this.feedback(r,true);}
  damage(r,t,point,origin,channel,packetId="contact"){
    if(t===this.echo&&(!this.duel.open||channel!=="direct"||r.owner!==this.hero.id||r.base<=0))return false;
    if(t.friendly||t.dead||t.retired)return false;const cuda=channel==="cuda",heroRoot=r.owner===this.hero.id;
    let ledger;if(cuda)ledger=r.cudaHit;else if(heroRoot)ledger=r.directHit;else {const key=channel+":"+packetId;if(!r.packetHit.has(key))r.packetHit.set(key,new Set());ledger=r.packetHit.get(key);}
    if(ledger.has(t.id)||cuda&&r.directHit.has(t.id))return false;ledger.add(t.id);
    const crit=heroRoot&&!cuda&&r.crit,base=cuda?r.acceptedBaseD*r.cuda.factor:r.base;let requested=Math.max(0,Math.round(base*(crit?r.critMultiplier:1))),guard=null;
    const punish=heroRoot&&channel==="direct"&&t.action?.punishOpen&&t.action.age<t.action.duration&&(!t.spec.punishRange||Math.hypot(this.hero.root.position.x-t.root.position.x,this.hero.root.position.z-t.root.position.z)<=t.spec.punishRange);
    if(punish)requested=Math.round(requested*t.spec.punishMultiplier);
    const previousHP=t.hp;
    if(t===this.hero){guard=this.mitigateHero(r,t,origin,requested,packetId);requested=guard.requested;}else if(t===this.echo){
      if(!this.duel.counter(r.id,this.simTime))return false;
      requested=1;
      this.progressEvents.push({type:"reflection-counter",cycle:this.duel.cycle,rootId:r.id,time:this.simTime});
      this.trimLog(this.progressEvents);
    }else requested=this.incomingDefense(t,r,origin,requested);
    if(heroRoot&&channel==="direct"&&requested>0&&this.lessonContact(r,t))this.cuda({root:r,seed:t,contact:point,origin,seedKilledByOriginal:false,triggerTime:this.simTime,eligible:true,lesson:true});
    // Broadcast before the serial HP floor so a depleted seed still takes this direct packet.
    if(this.cudaLesson&&this.cudaLesson.phase!=="parallel"&&heroRoot&&!r.lessonBroadcast)requested=Math.min(requested,Math.max(0,t.hp-1));
    const before=t.hp,actual=Math.min(before,requested);t.hp=before-actual;
    if(this.finale&&t===this.hero&&!this.settings.reduced&&t.hp<previousHP)this.hurtStrength=Math.min(.62,this.hurtStrength+2.2*(previousHP-t.hp)/t.maxHP);
    const ev={rootId:r.id,source:r.owner,target:t.id,type:r.type,finisher:!!r.finisher,punish:!!punish,channel,packetId,acceptedBaseD:r.acceptedBaseD,base,requested,actual,hpBefore:before,hpAfter:t.hp,crit,guard:guard?.mode||null,time:this.simTime};this.damageEvents.push(ev);this.trimLog(this.damageEvents);
    if(actual>0){
      t.reactHeavy=this.finale&&heroRoot&&channel==="direct"&&(!!r.finisher||r.type==="skill2");
      this.floatDamage(actual,crit,point,cuda?"cuda":t===this.hero?"incoming":t.reactHeavy?"heavy":"",t);const dir=t.root.position.subtract(origin);dir.y=0;if(dir.lengthSquared()<1e-7)dir.z=1;dir.normalize();this.emit(point,dir,t.reactHeavy?14:cuda?4:r.type.startsWith("skill")?10:5,r);t.reactAge=0;
      if(!cuda){this.applyControl(r,t,dir);this.feedback(r,r.type.startsWith("skill")||heroRoot&&this.stageIndex>=R.hammer.fromStage&&(!this.finale||r.finisher),t.reactHeavy);}
      if(heroRoot&&channel==="direct"){
        if(this.finale&&r.type==="basic"&&!r.finisher&&!r.directRecords.length){this.combo=Math.min(2,this.combo+1);this.comboUntil=this.simTime+DATA.finale.comboGrace;}
        r.directRecords.push({id:t.id,point:point.clone(),origin:origin.clone(),distance:B.Vector3.DistanceSquared(origin,point),killed:t.hp<=0});
        if(r.cuda.enabled&&!r.cudaTried){r.cudaTried=true;r.cudaReserved=this.simTime+1e-9>=this.nextCUDA;r.cudaTriggerAt=this.simTime;if(r.cudaReserved)this.nextCUDA=this.simTime+r.cuda.interval;}
        if(r.type==="basic"&&this.stageIndex>=R.hammer.fromStage){
          const from=this.weapon(this.hero);this.lightning(from,point,.085,.22,r,"hammer-contact");
          if(!r.lightning){
            r.lightning=true;
            const bolt=[point.add(V(-.12,2.2,0)),point.add(V(.24,1.45,.06)),point.add(V(-.23,1.0,-.04)),point.add(V(.12,.48,.02)),point];
            for(let i=1;i<bolt.length;i++){this.line(bolt[i-1],bolt[i],.16,this.fx.cuda,.22,r,"hammer-bolt");this.line(bolt[i-1],bolt[i],.06,this.fx.lightning,.22,r,"hammer-bolt-core");}
            this.lightningEvents.push({rootId:r.id,owner:r.owner,target:t.id,point:point.asArray(),damage:0,cosmetic:true,time:this.simTime});this.trimLog(this.lightningEvents);
          }
        }
      }
    }
    if(t===this.hero&&!cuda&&guard?.prevented>0){const dir=t.root.position.subtract(origin);dir.y=0;if(dir.lengthSquared()<1e-7)dir.z=1;this.applyControl(r,t,dir.normalize());}
    if(guard?.event){guard.event.actualDamage=actual;guard.event.hpBefore=before;guard.event.hpAfter=t.hp;}
    if(t.hp<=0&&t!==this.echo&&!(t===this.hero&&this.settings.immortal))this.die(t);
    return actual>0;
  }
  lessonContact(r,target){
    const lesson=this.cudaLesson;
    if(!lesson||lesson.phase==="parallel"||r.type!=="basic"||r.selectedAtAccept!==target.id||target.kind!=="rusher")return false;
    if(lesson.phase==="serial"){
      lesson.phase="ready";lesson.serialTarget=target.id;lesson.readyAt=this.simTime;
      this.progressEvents.push({type:"cuda-serial-resealed",target:target.id,rootId:r.id,time:this.simTime});
      window.JourneySetpiece?.lesson?.(lesson);return false;
    }
    if(target.id===lesson.serialTarget)return false;
    return this.lessonCohort(target,r);
  }
  lessonCohort(target,root=null){
    const seed=target.root.position.add(V(0,Math.min(.7,target.m.height*.6),0));let links=0;
    for(const actor of this.actors){
      if(!this.isHostile(actor)||actor.hp<=0||actor===target||root?.directHit.has(actor.id))continue;
      const point=actor.root.position.add(V(0,Math.min(.7,actor.m.height*.6),0));
      if(B.Vector3.DistanceSquared(seed,point)<=R.cuda.seedRange**2&&!this.blocked(seed,point)&&++links===2)return true;
    }
    return false;
  }
  lessonHUD(){
    const lesson=this.cudaLesson;
    if(ui.cudaLesson){
      ui.cudaLesson.hidden=!lesson||this.finaleState!=="playing"||this.ended||lesson.phase==="parallel"&&this.simTime-lesson.time>3;
      if(lesson)ui.cudaLesson.textContent=lesson.phase==="serial"?"Click or tap a ringed rival to focus your first hit.":lesson.phase==="ready"?"Now click or tap a DIFFERENT nearby ringed rival.":"CUDA online · One strike reached three rivals.";
    }
    const age=lesson?.phase==="ready"?this.simTime-lesson.readyAt:Infinity,pulsing=age>=0&&age<2.4&&!this.settings.reduced;
    // Sample the short hint at 5 Hz in simulation time, using the actual contact eligibility rules.
    if(pulsing&&this.simTime>=(lesson.cueNextAt??-Infinity)){
      lesson.cueNextAt=this.simTime+.2;
      for(const relay of this.actors)if(relay.cudaCue){
        const seed=relay.root.position.add(V(0,Math.min(.7,relay.m.height*.6),0));
        relay.cudaHintEligible=this.isHostile(relay)&&relay.id!==lesson.serialTarget&&B.Vector3.DistanceSquared(this.hero.root.position,seed)<=R.cuda.seedRange**2&&!this.blocked(this.hero.root.position,seed)&&this.lessonCohort(relay);
      }
    }
    for(const relay of this.actors)if(relay.cudaCue){
      const available=this.isHostile(relay)&&lesson.phase!=="parallel"&&relay.id!==lesson.serialTarget;
      const pulse=available&&pulsing&&relay.cudaHintEligible?Math.sin(age*Math.PI/.6)**2:0;
      relay.cudaCue.setEnabled(available);relay.cudaCue.scaling.setAll(1+.28*pulse);
      relay.cudaCue.position.set(relay.root.position.x,.065,relay.root.position.z);
    }
  }
  cuda(q){
    const r=q.root,c=q.lesson?{...r.cuda,neighbors:2,depth:1,hop:R.cuda.seedRange}:r.cuda;if(r.cudaResolved||this.hero.dead)return;r.cudaResolved=true;
    const event={rootId:r.id,source:r.owner,type:r.type,acceptedBaseD:r.acceptedBaseD,base:r.acceptedBaseD*c.factor,seed:q.seed.id,triggerTime:q.triggerTime,time:this.simTime,seedActual:0,directExcluded:[...r.directHit],edges:[],reason:"no-extra-target"};
    const finish=()=>{
      this.cudaEvents.push(event);this.trimLog(this.cudaEvents,64);
      if(q.lesson&&event.edges.length>=2){
        Object.assign(this.cudaLesson,{phase:"parallel",rootId:r.id,targets:[q.seed.id,...event.edges.map(e=>e.to)],time:this.simTime});
        this.progressEvents.push({type:"cuda-parallel-open",rootId:r.id,targets:[...this.cudaLesson.targets],time:this.simTime});
        this.nextCUDA=this.simTime+R.cuda.interval;window.JourneySetpiece?.lesson?.(this.cudaLesson);
      }
      if(q.lesson)r.lessonBroadcast=false;
    };
    if(!q.eligible){event.reason="interval";finish();return;}
    if(q.seed.dead&&!q.seedKilledByOriginal){event.reason="seed-no-longer-alive";finish();return;}
    const pointOf=a=>a.root.position.add(V(0,Math.min(.7,a.m.height*.6),0)),seedPoint=q.seed.dead?q.contact.clone():pointOf(q.seed);
    if(B.Vector3.DistanceSquared(q.origin,seedPoint)>c.seedRange**2||this.blocked(q.origin,seedPoint)){event.reason="seed-blocked-or-out-of-range";finish();return;}
    if(q.lesson)r.lessonBroadcast=true;
    const queue=[{id:q.seed.id,position:seedPoint,depth:0}],visited=new Set(r.directHit);visited.add(q.seed.id);let hits=0;
    while(queue.length&&hits<c.neighbors){const source=queue.shift();if(source.depth>=c.depth)continue;
      const candidates=this.actors.filter(a=>this.isHostile(a)&&a.hp>0&&!visited.has(a.id)&&!r.cudaHit.has(a.id)).map(a=>({a,point:pointOf(a)})).map(o=>({...o,d:B.Vector3.DistanceSquared(source.position,o.point)})).filter(o=>o.d<=c.hop**2&&B.Vector3.DistanceSquared(seedPoint,o.point)<=c.seedRange**2).sort((a,b)=>a.d-b.d||(a.a.id<b.a.id?-1:1));
      for(const {a,point}of candidates){if(hits>=c.neighbors)break;if(a.dead||r.directHit.has(a.id)||r.cudaHit.has(a.id)||this.blocked(source.position,point)||this.blocked(seedPoint,point))continue;
        visited.add(a.id);const before=a.hp;this.damage(r,a,point,source.position,"cuda");hits++;const depth=source.depth+1,actual=before-a.hp;
        if(actual>0){this.lightning(source.position,point,.075,.22,r,"cuda");event.edges.push({from:source.id,to:a.id,depth,actual});}
        if(!a.dead&&a.hp>0)queue.push({id:a.id,position:point,depth});
      }
    }
    event.reason=event.edges.length?"linked":"no-extra-target";finish();
  }
  die(a){
    if(a.dead)return;if(this.journey&&a.seat){this.seatsDown.push(a.seat);if(this.seatsDown.length===1)window.JensenJourney.firstDown?.(a.seat);}a.dead=true;a.deathAge=0;if(a.action)this.cancel(a,"death",true);a.velocity.setAll(0);a.recoil.setAll(0);a.tell.setEnabled(false);a.tellBands.forEach(e=>e.mesh.setEnabled(false));
    if(this.survivor&&a!==this.hero&&!a.friendly&&!a.boss&&!this.hero.dead&&++this.mobDefeats%5===0){
      const hero=this.hero,before=hero.hp,actual=Math.min(hero.maxHP-before,Math.round(hero.maxHP*.12));hero.hp+=actual;
      this.healEvents.push({type:"rally",owner:hero.id,defeated:a.id,mobs:this.mobDefeats,actual,hpBefore:before,hpAfter:hero.hp,time:this.simTime});this.trimLog(this.healEvents);
      if(actual>0)this.floatDamage("+"+actual,false,hero.root.position.add(V(0,hero.m.height*.8,0)),"heal",hero);
    }
    if(a.controller){a.controller.dispose();a.controller=null;}if(this.selectedID===a.id){this.selectedID=null;this.order=null;}
    if(this.finale&&a.seat){
      for(const pool of [this.projectiles,this.zones,this.beams])for(const effect of pool)if(effect.root?.owner===a.id){effect.root=null;effect.life=0;effect.mesh.setEnabled(false);}
      this.pruneDanger();
    }
    if(a===this.hero){this.pendingSkill=null;this.order=null;for(const r of this.pendingRoots){r.cudaResolved=true;r.discarded=true;}this.pendingRoots.clear();this.cudaQueue.length=0;this.healQueue.length=0;ui.status.textContent=this.finale||this.journey?"":"Defeated · reset this stage in Debug";for(const e of this.actors)if(!e.dead)this.cancel(e,"hero-death",true);}
  }
  shotDirection(muzzle,aim,offset,discRange=0){
    const delta=aim.subtract(muzzle),horizontal=Math.max(.1,Math.hypot(delta.x,delta.z)),yaw=Math.atan2(delta.x,delta.z);
    const slope=delta.y/horizontal;
    // Keep the returning disc above the floor for the whole fixed outbound leg.
    return V(Math.sin(yaw+offset),discRange?Math.max(slope,(.24-muzzle.y)/discRange):slope,Math.cos(yaw+offset)).normalize();
  }
  enemyRelease(a){
    const r=a.action;if(!r||a===this.hero||a.dead||r.cancelled||r.released||r.age+1e-9<r.windup||r.type==="reload")return;
    r.released=true;a.tell.setEnabled(false);for(const band of a.tellBands||[])band.mesh.setEnabled(false);
    if(r.type==="heal"){this.healQueue.push({actor:a,root:r});return;}
    const muzzle=(a.rig.sockets.muzzle||a.rig.sockets.weapon).getAbsolutePosition().clone(),kind=r.sourceKind||a.kind;
    const projectile=a.spec.projectile||R.projectiles[kind]||R.projectiles.seat_02,elite=a.elite?(R.elite.byType[kind]||{}):{};
    const speed=projectile.speed*(elite.projectileSpeedMultiplier||1);
    const aim=r.aim,direction=offset=>this.shotDirection(muzzle,aim,offset,this.finale&&r.type==="disc"?projectile.outboundDistance:0);
    if(r.type==="beam"){
      const beam=this.beams.find(e=>!e.root);if(!beam)return;
      beam.root=r;beam.origin=muzzle;beam.direction=direction(0);beam.length=projectile.length||TYPES[kind].range;beam.radius=projectile.radius;
      beam.life=R.enemyPatterns.beam.life;beam.age=0;beam.mesh.material=this.fx.danger;beam.mesh.setEnabled(true);this.updateBeamPose(beam);
    }else if(["shoot","sniper","needle","volley"].includes(r.type)){
      const count=r.type==="volley"?R.enemyPatterns.volley.count:1,fan=R.enemyPatterns.volley.fan*Math.PI/180;
      for(let i=0;i<count;i++){
        const offset=count===1?0:(i/(count-1)-.5)*fan;
        const launched=this.launch(r,muzzle,direction(offset).scale(speed),0,"bolt",{life:projectile.life,radius:projectile.radius,packetId:"shot:"+i});
        if(this.finale&&r.type==="sniper")r.punishOpen=launched;
      }
      if(a.kind==="gun_column"||a.kind==="gunner")a.ammo=Math.max(0,a.ammo-1);
      this.emit(muzzle,direction(0),3,r);this.sound.play("swing");
    }else if(r.type==="disc"){
      this.launch(r,muzzle,direction(0).scale(projectile.outboundSpeed),0,"disc",{
        life:projectile.life,radius:projectile.radius,packetId:"disc",outboundDistance:projectile.outboundDistance,
        returnSpeed:projectile.returnSpeed,returnPoint:muzzle.clone()});
      this.sound.play("swing");
    }else if(r.type==="arc"){
      const sign=r.curveSign||((a.patternCount||0)%2?1:-1);
      this.launch(r,muzzle,direction(0).scale(speed),0,"arc",{life:projectile.life,radius:projectile.radius,packetId:"arc",
        curveRate:sign*projectile.turnDegreesPerSecond*Math.PI/180,curveSeconds:projectile.curveSeconds});
      this.sound.play("swing");
    }else if(r.geometry?.shape==="annulus"){
      this.groundPulse(r,r.origin);
    }else if(r.type==="heat"){
      const mortar=r.geometry?.shape==="mortar",flight=mortar ? .85 : .65,gravity=mortar ? -23 : -8,goal=V(clamp(aim.x,-this.field.arenaX,this.field.arenaX),.08,clamp(aim.z,-this.field.arenaZ,this.field.arenaZ));
      const velocity=goal.subtract(muzzle).scale(1/flight);velocity.y=(goal.y-muzzle.y-.5*gravity*flight*flight)/flight;
      if(mortar)velocity.y+=(.10-goal.y)/flight-gravity*C.step/2;
      this.launch(r,muzzle,velocity,gravity,"heat",{life:flight+.3,radius:.1,packetId:"heat-flight",
        zoneRadius:R.enemyPatterns.heat.radius*(elite.zoneRadiusMultiplier||1)});
    }
  }
  launch(root,position,velocity,gravity,type,opts={}){
    const p=this.projectiles.find(e=>!e.root);if(!p)return false;
    p.root=root;p.type=type;p.position=position.clone();p.previous=position.clone();p.velocity=velocity.clone();p.gravity=gravity;
    p.life=opts.life??2.6;p.radius=opts.radius??.07;p.packetId=opts.packetId||"projectile";p.age=0;p.travel=0;p.returning=false;
    p.returnPoint=opts.returnPoint?.clone()||null;p.outboundDistance=opts.outboundDistance||0;p.returnSpeed=opts.returnSpeed||0;
    p.curveRate=opts.curveRate||0;p.curveSeconds=opts.curveSeconds||0;p.zoneRadius=opts.zoneRadius||R.enemyPatterns.heat.radius;
    p.mesh.material=this.fx.danger;p.mesh.visibility=1;p.mesh.setEnabled(true);this.projectilePose(p);return true;
  }
  align(mesh,from,to,thickness){const d=to.subtract(from),length=d.length();mesh.position.copyFrom(from.add(to).scale(.5));mesh.scaling.set(thickness,Math.max(.001,length),thickness);const unit=length>1e-8?d.scale(1/length):B.Axis.Y,cross=B.Vector3.Cross(B.Axis.Y,unit),dot=clamp(B.Vector3.Dot(B.Axis.Y,unit),-1,1);mesh.rotationQuaternion=cross.lengthSquared()>1e-10?B.Quaternion.RotationAxis(cross.normalize(),Math.acos(dot)):B.Quaternion.RotationAxis(B.Axis.X,dot<0?Math.PI:0);}
  projectilePose(p){
    if(p.discMesh){
      const disc=p.type==="disc";p.discMesh.setEnabled(disc);
      if(disc){
        p.mesh.position.copyFrom(p.position);p.mesh.rotationQuaternion=B.Quaternion.RotationYawPitchRoll(p.age*14,.22,.15);
        p.mesh.scaling.set(1,.65,1);p.mesh.material=this.fx.danger;p.trail.setEnabled(false);return;
      }
    }
    if(p.trail){
      const direction=p.velocity.normalizeToNew(),heat=p.type==="heat",diameter=heat ? .25 : Math.max(.16,p.radius*2);
      this.align(p.mesh,p.position.subtract(direction.scale(.01)),p.position.add(direction.scale(.01)),1);
      p.mesh.position.copyFrom(p.position);p.mesh.scaling.set(diameter/.08,diameter/.32,diameter/.08);
      p.mesh.material=heat?this.fx.heatCore:this.fx.boltCore;
      // Grow from the muzzle and keep the bright end on the actual packet centre.
      const length=Math.min(p.travel,heat ? .35 : p.root.type==="sniper" ? .68 : .5);
      p.trail.setEnabled(length>.01);p.trail.position.y=-length/(2*p.mesh.scaling.y);
      p.trail.scaling.set(.12/p.mesh.scaling.x,Math.max(.001,length)/p.mesh.scaling.y,.12/p.mesh.scaling.z);return;
    }
    if(p.type==="disc"){
      p.mesh.position.copyFrom(p.position);p.mesh.rotationQuaternion=B.Quaternion.RotationAxis(B.Axis.Z,Math.PI/2);
      p.mesh.scaling.set(.45,p.radius*2/.32,p.radius*2/.08);return;
    }
    const d=p.velocity.lengthSquared()>1e-9?p.velocity.normalizeToNew():V(0,0,1);
    this.align(p.mesh,p.position.subtract(d.scale(.16)),p.position.add(d.scale(.16)),1);
    p.mesh.scaling.y=1;p.mesh.scaling.x=p.mesh.scaling.z=p.type==="heat"?2.6:Math.max(.7,p.radius/.04);
  }
  retireProjectile(p){p.root=null;p.life=0;p.returnPoint=null;p.mesh.setEnabled(false);}
  updateProjectiles(dt){
    for(const p of this.projectiles){
      if(!p.root)continue;const r=p.root,step=Math.min(dt,Math.max(0,p.life));
      if(step<=1e-10){this.retireProjectile(p);continue;}
      p.life-=step;p.previous.copyFrom(p.position);p.age+=step;
      if(p.type==="arc"&&p.age-step<p.curveSeconds){
        const turn=p.curveRate*Math.min(step,p.curveSeconds-(p.age-step)),c=Math.cos(turn),s=Math.sin(turn),x=p.velocity.x,z=p.velocity.z;
        p.velocity.x=x*c+z*s;p.velocity.z=z*c-x*s;
      }
      if(p.type==="disc"&&p.returning){
        const d=p.returnPoint.subtract(p.position),distance=d.length();
        if(distance<.035){this.retireProjectile(p);continue;}
        p.velocity=d.scale(p.returnSpeed/Math.max(distance,1e-8));
        p.position.addInPlace(p.velocity.scale(Math.min(step,distance/p.returnSpeed)));
      }else{
        p.velocity.y+=p.gravity*step;
        const travel=p.velocity.length()*step,remain=p.type==="disc"?Math.max(0,p.outboundDistance-p.travel):Infinity;
        p.position.addInPlace(p.velocity.scale(travel>remain&&travel>0?step*remain/travel:step));p.travel+=Math.min(travel,remain);
      }
      const wall=this.solidHit(p.previous,p.position,null,p.radius);let impact=wall?{t:wall.t,wall}:null;
      if(p.type!=="heat"&&!this.hero.dead){
        const a=this.hero,test=segmentDistance(p.previous.subtract(a.previousFeet),p.position.subtract(a.root.position),V(0,a.m.hurtLow,0),V(0,a.m.hurtHigh,0));
        if(test.distance<=(a.m.hurtRadius+p.radius)**2&&(!impact||test.s<impact.t))impact={t:test.s,target:a};
      }
      // The floor is not in solids: explicitly intersect the descending heat arc with the ground.
      const landing=p.type==="heat"&&p.position.y<=.10&&p.velocity.y<=0;
      let landT=null;if(landing)landT=clamp((p.previous.y-.10)/Math.max(1e-9,p.previous.y-p.position.y),0,1);
      if(landing&&(!impact||landT<impact.t)){
        const point=B.Vector3.Lerp(p.previous,p.position,landT);this.landHeat(p,point);continue;
      }
      if(impact){
        const point=B.Vector3.Lerp(p.previous,p.position,impact.t);
        if(impact.target){
          this.damage(r,impact.target,point,p.previous,"projectile",p.packetId);
          // A returning disc stays visible after contact, but its root packet cannot hit twice.
          if(p.type!=="disc"){this.retireProjectile(p);continue;}
          if(wall){
            const blockedPoint=B.Vector3.Lerp(p.previous,p.position,wall.t),prop=this.props.find(o=>o.mesh===wall.mesh);
            if(prop)this.pushProp(r,prop,blockedPoint,p.previous);this.emit(blockedPoint,V(0,1,0),3,r);this.retireProjectile(p);continue;
          }
        }else{
          const prop=this.props.find(o=>o.mesh===impact.wall.mesh);if(prop)this.pushProp(r,prop,point,p.previous);
          this.emit(point,V(0,1,0),3,r);this.retireProjectile(p);continue;
        }
      }
      if(p.type==="disc"&&!p.returning&&p.travel+1e-8>=p.outboundDistance)p.returning=true;
      if(p.life<=1e-9||Math.abs(p.position.x)>this.field.arenaX+.7||Math.abs(p.position.z)>this.field.arenaZ+.7||p.position.y<-.2){this.retireProjectile(p);continue;}
      this.projectilePose(p);
    }
  }
  updateZones(dt){
    const rule=R.enemyPatterns.heat;
    for(const z of this.zones){
      if(!z.root)continue;z.age+=dt;
      z.mesh.visibility=z.age<z.delay?.42+.17*Math.sin(z.age*16):.85;
      const activeAge=z.age-z.delay;
      while(z.tick*rule.tickInterval<=activeAge+1e-9&&z.tick*rule.tickInterval<rule.life-1e-9){
        const tick=z.tick++,a=this.hero,r=z.root;
        if(!a.dead){
          const p0=V(a.previousFeet.x,0,a.previousFeet.z),p1=V(a.root.position.x,0,a.root.position.z),center=V(z.position.x,0,z.position.z);
          const test=segmentDistance(p0,p1,center,center);
          if(test.distance<=(z.radius+a.m.hurtRadius)**2&&!this.blocked(z.position.add(V(0,.15,0)),a.root.position.add(V(0,.25,0)))){
            this.damage(r,a,a.root.position.add(V(0,.15,0)),z.position,"ground","heat:"+tick);
          }
        }
        this.emit(z.position,V(0,1,0),tick===0?7:3,r);
      }
      if(activeAge+1e-9>=rule.life){z.root=null;z.mesh.setEnabled(false);}
    }
  }
  updateWaves(dt){for(const w of this.waves){if(!w.root)continue;const r=w.root;if(r.cancelled||r.discarded||this.hero.dead){w.root=null;w.mesh.setEnabled(false);continue;}const old=w.radius,remaining=Math.max(0,r.activeEnd-r.previousAge),step=Math.min(dt,remaining);w.age=clamp(r.age-r.windup,0,r.activeEnd-r.windup);
      w.radius=w.maxRadius*clamp(w.age/(r.activeEnd-r.windup),0,1);w.mesh.position.copyFrom(w.position);w.mesh.position.y=.12;w.mesh.scaling.set(Math.max(.03,w.radius*2),.8,Math.max(.03,w.radius*2));w.mesh.visibility=.85*(1-clamp(w.age/(r.activeEnd-r.windup),0,1)*.65);
      const candidates=this.actors.filter(a=>this.isHostile(a)&&!r.directHit.has(a.id)).map(a=>({a,d:Math.hypot(a.root.position.x-w.position.x,a.root.position.z-w.position.z)})).filter(o=>o.d-o.a.m.hurtRadius<=w.radius&&o.d+o.a.m.hurtRadius>=old).sort((a,b)=>a.d-b.d||(a.a.id<b.a.id?-1:1));
      for(const {a}of candidates){if(r.directHit.size>=r.geometry.cap)break;const point=a.root.position.add(V(0,Math.min(.7,a.m.height*.6),0));if(!this.blocked(w.position,point))this.damage(r,a,point,w.position,"direct");}
      for(const p of this.props){const d=Math.hypot(p.mesh.position.x-w.position.x,p.mesh.position.z-w.position.z);if(d-.4<=w.radius&&d+.4>=old&&!this.blocked(w.position,p.mesh.position,p.mesh))this.pushProp(r,p,p.mesh.position,w.position);}
      if(r.cancelled||r.age+1e-9>=r.activeEnd){w.root=null;w.mesh.setEnabled(false);}
    }}
  feedback(root,heavy,hammer=false){if(root.feedback)return;root.feedback=true;this.hitstop=Math.max(this.hitstop,hammer ? .058 : heavy ? .045 : .028);this.shake=Math.max(this.shake,heavy ? .035 : .016);this.sound.play(hammer?"hammer":heavy?"heavy":"hit");}
  line(from,to,width,material,life,root,type){if(B.Vector3.DistanceSquared(from,to)<.0001)return;const e=this.lines.find(p=>p.life<=0);if(!e)return;e.life=e.max=life;e.root=root;e.type=type;e.mesh.material=material;this.align(e.mesh,from,to,width);e.mesh.visibility=1;e.mesh.setEnabled(true);}
  lightning(from,to,width,life,root,type){const points=[from,B.Vector3.Lerp(from,to,.32).add(V(.08,.16,-.06)),B.Vector3.Lerp(from,to,.67).add(V(-.07,-.06,.08)),to];for(let i=1;i<points.length;i++){this.line(points[i-1],points[i],width,this.fx.cuda,life,root,type);this.line(points[i-1],points[i],width*.38,this.fx.lightning,life,root,type+"-core");}}
  emit(point,direction,count,root){for(let i=0;i<count;i++){const p=this.particles.find(e=>e.life<=0);if(!p)break;p.life=p.max=.16+Math.random()*.22;p.root=root;p.mesh.position.copyFrom(point);p.mesh.material=i%3===0?this.fx.dust:this.fx.spark;p.mesh.scaling.setAll(i%3===0?.055:.025);p.velocity=direction.scale(.7).add(V((Math.random()-.5)*1.2,.7+Math.random(),(Math.random()-.5)*1.2));p.mesh.visibility=1;p.mesh.setEnabled(true);}}
  floatPriority(recipient,importance){
    return importance+(recipient===this.hero.id?8:recipient===this.selectedID?5:0);
  }
  floatDamage(value,crit,point,kind,recipient=null){
    const id=recipient?.id||null,weight=kind==="heavy"||crit,importance=weight?3:kind==="cuda"?0:1;
    let f=this.floats.find(e=>e.life<=0);
    if(!f){
      if(this.finale){
        const score=e=>this.floatPriority(e.recipient,e.importance)+e.life/e.span*.5;
        f=this.floats.reduce((low,e)=>score(e)<score(low)?e:low);
        if(score(f)>this.floatPriority(id,importance)+.5)return;
      }else f=this.floats.reduce((a,b)=>a.life<b.life?a:b);
    }
    f.span=this.finale?(weight?1.02:kind==="cuda" ? .64 : .81):.72;
    f.life=f.span;f.recipient=id;f.importance=importance;f.weight=weight;f.kind=kind;f.offset=null;
    f.anchor=point.clone();f.position=point.add(V(0,kind==="cuda"?.55:.95,0));
    f.element.dataset.recipient=id||"";f.element.dataset.side=recipient===this.hero?"hero":"seat";
    const tint=kind||(this.finale?"outgoing":"");f.leader.className="floatLeader "+tint;
    f.element.className="damageFloat "+(crit?"critical ":"")+tint+(this.finale&&kind==="heavy"?" outgoing":"");
    f.element.textContent=this.finale&&kind!=="block"?(kind==="heal"?"+":"−")+hpFormat.format(Number(value))+(crit?"!":""):String(value)+(crit?"!":"");
    f.element.hidden=false;f.halfWidth=(f.element.offsetWidth||f.element.textContent.length*(crit?19:16))/2+4;f.halfHeight=(f.element.offsetHeight||(crit?38:32))/2+3;
  }
  clearHurt(){this.hurtStrength=0;ui.hurtEdge.hidden=true;ui.hurtEdge.style.opacity="0";}
  updateEffects(dt){
    if(this.finale&&this.hurtStrength>0){
      this.hurtStrength*=Math.exp(-6*dt);if(this.hurtStrength<.008)this.hurtStrength=0;
    }
    for(const p of this.particles)if(p.life>0){p.life-=dt;if(p.life<=0){p.root=null;p.mesh.setEnabled(false);continue;}p.velocity.y-=5*dt;p.mesh.position.addInPlace(p.velocity.scale(dt));p.mesh.visibility=p.life/p.max;}
    for(const p of this.lines)if(p.life>0){p.life-=dt;if(p.life<=0){p.root=null;p.mesh.setEnabled(false);}else{p.mesh.visibility=p.life/p.max;if(p.root?.finisher&&p.type==="weapon-trail")p.mesh.scaling.x=p.mesh.scaling.z=.12*(.2+.8*p.mesh.visibility);}}
    for(const f of this.floats)if(f.life>0){f.life-=dt;f.position.y+=dt*.65;if(f.life<=0){f.element.hidden=true;f.leader.hidden=true;}}this.shake*=Math.exp(-22*dt);
  }
  cameraView(){
    if(this.reflection){this.camera.position.set(0,13.5,14);this.camera.setTarget(V(0,.6,-1.1));return;}
    const s=this.settings.reduced?0:this.shake,offset=V(Math.sin(this.simTime*109)*s,Math.sin(this.simTime*137)*s*.5,0);
    if(this.survivor&&this.hero){
      const x=Math.max(0,this.field.wallX-this.camera.orthoRight),z=Math.max(0,this.field.wallZ-this.camera.orthoTop*1.45);
      offset.x+=clamp(this.hero.root.position.x,-x,x);offset.z+=clamp(this.hero.root.position.z,-z,z);
    }
    this.camera.position.copyFrom(V(0,13.5,14).add(offset));this.camera.setTarget(V(0,.15,0).add(offset));
  }
  project(point){const viewport=this.camera.viewport.toGlobal(this.engine.getRenderWidth(),this.engine.getRenderHeight()),v=B.Vector3.Project(point,B.Matrix.Identity(),this.scene.getTransformMatrix(),viewport),r=ui.view.getBoundingClientRect();return{x:v.x*r.width/this.engine.getRenderWidth(),y:v.y*r.height/this.engine.getRenderHeight(),visible:v.z>=0&&v.z<=1};}
  hud(){if(!this.hero)return;const a=this.hero,p=this.activeProfile();ui.hp.textContent=this.finale?hpFormat.format(a.hp)+" / "+hpFormat.format(a.maxHP):Math.round(a.hp*100)/100+" / "+a.maxHP;ui.hpFill.style.width=a.hp/a.maxHP*100+"%";const low=!a.dead&&a.hp/a.maxHP<=.25;ui.lowHealth.hidden=!low;ui.health.dataset.low=String(low);ui.health.setAttribute("aria-label",low?"Hero health · low":"Hero health");
    if(this.finale){
      ui.hurtEdge.hidden=this.hurtStrength===0||this.settings.reduced;ui.hurtEdge.style.opacity=String(this.hurtStrength);
    }
    if(this.finale&&ui.comboPips.dataset.charge!==String(this.combo)){ui.comboPips.dataset.charge=String(this.combo);ui.comboPips.setAttribute("aria-valuenow",String(this.combo));ui.comboPips.setAttribute("aria-valuetext",["No charge","One hit charged","Heavy swing ready"][this.combo]);}
    this.lessonHUD();
    ui.stageLabel.textContent=this.reflection?`The Reflection · ${this.duel.counters}/2 counters`:this.journey&&!this.finale?`${this.stageData.title} · ${this.waveIndex+1}/${this.stageData.waves.length}`:this.finale?`${this.actors.filter(e=>this.isHostile(e)).length} seats left · ${Math.floor(this.simTime/60)}:${String(Math.floor(this.simTime)%60).padStart(2,"0")}`:`G${this.stageIndex} · ${this.waveIndex+1}/${this.stageData.waves.length}`;ui.stageLabel.parentElement.title=this.stageData.title+" · "+this.stageData.waves[this.waveIndex].name;
    const t=this.actors.find(t=>t.id===this.selectedID&&this.isHostile(t));ui.target.textContent=this.reflection?"":t&&this.finale?`${t.fantasyTitle} · ${hpFormat.format(t.hp)} / ${hpFormat.format(t.maxHP)}`:t?"Target · "+(t.seat?seatRole(t)+" "+String(t.seat).padStart(2,"0")+" · ":"")+(TYPES[t.kind]?.label||t.kind)+"  "+Math.ceil(t.hp)+" / "+t.maxHP:"";
    if(this.reflection){
      const cue=this.finaleState==="playing"&&!this.ended?this.duel.cue():"";
      if(ui.status.textContent!==cue)ui.status.textContent=cue;
      this.reflectionStage.update(this.duel.view());
    }
    const head=this.project(a.root.position.add(V(0,a.m.height+.24,0))),feet=this.project(a.root.position),bodyWidth=Math.abs(this.project(a.root.position.add(V(a.m.hurtRadius+.3,0,0))).x-feet.x);
    ui.heroCue.hidden=a.dead||!head.visible;ui.heroCue.style.transform=`translate(${head.x}px,${head.y}px) translate(-50%,-100%)`;
    for(const cue of [this.heroRim,this.heroRing]){cue.setEnabled(!a.dead);cue.position.copyFrom(a.root.position);cue.position.y=cue===this.heroRing?.075:.045;cue.scaling.set(a.ctrlRadius*3,1,a.ctrlRadius*3);}
    this.selection.setEnabled(!!t);if(t){this.selection.position.copyFrom(t.root.position);this.selection.position.y=.026;this.selection.scaling.set(t.m.hurtRadius*2.4,1,t.m.hurtRadius*2.4);}
    this.marker.setEnabled(this.order?.type==="move");if(this.order?.type==="move")this.marker.position.copyFrom(this.order.point.add(V(0,.025,0)));
    const names=[this.stageData.shield?"Shield Rush":"Breaker Punch",this.stageIndex>=R.hammer.fromStage?"Thunder Slam":"Parallel Pulse"];
    for(const [i,button,text,label]of [[0,ui.skill1,ui.cool1,ui.label1],[1,ui.skill2,ui.cool2,ui.label2]]){const unlocked=this.slotAvailable(i),left=Math.max(0,a.cooldowns[i]-this.simTime);text.textContent=!unlocked?"Locked":left?left.toFixed(1)+"s":"";label.textContent=names[i];button.setAttribute("aria-label",`${i+1} ${names[i]} ${unlocked?"Cooldown "+(i?R.slot2.cooldown:R.slot1.cooldown)+" seconds":"Locked"}`);button.dataset.available=String(unlocked);button.disabled=!unlocked||this.finale&&this.simTime<.45||this.finaleState==="intro"||this.paused||this.qaFrozen||a.dead||this.ended||left>0;}
    const iconState=(this.stageData.shield?"shield":"fist")+"/"+(this.stageIndex>=R.hammer.fromStage?"hammer":"pulse");
    if(this.iconState!==iconState){this.iconState=iconState;
      ui.icon1.innerHTML=this.stageData.shield?'<svg viewBox="0 0 64 52" aria-hidden="true"><path d="M15 10c8 0 12-4 12-4s5 4 13 4v15c0 10-13 18-13 18S15 35 15 25Z" stroke="none"/><path d="m44 15 8-6m-7 16 13-1m-14 9 9 7M7 20l-5-1" fill="none" stroke-width="3"/></svg>':'<svg viewBox="0 0 64 52" aria-hidden="true"><path d="M20 25V12q0-5 5-5t5 5V9q0-5 5-5t5 5v4q0-4 5-4t5 5v15q0 9-11 14H21l-10-12q-4-7 2-9l7 7Z" stroke="none"/><path d="M4 13h10M3 39h9" fill="none" stroke-width="3"/></svg>';
      ui.icon2.innerHTML=this.stageIndex>=R.hammer.fromStage?'<svg viewBox="0 0 64 52" aria-hidden="true"><path d="M21 5h24v17H21zM29 22h8v17h-8z" stroke="none"/><path d="m12 34-7 8m44-8 9 9M9 47h47M24 36l9 7 10-7" fill="none" stroke-width="3"/></svg>':'<svg viewBox="0 0 64 52" aria-hidden="true"><circle cx="32" cy="26" r="8" stroke="none"/><circle cx="32" cy="26" r="17" fill="none" stroke-width="3"/><path d="M32 2v5m0 38v5M4 26h6m44 0h6M12 7l5 5m31 28 5 5m0-38-5 5M12 45l5-5" fill="none" stroke-width="3"/></svg>';
    }
    if(this.simTime>this.gainUntil)ui.gainCue.hidden=true;ui.hint.style.opacity=String(clamp((8-this.simTime)/2,0,1));
    ui.debug.textContent=`${C.version} · ${this.styleMode==="painted"?"Painted":"3D"} · ${this.lab||this.settings.scenario!=="all"?"Laboratory":"Campaign"}\nD ${p.D} · HP ${a.maxHP} · ${p.cycle}s · ${p.reach}m / ${p.arc}° / ${p.cap===null?"all legal targets":p.cap}\n${this.settings.heroOverride?"Hero override · ":""}${this.settings.override?"Enemy HP override":"Native enemy HP"}\n${this.measures.fps.toFixed(0)} FPS · ${this.scene.meshes.length} meshes · ${this.physics.getBodies().length} bodies\n${this.actors.filter(a=>this.isHostile(a)).length}/${this.stageData.activeCap} enemies · ${this.warningRoots.size}/${R.waves.highDangerGroups} danger groups\nCUDA ${this.stageData.cuda?"after direct hit → up to 3 extra targets":"Locked"} · Shield ${this.stageData.shield?"30% frontal block / skill 1 halves damage":"Locked"}\n${this.qaFrozen?"QA FROZEN · ":""}sim ${this.simTime.toFixed(2)} · run ${this.run}`;
    const hostileOwners=new Set([...this.warningRoots.values()].map(r=>r.owner));
    for(const actor of this.actors){const warning=hostileOwners.has(actor.id)&&!actor.dead&&!actor.friendly&&actor!==a;actor.sourceCue.setEnabled(warning);if(warning){actor.sourceCue.position.copyFrom(actor.root.position);actor.sourceCue.position.y=actor.root.position.y+actor.m.height+.72;actor.sourceCue.rotation.x=Math.PI/4;actor.sourceCue.material=actor.action?.type==="heal"?this.fx.heal:this.fx.danger;}if(actor.bar)actor.bar.dataset.threatening=String(warning);}
    if(this.finale&&this.finaleState==="playing"&&!this.paused&&!a.dead){
      const tells=this.actors.filter(e=>!e.dead&&e.action?.warning&&e.action.age<e.action.windup);
      const urgent=tells.find(e=>e.action.type==="heal")||tells.find(e=>e.action.geometry?.shape==="rush-capsule")||this.actors.find(e=>e.action?.punishOpen)||tells.find(e=>e.action.type==="sniper")||tells[0];
      const action=urgent?.action;
      const cue=action?.punishOpen?(action.type==="sniper"?"reloading · close in":"exposed · counter now"):
        action?.locked?"shot locked · sidestep":action?.geometry?.shape==="mortar"?"mortar · leave the circle":
        action?.geometry?.shape==="annulus"?"ring pulse · step inside or out":FINALE_WARNING[action?.type];
      const warning=urgent?urgent.fantasyTitle+" · "+cue:"";
      if(warning!==this.lastWarning){this.lastWarning=warning;ui.status.textContent=warning;}
    }
    const labels=[],view=ui.view.getBoundingClientRect(),occupied=[{left:feet.x-bodyWidth-8,right:feet.x+bodyWidth+8,top:head.y-32,bottom:feet.y+22},{left:0,right:view.width,top:0,bottom:116},{left:view.width/2-105,right:view.width/2+105,top:view.height-125,bottom:view.height}];
    for(const t of this.actors.filter(t=>t.bar).sort((x,y)=>Number(y.id===this.selectedID)-Number(x.id===this.selectedID)||Number(y.action?.type==="heal")-Number(x.action?.type==="heal")||(this.finale?Number(hostileOwners.has(y.id)||!!y.action?.punishOpen)-Number(hostileOwners.has(x.id)||!!x.action?.punishOpen):0)||x.seat-y.seat)){t.bar.hidden=t.dead||t.retired;const point=this.project(t.root.position.add(V(0,t.m.height+.16,0))),casting=!t.dead&&t.action?.type==="heal"&&t.action.age<t.action.windup&&!t.action.cancelled;let lift=0;
      if(this.survivor&&(point.x<0||point.x>view.width||point.y<0||point.y>view.height)){t.bar.hidden=true;continue;}
      const detailed=this.finale&&(t.id===this.selectedID||hostileOwners.has(t.id)||casting||t.action?.punishOpen);
      if(t.seat&&!t.dead&&!t.retired){
        const spacing=detailed?48:29;
        // Keep the seat's name above its track and below the fixed objective / warning.
        const minBarY=this.finale?(view.height<=600?80:99):0;
        if(this.finale){
          point.x=clamp(point.x,56,view.width-56);point.y=clamp(point.y,minBarY,view.height-26);
          if(detailed)lift=Math.min(25,point.y-minBarY);
        }
        while(labels.some(q=>Math.abs(q.x-point.x)<92&&Math.abs(q.y-(point.y-lift))<Math.max(spacing,q.spacing))||
          !a.dead&&Math.abs(point.x-head.x)<62&&point.y-lift>head.y-22&&point.y-lift<head.y+34){
          if(this.finale&&point.y-lift-spacing<minBarY){lift=point.y-minBarY;break;}
          lift+=spacing;
        }
        labels.push({x:point.x,y:point.y-lift,spacing});
        t.bar.lastElementChild.textContent=(casting?"+ HEALING":t.action?.punishOpen?(t.action.type==="sniper"?"DEADEYE · RELOAD":"VANGUARD · OPEN"):seatRole(t))+" · "+String(t.seat).padStart(2,"0");
      }
      if(this.finale&&t.seat)t.bar.dataset.hp=hpFormat.format(t.hp);
      t.bar.dataset.exposed=String(!!t.action?.punishOpen);t.bar.dataset.selected=String(t.id===this.selectedID);t.bar.dataset.casting=String(casting);t.bar.style.setProperty("--cast",casting?clamp(t.action.age/t.action.windup,0,1)*100+"%":"0%");t.bar.style.setProperty("--lift",lift+"px");t.bar.style.transform=`translate(${point.x}px,${point.y-lift}px) translate(-50%,-50%)`;t.bar.firstElementChild.style.width=t.hp/t.maxHP*100+"%";if(!t.bar.hidden)occupied.push({left:point.x-(t.seat?47:58),right:point.x+(t.seat?47:58),top:point.y-lift-(t.seat||t.elite?30:8),bottom:point.y-lift+(detailed?23:8)});
      if(this.finale&&!t.bar.hidden){const base=this.project(t.root.position),half=Math.max(9,Math.abs(base.x-this.project(t.root.position.add(V(t.m.hurtRadius,0,0))).x));occupied.push({left:base.x-half,right:base.x+half,top:point.y+4,bottom:base.y});}
    }
    const floats=this.finale?this.floats.filter(f=>f.life>0).sort((x,y)=>this.floatPriority(y.recipient,y.importance)-this.floatPriority(x.recipient,x.importance)||x.life/x.span-y.life/y.span):this.floats;
    for(const f of floats)if(f.life>0){const recipient=this.actors.find(t=>t.id===f.recipient);if(recipient)f.anchor=recipient.root.position.add(V(0,recipient.m.height*.7,0));
      const age=f.span-f.life,progress=age/f.span;
      const anchor=this.project(f.anchor),point=this.project(recipient?recipient.root.position.add(V(0,recipient.m.height+.22+(this.finale?0:age*.65),0)):f.position);
      const motion=this.finale&&!this.settings.reduced,scale=motion&&f.weight?1+.14*Math.sin(Math.PI*clamp(age/.18,0,1)):1;
      if(this.finale){
        const side=anchor.x<view.width/2?-1:1;
        point.x+=side*(8+(motion?progress*(f.weight?12:6):0));
        point.y-=f.weight?22:14;
        if(motion)point.y-=(f.weight?20:30)*ease((progress-(f.weight ? .2 : .06))/(f.weight ? .8 : .94));
      }
      const w=f.halfWidth*scale,h=f.halfHeight*scale;
      const free=(x,y)=>(!this.finale||x>=w+4&&x<=view.width-w-4&&y>=h+4&&y<=view.height-h-4)&&Math.hypot(x-point.x,y-point.y)<=96&&!occupied.some(r=>x+w>r.left&&x-w<r.right&&y+h>r.top&&y-h<r.bottom),x0=clamp(point.x,w+8,view.width-w-8),y0=clamp(point.y,h+8,view.height-h-8);let best=null;
      if(this.finale&&f.offset&&free(x0+f.offset.x,y0+f.offset.y))best={x:x0+f.offset.x,y:y0+f.offset.y};
      if(!best&&free(x0,y0))best={x:x0,y:y0};
      // Keep attribution local; a crowded value waits for space within its existing lifetime.
      if(!best)search:for(let ring=1;ring<=4;ring++)for(let row=-ring;row<=ring;row++)for(let col=-ring;col<=ring;col++){if(Math.max(Math.abs(row),Math.abs(col))!==ring)continue;const x=x0+col*24,y=y0+row*24;if(x>=w+8&&x<=view.width-w-8&&y>=h+8&&y<=view.height-h-8&&free(x,y)){best={x,y};break search;}}
      f.element.hidden=!point.visible||!best;f.leader.hidden=f.element.hidden;if(!best)continue;if(this.finale)f.offset={x:best.x-x0,y:best.y-y0};point.x=best.x;point.y=best.y;occupied.push({left:point.x-w-3,right:point.x+w+3,top:point.y-h-3,bottom:point.y+h+3});
      f.element.style.transform=`translate(${point.x}px,${point.y}px) translate(-50%,-50%)`+(this.finale?` scale(${scale})`:"");const opacity=clamp(f.life/.16,0,1);f.element.style.opacity=String(opacity);
      const dx=point.x-anchor.x,dy=point.y+h-4-anchor.y;f.leader.style.width=Math.hypot(dx,dy)+"px";f.leader.style.transform=`translate(${anchor.x}px,${anchor.y}px) rotate(${Math.atan2(dy,dx)}rad)`;f.leader.style.opacity=String(opacity*(this.finale ? .55 : .82));
    }
  }
  frame(now){if(this.failed)return;this.frameCount++;if(now-this.fpsTime>=500){this.measures.fps=this.frameCount*1000/(now-this.fpsTime);this.frameCount=0;this.fpsTime=now;}let real=Math.max(0,(now-this.lastTime)/1000);this.lastTime=now;
    if(this.ready&&this.finaleState!=="intro"&&!this.paused&&!this.qaFrozen&&!this.ended){this.measures.droppedSeconds+=Math.max(0,real-C.maxFrame);real=Math.min(real,C.maxFrame);if(this.hitstop>0){const stop=Math.min(real,this.hitstop);this.hitstop-=stop;real-=stop;this.measures.hitstopSeconds+=stop;}this.accumulator+=real;let count=0;while(this.accumulator>=C.step&&count<C.maxSteps){this.accumulator-=C.step;this.tick(C.step);count++;if(this.hitstop>0||this.qaFrozen){this.accumulator=0;break;}}if(this.accumulator>=C.step){this.measures.droppedSeconds+=this.accumulator;this.accumulator=0;}}
    else this.accumulator=0;this.scene.render(true,true);if(this.ready)this.hud();
  }
  snapshot(){
    const actor=a=>({id:a.id,kind:a.kind,seat:a.seat,elite:a.elite,friendly:a.friendly,dummy:a.dummy,hp:a.hp,maxHP:a.maxHP,x:a.root.position.x,y:a.root.position.y,z:a.root.position.z,yaw:a.yaw,action:a.action?.type||(a.dead?"defeat":a.actualSpeed>.1?"move":"idle"),rootId:a.action?.id||null,finisher:!!a.action?.finisher,punishOpen:!!a.action?.punishOpen,locked:!!a.action?.locked,reactHeavy:!!a.reactHeavy,age:a.action?.age||0,acceptedBaseD:a.action?.acceptedBaseD??null,geometry:a.action?.geometry||null,hitChannels:a.action?{direct:[...a.action.directHit],cuda:[...a.action.cudaHit],packets:[...a.action.packetHit].map(([key,set])=>({key,targets:[...set]}))}:null,
      castTargets:a.action?.castTargets||[],healAttempts:a.healAttempts,nextHeal:a.nextHeal,protectedWindup:a.protected,pose:{driver:"parent-child joints",weapon:this.weapon(a).asArray(),shield:a.rig.sockets.shield?.getAbsolutePosition().asArray()||null,anatomicalRight:"-X local",anatomicalLeft:"+X local",hand:a.action?.hand||null},velocity:a.controller?a.controller.getVelocity().asArray():[0,0,0],dead:a.dead,retired:a.retired});
    const p=this.hero?this.activeProfile():null;if(this.survivor)this.camera.getViewMatrix();
    return immutable({ready:this.ready,error:fatal,version:C.version,dataVersion:DATA.version,form:"G"+this.stageIndex,stage:this.stageIndex,stageTitle:this.stageData.title,wave:this.waveIndex,waveName:this.stageData.waves[this.waveIndex].name,engineVersion:B.Engine.Version,renderer:"WebGL"+this.engine.webGLVersion,style:this.styleMode,styleApplied:STYLE.applied(this.scene),styleReady:STYLE.ready(this.scene),physicsEnabled:!!this.physics,physicsDriver:"HavokPlugin.executeStep fixed120Hz",animationDriver:"R24Models parent-child joint poses",paused:this.paused,qaFrozen:this.qaFrozen,controlledCapture:this.capture,ended:this.ended,time:this.simTime,run:this.run,seed:C.seed,rngState:this.rng,settings:this.settings,nativeEnemies:TYPES,
      survivor:this.survivor?{field:[this.field.arenaX,this.field.arenaZ],cameraTarget:this.camera.getTarget().asArray(),orthoHalfWidth:this.camera.orthoRight,orthoHalfHeight:this.camera.orthoTop,reinforcements:this.reinforcements?.length||0,autoTarget:this.autoTarget,availableSlots:[this.slotAvailable(0),this.slotAvailable(1)],mobDefeats:this.mobDefeats}:null,
      reflection:this.reflection?{...this.duel.view(),hits:this.duel.hits}:null,lastMove:this.lastMove,
      finaleState:this.finaleState,cudaLesson:this.cudaLesson,journeyChapter:this.journey,journeyMode:this.journeyMode,seatsDown:this.seatsDown,hammerCharge:this.combo,chargeRemaining:this.combo?Math.max(0,this.comboUntil-this.simTime):0,progression:{mode:this.journey?this.journeyMode:this.finale?"finale":this.settings.scenario==="all"?"campaign-combat":"isolated-lab",labEntry:this.lab,stageStarted:this.stageStarted,waveStarted:this.waveStarted,spawnAt:this.spawnAt,transition:this.transition,completedStages:this.completedStages,budgetIsInformational:true,saveWrites:false},
      actualNumbers:{...p,maxHP:this.hero?.maxHP||this.settings.hp,skill1:this.stageData.slot1?R.slot1.damageMultiplier*p.D:null,skill2:this.stageData.slot2?R.slot2.damageMultiplier*p.D:null,CUDA:this.stageData.cuda&&(!this.cudaLesson||this.cudaLesson.phase==="parallel")?R.cuda.factor*p.D:0,CUDAAllowedTypes:R.cuda.allowedTypes,CUDASeedDamage:false,CUDADistances:{hop:R.cuda.hop,seedRange:R.cuda.seedRange,units:"3D world metres"},critChance:this.settings.crit,critMultiplier:R.crit.multiplier,shieldChance:this.stageData.shield?R.shield.chance:0,legacyFrontMultiplier:1},
      gear:{stage:this.stageIndex,tray:this.tray,fists:this.stageIndex<R.hammer.fromStage,shield:this.stageData.shield,hammer:this.stageIndex>=R.hammer.fromStage,slot1:this.stageData.slot1,slot2:this.stageData.slot2,passives:{cuda:this.stageData.cuda&&(!this.cudaLesson||this.cudaLesson.phase==="parallel"),shield:this.stageData.shield,regen:this.stageData.regen},nextCUDA:this.nextCUDA,nextRegen:this.nextRegen},
      hero:this.hero?actor(this.hero):null,enemies:this.actors.filter(a=>a!==this.hero&&!a.friendly).map(actor),friendlies:this.actors.filter(a=>a.friendly).map(actor),selectedID:this.selectedID,
      objects:[...this.objects.values()].map(o=>({id:o.id,kind:o.kind,category:o.category,position:o.root.position.asArray(),dynamic:!!o.dynamic,active:o.root.isEnabled()})),damageEvents:this.damageEvents,cudaEvents:this.cudaEvents,chainEvents:this.cudaEvents,lightningEvents:this.lightningEvents,blockEvents:this.blockEvents,healEvents:this.healEvents,impulseEvents:this.impulseEvents,progressEvents:this.progressEvents,pickupEvents:this.pickupEvents,
      dynamicProps:this.props.map(p=>({id:p.id,mass:p.mass,position:p.mesh.position.asArray(),rotation:p.mesh.rotationQuaternion?.asArray()||[],velocity:p.aggregate.body.getLinearVelocity().asArray()})),
      hazards:[...this.projectiles.filter(p=>p.root).map(p=>({rootId:p.root.id,owner:p.root.owner,type:p.type,position:p.position.asArray(),previous:p.previous.asArray(),velocity:p.velocity.asArray(),life:p.life,returning:p.returning,packetId:p.packetId})),...this.zones.filter(z=>z.root).map(z=>({rootId:z.root.id,owner:z.root.owner,type:"heat",position:z.position.asArray(),radius:z.radius,age:z.age,delay:z.delay,tick:z.tick})),...this.beams.filter(b=>b.root).map(b=>({rootId:b.root.id,owner:b.root.owner,type:"beam",position:b.origin.asArray(),end:b.end.asArray(),life:b.life}))],warnings:[...this.warningRoots.keys()],pendingRoots:[...this.pendingRoots].map(r=>({rootId:r.id,age:r.age,activeEnd:r.activeEnd,cudaReserved:r.cudaReserved,direct:[...r.directHit]})),
      counts:{actors:this.actors.length,activeEnemies:this.actors.filter(a=>this.isHostile(a)).length,activeCap:this.stageData.activeCap,objects:this.objects.size,meshes:this.scene.meshes.length,transformNodes:this.scene.transformNodes.length,materials:this.scene.materials.length,textures:this.scene.textures.length,nativeBodies:this.physics.getBodies().length,controllers:this.actors.filter(a=>a.controller).length,projectiles:this.projectiles.filter(p=>p.root).length,zones:this.zones.filter(p=>p.root).length,beams:this.beams.filter(p=>p.root).length,dangerGroups:this.warningRoots.size,effects:this.particles.filter(p=>p.life>0).length+this.lines.filter(p=>p.life>0).length,skeletons:this.scene.skeletons.length,animationGroups:this.scene.animationGroups.length},measurements:this.measures,audio:this.sound.state});
  }
  syncMetrics(a){
    const m={};for(const [k,v]of Object.entries(a.rig.metrics))if(typeof v==="number")m[k]=v*a.scale;
    m.hurtHigh=Math.min(m.hurtHigh,m.height-m.hurtRadius);m.hurtLow=Math.min(m.hurtLow,m.hurtHigh);a.m=m;
    if(a.controller&&Math.abs(a.ctrlHeight-m.height)>.001)throw new Error("setForm must keep the controller height stable within a stage");
  }
  activeProfile(){const s=this.stageData,t=this.tray?R.tray:null;return{D:t?(this.settings.heroOverride?this.settings.D*t.damage/s.D:t.damage):this.settings.D,cycle:t?.cycle||s.cycle,reach:t?.reach||s.reach,arc:t?.arc||s.arc,cap:this.cudaLesson&&this.cudaLesson.phase!=="parallel"?1:t?t.cap:s.cap};}
  isHostile(a){if(a===this.echo&&["preview","enter","return","complete"].includes(this.duel.phase))return false;return a!==this.hero&&!a.friendly&&!a.dead&&!a.retired;}
  setStyle(mode){if(!["3d","painted"].includes(mode))throw new RangeError("Unknown style");STYLE.set(this.scene,mode);this.styleMode=mode;ui.styleSelect.value=mode;if(this.ready)this.hud();return mode;}
  selectStage(n,w=0){const s=stageRow(n);waveNumber(s,w);this.stageData=s;this.stageIndex=n;this.startWave=w;this.waveIndex=w;this.lab=true;this.settings.scenario="all";this.settings.heroOverride=false;this.settings.override=false;this.settings.D=s.D;this.settings.hp=s.hp;this.settings.crit=R.crit.chance;this.reset();this.syncDebug();return true;}
  clearTransient(){
    if(this.finale)this.clearHurt();
    this.pendingSkill=null;this.order=null;this.selectedID=null;this.capture=null;this.transition=null;
    for(const r of this.pendingRoots){r.cudaResolved=true;r.discarded=true;}this.pendingRoots.clear();this.cudaQueue.length=0;this.healQueue.length=0;this.warningRoots.clear();
    for(const list of [this.projectiles,this.zones,this.beams,this.particles,this.lines,this.waves])for(const e of list){e.root=null;e.life=0;e.mesh.setEnabled(false);}
    for(const f of this.floats){f.life=0;f.element.hidden=true;f.leader.hidden=true;}this.hitstop=0;this.shake=0;this.accumulator=0;
  }
  applyTheme(){
    const theme=this.stageData.theme;this.floor.material.albedoColor=this.finale?B.Color3.White():B.Color3.FromHexString(theme.floor);this.floor.material.albedoTexture.level=this.finale?1:.55;
    this.p.wall.albedoColor=B.Color3.FromHexString(this.finale?"#313943":theme.wall);this.p.wallTop.albedoColor=this.finale?B.Color3.FromHexString("#444b50"):B.Color3.FromHexString(theme.wall).scale(1.06);
    // Friendly electricity keeps its colour across stages, distinct from hostile amber tells.
    for(const o of this.stageProps){this.shadow.removeShadowCaster(o);o.dispose();}this.stageProps.length=0;
    for(const p of this.staticProps)if(p.kind==="server"){
      const arcade=this.stageIndex===2,restaurant=this.stageIndex===R.tray.stage;
      for(const mesh of p.meshes)mesh.setEnabled(true);
      const adorn=(name,size,offset,mat)=>{const m=M.roundedBox(this.scene,name,size,.04,mat);m.parent=p.root;m.position.copyFrom(offset);this.stageProps.push(m);this.shadow.addShadowCaster(m);return m;};
      if(arcade){adorn("arcade-screen",[.66,.61,.09],V(0,.92,.47),this.p.dark);adorn("arcade-control-deck",[.76,.12,.30],V(0,.55,.51),this.p.steel);}
      else if(restaurant){adorn("service-counter",[.9,.10,1.05],V(0,.60,0),this.p.wood);}
      else if(this.stageData.shield){adorn("technology-cabinet-top",[.78,.08,.84],V(0,1.58,0),this.p.steel);}
    }
    if(this.stageIndex===DATA.stages.at(-1).stage){for(const p of this.staticProps.filter(x=>x.kind==="table")){const m=M.roundedBox(this.scene,"boardroom-dark-runner",[1.65,.025,.48],.015,this.p.dark);m.parent=p.root;m.position.set(0,.835,0);this.stageProps.push(m);}}
    // Authored stage dressings stay within existing prop footprints. Native solids never move.
  }
  makeFriendlyStaff(){if(this.stageIndex!==R.tray.stage)return;for(const [id,kind,x,z]of [["restaurant_manager","manager",-8.5,-3.8],["restaurant_coworker","coworker",8.6,4.3]]){const a=this.makeActor([id,kind,x,z,1],false,false,true);a.yaw=.4;a.root.rotation.y=a.yaw;this.pose(a);}}
  clearPickups(){for(const p of this.pickups){p.mesh.dispose();this.objects.delete(p.id);}this.pickups.length=0;}
  makeTray(){this.clearPickups();if(this.stageIndex!==R.tray.stage||this.tray)return;const points=[V(-2.1,.08,1.1),V(2.4,.08,-.4)];for(let i=0;i<R.tray.opportunities;i++){const id="temporary_tray_"+i,mesh=M.roundedBox(this.scene,id,[.68,.07,.44],.10,this.p.steel);mesh.position.copyFrom(points[i%points.length]);mesh.isPickable=false;this.pickups.push({id,mesh});this.objects.set(id,{id,kind:"temporary_tray",root:mesh,category:"pickup"});}}
  updatePickups(){if(this.tray||this.stageIndex!==R.tray.stage||this.hero.dead)return;const p=this.pickups.find(o=>B.Vector3.DistanceSquared(o.mesh.position,this.hero.root.position)<(.5+this.hero.ctrlRadius)**2);if(!p)return;const before=this.hero.hp;this.cancel(this.hero,"form-change");this.tray=true;this.hero.rig.setForm(this.stageIndex,true);this.syncMetrics(this.hero);this.pose(this.hero);this.hero.previousWeapon.copyFrom(this.weapon(this.hero));this.pickupEvents.push({time:this.simTime,id:p.id,D:this.activeProfile().D,hpBefore:before,hpAfter:this.hero.hp,temporary:true});this.clearPickups();ui.status.textContent="Tray picked up · this stage only";this.setStyle(this.styleMode);}
  spawnPositions(count){
    // An open horseshoe leaves the lower centre lane clear; all seats coexist.
    const points=[];const radiusX=Math.min(this.field.arenaX-2,8.0),radiusZ=Math.min(this.field.arenaZ-1.6,4.4);
    for(let i=0;i<count;i++){const t=count===1?Math.PI/2:.13*Math.PI+i*(1.74*Math.PI/Math.max(1,count-1));points.push(V(Math.cos(t)*radiusX,0,-Math.sin(t)*radiusZ-0.3));}
    return points;
  }
  placementForWave(entries){
    const out=this.spawnPositions(entries.length);if(entries.length===1)return[V(0,0,-1.1)];
    const seats={seat_01:[-2.2,-.2],seat_04:[0,.1],seat_07:[2.2,-.2],seat_02:[-4,-2],seat_03:[-2,-2.4],seat_05:[-1.2,-4],seat_06:[1.2,-4],seat_08:[4,-2],seat_09:[2,-2.4],seat_10:[0,-2]};
    let guns=0,guards=0,shields=0,rear=0,rushers=0,arcs=0,creatures=0,needles=0,heats=0;
    const arcCount=entries.filter(e=>e.kind==="arc_thrower").length,mech=entries.some(e=>e.kind==="boxing_mech"),beast=entries.some(e=>e.kind==="ember_beast");
    const shieldCount=entries.filter(e=>e.kind==="shield_soldier").length,rearCount=entries.filter(e=>e.kind==="rear_thrower").length;
    for(const [i,e]of entries.entries()){
      if(seats[e.kind]){const [x,z]=seats[e.kind],seat=this.finale&&DATA.finale.seats[e.kind];out[i]=seat?V(seat.x,0,seat.z):V(x,0,z);}
      else if(e.kind==="boxing_mech")out[i]=V(0,0,-3);
      else if(e.kind==="arc_thrower"){
        const n=arcs++,columns=arcCount>=8?5:3;
        out[i]=mech?V(n%2?2:-2,0,-.8):V((n%columns-(Math.min(arcCount,columns)-1)/2)*2,0,-.2-Math.floor(n/columns)*2);
      }
      else if(e.kind==="ember_beast")out[i]=V(0,0,-3);
      else if(e.kind==="needle_creature"||e.kind==="heat_creature"){
        if(beast){const n=e.kind==="needle_creature"?needles++:heats++;out[i]=e.kind==="needle_creature"?V((n-1)*1.8,0,n===1?0:.5):V(n%2?2.5:-2.5,0,-2);}
        else {const n=creatures++;out[i]=V((n%4-1.5)*2,0,2-Math.floor(n/4)*2);}
      }
      else if(e.kind==="gun_column"){const n=guns++;out[i]=V(n%2?4.0:-4.0,0,-3.4+Math.floor(n/2)*1.8);}
      else if(e.kind==="diagonal_guard"){const n=guards++;out[i]=V(n%2?1.9:-1.9,0,-1.3+Math.floor(n/2)*1.8);}
      else if(e.kind==="amd_leader")out[i]=V(0,0,-4.7);
      else if(e.kind==="shield_soldier")out[i]=V((shields++-(shieldCount-1)/2)*1.5,0,-.8);
      else if(e.kind==="ati_captain")out[i]=V(2.1,0,-1.0);
      else if(e.kind==="rear_thrower")out[i]=V((rear++-(rearCount-1)/2)*2.1,0,-3.5);
      else if(e.kind==="champion")out[i]=V(0,0,-3.8);
      else if(e.kind==="gunner"){const n=guns++;out[i]=V(n%2?5:-5,0,-2.8+Math.floor(n/2)*1.6);}
      else if(e.kind==="rusher"){const n=rushers++;out[i]=V((n%2?1:-1)*(1.8+Math.floor(n/2)*1.3),0,-.5);}
    }
    return out;
  }
  spawnWave(){
    this.waveStarted=this.simTime;this.spawnAt=this.simTime+R.waves.spawnTell;this.transition=null;
    let entries=[];const mode=this.settings.scenario,w=this.stageData.waves[this.waveIndex];
    if(mode==="all")for(const e of w.enemies)for(let j=0;j<e.count;j++)entries.push({kind:e.kind,elite:!!e.elite});
    else if(mode==="group")entries=Object.keys(TYPES).filter(k=>TYPES[k].stage===this.stageIndex).slice(0,this.stageData.activeCap).map(kind=>({kind,elite:false}));
    else {const kind=TYPES[mode]?mode:w.enemies.find(e=>TYPES[e.kind].boss)?.kind||w.enemies[0].kind;entries=[{kind,elite:false}];}
    if(this.survivor){
      this.reinforcements=entries.map((e,i)=>({...e,index:i}));
      const first=this.finale?10:this.cudaLesson&&this.waveIndex===0?5:3;
      for(let i=0;i<first&&this.reinforcements.length;i++)this.spawnReinforcement();
      this.nextReinforcement=this.spawnAt+.55;
    }else{
      if(entries.length>this.stageData.activeCap)throw new Error("Spawn cap rejected");
      const positions=this.placementForWave(entries);
      entries.forEach((e,i)=>this.spawnMember(e,i,positions[i],mode,entries));
    }
    this.progressEvents.push({type:"wave-start",stage:this.stageIndex,wave:this.waveIndex,kind:w.kind,count:entries.length,time:this.simTime,lab:mode!=="all"||this.lab});this.trimLog(this.progressEvents);this.setStyle(this.styleMode);this.syncDebug();
  }
  spawnMember(e,i,p,mode,entries){
    const scale=TYPES[e.kind].scale*(e.elite?R.elite.scaleMultiplier:1),id=TYPES[e.kind].seat?e.kind:`g${this.stageIndex}w${this.waveIndex+1}_${e.kind}_${i+1}`;
    const a=this.makeActor([id,e.kind,p.x,p.z,scale],mode==="dummy",e.elite),d=this.hero.root.position.subtract(a.root.position);
    a.yaw=Math.atan2(d.x,d.z);a.root.rotation.y=a.yaw;
    if(e.kind==="gun_column"){a.column=entries.slice(0,i).filter(e=>e.kind==="gun_column").length%2;a.nextAttack=this.simTime+R.waves.spawnTell+(a.column?R.enemyPatterns.volley.laneOffset:.2);a.columnNext=a.nextAttack;}
    if(e.kind===R.heal.type)a.nextHeal=this.waveStarted+R.heal.firstAfter;
    this.pose(a);a.previousWeapon.copyFrom(this.weapon(a));return a;
  }
  spawnReinforcement(){
    const e=this.reinforcements.shift(),hero=this.hero.root.position,i=this.ingressNumber++;
    let point;
    if(this.cudaLesson&&this.waveIndex===0){
      const [x,z]=[[.8,-.4],[2,-.4],[3.2,-.4],[2,-1.7],[-4,-2]][e.index];point=V(x,0,z);
    }else{
      const radius=this.finale?6.7+e.index%3*.42:5.0+(i%3)*.48;
      const boxes=this.obstacleBoxes(this.hero);
      for(let attempt=0;attempt<40;attempt++){
        const angle=-Math.PI/2+i*2.39996+attempt*.31;
        const p=V(hero.x+Math.cos(angle)*radius,0,hero.z+Math.sin(angle)*radius);
        if(Math.abs(p.x)>this.field.arenaX||Math.abs(p.z)>this.field.arenaZ||boxes.some(b=>p.x>b.min.x&&p.x<b.max.x&&p.z>b.min.z&&p.z<b.max.z)||this.actors.some(a=>!a.dead&&Math.hypot(a.root.position.x-p.x,a.root.position.z-p.z)<1.4))continue;
        point=p;break;
      }
      if(!point){this.reinforcements.unshift(e);return;}
    }
    this.spawnMember(e,e.index,point,"all",[]);
    this.progressEvents.push({type:"ingress",kind:e.kind,position:[point.x,point.z],hero:[hero.x,hero.z],time:this.simTime});this.trimLog(this.progressEvents);
  }
  refillWave(){
    if(!this.survivor||!this.reinforcements?.length||this.hero.dead||this.simTime<this.nextReinforcement)return;
    if(this.actors.filter(a=>a!==this.hero&&!a.friendly).length>=this.stageData.activeCap)return;
    this.spawnReinforcement();this.nextReinforcement=this.simTime+.74;
  }
  checkProgress(){
    if(this.reflection)return;
    if(this.settings.scenario!=="all"||this.hero.dead||this.ended)return;
    if(this.transition){if(this.simTime<this.transition.at)return;const next=this.transition;this.transition=null;
      if(next.type==="wave"){
        this.clearTransient();for(const a of [...this.actors])if(a!==this.hero&&!a.friendly){this.disposeActor(a);this.actors.splice(this.actors.indexOf(a),1);}
        this.cancel(this.hero,"wave-end",true);this.hero.path=[];this.hero.velocity.setAll(0);this.waveIndex++;this.spawnWave();
      }else if(next.type==="stage")this.advanceStage();return;
    }
    if(this.survivor&&this.reinforcements?.length)return;
    if(this.actors.some(a=>this.isHostile(a)||a!==this.hero&&!a.friendly&&!a.retired)||this.hasHazards())return;
    for(const r of this.pendingRoots)this.finalizeRoot(r,true);this.pendingRoots.clear();
    if(this.finale){this.endFinale(true);return;}
    if(this.cudaLesson&&this.cudaLesson.phase!=="parallel")return;
    if(this.journey&&this.waveIndex+1===this.stageData.waves.length){this.endJourney(true);return;}
    if(this.waveIndex+1<this.stageData.waves.length){this.transition={type:"wave",at:this.simTime+C.breather};ui.status.textContent="Wave clear · next wave incoming";}
    else if(this.stageIndex<DATA.stages.at(-1).stage){const next=stageRow(this.stageIndex+1);this.completedStages.push(this.stageIndex);this.progressEvents.push({type:"stage-victory",stage:this.stageIndex,time:this.simTime});this.transition={type:"stage",at:this.simTime+C.stageCue};ui.gainCue.textContent=next.gain;ui.gainCue.hidden=false;this.gainUntil=this.simTime+C.stageCue;}
    else {this.completedStages.push(this.stageIndex);this.ended=true;this.order=null;this.pendingSkill=null;ui.status.textContent="All ten seats defeated · campaign complete";this.progressEvents.push({type:"campaign-complete",stage:this.stageIndex,time:this.simTime});this.trimLog(this.progressEvents);}
  }
  advanceStage(){
    const previous=this.stageIndex,next=stageRow(previous+1),hp=this.hero.hp;
    this.clearTransient();for(const a of this.actors)this.disposeActor(a);this.actors.length=0;this.clearPickups();
    this.stageData=next;this.stageIndex=next.stage;this.startWave=0;this.waveIndex=0;this.stageStarted=this.simTime;this.tray=false;
    this.settings.heroOverride=false;this.settings.D=next.D;this.settings.hp=next.hp;this.settings.crit=R.crit.chance;
    this.applyTheme();this.hero=this.makeActor(["hero","hero",0,3,C.heroScale]);this.hero.yaw=Math.PI;this.hero.root.rotation.y=Math.PI;this.pose(this.hero);this.hero.previousWeapon.copyFrom(this.weapon(this.hero));this.hero.nextAttack=this.simTime;
    this.nextCUDA=this.simTime;this.nextRegen=this.simTime;this.progressEvents.push({type:"upgrade",from:previous,to:next.stage,gain:next.gain,actualHPBefore:hp,actualHPAfter:this.hero.hp,D:this.settings.D,time:this.simTime});this.trimLog(this.progressEvents);
    this.spawnWave();ui.status.textContent="";ui.gainCue.textContent=next.gain;ui.gainCue.hidden=false;this.gainUntil=this.simTime+2;this.syncDebug();
  }
  trimLog(list,max=128){if(list.length>max)list.splice(0,list.length-max);}
  syncDebug(){
    ui.stageSelect.value=String(this.stageIndex);ui.waveSelect.replaceChildren();for(const [i,w]of this.stageData.waves.entries()){const o=document.createElement("option");o.value=String(i);o.textContent=`${i+1} · ${w.name}`;ui.waveSelect.appendChild(o);}ui.waveSelect.value=String(this.waveIndex);
    ui.scenario.value=this.settings.scenario;ui.heroOverride.checked=this.settings.heroOverride;ui.enemyOverride.checked=this.settings.override;ui.heroHP.value=String(this.settings.hp);ui.damage.value=String(this.settings.D);ui.crit.value=String(this.settings.crit*100);ui.enemyHP.value=String(this.settings.enemyHP);ui.styleSelect.value=this.styleMode;
  }
  healTargets(a){const origin=a.root.position.add(V(0,Math.min(.8,a.m.height*.6),0));return this.actors.filter(t=>t!==a&&t!==this.hero&&t.seat&&!t.dead&&!t.retired&&t.hp>0&&t.hp<t.maxHP).map(t=>({t,p:t.root.position.add(V(0,Math.min(.8,t.m.height*.6),0))})).filter(({p})=>B.Vector3.DistanceSquared(origin,p)<=R.heal.range**2&&!this.blocked(origin,p)).sort((a,b)=>a.t.hp/a.t.maxHP-b.t.hp/b.t.maxHP||(a.t.id<b.t.id?-1:1)).slice(0,R.heal.targets).map(({t})=>t.id);}
  shieldPresented(a){if(a!==this.hero||!this.stageData.shield||a.dead||a.stun>0)return false;const r=a.action;if(!r)return true;if(r.type==="skill2")return false;if(r.type==="skill1")return r.age<R.slot1.advanceStart||r.age>=R.slot1.contactEnd;return r.age>=r.activeEnd;}
  mitigateHero(r,t,origin,amount,packetId){
    let requested=amount,prevented=0,mode="none",rolled=null,event=null;
    if(amount<=0||t.dead)return{requested,prevented,mode,rolled,event};
    const delta=origin.subtract(t.root.position);delta.y=0;const front=arc=>delta.lengthSquared()>1e-9&&B.Vector3.Dot(delta.normalizeToNew(),V(Math.sin(t.yaw),0,Math.cos(t.yaw)))>=Math.cos(arc*Math.PI/360);
    const eligible=R.shield.eligibleKinds.includes(r.damageKind),action=t.action;
    if(action?.type==="skill2")return{requested,prevented,mode,rolled,event};
    if(action?.type==="skill1"&&action.age>=R.slot1.advanceStart&&action.age<R.slot1.contactEnd){
      if(action.age>=R.slot1.advanceStart&&action.age<R.slot1.contactEnd&&eligible){
        if(action.guardStage==="shield"&&front(R.slot1.shield.guardArc)){requested=Math.round(amount*R.slot1.shield.damageMultiplier);mode="active-half";}
        else if(action.guardStage==="fist"&&front(R.slot1.fist.guardArc)&&action.guardPackets<R.slot1.fist.catchPackets){action.guardPackets++;requested=0;mode="fist-catch";}
      }
    }else if(this.shieldPresented(t)&&eligible&&front(R.shield.arc)){
      if(!r.shieldDecisions.has(t.id))r.shieldDecisions.set(t.id,this.random()<R.shield.chance);
      rolled=r.shieldDecisions.get(t.id);if(rolled){requested=0;mode="random-block";}else mode="random-failed";
    }
    prevented=amount-requested;
    if(mode!=="none"){
      const ev={rootId:r.id,owner:r.owner,target:t.id,packetId,mode,success:prevented>0,randomOutcome:rolled,incoming:amount,prevented,actualDamage:requested,time:this.simTime};event=ev;this.blockEvents.push(ev);this.trimLog(this.blockEvents);
      if(prevented>0){const point=t.rig.sockets.shield?.getAbsolutePosition().clone()||this.weapon(t);this.line(point.add(V(-.14,0,0)),point.add(V(.14,.16,0)),.04,this.fx.spark,.13,r,"shield-block");this.floatDamage("BLOCK",false,point,"block",t);}
      if(mode==="random-block"&&this.stageData.regen&&t.hp>0&&!t.dead&&this.simTime+1e-9>=this.nextRegen){
        this.nextRegen=this.simTime+R.regen.cooldown;const before=t.hp,actual=Math.min(t.maxHP*R.regen.maxHpFraction,prevented*R.regen.blockedDamageFraction,t.maxHP-t.hp);t.hp+=actual;
        this.healEvents.push({type:"shield-regen",rootId:r.id,owner:t.id,prevented,actual,hpBefore:before,hpAfter:t.hp,time:this.simTime,nextEligible:this.nextRegen});this.trimLog(this.healEvents);
        if(actual>0)this.floatDamage("+"+actual,false,t.root.position.add(V(0,t.m.height*.8,0)),"heal",t);
      }
    }
    return{requested,prevented,mode,rolled,event};
  }
  incomingDefense(t,r,origin,amount){
    if(t.spec?.action!=="shieldBash")return amount;const action=t.action,rule=R.enemyPatterns.shieldBash;
    const open=action&&(action.age>=rule.openAtTell||action.type==="reload");if(open||t.stun>0)return amount;
    const d=origin.subtract(t.root.position);d.y=0;return d.lengthSquared()>1e-9&&B.Vector3.Dot(d.normalize(),V(Math.sin(t.yaw),0,Math.cos(t.yaw)))>=Math.cos(rule.frontArc*Math.PI/360)?Math.round(amount*rule.closedMultiplier):amount;
  }
  applyControl(r,t,dir){
    if(t.dummy)return;const ordinary=!t.boss&&t!==this.hero,heavy=t.elite||t.kind==="ember_beast"||t.kind==="boxing_mech";
    if(t===this.hero){t.recoil.addInPlace(dir.scale(r.damageKind==="heavy_body_charge"?1.4:.35));return;}
    let push=r.finisher ? .48 : .10,stagger=0,canInterrupt=false;
    if(r.type==="skill1"){const f=this.stageData.shield?R.slot1.shield:R.slot1.fist;push=f.push;stagger=f.stagger;canInterrupt=true;}
    if(r.type==="skill2"){const f=this.stageIndex>=R.hammer.fromStage?R.slot2.hammer:R.slot2.gauntlet;push=f.push;stagger=f.stagger;canInterrupt=true;}
    if(t.boss){
      const braced=[1,4,7].includes(t.seat),action=t.action;
      if(this.finale&&t.seat&&(t.reactHeavy||r.type==="skill1")){
        push=braced ? .24 : r.type==="skill2"?1.9:r.finisher?1.45:1.05;
      }else push*=R.control.bossPushMultiplier;
      if(action?.geometry?.shape==="rush-capsule"&&action.age<action.activeEnd)push=0;
      const healOpen=action?.type==="heal"&&!action.healResolved&&(action.age<action.windup||action.previousAge<action.windup);
      const unreleasedOpen=action&&!action.released&&(action.age<action.windup||action.previousAge<action.windup);
      if(action&&(healOpen&&(canInterrupt||this.finale&&r.finisher)||canInterrupt&&unreleasedOpen&&action.interruptible&&!action.protectedWindup)){
        this.cancel(t,"interrupted");t.protected=true;t.stun=r.finisher ? .3 : stagger*.5;
      }
    }else if(ordinary&&this.simTime>=t.controlUntil&&stagger>0){
      const factor=heavy?R.control.heavyEffectMultiplier:1;t.stun=stagger*factor;push*=factor;t.controlUntil=this.simTime+R.control.ordinaryRepeatProtection;
      if(t.action&&t.action.age<t.action.windup)this.cancel(t,"interrupted");
    }else if(stagger>0)push=0;
    // Velocity impulse decays under the same native controller: no teleport and no persistent chase gap.
    t.recoil.addInPlace(dir.scale(push*7));
    if(this.finale&&t.seat&&t.recoil.lengthSquared()>14**2)t.recoil.normalize().scaleInPlace(14);
  }
  finalizeRoot(r,discard=false){
    if(r.directComplete)return;r.directComplete=true;
    if(this.finale&&r.type==="basic"&&!r.cancelled&&!r.directRecords.length)this.combo=0;
    this.pendingRoots.delete(r);
    if(discard||this.hero.dead){r.cudaResolved=true;r.discarded=true;return;}
    if(!r.cudaTried||!r.cudaReserved){r.cudaResolved=true;return;}
    const records=r.directRecords.filter(x=>{const a=this.actors.find(a=>a.id===x.id);return a&&(!a.dead||x.killed);});
    records.sort((a,b)=>(a.id===r.selectedAtAccept?-1:b.id===r.selectedAtAccept?1:0)||a.distance-b.distance||(a.id<b.id?-1:1));
    const record=records[0];if(!record){r.cudaResolved=true;return;}
    this.cuda({root:r,seed:this.actors.find(a=>a.id===record.id),contact:record.point,origin:record.origin,seedKilledByOriginal:record.killed,triggerTime:r.cudaTriggerAt,eligible:true});
  }
  dangerBusy(r){return this.actors.some(a=>a.action===r&&!a.dead&&r.warning&&(r.age<r.windup||["guardCharge","beastCharge","shieldBash","mechPunch","mechSweep"].includes(r.type)&&r.age<r.activeEnd||r.type==="heal"&&!r.healResolved))||this.projectiles.some(p=>p.root===r)||this.zones.some(z=>z.root===r)||this.beams.some(b=>b.root===r)||this.healQueue.some(q=>q.root===r);}
  pruneDanger(){for(const [id,r]of this.warningRoots)if(!this.dangerBusy(r))this.warningRoots.delete(id);}
  hasHazards(){return this.projectiles.some(p=>p.root)||this.zones.some(z=>z.root)||this.beams.some(b=>b.root)||this.healQueue.length>0;}
  columnOpen(a){if(a.kind!=="gun_column")return true;const rule=R.enemyPatterns.volley,t=this.simTime-this.waveStarted-R.waves.spawnTell;if(t<0)return false;const phase=((t%rule.period)+rule.period)%rule.period;return Math.floor(phase/rule.laneOffset)%2===a.column;}
  fanIntersection(origin,yaw,reach,arc,target,position=target.root.position){
    const d=position.subtract(origin),horizontal=Math.hypot(d.x,d.z),radius=target.m.hurtRadius,forward=d.x*Math.sin(yaw)+d.z*Math.cos(yaw);
    if(arc<=180&&forward<=0||horizontal-radius>reach)return null;
    const signed=angle(yaw,Math.atan2(d.x,d.z)),half=arc*Math.PI/360;
    let distance=Math.max(0,horizontal-reach);
    if(Math.abs(signed)>half){
      const edge=yaw+Math.sign(signed)*half,ex=Math.sin(edge),ez=Math.cos(edge),along=clamp(d.x*ex+d.z*ez,0,reach);
      distance=Math.hypot(d.x-ex*along,d.z-ez*along);
    }
    if(distance>radius)return null;
    const height=Math.min(target.m.hurtHigh,Math.max(target.m.hurtLow,.75-position.y));return position.add(V(0,height,0));
  }
  groundPulse(r,center){
    r.groundImpactAt=this.simTime;
    const at=V(center.x,.12,center.z),hero=this.hero,feet=hero.root.position;
    const distance=Math.hypot(feet.x-center.x,feet.z-center.z);
    if(!hero.dead&&distance<=(r.geometry.radius+1e-8)&&distance+1e-8>=(r.geometry.innerRadius||0)&&!this.blocked(at,feet.add(V(0,.25,0))))
      this.damage(r,hero,feet.add(V(0,.15,0)),at,"ground",r.geometry.shape);
    if(r.geometry.shape==="annulus"){
      // Each short flash follows the struck band; the eye remains clear on the impact frame.
      const radius=(r.geometry.innerRadius+r.geometry.radius)/2;
      for(let i=0;i<8;i++){
        const angle=i*Math.PI/4,point=at.add(V(Math.cos(angle)*radius,0,Math.sin(angle)*radius));
        const tangent=V(-Math.sin(angle),.13,Math.cos(angle)).scale(.32);
        this.line(point.subtract(tangent),point.add(tangent),.095,this.fx.heatCore,.18,r,"annulus-impact");
      }
    }else this.emit(at,V(0,1,0),7,r);
    this.sound.play("swing");
  }
  landHeat(p,point){
    if(p.root.geometry?.shape==="mortar"){this.groundPulse(p.root,p.root.aim);this.retireProjectile(p);return;}
    const limit=Math.min(C.maxZones,R.board.maxZones),active=this.zones.filter(z=>z.root).length,zone=active<limit?this.zones.find(e=>!e.root):null;
    if(zone){
      zone.root=p.root;zone.age=0;zone.delay=.7;zone.tick=0;zone.radius=Math.min(p.zoneRadius,Math.sqrt((4*this.field.arenaX*this.field.arenaZ)*R.board.maxZoneWalkableAreaFraction/(Math.PI*limit)));
      zone.position=V(point.x,.035,point.z);zone.mesh.position.copyFrom(zone.position);zone.mesh.material=this.fx.danger;
      zone.mesh.scaling.set(zone.radius/1.1,1,zone.radius/1.1);zone.mesh.visibility=.48;zone.mesh.setEnabled(true);
    }
    this.retireProjectile(p);
  }
  updateBeamPose(beam){
    const far=beam.origin.add(beam.direction.scale(beam.length)),hit=this.solidHit(beam.origin,far,null,beam.radius);
    beam.end=hit?hit.point:far;this.align(beam.mesh,beam.origin,beam.end,beam.radius*2);beam.mesh.visibility=.85;
  }
  updateBeams(dt){
    for(const b of this.beams){
      if(!b.root)continue;const step=Math.min(dt,b.life);if(step<=1e-10){b.root=null;b.mesh.setEnabled(false);continue;}
      b.life-=step;b.age+=step;this.updateBeamPose(b);
      const a=this.hero;
      if(!a.dead){
        const tests=[a.previousFeet,a.root.position].map(p=>segmentDistance(b.origin,b.end,p.add(V(0,a.m.hurtLow,0)),p.add(V(0,a.m.hurtHigh,0))));
        const t=tests[0].distance<tests[1].distance?tests[0]:tests[1];
        if(t.distance<=(a.m.hurtRadius+b.radius)**2){const point=B.Vector3.Lerp(b.origin,b.end,t.s);this.damage(b.root,a,point,b.origin,"beam","beam");}
      }
      if(b.life<=1e-9){b.root=null;b.mesh.setEnabled(false);}
    }
  }
  resolveHeals(){
    const queue=this.healQueue.splice(0),rule=R.heal;
    for(const {actor:a,root:r}of queue){
      if(r.healResolved)continue;r.healResolved=true;
      const event={rootId:r.id,owner:a.id,type:"seat_heal",time:this.simTime,targets:[],attempt:a.healAttempts,reason:"completed"};
      if(a.dead||r.cancelled||a.action!==r||this.hero.dead){event.reason="cancelled";}
      else{
        const origin=a.root.position.add(V(0,Math.min(.8,a.m.height*.6),0));
        for(const id of r.castTargets||[]){
          const t=this.actors.find(t=>t.id===id);
          if(!t||t===a||t===this.hero||t.dead||t.hp<=0||t.hp>=t.maxHP||!TYPES[t.kind]?.seat)continue;
          const point=t.root.position.add(V(0,Math.min(.8,t.m.height*.6),0));
          if(B.Vector3.DistanceSquared(origin,point)>rule.range**2||this.blocked(origin,point))continue;
          const before=t.hp,actual=Math.min(t.maxHP-before,Math.round(t.maxHP*rule.maxHpFraction));
          if(actual<=0)continue;t.hp+=actual;
          event.targets.push({id:t.id,hpBefore:before,hpAfter:t.hp,actual});this.line(origin,point,.035,this.fx.heal||this.fx.cuda,.35,r,"seat-heal");
          this.floatDamage("+"+actual,false,point,"heal",t);
        }
      }
      this.healEvents.push(event);if(this.healEvents.length>128)this.healEvents.shift();
    }
  }
  validatedSettings(){
    const fields=[ui.heroHP,ui.damage,ui.crit,ui.enemyHP],values=fields.map(f=>Number(f.value)),[hp,D,crit,enemyHP]=values;
    if(fields.some(f=>f.value.trim()==="")||!values.every(Number.isFinite)||!Number.isInteger(hp)||hp<1||hp>1e6||!Number.isInteger(D)||D<0||D>1e6||crit<0||crit>100||!Number.isInteger(enemyHP)||enemyHP<1||enemyHP>1e7)throw new RangeError("Use integers: HP 1–1,000,000; D 0–1,000,000; enemy HP 1–10,000,000. Crit: 0–100%.");
    if(!/^[1-8]$/.test(ui.stageSelect.value)||!/^\d+$/.test(ui.waveSelect.value))throw new RangeError("Invalid stage or wave");const row=stageRow(Number(ui.stageSelect.value)),wave=waveNumber(row,Number(ui.waveSelect.value));
    if(!SCENARIOS.includes(ui.scenario.value)||!["3d","painted"].includes(ui.styleSelect.value))throw new RangeError("Invalid scenario or render style");
    return{row,wave,style:ui.styleSelect.value,settings:{hp:ui.heroOverride.checked?hp:row.hp,D:ui.heroOverride.checked?D:row.D,crit:ui.heroOverride.checked?crit/100:R.crit.chance,heroOverride:ui.heroOverride.checked,enemyHP,override:ui.enemyOverride.checked,scenario:ui.scenario.value,immortal:ui.immortal.checked,reduced:ui.reduced.checked}};
  }
  applySettings(){const v=this.validatedSettings();this.stageData=v.row;this.stageIndex=v.row.stage;this.startWave=v.wave;this.waveIndex=v.wave;this.styleMode=v.style;this.settings=v.settings;this.lab=true;this.sound.muted=ui.mute.checked;this.reset();}
  slotAvailable(slot){if(this.survivor&&this.cudaLesson&&this.cudaLesson.phase!=="parallel")return false;return slot===0?this.stageData.slot1:slot===1?this.stageData.slot2:false;}
  freeze(value){this.qaFrozen=value;this.accumulator=0;this.lastTime=performance.now();ui.freezeButton.textContent=value?"Unfreeze QA":"QA Freeze Frame";ui.freezeButton.setAttribute("aria-pressed",String(value));if(!value){this.capture=null;ui.status.textContent="";}else ui.status.textContent="QA frozen · controlled frame";if(this.ready)this.hud();return value;}
  async load(){ui.bootText.textContent="Creating stage, models and native physics…";ui.progress.value=55;if(this.finale){
      const image=$("finaleFloor");image.src=image.dataset.src;await image.decode();
      const texture=this.floor.material.albedoTexture,size=texture.getSize();
      texture.getContext().drawImage(image,0,0,size.width,size.height);texture.update(false);
    }
    this.reset();await this.scene.whenReadyAsync();this.ready=true;ui.boot.hidden=true;if(this.journey){this.paused=true;ui.pause.hidden=true;ui.finaleIntro.hidden=true;ui.finaleResult.hidden=true;if(!this.reflection)window.JourneySetpiece?.stage(this.scene,this.journey);window.JourneySetpiece?.lesson?.(this.cudaLesson);window.JensenJourney.ready(event=>this.beginJourney(event),event=>this.retryJourney(event));}else if(this.finale){ui.finaleIntro.hidden=false;ui.finaleStart.focus();}ui.progress.value=100;this.lastTime=performance.now();}
}
window.SurvivorSkills?.install(Training.prototype);
(async()=>{
  if(!B||!M||!STYLE||!B.PhysicsCharacterController||typeof window.HavokPhysics!=="function")throw new Error("Missing local Babylon, Havok, models.js or render-style.js");
  validateData();const options=queryOptions(window.location.search||(["finale","story","reflection"].includes(document.documentElement.dataset.mode)?"?mode="+document.documentElement.dataset.mode:""));
  if(options.journeyMode){
    const chapter=await window.JensenJourney.open(options.journeyMode);if(chapter===null)return;
    if(!["diner","arcade","cuda","seats","reflection"].includes(chapter))throw new Error("Unknown journey chapter");
    options.survivorEdition=window.JensenJourney.survivorEdition?.()===true;
    if(chapter==="reflection"&&(!window.ReflectionCombat||!window.ReflectionStage))throw new Error("Missing diner encounter");
    if((chapter==="reflection"||options.journeyMode==="story"||options.survivorEdition)&&!window.SurvivorSkills)throw new Error("Missing survivor-skills.js");
    options.chapter=chapter;options.stage=chapter==="diner"?1:["seats","reflection"].includes(chapter)?8:2;options.finale=chapter==="seats";
  }
  if(options.finale){document.body.classList.add("finale");ui.view.setAttribute("aria-label","Boardroom finale. Click the floor to move or a seat to attack. Use 1 for Shield Rush and 2 for Thunder Slam.");}
  if(options.chapter==="reflection")document.body.classList.add("reflection","survivor");
  if(options.chapter==="reflection"||options.journeyMode==="story"||options.survivorEdition){
    const skillHint={reflection:" Leave the marked ground, then return for two counters. Use 1 for Cyclone Guard or 2 for Thunder Leap.",diner:"",arcade:" Press 1 for Gauntlet Cyclone.",cuda:" Click or tap a ringed rival, then a different nearby ringed rival, to restore CUDA and Gauntlet Cyclone.",seats:" Press 1 for Cyclone Guard or 2 for Thunder Leap."};
    ui.view.setAttribute("aria-label","Move with WASD, arrows or the floor. Strike nearby rivals automatically. Tap a rival to focus."+skillHint[options.chapter]);
  }
  if(B.Engine.Version!==C.engine)throw new Error("Requires Babylon "+C.engine+"; found "+B.Engine.Version);
  ui.bootText.textContent="Initializing WebGL and local Havok WASM…";ui.progress.value=10;
  const engine=new B.Engine(ui.view,true,{stencil:true,preserveDrawingBuffer:false,powerPreference:"high-performance"},false);
  if(engine.webGLVersion<2){engine.dispose();throw new Error("WebGL 2 is required");}
  const scene=new B.Scene(engine);scene.useRightHandedSystem=true;
  const embedded=document.getElementById("embeddedPhysics");
  const havok=await window.HavokPhysics(embedded?{wasmBinary:Uint8Array.from(atob(embedded.textContent.trim()),c=>c.charCodeAt(0))}:{locateFile:()=>"./vendor/HavokPhysics.wasm"}),plugin=new B.HavokPlugin(true,havok);scene.enablePhysics(V(0,C.gravity,0),plugin);
  if(!scene.getPhysicsEngine()||typeof plugin.executeStep!=="function"||!B.CharacterSupportedState)throw new Error("Physics V2 interface mismatch");
  scene.physicsEnabled=false;scene.animationsEnabled=false;app=new Training(engine,scene,plugin,options);
  engine.runRenderLoop(()=>{try{app.frame(performance.now());}catch(e){fail(e);}});await app.load();
})().catch(fail);
})();
