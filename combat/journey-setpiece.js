(function () {
"use strict";
const B=window.BABYLON,M=window.R20Models;
let current=null;
const key=chapter=>({1:"diner",2:"arcade",5:"cuda",8:"seats"}[chapter]||chapter);
function stage(scene,chapter){
  if(current){current.scene.onBeforeRenderObservable.remove(current.observer);current.root.dispose(false,false);current.materials.forEach(m=>m.dispose(false,true));current=null;}
  chapter=key(chapter);
  if(!["diner","arcade","cuda"].includes(chapter))return;
  const root=new B.TransformNode("journey-setpiece",scene),materials=[];
  const mat=(name,color,glow=false)=>{
    const m=new B.StandardMaterial("journey-"+name,scene);m.diffuseColor=B.Color3.FromHexString(color);m.specularColor=B.Color3.Black();
    if(glow)m.emissiveColor=m.diffuseColor.scale(.6);materials.push(m);return m;
  };
  const cream=mat("porcelain","#e6d5b4"),red=mat("diner-vinyl","#9f3c36"),dark=mat("charcoal","#202b2e"),steel=mat("chrome","#94a6a6"),gold=mat("warm-brass","#bd9559");
  const green=mat("startup-green","#4b7e18",true),off=mat("screen-off","#172325"),on=mat("screen-on","#54ce91",true);
  const box=(name,size,x,y,z,material,parent=root)=>{
    const mesh=M.roundedBox(scene,"journey-"+name,size,.035,material,parent);mesh.position.set(x,y,z);mesh.isPickable=false;return mesh;
  };
  const state=current={scene,chapter,root,materials,screens:[],pixels:[],staff:null,age:0,won:false,observer:null};
  const floor=scene.getMeshByName("floor");
  if(floor){
    const texture=new B.DynamicTexture("journey-floor-pattern",{width:1024,height:640},scene,false),ctx=texture.getContext();
    texture.hasAlpha=true;
    const diner=chapter==="diner";
    ctx.fillStyle=diner?"rgba(171,149,119,.98)":"rgba(52,59,74,.98)";ctx.fillRect(0,0,1024,640);
    if(diner){
      for(let y=0;y<16;y++)for(let x=0;x<26;x++){
        ctx.fillStyle=(x+y)%2?"#aa9477":"#c4b294";ctx.fillRect(x*40,y*40,39,39);
      }
      ctx.fillStyle="#b7a689";ctx.fillRect(400,15,224,610);
      ctx.fillStyle="#824b3a";for(const x of [388,630])ctx.fillRect(x,15,6,610);
      ctx.strokeStyle="#704435";ctx.lineWidth=10;ctx.strokeRect(16,16,992,608);
    }else{
      ctx.strokeStyle="rgba(98,91,132,.30)";ctx.lineWidth=1;
      for(let y=24;y<640;y+=48)for(let x=24;x<1024;x+=48){ctx.beginPath();ctx.moveTo(x-8,y);ctx.lineTo(x,y-8);ctx.lineTo(x+8,y);ctx.lineTo(x,y+8);ctx.closePath();ctx.stroke();}
      ctx.strokeStyle="#407d87";ctx.lineWidth=5;ctx.strokeRect(20,20,984,600);
      ctx.strokeStyle="#705a94";ctx.lineWidth=4;for(const x of [330,694]){ctx.beginPath();ctx.moveTo(x,26);ctx.lineTo(x,150);ctx.lineTo(x+(x<512?-58:58),208);ctx.lineTo(x+(x<512?-58:58),432);ctx.lineTo(x,490);ctx.lineTo(x,614);ctx.stroke();}
    }
    texture.update(false);
    const surface=mat("floor-surface","#ffffff");surface.diffuseTexture=texture;surface.useAlphaFromDiffuseTexture=true;surface.transparencyMode=B.Material.MATERIAL_ALPHABLEND;
    const size=floor.getBoundingInfo().boundingBox.extendSizeWorld.scale(2);
    const overlay=B.MeshBuilder.CreateGround("journey-floor-overlay",{width:size.x-.45,height:size.z-.45},scene);
    overlay.parent=root;overlay.position.y=.012;overlay.material=surface;overlay.isPickable=false;overlay.receiveShadows=true;
  }
  // Substantial scenery stays beyond the existing north wall; combat solids and lanes stay intact.
  if(chapter==="diner"){
    box("diner-tile-border",[23,.025,.50],0,.018,-7.15,cream);
    for(const x of [-8.5,-4]){
      box("booth-back",[3.35,1.35,.35],x,.68,-9.1,red);
      box("booth-seat",[3.35,.30,.80],x,.32,-8.6,red);
      box("booth-top-trim",[3.4,.09,.37],x,1.33,-9.1,gold);
      box("booth-table",[2.3,.12,.65],x,.78,-7.95,cream);
      box("booth-pedestal",[.25,.72,.28],x,.36,-7.95,steel);
      for(const dx of [-.9,0,.9])box("vinyl-stitch",[.025,.9,.025],x+dx,.72,-8.91,gold);
    }
    box("service-counter",[5.7,.95,.85],5.2,.475,-8.05,red);
    box("counter-top",[5.95,.13,1.05],5.2,1.02,-8.05,cream);
    box("counter-front-trim",[5.7,.08,.035],5.2,.72,-7.61,gold);
    for(const x of [2.3,8.1])box("pass-upright",[.13,2.35,.18],x,1.18,-8.65,steel);
    box("kitchen-pass",[5.95,.23,.65],5.2,2.3,-8.65,cream);
    for(const x of [3.2,4.3,5.4])for(let i=0;i<3;i++){
      const plate=B.MeshBuilder.CreateCylinder("journey-counter-plate",{diameter:.48,height:.035,tessellation:20},scene);
      plate.parent=root;plate.position.set(x,1.12+i*.04,-8.03);plate.material=cream;plate.isPickable=false;
    }
    for(const id of ["server_ne","server_sw"]){
      const prop=scene.getTransformNodeByName(id);if(!prop)continue;
      const face=box("diner-counter-front",[.64,.88,.035],0,.65,.34,red,prop);
      const shelf=box("diner-porcelain-counter",[.76,.075,.75],0,1.29,0,cream,prop);
      root.onDisposeObservable.add(()=>{face.dispose();shelf.dispose();});
      for(let i=0;i<4;i++){
        const plate=B.MeshBuilder.CreateCylinder("journey-side-plate-stack",{diameter:.40,height:.035,tessellation:20},scene);
        plate.parent=prop;plate.position.set(0,1.35+i*.04,0);plate.material=cream;plate.isPickable=false;root.onDisposeObservable.add(()=>plate.dispose());
      }
    }
    // Reuse the same coworker model as the diner, without adding a gameplay actor or collider.
    const palette=M.createPalette(scene);materials.push(...Object.values(palette));
    state.staff=M.createActor(scene,"coworker","journey-serving-coworker",palette);state.staff.root.parent=root;
    state.staff.meshes.forEach(mesh=>mesh.isPickable=false);
    state.staff.root.position.set(-5,0,-3.2);state.staff.root.setEnabled(false);
    box("carried-tray",[.65,.045,.44],0,.82,.43,steel,state.staff.root);
    for(const x of [-.17,.17])box("served-cup",[.14,.18,.14],x,.93,.43,cream,state.staff.root);
  }else{
    box("arcade-green-border",[23,.025,.15],0,.019,-7.15,green);
    for(const x of [-8,-4,0,4,8]){
      box("arcade-cabinet",[1.9,1.85,.85],x,.925,-8.2,dark);
      box("arcade-marquee",[2,.24,.95],x,1.95,-8.2,green);
      box("screen-bezel",[1.65,1,.10],x,1.31,-7.73,steel);
      state.screens.push(box("arcade-display",[1.46,.82,.035],x,1.31,-7.66,off));
      box("control-deck",[1.9,.12,.43],x,.75,-7.58,dark);
      box("joystick",[.065,.18,.065],x-.4,.89,-7.52,red);
      for(const dx of [.23,.45])box("arcade-button",[.10,.06,.10],x+dx,.85,-7.50,green);
      for(const [dx,dy] of [[-.3,.13],[0,.13],[.3,.13],[-.15,-.04],[.15,-.04],[-.3,-.22],[.3,-.22]]){
        const pixel=box("parallel-screen-pixel",[.16,.12,.015],x+dx,1.31+dy,-7.63,on);pixel.setEnabled(false);state.pixels.push(pixel);
      }
    }
    // Existing server solids already carry the close-up arcade dressing in the training scene.
    for(const id of ["server_ne","server_sw"]){
      const prop=scene.getTransformNodeByName(id);if(!prop)continue;
      const panel=box("local-arcade-display",[.58,.48,.035],0,.92,.526,off,prop);state.screens.push(panel);
      const marquee=box("local-arcade-marquee",[.72,.14,.64],0,1.28,0,green,prop);
      const trim=box("local-arcade-control-trim",[.72,.07,.035],0,.59,.54,steel,prop);
      // These parented panels must be cleaned with this setpiece, rather than with the prop.
      root.onDisposeObservable.add(()=>{panel.dispose();marquee.dispose();trim.dispose();});
    }
  }
  state.observer=scene.onBeforeRenderObservable.add(()=>{
    if(!state.won||!state.staff)return;
    state.age+=Math.min(scene.getEngine().getDeltaTime()/1000,.05);
    const t=Math.min(state.age/5,1);state.staff.root.position.x=-5+t*10;state.staff.root.rotation.y=Math.PI/2;
    state.staff.pose({time:state.age,travel:state.age*2,speed:t<1?2:0,reactAge:99});
    for(const [side,sign] of [["l",1],["r",-1]]){
      const arm=state.staff.limbs[side];arm.shoulder.rotation.set(-.55,0,sign*.1);arm.elbow.rotation.x=-1;
    }
  });
}
function cleared(chapter){
  const state=current;if(!state||key(chapter)!==state.chapter||state.won)return;
  state.won=true;
  if(state.staff)state.staff.root.setEnabled(true);
  if(state.chapter==="cuda"){
    const on=state.materials.find(m=>m.name==="journey-screen-on");state.screens.forEach(m=>m.material=on);state.pixels.forEach(m=>m.setEnabled(true));
  }
}
window.JourneySetpiece=Object.freeze({stage,cleared});
})();
