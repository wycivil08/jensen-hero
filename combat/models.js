(function () {
"use strict";
const B = window.BABYLON, V = (x=0,y=0,z=0) => new B.Vector3(x,y,z);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
function createPalette(scene) {
  const p={};
  const add=(name,hex,rough=.75,metal=0,emit=null)=>{
    const m=new B.PBRMaterial("r20-"+name,scene);
    m.albedoColor=B.Color3.FromHexString(hex).toLinearSpace();m.roughness=rough;m.metallic=metal;
    if(emit)m.emissiveColor=B.Color3.FromHexString(emit);
    p[name]=m;return m;
  };
  add("skin","#e5ad79",.9);add("nose","#dc9d6a",.88);add("eye","#252a29",.6);
  add("leather","#191d1c",.88,0);add("lapel","#303633",.90,0);
  add("pants","#282b29",.90);add("shoe","#242826",.78);add("seam","#484e48",.86);
  add("hair","#a5aaa9",.92);add("hairShade","#858d8e",.94);add("hairDark","#62432f",.95);add("hairBlack","#292b29",.94);
  add("shirt","#e3d5b6",.92);add("founder","#34403b",.84);add("teal","#467a70",.9);add("suit","#333b4b",.87);add("suitLight","#646477",.88);add("paper","#e7dcc2",.95);add("gpu","#344341",.6,.22);add("wire","#60965b",.7);
  add("red","#af3932",.86);add("redTrim","#92322d",.85);
  add("steel","#a8adac",.46,.55);add("edge","#d3d5d0",.38,.5);
  add("wafer","#44494c",.7,.18);add("gold","#d5b877",.58,.28);
  add("dark","#292d30",.88,.02);add("armor","#353a3c",.84,.025);
  add("orange","#cf6127",.86,.015);add("amber","#ffba40",.6,0,"#ce6816");
  add("wall","#d2b99a",.96);add("wallTop","#e3c7a8",.96);add("soil","#6a6550",1);
  add("leaf","#6b8c37",.97);add("leafLight","#819d43",.98);add("leafDark","#53732f",.98);
  add("wood","#b2773d",.90);add("woodEdge","#89562e",.94);add("tableLeg","#4d5045",.88);
  add("boxGray","#777b83",.8,.06);add("boxYellow","#eeb03a",.73,.05);
  add("boxLid","#ffd066",.75);add("server","#53565b",.78,.07);
  return p;
}
function node(scene,name,parent,pos) {
  const n=new B.TransformNode(name,scene);n.parent=parent||null;if(pos)n.position.copyFrom(pos);return n;
}
function roundedBox(scene,name,size,radius,material,parent=null) {
  const h=size.map(v=>v*.5),r=Math.min(radius,Math.min(...h)-.001),positions=[],normals=[],uvs=[],indices=[];
  const faces=[[[1,0,0],[0,0,-1],[0,1,0],0,2,1],[[-1,0,0],[0,0,1],[0,1,0],0,2,1],
    [[0,1,0],[1,0,0],[0,0,-1],1,0,2],[[0,-1,0],[1,0,0],[0,0,1],1,0,2],
    [[0,0,1],[1,0,0],[0,1,0],2,0,1],[[0,0,-1],[-1,0,0],[0,1,0],2,0,1]];
  const coord=half=>[-half,-half+r,0,half-r,half];
  for(const [normal,u,v,axis,ua,va] of faces){
    const us=coord(h[ua]),vs=coord(h[va]),base=positions.length/3;
    for(let j=0;j<5;j++)for(let i=0;i<5;i++){
      const p=normal.map((n,k)=>n*h[axis]+u[k]*us[i]+v[k]*vs[j]);
      const c=p.map((q,k)=>clamp(q,-h[k]+r,h[k]-r));
      let d=p.map((q,k)=>q-c[k]),length=Math.hypot(...d);d=d.map(q=>q/length);
      positions.push(...c.map((q,k)=>q+d[k]*r));normals.push(...d);uvs.push(i/4,j/4);
    }
    for(let j=0;j<4;j++)for(let i=0;i<4;i++){
      // Match Babylon built-in outward-face winding in a right-handed scene.
      // Normals are already outward; reversing them would hide the real defect.
      const a=base+j*5+i;indices.push(a,a+6,a+1,a,a+5,a+6);
    }
  }
  const mesh=new B.Mesh(name,scene),data=new B.VertexData();
  data.positions=positions;data.normals=normals;data.uvs=uvs;data.indices=indices;data.applyToMesh(mesh);
  mesh.parent=parent;mesh.material=material;mesh.isPickable=false;mesh.receiveShadows=true;return mesh;
}
function egg(scene,name,size,pos,mat,parent) {
  const m=B.MeshBuilder.CreateSphere(name,{diameter:1,segments:name==="head"?10:8},scene);
  m.scaling.set(...size);m.position.copyFrom(pos);m.parent=parent;m.material=mat;m.isPickable=false;m.receiveShadows=true;return m;
}
function box(scene,name,size,pos,mat,parent,r=.06) {
  const m=roundedBox(scene,name,size,r,mat,parent);m.position.copyFrom(pos);return m;
}
function cylinder(scene,name,diameter,height,pos,mat,parent,segments=24) {
  const m=B.MeshBuilder.CreateCylinder(name,{diameter,height,tessellation:segments},scene);
  m.parent=parent;m.position.copyFrom(pos);m.material=mat;m.isPickable=false;m.receiveShadows=true;return m;
}
function softLimb(scene,name,height,radius,pos,mat,parent) {
  const m=B.MeshBuilder.CreateCapsule(name,{height,radius,tessellation:12,capSubdivisions:3,subdivisions:1},scene);
  m.parent=parent;m.position.copyFrom(pos);m.material=mat;m.isPickable=false;m.receiveShadows=true;return m;
}
function tube(scene,name,path,radius,mat,parent) {
  const m=B.MeshBuilder.CreateTube(name,{path,radius,tessellation:6},scene);
  m.parent=parent;m.material=mat;m.isPickable=false;return m;
}
function compact(root) {
  const nodes=[root,...root.getChildTransformNodes(false)];
  for(const n of nodes){
    const groups=new Map();
    for(const m of n.getChildMeshes(true))if(m.parent===n&&m.getTotalVertices()>0){
      const list=groups.get(m.material)||[];list.push(m);groups.set(m.material,list);
    }
    for(const [material,list] of groups)if(list.length>1){
      list.forEach(m=>m.computeWorldMatrix(true));
      const merged=B.Mesh.MergeMeshes(list,true,true,undefined,false,false);
      if(merged){merged.setParent(n);merged.material=material;merged.isPickable=false;merged.receiveShadows=true;}
    }
  }
}
function glasses(scene,parent,p,narrow=false) {
  for(const sign of [-1,1]){
    const x=sign*(narrow?.108:.117),w=narrow?.082:.09,h=narrow?.048:.058,r=.018,pts=[];
    for(const [cx,cy,start] of [[x+w-r,h-r,0],[x-w+r,h-r,90],[x-w+r,-h+r,180],[x+w-r,-h+r,270]]){
      for(let i=0;i<=3;i++){const a=(start+i*30)*Math.PI/180;pts.push(V(cx+Math.cos(a)*r,cy+Math.sin(a)*r,.292));}
    }
    pts.push(pts[0]);tube(scene,"glasses-rim",pts,narrow?.009:.012,p.eye,parent);
    tube(scene,"glasses-temple",[V(sign*.20,.025,.29),V(sign*.255,.025,.09)],.011,p.eye,parent);
  }
  tube(scene,"glasses-bridge",[V(-.028,.012,.294),V(0,.025,.305),V(.028,.012,.294)],.011,p.eye,parent);
}
function sweptLock(scene,name,points,width,depth,mat,parent){
  const path=B.Curve3.CreateCatmullRomSpline(points,6).getPoints(),positions=[],indices=[],normals=[],uvs=[],sides=10;
  for(let i=0;i<path.length;i++){
    const t=i/(path.length-1),c=path[i],tangent=path[Math.min(i+1,path.length-1)].subtract(path[Math.max(0,i-1)]).normalize();
    const outward=V(c.x/.11,(c.y-.015)/.10,(c.z+.045)/.10).normalize();
    const across=B.Vector3.Cross(tangent,outward).normalize(),up=B.Vector3.Cross(across,tangent).normalize();
    const taper=Math.max(.035,Math.pow(Math.sin(Math.PI*t),.48));
    for(let j=0;j<=sides;j++){
      const a=j/sides*Math.PI*2,v=c.add(across.scale(Math.cos(a)*width*taper)).add(up.scale(Math.sin(a)*depth*taper));
      positions.push(v.x,v.y,v.z);uvs.push(j/sides,t);
      if(i<path.length-1&&j<sides){const k=i*(sides+1)+j;indices.push(k,k+1,k+sides+2,k,k+sides+2,k+sides+1);}
    }
  }
  B.VertexData.ComputeNormals(positions,indices,normals);
  const m=new B.Mesh(name,scene),data=new B.VertexData();data.positions=positions;data.indices=indices;data.normals=normals;data.uvs=uvs;data.applyToMesh(m);
  m.parent=parent;m.material=mat;m.isPickable=false;m.receiveShadows=true;return m;
}
function head(scene,parent,p,mature,lisa) {
  if(lisa)parent.scaling.set(.94,.96,1.02);
  egg(scene,"head",[.59,.62,.53],V(0,.015,0),p.skin,parent);
  egg(scene,"face-cheeks",[.49,.28,.31],V(0,-.105,.13),p.skin,parent);
  for(const sign of [-1,1]){
    egg(scene,"ear",[.12,.18,.13],V(sign*.277,-.005,-.01),p.skin,parent);
    egg(scene,"eye",[.045,.059,.026],V(sign*.112,-.018,.261),p.eye,parent);
  }
  egg(scene,"nose",[.07,.079,.066],V(0,-.078,.27),p.nose,parent);
  tube(scene,"mouth",[V(-.047,-.162,.246),V(0,-.17,.257),V(.047,-.162,.246)],.005,p.nose,parent);
  const hair=mature?p.hair:p.hairDark;
  if(mature){
    // The closed scalp sits under actual broad swept locks, never black score lines.
    const positions=[],indices=[],normals=[],uvs=[],rings=14,sides=40;
    for(let ring=0;ring<=rings;ring++)for(let i=0;i<=sides;i++){
      const phi=ring/rings*Math.PI/2,theta=i/sides*Math.PI*2,r=Math.sin(phi),front=Math.max(0,Math.cos(theta));
      const rim=lisa?-.245+.325*front:-.075+.205*front;
      const x=(lisa?.332:.322)*r*Math.sin(theta),z=-.045+(lisa?.312:.302)*r*Math.cos(theta);
      const y=.022+rim+((lisa?.329:.346)-rim)*Math.cos(phi);
      positions.push(x,y,z);uvs.push(i/sides,ring/rings);
      if(ring<rings&&i<sides){const a=ring*(sides+1)+i;indices.push(a,a+1,a+sides+2,a,a+sides+2,a+sides+1);}
    }
    B.VertexData.ComputeNormals(positions,indices,normals);
    const cap=new B.Mesh(lisa?"closed-neck-bob-scalp":"under-swept-lock-scalp",scene),data=new B.VertexData();
    data.positions=positions;data.indices=indices;data.normals=normals;data.uvs=uvs;data.applyToMesh(cap);
    cap.parent=parent;cap.material=hair;cap.isPickable=false;cap.receiveShadows=true;
    const locks=lisa?[
      [[-.24,.10,.21],[-.23,.29,.15],[-.15,.35,-.07],[-.17,.04,-.30]],
      [[-.15,.20,.26],[-.10,.36,.15],[.03,.35,-.06],[.12,-.04,-.31]],
      [[-.04,.21,.27],[.07,.34,.16],[.22,.26,-.04],[.29,-.10,-.20]],
      [[.10,.18,.24],[.24,.27,.13],[.32,.07,-.05],[.28,-.19,-.20]],
      [[-.29,-.04,.10],[-.33,.15,.00],[-.30,.13,-.19],[-.22,-.19,-.26]]
    ]:[
      [[-.28,.05,.10],[-.31,.20,.12],[-.21,.32,-.03],[-.11,.30,-.25]],
      [[-.21,.19,.24],[-.24,.34,.15],[-.11,.42,-.03],[.05,.29,-.26]],
      [[-.12,.25,.26],[-.12,.40,.16],[.01,.43,-.04],[.19,.23,-.24]],
      [[-.01,.27,.25],[.02,.41,.13],[.17,.38,-.07],[.28,.12,-.20]],
      [[.10,.24,.24],[.16,.36,.10],[.28,.23,-.07],[.29,.02,-.16]],
      [[.23,.13,.17],[.30,.23,.04],[.31,.10,-.13],[.24,-.06,-.23]],
      [[-.29,-.02,-.03],[-.31,.18,-.08],[-.24,.26,-.20],[-.08,.11,-.31]]
    ];
    locks.forEach((points,i)=>sweptLock(scene,(lisa?"bob-side-part-lock-":"broad-tapered-swept-lock-")+i,points.map(v=>V(...v)),lisa?.062:i===2?.065:.055,lisa?.032:.038,(i===0||i===locks.length-1)?p.hairShade:hair,parent));
    if(lisa)for(const sign of [-1,1])box(scene,"bob-neck-corner",[.105,.29,.23],V(sign*.25,-.085,-.13),p.hairShade,parent,.045);
    else for(const sign of [-1,1])box(scene,"gray-sideburn",[.070,.16,.12],V(sign*.272,-.025,.035),p.hairShade,parent,.025);
    glasses(scene,parent,p,lisa);
  }else{
    egg(scene,"hair-cap",[.61,.38,.54],V(0,.20,-.055),hair,parent);
    egg(scene,"brown-fringe",[.53,.24,.40],V(-.035,.16,.11),hair,parent).rotation.z=-.12;
  }
}
function shield(scene,hand,p) {
  const n=node(scene,"anatomical-right-wafer-shield",hand,V(-.12,.02,-.025));
  n.rotation.set(-.10,-.72,.04);
  const rim=cylinder(scene,"silver-wafer-rim",1.03,.095,V(),p.edge,n,48);rim.rotation.x=Math.PI/2;
  const disk=cylinder(scene,"carbon-wafer",.95,.105,V(0,0,.014),p.wafer,n,48);disk.rotation.x=Math.PI/2;
  for(let row=-2;row<=2;row++)for(let col=-2;col<=2;col++){
    const x=col*.16,y=row*.16;if(Math.hypot(x,y)>.37)continue;
    box(scene,"pale-gold-die",[.145,.145,.012],V(x,y,.072),p.gold,n,.008);
  }
  box(scene,"wafer-center-channel",[.87,.026,.014],V(0,0,.081),p.wafer,n,.005);
  box(scene,"shield-real-grip",[.27,.07,.09],V(0,0,-.09),p.shoe,n,.025);
  return n;
}
function hammer(scene,hand,p) {
  const grip=node(scene,"anatomical-left-thor-hammer",hand);
  const shaft=cylinder(scene,"hammer-grip",.080,.46,V(0,-.20,0),p.shoe,grip,12);
  for(const y of [-.02,-.10,-.18,-.26,-.34])cylinder(scene,"grip-wrap",.086,.017,V(0,y,0),p.steel,grip,12);
  // A deeper beveled head reads edge-on without moving the actual contact socket.
  box(scene,"short-silver-hammer",[.62,.36,.43],V(0,-.45,0),p.steel,grip,.055);
  for(const sign of [-1,1])box(scene,"hammer-faced-end",[.04,.31,.39],V(sign*.312,-.45,0),p.edge,grip,.02);
  box(scene,"hammer-head-band",[.085,.37,.44],V(0,-.45,0),p.dark,grip,.025);
  const contact=node(scene,"hammer-contact",grip,V(0,-.45,0));
  return {grip,contact,shaft};
}
function gpu(scene,hand,p) {
  const root=node(scene,"gpu-gauntlet",hand,V(0,-.035,.025));
  box(scene,"gpu-continuous-cuff",[.28,.26,.30],V(0,-.035,0),p.gpu,root,.07);
  box(scene,"gpu-knuckle",[.30,.12,.21],V(0,-.175,.03),p.steel,root,.045);
  for(const x of [-.075,.075]){
    const fan=cylinder(scene,"gpu-cooling-fan",.115,.018,V(x,-.025,.16),p.shoe,root,12);fan.rotation.x=Math.PI/2;
    const hub=cylinder(scene,"gpu-fan-hub",.035,.025,V(x,-.025,.172),p.steel,root,8);hub.rotation.x=Math.PI/2;
  }
  return root;
}
function combatShield(scene,hand,p,name="guard-shield"){
  const root=node(scene,name,hand,V(0,-.02,.09));
  box(scene,"sloping-shield",[.40,.78,.13],V(0,-.10,.06),p.armor,root,.10);
  box(scene,"shield-silver-spine",[.075,.69,.045],V(0,-.10,.14),p.steel,root,.025);
  box(scene,"shield-hand-grip",[.19,.08,.08],V(0,0,-.045),p.shoe,root,.025);return root;
}
function directorProp(scene,hand,p,seat){
  const root=node(scene,"seat-"+seat+"-meeting-device",hand);
  if([1,5].includes(seat)){
    box(scene,seat===1?"closed-investment-folio":"open-ledger",[.46,.32,.105],V(0,-.08,.10),p.shoe,root,.035);
    box(scene,"ledger-paper-edges",[.40,.27,.03],V(0,-.08,.165),p.paper,root,.015);
    if(seat===5)box(scene,"open-ledger-leaf",[.39,.27,.04],V(.34,-.08,.12),p.paper,root,.015).rotation.y=-.4;
  }else if([4,7,8].includes(seat)){
    const sides=seat===8?6:4,path=[];
    for(let i=0;i<=sides;i++){if(seat===4&&i===sides)break;const a=i/sides*Math.PI*2+Math.PI/4;path.push(V(Math.cos(a)*.25,-.08+Math.sin(a)*.32,.12));}
    tube(scene,seat===8?"hollow-hex-approval":"hollow-contract-frame",path,.035,p.steel,root);
  }else if(seat===6){
    cylinder(scene,"small-meeting-gavel-shaft",.045,.39,V(0,-.16,0),p.wood,root,10);
    box(scene,"small-meeting-gavel-head",[.21,.105,.10],V(0,-.35,0),p.woodEdge,root,.03);
    for(const x of [-.07,0,.07])egg(scene,"three-heal-charge-insets",[.035,.035,.025],V(x,-.35,.06),p.wire,root);
  }else if(seat===9){
    cylinder(scene,"meeting-pointer",.035,.76,V(0,-.30,0),p.steel,root,10);
    box(scene,"cuff-documents",[.24,.28,.06],V(.14,.02,0),p.paper,root,.015);
  }else if(seat===10){
    for(let i=0;i<5;i++){const page=box(scene,"folded-report-fan",[.115,.39,.035],V((i-2)*.072,-.12,.10),i%2?p.paper:p.suitLight,root,.01);page.rotation.z=(i-2)*-.22;}
  }else if(seat===2){
    const path=[];for(let i=0;i<=3;i++){const a=i/3*Math.PI*2;path.push(V(Math.cos(a)*.19,-.08+Math.sin(a)*.19,.13));}tube(scene,"three-spoke-approver",path,.035,p.steel,root);
  }else{
    for(const x of [-.15,.15])box(scene,"meeting-paper-ribbon",[.09,.62,.035],V(x,-.12,.10),p.paper,root,.012);
  }
  return root;
}
function human(scene,kind,id,p,options={}) {
  const hero=kind==="hero",lisa=kind==="amd_leader",director=kind.startsWith("director_"),ally=kind==="manager"||kind==="coworker";
  const guard=["diagonal_guard","shield_guard","shield_captain","heavy_guard"].includes(kind),mech=kind==="mech_boss",seated=kind==="socket_champion";
  const casual=["customer_brute","impatient_customer","tray_thrower","queue_rusher"].includes(kind),brute=kind==="customer_brute";
  const female=kind==="shield_captain"||kind==="disc_champion"||director&&[3,5,8,10].includes(options.seat);
  let stage=8,tray=false;const seat=options.seat||0;
  const root=node(scene,id),pelvis=node(scene,id+"-pelvis",root,V(0,.68,0));
  const torso=node(scene,id+"-torso",pelvis,V(0,.30,0)),headNode=node(scene,id+"-head",torso,V(0,.55,0));
  const cloth=hero?p.leather:director?p.suit:ally?(kind==="manager"?p.teal:p.red):brute?p.redTrim:casual?p.shirt:p.red,trim=hero?p.lapel:director?p.suitLight:brute?p.shirt:casual?p.woodEdge:p.redTrim;
  box(scene,"tailored-jacket-body",[.65,.65,.42],V(0,.08,0),cloth,torso,.15);
  box(scene,"jacket-hem",[.58,.19,.39],V(0,-.19,0),trim,torso,.085);
  egg(scene,"hip-trousers",[.50,.24,.36],V(0,-.035,-.01),p.pants,pelvis);
  box(scene,"undershirt",[.13,.39,.025],V(0,.05,.212),p.shoe,torso,.012);
  for(const sign of [-1,1]){
    const lapel=box(scene,"folded-lapel",[.12,.31,.055],V(sign*.115,.17,.216),trim,torso,.024);lapel.rotation.z=sign*.30;
    const collar=box(scene,"standing-collar",[.145,.13,.20],V(sign*.105,.35,.035),trim,torso,.035);collar.rotation.z=-sign*.20;
    const pocket=box(scene,"jacket-pocket",[.16,.027,.025],V(sign*.18,-.09,.217),trim,torso,.01);pocket.rotation.z=-sign*.15;
  }
  box(scene,"jacket-zipper",[.015,.33,.013],V(0,.005,.238),p.seam,torso,.004);
  const teenHead=hero?node(scene,"young-head-form",headNode):null,founderHead=hero?node(scene,"founder-head-form",headNode):null,matureHead=hero?node(scene,"mature-head-form",headNode):headNode;
  if(hero){head(scene,teenHead,{...p,hairDark:p.hairBlack},false,false);head(scene,founderHead,{...p,hair:p.hairBlack,hairShade:p.hairBlack},true,false);}
  head(scene,matureHead,p,hero||lisa||director&&seat===6,lisa);
  if(female&&!lisa)egg(scene,"tied-back-ponytail",[.20,.38,.24],V(.08,.12,-.30),p.hairDark,headNode);
  if(brute){torso.scaling.x=1.28;headNode.scaling.x=.9;box(scene,"brute-square-jaw",[.49,.18,.34],V(0,-.18,.06),p.skin,headNode,.06);}
  const apron=node(scene,"restaurant-apron",torso);
  if(hero||ally){box(scene,"cream-apron-front",[.43,.58,.055],V(0,-.035,.23),p.shirt,apron,.025);for(const x of [-.13,.13])box(scene,"apron-strap",[.035,.28,.035],V(x,.33,.22),p.shirt,apron,.01);}
  if(ally)tube(scene,"friendly-beard",[V(-.14,-.12,.23),V(0,-.22,.26),V(.14,-.12,.23)],.04,p.hairDark,headNode);
  if(director){
    box(scene,"white-shirt-front",[.18,.34,.035],V(0,.13,.24),p.paper,torso,.015);
    box(scene,"business-tie",[.052,.29,.025],V(0,.10,.267),seat%2?p.redTrim:p.teal,torso,.012);
    if([4,7].includes(seat))for(const sign of [-1,1])box(scene,"split-business-coattail",[.22,.37,.10],V(sign*.16,-.34,-.14),p.suit,torso,.035);
    if(seat===3)for(const sign of [-1,1])box(scene,"shoulder-paper-streamer",[.08,.50,.035],V(sign*.31,.05,-.06),p.paper,torso,.01);
  }
  const limbs={l:{},r:{}},hipSpread=hero?.245:.205;
  for(const [side,sign] of [["l",1],["r",-1]]){
    const a=limbs[side];
    a.shoulder=node(scene,side+"-shoulder",torso,V(sign*.335,.255,0));
    softLimb(scene,"continuous-upper-sleeve",.43,.139,V(0,-.135,0),cloth,a.shoulder);
    a.elbow=node(scene,side+"-elbow",a.shoulder,V(0,-.29,0));
    softLimb(scene,"continuous-elbow-to-cuff",.35,.122,V(0,-.095,0),cloth,a.elbow);
    a.hand=node(scene,side+"-hand",a.elbow,V(0,-.24,0));
    egg(scene,"hand",[.18,.20,.18],V(0,-.018,0),p.skin,a.hand);
    a.hip=node(scene,side+"-hip",pelvis,V(sign*hipSpread,-.07,0));
    softLimb(scene,"continuous-thigh",.44,.16,V(0,-.14,0),p.pants,a.hip);
    a.knee=node(scene,side+"-knee",a.hip,V(0,-.28,0));
    softLimb(scene,"continuous-knee-to-boot",.36,.137,V(0,-.09,0),p.pants,a.knee);
    a.foot=node(scene,side+"-foot",a.knee,V(0,-.23,.045));
    box(scene,"rounded-boot",[.34,.18,.46],V(0,-.025,.08),p.shoe,a.foot,.075);
    if(guard)box(scene,"charging-forearm-guard",[.30,.32,.30],V(0,-.13,.035),p.steel,a.elbow,.075);
  }
  const sockets={},equipment={};let weaponMount=null,shieldMount=null;
  sockets.leftFist=node(scene,"left-physical-fist",limbs.l.hand,V(0,-.10,.025));
  sockets.rightFist=node(scene,"right-physical-fist",limbs.r.hand,V(0,-.10,.025));
  sockets.weapon=node(scene,"actual-weapon-contact",limbs.l.hand,V(0,-.10,.025));
  if(hero){
    const h=hammer(scene,limbs.l.hand,p);weaponMount=h.grip;equipment.hammer=h.grip;
    shieldMount=shield(scene,limbs.r.hand,p);equipment.shield=shieldMount;
    equipment.leftGPU=gpu(scene,limbs.l.hand,p);equipment.rightGPU=gpu(scene,limbs.r.hand,p);
    equipment.tray=node(scene,"temporary-restaurant-tray",limbs.l.hand,V(0,-.12,.05));
    const platter=cylinder(scene,"silver-tray-face",.66,.045,V(),p.steel,equipment.tray,24);platter.rotation.x=Math.PI/2;
    equipment.wires=node(scene,"cuda-cuff-conduits",torso);
    for(const sign of [-1,1])tube(scene,"thin-green-parallel-wire",[V(sign*.19,.18,.23),V(sign*.29,.07,.24),V(sign*.30,-.08,.23)],.009,p.wire,equipment.wires);
    sockets.shield=shieldMount;
  }else if(ally||casual||kind==="runner"){
    if(kind==="tray_thrower"){const plate=cylinder(scene,"customer-held-plate",.43,.035,V(0,-.06,.08),p.paper,limbs.r.hand,20);plate.rotation.x=Math.PI/2;}
  }else if(director){
    weaponMount=directorProp(scene,limbs.r.hand,p,seat);sockets.weapon.parent=weaponMount;sockets.weapon.position.set(0,-.15,.16);
    sockets.muzzle=node(scene,"meeting-device-release",weaponMount,V(0,-.08,.24));
  }else if(mech){
    headNode.position.set(0,.18,.28);headNode.scaling.setAll(.58);
    box(scene,"curved-mech-chest",[1.04,.76,.52],V(0,.13,-.02),p.armor,torso,.20);
    box(scene,"open-pilot-cockpit",[.47,.41,.10],V(0,.26,.31),p.shoe,torso,.08);
    for(const [side,sign]of[["l",1],["r",-1]]){
      box(scene,"heavy-mech-shoulder",[.53,.43,.54],V(sign*.12,-.035,0),p.armor,limbs[side].shoulder,.13);
      box(scene,"single-root-mech-fist",[.58,.45,.53],V(0,-.12,.08),p.steel,limbs[side].hand,.13);
      cylinder(scene,"elbow-piston",.09,.32,V(sign*.13,-.10,-.12),p.steel,limbs[side].elbow,10);
    }
    sockets.weapon.position.set(0,-.27,.10);
  }else if(kind==="shield_captain"||kind==="shield_guard"){
    combatShield(scene,limbs.r.hand,p);if(kind==="shield_captain")combatShield(scene,limbs.l.hand,p,"captain-left-shield");
    sockets.weapon.position.set(0,-.15,.20);
  }else if(["disc_champion","disc_thrower","spear_thrower","arc_thrower"].includes(kind)){
    weaponMount=node(scene,"held-projectile-device",limbs.r.hand);
    if(kind==="disc_champion"){
      const path=[];for(let i=0;i<=24;i++){const a=.20*Math.PI+i/24*1.60*Math.PI;path.push(V(Math.cos(a)*.25,Math.sin(a)*.25,.08));}tube(scene,"open-return-disc",path,.0375,p.steel,weaponMount);
    }else if(kind==="arc_thrower")tube(scene,"curved-arc-launcher",[V(-.20,.08,.06),V(-.14,.19,.16),V(0,.23,.22),V(.14,.19,.16),V(.20,.08,.06)],.045,p.steel,weaponMount);
    else{const disc=cylinder(scene,"thin-held-throwing-disc",.32,.035,V(0,-.06,.09),p.steel,weaponMount,20);disc.rotation.x=Math.PI/2;}
    sockets.muzzle=node(scene,"actual-disc-release",weaponMount,V(0,-.06,.22));sockets.weapon.parent=weaponMount;sockets.weapon.position.set(0,-.06,.16);
    for(const sign of [-1,1])box(scene,"disc-waist-holster",[.19,.17,.08],V(sign*.24,-.19,.21),p.dark,torso,.04);
  }else if(guard){sockets.weapon.position.set(0,-.10,.14);
  }else if(seated){
    weaponMount=node(scene,"fixed-machine-beam-projector",root,V(0,.82,.54));
    box(scene,"machine-beam-housing",[.51,.30,.41],V(),p.dark,weaponMount,.08);
    const barrel=cylinder(scene,"machine-beam-nozzle",.23,.27,V(0,0,.30),p.steel,weaponMount,16);barrel.rotation.x=Math.PI/2;
    sockets.muzzle=node(scene,"actual-fixed-beam-muzzle",weaponMount,V(0,0,.45));sockets.weapon.parent=sockets.muzzle;sockets.weapon.position.setAll(0);
  }else{
    weaponMount=node(scene,"held-firearm",limbs.r.hand,V(0,-.01,.035));
    const small=kind==="light_gunner",sz=lisa?[.42,.34,.58]:small?[.16,.15,.38]:[.19,.16,.67];
    box(scene,"gun-receiver",sz,V(0,.04,.22),p.dark,weaponMount,.045);
    box(scene,"gun-stock",[.15,.18,.27],V(0,-.005,-.16),p.shoe,weaponMount,.045);
    for(const y of lisa?[-.09,.09]:[0]){
      const z=small?.43:lisa?.58:.64;
      const barrel=cylinder(scene,"gun-barrel",lisa?.15:.072,small?.12:.23,V(0,.04+y,z),p.steel,weaponMount,12);barrel.rotation.x=Math.PI/2;
      const bore=cylinder(scene,"dark-muzzle",lisa?.11:.048,.012,V(0,.04+y,z+.12),p.shoe,weaponMount,12);bore.rotation.x=Math.PI/2;
    }
    sockets.muzzle=node(scene,"actual-muzzle",weaponMount,V(0,.04,small?.56:lisa?.71:.78));sockets.weapon.parent=sockets.muzzle;sockets.weapon.position.setAll(0);
  }
  if(seated){
    const mount=node(scene,"fixed-arcade-machine-base",root);
    box(scene,"arcade-pedestal",[1.02,.49,.90],V(0,.24,-.04),p.armor,mount,.14);
    box(scene,"arcade-console",[1.08,.23,.54],V(0,.77,.27),p.dark,mount,.10);
    for(const sign of [-1,1]){box(scene,"console-armrest",[.16,.28,.60],V(sign*.43,.59,.15),p.steel,mount,.05);cylinder(scene,"visible-control-stick",.045,.20,V(sign*.30,.96,.36),p.shoe,mount,10);}
  }
  const neutral=()=>{
    pelvis.position.set(0,.68,0);pelvis.rotation.set(0,0,0);torso.rotation.set(0,0,0);headNode.rotation.set(0,0,0);
    for(const side of ["l","r"]){const a=limbs[side];for(const j of [a.shoulder,a.elbow,a.hand,a.hip,a.knee,a.foot])j.rotation.set(0,0,0);}
    limbs.l.shoulder.rotation.z=.12;limbs.r.shoulder.rotation.z=-.12;
    limbs.l.hip.position.x=hipSpread;limbs.r.hip.position.x=-hipSpread;
    if(hero){
      sockets.weapon.parent=limbs.l.hand;sockets.weapon.position.set(0,stage>=7?-.45:tray?-.12:stage>=2?-.205:-.10,tray?.10:stage>=7?0:.025);
      limbs.l.shoulder.rotation.x=-.38;limbs.l.elbow.rotation.x=-.50;headNode.rotation.y=-.30;shieldMount.rotation.y=-.72;
      // Keep the shield on the outside/back of the right arm, away from the left-hammer lane.
      limbs.r.shoulder.rotation.x=stage>=6?.25:-.38;limbs.r.shoulder.rotation.z=stage>=6?-.70:-.12;
      limbs.r.elbow.rotation.x=stage>=6?-.95:-.50;limbs.r.hand.rotation.x=stage>=6?.40:0;
    }else if(ally){
      limbs.l.shoulder.rotation.z=.36;limbs.r.shoulder.rotation.z=-.36;
      limbs.l.elbow.rotation.x=-.70;limbs.r.elbow.rotation.x=-.70;
    }else if(casual||kind==="runner"){
      limbs.l.shoulder.rotation.x=-.40;limbs.r.shoulder.rotation.x=-.40;limbs.l.elbow.rotation.x=-.85;limbs.r.elbow.rotation.x=-.85;
    }else if(director){
      limbs.r.shoulder.rotation.x=-.65;limbs.r.elbow.rotation.x=-.75;limbs.r.hand.rotation.x=.80;
      limbs.l.shoulder.rotation.x=-.15;limbs.l.elbow.rotation.x=-.35;
    }else if(guard){
      limbs.l.shoulder.rotation.x=-.9;limbs.r.shoulder.rotation.x=-.9;limbs.l.elbow.rotation.x=-.6;limbs.r.elbow.rotation.x=-.6;
    }else{
      limbs.r.shoulder.rotation.x=-1.0;limbs.r.elbow.rotation.x=-.48;limbs.r.hand.rotation.x=1.48;
      limbs.l.shoulder.rotation.x=-1.05;limbs.l.shoulder.rotation.z=-.27;limbs.l.elbow.rotation.x=-.62;
    }
    if(seated){for(const side of ["l","r"]){limbs[side].hip.rotation.x=-1.05;limbs[side].knee.rotation.x=1.25;limbs[side].foot.rotation.x=-.2;}pelvis.position.y=.66;}
    if(hero&&stage===8){torso.rotation.x=-.025;limbs.r.shoulder.rotation.x=.15;limbs.r.elbow.rotation.x=-1.0;}
  };
  neutral();compact(root);
  const clothMeshes=root.getChildMeshes(false).filter(m=>m.material===cloth),trimMeshes=root.getChildMeshes(false).filter(m=>m.material===trim);
  function setForm(nextStage=8,nextTray=false){
    if(!hero)return;
    if(!Number.isInteger(nextStage)||nextStage<1||nextStage>8)throw new RangeError("Hero stage must be an integer 1..8");
    stage=nextStage;tray=stage===1&&!!nextTray;
    teenHead.setEnabled(stage===1);founderHead.setEnabled(stage>=2&&stage<=5);matureHead.setEnabled(stage>=6);apron.setEnabled(stage===1);
    equipment.hammer.setEnabled(stage>=7);equipment.shield.setEnabled(stage>=6);equipment.leftGPU.setEnabled(stage>=2&&stage<=6);equipment.rightGPU.setEnabled(stage>=2&&stage<=5);equipment.tray.setEnabled(tray);equipment.wires.setEnabled(stage>=5&&stage<=6);
    for(const m of clothMeshes)m.material=stage===1?p.shirt:stage<=5?p.founder:p.leather;
    for(const m of trimMeshes)m.material=stage===1?p.woodEdge:stage<=5?p.founder:p.lapel;
    sockets.shield=stage>=6?shieldMount:null;
    sockets.weapon.parent=limbs.l.hand;sockets.weapon.position.set(0,stage>=7?-.45:tray?-.12:stage>=2?-.205:-.10,tray?.10:stage>=7?0:.025);
    model.metrics.weaponRadius=stage>=7?.28:tray?.30:stage>=2?.19:.12;
  }
  if(!sockets.muzzle)sockets.muzzle=sockets.weapon;
  const model={root,pelvis,torso,head:headNode,limbs,sockets,meshes:root.getChildMeshes(false),
    metrics:{height:mech?2.05:1.93,radius:mech?.58:brute?.42:hero?.32:.30,hurtLow:.28,hurtHigh:mech?1.70:1.56,hurtRadius:mech?.52:brute?.41:.32,weaponRadius:hero?.28:mech?.30:.16},
    setForm,
    pose(s){
      neutral();const time=s.time||0,speed=s.speed||0,cycle=(s.travel||0)*7.3,move=clamp(speed/3.8,0,1);
      pelvis.position.y+=Math.sin(time*2.1)*.008+Math.abs(Math.sin(cycle))*move*.025;
      torso.rotation.z=-clamp(s.yawRate||0,-3,3)*.012;torso.rotation.y=Math.sin(cycle)*move*.075;
      for(const [side,sign] of [["l",1],["r",-1]]){
        const a=limbs[side],swing=Math.sin(cycle)*sign*move;
        a.hip.rotation.x=swing*.55;a.knee.rotation.x=Math.max(0,-swing)*.60;
        a.foot.rotation.x=-a.hip.rotation.x-a.knee.rotation.x;
        if(!s.action)a.shoulder.rotation.x-=swing*.14;
      }
      const action=s.action&&!(s.action.duration>0&&s.action.age>=s.action.duration)?s.action:null;
      if(action&&hero){
        const t=action.age||0,kind=action.type,duration=action.duration||.45,hammered=stage>=7;
        const windup=action.windup??(kind==="skill2"?.18:kind==="skill1"?.08:hammered?.10:.08);
        const activeEnd=action.activeEnd??(kind==="skill2"?.42:kind==="skill1"?.26:hammered?.24:.19);
        const back=smooth(t/Math.max(.01,windup)),hit=smooth((t-windup)/Math.max(.01,activeEnd-windup)),recover=smooth((t-activeEnd)/Math.max(.01,duration-activeEnd));
        let drive=hit*(1-recover),load=back*(1-hit);let crouch=.35*load+.80*drive;
        if(kind==="basic"&&hammered){
          // The hammer crosses the front horizontally; slam below has its own vertical path.
          const sweep=hit*(1-recover);
          limbs.l.shoulder.rotation.x=-.38-1.04*back*(1-recover);
          limbs.l.shoulder.rotation.y=-.30*back*(1-recover)+.60*sweep;
          limbs.l.shoulder.rotation.z=.12+.18*drive;limbs.l.elbow.rotation.x=-.50+.20*back*(1-recover)-.25*load;
          limbs.l.hand.rotation.y=.20*drive;pelvis.rotation.y=-.10*load+.06*drive;
          torso.rotation.y=-.28*back*(1-recover)+.56*sweep;torso.rotation.x=.23*drive;
          sockets.weapon.parent=limbs.l.hand;sockets.weapon.position.set(0,-.45,0);
        }else if(kind==="skill2"&&hammered){
          const lift=smooth(t/Math.max(.01,windup*.5)),drop=smooth((t-windup*.45)/Math.max(.01,windup*.55));
          load=lift*(1-drop);drive=drop*(1-recover);
          limbs.l.shoulder.rotation.x=-.38-2.0*load-.15*drive;
          limbs.l.elbow.rotation.x=-.50-.25*load+.58*drive;
          limbs.l.shoulder.rotation.y=.08;limbs.l.shoulder.rotation.z=.12;
          torso.rotation.x=-.12*load+.34*drive;torso.rotation.y=-.12*load+.16*drive;
          crouch=.30*load+.63*drive;sockets.weapon.parent=limbs.l.hand;sockets.weapon.position.set(0,-.45,0);
        }else if(kind==="skill1"){
          torso.rotation.x=.30*back*(1-recover);pelvis.rotation.y=-.10*drive;
          for(const side of ["l","r"]){const a=limbs[side];a.shoulder.rotation.x=-.55-.85*back*(1-recover);a.elbow.rotation.x=-.70+.45*drive;}
          if(stage>=6){limbs.r.shoulder.rotation.x=-1.15;limbs.r.shoulder.rotation.z=-.24;limbs.r.elbow.rotation.x=-.35;limbs.l.shoulder.rotation.x=-.45;limbs.l.elbow.rotation.x=-1.0;}
          sockets.weapon.parent=stage>=6?shieldMount:limbs.l.hand;sockets.weapon.position.set(0,stage>=6?0:-.205,stage>=6?.08:.025);
        }else if(kind==="skill2"){
          for(const [side,sign]of[["l",1],["r",-1]]){const a=limbs[side];a.shoulder.rotation.x=-.60-.45*load;a.shoulder.rotation.z=sign*(.12+.62*drive);a.elbow.rotation.x=-1.0+.80*drive;}
          torso.rotation.x=.16*drive;pelvis.rotation.y=.12*drive;
          sockets.weapon.parent=limbs.l.hand;sockets.weapon.position.set(0,-.205,.025);
        }else if(kind==="basic"){
          const serial=Number(String(action.id||action.sequence||1).split(":").at(-1))||1;
          const side=stage===6||tray?"l":action.hand==="r"||action.hand!=="l"&&serial%2===0?"r":"l",a=limbs[side],sign=side==="l"?1:-1;
          a.shoulder.rotation.x=-.38-1.12*back*(1-recover);a.elbow.rotation.x=-.50-.60*load+.60*drive;a.shoulder.rotation.z=sign*.16;
          torso.rotation.y=sign*(-.18*load+.28*drive);torso.rotation.x=.20*drive;
          if(tray){a.shoulder.rotation.y=-.55*back+1.1*drive;a.hand.rotation.y=.45*drive;}
          sockets.weapon.parent=a.hand;sockets.weapon.position.set(0,tray?-.12:stage>=2?-.205:-.10,tray?.10:stage>=7?0:.025);
        }
        pelvis.position.y-=.18*crouch;pelvis.position.z=-.03*load+.10*drive;
        for(const [side,sign]of[["l",1],["r",-1]]){
          const a=limbs[side],forward=side==="l"?.36*drive:-.27*drive;
          a.hip.position.x=sign*(hipSpread+.085*crouch);
          const dy=pelvis.position.y-.07-.115,dz=.045+forward-pelvis.position.z,upper=.28,lower=Math.hypot(.23,.045),reach=clamp(Math.hypot(dy,dz),.08,upper+lower-.001);
          const bend=Math.PI-Math.acos(clamp((upper*upper+lower*lower-reach*reach)/(2*upper*lower),-1,1));
          a.hip.rotation.x=-Math.atan2(dz,dy)-Math.acos(clamp((upper*upper+reach*reach-lower*lower)/(2*upper*reach),-1,1));a.knee.rotation.x=bend+Math.atan2(.045,.23);a.foot.rotation.x=-a.hip.rotation.x-a.knee.rotation.x;
        }
        if(stage>=6&&kind!=="skill1"){limbs.r.shoulder.rotation.x=.20+.20*drive;limbs.r.elbow.rotation.x=-.95+.15*drive;shieldMount.rotation.y=-.72-.35*drive;}
        headNode.rotation.y=-.24-torso.rotation.y*.55;headNode.rotation.x=-.08*drive;
      }else if(action){
        const t=action.age,wind=action.windup||.65;
        if(["guardCharge","charge","shield_bash","shieldBash","heavyPunch","sweep","mechPunch"].includes(action.type)){
          const loading=smooth(t/wind);torso.rotation.x=.27*loading;pelvis.position.y-=.08*loading;
          limbs.l.shoulder.rotation.x=-1.4;limbs.r.shoulder.rotation.x=-1.25;limbs.l.elbow.rotation.x=-.2;
          limbs.l.hip.rotation.x-=.20;limbs.r.hip.rotation.x+=.18;
        }else if(action.type==="heal"||action.type==="healing"){
          const f=smooth(t/wind);limbs.r.shoulder.rotation.x=-1.0-.85*f;limbs.r.elbow.rotation.x=-.4;limbs.l.shoulder.rotation.x=-.8;headNode.rotation.x=-.08;
        }else if(["throw","disc","return_disc","curved_bullet","arc"].includes(action.type)){
          const f=smooth(t/wind),release=smooth((t-wind)/.18);limbs.r.shoulder.rotation.x=-.8-1.1*f+.55*release;limbs.r.elbow.rotation.x=-1.0+.9*release;torso.rotation.y=-.25*f+.50*release;
        }else if(action.type==="reload"){
          const f=clamp(t/action.duration,0,1);limbs.r.hand.rotation.y=-.55;limbs.r.shoulder.rotation.x=-.88;
          limbs.l.elbow.rotation.x=-.9-.5*Math.sin(Math.PI*f);headNode.rotation.x=.14;
        }else{
          const kick=t>wind?Math.exp(-(t-wind)*14):0;
          torso.rotation.x=-kick*.1;limbs.r.shoulder.rotation.x+=kick*.16;
          headNode.rotation.x=.045*Math.sin(time*5);
        }
      }
      if(s.reactAge<.23){const hit=Math.sin(Math.PI*clamp(s.reactAge/.23,0,1));torso.rotation.x-=hit*.15;headNode.rotation.x+=hit*.08;}
      if(s.dead){const f=smooth((s.deathAge||0)/.7);pelvis.position.y-=.39*f;pelvis.rotation.x=-1.45*f;limbs.l.elbow.rotation.x=-.5;limbs.r.elbow.rotation.x=-.6;}
      root.computeWorldMatrix(true);for(const n of root.getChildTransformNodes(false))n.computeWorldMatrix(true);
      if(hero&&!s.dead){
        // Preserve a planted sole during the weight shift without translating the collision root.
        const inverse=root.getWorldMatrix().clone().invert();let lowest=Infinity;
        for(const side of ["l","r"]){const sole=B.Vector3.TransformCoordinates(V(0,-.115,.08),limbs[side].foot.getWorldMatrix());lowest=Math.min(lowest,B.Vector3.TransformCoordinates(sole,inverse).y);}
        pelvis.position.y-=lowest;
        for(const n of root.getChildTransformNodes(false))n.computeWorldMatrix(true);
      }
      for(const n of Object.values(sockets))if(n)n.computeWorldMatrix(true);
    },dispose(){root.dispose(false,false);}};
  if(hero)setForm(options.stage??8,options.tray??false);
  model.pose({time:0,travel:0,speed:0,reactAge:99});return model;
}
function beast(scene,kind,id,p){
  const ember=kind==="ember_beast",needle=kind==="needle_creature",root=node(scene,id),body=node(scene,id+"-body",root,V(0,ember?.53:.31,0));
  const w=ember?1.66:.82,d=ember?1.50:.72;
  if(ember){
    // Low continuous carapace with sloping flanks; the seams sit below its crown.
    const shell=box(scene,"ember-sloping-carapace",[1.50,.54,1.43],V(0,.12,-.03),p.armor,body,.16);
    const vertices=shell.getVerticesData(B.VertexBuffer.PositionKind);
    for(let i=0;i<vertices.length;i+=3){
      const top=clamp((vertices[i+1]+.27)/.54,0,1);
      vertices[i]*=1-.29*top;vertices[i+2]*=1-.15*top;
      vertices[i+1]+=.075*top*(1-Math.abs(vertices[i])/.75);
    }
    const normals=[];B.VertexData.ComputeNormals(vertices,shell.getIndices(),normals);
    shell.setVerticesData(B.VertexBuffer.PositionKind,vertices);shell.setVerticesData(B.VertexBuffer.NormalKind,normals);
    for(const z of [-.26,.18]){
      const seam=box(scene,"ember-armor-seam",[1.17,.035,.035],V(0,.383,z),p.dark,body,.012);seam.rotation.x=z<0?-.12:.12;
    }
  }else egg(scene,"beast-heavy-body",[w,.38,d],V(0,.10,0),p.armor,body);
  const headNode=node(scene,"beast-head",body,V(0,ember?-.02:-.025,ember?.73:.36));
  box(scene,"beast-broad-head",[ember?.80:.40,ember?.44:.24,ember?.65:.35],V(),p.dark,headNode,ember?.10:.09);
  if(ember){
    box(scene,"ember-brow",[.71,.15,.48],V(0,.17,-.01),p.armor,headNode,.05);
    box(scene,"ember-heavy-jaw",[.64,.13,.37],V(0,-.18,.08),p.armor,headNode,.045);
  }
  for(const sign of [-1,1]){
    const eye=egg(scene,"beast-amber-eye",[ember?.15:.06,ember?.075:.055,.034],V(sign*(ember?.205:.10),ember?.015:0,ember?.331:.178),p.amber,headNode);if(ember)eye.rotation.z=sign*.18;
  }
  const legs=[];
  for(const side of [-1,1])for(const end of [-1,1]){
    const hip=node(scene,"beast-hip",body,V(side*w*.43,ember?-.025:-.02,end*d*.30));
    const upper=box(scene,"weight-bearing-shoulder",[ember?.46:.17,ember?.36:.23,ember?.48:.22],V(side*.045,-.105,.035),p.armor,hip,ember?.075:.055);
    const knee=node(scene,"beast-knee",hip,V(side*.11,ember?-.25:-.15,.08));
    box(scene,"beast-grounded-paw",[ember?.50:.20,ember?.24:.12,ember?.57:.25],V(0,ember?-.13:-.105,.10),p.dark,knee,ember?.06:.035);
    legs.push({hip,knee,side,end,upper});
  }
  if(ember){
    for(const sign of [-1,1]){
      const shoulder=box(scene,"ember-wedge-orange-shoulder",[.55,.34,.54],V(sign*.60,.235,.25),p.orange,body,.075);
      const vertices=shoulder.getVerticesData(B.VertexBuffer.PositionKind);
      for(let i=0;i<vertices.length;i+=3){const top=clamp((vertices[i+1]+.17)/.34,0,1);vertices[i]*=1-.28*top;vertices[i+1]-=sign*vertices[i]*.24;vertices[i+2]*=1-.18*top;}
      const normals=[];B.VertexData.ComputeNormals(vertices,shoulder.getIndices(),normals);
      shoulder.setVerticesData(B.VertexBuffer.PositionKind,vertices);shoulder.setVerticesData(B.VertexBuffer.NormalKind,normals);
      shoulder.rotation.z=sign*-.16;shoulder.rotation.x=.12;
    }
  }else if(needle){
    for(const x of [-.23,0,.23]){
      const spike=B.MeshBuilder.CreateCylinder("three-back-needles",{height:.54,diameterTop:.018,diameterBottom:.065,tessellation:8},scene);
      spike.parent=body;spike.position.set(x,.43,-.08);spike.rotation.x=-.40;spike.material=p.steel;spike.isPickable=false;
    }
  }else{
    egg(scene,"heat-round-shell",[1.02,.32,.95],V(0,.24,0),p.dark,body);
    const ring=B.MeshBuilder.CreateTorus("heat-shell-copper-ring",{diameter:.55,thickness:.035,tessellation:32},scene);
    ring.parent=body;ring.position.y=.405;ring.material=p.orange;ring.isPickable=false;
  }
  const sockets={weapon:node(scene,"beast-physical-contact",headNode,V(0,0,ember?.34:.18)),muzzle:node(scene,"beast-emission",headNode,V(0,.05,ember?.35:.20))};
  compact(root);
  const model={root,pelvis:body,torso:body,head:headNode,limbs:{legs},sockets,meshes:root.getChildMeshes(false),
    metrics:{height:ember?1.16:.87,radius:ember?.78:.36,hurtLow:ember?.21:.12,hurtHigh:ember?.76:.49,hurtRadius:ember?.70:.38,weaponRadius:ember?.43:.15},
    pose(s){
      const move=clamp((s.speed||0)/3.5,0,1),phase=(s.travel||0)*(ember?6.2:10);
      body.position.set(0,(ember?.53:.31)+Math.abs(Math.sin(phase))*move*.018,0);body.rotation.set(0,0,Math.sin(phase)*move*.020);
      headNode.rotation.set(0,Math.sin((s.time||0)*1.4)*.025,0);
      for(const leg of legs){const swing=Math.sin(phase+(leg.side*leg.end>0?0:Math.PI))*move;leg.hip.rotation.x=swing*.32;leg.knee.rotation.x=Math.max(0,-swing)*.38;}
      const a=s.action;if(a){
        const wind=a.windup||.7,f=smooth(a.age/wind),recover=smooth((a.age-(a.activeEnd||wind+.4))/.35);
        if(a.type==="beastCharge"){body.rotation.x=.10*f*(1-recover);body.position.y-=.065*f*(1-recover);headNode.rotation.x=-.10*f;}
        else if(a.type==="needle"){body.rotation.x=-.14*f*(1-recover);body.position.y+=.035*f*(1-recover);}
        else if(a.type==="heat"){body.position.y+=Math.sin(Math.PI*clamp(a.age/(wind+.2),0,1))*.09;}
      }
      if(s.reactAge<.23)body.rotation.x-=Math.sin(Math.PI*clamp(s.reactAge/.23,0,1))*.10;
      if(s.dead){const f=smooth((s.deathAge||0)/.6);body.position.y-=f*(ember?.25:.12);body.rotation.z=.6*f;}
      root.computeWorldMatrix(true);for(const n of root.getChildTransformNodes(false))n.computeWorldMatrix(true);Object.values(sockets).forEach(n=>n.computeWorldMatrix(true));
    },dispose(){root.dispose(false,false);}};
  model.pose({time:0,travel:0,speed:0,reactAge:99});return model;
}
function createActor(scene,kind,id,p,options={}){
  if(kind==="hero"&&(!Number.isInteger(options.stage??8)||(options.stage??8)<1||(options.stage??8)>8))throw new RangeError("Hero stage must be an integer 1..8");
  const aliases={ally_foreman:"manager",ally_coworker:"coworker",troublemaker_boss:"customer_brute",troublemaker_customer:"impatient_customer",champion:"socket_champion",gunner:"light_gunner",rusher:"runner",ati_captain:"shield_captain",shield_soldier:"shield_guard",rear_thrower:"spear_thrower",cross_disc_thrower:"disc_thrower",diagonal_runner:"runner",boxing_mech:"mech_boss"};
  if(/^seat_\d\d$/.test(kind)){const seat=Number(kind.slice(-2));if(seat<1||seat>10)throw new RangeError("Unknown director seat");options={...options,seat};kind=seat===6?"director_healer":[1,4,7].includes(seat)?"director_melee":[3,9].includes(seat)?"director_zone":"director_ranged";}
  const canonical=kind;kind=aliases[kind]||kind;
  const known=["hero","customer_brute","impatient_customer","tray_thrower","queue_rusher","manager","coworker","socket_champion","light_gunner","runner","shield_captain","shield_guard","spear_thrower","disc_champion","disc_thrower","mech_boss","arc_thrower","heavy_guard","amd_leader","gun_column","diagonal_guard","director_melee","director_ranged","director_healer","director_zone","ember_beast","needle_creature","heat_creature"];
  if(!known.includes(kind))throw new RangeError("Unknown R24 actor kind: "+kind);
  const rig=["ember_beast","needle_creature","heat_creature"].includes(kind)?beast(scene,kind,id,p):human(scene,kind,id,p,options);
  if(canonical==="diagonal_runner"){const tail=box(scene,"diagonal-runner-long-tail",[.22,.55,.08],V(.18,-.22,-.24),p.redTrim,rig.torso,.035);tail.rotation.x=-.15;rig.meshes=rig.root.getChildMeshes(false);}
  return rig;
}
function createProp(scene,kind,id,p){
  let root,size;
  if(kind==="gray_box"||kind==="yellow_box"){
    const gray=kind==="gray_box";size=gray?[.64,.37,.43]:[.43,.39,.39];
    root=roundedBox(scene,id,size,.055,gray?p.boxGray:p.boxYellow);
    box(scene,"box-lid",[size[0]-.025,.052,size[2]-.025],V(0,size[1]/2-.012,0),gray?p.boxGray:p.boxLid,root,.026);
    box(scene,"box-catch",[.14,.035,.025],V(0,-.03,size[2]/2),gray?p.steel:p.boxLid,root,.008);
  }else{
    root=node(scene,id);
    if(kind==="table"){
      size=[1.9,.82,.78];box(scene,"warm-table-top",[1.9,.16,.78],V(0,.74,0),p.wood,root,.06);
      box(scene,"table-front-edge",[1.84,.09,.045],V(0,.67,.38),p.woodEdge,root,.018);
      for(const x of [-.77,.77])for(const z of [-.25,.25])box(scene,"table-leg",[.13,.67,.13],V(x,.335,z),p.tableLeg,root,.025);
    }else if(kind==="planter"){
      size=[1.08,1.15,.94];box(scene,"cream-planter",[1.08,.46,.94],V(0,.23,0),p.wall,root,.12);
      box(scene,"planter-rim",[1.10,.10,.96],V(0,.45,0),p.wallTop,root,.08);
      box(scene,"soil-inset",[.88,.032,.75],V(0,.505,0),p.soil,root,.075);
      const leaves=[[-.27,.72,-.18,.48],[.15,.76,-.19,.52],[.33,.70,.11,.43],[-.32,.70,.14,.45],[-.06,.84,.05,.57],[.02,1.0,-.11,.43],[.14,.72,.28,.39],[-.15,.68,.29,.38]];
      leaves.forEach(([x,y,z,s],i)=>egg(scene,"trimmed-foliage",[s,s*.89,s],V(x,y,z),[p.leaf,p.leafLight,p.leafDark][i%3],root));
    }else if(kind==="server"){
      size=[.68,1.28,.64];box(scene,"server-tower",size,V(0,.64,0),p.server,root,.075);
      box(scene,"server-top-inset",[.53,.024,.47],V(0,1.285,0),p.dark,root,.04);
      for(let i=0;i<4;i++){
        box(scene,"server-drawer",[.53,.18,.035],V(0,.23+i*.245,.331),p.dark,root,.025);
        box(scene,"server-amber-status",[.25,.044,.018],V(.065,.23+i*.245,.358),p.boxYellow,root,.008);
        for(const x of [-.19,-.14])box(scene,"server-port",[.022,.061,.017],V(x,.23+i*.245,.356),p.seam,root,.005);
      }
    }else if(kind==="magazine"){
      size=[.28,.09,.16];box(scene,"dropped-magazine",size,V(0,.045,0),p.boxGray,root,.018);
      for(const x of [-.07,.07])box(scene,"magazine-indent",[.032,.005,.028],V(x,.092,0),p.dark,root,.005);
    }else throw new Error("Unknown R20 prop kind: "+kind);
  }
  compact(root);return {root,size,meshes:root.getChildMeshes(false).concat(root instanceof B.Mesh?[root]:[]),dispose(){root.dispose(false,false);}};
}
window.R20Models=Object.freeze({createPalette,createActor,createProp,roundedBox});
})();
