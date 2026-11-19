(function () {
"use strict";
const B = window.BABYLON, V = (x=0,y=0,z=0) => new B.Vector3(x,y,z);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
function createPalette(scene,finale=false) {
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
  if(finale){
    const finishes={skin:["#ca997a",.83,0],nose:["#af795f",.84,0],leather:["#11191f",.52,.05],lapel:["#66747b",.55,.25],pants:["#1b222c",.84,0],shoe:["#11171d",.58,.05],
      hair:["#a8b4bd",.72,.05],hairShade:["#667986",.83,0],hairDark:["#302d36",.84,0],suit:["#263145",.74,.02],suitLight:["#758192",.65,.12],paper:["#c2c3b4",.86,0],
      teal:["#167d87",.48,.22],wire:["#91e9a1",.42,.12],red:["#913d43",.68,.08],redTrim:["#af5057",.60,.12],steel:["#718a9b",.34,.80],edge:["#cfdee0",.26,.85],
      wafer:["#14272d",.38,.65],gold:["#c18d52",.44,.68],dark:["#111b27",.62,.18],armor:["#354957",.50,.50],wood:["#392b2b",.72,.05],woodEdge:["#211d23",.68,.10],
      wall:["#253341",.72,.20],wallTop:["#607582",.52,.45],boxGray:["#3e5364",.51,.65],boxYellow:["#b77c3f",.50,.55],boxLid:["#9d774d",.46,.65],server:["#233745",.49,.58]};
    for(const [name,[hex,rough,metal]]of Object.entries(finishes)){p[name].albedoColor=B.Color3.FromHexString(hex).toLinearSpace();p[name].roughness=rough;p[name].metallic=metal;}
    p.wire.emissiveColor=B.Color3.FromHexString("#315e40");
  }
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
function tailoredBlock(scene,name,size,pos,mat,parent,bottom=.78,bevel=.018){
  const m=box(scene,name,size,pos,mat,parent,bevel),vertices=m.getVerticesData(B.VertexBuffer.PositionKind),normals=[];
  for(let i=0;i<vertices.length;i+=3)vertices[i]*=bottom+(1-bottom)*clamp(vertices[i+1]/size[1]+.5,0,1);
  B.VertexData.ComputeNormals(vertices,m.getIndices(),normals);m.setVerticesData(B.VertexBuffer.PositionKind,vertices);m.setVerticesData(B.VertexBuffer.NormalKind,normals);m.refreshBoundingInfo();return m;
}
function sculpted(scene,name,sections,pos,mat,parent,sides=12){
  const positions=[],indices=[],normals=[],uvs=[];
  for(let r=0;r<sections.length;r++){
    const [y,w,d,z=0]=sections[r];
    for(let i=0;i<=sides;i++){
      const a=i/sides*Math.PI*2;positions.push(Math.sin(a)*w,y,z+Math.cos(a)*d);uvs.push(i/sides,r/(sections.length-1));
      if(r<sections.length-1&&i<sides){const k=r*(sides+1)+i;indices.push(k,k+1,k+sides+2,k,k+sides+2,k+sides+1);}
    }
  }
  for(const r of[0,sections.length-1]){
    const center=positions.length/3;positions.push(0,sections[r][0],sections[r][3]||0);uvs.push(.5,.5);
    for(let i=0;i<sides;i++){const k=r*(sides+1)+i;indices.push(...(r===0?[center,k+1,k]:[center,k,k+1]));}
  }
  // Match Babylon's outward winding and default normal calculation in the RH scene.
  for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
  B.VertexData.ComputeNormals(positions,indices,normals);const m=new B.Mesh(name,scene),data=new B.VertexData();
  data.positions=positions;data.indices=indices;data.normals=normals;data.uvs=uvs;data.applyToMesh(m);m.position.copyFrom(pos);m.parent=parent;m.material=mat;m.isPickable=false;m.receiveShadows=true;return m;
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
function head(scene,parent,p,mature,lisa,angular=false,seat=0) {
  if(angular){
    sculpted(scene,"sculpted-brow-cheek-and-jaw",[[-.29,.13,.12,.045],[-.21,.20,.17,.035],[-.08,.25,.20,.015],[.07,.25,.21,0],[.22,.23,.19,-.01],[.31,.15,.13,-.02]],V(),p.skin,parent);
    for(const sign of [-1,1]){
      box(scene,"small-ear",[.075,.14,.10],V(sign*.263,0,0),p.skin,parent,.025);
      box(scene,"deep-set-eye",[.040,.030,.018],V(sign*.108,-.016,.232),p.eye,parent,.005);
      const brow=box(scene,"heavy-angular-brow",[.115,.035,.04],V(sign*.11,.043,.229),mature?p.hairShade:p.hairDark,parent,.008);brow.rotation.z=-sign*.10;
    }
    tailoredBlock(scene,"angular-nose",[.065,.12,.09],V(0,-.065,.255),p.nose,parent,.70,.014);
    box(scene,"mouth-line",[.10,.015,.012],V(0,-.16,.226),p.nose,parent,.003);
    const hair=mature?p.hair:seat===7?p.hairShade:seat%3===0?p.hairBlack:p.hairDark;
    if(seat===1){
      sculpted(scene,"vanguard-open-face-war-helm",[[.10,.27,.23,-.02],[.22,.28,.23,-.04],[.33,.21,.17,-.05],[.38,.10,.09,-.05]],V(),p.armor,parent,10);
      const brow=box(scene,"vanguard-helmet-brow",[.49,.065,.07],V(0,.075,.22),p.steel,parent,.02);brow.rotation.z=-.07;
      for(const sign of[-1,1])sculpted(scene,"vanguard-helmet-temple",[[-.13,.05,.08],[.14,.065,.12]],V(sign*.255,0,-.015),p.armor,parent,8);
    }else if(seat!==7){
      const crown=mature?1:seat===5?.92:seat%2===0?.58:.75;
      sculpted(scene,"swept-hair-scalp",[[.12,.255,.245,-.04],[.27,.245,.215,-.045],[.32+.025*crown,.16,.17,-.05],[.355+.035*crown,.035,.035,-.06]],V(),mature?p.hairShade:hair,parent);
      const xs=mature?[-.21,-.12,-.025,.075,.17]:[-.18,-.065,.065,.17];
      xs.forEach((x,i)=>{
        const rise=mature?.025*Math.sin(i/4*Math.PI):seat===5?.015:.005;
        sweptLock(scene,"sculpted-swept-strand-"+i,[V(x,.17+rise,.19),V(x-.055,.30+.035*crown+rise,.11),V(x+.015,.36+.035*crown+rise,-.065),V(x+.08,.20,-.24)],mature?.063:.071,mature?.025:.022,i%3===0?(mature?p.hairShade:p.hairBlack):hair,parent);
      });
      if(seat===5)sculpted(scene,"deadeye-swept-side-part",[[-.12,.075,.12],[.12,.08,.18],[.26,.06,.14]],V(.23,.04,-.065),hair,parent,8);
    }
    for(const sign of [-1,1])box(scene,"temple-hair",[.065,.18,.17],V(sign*.248,.025,-.035),mature?p.hairShade:hair,parent,.018);
    if(mature)glasses(scene,parent,p,false);
    return;
  }
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
function shield(scene,hand,p,finale=false) {
  const n=node(scene,"anatomical-right-wafer-shield",hand,V(-.12,.02,-.025));
  n.rotation.set(-.10,-.72,.04);
  const rim=cylinder(scene,"silver-wafer-rim",1.03,.095,V(),p.edge,n,finale?16:48);rim.rotation.x=Math.PI/2;
  const disk=cylinder(scene,"carbon-wafer",.95,.105,V(0,0,.014),p.wafer,n,48);disk.rotation.x=Math.PI/2;
  for(let row=-2;row<=2;row++)for(let col=-2;col<=2;col++){
    const x=col*.16,y=row*.16;if(Math.hypot(x,y)>.37)continue;
    box(scene,"pale-gold-die",[.145,.145,.012],V(x,y,.072),finale?p.steel:p.gold,n,.008);
  }
  if(finale){
    for(const sign of[-1,1]){const slash=box(scene,"wafer-green-chevron",[.42,.075,.035],V(sign*.13,.02,.098),p.wire,n,.008);slash.rotation.z=sign*.50;}
    box(scene,"wafer-green-core",[.13,.21,.04],V(0,-.08,.105),p.wire,n,.008);
  }
  box(scene,"wafer-center-channel",[.87,.026,.014],V(0,0,.081),p.wafer,n,.005);
  box(scene,"shield-real-grip",[.27,.07,.09],V(0,0,-.09),p.shoe,n,.025);
  return n;
}
function hammer(scene,hand,p,finale=false) {
  const grip=node(scene,"anatomical-left-thor-hammer",hand);
  const shaft=cylinder(scene,"hammer-grip",.080,.46,V(0,-.20,0),p.shoe,grip,12);
  for(const y of [-.02,-.10,-.18,-.26,-.34])cylinder(scene,"grip-wrap",.086,.017,V(0,y,0),p.steel,grip,12);
  // A deeper beveled head reads edge-on without moving the actual contact socket.
  if(finale)tailoredBlock(scene,"forged-hammer-head",[.70,.38,.45],V(0,-.45,0),p.steel,grip,.87,.018);
  else box(scene,"short-silver-hammer",[.62,.36,.43],V(0,-.45,0),p.steel,grip,.055);
  for(const sign of [-1,1])box(scene,"hammer-faced-end",[.04,.31,.39],V(sign*.312,-.45,0),p.edge,grip,.02);
  box(scene,"hammer-head-band",[.085,.37,.44],V(0,-.45,0),p.dark,grip,.025);
  if(finale)for(const sign of[-1,1])box(scene,"hammer-charged-seam",[.21,.055,.025],V(sign*.19,-.45,.237),p.wire,grip,.005);
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
function directorProp(scene,hand,p,seat,finale=false){
  const root=node(scene,"seat-"+seat+"-meeting-device",hand);
  if(finale&&seat===1){
    tailoredBlock(scene,"vanguard-ram-shield",[.77,.91,.24],V(0,-.12,.14),p.dark,root,.70,.025);
    for(const sign of [-1,1]){
      const edge=box(scene,"vanguard-gold-chevron",[.40,.10,.08],V(sign*.16,-.10,.29),p.gold,root,.025);edge.rotation.z=sign*.43;
      box(scene,"vanguard-shield-rivet",[.10,.10,.05],V(sign*.27,.18,.28),p.steel,root,.025);
    }
    box(scene,"vanguard-ram-spine",[.14,.69,.16],V(0,-.12,.32),p.steel,root,.04);
  }else if(finale&&seat===4){
    box(scene,"gatekeeper-solid-folio-guard",[.68,.96,.14],V(0,-.10,.15),p.teal,root,.045);
    box(scene,"gatekeeper-folio-binding",[.12,1.00,.20],V(-.29,-.10,.15),p.steel,root,.025);
    for(const y of [-.43,.23])box(scene,"gatekeeper-folio-clasp",[.30,.08,.055],V(.16,y,.25),p.gold,root,.02);
    box(scene,"gatekeeper-recessed-front",[.42,.63,.035],V(.035,-.10,.24),p.dark,root,.025);
  }else if(finale&&seat===3){
    box(scene,"cinder-mortar-cradle",[.57,.25,.49],V(0,-.16,.12),p.redTrim,root,.045);
    cylinder(scene,"cinder-short-upward-barrel",.49,.51,V(0,.09,.12),p.armor,root,12);
    cylinder(scene,"cinder-mortar-mouth-rim",.53,.085,V(0,.345,.12),p.gold,root,12);
    cylinder(scene,"cinder-deep-open-bore",.36,.014,V(0,.394,.12),p.dark,root,12);
    for(const sign of[-1,1])box(scene,"cinder-barrel-recoil-rail",[.09,.46,.13],V(sign*.28,.06,.12),p.steel,root,.018);
  }else if(finale&&seat===5){
    box(scene,"deadeye-precision-receiver",[.30,.29,.63],V(0,.04,.18),p.dark,root,.018);
    box(scene,"deadeye-shoulder-stock",[.21,.27,.31],V(0,.02,-.22),p.shoe,root,.05);
    const barrel=cylinder(scene,"deadeye-long-barrel",.085,.74,V(0,.05,.78),p.steel,root,12);barrel.rotation.x=Math.PI/2;
    box(scene,"deadeye-angular-barrel-shroud",[.19,.17,.67],V(0,.05,.75),p.steel,root,.014);
    const shroud=cylinder(scene,"deadeye-muzzle-shroud",.17,.16,V(0,.05,1.13),p.gold,root,12);shroud.rotation.x=Math.PI/2;
    const bore=cylinder(scene,"deadeye-visible-bore",.115,.014,V(0,.05,1.217),p.dark,root,12);bore.rotation.x=Math.PI/2;
    const scope=cylinder(scene,"deadeye-scope",.13,.29,V(0,.25,.26),p.teal,root,12);scope.rotation.x=Math.PI/2;
    box(scene,"deadeye-scope-lens",[.10,.10,.025],V(0,.25,.414),p.wire,root,.025);
  }else if(finale&&seat===6){
    cylinder(scene,"lifeline-conductor-staff",.075,1.56,V(0,.30,0),p.gold,root,12);
    const halo=[];for(let i=0;i<=6;i++){const a=i/6*Math.PI*2;halo.push(V(Math.cos(a)*.31,1.12+Math.sin(a)*.31,0));}
    tube(scene,"lifeline-hex-conductor",halo,.07,p.teal,root);
    const core=box(scene,"lifeline-crystal-core",[.19,.27,.14],V(0,1.12,0),p.wire,root,.014);core.rotation.z=Math.PI/4;
    for(const sign of [-1,1])box(scene,"lifeline-halo-fin",[.11,.28,.13],V(sign*.29,1.10,0),p.gold,root,.04);
  }else if(finale&&seat===8){
    box(scene,"scattershot-three-channel-body",[.66,.25,.19],V(0,-.08,.10),p.dark,root,.018);
    for(const sign of[-1,0,1]){const rail=box(scene,"scattershot-splayed-rail",[.15,.17,.45],V(sign*.22,-.08,.25),p.steel,root,.015);rail.rotation.y=sign*.35;}
  }else if(finale&&seat===9){
    box(scene,"ashfall-planted-pylon-foot",[.54,.14,.54],V(0,.07,0),p.steel,root,.025);
    for(const sign of[-1,1])box(scene,"ashfall-anchored-gold-toe",[.16,.09,.66],V(sign*.18,.045,0),p.gold,root,.012);
    tailoredBlock(scene,"ashfall-tall-emitter-pole",[.24,1.55,.24],V(0,.88,0),p.steel,root,.70);
    for(const sign of[-1,1])box(scene,"ashfall-ceramic-shaft-spine",[.075,1.39,.045],V(0,.88,sign*.126),p.paper,root,.01);
    cylinder(scene,"ashfall-upper-hoop-support-stem",.085,.50,V(0,1.80,0),p.gold,root,10);
    const top=node(scene,"ashfall-upper-hoop-pivot",root,V(0,2.02,0));
    for(const [radius,y,mat,parent]of[[.52,1.43,p.gold,root],[.34,0,p.redTrim,top]]){
      const hoop=[];for(let i=0;i<=32;i++){const a=i/32*Math.PI*2;hoop.push(V(Math.cos(a)*radius,y,Math.sin(a)*radius));}
      tube(scene,"ashfall-separated-emitter-hoop",hoop,.057,mat,parent);
    }
    const core=node(scene,"ashfall-core-lift-pivot",root,V(0,1.65,0));
    cylinder(scene,"ashfall-emitter-amber-core",.19,.25,V(),p.amber,core,10);
    for(const sign of[-1,1])box(scene,"ashfall-ring-support-spoke",[.47,.065,.065],V(sign*.26,1.43,0),p.edge,root,.01);
  }else if(finale&&seat===10){
    const display=node(scene,"reclaimer-broadside-blade-pivot",root,V(0,-.05,.12)),positions=[],indices=[],normals=[],uvs=[],steps=24;
    for(let i=0;i<=steps;i++){
      const a=(-105+i/steps*220)*Math.PI/180,outer=.45,inner=.24+.025*Math.sin(i/steps*Math.PI);
      for(const [radius,z]of[[outer,.045],[inner,.025],[outer,-.045],[inner,-.025]]){positions.push(Math.cos(a)*radius,Math.sin(a)*radius,z);uvs.push(i/steps,radius===outer?1:0);}
      if(i<steps){const k=i*4;indices.push(k,k+5,k+4,k,k+1,k+5,k+2,k+6,k+7,k+2,k+7,k+3,k,k+4,k+6,k,k+6,k+2,k+1,k+7,k+5,k+1,k+3,k+7);}
    }
    indices.push(0,2,3,0,3,1,steps*4,steps*4+1,steps*4+3,steps*4,steps*4+3,steps*4+2);
    B.VertexData.ComputeNormals(positions,indices,normals);const blade=new B.Mesh("reclaimer-solid-open-crescent",scene),data=new B.VertexData();
    data.positions=positions;data.indices=indices;data.normals=normals;data.uvs=uvs;data.applyToMesh(blade);blade.parent=display;blade.material=p.edge;blade.isPickable=false;blade.receiveShadows=true;
    const hook=tailoredBlock(scene,"reclaimer-single-gold-return-hook",[.23,.34,.10],V(-.19,.38,0),p.gold,display,.08,.012);hook.rotation.z=.65;
    box(scene,"reclaimer-short-inner-grip",[.11,.18,.12],V(.21,0,0),p.dark,display,.025);
  }else if([1,5].includes(seat)){
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
  const finale=options.finale===true;
  const hero=kind==="hero",lisa=kind==="amd_leader",director=kind.startsWith("director_"),ally=kind==="manager"||kind==="coworker";
  const guard=["diagonal_guard","shield_guard","shield_captain","heavy_guard"].includes(kind),mech=kind==="mech_boss",seated=kind==="socket_champion";
  const casual=["customer_brute","impatient_customer","tray_thrower","queue_rusher"].includes(kind),brute=kind==="customer_brute";
  const female=kind==="shield_captain"||kind==="disc_champion"||director&&[3,5,8,10].includes(options.seat);
  let stage=8,tray=false;const seat=options.seat||0;
  const root=node(scene,id),pelvis=node(scene,id+"-pelvis",root,V(0,.68,0));
  const torso=node(scene,id+"-torso",pelvis,V(0,.30,0)),headNode=node(scene,id+"-head",torso,V(0,.55,0));
  const cloth=hero?p.leather:director?p.suit:ally?(kind==="manager"?p.teal:p.red):brute?p.redTrim:casual?p.shirt:p.red,trim=hero?p.lapel:director?p.suitLight:brute?p.shirt:casual?p.woodEdge:p.redTrim;
  if(finale)sculpted(scene,"sculpted-shoulder-chest-and-waist",[[-.34,.25,.18],[-.19,.27,.19],[-.02,.32,.225],[.16,hero?.38:.35,.23],[.29,hero?.35:.32,.19],[.35,.22,.16]],V(0,.08,0),cloth,torso,12);
  else box(scene,"tailored-jacket-body",[.65,.65,.42],V(0,.08,0),cloth,torso,.15);
  if(finale)sculpted(scene,"shaped-jacket-hem",[[-.095,.25,.175],[0,.28,.19],[.095,.27,.185]],V(0,-.19,0),trim,torso);
  else box(scene,"jacket-hem",[.58,.19,.39],V(0,-.19,0),trim,torso,.085);
  if(finale)sculpted(scene,"pressed-trouser-hip",[[-.12,.21,.14],[0,.25,.18],[.12,.23,.16]],V(0,-.035,-.01),p.pants,pelvis);
  else egg(scene,"hip-trousers",[.50,.24,.36],V(0,-.035,-.01),p.pants,pelvis);
  box(scene,"undershirt",[.13,.39,.025],V(0,.05,.212),p.shoe,torso,.012);
  for(const sign of [-1,1]){
    const lapel=box(scene,"folded-lapel",finale?[.15,.35,.055]:[.12,.31,.055],V(sign*.115,.17,.216),trim,torso,finale?.008:.024);lapel.rotation.z=sign*.30;
    const collar=box(scene,"standing-collar",[.145,.13,.20],V(sign*.105,.35,.035),trim,torso,finale?.009:.035);collar.rotation.z=-sign*.20;
    const pocket=box(scene,"jacket-pocket",[.16,.027,.025],V(sign*.18,-.09,.217),trim,torso,.01);pocket.rotation.z=-sign*.15;
  }
  box(scene,"jacket-zipper",[.015,.33,.013],V(0,.005,.238),p.seam,torso,.004);
  const teenHead=hero?node(scene,"young-head-form",headNode):null,founderHead=hero?node(scene,"founder-head-form",headNode):null,matureHead=hero?node(scene,"mature-head-form",headNode):headNode;
  if(hero){head(scene,teenHead,{...p,hairDark:p.hairBlack},false,false);head(scene,founderHead,{...p,hair:p.hairBlack,hairShade:p.hairBlack},true,false);}
  head(scene,matureHead,p,hero||lisa||director&&seat===6,lisa,finale,seat);
  if(female&&!lisa){if(finale)tailoredBlock(scene,"angular-tied-back-hair",[.17,.35,.20],V(.08,.10,-.28),p.hairDark,headNode,.60,.025);else egg(scene,"tied-back-ponytail",[.20,.38,.24],V(.08,.12,-.30),p.hairDark,headNode);}
  if(brute){torso.scaling.x=1.28;headNode.scaling.x=.9;box(scene,"brute-square-jaw",[.49,.18,.34],V(0,-.18,.06),p.skin,headNode,.06);}
  const apron=node(scene,"restaurant-apron",torso);
  if(hero||ally){box(scene,"cream-apron-front",[.43,.58,.055],V(0,-.035,.23),p.shirt,apron,.025);for(const x of [-.13,.13])box(scene,"apron-strap",[.035,.28,.035],V(x,.33,.22),p.shirt,apron,.01);}
  if(ally)tube(scene,"friendly-beard",[V(-.14,-.12,.23),V(0,-.22,.26),V(.14,-.12,.23)],.04,p.hairDark,headNode);
  if(director){
    box(scene,"white-shirt-front",[.18,.34,.035],V(0,.13,.24),p.paper,torso,.015);
    box(scene,"business-tie",[.052,.29,.025],V(0,.10,.267),seat%2?p.redTrim:p.teal,torso,.012);
    if([4,7].includes(seat))for(const sign of [-1,1])box(scene,"split-business-coattail",[.22,.37,.10],V(sign*.16,-.34,-.14),p.suit,torso,.035);
    if(seat===3&&!finale)for(const sign of [-1,1])box(scene,"shoulder-paper-streamer",[.08,.50,.035],V(sign*.31,.05,-.06),p.paper,torso,.01);
    if(finale&&seat===3){
      sculpted(scene,"cinder-heavy-recoil-mantle",[[-.13,.36,.22],[0,.47,.27],[.13,.32,.20]],V(0,.28,-.02),p.redTrim,torso,10);
      for(const sign of[-1,1])box(scene,"cinder-brass-recoil-harness",[.08,.48,.07],V(sign*.22,.06,.24),p.gold,torso,.012);
    }
    if(finale&&seat===9){
      for(const sign of[-1,1]){const tail=tailoredBlock(scene,"ashfall-long-split-channel-coat",[.23,.62,.12],V(sign*.19,-.40,-.15),p.redTrim,torso,.60);tail.rotation.z=sign*.12;}
      sculpted(scene,"ashfall-raised-channel-collar",[[-.10,.23,.17],[.12,.31,.24]],V(0,.35,-.06),p.dark,torso,10);
    }
    if(finale&&seat===10){
      sculpted(scene,"reclaimer-asymmetric-throwing-pauldron",[[-.09,.15,.17],[0,.26,.25],[.14,.17,.15]],V(-.34,.26,0),p.steel,torso,10);
      const sash=box(scene,"reclaimer-diagonal-gold-harness",[.10,.62,.055],V(0,.06,.25),p.gold,torso,.01);sash.rotation.z=-.55;
    }
    if(finale&&seat===1){
      sculpted(scene,"vanguard-broad-shoulder-mantle",[[-.11,.40,.21],[0,.51,.265],[.11,.38,.20]],V(0,.31,-.02),p.armor,torso,10);
      for(const sign of [-1,1])box(scene,"vanguard-gold-shoulder-tab",[.20,.08,.43],V(sign*.38,.44,0),p.gold,torso,.03);
    }
    if(finale&&seat===5){
      const collar=box(scene,"deadeye-high-asymmetric-collar",[.20,.42,.28],V(.26,.36,-.08),p.teal,torso,.055);collar.rotation.z=-.22;
      for(const sign of [-1,1]){const tail=box(scene,"deadeye-split-long-coat",[.25,.58,.15],V(sign*.19,-.40,-.15),p.dark,torso,.04);tail.rotation.z=sign*.10;}
      tube(scene,"deadeye-cross-body-sling",[V(-.25,.30,.27),V(0,.02,.27),V(.23,-.20,.25)],.035,p.gold,torso);
    }
    if(finale&&seat===6){
      for(const sign of [-1,1]){
        const stole=box(scene,"lifeline-long-teal-stole",[.19,.96,.10],V(sign*.24,-.06,.24),p.teal,torso,.04);stole.rotation.z=sign*.10;
        box(scene,"lifeline-gold-stole-end",[.20,.12,.12],V(sign*.28,-.48,.24),p.gold,torso,.025);
      }
      sculpted(scene,"lifeline-high-mantle",[[-.08,.29,.18],[0,.395,.24],[.08,.27,.18]],V(0,.32,-.02),p.teal,torso,10);
    }
  }
  const limbs={l:{},r:{}},hipSpread=hero?(finale?.27:.245):finale&&director&&seat===1?.26:.205;
  for(const [side,sign] of [["l",1],["r",-1]]){
    const a=limbs[side];
    a.shoulder=node(scene,side+"-shoulder",torso,V(sign*.335,.255,0));
    if(finale)sculpted(scene,"sculpted-deltoid-sleeve",[[-.215,.09,.105],[-.14,.12,.13],[.06,.15,.16],[.15,.14,.14],[.215,.085,.09]],V(0,-.135,0),cloth,a.shoulder,10);
    else softLimb(scene,"continuous-upper-sleeve",.43,.139,V(0,-.135,0),cloth,a.shoulder);
    a.elbow=node(scene,side+"-elbow",a.shoulder,V(0,-.29,0));
    if(finale)sculpted(scene,"sculpted-forearm-cuff",[[-.175,.085,.09],[-.12,.10,.105],[.05,.13,.14],[.175,.105,.11]],V(0,-.095,0),cloth,a.elbow,10);
    else softLimb(scene,"continuous-elbow-to-cuff",.35,.122,V(0,-.095,0),cloth,a.elbow);
    a.hand=node(scene,side+"-hand",a.elbow,V(0,-.24,0));
    if(finale)sculpted(scene,"sculpted-knuckle-glove",[[-.09,.065,.06],[-.04,.085,.075],[.035,.085,.07],[.09,.06,.055]],V(0,-.018,0),hero?p.leather:p.skin,a.hand,8);
    else egg(scene,"hand",[.18,.20,.18],V(0,-.018,0),p.skin,a.hand);
    a.hip=node(scene,side+"-hip",pelvis,V(sign*hipSpread,-.07,0));
    if(finale)sculpted(scene,"shaped-trouser-thigh",[[-.22,.105,.11],[-.13,.13,.14],[.07,.16,.17],[.22,.13,.14]],V(0,-.14,0),p.pants,a.hip,10);
    else softLimb(scene,"continuous-thigh",.44,.16,V(0,-.14,0),p.pants,a.hip);
    a.knee=node(scene,side+"-knee",a.hip,V(0,-.28,0));
    if(finale)sculpted(scene,"shaped-trouser-shin",[[-.18,.09,.10],[-.08,.105,.12],[.06,.13,.145],[.18,.105,.12]],V(0,-.09,0),p.pants,a.knee,10);
    else softLimb(scene,"continuous-knee-to-boot",.36,.137,V(0,-.09,0),p.pants,a.knee);
    a.foot=node(scene,side+"-foot",a.knee,V(0,-.23,.045));
    if(finale)sculpted(scene,"chamfered-boot-and-toe",[[-.09,.13,.215,.08],[-.045,.145,.22,.07],[.025,.125,.18,.045],[.09,.105,.12,-.025]],V(0,-.025,0),p.shoe,a.foot,10);
    else box(scene,"rounded-boot",[.34,.18,.46],V(0,-.025,.08),p.shoe,a.foot,.075);
    if(guard)box(scene,"charging-forearm-guard",[.30,.32,.30],V(0,-.13,.035),p.steel,a.elbow,.075);
    if(finale&&hero){
      sculpted(scene,"warrior-shaped-pauldron",[[-.13,.15,.17],[-.04,.20,.215],[.09,.18,.19],[.15,.09,.11]],V(sign*.035,-.02,0),p.leather,a.shoulder,10);
      sculpted(scene,"warrior-forearm-bracer",[[-.095,.10,.105],[0,.145,.15],[.095,.12,.13]],V(0,-.18,.01),p.lapel,a.elbow,10);
      sculpted(scene,"warrior-shaped-boot-cuff",[[-.12,.115,.12],[0,.15,.16],[.12,.13,.14]],V(0,-.13,.01),p.leather,a.knee,10);
    }
  }
  const sockets={},equipment={};let weaponMount=null,shieldMount=null;
  sockets.leftFist=node(scene,"left-physical-fist",limbs.l.hand,V(0,-.10,.025));
  sockets.rightFist=node(scene,"right-physical-fist",limbs.r.hand,V(0,-.10,.025));
  sockets.weapon=node(scene,"actual-weapon-contact",limbs.l.hand,V(0,-.10,.025));
  if(hero){
    const h=hammer(scene,limbs.l.hand,p,finale);weaponMount=h.grip;equipment.hammer=h.grip;
    shieldMount=shield(scene,limbs.r.hand,p,finale);equipment.shield=shieldMount;
    equipment.leftGPU=gpu(scene,limbs.l.hand,p);equipment.rightGPU=gpu(scene,limbs.r.hand,p);
    equipment.tray=node(scene,"temporary-restaurant-tray",limbs.l.hand,V(0,-.12,.05));
    const platter=cylinder(scene,"silver-tray-face",.66,.045,V(),p.steel,equipment.tray,24);platter.rotation.x=Math.PI/2;
    equipment.wires=node(scene,"cuda-cuff-conduits",torso);
    for(const sign of [-1,1])tube(scene,"thin-green-parallel-wire",[V(sign*.19,.18,.23),V(sign*.29,.07,.24),V(sign*.30,-.08,.23)],.009,p.wire,equipment.wires);
    sockets.shield=shieldMount;
  }else if(ally||casual||kind==="runner"){
    if(kind==="tray_thrower"){const plate=cylinder(scene,"customer-held-plate",.43,.035,V(0,-.06,.08),p.paper,limbs.r.hand,20);plate.rotation.x=Math.PI/2;}
  }else if(director){
    weaponMount=directorProp(scene,limbs.r.hand,p,seat,finale);sockets.weapon.parent=weaponMount;sockets.weapon.position.set(0,-.15,.16);
    if(finale&&seat===9){weaponMount.parent=root;weaponMount.position.set(.48,0,-.12);sockets.weapon.position.set(0,.75,0);}
    sockets.muzzle=node(scene,"meeting-device-release",weaponMount,finale&&seat===3?V(0,.405,.12):finale&&seat===5?V(0,.05,1.23):finale&&seat===6?V(0,1.12,0):finale&&seat===9?V(0,1.65,0):finale&&seat===10?V(0,-.05,.12):V(0,-.08,.24));
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
  let catchPalm=null,emitterTop=null,emitterCore=null,discBlade=null;
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
    if(finale&&hero&&stage>=7){
      torso.rotation.y=-.12;torso.rotation.x=.055;headNode.rotation.y=.12;
      limbs.l.shoulder.rotation.x=-.48;limbs.l.shoulder.rotation.z=.26;limbs.l.elbow.rotation.x=-.62;
      limbs.r.shoulder.rotation.x=-.20;limbs.r.shoulder.rotation.z=-.62;limbs.r.elbow.rotation.x=-.95;limbs.r.hand.rotation.x=.32;
      shieldMount.rotation.y=-.35;
      limbs.l.hip.rotation.z=-.06;limbs.r.hip.rotation.z=.06;
    }
    if(finale&&director){
      if(seat===1){
        torso.rotation.x=.13;limbs.r.shoulder.rotation.x=-.85;limbs.r.elbow.rotation.x=-.55;limbs.r.hand.rotation.x=1.4;
        limbs.l.shoulder.rotation.z=.33;limbs.l.elbow.rotation.x=-1.0;weaponMount.rotation.y=0;
      }else if(seat===4){
        limbs.r.shoulder.rotation.x=-.90;limbs.r.shoulder.rotation.z=.50;limbs.r.elbow.rotation.x=-.50;
        limbs.r.hand.rotation.x=1.40;limbs.r.hand.rotation.z=-.50;weaponMount.rotation.y=0;
        limbs.l.shoulder.rotation.x=-.65;limbs.l.elbow.rotation.x=-.90;
      }else if(seat===3){
        limbs.r.shoulder.rotation.x=-.70;limbs.r.elbow.rotation.x=-.65;limbs.r.hand.rotation.x=1.35;limbs.r.hand.rotation.z=.12;
        limbs.l.shoulder.rotation.x=-.90;limbs.l.shoulder.rotation.z=-.55;limbs.l.elbow.rotation.x=-.60;
        torso.rotation.x=.11;pelvis.position.y-=.025;weaponMount.rotation.setAll(0);
        for(const side of["l","r"]){limbs[side].hip.rotation.x=-.30;limbs[side].knee.rotation.x=.60;limbs[side].foot.rotation.x=-.30;}
      }else if(seat===5){
        torso.rotation.y=-.18;limbs.r.shoulder.rotation.x=-1.05;limbs.r.elbow.rotation.x=-.50;limbs.r.hand.rotation.x=1.55;
        limbs.l.shoulder.rotation.x=-1.1;limbs.l.shoulder.rotation.z=-.40;limbs.l.elbow.rotation.x=-.80;
        weaponMount.rotation.y=.18;headNode.rotation.y=.18;
      }else if(seat===6){
        limbs.r.shoulder.rotation.x=-.40;limbs.r.elbow.rotation.x=-.65;limbs.r.hand.rotation.x=1.05;
        limbs.r.shoulder.rotation.z=-.28;limbs.l.shoulder.rotation.z=.35;limbs.l.elbow.rotation.x=-.70;
      }else if(seat===9){
        limbs.r.shoulder.rotation.x=-.35;limbs.r.shoulder.rotation.z=-.45;limbs.r.elbow.rotation.x=-.90;
        limbs.l.shoulder.rotation.z=.45;limbs.l.elbow.rotation.x=-.60;
        weaponMount.rotation.setAll(0);
        if(emitterTop){emitterTop.position.y=2.02;emitterTop.rotation.setAll(0);emitterCore.position.y=1.65;}
      }else if(seat===10){
        torso.rotation.y=-.50;headNode.rotation.y=.50;
        limbs.r.shoulder.rotation.x=-.50;limbs.r.shoulder.rotation.z=-.55;limbs.r.elbow.rotation.x=-.75;limbs.r.hand.rotation.x=1.25;
        limbs.l.shoulder.rotation.z=.40;limbs.l.elbow.rotation.x=-.70;weaponMount.rotation.setAll(0);weaponMount.setEnabled(true);
        if(catchPalm)catchPalm.scaling.setAll(1);
        if(discBlade)discBlade.rotation.set(0,.55,-.30);
      }
    }
  };
  neutral();compact(root);
  if(finale&&director&&seat===10)catchPalm=limbs.r.hand.getChildMeshes(true).find(m=>m.material===p.skin)||null;
  if(finale&&director&&seat===10)discBlade=root.getChildTransformNodes(false).find(n=>n.name==="reclaimer-broadside-blade-pivot");
  if(finale&&director&&seat===9){emitterTop=root.getChildTransformNodes(false).find(n=>n.name==="ashfall-upper-hoop-pivot");emitterCore=root.getChildTransformNodes(false).find(n=>n.name==="ashfall-core-lift-pivot");}
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
      neutral();const time=s.time||0,speed=s.speed||0,cycle=(s.travel||0)*7.3,move=clamp((finale&&s.dead?0:speed)/3.8,0,1);
      if(finale&&hero){equipment.hammer.position.setAll(0);equipment.hammer.rotation.setAll(0);}
      if(!(finale&&s.dead))pelvis.position.y+=Math.sin(time*2.1)*.008+Math.abs(Math.sin(cycle))*move*.025;
      torso.rotation.z=-clamp(s.yawRate||0,-3,3)*.012;torso.rotation.y=Math.sin(cycle)*move*.075;
      if(finale&&director&&seat===10)torso.rotation.y-=.50;
      if(finale&&director&&seat===5)torso.rotation.y-=.18;
      for(const [side,sign] of [["l",1],["r",-1]]){
        const a=limbs[side],swing=Math.sin(cycle)*sign*move;
        a.hip.rotation.x=swing*.55;a.knee.rotation.x=Math.max(0,-swing)*.60;
        a.foot.rotation.x=-a.hip.rotation.x-a.knee.rotation.x;
        if(!s.action)a.shoulder.rotation.x-=swing*.14;
      }
      const action=!(finale&&s.dead)&&s.action&&!(s.action.duration>0&&s.action.age>=s.action.duration)?s.action:null;
      if(action&&hero){
        const t=action.age||0,kind=action.type,duration=action.duration||.45,hammered=stage>=7;
        const windup=action.windup??(kind==="skill2"?.18:kind==="skill1"?.08:hammered?.10:.08);
        const activeEnd=action.activeEnd??(kind==="skill2"?.42:kind==="skill1"?.26:hammered?.24:.19);
        const back=smooth(t/Math.max(.01,windup)),hit=smooth((t-windup)/Math.max(.01,activeEnd-windup)),recover=smooth((t-activeEnd)/Math.max(.01,duration-activeEnd));
        let drive=hit*(1-recover),load=back*(1-hit);let crouch=.35*load+.80*drive;
        if(kind==="basic"&&hammered&&finale){
          const heavy=!!action.finisher,sign=action.swing===2?-1:1;
          // The hammer reaches its forward strike at the actual fan contact boundary.
          const contact=heavy?.45:.70,anticipation=smooth(t/Math.max(.01,windup*.58));
          const strike=t<windup?contact*smooth((t-windup*.58)/Math.max(.01,windup*.42)):contact+(1-contact)*hit;
          const coil=anticipation*(1-recover),sweep=strike*(1-recover),recoil=Math.sin(Math.PI*recover);
          load=anticipation*(1-strike);drive=sweep;
          torso.rotation.y=sign*(-(heavy?.65:.34)*coil+(heavy?1.55:.86)*sweep);
          torso.rotation.x=-(heavy?.13:.04)*load+(heavy?.37:.17)*drive-.12*recoil;
          pelvis.rotation.y=sign*(-.18*load+(heavy?.28:.13)*drive);
          limbs.l.shoulder.rotation.x=-.48-(heavy?1.25:.95)*coil+(heavy?.55:.12)*sweep;
          limbs.l.shoulder.rotation.y=sign*(-(heavy?.85:.42)*coil+(heavy?1.8:1.02)*sweep);
          limbs.l.shoulder.rotation.z=.26+(heavy?.40:.16)*drive;
          limbs.l.elbow.rotation.x=-.62-(heavy?.32:.12)*load+.35*drive;
          limbs.l.hand.rotation.y=sign*.22*drive;
          crouch=(heavy?.65:.25)*load+(heavy?.95:.42)*drive;
          sockets.weapon.parent=limbs.l.hand;sockets.weapon.position.set(0,-.45,0);
        }else if(kind==="basic"&&hammered){
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
        if(stage>=6&&kind!=="skill1"){
          limbs.r.shoulder.rotation.x=(finale?-.20:.20)+.20*drive;limbs.r.elbow.rotation.x=-.95+.15*drive;
          shieldMount.rotation.y=(finale?-.35:-.72)-.35*drive;
        }
        headNode.rotation.y=-.24-torso.rotation.y*.55;headNode.rotation.x=-.08*drive;
      }else if(action){
        const t=action.age,wind=action.windup||.65;
        if(finale&&director&&seat===3&&action.type==="heat"){
          const f=smooth(t/wind),lift=smooth((t-wind*.70)/Math.max(.01,wind*.30))*(1-smooth((t-wind-.18)/.45));
          const kick=action.released&&t>=wind?Math.exp(-(t-wind)*10):0,settle=1-smooth((t-wind)/.70);
          torso.rotation.x=-.20*f*settle+.30*kick;pelvis.position.y-=.08*f*settle;
          limbs.r.shoulder.rotation.x=-.70-.85*lift-.15*f*settle;limbs.r.elbow.rotation.x=-.65+.30*lift;
          limbs.r.hand.rotation.x=-limbs.r.shoulder.rotation.x-limbs.r.elbow.rotation.x-torso.rotation.x;
          limbs.l.shoulder.rotation.x=-.90-.70*lift;limbs.l.elbow.rotation.x=-.60+.25*lift;
          headNode.rotation.x=-.12*lift+.15*kick;
          for(const side of["l","r"]){const bend=.30+.35*f*settle;limbs[side].hip.rotation.x=-bend;limbs[side].knee.rotation.x=2*bend;limbs[side].foot.rotation.x=-bend;}
        }else if(finale&&director&&seat===9&&action.type==="heat"){
          const f=smooth(t/wind),channel=f*(1-smooth((t-wind)/.55)),pulse=action.released&&t>=wind?Math.exp(-(t-wind)*9):0;
          pelvis.position.y+=.065*channel-.10*pulse;torso.rotation.x=-.12*channel+.25*pulse;
          for(const [side,sign]of[["l",1],["r",-1]]){
            const a=limbs[side];a.shoulder.rotation.x=-.35-1.10*channel+.60*pulse;a.shoulder.rotation.z=sign*(.45+.60*channel);a.elbow.rotation.x=-.60+.35*channel;
          }
          headNode.rotation.x=-.17*channel;weaponMount.rotation.y=.80*channel;
          emitterTop.position.y=2.02+.16*channel-.08*pulse;emitterTop.rotation.x=.22*channel*Math.sin(t*8);
          emitterCore.position.y=1.65+.10*channel-.05*pulse;
        }else if(finale&&director&&seat===10&&["disc","return_disc"].includes(action.type)){
          const f=smooth(t/wind),release=action.released?smooth((t-wind)/.16):0,recover=smooth((t-wind-.30)/Math.max(.10,(action.duration||wind+1)-wind-.30));
          torso.rotation.y=-.50-.75*f+1.45*release-.70*recover;torso.rotation.x=-.08*f+.20*release*(1-recover);
          limbs.r.shoulder.rotation.x=-.50-.50*f+.70*release;limbs.r.shoulder.rotation.y=-.75*f+1.45*release;
          limbs.r.shoulder.rotation.z=-.55-.30*f+.70*release;limbs.r.elbow.rotation.x=-.75-.45*f+1.10*release;
          limbs.r.hand.rotation.x=1.25-.65*release;limbs.r.hand.rotation.y=.60*release;
          limbs.l.shoulder.rotation.z=.40+.45*release;limbs.l.elbow.rotation.x=-.70+.35*release;
          headNode.rotation.y=-torso.rotation.y*.75;
          const displayWind=Math.sin(Math.PI*clamp(t/wind,0,1));
          limbs.r.shoulder.rotation.z-=.50*displayWind;
          discBlade.rotation.z=-.35;
        }else if(finale&&director&&seat===6&&(action.type==="heal"||action.type==="healing")){
          const f=smooth(t/wind),release=smooth((t-wind)/.24),held=1-smooth((t-wind-.40)/.5);
          torso.rotation.x=-.10*f*held;headNode.rotation.x=-.12*f*held;
          limbs.r.shoulder.rotation.x=-.40-.65*f*held;limbs.r.elbow.rotation.x=-.65+.20*f*held;limbs.r.hand.rotation.x=1.05+.45*f*held;
          limbs.l.shoulder.rotation.x=-.30-.85*f*held;limbs.l.shoulder.rotation.z=.35+.65*release*held;limbs.l.elbow.rotation.x=-.70+.40*release*held;
          pelvis.position.y+=.04*f*held;
        }else if(finale&&director&&seat===5&&action.type==="sniper"){
          const f=smooth(t/Math.max(.01,action.lockAt||wind)),locked=action.locked===true?1:0,kick=action.released&&t>=wind?Math.exp(-(t-wind)*14):0;
          const open=action.punishOpen===true&&action.released&&!action.cancelled&&t>=wind?1:0;
          const bolt=open?smooth((t-wind-.08)/.14)*(1-smooth((t-wind-.38)/.20)):0;
          torso.rotation.y=-.18-.28*f+.30*open;torso.rotation.x=.07*f-.18*kick+.10*open;
          pelvis.position.y-=Math.sin(time*2.1)*.008;
          if(locked&&!action.released)torso.rotation.z=0;
          pelvis.position.y-=.08*f+.035*locked;
          for(const side of["l","r"]){limbs[side].hip.rotation.x=-.65*f;limbs[side].knee.rotation.x=1.30*f;limbs[side].foot.rotation.x=-.65*f;}
          limbs.r.shoulder.rotation.x=-1.05+.35*kick+.25*open;limbs.r.elbow.rotation.x=-.50-.20*kick+.12*open;
          limbs.r.hand.rotation.x=-limbs.r.shoulder.rotation.x-limbs.r.elbow.rotation.x-torso.rotation.x-.28*kick;
          weaponMount.rotation.y=-torso.rotation.y+.55*open;
          limbs.l.shoulder.rotation.x=-1.10+.50*bolt;limbs.l.elbow.rotation.x=-.80-.70*bolt;limbs.l.shoulder.rotation.z=-.40+.30*bolt;
          headNode.rotation.x=.12*f-.15*kick;headNode.rotation.y=-torso.rotation.y;
        }else if(finale&&director&&seat===4&&["shieldBash","shield_bash"].includes(action.type)){
          // The guard is fully turned aside at the real .35s vulnerability boundary.
          const open=smooth((t-.23)/.12),push=smooth((t-wind+.10)/.10)*(1-smooth((t-(action.activeEnd||wind+.20))/.25));
          weaponMount.rotation.y=-1.15*open;
          limbs.r.shoulder.rotation.z=.50-.85*open;limbs.r.hand.rotation.z=-limbs.r.shoulder.rotation.z;
          limbs.r.shoulder.rotation.x=-.90-.45*push;limbs.r.elbow.rotation.x=-.50+.30*push;limbs.r.hand.rotation.x=1.40+.15*push;
          torso.rotation.y=.25*open;torso.rotation.x=.22*push;
          limbs.l.shoulder.rotation.z=.12+.35*open;headNode.rotation.y=-.25*open;
        }else if(finale&&director&&seat===1&&["guardCharge","charge"].includes(action.type)){
          const end=action.activeEnd||wind+.30,f=smooth(t/wind),rush=t>=wind&&t<end?1:0;
          const missed=action.punishOpen===true&&!action.cancelled&&t>=end,stumble=missed?smooth((t-end)/.10):0;
          const settle=1-smooth((t-end)/Math.max(.01,(action.duration||end+1)-end)),brace=t<end?f:settle;
          torso.rotation.x=.13+.30*brace+.22*stumble*settle;pelvis.position.y-=.10*brace+.07*stumble*settle;
          torso.rotation.z=-.19*stumble*settle;headNode.rotation.x=-.12*brace+.24*stumble*settle;
          limbs.r.shoulder.rotation.x=-.85-.30*brace+.40*stumble;
          limbs.r.shoulder.rotation.z=-.12-.65*stumble;limbs.r.elbow.rotation.x=-.55+.22*brace;
          limbs.r.hand.rotation.x=1.4+.08*brace;weaponMount.rotation.y=-1.20*stumble;
          limbs.l.shoulder.rotation.x=-.15+.60*rush;limbs.l.shoulder.rotation.z=.33+.65*stumble*settle;limbs.l.elbow.rotation.x=-1.0+.55*stumble*settle;
          limbs.l.hip.rotation.x-=.25*brace;limbs.r.hip.rotation.x+=.24*brace;
        }else if(["guardCharge","charge","shield_bash","shieldBash","heavyPunch","sweep","mechPunch"].includes(action.type)){
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
      if(finale&&director&&seat===10){
        weaponMount.setEnabled(!s.discOut);
        if(s.discOut&&!s.dead){
          if(!action){limbs.r.shoulder.rotation.x=-.95;limbs.r.shoulder.rotation.z=-.85;limbs.r.elbow.rotation.x=-.30;limbs.r.hand.rotation.x=1.25;}
          limbs.r.hand.rotation.y=.75;limbs.r.hand.rotation.z=-.35;
          if(catchPalm)catchPalm.scaling.set(1.18,.65,.70);
        }
      }
      if(finale&&hero&&stage>=7&&time<.45&&!action&&!s.dead){
        const catchProgress=smooth(time/.45),reach=Math.sin(Math.PI*clamp(time/.45,0,1));
        limbs.l.shoulder.rotation.x-=.80*reach;limbs.l.elbow.rotation.x+=.50*reach;
        torso.rotation.y+=.12*reach;headNode.rotation.y+=.18*reach;
        equipment.hammer.position.set(2.6*(1-catchProgress),2.1*(1-catchProgress)+.65*reach,.35*(1-catchProgress));
        equipment.hammer.rotation.z=4.5*(1-catchProgress);
      }
      if(finale&&director&&s.reactHeavy&&!s.dead&&s.reactAge>=0&&s.reactAge<.42){
        const hit=1-smooth(s.reactAge/.42),braced=[1,4,7].includes(seat),weight=braced?.43:1;
        torso.rotation.x-=.48*hit*weight;torso.rotation.y+=(seat%2?1:-1)*.22*hit*weight;
        headNode.rotation.x+=.24*hit*weight;pelvis.position.y-=.08*hit*weight;pelvis.position.z-=.06*hit*weight;
        for(const [side,sign]of[["l",1],["r",-1]]){
          const a=limbs[side];a.shoulder.rotation.z+=sign*.65*hit*weight;a.elbow.rotation.x-=.35*hit*weight;
          a.hip.rotation.x-=.12*hit*weight;a.knee.rotation.x+=.28*hit*weight;a.foot.rotation.x-=.16*hit*weight;
        }
      }else if(s.reactAge<.23&&!(finale&&s.dead)){const hit=Math.sin(Math.PI*clamp(s.reactAge/.23,0,1));torso.rotation.x-=hit*.15;headNode.rotation.x+=hit*.08;}
      if(s.dead){const f=smooth((s.deathAge||0)/.7);pelvis.position.y-=.39*f;pelvis.rotation.x=-1.45*f;limbs.l.elbow.rotation.x=-.5;limbs.r.elbow.rotation.x=-.6;}
      root.computeWorldMatrix(true);for(const n of root.getChildTransformNodes(false))n.computeWorldMatrix(true);
      if((hero||finale&&director&&[3,5].includes(seat))&&!s.dead){
        // Preserve a planted sole during the weight shift without translating the collision root.
        const inverse=root.getWorldMatrix().clone().invert();let lowest=Infinity;
        for(const side of ["l","r"]){const sole=B.Vector3.TransformCoordinates(V(0,-.115,.08),limbs[side].foot.getWorldMatrix());lowest=Math.min(lowest,B.Vector3.TransformCoordinates(sole,inverse).y);}
        pelvis.position.y-=lowest;
        for(const n of root.getChildTransformNodes(false))n.computeWorldMatrix(true);
      }
      if(discBlade&&!s.dead&&!s.discOut){
        // Turn only the blade about its frozen grip, keeping the open face readable from above.
        const inverse=limbs.r.hand.getWorldMatrix().clone().invert(),normal=B.Vector3.TransformNormal(V(0,.70,.72),inverse).normalize();
        discBlade.rotation.set(-Math.asin(clamp(normal.y,-1,1)),Math.atan2(normal.x,normal.z),-.35);discBlade.computeWorldMatrix(true);
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
function createProp(scene,kind,id,p,finale=false){
  let root,size;
  if(kind==="gray_box"||kind==="yellow_box"){
    const gray=kind==="gray_box";size=gray?[.64,.37,.43]:[.43,.39,.39];
    root=roundedBox(scene,id,size,finale?.012:.055,gray?p.boxGray:p.boxYellow);
    box(scene,"box-lid",[size[0]-.025,.052,size[2]-.025],V(0,size[1]/2-.012,0),gray?p.boxGray:p.boxLid,root,finale?.008:.026);
    box(scene,"box-catch",[.14,.035,.025],V(0,-.03,size[2]/2),gray?p.steel:p.boxLid,root,.008);
    if(finale){
      for(const sign of[-1,1]){
        box(scene,"flight-case-corner-rail",[.045,size[1]-.02,size[2]-.02],V(sign*(size[0]/2-.027),0,0),p.steel,root,.008);
        box(scene,"flight-case-lock",[.065,.10,.025],V(sign*size[0]*.22,.035,size[2]/2-.01),p.edge,root,.007);
      }
      box(scene,"flight-case-handle",[size[0]*.36,.04,.025],V(0,-.07,size[2]/2-.01),p.dark,root,.006);
    }
  }else{
    root=node(scene,id);
    if(kind==="table"){
      size=[1.9,.82,.78];box(scene,"warm-table-top",[1.9,.16,.78],V(0,.74,0),p.wood,root,finale?.012:.06);
      box(scene,"table-front-edge",[1.84,.09,.045],V(0,.67,finale?.365:.38),finale?p.steel:p.woodEdge,root,.018);
      if(finale){
        for(const x of[-.77,.77])box(scene,"steel-console-pedestal",[.20,.67,.58],V(x,.335,0),p.armor,root,.015);
        for(const x of[-.43,.43])box(scene,"recessed-console-panel",[.61,.012,.45],V(x,.814,0),p.dark,root,.008);
        box(scene,"console-status-strip",[1.34,.009,.025],V(0,.815,-.20),p.teal,root,.003);
      }else for(const x of [-.77,.77])for(const z of [-.25,.25])box(scene,"table-leg",[.13,.67,.13],V(x,.335,z),p.tableLeg,root,.025);
    }else if(kind==="planter"){
      size=[1.08,1.15,.94];
      if(finale){
        box(scene,"industrial-cooling-plinth",[1.08,.53,.94],V(0,.265,0),p.armor,root,.018);
        box(scene,"cooling-dark-intake",[.94,.36,.025],V(0,.27,.445),p.dark,root,.008);
        for(let i=0;i<3;i++)box(scene,"cooling-angled-louvre",[.86,.055,.09],V(0,.14+i*.12,.412),p.steel,root,.006).rotation.x=-.22;
        for(const x of[-.34,0,.34])box(scene,"cooling-open-top-fin",[.075,.22,.66],V(x,.64,0),p.steel,root,.009);
        box(scene,"cooling-status-bar",[.045,.31,.025],V(-.49,.27,.452),p.teal,root,.004);
      }else{
        box(scene,"cream-planter",[1.08,.46,.94],V(0,.23,0),p.wall,root,.12);
        box(scene,"planter-rim",[1.10,.10,.96],V(0,.45,0),p.wallTop,root,.08);
        box(scene,"soil-inset",[.88,.032,.75],V(0,.505,0),p.soil,root,.075);
        const leaves=[[-.27,.72,-.18,.48],[.15,.76,-.19,.52],[.33,.70,.11,.43],[-.32,.70,.14,.45],[-.06,.84,.05,.57],[.02,1.0,-.11,.43],[.14,.72,.28,.39],[-.15,.68,.29,.38]];
        leaves.forEach(([x,y,z,s],i)=>egg(scene,"trimmed-foliage",[s,s*.89,s],V(x,y,z),[p.leaf,p.leafLight,p.leafDark][i%3],root));
      }
    }else if(kind==="server"){
      size=[.68,1.28,.64];box(scene,"server-tower",size,V(0,.64,0),p.server,root,finale?.016:.075);
      box(scene,"server-top-inset",[.53,.024,.47],V(0,1.285,0),p.dark,root,.04);
      for(let i=0;i<4;i++){
        box(scene,"server-drawer",[.53,.18,.035],V(0,.23+i*.245,.331),p.dark,root,.025);
        box(scene,"server-amber-status",[.25,.044,.018],V(.065,.23+i*.245,.358),finale?p.teal:p.boxYellow,root,.008);
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
