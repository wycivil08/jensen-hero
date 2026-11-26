'use strict';
// Real Babylon mesh/rig checks; likeness and small-screen recognition need rendered review.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto'),B=require('../../combat/vendor/babylon.js');
const source=fs.readFileSync(__dirname+'/../../combat/models.js','utf8'),ctx={window:{BABYLON:B}};vm.runInNewContext(source,ctx);
const engine=new B.NullEngine(),scene=new B.Scene(engine);scene.useRightHandedSystem=true;
const p=ctx.window.R20Models.createPalette(scene,true),hero=ctx.window.R20Models.createActor(scene,'hero','appearance',p,{stage:8,finale:true});
const child=name=>hero.root.getChildTransformNodes(false).find(n=>n.name===name),formNames=['young-head-form','founder-head-form','mature-head-form'];
for(let stage=1;stage<=8;stage++){
  hero.setForm(stage);hero.pose({time:1,reactAge:99});
  assert.deepEqual(formNames.map(n=>child(n).isEnabled()),[stage===1,stage>=2&&stage<=5,stage>=6]);
  assert.equal(child('anatomical-left-thor-hammer').parent,hero.limbs.l.hand);
  assert.equal(child('anatomical-right-wafer-shield').parent,hero.limbs.r.hand);
  assert.equal(child('anatomical-left-thor-hammer').isEnabled(),stage>=7);
  assert.equal(child('anatomical-right-wafer-shield').isEnabled(),stage>=6);
  assert.equal(hero.sockets.weapon.parent,hero.limbs.l.hand);
  assert(Math.abs(hero.sockets.weapon.position.y-(stage>=7?-.45:stage>=2?-.205:-.10))<1e-9);
  assert.equal(hero.metrics.height,1.93);assert.equal(hero.metrics.radius,.32);
  for(const mesh of hero.meshes){
    for(const kind of [B.VertexBuffer.PositionKind,B.VertexBuffer.NormalKind])assert(mesh.getVerticesData(kind).every(Number.isFinite),mesh.name);
  }
}
const eyeVertices=name=>child(name).getChildMeshes(false).filter(m=>m.material===p.eye).reduce((sum,m)=>sum+m.getTotalVertices(),0);
for(const name of ['founder-head-form','mature-head-form'])assert(eyeVertices(name)>eyeVertices('young-head-form'));
const localVertices=(mesh,parent)=>{mesh.computeWorldMatrix(true);parent.computeWorldMatrix(true);const m=mesh.getWorldMatrix().multiply(parent.getWorldMatrix().clone().invert()),v=mesh.getVerticesData(B.VertexBuffer.PositionKind),out=[];for(let i=0;i<v.length;i+=3)out.push(...B.Vector3.TransformCoordinates(new B.Vector3(v[i],v[i+1],v[i+2]),m).asArray());return out;};
const shield=child('anatomical-right-wafer-shield'),wafer=shield.getChildMeshes(false).find(m=>m.material===p.waferGold),verts=localVertices(wafer,shield);
let front=0,back=0,notch=false;for(let i=0;i<verts.length;i+=3){assert(Math.abs(verts[i+2])<.031);if(Math.abs(verts[i])<.001&&verts[i+1]<-.47&&verts[i+1]>-.48)notch=true;if(verts[i+2]>.02)front++;else if(verts[i+2]<-.02)back++;}
assert(notch);assert(front>0&&back>0);assert.equal(p.waferGold.iridescence.isEnabled,true);
assert(shield.getChildMeshes(false).some(m=>m.material===p.waferScribe&&m.getTotalVertices()>200));
assert(!shield.getChildMeshes(false).some(m=>/chevron|crest|core/.test(m.name)));
const gpu=child('gpu-gauntlet');assert(gpu.getChildMeshes(false).some(m=>m.material===p.pcb));
const hammer=child('anatomical-left-thor-hammer');assert(hammer.getChildMeshes(false).filter(m=>m.material===p.woodEdge).some(m=>localVertices(m,hammer).filter((_,i)=>i%3===1).some(y=>y>.19)));
hero.setForm(1,true);assert.equal(child('temporary-restaurant-tray').isEnabled(),true);assert.equal(hero.sockets.shield,null);
assert.throws(()=>hero.setForm(9),/Hero stage/);
console.log(JSON.stringify({passed:true,modelsSHA256:crypto.createHash('sha256').update(source).digest('hex'),checks:['eight age/equipment gates','left hammer/right shield mounts and fixed contact offsets','finite real mesh positions and normals','young bare face/founder and mature glasses','thin golden notched wafer, die grid and no crest','PCB gauntlet and hammer butt loop','tray and invalid-stage guards']}));engine.dispose();
