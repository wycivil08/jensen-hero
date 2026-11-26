(function (global) {
"use strict";
// Presentation only: all positions, attack phases and counter results come from the encounter.
const B=global.BABYLON, M=global.R20Models, V=(x=0,y=0,z=0)=>new B.Vector3(x,y,z);
function create(scene, options={}) {
  const root=new B.TransformNode("reflection-diner-stage",scene),materials=[],textures=[],tints=[],lights=[];
  const wx=options.window?.x||0,wz=options.window?.z??-6.4;
  const mat=(name,hex,emit=0,alpha=1)=>{
    const m=new B.StandardMaterial("reflection-"+name,scene);m.diffuseColor=B.Color3.FromHexString(hex).toLinearSpace().scale(.65);m.specularColor=new B.Color3(.05,.065,.07);m.maxSimultaneousLights=6;
    m.emissiveColor=B.Color3.FromHexString(hex).toLinearSpace().scale(emit*.65);m.alpha=alpha;m.backFaceCulling=false;materials.push(m);return m;
  };
  const cream=mat("warm-porcelain","#c9b497"),red=mat("oxblood-vinyl","#842c31"),seam=mat("vinyl-seams","#b56852"),wood=mat("old-walnut","#41322c"),chrome=mat("brushed-chrome","#80949c"),dark=mat("night-blue","#31516a",.75),brass=mat("window-brass","#b08b55"),warm=mat("lamplight","#ffd090",.85),cold=mat("cold-glass-edge","#80c6de",.5),rainMat=mat("rain","#739caa",.25,.36),danger=mat("locked-danger","#ff9571",.58),frost=mat("aftershock","#afdfff",.85),recovery=mat("spent-glass","#518393",.18),amber=mat("hero-amber","#f5b760",.65),glass=mat("window-glass","#3e7684",.20,.11);
  const box=(name,size,x,y,z,material,parent=root)=>{
    const mesh=M.roundedBox(scene,"reflection-"+name,size,.025,material,parent);mesh.position.set(x,y,z);mesh.isPickable=false;return mesh;
  };
  const tube=(name,path,radius,material,parent=root)=>{
    const mesh=B.MeshBuilder.CreateTube("reflection-"+name,{path,radius,tessellation:5},scene);mesh.parent=parent;mesh.material=material;mesh.isPickable=false;return mesh;
  };
  const cylinder=(name,diameter,height,x,y,z,material)=>{
    const mesh=B.MeshBuilder.CreateCylinder("reflection-"+name,{diameter,height,tessellation:24},scene);mesh.parent=root;mesh.position.set(x,y,z);mesh.material=material;mesh.isPickable=false;return mesh;
  };
  const ring=(name,radius,thickness,material,parent=root)=>{
    const mesh=B.MeshBuilder.CreateTorus("reflection-"+name,{diameter:radius*2,thickness,tessellation:64},scene);mesh.parent=parent;mesh.material=material;mesh.isPickable=false;return mesh;
  };
  // A scuffed diner floor has no raised geometry in the playable rectangle.
  const floorTex=new B.DynamicTexture("reflection-floor-tile",{width:1024,height:768},scene,false),ctx=floorTex.getContext();textures.push(floorTex);
  ctx.fillStyle="#302f30";ctx.fillRect(0,0,1024,768);
  for(let z=0;z<24;z++)for(let x=0;x<32;x++){
    ctx.fillStyle=(x+z)%2?"#30353a":"#514b43";ctx.fillRect(x*32+1,z*32+1,30,30);
  }
  ctx.fillStyle="#4b4842";ctx.fillRect(244,0,536,768);
  ctx.fillStyle="#735a42";for(const x of[235,784])ctx.fillRect(x,0,3,768);
  ctx.globalAlpha=.1;for(let n=0;n<90;n++){ctx.fillStyle=n%2?"#ede3ce":"#1b2830";ctx.fillRect((n*173)%1024,(n*83)%768,2+(n%7)*8,1);}ctx.globalAlpha=1;floorTex.update(false);
  const floorMat=mat("tile-floor","#ffffff");floorMat.diffuseTexture=floorTex;floorMat.specularColor=new B.Color3(.10,.14,.16);floorMat.specularPower=48;
  const floor=B.MeshBuilder.CreateGround("reflection-diner-floor",{width:17,height:14},scene);floor.parent=root;floor.position.y=.006;floor.material=floorMat;floor.receiveShadows=true;floor.isPickable=false;
  // Deep exterior makes the window read as a place rather than a floating effect.
  box("midnight-exterior",[12.4,4,.12],wx,1.85,wz-.50,dark);
  for(const [x,h,w]of[[-5,1.8,.8],[-3.6,2.7,1.2],[-2.1,1.3,.8],[1.8,2.2,1.3],[3.8,2.8,1.4],[5.2,1.4,.7]]){
    box("city-silhouette",[w,h,.05],wx+x,h*.5,wz-.38,wood);
    for(let j=0;j<3;j++)box("city-window",[.09,.16,.03],wx+x-.2+(j%2)*.32,.5+j*.46,wz-.33,j===1?warm:cold);
  }
  box("window-glass",[11.5,3.1,.035],wx,1.9,wz,glass);
  for(const x of[-5.87,5.87])box("window-upright",[.15,3.8,.24],wx+x,1.86,wz,chrome);
  for(const y of[.15,3.52])box("window-horizontal",[11.9,.16,.29],wx,y,wz,brass);
  for(const x of[-3.9,3.9])box("window-mullion",[.085,3.25,.12],wx+x,1.83,wz+.04,chrome);
  box("window-sill",[12,.12,.62],wx,.18,wz+.12,cream);
  box("wall-below-window",[12.2,.22,.18],wx,.07,wz+.15,red);
  const windowLight=box("window-soft-strip",[11.6,.024,.04],wx,3.38,wz+.16,cold);
  const rain=[];
  for(let i=0;i<46;i++){
    const x=-5.5+((i*79)%109)/10,z=wz-.13-((i*13)%4)*.025;
    const drop=tube("rain-streak",[V(0,0,0),V(-.035,-.23-(i%4)*.08,0)],.008,rainMat);
    drop.position.set(wx+x,.45+(i*37%290)/100,z);rain.push({mesh:drop,x:wx+x,seed:i*1.71});
  }
  // Booths, tables, and the empty chair stay beyond the movement boundary x=±5.25.
  for(const side of[-1,1]){
    const x=side*7.1;
    for(const z of[-2.4,1.55]){
      box("booth-plinth",[1.65,.22,2.7],x,.12,z,wood);
      box("booth-seat",[1.6,.34,2.65],x,.38,z,red);
      box("booth-back",[.24,1.28,2.75],x+side*.72,.91,z,red);
      box("booth-chrome-cap",[.26,.075,2.8],x+side*.72,1.55,z,chrome);
      for(const dz of[-.88,0,.88])box("seat-piping",[1.5,.018,.026],x,.558,z+dz,seam);
      for(const dz of[-.8,0,.8])box("booth-tuft",[.018,.80,.018],x+side*.584,.96,z+dz,seam);
      for(const y of[.64,1.22])box("booth-piping",[.018,.025,2.66],x+side*.584,y,z,seam);
      box("tabletop",[1.03,.11,1.3],x-side*.95,.94,z,cream);
      cylinder("table-pedestal",.14,.83,x-side*.95,.47,z,chrome);
      cylinder("table-foot",.66,.06,x-side*.95,.06,z,chrome);
    }
    // Hanging lamps supply warm islands without obscuring either fighter.
    cylinder("pendant",.82,.13,x,3.05,-1.2,red);
    cylinder("pendant-diffuser",.66,.035,x,2.97,-1.2,warm);
    tube("pendant-cord",[V(x,3.12,-1.2),V(x,4,-1.2)],.014,wood);
    const lamp=new B.PointLight("reflection-warm-booth-"+side,V(x,2.65,-.6),scene);lamp.diffuse=new B.Color3(1,.60,.28);lamp.intensity=.85;lamp.range=5;lights.push(lamp);
    box("side-wall-wainscot",[.18,1.7,10],x+side*1.7,.85,-.1,wood);
    box("side-wall-brass",[.20,.055,10],x+side*1.7,1.67,-.1,brass);
  }
  // Cool window light falls across polished tile; low opacity keeps tells readable.
  const sheenTex=new B.DynamicTexture("reflection-window-reflection",{width:512,height:256},scene,false);textures.push(sheenTex);sheenTex.hasAlpha=true;
  const sc=sheenTex.getContext(),fade=sc.createLinearGradient(0,0,0,256);fade.addColorStop(0,"rgba(86,146,164,.30)");fade.addColorStop(.7,"rgba(55,99,119,.07)");fade.addColorStop(1,"rgba(35,66,80,0)");sc.fillStyle=fade;sc.fillRect(0,0,512,256);
  sc.globalCompositeOperation="destination-out";sc.fillStyle="rgba(0,0,0,.8)";for(const x of[86,172,340,426])sc.fillRect(x,0,4,256);sc.globalCompositeOperation="source-over";sheenTex.update(false);
  const sheenMat=mat("window-floor-sheen","#7399a5",.10,.3);sheenMat.diffuseTexture=sheenTex;sheenMat.useAlphaFromDiffuseTexture=true;
  const sheen=B.MeshBuilder.CreateGround("reflection-window-floor-light",{width:10.4,height:3.2},scene);sheen.parent=root;sheen.position.set(wx,.014,wz+2);sheen.rotation.y=Math.PI;sheen.material=sheenMat;sheen.isPickable=false;
  const seatX=6.15,seatZ=3.3;
  box("empty-chair-seat",[.79,.12,.72],seatX,.54,seatZ,wood);
  box("empty-chair-back",[.8,.76,.10],seatX,.99,seatZ+.32,red);
  for(const x of[-.30,.30])for(const z of[-.26,.26])box("empty-chair-leg",[.065,.52,.065],seatX+x,.26,seatZ+z,chrome);
  const tray=box("coffee-tray",[.69,.045,.52],6.12,1.025,1.55,chrome);tray.rotation.y=.15;
  cylinder("coffee-cup",.22,.23,6.10,1.16,1.55,cream);cylinder("coffee-surface",.17,.009,6.10,1.281,1.55,wood);
  const handle=ring("cup-handle",.09,.025,cream);handle.rotation.x=Math.PI/2;handle.position.set(6.24,1.17,1.55);
  // Thin, cold shards stay in the window; they never become walkable obstacles.
  const cracks=new B.TransformNode("reflection-glass-cracks",scene);cracks.parent=root;cracks.setEnabled(false);
  for(let i=0;i<14;i++){
    const a=i*2.39996,x=Math.cos(a)*(1.4+i*.19),y=1.8+Math.sin(a)*1.1;
    tube("fracture",[V(wx-.3,1.6,wz+.08),V(wx+x*.45,y*.8+.25,wz+.08),V(wx+x,y,wz+.08)],.012,cold,cracks);
  }
  const shards=[];
  for(let i=0;i<12;i++){
    const x=-4.5+i*.82,y=.6+(i*37%200)/100;
    const mesh=box("cold-shard",[.30+(i%3)*.09,.7,.025],wx+x,y,wz+.11,cold,cracks);mesh.rotation.z=(i%2?1:-1)*(.17+(i%4)*.1);shards.push({mesh,y});
  }
  // These markers are purely state projections. The encounter owns locked targets and damage.
  const tellRoot=new B.TransformNode("reflection-locked-landing",scene);tellRoot.parent=root;
  const edge=ring("locked-radius",1,.045,danger,tellRoot),inner=ring("locked-inner",.93,.013,danger,tellRoot),wave=ring("landing-wave",1,.045,frost,tellRoot);
  const cross=[];for(const x of[-1,1])cross.push(box("landing-cross",[.18,.018,.045],x*.85,.012,0,danger,tellRoot));
  const bolts=[];for(let i=0;i<4;i++){
    const a=i*Math.PI/2,x=Math.cos(a)*.65,z=Math.sin(a)*.65;
    bolts.push(tube("aftershock-bolt",[V(x,.04,z),V(x+.10,.45,z-.05),V(x-.05,.72,z+.08),V(x+.04,1.05,z)],.019,frost,tellRoot));
  }
  const heroCue=ring("amber-hero",.49,.025,amber),echoCue=ring("silver-echo",.52,.025,cold);
  tellRoot.setEnabled(false);heroCue.setEnabled(false);echoCue.setEnabled(false);
  // Clone actor materials so the shared mature-hero palette and future retries remain unchanged.
  if(options.echo)for(const mesh of options.echo.meshes||[]){
    const original=mesh.material;if(!original)continue;
    let entry=tints.find(t=>t.original===original);
    if(!entry){const copy=original.clone("reflection-echo-"+original.name);entry={original,copy,meshes:[]};tints.push(entry);
      if(copy.albedoColor)copy.albedoColor=B.Color3.Lerp(copy.albedoColor,new B.Color3(.42,.68,.78),.62);
      if(copy.diffuseColor)copy.diffuseColor=B.Color3.Lerp(copy.diffuseColor,new B.Color3(.42,.68,.78),.62);
      copy.emissiveColor=new B.Color3(.025,.075,.10);if("metallic"in copy)copy.metallic=Math.min(.8,(copy.metallic||0)+.3);
    }entry.meshes.push(mesh);mesh.material=entry.copy;
  }
  let age=0,previousElapsed=null,disposed=false;
  function update(view={}){
    if(disposed)return;
    // elapsed belongs to the current encounter phase; continuous rain does not advance combat.
    const elapsed=Number.isFinite(view.elapsed)?view.elapsed:0;
    age+=previousElapsed===null?.016:Math.max(0,Math.min(.05,elapsed>=previousElapsed?elapsed-previousElapsed:.016));previousElapsed=elapsed;
    const phase=view.phase||"preview",progress=Math.min(1,Math.max(0,view.progress??(view.duration?elapsed/view.duration:0))),radius=Math.max(.1,view.radius||1.6);
    rain.forEach(({mesh,x,seed})=>mesh.position.set(x,.45+((seed-age*1.1)%2.9+2.9)%2.9,wz-.13));
    const active=["tell","strike","aftershock","recovery"].includes(phase),target=view.target||view.hero||{x:0,z:0};
    tellRoot.setEnabled(active);tellRoot.position.set(target.x,.035,target.z);tellRoot.scaling.set(radius,1,radius);
    const spent=phase==="recovery"||phase==="aftershock"&&view.move!=="leap"&&view.move!=="cyclone";
    edge.material=inner.material=spent?recovery:phase==="tell"?danger:frost;
    edge.visibility=spent?.4:1;inner.visibility=phase==="tell"?.25+.65*progress:.35;
    wave.setEnabled(phase==="strike"||phase==="aftershock"&&!spent);const waveScale=phase==="strike"?.2+.8*progress:.96+.04*Math.sin(elapsed*7);wave.scaling.set(waveScale,1,waveScale);
    cross.forEach(mesh=>mesh.setEnabled(phase==="tell"));
    bolts.forEach((mesh,i)=>{mesh.setEnabled(phase==="aftershock"&&view.move==="leap");mesh.visibility=.5+.35*Math.sin(elapsed*16+i);});
    for(const [cue,actor]of[[heroCue,view.hero],[echoCue,view.boss]]){cue.setEnabled(!!actor&&phase!=="return");if(actor)cue.position.set(actor.x,.039,actor.z);}
    cracks.setEnabled((view.counters||0)>=2||phase==="return");
    shards.forEach(({mesh,y},i)=>{mesh.position.y=y+(phase==="return"?Math.sin(progress*Math.PI)*.12*(i%2?1:-1):0);mesh.visibility=.40+.12*(i%3);});
    glass.alpha=phase==="preview"?.08:phase==="return"?.23:.12;
    windowLight.visibility=phase==="aftershock"&&view.move==="leap"?.62:phase==="preview"?.65+.35*progress:1;
  }
  function dispose(){if(disposed)return;disposed=true;
    tints.forEach(({original,copy,meshes})=>{meshes.forEach(mesh=>{if(!mesh.isDisposed()&&mesh.material===copy)mesh.material=original;});copy.dispose(false,false);});
    lights.forEach(light=>light.dispose());root.dispose(false,false);materials.forEach(m=>m.dispose(false,false));textures.forEach(t=>t.dispose());
  }
  return Object.freeze({update,dispose});
}
global.ReflectionStage=Object.freeze({create});
})(typeof window==="undefined"?globalThis:window);
