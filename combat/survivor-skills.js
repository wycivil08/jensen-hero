/* Modern journey warrior actions; fixed-loadout legacy fights retain their rules. */
(function(){
"use strict";
const B=window.BABYLON,V=(x=0,y=0,z=0)=>new B.Vector3(x,y,z),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function freeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
const RULES=freeze({cyclone:{windup:.15,pulses:[.22,.57,.92],duration:1.2,radius:2.25,factor:.8,cooldown:6,buff:2,reduction:.2,parryWindow:.18},leap:{windup:.22,flight:.44,recovery:.36,distance:4.8,radius:2.8,factor:2.8,cooldown:8},thunder:{delay:.13,hop:3.6,basicFactor:.45,landingFactor:.75}});
const names=g=>Object.freeze([g.stageData.shield?"Cyclone Guard":"Gauntlet Cyclone",g.stageIndex>=7?"Thunder Leap":"Breaker Leap"]);
function packet(r,suffix,factor){return{...r,id:r.id+":"+suffix,base:r.acceptedBaseD*factor,crit:false,cuda:{...r.cuda,enabled:false},directHit:new Set(),cudaHit:new Set(),packetHit:new Map(),shieldDecisions:new Map(),props:new Set(),directRecords:[],cudaTried:false,cudaReserved:false,feedback:false,thunderPacket:true};}
function ring(g,center,radius,r,type,life=.16){
  const count=16;for(let i=0;i<count;i++){const a=i/count*Math.PI*2,b=(i+1)/count*Math.PI*2;g.line(center.add(V(Math.sin(a)*radius,.045,Math.cos(a)*radius)),center.add(V(Math.sin(b)*radius,.045,Math.cos(b)*radius)),.035,g.fx.cuda,life,r,type);}
}
function near(g,center,radius){return g.actors.filter(a=>g.isHostile(a)&&Math.hypot(a.root.position.x-center.x,a.root.position.z-center.z)<=radius+a.m.hurtRadius&&!g.blocked(center.add(V(0,.6,0)),a.root.position.add(V(0,.6,0)))).sort((a,b)=>B.Vector3.DistanceSquared(a.root.position,center)-B.Vector3.DistanceSquared(b.root.position,center)||a.id.localeCompare(b.id));}
function strike(g,r,center,radius){
  const targets=near(g,center,radius);for(const a of targets)g.damage(r,a,a.root.position.add(V(0,.6,0)),center,"direct");
  ring(g,center,radius,r,r.warrior==="cyclone"?"cyclone-contact":"leap-impact");return targets;
}
function queueThunder(g,r,seed,landing){
  if(!seed)return;// A real hit releases thunder independently of the remaining swing or landing recovery.
  const state={root:packet(r,"discharge",1),source:seed.root.position.add(V(0,.6,0)),seed:seed.id,visited:new Set(),remaining:landing?3:2,factor:landing?RULES.thunder.landingFactor:RULES.thunder.basicFactor,at:g.simTime+RULES.thunder.delay};
  (g.warriorThunder??=[]).push(state);
}
function tickThunder(g){
  const queue=g.warriorThunder??=[];
  for(const q of [...queue]){
    if(g.hero.dead||g.ended){queue.splice(queue.indexOf(q),1);continue;}
    if(g.simTime+1e-9<q.at)continue;
    const first=q.visited.size===0?g.actors.find(a=>a.id===q.seed&&g.isHostile(a)&&B.Vector3.DistanceSquared(a.root.position,q.source)<=RULES.thunder.hop**2):null;
    const target=first&&!g.blocked(q.source,first.root.position.add(V(0,.6,0)))?first:near(g,q.source,RULES.thunder.hop).find(a=>!q.visited.has(a.id));
    if(!target){queue.splice(queue.indexOf(q),1);continue;}
    const point=target.root.position.add(V(0,.6,0)),from=q.visited.size?q.source:g.weapon(g.hero),r=packet(q.root,"thunder-"+q.visited.size,q.factor),before=target.hp;
    r.type="hammer-lightning";g.damage(r,target,point,q.source,"lightning");const actual=before-target.hp;
    if(actual>0){g.lightning(from,point,.10,.22,r,"hammer-fork");g.lightningEvents.push({rootId:r.id,owner:r.owner,target:target.id,point:point.asArray(),damage:actual,cosmetic:false,time:g.simTime});g.trimLog(g.lightningEvents);}
    q.visited.add(target.id);q.source=point;q.remaining--;q.at+=RULES.thunder.delay;
    if(!q.remaining)queue.splice(queue.indexOf(q),1);
  }
}
function install(p){
  if(p.warriorSkillsInstalled)return;p.warriorSkillsInstalled=true;
  const old=Object.fromEntries(["start","decide","contacts","pose","mitigateHero","damage","tick","cancel","clearTransient","hud","shieldPresented","snapshot"].map(k=>[k,p[k]]));
  p.start=function(a,type,yaw){
    const r=old.start.call(this,a,type,yaw);if(!r||!this.survivor||a!==this.hero||!["skill1","skill2"].includes(type))return r;
    if(type==="skill1"){
      const c=RULES.cyclone;r.warrior="cyclone";r.windup=c.windup;r.activeEnd=1;r.duration=c.duration;r.pulses=0;r.parryUsed=false;r.geometry={shape:"radial",radius:c.radius,cap:null};
      a.cooldowns[0]=this.simTime+c.cooldown;this.warriorGuardUntil=this.simTime+c.buff;
    }else{
      const c=RULES.leap;r.warrior="leap";r.windup=c.windup+c.flight;r.activeEnd=r.windup+.08;r.duration=r.windup+c.recovery;r.base=r.acceptedBaseD*c.factor;r.geometry={shape:"radial",radius:c.radius,cap:null};
      const from=a.root.position.clone(),delta=this.aim.subtract(from);delta.y=0;const length=Math.min(c.distance,delta.length());
      const direction=delta.lengthSquared()>.001?delta.normalize():V(Math.sin(yaw),0,Math.cos(yaw));
      const field=this.field||{arenaX:26,arenaZ:18};r.landing=from.add(direction.scale(length));r.landing.x=clamp(r.landing.x,-field.arenaX+.7,field.arenaX-.7);r.landing.z=clamp(r.landing.z,-field.arenaZ+.7,field.arenaZ-.7);
      const wall=this.solidHit(from.add(V(0,.5,0)),r.landing.add(V(0,.5,0)),null,a.ctrlRadius+.08);
      if(wall){const clear=Math.max(0,wall.t-.05);r.landing=B.Vector3.Lerp(from,r.landing,clear);}
      r.flightOrigin=from;r.telegraphAt=-Infinity;a.cooldowns[1]=this.simTime+c.cooldown;
    }
    return r;
  };
  p.decide=function(a,dt){
    if(this.survivor&&a===this.hero&&!a.dead&&a.stun<=0&&a.action?.warrior){
      const r=a.action;if(r.warrior==="cyclone")return this.survivorMove(dt).scale(.68);
      const c=RULES.leap;if(r.age<c.windup||r.age>=r.windup)return V();
      const d=r.landing.subtract(a.root.position);d.y=0;return d.scale(1/Math.max(dt,r.windup-r.age));
    }
    return old.decide.call(this,a,dt);
  };
  p.contacts=function(a){
    const r=a.action;if(!this.survivor||a!==this.hero||!r?.warrior)return old.contacts.call(this,a);
    if(a.dead||r.cancelled)return;
    if(r.warrior==="cyclone"){
      const c=RULES.cyclone;while(r.pulses<c.pulses.length&&r.age+1e-9>=c.pulses[r.pulses]){if(!r.pulses&&this.journey==="seats"&&this.journeyMode==="story")this.lastMove="cyclone";const hit=packet(r,"sweep-"+r.pulses++,c.factor);hit.warrior="cyclone";strike(this,hit,a.root.position,c.radius);}
    }else{
      if(!r.released&&r.age<r.windup&&this.simTime-r.telegraphAt>=.14){r.telegraphAt=this.simTime;ring(this,r.landing,RULES.leap.radius,r,"leap-landing-tell",.18);this.line(this.weapon(a),r.landing.add(V(0,.08,0)),.025,this.fx.cuda,.15,r,"leap-flight-guide");}
      if(!r.released&&r.age+1e-9>=r.windup){
        r.released=true;if(this.journey==="seats"&&this.journeyMode==="story")this.lastMove="leap";r.landedAt=this.simTime;const center=a.root.position.clone();r.landedPoint=center;const targets=strike(this,r,center,RULES.leap.radius);
        this.feedback(r,true,this.stageIndex>=7);this.sound.play(this.stageIndex>=7?"hammer":"heavy");
        if(this.stageIndex>=7){const point=this.weapon(a),top=point.add(V(0,2.2,0));this.lightning(top,point,.15,.24,r,"hammer-landing-bolt");queueThunder(this,r,targets[0]||near(this,center,RULES.leap.radius+RULES.thunder.hop)[0],true);}
      }
    }
  };
  p.pose=function(a){
    old.pose.call(this,a);const r=a.action;if(!this.survivor||a!==this.hero||a.dead||!r?.warrior)return;
    const rig=a.rig;if(r.warrior==="cyclone"){
      const q=clamp((r.age-RULES.cyclone.windup)/.9,0,1),spin=q*Math.PI*(this.settings.reduced?.65:4);
      rig.pelvis.rotation.y+=spin;rig.torso.rotation.y+=.32;rig.torso.rotation.x=.08;
      rig.limbs.l.shoulder.rotation.x=-1.15;rig.limbs.r.shoulder.rotation.x=-1.0;rig.limbs.l.elbow.rotation.x=-.22;
      if(r.age>=RULES.cyclone.windup&&r.age<1){const from=this.weapon(a);this.line(a.previousWeapon,from,.07,this.fx.cuda,this.settings.reduced?.08:.16,r,"cyclone-weapon-arc");}
    }else{
      const q=clamp((r.age-RULES.leap.windup)/RULES.leap.flight,0,1),lift=Math.sin(q*Math.PI)*(this.settings.reduced?.38:.85);
      // Keep the native hurt capsule targetable throughout the readable visual leap.
      rig.pelvis.position.y+=lift;rig.torso.rotation.x=q<.8?-.16:.38;
      const load=1-clamp((r.age-(r.windup-.12))/.12,0,1);
      rig.limbs.l.shoulder.rotation.x=-.45-2.2*load;rig.limbs.l.elbow.rotation.x=-.55;
      rig.limbs.r.shoulder.rotation.x=-1.15;rig.limbs.l.hip.rotation.x=-.35*Math.sin(q*Math.PI);rig.limbs.r.hip.rotation.x=.3*Math.sin(q*Math.PI);
    }
  };
  p.shieldPresented=function(a){if(this.survivor&&a===this.hero&&a.action?.warrior==="cyclone")return !!this.stageData.shield&&!a.dead&&a.stun<=0;return old.shieldPresented.call(this,a);};
  p.mitigateHero=function(r,t,origin,amount,packetId){
    const active=this.survivor&&t===this.hero&&this.simTime<(this.warriorGuardUntil||0)&&!t.dead;
    const action=t.action,cyclone=active&&action?.warrior==="cyclone";let result;
    if(cyclone&&this.stageData.shield&&!action.parryUsed&&action.age>=0&&action.age<RULES.cyclone.parryWindow&&t.stun<=0&&amount>0){
      const shield=window.R24Data.rules.shield,delta=origin.subtract(t.root.position);delta.y=0;
      if(shield.eligibleKinds.includes(r.damageKind)&&delta.lengthSquared()>1e-9&&B.Vector3.Dot(delta.normalize(),V(Math.sin(t.yaw),0,Math.cos(t.yaw)))>=Math.cos(shield.arc*Math.PI/360)){
        action.parryUsed=true;const event={rootId:r.id,owner:r.owner,target:t.id,packetId,mode:"cyclone-parry",success:true,incoming:amount,prevented:amount,actualDamage:0,time:this.simTime};
        this.blockEvents.push(event);this.trimLog(this.blockEvents);const point=t.rig.sockets.shield?.getAbsolutePosition().clone()||this.weapon(t);
        this.line(point.add(V(-.22,-.12,0)),point.add(V(.22,.18,0)),.085,this.fx.lightning,.16,r,"cyclone-parry-spark");this.line(point.add(V(-.16,.18,0)),point.add(V(.16,-.12,0)),.085,this.fx.lightning,.16,r,"cyclone-parry-spark");
        this.floatDamage("PARRY",false,point,"block",t);return{requested:0,prevented:amount,mode:"cyclone-parry",rolled:null,event};
      }
    }
    if(cyclone)t.action=null;
    try{result=old.mitigateHero.call(this,r,t,origin,amount,packetId);}finally{if(cyclone)t.action=action;}
    if(!active||amount<=0||result.requested<=0)return result;
    const requested=Math.max(1,Math.round(result.requested*(1-RULES.cyclone.reduction))),prevented=amount-requested;
    if(result.event){result.event.prevented=prevented;result.event.actualDamage=requested;result.event.mode+="+cyclone-guard";}
    else{result.event={rootId:r.id,owner:r.owner,target:t.id,packetId,mode:"cyclone-guard",success:prevented>0,incoming:amount,prevented,actualDamage:requested,time:this.simTime};this.blockEvents.push(result.event);this.trimLog(this.blockEvents);}
    return{...result,requested,prevented,mode:result.event.mode};
  };
  p.damage=function(r,t,point,origin,channel,packetId){
    const before=t.hp,result=old.damage.call(this,r,t,point,origin,channel,packetId);
    if(this.survivor&&this.stageIndex>=7&&r.owner===this.hero.id&&r.type==="basic"&&channel==="direct"&&t.hp<before&&!r.thunderQueued){r.thunderQueued=true;queueThunder(this,r,t,false);}
    return result;
  };
  p.tick=function(dt){const before=this.simTime,result=old.tick.call(this,dt);if(this.survivor&&this.simTime>before&&!this.ended)tickThunder(this);return result;};
  p.cancel=function(a,reason,discard){const r=a.action,result=old.cancel.call(this,a,reason,discard);if(this.survivor&&a===this.hero&&r?.warrior==="cyclone")this.warriorGuardUntil=0;return result;};
  p.clearTransient=function(){this.warriorThunder=[];this.warriorGuardUntil=0;return old.clearTransient.call(this);};
  p.snapshot=function(){
    const value=old.snapshot.call(this);if(!this.survivor)return value;const D=this.activeProfile().D;
    return freeze({...value,actualNumbers:{...value.actualNumbers,skill1:this.stageData.slot1?D*RULES.cyclone.factor*RULES.cyclone.pulses.length:null,skill2:this.stageData.slot2?D*RULES.leap.factor:null},warrior:{names:names(this),rules:RULES,guardUntil:this.warriorGuardUntil||0,guardRemaining:Math.max(0,(this.warriorGuardUntil||0)-this.simTime),lightningPending:(this.warriorThunder||[]).length,action:this.hero.action?.warrior||null,parryUsed:!!this.hero.action?.parryUsed,landing:this.hero.action?.landing?.asArray()||null}});
  };
  p.hud=function(){
    const result=old.hud.call(this);if(!this.survivor)return result;
    for(const [i,name]of names(this).entries()){
      const label=document.getElementById("label"+(i+1)),button=document.getElementById("skill"+(i+1));if(label)label.textContent=name;
      if(button){
        const unlocked=this.slotAvailable(i),left=Math.max(0,this.hero.cooldowns[i]-this.simTime),status=!unlocked?"Locked":this.hero.dead||this.ended?"Fight ended":this.paused||this.qaFrozen?"Paused":left?`Cooldown ${left.toFixed(1)} seconds`:"Ready";
        const help=i?`Aim at the landing; leap and impact.${this.stageIndex>=7?" Hammer lightning forks between rivals.":""}`:`Three moving cleaves; 20 percent damage reduction for two seconds.${this.stageData.shield?" First 0.18 seconds can parry one frontal ordinary hit.":""}`;
        button.setAttribute("aria-label",`${i+1} ${name}. ${status}. ${unlocked?help:""}`);button.title=`${name} · ${status} · ${i?8:6}s cooldown`;
      }
    }
    return result;
  };
}
window.SurvivorSkills=Object.freeze({install,names,rules:RULES});
})();
