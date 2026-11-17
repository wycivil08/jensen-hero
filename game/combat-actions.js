'use strict';

/* R7 supplies validated config and frame {attempt,time,hero:{x,y,oldX,oldY,r,face,aim},
 * movement:{x,y},autoRestart,shieldPresented,config,owners:[{ownerId,x,y,hp,dead}],visible(a,b),
 * defenseAt(at):{x,y,face,shieldPresented}}. Only defend samples defenseAt, at packet time.
 * Angles are radians. Incoming packets use damageKind and post-mitigation eligibleDamage.
 * Original commits include targetId and cudaSnapshot:{damage,...acceptedConfig.cuda}.
 * motion {replace,dx,dy,multiplier}: dx/dy cover only advance-window overlap;
 * multiplier weights ordinary movement over the remaining slice (0 during full advance).
 * carrier {rootId,source,hand,fromAt,toAt,startAngle,endAngle,reach,radius,rawDamage,
 * cap,pushDistance,stagger}: reach is carrier CENTER radius; host supplies collision/LOS.
 * guard {rootId,start,end,angle,degrees,remaining} describes the accepted half-open window.
 * CUDA nodes {ownerId,x,y,depth,parentId,alive}, edges {fromOwnerId,toOwnerId,from,to,depth};
 * packets retain original root/attacker, source:'cuda', damageKind:'cuda_link', and parent
 * sourcePoint. The host alone commits HP, owner/root caps, controls and projectile retirement.
 */
