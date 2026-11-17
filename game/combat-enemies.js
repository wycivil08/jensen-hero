/* Shared R7 enemy states. No HP commits: sweepHero only queues host contacts.
 * Geometry: segment = moving circle; capsule = static finite ray; arc = sector;
 * circle = heat. All carry absolute atFrom/atTo. Packet.expiresAt is an
 * absolute exclusive deadline: host rejects at>=expiresAt before queueing.
 * Render attack.shapes unchanged.
 * Hazards also retain typeId/id, duration, sourcePoint, renderKind and end;
 * attack adds origin/target, variant, tell/active/recovery, curveSign, travelled,
 * laneRelease/startedAt, reservationReleased, shapes/contactShape, trajectory and
 * turnPoint. shieldSlice keeps one contact-time posture boundary. Moving hazards
 * add trail; disc/arc/heat fields follow INTERFACES.md. No embedded callbacks.
 */
(function(root){
  'use strict';
  const FIXED=1/120, rad=Math.PI/180, clone=x=>JSON.parse(JSON.stringify(x));
  const point=o=>({x:o.x,y:o.y});
  const angle=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x);
  const distance=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
  const stamp=ctx=>ctx.to??ctx.clock;
  const from=ctx=>ctx.from??ctx.clock;
  function waitSeconds(value,fallback){
    if(value===undefined)return fallback;
    if(!Number.isFinite(value)||value<0)throw Error('Enemy wait must be finite and nonnegative');
    return value;
  }
  function create(config,spawn,attempt){
    if(!config||!spawn||spawn.id==null||!Number.isFinite(spawn.x)||!Number.isFinite(spawn.y))throw Error('Enemy requires validated config and unique spawn id');
    const c=clone(config);
    if(c.pattern==='ground_heat'&&!(c.pattern_params.heat.tick_interval>=FIXED))throw Error('Heat interval below fixed step');
    if(c.pattern==='alternating_lane'&&!(c.pattern_params.period_seconds>=FIXED&&c.pattern_params.parity_offset_seconds>=FIXED))throw Error('Lane period below fixed step');
    const ordinal=spawn.spawnOrdinal??spawn.ordinal??spawn.id;
    if(!Number.isInteger(ordinal)||ordinal<1)throw Error('Enemy requires a unique positive spawn ordinal');
    return {id:spawn.id,r7:true,role:c.typeId,typeId:c.typeId,ownerId:String(attempt)+':owner:'+ordinal,attempt,spawnOrdinal:ordinal,config:c,
      x:spawn.x,y:spawn.y,r:c.collision_r,hp:c.hp,maxHp:c.hp,scale:c.scale,state:'chase',t:0,wait:waitSeconds(spawn.initialWait,1+ordinal*.27),
      face:Math.PI/2,walk:0,moveAmt:0,flash:0,jz:0,dead:false,dying:false,retire:0,entered:spawn.entered!==false,attack:null,
      actionSeq:0,controlProtectedNext:false,controlProtected:false,staggerUntil:0,closedElapsed:0,shieldClosed:c.pattern==='shield_cycle_bash',
      parity:typeof c.pattern_params.parity==='number'?c.pattern_params.parity:(spawn.column??0)%2,lastLaneSlot:null};
  }
  function packet(o,emissionId,sourcePoint){
    return {attempt:o.attempt,ownerId:o.ownerId,typeId:o.typeId,rootId:o.rootId,emissionId,damage:o.damage,damageKind:o.damageKind,sourcePoint:point(sourcePoint),...(o.expiresAt==null?{}:{expiresAt:o.expiresAt})};
  }
  function clear(ctx,a,b,r){return ctx.walkable(a.x,a.y,r)&&ctx.walkable(b.x,b.y,r)&&ctx.clearSegment(a,b,r);}
  function clip(ctx,a,b,r){
    if(clear(ctx,a,b,r))return b;
    if(!ctx.walkable(a.x,a.y,r))return point(a);
    let lo=0,hi=1;
    for(let i=0;i<28;i++){const t=(lo+hi)/2,q={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};if(clear(ctx,a,q,r))lo=t;else hi=t;}
    return {x:a.x+(b.x-a.x)*lo,y:a.y+(b.y-a.y)*lo};
  }
  function releaseReservation(e,ctx){if(e.attack&&!e.attack.reservationReleased){ctx.releaseReservation(e.attack.rootId);e.attack.reservationReleased=true;}}
  function recover(e,ctx){releaseReservation(e,ctx);e.state='recover';e.t=e.attack.recovery;}
  function shapes(e,a){
    const c=a.config,p=c.pattern_params,origin=a.origin,tip=(length,offset=0)=>({x:origin.x+Math.cos(a.angle+offset)*length,y:origin.y+Math.sin(a.angle+offset)*length});
    if(c.pattern==='ground_heat')return [{kind:'circle',...a.target,r:p.heat.radius}];
    if(c.pattern==='locked_fist_sweep'&&a.variant==='sweep')return [{kind:'arc',...origin,angle:a.angle,halfAngle:p.sweep.half_angle*rad,radius:p.sweep.radius}];
    if(c.pattern==='locked_fist_sweep')return [{kind:'capsule',from:origin,to:tip(p.fist.reach),r:p.fist.radius}];
    if(c.pattern==='shield_cycle_bash')return [{kind:'capsule',from:origin,to:tip(p.bash_reach),r:p.bash_radius}];
    if(c.projectile){const n=p.burst_count??1,fan=(p.fan_degrees??0)*rad;return Array.from({length:n},(_,i)=>({kind:'capsule',from:origin,to:tip(c.projectile.length??c.range,n===1?0:(i/(n-1)-.5)*fan),r:c.projectile.radius}));}
    return [{kind:'capsule',from:origin,to:tip(p.max_distance??p.charge_speed*c.active_seconds),r:e.r}];
  }
  function begin(e,ctx,lane){
    const c=e.config,p=c.pattern_params,n=c.projectile?(p.burst_count??1):c.pattern==='ground_heat'?1:0;
    const rootId=e.ownerId+':action:'+(e.actionSeq+1);
    if(!ctx.reserve(rootId,{tells:1,hazards:n,heat:c.pattern==='ground_heat'?1:0}))return false;
    e.actionSeq++;const variant=c.pattern==='locked_fist_sweep'?(e.actionSeq%2?'fist':'sweep'):null,v=variant?p[variant]:null;
    const a={id:rootId,rootId,config:clone(c),bodyRadius:e.r,attempt:e.attempt,ownerId:e.ownerId,typeId:e.typeId,angle:e.face,origin:point(e),target:point(ctx.hero),
      hit:false,released:false,reservationReleased:false,variant,tell:v?.tell??c.tell_seconds,active:v?.active??(c.pattern==='shield_cycle_bash'?p.bash_active_seconds:c.active_seconds),
      recovery:v?.recovery??c.recovery_seconds,damage:v?.damage??(c.pattern==='shield_cycle_bash'?p.bash_damage:c.damage),damageKind:c.damageKind,
      curveSign:e.actionSeq%2?1:-1,travelled:0,laneRelease:lane?.release,startedAt:stamp(ctx)};
    a.shapes=shapes(e,a);
    for(const shape of a.shapes)if(shape.kind==='capsule')shape.to=clip(ctx,shape.from,shape.to,shape.r);
    if(c.pattern==='return_disc')a.turnPoint={x:a.origin.x+Math.cos(a.angle)*c.projectile.outbound_distance,y:a.origin.y+Math.sin(a.angle)*c.projectile.outbound_distance};
    if(c.pattern==='curved_arc_shot'){
      const pr=c.projectile,w=pr.turn_rate_deg_per_second*rad*a.curveSign;a.trajectory=[point(a.origin)];
      for(let i=1;i<=12;i++){const t=pr.curve_seconds*i/12,theta=a.angle+w*t;
        a.trajectory.push(w?{x:a.origin.x+pr.speed/w*(Math.sin(theta)-Math.sin(a.angle)),y:a.origin.y-pr.speed/w*(Math.cos(theta)-Math.cos(a.angle))}:{x:a.origin.x+Math.cos(a.angle)*pr.speed*t,y:a.origin.y+Math.sin(a.angle)*pr.speed*t});}
    }
    e.attack=a;e.state='tell';e.t=a.tell;e.moveAmt=0;
    e.controlProtected=e.controlProtectedNext;e.controlProtectedNext=false;return true;
  }
  function emit(e,ctx){
    const a=e.attack,c=a.config,p=c.pattern_params,pr=c.projectile,h=p.heat;
    const common={attempt:e.attempt,ownerId:e.ownerId,typeId:e.typeId,rootId:a.rootId,x:a.origin.x,y:a.origin.y,angle:a.angle,damage:a.damage,damageKind:a.damageKind,hit:false,age:0,sourcePoint:point(a.origin)};
    if(c.pattern==='ground_heat'){
      const t=stamp(ctx);ctx.emit({...common,id:a.rootId+':emit:0',emissionId:a.rootId+':emit:0',kind:'heat',x:a.target.x,y:a.target.y,r:h.radius,life:h.life,duration:h.life,damage:h.damage_per_tick,releaseAt:t,expiresAt:t+h.life,tickInterval:h.tick_interval,nextTick:0});return;
    }
    const n=p.burst_count??1;
    for(let i=0;i<n;i++){
      const angle=a.angle+(n===1?0:(i/(n-1)-.5)*(p.fan_degrees??0)*rad),kind=c.pattern==='return_disc'?'returnDisc':c.pattern==='curved_arc_shot'?'curvedArc':pr.kind==='beam'?'beam':'bullet';
      const hazard={...common,id:a.rootId+':emit:'+i,emissionId:a.rootId+':emit:'+i,kind,renderKind:pr.kind,angle,v:pr.speed,r:pr.radius,life:pr.life,duration:pr.life};
      if(kind==='beam')hazard.length=pr.length??c.range;
      if(kind==='returnDisc')Object.assign(hazard,{phase:'out',origin:point(a.origin),outboundDistance:pr.outbound_distance,travelled:0,outboundSpeed:pr.outbound_speed,returnSpeed:pr.return_speed});
      if(kind==='curvedArc')Object.assign(hazard,{turnRate:pr.turn_rate_deg_per_second*rad*a.curveSign,curveSeconds:pr.curve_seconds,curveSign:a.curveSign});
      ctx.emit(hazard);
    }
  }
  function laneSlot(e,ctx){
    const p=e.config.pattern_params,base=(p.attack_phase??0)+e.parity*p.parity_offset_seconds,tell=e.config.tell_seconds;
    const end=stamp(ctx),start=from(ctx),k=Math.floor((end+tell-base)/p.period_seconds),release=base+k*p.period_seconds,beginAt=release-tell;
    if(k<0||e.lastLaneSlot===k||beginAt>end||beginAt<start-p.slot_tolerance_seconds)return null;
    e.lastLaneSlot=k;return {k,release};
  }
  function chase(e,dt,ctx){
    const c=e.config,p=c.pattern_params,h=ctx.hero,d=distance(e,h)||1,dx=(h.x-e.x)/d,dy=(h.y-e.y)/d;
    e.face=angle(e,h);
    if(c.pattern==='shield_cycle_bash'){e.closedElapsed+=dt;e.shieldClosed=true;}
    const stop=p.stop_distance??p.desired_range??c.range*.7;
    if(c.pattern==='return_disc'&&p.orbit_speed){
      const radial=Math.max(-1,Math.min(1,(d-p.desired_range)/60)),side=e.actionSeq%2?1:-1;
      const vx=dx*radial-dy*side,vy=dy*radial+dx*side,n=Math.hypot(vx,vy)||1;ctx.move(e,vx/n*p.orbit_speed*dt,vy/n*p.orbit_speed*dt);
    }else if(c.pattern==='diagonal_charge'&&d>stop){
      const side=e.actionSeq%2?1:-1,goal={x:h.x-dy*p.approach_lateral_offset*side,y:h.y+dx*p.approach_lateral_offset*side},gd=distance(e,goal)||1;
      ctx.move(e,(goal.x-e.x)/gd*c.speed*dt,(goal.y-e.y)/gd*c.speed*dt);
    }else if(c.speed&&d>stop)ctx.move(e,dx*c.speed*dt,dy*c.speed*dt);else e.moveAmt=0;
    const lane=c.pattern==='alternating_lane'?laneSlot(e,ctx):null;
    if(c.pattern==='alternating_lane'&&!lane)return;
    const trigger=Object.prototype.hasOwnProperty.call(p,'trigger_range')?p.trigger_range:c.range;
    if(e.wait>0||(trigger!==null&&d>=trigger)||!ctx.visible(e,h)||stamp(ctx)<e.staggerUntil)return;
    if(c.pattern==='shield_cycle_bash'&&e.closedElapsed<p.closed_seconds)return;
    if(c.pattern==='ground_heat'&&!ctx.walkable(h.x,h.y,p.heat.radius))return;
    begin(e,ctx,lane);
  }
  function body(e,dt,ctx){
    const a=e.attack,c=a.config,p=c.pattern_params,old=point(e);let shape;
    if(['charge','heavy_charge','diagonal_charge'].includes(c.pattern)){
      let travel=p.charge_speed*dt;if(p.max_distance!=null)travel=Math.min(travel,Math.max(0,p.max_distance-a.travelled));
      const dx=p.max_distance==null?Math.cos(a.angle)*p.charge_speed*dt:Math.cos(a.angle)*travel,dy=p.max_distance==null?Math.sin(a.angle)*p.charge_speed*dt:Math.sin(a.angle)*travel;
      ctx.move(e,dx,dy);a.travelled+=distance(old,e);
      shape={kind:'segment',from:old,to:point(e),r:a.bodyRadius};
      if(distance(old,e)<dt*(p.stall_speed_threshold??50)||(p.max_distance!=null&&a.travelled>=p.max_distance))e.t=0;
    }else{
      shape={...a.shapes[0]};
      if(shape.kind==='capsule')shape.to=clip(ctx,shape.from,shape.to,shape.r);
    }
    a.contactShape=shape;
    if(!a.hit){
      const hit=ctx.sweepHero({...shape,atFrom:from(ctx),atTo:stamp(ctx)},packet(a,a.rootId+':emit:0',shape.kind==='segment'?old:a.origin));
      if(hit?.hit){a.hit=true;if(['charge','heavy_charge','diagonal_charge'].includes(c.pattern))e.t=0;}
    }
    e.t-=dt;if(e.t<=0)recover(e,ctx);
  }
  function advance(e,dt,ctx){
    if(e.attempt!==ctx.attempt)return;
    e.flash=Math.max(0,e.flash-dt);e.recoil=Math.max(0,(e.recoil||0)-dt/.18);
    if(e.dead||!e.entered)return;
    if(e.hp<=0){releaseReservation(e,ctx);e.controlProtected=false;e.retire-=dt;if(e.retire<=0)e.dead=true;return;}
    e.wait-=dt;
    if(e.state==='chase')chase(e,dt,ctx);
    else if(e.state==='tell'){
      const a=e.attack;e.t-=dt;
      if(a.config.pattern==='shield_cycle_bash'&&a.tell-e.t>=a.config.pattern_params.open_at_tell_seconds)e.shieldClosed=false;
      if(e.t<=0&&(a.laneRelease==null||stamp(ctx)>=a.laneRelease)){
        a.released=true;e.controlProtected=false;e.state='active';e.t=a.active;
        if(a.config.projectile||a.config.pattern==='ground_heat'){emit(e,ctx);recover(e,ctx);}
      }
    }else if(e.state==='active')body(e,dt,ctx);
    else if(e.state==='recover'){
      e.t-=dt;if(e.t<=0){const wait=waitSeconds(ctx.enemyWait,.6);e.state='chase';e.wait=wait;e.closedElapsed=0;e.shieldClosed=e.config.pattern==='shield_cycle_bash';}
    }
  }
  function step(e,dt,ctx){
    if(e.attempt!==ctx.attempt)return;
    if(e.config.pattern!=='shield_cycle_bash'){advance(e,dt,ctx);return;}
    const closedFrom=e.shieldClosed,faceFrom=e.face,positionFrom=point(e),state=e.state,t=e.t;
    const opening=e.attack?e.attack.config.pattern_params.open_at_tell_seconds-(e.attack.tell-t):0;
    advance(e,dt,ctx);
    e.shieldSlice={from:from(ctx),to:stamp(ctx),closedFrom,closedTo:e.shieldClosed,faceFrom,faceTo:e.face,positionFrom,positionTo:point(e),
      transitionAt:from(ctx)+Math.max(0,Math.min(dt,state==='tell'?opening:state==='recover'?t:0))};
  }
  function interrupt(e,now,ctx){
    if(e.attempt!==ctx.attempt||e.dead||e.hp<=0||e.controlProtected||e.state!=='tell'||!e.attack||e.attack.released)return false;
    if(e.config.ownerKind==='independent_seat'&&!e.config.clear_space_interrupt_eligible)return false;
    const wait=waitSeconds(ctx.enemyWait,.6);
    releaseReservation(e,ctx);e.attack=null;e.state='chase';e.wait=wait;e.controlProtected=true;e.controlProtectedNext=true;e.staggerUntil=now;return true;
  }
  function defenseMultiplier(e,p){
    if(e.config.pattern!=='shield_cycle_bash'||!p.sourcePoint)return 1;
    let closed=e.shieldClosed,face=e.face,position=e;const s=e.shieldSlice;
    if(s&&Number.isFinite(p.at)&&p.at>=s.from&&p.at<=s.to){
      closed=p.at<s.transitionAt?s.closedFrom:s.closedTo;
      const q=s.to>s.from?(p.at-s.from)/(s.to-s.from):1,turn=Math.atan2(Math.sin(s.faceTo-s.faceFrom),Math.cos(s.faceTo-s.faceFrom));
      face=s.faceFrom+turn*q;position={x:s.positionFrom.x+(s.positionTo.x-s.positionFrom.x)*q,y:s.positionFrom.y+(s.positionTo.y-s.positionFrom.y)*q};
    }
    if(!closed||p.sourcePoint.x===position.x&&p.sourcePoint.y===position.y)return 1;
    const delta=Math.atan2(Math.sin(angle(position,p.sourcePoint)-face),Math.cos(angle(position,p.sourcePoint)-face));
    const c=e.attack&&['tell','active','recover'].includes(e.state)?e.attack.config:e.config;
    return Math.abs(delta)<=c.pattern_params.closed_front_angle*rad/2?c.pattern_params.closed_damage_multiplier:1;
  }
  function sweep(h,ctx,a,b,atFrom,atTo){
    if(h.hit)return false;
    const hit=ctx.sweepHero({kind:'segment',from:a,to:b,r:h.r,atFrom,atTo},packet(h,h.emissionId,h.sourcePoint??a));
    if(hit?.hit)h.hit=true;return !!hit?.hit;
  }
  function stepHazard(h,dt,ctx){
    if(h.attempt!==ctx.attempt||h.ended||h.life<=0)return false;
    const t0=from(ctx),t1=stamp(ctx),oldAge=h.age??0;
    if(h.kind==='heat'){
      if(!(h.tickInterval>=FIXED)||!Number.isFinite(h.duration))throw Error('Invalid heat event interval');
      while(h.nextTick*h.tickInterval<h.duration-1e-12){
        const at=h.releaseAt+h.nextTick*h.tickInterval;
        if(at>t1)break;
        const ordinal=h.nextTick++;
        if(at<t0&&ordinal!==0)continue;
        if(ctx.visible(h,ctx.hero))ctx.sweepHero({kind:'circle',x:h.x,y:h.y,r:h.r,atFrom:at,atTo:at},packet(h,h.emissionId+':tick:'+ordinal,h));
      }
      h.age=Math.max(0,t1-h.releaseAt);h.life=Math.max(0,h.expiresAt-t1);return h.life>0;
    }
    h.expiresAt??=t0+h.life;
    const activeDt=Math.min(dt,h.life,Math.max(0,h.expiresAt-t0)),activeTo=t0+activeDt;
    if(activeDt<=0){h.life=0;return false;}
    if(h.kind==='beam'){
      h.end=clip(ctx,h,{x:h.x+Math.cos(h.angle)*h.length,y:h.y+Math.sin(h.angle)*h.length},h.r);
      if(!h.hit){const hit=ctx.sweepHero({kind:'capsule',from:point(h),to:h.end,r:h.r,atFrom:t0,atTo:activeTo},packet(h,h.emissionId,h));if(hit?.hit)h.hit=true;}
    }else{
      let remaining=activeDt,elapsed=0;
      while(remaining>0){
        let slice=remaining,speed=h.v,theta=h.angle;
        if(h.kind==='returnDisc'){
          speed=h.phase==='out'?h.outboundSpeed:h.returnSpeed;
          const left=h.phase==='out'?Math.max(0,h.outboundDistance-h.travelled):distance(h,h.origin);
          if(left<=1e-9){if(h.phase==='return')return false;h.phase='return';h.angle=angle(h,h.origin);continue;}
          if(speed>0)slice=Math.min(slice,left/speed);
        }
        if(h.kind==='curvedArc'){
          const curved=Math.max(0,Math.min(slice,h.curveSeconds-oldAge-elapsed));
          if(curved>0)slice=curved;
        }
        const a=point(h);let b;
        if(h.kind==='curvedArc'&&oldAge+elapsed<h.curveSeconds&&h.turnRate!==0){
          const endAngle=theta+h.turnRate*slice;
          b={x:h.x+h.v/h.turnRate*(Math.sin(endAngle)-Math.sin(theta)),y:h.y-h.v/h.turnRate*(Math.cos(endAngle)-Math.cos(theta))};h.angle=endAngle;
        }else b={x:h.x+Math.cos(theta)*speed*slice,y:h.y+Math.sin(theta)*speed*slice};
        if(!clear(ctx,a,b,h.r))return false;
        const hit=sweep(h,ctx,a,b,t0+elapsed,t0+elapsed+slice);h.x=b.x;h.y=b.y;
        if(h.kind==='curvedArc'||h.kind==='returnDisc'){h.trail??=[a];h.trail.push(point(b));if(h.trail.length>48)h.trail.shift();}
        if(h.kind==='returnDisc'){if(h.phase==='out')h.travelled+=speed*slice;}
        else if(hit)return false;
        remaining-=slice;elapsed+=slice;
        if(h.kind==='returnDisc'&&h.phase==='return'&&distance(h,h.origin)<=1e-8)return false;
      }
    }
    h.age=oldAge+activeDt;h.life=activeTo>=h.expiresAt?0:Math.max(0,h.life-activeDt);return h.life>0;
  }
  const api=Object.freeze({create,step,stepHazard,interrupt,defenseMultiplier});root.JensenCombatEnemies=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