const JensenCombatActions = (() => {
  const TAU = Math.PI * 2;
  const clone = value => JSON.parse(JSON.stringify(value));
  const point = value => ({x:value.x,y:value.y});
  const compareId = (a,b) => a < b ? -1 : a > b ? 1 : 0;
  const overlap = (from,to,start,end) => Math.max(0,Math.min(to,end)-Math.max(from,start));
  const owned = (state,slot) => state.entry['slot_'+slot];
  const buff = (state,id) => state.entry.buffs.includes(id);
  const eligibleKind = kind => kind==='ordinary_light_melee'||kind==='discrete_projectile';
  const validFrame = (state,frame) => frame.attempt===state.attempt;
  function direction(frame,request) {
    const vector = request.direction || frame.movement;
    if (vector && Math.hypot(vector.x,vector.y)>0) return Math.atan2(vector.y,vector.x);
    return Number.isFinite(frame.hero.aim) ? frame.hero.aim : frame.hero.face;
  }
  function activeView(action) {
    if (!action) return null;
    const {rootId,slot,variant,start,end,angle,contactStart,contactEnd}=action;
    return {rootId,slot,variant,start,end,angle,contactStart,contactEnd};
  }
  function create(config,entry,attempt) {
    return {attempt,entry:clone(entry),sequence:0,active:null,
      guard:null,clearSpace:null,pending:null,cdEnd:{1:0,2:0},acceptedAt:null,
      autoNotBefore:0,cudaReadyAt:0,evaluated:new Set()};
  }
  function inspect(state) {
    const pending=state.pending;
    return {active:activeView(state.active),cdEnd:{...state.cdEnd},
      pending:pending?{slot:pending.slot,at:pending.at,expires:pending.expires}:null,
      autoNotBefore:state.autoNotBefore,cudaReadyAt:state.cudaReadyAt};
  }
  function expire(state,now) {
    if (state.pending && now>=state.pending.expires) state.pending=null;
    if (state.active && now>=state.active.end) state.active=null;
  }
  function allowed(state,request,now) {
    const slot=request.slot;
    return (slot===1||slot===2) && !!owned(state,slot) && now>=state.cdEnd[slot]
      && (!state.active||state.active.slot!==slot);
  }
  const mutexFree = (state,slot) => !state.active || (slot===1&&state.active.slot===2);
  function accept(state,request,now,frame) {
    const config=clone(frame.config),slot=request.slot;
    const values=slot===1?config.breakthrough:config.clear_space;
    const duration=slot===1?values.duration:values.windup+values.active+values.recovery;
    if (state.active && state.active.slot===2) state.clearSpace.end=now;
    const action={rootId:state.attempt+':hero:active:'+(++state.sequence),slot,
      variant:owned(state,slot).variant,start:now,end:now+duration,
      angle:direction(frame,request),contactStart:now+(slot===1?values.contactStart:values.windup),
      contactEnd:now+(slot===1?values.contactEnd:values.windup+values.active),
      config,contactLocked:slot===1||config.growth===true};
    state.active=action;
    state.guard=slot===1?{rootId:action.rootId,start:now+values.guardStart,
      end:now+values.guardEnd,angle:action.angle,
      degrees:action.variant==='shield_brace'?values.shieldGuardDegrees:values.gauntletGuardDegrees,
      remaining:1}:null;
    if (slot===2) state.clearSpace={start:now,end:action.end};
    state.cdEnd[slot]=now+values.cooldown;
    state.acceptedAt=now;
    state.pending=null;
    state.autoNotBefore=Math.max(state.autoNotBefore,frame.autoRestart,action.end);
    return activeView(action);
  }
  function request(state,requests,now,frame) {
    const result=()=>({started:null,cancelAutomatic:false,autoNotBefore:state.autoNotBefore});
    if (!validFrame(state,frame)) return result();
    expire(state,now);
    if (state.acceptedAt===now) return result();
    const fresh=requests.filter(r=>r.at===now&&allowed(state,r,now)).sort((a,b)=>a.slot-b.slot);
    const immediate=fresh.find(r=>mutexFree(state,r.slot));
    if (immediate) return {started:accept(state,immediate,now,frame),cancelAutomatic:true,autoNotBefore:state.autoNotBefore};
    for (const candidate of fresh) {
      if (!state.pending || candidate.slot<=state.pending.slot) {
        state.pending={slot:candidate.slot,at:now,expires:now+.12,
          direction:candidate.direction?point(candidate.direction):null};
      }
    }
    const pending=state.pending;
    if (pending && allowed(state,pending,now) && mutexFree(state,pending.slot)) {
      return {started:accept(state,pending,now,frame),cancelAutomatic:true,autoNotBefore:state.autoNotBefore};
    }
    return result();
  }
  function advance(state,from,to,frame) {
    const motion={replace:false,dx:0,dy:0,multiplier:1};
    const empty={motion,carrier:null,guard:null};
    if (!validFrame(state,frame)||to<=from) return empty;
    const action=state.active;
    if (!action) return empty;
    const config=action.config,dt=to-from;
    let carrier=null;
    if (action.slot===1) {
      const value=config.breakthrough;
      const duration=overlap(from,to,action.start+value.advanceStart,action.start+value.advanceEnd);
      if (duration>0) {
        const distance=value.advanceDistance*duration/(value.advanceEnd-value.advanceStart);
        Object.assign(motion,{replace:true,dx:Math.cos(action.angle)*distance,
          dy:Math.sin(action.angle)*distance,multiplier:1-duration/dt});
      }
    } else {
      motion.multiplier=1-(1-config.clear_space.moveMultiplier)*overlap(from,to,action.start,action.end)/dt;
    }
    const fromAt=Math.max(from,action.contactStart),toAt=Math.min(to,action.contactEnd);
    if (toAt>fromAt) {
      if (!action.contactLocked) {action.angle=frame.hero.face;action.contactLocked=true;}
      const slot1=action.slot===1,value=slot1?config.breakthrough:config.clear_space;
      const sweep=at=>slot1?action.angle:action.angle+TAU*(at-action.contactStart)/(action.contactEnd-action.contactStart);
      const outer=slot1?config.auto.reach:action.variant==='hammer_ring'?value.hammerRadius:value.gauntletRadius;
      carrier={rootId:action.rootId,source:slot1?'breakthrough':'clear_space',
        hand:action.variant==='shield_brace'?'right':action.variant==='hammer_ring'?'left':'right',
        fromAt,toAt,startAngle:sweep(fromAt),endAngle:sweep(toAt),
        reach:Math.max(0,outer-config.auto.radius),radius:config.auto.radius,
        rawDamage:config.auto.damage*value.damageMultiplier,cap:value.cap,
        pushDistance:value.pushDistance,stagger:slot1?0:value.stagger};
    }
    const guard=state.guard&&overlap(from,to,state.guard.start,state.guard.end)>0?{...state.guard}:null;
    if (to>=action.end) state.active=null;
    return {motion,carrier,guard};
  }
  function front(packet,hero,angle,degrees) {
    const dx=packet.sourcePoint.x-hero.x,dy=packet.sourcePoint.y-hero.y;
    if (dx===0&&dy===0) return false;
    const delta=Math.atan2(Math.sin(Math.atan2(dy,dx)-angle),Math.cos(Math.atan2(dy,dx)-angle));
    return Math.abs(delta)<=degrees*Math.PI/360;
  }
  function defend(state,packets,frame) {
    const seen=new Set();
    return [...packets].sort((a,b)=>a.at-b.at||compareId(a.rootId,b.rootId)||compareId(a.emissionId,b.emissionId)).map(packet=>{
      const identity=packet.rootId+'\0'+packet.emissionId;
      let damage=packet.eligibleDamage,caught=false;
      if (!validFrame(state,frame)||packet.attempt!==state.attempt||seen.has(identity)) damage=0;
      seen.add(identity);
      if (damage>0 && eligibleKind(packet.damageKind)) {
        const guard=state.guard,pose=frame.defenseAt(packet.at);
        if (guard&&guard.remaining&&packet.at>=guard.start&&packet.at<guard.end&&front(packet,pose,guard.angle,guard.degrees)) {
          guard.remaining=0;damage=0;caught=true;
        } else if (buff(state,'steady_guard')&&pose.shieldPresented
          && !(state.clearSpace&&packet.at>=state.clearSpace.start&&packet.at<state.clearSpace.end)
          && front(packet,pose,pose.face,frame.config.steady_guard.frontDegrees)) {
          damage*=frame.config.steady_guard.damageMultiplier;
        }
      }
      return {packet,damage,caught,endProjectile:caught&&packet.damageKind==='discrete_projectile'};
    });
  }
  function cuda(state,commits,frame) {
    if (!validFrame(state,frame)||!buff(state,'cuda_link')) return null;
    let seed;
    for (const commit of commits) {
      if (commit.attempt!==state.attempt || !['auto','breakthrough','clear_space'].includes(commit.source)
        || !commit.aliveBefore || !(commit.hpBefore-commit.hpAfter>0) || state.evaluated.has(commit.rootId)) continue;
      state.evaluated.add(commit.rootId);
      if (commit.at<state.cudaReadyAt) continue;
      seed=commit;break;
    }
    if (!seed) return null;
    const values=seed.cudaSnapshot;
    state.cudaReadyAt=seed.at+values.interval;
    // Every other positive root at this timestamp also spends its one evaluation.
    for (const commit of commits) if (commit.attempt===state.attempt&&['auto','breakthrough','clear_space'].includes(commit.source)
      &&commit.aliveBefore&&commit.hpBefore-commit.hpAfter>0) state.evaluated.add(commit.rootId);
    const owners=frame.owners.filter(owner=>!owner.dead&&owner.hp>0);
    const liveSeed=owners.some(owner=>owner.ownerId===seed.targetId);
    // A different root's kill cannot turn this contact into a dead-seed anchor.
    if (!liveSeed&&!seed.killedByThisHit) return null;
    const first={ownerId:seed.targetId,...point(seed.contactPoint),depth:0,parentId:null,alive:liveSeed};
    const nodes=[first],edges=[],included=new Set([first.ownerId]);
    for (let depth=1;depth<=values.maxDepth&&nodes.length<values.maxOwners;depth++) {
      const candidates=[];
      for (const parent of nodes.filter(node=>node.depth===depth-1)) for (const owner of owners) {
        if (included.has(owner.ownerId)) continue;
        const distance=Math.hypot(owner.x-parent.x,owner.y-parent.y);
        if (distance<=values.edgeRange && Math.hypot(owner.x-first.x,owner.y-first.y)<=values.seedRange
          && frame.visible(parent,owner)&&frame.visible(first,owner)) candidates.push({parent,owner,distance});
      }
      candidates.sort((a,b)=>a.distance-b.distance||compareId(a.owner.ownerId,b.owner.ownerId)||compareId(a.parent.ownerId,b.parent.ownerId));
      for (const {parent,owner} of candidates) {
        if (included.has(owner.ownerId)) continue;
        included.add(owner.ownerId);
        nodes.push({ownerId:owner.ownerId,...point(owner),depth,parentId:parent.ownerId,alive:true});
        edges.push({fromOwnerId:parent.ownerId,toOwnerId:owner.ownerId,from:point(parent),to:point(owner),depth});
        if (nodes.length>=values.maxOwners) break;
      }
    }
    const packets=nodes.filter(node=>node.alive).map((node,index)=>{
      const parent=node.parentId===null?node:nodes.find(item=>item.ownerId===node.parentId);
      return {attempt:state.attempt,rootId:seed.rootId,emissionId:seed.rootId+':cuda:'+index,
        ownerId:seed.ownerId,targetId:node.ownerId,at:seed.at,damageKind:'cuda_link',
        rawDamage:values.damage*values.damageMultiplier,sourcePoint:point(parent),contactPoint:point(node),source:'cuda'};
    });
    return {rootId:seed.rootId,nodes,edges,packets};
  }
  function clear(state,now) {
    if (state.clearSpace&&state.clearSpace.end>now) state.clearSpace.end=now;
    state.active=null;state.pending=null;state.guard=null;
  }
  function nextBoundary(state,after,before) {
    const boundaries=[];
    if (state.pending) boundaries.push(state.pending.expires);
    if (state.active) {
      const a=state.active;
      boundaries.push(a.start,a.end,a.contactStart,a.contactEnd);
      if (a.slot===1) boundaries.push(a.start+a.config.breakthrough.advanceStart,a.start+a.config.breakthrough.advanceEnd);
    }
    if (state.guard) boundaries.push(state.guard.start,state.guard.end);
    return boundaries.reduce((next,time)=>time>after&&time<next?time:next,before);
  }
  return Object.freeze({create,request,advance,defend,cuda,clear,nextBoundary,inspect});
})();
globalThis.JensenCombatActions=JensenCombatActions;
if (typeof module!=='undefined'&&module.exports) module.exports=JensenCombatActions;
