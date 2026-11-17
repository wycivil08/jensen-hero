/* R7_RUNTIME_BEGIN */
const R7=(()=>{
  const labMode=new URLSearchParams(location.search).get('lab')==='1';
  let labConfig=null,labImmortal=true,labStatic=false,labMounted=false,labOrdinal=0,combatConfig=null,combatState=null,activeCarrier=null,networkFX=[],roundRobin=0;
  const reservations=new Map(),incomingSeen=new Set(),rootRecords=new Map(),pickupRejected=new WeakMap(),activeFingers={1:null,2:null};let incoming=[],originalCommits=[],activeRequests=[],frameStart=0;
  const FIXED=1/120,profiles={bare:{damage:8,cycle:.7,reach:30,cap:1,radius:7},tray:{damage:12,cycle:.7,reach:45,cap:3,radius:14},gpu:{damage:12,cycle:.36,reach:45,cap:3,radius:9}};
  let profile=null,store=null,phase='title',level=1,clock=0,acc=0,attempt=0,seq=0,hand=0,action=null,nextAttack=0,targetId=null,destination=null,route=[],routeGoal=null,routeUntil=0,portrait=false,hintUntil=8,tray=false,pickups=[],allies=[],offers=[],hazards=[],receipt=null,pending=null,busy=false,shot=0,replay=false,imageGeneration=0,lastError='',contacts=0,storyReadyAt=0,storyPointer=null;
  const storyPointers=new Set();
  let aimGesture=null,lastAim=null,releaseRequest=null,damageLog=[],swingTrails=[];
  const directional=()=>labMode;
  const handHeight=()=>labMode?22:17;
  const R7Material=p=>p?.id==='hammer_shield_fast'?'hammer':kit(p);
  const critical=()=>labMode&&Math.random()<current().critChance?current().critMultiplier:1;
  const live=()=>phase==='combat'&&!G.paused&&!portrait&&!document.hidden&&!G.hero.dead;
  const current=()=>labMode&&labConfig?labConfig.auto:profile?.frontier===2?profiles.gpu:tray?profiles.tray:profiles.bare;
  const copy=R7Store.clone;
  function connect(){return R7Store.connect(localStorage,fn=>{
    if(!globalThis.navigator?.locks?.request)return Promise.reject(Error('Saving is unavailable here. Open the secure preview page in a current browser.'));
    return navigator.locks.request(R7Store.KEY,{mode:'exclusive'},fn);
  });}
  function clearInput(stop=true){Input.reset();aimGesture=null;lastAim=null;releaseRequest=null;if(stop&&combatState){JensenCombatActions.clear(combatState,clock);activeCarrier=null;activeRequests=[];activeFingers[1]=activeFingers[2]=null;}$('btnAtk').classList.remove('aiming');if(stop&&G.hero){G.hero.vx=G.hero.vy=0;G.hitStop=0;}action=null;targetId=null;destination=null;route=[];routeGoal=null;acc=0;}
  function overlay(title,text,buttons=[]){
    $('r7Modal').classList.remove('hidden');$('r7Heading').textContent=title;$('r7Text').textContent=text;
    $('r7Modal').classList.remove('story','lesson');$('r13Learn').hidden=true;cancelStoryGesture();$('r7Art').hidden=true;$('r7Diagram').setAttribute('hidden','');$('r7Alt').textContent='';imageGeneration++;
    for(const id of ['r7Next','r7Skip','r7Previous','r7Retry','r7Reload'])$(id).hidden=!buttons.includes(id);
    $('r7Reload').textContent=labMode?'重置入场':'Reload saved frontier';
    for(const id of ['ovTitle','ovPause','hudR','touchUI','game'])$(id).inert=true;
    $('r7Heading').focus();viewport();
  }
  function closeModal(){cancelStoryGesture();for(const id of ['ovTitle','ovPause','hudR','touchUI','game'])$(id).inert=false;$('r7Modal').classList.add('hidden');imageGeneration++;clearInput();$('game').inert=portrait;if(portrait)$('r9RotateFullscreen').focus();else if(phase==='combat')$('game').focus();}
  async function persist(next,after){
    if(busy)return;busy=true;pending={next:copy(next),after};clearInput();G.state='r7-save';phase='saving';
    overlay('保存中…','');
    try{profile=await store.save(pending.next);receipt=profile.receipt;pending=null;busy=false;lastError='';after();}
    catch(e){busy=false;lastError=String(e.message||e);phase='pending';overlay('Save pending',lastError+' No next encounter until the saved record is confirmed.',['r7Retry','r7Reload']);}
  }
  async function start(){
    if(labMode)return labReset(labConfig?.stage||1);
    if(busy)return;reset();G.lab=false;G.hero.hp=100;G.hero.hpLag=100;clearInput();
    for(const id of ['ovTitle','ovPause','ovEnd','ovForge','ovChapter','ovFacts'])show(id,false);
    replay=false;lastError='';
    try{store=connect();profile=store.read();receipt=profile?.receipt||null;
      if(!profile){const id=globalThis.crypto?.randomUUID?.();if(!id)throw Error('Secure career identity unavailable. Use the published secure preview.');const n=R7Store.create(id);await persist(n,resume);}
      else resume();
    }catch(e){phase='blocked';G.state='r7-blocked';overlay('Saved career needs attention',String(e.message||e)+' Existing data has not been removed.',['r7Reload']);}
    ui();
  }
  function resume(){
    if(profile.phase==='combat1'||profile.phase==='combat2')enter(profile.frontier);
    else{phase=profile.phase;shot=profile.shot;G.state='r7-story';G.growth.chapterId=profile.frontier===1?'diner':'arcade';showStory();}
  }
  function changePhase(nextPhase,nextShot=0){
    const n=copy(profile);n.revision++;n.phase=nextPhase;n.shot=nextShot;persist(n,resume);
  }
  function showStory(){
    clearInput();G.state='r7-story';
    const legacy=phase==='onboarding';
    if(legacy&&!receipt){phase='blocked';overlay('Receipt unavailable','A confirmed equipment reward is required.',['r7Reload']);return;}
    const node=phase==='n00'?R7_STORY.n00:R7_STORY.n01,index=legacy?3:shot,s=node[index],lesson=phase!=='n00'&&index===3;
    overlay(s.period,s.caption,['r7Next']);$('r7Modal').classList.add('story');$('r7Modal').classList.toggle('lesson',lesson);$('r7Heading').textContent=s.period;
    $('r7Next').textContent='轻点画面继续';$('r7Next').setAttribute('aria-label','轻点画面继续');$('r13Learn').hidden=!lesson;if(lesson)$('r7Diagram').removeAttribute('hidden');
    storyReadyAt=performance.now()+300;$('r7Next').focus();ui();
    const image=$('r7Art'),generation=++imageGeneration,loader=document.createElement('img');
    $('r7Alt').textContent=s.label+' · 插画载入中，可继续';image.alt=s.alt;
    loader.onload=()=>{if(generation!==imageGeneration)return;image.src=s.image;image.hidden=false;$('r7Alt').textContent=phase==='n00'?'原创幻想 · 打斗并非真实生平事件':s.label;const nextImage=node[index+1];if(nextImage){const preload=document.createElement('img');preload.src=nextImage.image;}};
    loader.onerror=()=>{if(generation!==imageGeneration)return;image.hidden=true;$('r7Alt').textContent=s.label+' · 插画暂不可用：'+s.alt+' · 可继续';};
    loader.src=s.image;
  }
  function next(){
    if(busy||portrait||!['n00','n01','onboarding'].includes(phase))return;
    if(replay){if(shot===3){replay=false;phase='combat';closeModal();pause(true);G.state='play';return;}shot++;showStory();return;}
    if(phase==='onboarding'){changePhase('combat2');return;}
    if(shot===3)changePhase(phase==='n00'?'combat1':'combat2');else changePhase(phase,shot+1);
  }
  function cancelStoryGesture(){storyPointer=null;storyPointers.clear();}
  function advanceStory(){if(performance.now()<storyReadyAt||storyPointers.size||busy||portrait||document.hidden)return;next();}
  function storyDown(e){
    e.preventDefault();storyPointers.add(e.pointerId);storyPointer=null;
    if(storyPointers.size!==1||e.isPrimary===false||e.button>0||busy||portrait||performance.now()<storyReadyAt||!['n00','n01','onboarding'].includes(phase))return;
    storyPointer={id:e.pointerId,x:e.clientX,y:e.clientY,generation:imageGeneration};try{$('r7Next').setPointerCapture(e.pointerId);}catch(_){}
  }
  function storyEnd(e){
    const held=storyPointer;storyPointers.delete(e.pointerId);if(held?.id!==e.pointerId)return;storyPointer=null;e.preventDefault();
    if(e.type==='pointerup'&&held.generation===imageGeneration&&Math.hypot(e.clientX-held.x,e.clientY-held.y)<=12)advanceStory();
  }
  function actor(id,role,x,y,hp){const e=JensenCombatEnemies.create(combatConfig.types[role],{id,spawnOrdinal:id,x,y,initialWait:combatConfig.limits.initialWaitBase+id*combatConfig.limits.initialWaitStep},attempt);e.hp=e.maxHp=hp;return e;}
  function enter(n){
    reset();combatConfig=labMode?labConfig:JensenCombatData.defaults(n);level=n;phase='combat';G.state='play';G.wave=n;G.growth.chapterId=n===1?'diner':'arcade';G.hero.hp=G.hero.hpLag=100;G.hero.dead=false;
    G.hero.x=720;G.hero.y=n===1?620:680;G.hero.visual=CharacterRenderer.createVisualState(G.hero);World.collide(G.hero,G.hero.r);G.cam.x=G.hero.x;G.cam.y=G.hero.y;
    attempt++;combatState=JensenCombatActions.create(combatConfig,combatConfig.entry,attempt);reservations.clear();incomingSeen.clear();rootRecords.clear();incoming=[];originalCommits=[];activeRequests=[];activeCarrier=null;networkFX=[];roundRobin=0;clock=0;acc=0;seq=0;hand=0;nextAttack=.3;hintUntil=8;tray=false;action=null;hazards=[];contacts=0;clearInput();
    pickups=n===1?[{x:620,y:610,taken:false,visible:false},{x:840,y:430,taken:false,visible:false}]:[];
    G.enemies=n===1?[actor(1,'troublemaker_customer',620,460,32),actor(2,'troublemaker_customer',850,480,32),actor(3,'troublemaker_customer',600,330,32),actor(4,'troublemaker_boss',820,260,88)]:[actor(1,'champion',720,260,180),actor(2,'gunner',480,370,60),actor(3,'gunner',960,370,60),actor(4,'rusher',600,530,48),actor(5,'rusher',840,500,48)];
    offers=[];allies=n===1?[{id:'ally_coworker',role:'support_only',label:'同事·援手',x:540,y:650,color:'#a04945',until:0,target:0},{id:'ally_foreman',role:'support_only',label:'领班·援手',x:935,y:440,color:'#467b75',until:0,target:1}]:[];
    if(n===1)G.enemies.find(e=>e.role==='troublemaker_boss').entered=false;
    for(const e of G.enemies)World.collide(e,e.r);
    for(const p of pickups){if(!World.walkable(p.x,p.y,18))throw Error('Tray position is not walkable.');}
    for(const id of ['ovTitle','ovPause','ovEnd','ovChapter','ovForge','bossHud'])show(id,false);closeModal();ui();
  }
  function offer(index){
    if(level!==1||offers.includes(index))return;offers.push(index);
    const p=pickups[index],ally=allies[index];p.visible=true;p.disabled=tray;ally.until=clock+2.2;
  }
  function move(o,dx,dy){const n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/6));for(let i=0;i<n;i++){o.x+=dx/n;o.y+=dy/n;for(let pass=0;pass<2;pass++){World.collide(o,o.r);for(const b of [G.hero,...G.enemies]){if(b===o||b.dead||(b!==G.hero&&b.hp<=0)||b.entered===false)continue;const x=o.x-b.x,y=o.y-b.y,d=Math.hypot(x,y),min=o.r+b.r;if(d<min){const nx=d>.001?x/d:1,ny=d>.001?y/d:0;o.x+=nx*(min-d);o.y+=ny*(min-d);}}}World.collide(o,o.r);}}
  function visible(a,b){return World.clearSegment(a.x,a.y,b.x,b.y,2);}
  const kit=(p=current())=>p===profiles.gpu||['gpu_fast','shield_gauntlet_fast','hammer_shield_fast'].includes(p.id)?'gpu':p===profiles.tray||p.id==='tray_sweep'?'tray':'bare';
  function feedback(x,y,damage,hurt,p=null,point=null,crit=false){
    const material=p?(labMode?R7Material(p):kit(p)):null;
    if(G.flashes.length>=12)G.flashes.shift();G.flashes.push({x:point?.x??x,y:(point?.y??y)-handHeight(),age:0,life:material==='bare'?.1:material==='tray'?.16:material==='gpu'?.13:.12,ang:-.7,size:hurt?5:7,crit,kit:material});
    if(G.numbers.length>=16)G.numbers.shift();G.numbers.push({x,y:y-(labMode?78:38),vy:-42,val:damage,kind:hurt?'h':crit?'c':'n',age:0,life:.55});
  }
  function hurt(amount){if(!live())return;G.hero.hp=Math.max(0,G.hero.hp-amount);G.hero.hurtT=.18;feedback(G.hero.x,G.hero.y,amount,true);G.hitStop=Math.max(G.hitStop,2*FIXED);addShake(.18,0,1);if(Sfx.hurt)Sfx.hurt();if(G.hero.hp===0&&!(labMode&&labImmortal))G.hero.dead=true;}
  function hit(e,root,point,rawDamage,source='auto',at=clock,sourcePoint=null){
    const secondary=source==='cuda',seen=secondary?(root.cudaHits||=new Set()):root.hits,cap=secondary?4:root.profile.cap;
    if(e.dead||e.hp<=0||seen.has(e.id)||seen.size>=cap)return null;
    seen.add(e.id);const packet={attempt,rootId:root.id,emissionId:root.id+(secondary?':cuda:':':direct:')+e.ownerId,ownerId:'hero',targetId:e.ownerId,at,source,sourcePoint:sourcePoint||{x:G.hero.x,y:G.hero.y},contactPoint:{...point},baseDamage:rawDamage??root.profile.damage,critMultiplier:secondary?1:root.critMultiplier||1};
    packet.rawDamage=packet.baseDamage*packet.critMultiplier;
    const mitigation=JensenCombatEnemies.defenseMultiplier(e,packet),damage=packet.rawDamage*mitigation,hpBefore=e.hp;e.hp=Math.max(0,e.hp-damage);e.flash=.16;contacts++;G.kills+=e.hp===0?1:0;
    const commit={...packet,eligibleDamage:damage,hpBefore,hpAfter:e.hp,aliveBefore:true,killedByThisHit:e.hp===0,cudaSnapshot:root.cudaSnapshot};if(!secondary)originalCommits.push(commit);
    if(e.hp===0){if(level===1&&e.id===1)offer(0);const dyingRoot=e.attack?.rootId;if(dyingRoot)reservations.delete(dyingRoot);e.state='retiring';e.retire=.5;e.attack=null;}
    e.recoil=1;e.recoilAngle=root.angle;
    if(labMode&&!secondary&&source==='auto'&&!e.config.boss&&!e.controlProtected&&!['tell','active'].includes(e.state)&&e.hp>0){const d=Math.hypot(e.x-G.hero.x,e.y-G.hero.y)||1;const distance=R7Material(root.profile)==='hammer'?10:R7Material(root.profile)==='bare'?3:5;e.kick={x:(e.x-G.hero.x)/d,y:(e.y-G.hero.y)/d,speed:distance/.1,remaining:distance};}

    const detail={rootId:root.id,targetId:e.ownerId,source,at,baseDamage:packet.baseDamage,critMultiplier:packet.critMultiplier,rawDamage:packet.rawDamage,mitigation,mitigatedDamage:damage,hpBefore,hpAfter:e.hp,hpLoss:hpBefore-e.hp};
    if(labMode){damageLog.push(detail);if(damageLog.length>64)damageLog.shift();}
    feedback(e.x,e.y,labMode?detail.hpLoss:damage,false,root.profile,point,packet.critMultiplier>1);
    if(!root.feedback){root.feedback=true;const heavy=labMode&&R7Material(root.profile)==='hammer',critical=packet.critMultiplier>1,kill=e.hp===0;G.hitStop=Math.max(G.hitStop,(labMode?(heavy?4:critical||kill?3:2):2)*FIXED);addShake(labMode?(heavy?.3:.2):.12,Math.cos(root.angle)*(heavy?1.4:.6),Math.sin(root.angle)*(heavy?1.4:.6));if(Sfx.hit)Sfx.hit(critical,kill,e.config.boss,labMode?R7Material(root.profile):undefined);}
    return commit;
  }
  function handPoint(h,a,t){
    const start=a.profile.contactStart??.1,end=a.profile.contactEnd??.18,q=clamp((t-start)/(end-start),0,1),ang=a.angle+(a.side?1:-1)*(.9-1.8*q),reach=a.profile.reach-a.profile.radius;
    return {x:h.x+Math.cos(ang)*reach,y:h.y+Math.sin(ang)*reach};
  }
  function auto(dt,c){
    const h=G.hero,p=current(),active=combatState?JensenCombatActions.inspect(combatState):null;if(active?.active||active?.pending&&clock<active.pending.expires)return;
    const touch=Input.st.mode==='touch';
    const aimed=touch&&directional();
    let attackAngle=null;
    if(aimed&&!action){
      targetId=releaseRequest?.targetId??null;attackAngle=aimGesture?null:releaseRequest?.angle??null;
    }else if(touch&&!action){targetId=null;if(Input.st.atk||c?.attack){const eligible=G.enemies.filter(e=>e.entered&&!e.dead&&e.hp>0&&Math.hypot(e.x-h.x,e.y-h.y)<=p.reach+e.r&&visible(h,e));eligible.sort((a,b)=>Math.hypot(a.x-h.x,a.y-h.y)-Math.hypot(b.x-h.x,b.y-h.y)||a.id-b.id);targetId=eligible[0]?.id??null;}}
    const selected=G.enemies.find(e=>e.id===targetId&&e.entered&&!e.dead&&e.hp>0);
    if(!aimed&&!selected){targetId=null;action=null;return;}
    if(!action&&clock>=nextAttack&&(aimed?attackAngle!==null:selected&&Math.hypot(selected.x-h.x,selected.y-h.y)<=p.reach+selected.r&&visible(h,selected))){
      const angle=aimed?attackAngle:Math.atan2(selected.y-h.y,selected.x-h.x);
      if(aimed){releaseRequest=null;JensenLab.notice('普攻已释放',false);}
      action={id:attempt+':hero:auto:'+(++seq),age:0,side:hand++%2,angle,directionLocked:aimed,critMultiplier:critical(),profile:labMode?copy(p):p,hits:new Set(),cudaSnapshot:{damage:p.damage,...copy(combatConfig.cuda)}};action.expires=clock+p.cycle+.25;rootRecords.set(action.id,action);nextAttack=clock+p.cycle;
    }
    const a=action;if(!a)return;
    const old=a.age,start=a.profile.contactStart??.1,end=a.profile.contactEnd??.18;a.age+=dt;
    if(!a.directionLocked&&old<start&&a.age>=start){const e=G.enemies.find(e=>e.id===targetId&&e.hp>0);if(e)a.angle=Math.atan2(e.y-h.y,e.x-h.x);}
    if(labMode&&!a.sounded&&a.age>=start){a.sounded=true;Sfx.swing(R7Material(a.profile));}
    if(dt>0&&a.age>=start&&old<end){
      // Hand, both bodies and packet time use the same clipped contact subwindow.
      const fromAge=Math.max(start,old),toAge=Math.min(end,a.age),q0=(fromAge-old)/dt,q1=(toAge-old)/dt;
      const bodyAt=(e,q)=>({x:lerp(e.oldX,e.x,q),y:lerp(e.oldY,e.y,q)}),heroFrom=bodyAt(h,q0),heroTo=bodyAt(h,q1),from=handPoint(heroFrom,a,fromAge),to=handPoint(heroTo,a,toAge),fromAt=frameStart+fromAge-old,toAt=frameStart+toAge-old;
      const candidates=G.enemies.filter(e=>e.entered&&e.hp>0&&!e.dead&&visible(h,e)&&World.clearSegment(from.x,from.y,to.x,to.y,a.profile.radius)&&World.clearSegment(heroTo.x,heroTo.y,to.x,to.y,a.profile.radius)).map(e=>{const first=bodyAt(e,q0),last=bodyAt(e,q1);return {e,t:segmentCircleT(from.x-first.x,from.y-first.y,to.x-last.x,to.y-last.y,0,0,e.r+a.profile.radius)};}).filter(x=>x.t!==Infinity).sort((a,b)=>a.t-b.t||Math.hypot(a.e.x-to.x,a.e.y-to.y)-Math.hypot(b.e.x-to.x,b.e.y-to.y)||a.e.id-b.e.id);
      if(labMode){swingTrails.push({from,to,age:0,life:R7Material(a.profile)==='hammer'?.16:.1,material:R7Material(a.profile)});if(swingTrails.length>18)swingTrails.shift();}
      for(const {e,t} of candidates)hit(e,a,{x:lerp(from.x,to.x,t),y:lerp(from.y,to.y,t)},undefined,'auto',lerp(fromAt,toAt,t),{x:lerp(heroFrom.x,heroTo.x,t),y:lerp(heroFrom.y,heroTo.y,t)});
    }
    if(a.age>=a.profile.cycle)action=null;
  }
  function hostFrame(c,from=frameStart,to=clock,pose=null){
    const h=G.hero,p=pose||{x:h.oldX??h.x,y:h.oldY??h.y,face:h.bodyAng};
    const active=combatState?JensenCombatActions.inspect(combatState).active:null,skill=pose?.skill||active;
    const hasShield=combatConfig.entry.equipment.right==='wafer_shield';
    return {attempt,time:to,hero:{x:h.x,y:h.y,oldX:h.oldX??h.x,oldY:h.oldY??h.y,r:h.r,face:h.bodyAng,aim:h.aim},movement:{x:c.mx||0,y:c.my||0},autoRestart:nextAttack,shieldPresented:hasShield&&active?.slot!==2,config:combatConfig,owners:G.enemies.filter(e=>e.entered).map(e=>({ownerId:e.ownerId,x:e.x,y:e.y,hp:e.hp,dead:e.dead})),visible,
      defenseAt(at){const q=to>from?clamp((at-from)/(to-from),0,1):1,atSkill=[p.accepted,active,p.skill].find(a=>a&&at>=a.start&&at<a.end),aim=atSkill?.angle??action?.angle??(directional()?lastAim:null)??(Math.hypot(c.mx||0,c.my||0)>0?Math.atan2(c.my,c.mx):h.aim),endFace=p.face+angDiff(p.face,aim)*Math.min(1,(p.dt??to-from)*16),face=atSkill?.slot===1?atSkill.angle:p.face+angDiff(p.face,endFace)*q;return {x:lerp(p.x,h.x,q),y:lerp(p.y,h.y,q),face,shieldPresented:hasShield&&atSkill?.slot!==2};}};
  }
  function capsuleTime(a,b,u,v,r){
    if(segDist(a.x,a.y,u.x,u.y,v.x,v.y).d<=r)return 0;
    let t=Math.min(segmentCircleT(a.x,a.y,b.x,b.y,u.x,u.y,r),segmentCircleT(a.x,a.y,b.x,b.y,v.x,v.y,r));
    const sx=v.x-u.x,sy=v.y-u.y,len=Math.hypot(sx,sy);if(len>0){const nx=-sy/len,ny=sx/len,d0=(a.x-u.x)*nx+(a.y-u.y)*ny,dv=(b.x-a.x)*nx+(b.y-a.y)*ny;
      if(dv)for(const side of [-r,r]){const q=(side-d0)/dv;if(q<0||q>1)continue;const x=lerp(a.x,b.x,q),y=lerp(a.y,b.y,q),along=((x-u.x)*sx+(y-u.y)*sy)/(len*len);if(along>=0&&along<=1)t=Math.min(t,q);}}
    return t;
  }
  function sweepHero(shape,packet,from,to){
    const h=G.hero,heroAt=at=>{const q=to>from?clamp((at-from)/(to-from),0,1):1;return {x:lerp(h.oldX??h.x,h.x,q),y:lerp(h.oldY??h.y,h.y,q)};},a=heroAt(shape.atFrom),b=heroAt(shape.atTo);let q=Infinity;
    if(shape.kind==='segment')q=segmentCircleT(shape.from.x-a.x,shape.from.y-a.y,shape.to.x-b.x,shape.to.y-b.y,0,0,shape.r+h.r);
    else if(shape.kind==='capsule')q=capsuleTime(a,b,shape.from,shape.to,shape.r+h.r);
    else if(shape.kind==='circle')q=segmentCircleT(a.x,a.y,b.x,b.y,shape.x,shape.y,shape.r+h.r);
    else if(shape.kind==='arc'){
      const inside=p=>{const d=Math.hypot(p.x-shape.x,p.y-shape.y),angle=Math.atan2(p.y-shape.y,p.x-shape.x);return d<=shape.radius+h.r&&Math.abs(angDiff(shape.angle,angle))<=shape.halfAngle+Math.asin(Math.min(1,h.r/Math.max(h.r,d)));};
      if(inside(a))q=0;else for(let i=1;i<=16;i++){const p={x:lerp(a.x,b.x,i/16),y:lerp(a.y,b.y,i/16)};if(inside(p)){let lo=(i-1)/16,hi=i/16;for(let n=0;n<16;n++){const mid=(lo+hi)/2;if(inside({x:lerp(a.x,b.x,mid),y:lerp(a.y,b.y,mid)}))hi=mid;else lo=mid;}q=hi;break;}}
    }
    if(q===Infinity)return {hit:false};let at=lerp(shape.atFrom,shape.atTo,q);
    const flight=hazards.find(hazard=>hazard.emissionId===packet.emissionId);
    // Constant-speed bullets use one flight clock so an exact endpoint cannot precede expiry by one ULP.
    if(flight?.kind==='bullet'&&Number.isFinite(flight.expiresAt)&&flight.v>0){const x=lerp(shape.from.x,shape.to.x,q),y=lerp(shape.from.y,shape.to.y,q);at=flight.expiresAt+(Math.hypot(x-flight.sourcePoint.x,y-flight.sourcePoint.y)/flight.v-flight.duration);}
    const point=heroAt(at);
    if(packet.attempt!==attempt||Number.isFinite(packet.expiresAt)&&at>=packet.expiresAt)return {hit:false};
    const identity=packet.emissionId;if(!incomingSeen.has(identity)){incomingSeen.add(identity);incoming.push({...packet,source:'enemy',targetId:'hero',at,contactPoint:point,rawDamage:packet.damage,eligibleDamage:packet.damage});}
    return {hit:true,at,contactPoint:point};
  }
  function enemyContext(from,to){return {attempt,from,to,clock:to,enemyWait:combatConfig.limits.enemyWait,hero:G.hero,visible,walkable:(x,y,r)=>World.walkable(x,y,r),clearSegment:(a,b,r)=>World.clearSegment(a.x,a.y,b.x,b.y,r),move:(e,dx,dy)=>{const oldX=e.x,oldY=e.y;move(e,dx,dy);return {oldX,oldY,x:e.x,y:e.y};},
    sweepHero:(shape,packet)=>sweepHero(shape,packet,from,to),reserve(rootId,cost){
      if(reservations.has(rootId))return false;const limits=combatConfig.limits,total={tells:0,hazards:0,heat:0};for(const value of reservations.values())for(const key of Object.keys(total))total[key]+=value[key];
      const ownerId=rootId.slice(0,rootId.lastIndexOf(':action:')),owner=G.enemies.find(e=>e.ownerId===ownerId),ownMax=owner?.config.pattern_params.max_own_patches;
      if(cost.heat&&Number.isFinite(ownMax)){const live=hazards.filter(h=>h.kind==='heat'&&h.ownerId===ownerId).length,held=[...reservations.entries()].filter(([id])=>id.startsWith(ownerId+':action:')).reduce((n,[,v])=>n+v.heat,0);if(live+held+cost.heat>ownMax)return false;}
      if(total.tells+cost.tells>limits.tells||hazards.length+total.hazards+cost.hazards>limits.hazards||hazards.filter(h=>h.kind==='heat').length+total.heat+cost.heat>limits.heat)return false;
      reservations.set(rootId,{...cost});return true;
    },releaseReservation:rootId=>reservations.delete(rootId),emit(hazard){const reserved=reservations.get(hazard.rootId);if(hazard.attempt!==attempt||!reserved||reserved.hazards<1||hazard.kind==='heat'&&reserved.heat<1)throw Error('Unreserved enemy emission');reserved.hazards--;if(hazard.kind==='heat')reserved.heat--;hazards.push(hazard);}};}
  function requestActive(slot){if(!live()||!combatState)return;const c=controls(FIXED);activeRequests.push({slot,at:clock,direction:directional()?{x:Math.cos(lastAim??G.hero.aim),y:Math.sin(lastAim??G.hero.aim)}:Math.hypot(c.mx,c.my)>0?{x:c.mx,y:c.my}:null});}
  function activeContacts(carrier,from,to){
    if(!carrier)return;const h=G.hero,root=rootRecords.get(carrier.rootId);if(!root)return;if(labMode&&!root.sounded){root.sounded=true;Sfx.swing(R7Material(root.profile));}
    const span=Math.abs(carrier.endAngle-carrier.startAngle),steps=Math.max(1,Math.ceil(span/.12)),hits=[];
    for(let i=0;i<steps;i++){const q0=i/steps,q1=(i+1)/steps,t0=lerp(carrier.fromAt,carrier.toAt,q0),t1=lerp(carrier.fromAt,carrier.toAt,q1),f0=clamp((t0-from)/(to-from),0,1),f1=clamp((t1-from)/(to-from),0,1),a0=lerp(carrier.startAngle,carrier.endAngle,q0),a1=lerp(carrier.startAngle,carrier.endAngle,q1),p0={x:lerp(h.oldX,h.x,f0)+Math.cos(a0)*carrier.reach,y:lerp(h.oldY,h.y,f0)+Math.sin(a0)*carrier.reach},p1={x:lerp(h.oldX,h.x,f1)+Math.cos(a1)*carrier.reach,y:lerp(h.oldY,h.y,f1)+Math.sin(a1)*carrier.reach};
      for(const e of G.enemies){if(!e.entered||e.dead||e.hp<=0||root.hits.has(e.id))continue;const ex0=lerp(e.oldX??e.x,e.x,f0),ey0=lerp(e.oldY??e.y,e.y,f0),ex1=lerp(e.oldX??e.x,e.x,f1),ey1=lerp(e.oldY??e.y,e.y,f1),q=segmentCircleT(p0.x-ex0,p0.y-ey0,p1.x-ex1,p1.y-ey1,0,0,e.r+carrier.radius);if(q===Infinity)continue;const point={x:lerp(p0.x,p1.x,q),y:lerp(p0.y,p1.y,q)},at=lerp(t0,t1,q),hero={x:lerp(h.oldX,h.x,clamp((at-from)/(to-from),0,1)),y:lerp(h.oldY,h.y,clamp((at-from)/(to-from),0,1))};if(World.clearSegment(hero.x,hero.y,point.x,point.y,carrier.radius)&&visible(hero,e))hits.push({e,point,at,origin:hero,distance:Math.hypot(e.x-hero.x,e.y-hero.y)});}
    }
    hits.sort((a,b)=>a.at-b.at||a.distance-b.distance||a.e.ownerId.localeCompare(b.e.ownerId));for(const candidate of hits){const result=hit(candidate.e,root,candidate.point,carrier.rawDamage,carrier.source,candidate.at,candidate.origin);if(!result)continue;const e=candidate.e;
      if(!e.controlProtected){if(!e.config.boss&&e.config.ownerKind!=='independent_seat'){const d=Math.hypot(e.x-h.x,e.y-h.y)||1;move(e,(e.x-h.x)/d*carrier.pushDistance,(e.y-h.y)/d*carrier.pushDistance);e.staggerUntil=Math.max(e.staggerUntil||0,clock+carrier.stagger);JensenCombatEnemies.interrupt(e,candidate.at,enemyContext(from,to));}
        else if(carrier.source==='clear_space'&&!root.interrupted&&(e.config.ownerKind!=='independent_seat'||e.config.clear_space_interrupt_eligible)){if(JensenCombatEnemies.interrupt(e,candidate.at,enemyContext(from,to)))root.interrupted=true;}}
    }
  }
  function enemyStep(e,dt){
    const before=e.state;if(clock<e.staggerUntil&&e.hp>0){e.flash=Math.max(0,e.flash-dt);e.recoil=Math.max(0,(e.recoil||0)-dt/.18);return;}
    JensenCombatEnemies.step(e,dt,enemyContext(frameStart,clock));
    if(level===1&&e.id===1&&before==='recover'&&e.state==='chase')offer(0);
  }
  function pathTo(goal){
    const h=G.hero,r=h.r+2,blockers=G.enemies.filter(e=>e.entered&&!e.dead&&e.hp>0&&e.id!==targetId);
    const clear=(a,b)=>World.clearSegment(a.x,a.y,b.x,b.y,r)&&blockers.every(e=>{const radius=h.r+e.r+1,d=Math.hypot(a.x-e.x,a.y-e.y);return d<radius&&Math.hypot(b.x-e.x,b.y-e.y)>d||segmentCircleT(a.x,a.y,b.x,b.y,e.x,e.y,radius)===Infinity;});
    if(clear(h,goal))return [goal];
    const cell=32,cols=Math.ceil(World.W/cell),rows=Math.ceil(World.H/cell),point=i=>({x:(i%cols+.5)*cell,y:(Math.floor(i/cols)+.5)*cell});
    const valid=i=>i>=0&&i<cols*rows&&World.walkable(point(i).x,point(i).y,r)&&blockers.every(e=>Math.hypot(point(i).x-e.x,point(i).y-e.y)>=h.r+e.r+1);
    function nearest(p){let best=-1,dist=Infinity;const cx=Math.floor(p.x/cell),cy=Math.floor(p.y/cell);for(let y=cy-2;y<=cy+2;y++)for(let x=cx-2;x<=cx+2;x++){if(x<0||y<0||x>=cols||y>=rows)continue;const i=y*cols+x,q=point(i),d=Math.hypot(p.x-q.x,p.y-q.y);if(d<dist&&valid(i)&&clear(p,q)){best=i;dist=d;}}return best;}
    const start=nearest(h),end=nearest(goal);if(start<0||end<0)return [];
    const open=[start],cost=new Map([[start,0]]),from=new Map(),closed=new Set();
    while(open.length){open.sort((a,b)=>cost.get(a)+Math.hypot(point(a).x-goal.x,point(a).y-goal.y)-cost.get(b)-Math.hypot(point(b).x-goal.x,point(b).y-goal.y));const i=open.shift();if(i===end){const path=[goal];let k=i;while(k!==start){path.unshift(point(k));k=from.get(k);}path.unshift(point(start));return path;}closed.add(i);const q=point(i),x=i%cols,y=Math.floor(i/cols);
      for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const xx=x+dx,yy=y+dy,j=yy*cols+xx;if(xx<0||yy<0||xx>=cols||yy>=rows||closed.has(j)||!valid(j)||!clear(q,point(j)))continue;const n=cost.get(i)+Math.hypot(dx,dy)*cell;if(n<(cost.get(j)??Infinity)){cost.set(j,n);from.set(j,i);if(!open.includes(j))open.push(j);}}
    }return [];
  }
  function command(event){
    if(event.pointerType==='touch'){mode('touch');return;}
    if(event.pointerType==='mouse'&&!event.sourceCapabilities?.firesTouchEvents)mode('kb');
    if(Input.st.mode==='touch')return;
    if(!live()||event.button>0||event.isPrimary===false)return;
    const rect=$('game').getBoundingClientRect(),[x,y]=s2w((event.clientX-rect.left)*View.cw/rect.width,(event.clientY-rect.top)*View.ch/rect.height);
    if(!Number.isFinite(x)||!Number.isFinite(y))return;
    const enemy=G.enemies.filter(e=>e.entered&&!e.dead&&e.hp>0&&Math.hypot(x-e.x,y-(e.y-16))<=e.r+14).sort((a,b)=>Math.hypot(x-a.x,y-a.y+16)-Math.hypot(x-b.x,y-b.y+16))[0];
    if(!enemy&&!World.walkable(x,y,G.hero.r+2))return;
    if(enemy&&enemy.id===targetId){event.preventDefault();hintUntil=0;$('game').focus();return;}
    event.preventDefault();clearInput(false);targetId=enemy?.id??null;destination=enemy?null:{x,y};routeUntil=0;hintUntil=0;$('game').focus();
  }
  function controls(dt){
    if(Input.st.mode==='touch')return Input.movement();
    const keys=Input.keys,h=G.hero,c={mx:(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),my:(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0)};
    const manual=Math.hypot(c.mx,c.my);if(manual){targetId=null;destination=null;route=[];action=null;c.mx/=manual;c.my/=manual;return c;}
    const e=G.enemies.find(e=>e.id===targetId&&e.entered&&!e.dead&&e.hp>0);if(targetId!==null&&!e){targetId=null;route=[];action=null;}
    const goal=e?{x:e.x,y:e.y}:destination;if(!goal)return c;
    const distance=Math.hypot(goal.x-h.x,goal.y-h.y),stop=e?current().reach+e.r-8:2;
    if(distance<=stop&&(!e||visible(h,e))){if(!e){h.vx=h.vy=0;destination=null;route=[];}return c;}
    if(!route.length||!routeGoal||Math.hypot(goal.x-routeGoal.x,goal.y-routeGoal.y)>24||clock>=routeUntil){route=pathTo(goal);routeGoal=goal;routeUntil=clock+.5;}
    while(route.length>1&&World.clearSegment(h.x,h.y,route[1].x,route[1].y,h.r+2)&&G.enemies.every(e=>e.id===targetId||!e.entered||e.dead||e.hp<=0||segmentCircleT(h.x,h.y,route[1].x,route[1].y,e.x,e.y,h.r+e.r+1)===Infinity))route.shift();
    while(route.length>1&&Math.hypot(route[0].x-h.x,route[0].y-h.y)<3)route.shift();
    if(route.length){const q=route[0],dx=q.x-h.x,dy=q.y-h.y,d=Math.hypot(dx,dy),speed=Math.min(1,d/(CFG.hero.speed*dt));c.mx=dx/d*speed;c.my=dy/d*speed;}return c;
  }
  function touchControls(){const active=Input.st.mode==='touch'&&live();$('touchUI').hidden=!active;$('touchUI').inert=!active;document.body.classList.toggle('touchCombat',active);if(labMode&&labMounted)JensenLab.sync();}
  function mode(value){
    if(!['kb','touch'].includes(value)||Input.st.mode===value)return;
    clearInput();Input.st.mode=value;document.body.classList.toggle('touch',value==='touch');hintUntil=clock+8;viewport();ui();
  }
  function touchPointer(event){if(event.pointerType==='touch')mode('touch');return Input.st.mode==='touch'&&live()&&!(event.button>0);}
  function touchReset(){if(labMode){if(releaseRequest)JensenLab.notice('待发普攻已取消',false);aimGesture=null;releaseRequest=null;action=null;targetId=null;$('btnAtk').classList.remove('aiming');}}
  function touchAttack(event){
    if(!live()||Input.st.mode!=='touch')return;
    if(!directional()){auto(0,{attack:true});return;}
    if(releaseRequest)JensenLab.notice('重新瞄准 · 替换等待中的普攻',false);releaseRequest=null;
    $('btnAtk').classList.add('aiming');$('btnAtk').style.setProperty('--aim-angle',(lastAim??G.hero.aim)+'rad');
    aimGesture={id:event.pointerId,x:event.clientX,y:event.clientY,start:performance.now(),explicit:false};
  }
  function touchAim(event){
    if(!directional()||aimGesture?.id!==event.pointerId||!live())return;
    const dx=event.clientX-aimGesture.x,dy=event.clientY-aimGesture.y;
    if(Math.hypot(dx,dy)>=10){aimGesture.explicit=true;lastAim=Math.atan2(dy,dx);$('btnAtk').style.setProperty('--aim-angle',lastAim+'rad');}
  }
  function touchEnd(event,which){
    if(which==='attack'&&directional()){
      if(aimGesture?.id!==event.pointerId)return;
      const gesture=aimGesture;aimGesture=null;$('btnAtk').classList.remove('aiming');
      if(event.type==='pointerup'&&live()){
        const h=G.hero,targets=G.enemies.filter(e=>e.entered&&!e.dead&&e.hp>0&&visible(h,e)).sort((a,b)=>Math.hypot(a.x-h.x,a.y-h.y)-Math.hypot(b.x-h.x,b.y-h.y)||a.id-b.id),target=gesture.explicit?null:targets[0];
        const angle=gesture.explicit?lastAim:target?Math.atan2(target.y-h.y,target.x-h.x):h.aim;
        lastAim=angle;releaseRequest={angle,targetId:target?.id??null,at:clock,expires:clock+.75};
        if(action||clock<nextAttack||JensenCombatActions.inspect(combatState).active)JensenLab.notice('普攻已排队 · 就绪后释放一次',false);
        if(!action)auto(0,{});
      }else{releaseRequest=null;action=null;targetId=null;}
      return;
    }
    if(event.type==='pointerup')return;if(which==='joy'){G.hero.vx=G.hero.vy=0;}else{action=null;targetId=null;}
  }
  function viewport(){
    const next=(Input.st.mode==='touch'||matchMedia('(pointer:coarse)').matches&&!matchMedia('(hover:hover)').matches)&&innerHeight>innerWidth;
    if(next!==portrait){portrait=next;clearInput();cancelStoryGesture();}
    const recovery=['saving','blocked','pending','dead','end'].includes(phase),rotate=portrait&&!recovery,wasVisible=!$('r9Rotate').hidden;
    $('r9Rotate').hidden=!rotate;$('r7Modal').inert=rotate;$('r9Controls').inert=rotate;
    $('ovPause').inert=rotate||!$('r7Modal').classList.contains('hidden');$('game').inert=portrait||G.paused||phase!=='combat';
    if(rotate!==wasVisible){if(rotate)$('r9RotateFullscreen').focus();else if(recovery||['n00','n01','onboarding'].includes(phase))$('r7Heading').focus();else $(G.paused?'btnResume':'game').focus();}touchControls();
  }
  async function fullscreen(){
    try{if(!document.fullscreenElement&&document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();if(document.fullscreenElement&&globalThis.screen?.orientation?.lock)await screen.orientation.lock('landscape');$('r9RotateStatus').textContent='请将设备横放';}
    catch(_){$('r9RotateStatus').textContent='可直接横放设备继续，无需全屏';}
    viewport();
  }
  function beamEnd(p){if(p.end)return {...p.end};const dx=Math.cos(p.angle),dy=Math.sin(p.angle);let len=p.length??650;for(const [v,d,max] of [[p.x,dx,World.W-World.WALL],[p.y,dy,World.H-World.WALL]])if(Math.abs(d)>.0001)len=Math.min(len,((d>0?max:World.WALL)-v)/d);const ex=p.x+dx*len,ey=p.y+dy*len;for(const o of World.props){const t=segmentCircleT(p.x,p.y,ex,ey,o.x,o.y,o.r+p.r);if(t!==Infinity)len=Math.min(len,Math.hypot(ex-p.x,ey-p.y)*t);}return {x:p.x+dx*len,y:p.y+dy*len};}
  function locomotion(h,c,dt,translate=true,maxMultiplier=1){
    const speed=labMode?labConfig.hero.speed:CFG.hero.speed,k=1-Math.exp(-dt*14),moving=Math.hypot(c.mx,c.my)>0;
    let vx=c.mx*speed,vy=c.my*speed;
    const point=route[0]||destination;
    if(point&&moving){const dx=point.x-h.x,dy=point.y-h.y,d=Math.hypot(dx,dy);const approach=Math.min(speed,d*14);vx=dx/d*approach;vy=dy/d*approach;
      // Remove lateral drift at the final approach so a click cannot become an orbit.
      if(d<24){const along=Math.max(0,(h.vx*dx+h.vy*dy)/d);h.vx=dx/d*along;h.vy=dy/d*along;}}
    h.vx+=(vx-h.vx)*k;h.vy+=(vy-h.vy)*k;
    if(!moving&&Math.hypot(h.vx,h.vy)<1)h.vx=h.vy=0;
    const velocity=Math.hypot(h.vx,h.vy),limit=speed*maxMultiplier;if(velocity>limit&&velocity>0){h.vx*=limit/velocity;h.vy*=limit/velocity;}
    let dx=translate?h.vx*dt:0,dy=translate?h.vy*dt:0;
    if(point&&moving){const distance=Math.hypot(point.x-h.x,point.y-h.y),travel=Math.hypot(dx,dy);if(travel>distance){dx*=distance/travel;dy*=distance/travel;}}
    move(h,dx,dy);
    if(destination&&Math.hypot(h.x-destination.x,h.y-destination.y)<=2&&World.clearSegment(h.x,h.y,destination.x,destination.y,h.r+2)){
      // A ground click can sit inside an actor's collider; keep the legal arrived position.
      if(G.enemies.every(e=>!e.entered||e.dead||e.hp<=0||Math.hypot(destination.x-e.x,destination.y-e.y)>=h.r+e.r)){h.x=destination.x;h.y=destination.y;}
      destination=null;route=[];h.vx=h.vy=0;
    }
  }
  function gait(h,dt){
    const speed=labMode?labConfig.hero.speed:CFG.hero.speed;
    // Actual displacement drives feet, including collision-limited active advances.
    const actual=Math.hypot(h.x-h.oldX,h.y-h.oldY)/dt;
    h.moveAmt+=(clamp(speed>0?actual/speed:0,0,1)-h.moveAmt)*Math.min(1,dt*10);h.walk+=actual*dt*.06;if(labMode&&Math.floor(h.walk/Math.PI)!==h.stepIdx){h.stepIdx=Math.floor(h.walk/Math.PI);if(actual>60)Sfx.step();}
  }
  function motion(h,c,dt){
    const skill=combatState?JensenCombatActions.inspect(combatState).active:null;
    const a=action,side=a?(a.side?1:-1):(hand%2?1:-1),moving=Math.hypot(c.mx,c.my)>.001;
    const aim=skill?skill.angle:a?a.angle:directional()&&lastAim!==null?lastAim:moving?Math.atan2(c.my,c.mx):h.aim;
    h.aim=aim;const turn=labMode&&a?(a.age<(a.profile.contactStart??.1)?14:a.age<(a.profile.contactEnd??.18)?3:10):16;h.bodyAng+=angDiff(h.bodyAng,aim)*Math.min(1,dt*turn);h.headAng+=angDiff(h.headAng,aim)*Math.min(1,dt*20);
    let target;
    if(skill){h.phase=clock<skill.contactStart?'windup':clock<skill.contactEnd?'swing':'recover';const from=h.phase==='windup'?skill.start:h.phase==='swing'?skill.contactStart:skill.contactEnd,to=h.phase==='windup'?skill.contactStart:h.phase==='swing'?skill.contactEnd:skill.end;target=CharacterRenderer.samplePose(h.phase,clamp((clock-from)/Math.max(FIXED,to-from),0,1),1);if(skill.slot===2&&activeCarrier){h.bodyAng=activeCarrier.endAngle;h.headAng=h.bodyAng;}}
    else if(a){const t=a.age,start=a.profile.contactStart??.1,end=a.profile.contactEnd??.18;h.phase=t<start?'windup':t<end?'swing':'recover';target=CharacterRenderer.samplePose(h.phase,t<start?t/start:t<end?(t-start)/(end-start):(t-end)/Math.max(FIXED,a.profile.cycle-end),side);}
    else{h.phase='idle';target=CharacterRenderer.pose('idle',side);const bob=Math.sin(h.walk)*h.moveAmt;target.tw+=bob*.1;target.hip-=bob*.12;target.sa+=bob*.06;}
    // Tool weight changes the body accent; contact hands retain the same physical sweep.
    const material=kit(a?.profile),tw=material==='bare'?.4:material==='tray'?.8:.58,hip=material==='bare'?.5:material==='tray'?.8:.65,lean=material==='bare'?.4:material==='tray'?.85:.6;
    const strength=labMode?(R7Material(a?.profile)==='hammer'?1.2:R7Material(a?.profile)==='bare'?.85:.75):null;target.tw*=strength??tw;target.hip*=strength??hip;target.ld*=strength??lean;target.cr+=h.hurtT>0?.06:0;
    for(const key of PK)h.pose[key]+= (target[key]-h.pose[key])*(a?1:Math.min(1,dt*18));
    h.visual ||= CharacterRenderer.createVisualState(h);CharacterRenderer.updateVisual(h.visual,dt,h);h.cloakAng=h.visual.cloakAng;
  }
  function enemyMotion(e,dt,amt){
    if(labMode&&labStatic){e.flash=Math.max(0,e.flash-dt);e.recoil=Math.max(0,(e.recoil||0)-dt/.18);if(e.hp<=0&&!e.dead){e.retire-=dt;if(e.retire<=0)e.dead=true;}}
    // Accepted tells keep their world origin; basic recoil never moves a committed warning.
    if(['tell','active'].includes(e.state)&&e.kick)e.kick.remaining=0;
    if(labMode&&e.kick?.remaining>0){const distance=Math.min(e.kick.remaining,e.kick.speed*dt);move(e,e.kick.x*distance,e.kick.y*distance);e.kick.remaining-=distance;}

    const vx=(e.x-e.oldX)/dt,vy=(e.y-e.oldY)/dt,sp=Math.hypot(vx,vy);
    e.moveAmt=amt+(clamp(sp/70,0,1)-amt)*Math.min(1,dt*10);e.walk+=sp*.06*dt;
    e.bodyAng=(e.bodyAng??e.face)+angDiff(e.bodyAng??e.face,e.face)*Math.min(1,dt*16);
    e.headAng=(e.headAng??e.face)+angDiff(e.headAng??e.face,e.face)*Math.min(1,dt*20);
    e.visual ||= CharacterRenderer.createVisualState({bodyAng:e.bodyAng});CharacterRenderer.updateVisual(e.visual,dt,{bodyAng:e.bodyAng,vx,vy});
  }
  function ageFeedback(dt){
    for(const trail of swingTrails)trail.age+=dt;swingTrails=swingTrails.filter(trail=>trail.age<trail.life);
    for(const f of G.flashes)f.age+=dt;G.flashes=G.flashes.filter(f=>f.age<f.life);
    for(const n of G.numbers){n.age+=dt;n.y+=n.vy*dt;n.vy*=Math.exp(-dt*3);}G.numbers=G.numbers.filter(n=>n.age<n.life);
  }
  function fixed(dt){
    const end=clock+dt;for(let parts=0;clock<end&&live();parts++){
      if(parts>=16)throw Error('Combat boundary partition exceeded');const next=JensenCombatActions.nextBoundary(combatState,clock,end);fixedSlice(parts===0&&next===end?dt:next-clock,next);
    }
  }
  function fixedSlice(dt,end){
    if(!live())return;if(releaseRequest&&clock>=releaseRequest.expires){releaseRequest=null;JensenLab.notice('普攻等待已过期 · 请再次轻点',false);}frameStart=clock;incoming=[];originalCommits=[];
    const h=G.hero,c=controls(dt),pose={x:h.x,y:h.y,face:h.bodyAng,dt,skill:JensenCombatActions.inspect(combatState).active};
    const requested=JensenCombatActions.request(combatState,activeRequests.filter(r=>r.at===frameStart),frameStart,hostFrame(c,frameStart,end,pose));activeRequests=[];
    if(requested.started){action=null;nextAttack=Math.max(nextAttack,requested.autoNotBefore);pose.accepted=requested.started;if(pose.skill)pose.skill.end=frameStart;const a=requested.started,values=a.slot===1?combatConfig.breakthrough:combatConfig.clear_space;rootRecords.set(a.rootId,{id:a.rootId,angle:a.angle,critMultiplier:critical(),hits:new Set(),profile:{...copy(current()),cap:values.cap},cudaSnapshot:{damage:current().damage,...copy(combatConfig.cuda)},expires:a.end+.25});}
    const acceptedBoundary=JensenCombatActions.nextBoundary(combatState,frameStart,end);if(acceptedBoundary<end){end=acceptedBoundary;dt=end-frameStart;pose.dt=dt;}
    const advance=JensenCombatActions.advance(combatState,frameStart,end,hostFrame(c,frameStart,end,pose));activeCarrier=advance.carrier;clock=end;G.t+=dt;G.time+=dt;
    const weight=labMode&&action?(action.age<(action.profile.contactStart??.1)?(R7Material(action.profile)==='hammer'?.6:.86):action.age<(action.profile.contactEnd??.18)?(R7Material(action.profile)==='hammer'?.55:.9):.95):1,multiplier=advance.motion.multiplier*weight;
    h.oldX=h.x;h.oldY=h.y;locomotion(h,{mx:c.mx*multiplier,my:c.my*multiplier},dt,!advance.motion.replace,multiplier);if(advance.motion.replace)move(h,advance.motion.dx,advance.motion.dy);gait(h,dt);h.hurtT=Math.max(0,h.hurtT-dt);
    for(const p of pickups){
      if(!p.visible||p.taken||tray||Math.hypot(h.x-p.x,h.y-p.y)>=h.r+16){pickupRejected.delete(p);continue;}
      if(pickupRejected.get(p)===labConfig)continue;
      const result=setTray(true);if(!result.ok){pickupRejected.set(p,labConfig);JensenLab.notice(result.error);continue;}
      p.taken=true;for(const other of pickups)if(!other.taken)other.disabled=true;action=null;nextAttack=Math.max(nextAttack,clock+.1);
    }
    const actors=[...G.enemies];if(level>=3&&actors.length){const offset=roundRobin++%actors.length;actors.push(...actors.splice(0,offset));}
    for(const e of actors){e.oldX=e.x;e.oldY=e.y;const amt=e.moveAmt;if(!labMode||!labStatic)enemyStep(e,dt);enemyMotion(e,dt,amt);}
    if(level===1&&G.enemies.slice(0,3).every(e=>e.dead)){const boss=G.enemies[3];if(boss&&!boss.entered){boss.entered=true;offer(1);}}
    if(!pose.skill&&!requested.started)auto(dt,c);activeContacts(activeCarrier,frameStart,clock);
    const batches=new Map();for(const commit of originalCommits){const at=commit.at;if(!batches.has(at))batches.set(at,[]);batches.get(at).push(commit);}
    for(const commits of [...batches.entries()].sort((a,b)=>a[0]-b[0]).map(x=>x[1]))for(const rootId of [...new Set(commits.map(c=>c.rootId))].sort()){const net=JensenCombatActions.cuda(combatState,commits.filter(c=>c.rootId===rootId),hostFrame(c,frameStart,clock,pose));if(!net)continue;networkFX.push({...net,at:clock});for(const packet of net.packets){const e=G.enemies.find(e=>e.ownerId===packet.targetId),root=rootRecords.get(packet.rootId);if(e&&root)hit(e,root,packet.contactPoint,packet.rawDamage,'cuda',packet.at,packet.sourcePoint);}}
    hazards=hazards.filter(hazard=>JensenCombatEnemies.stepHazard(hazard,dt,enemyContext(frameStart,clock)));
    const defended=JensenCombatActions.defend(combatState,incoming,hostFrame(c,frameStart,clock,pose));for(const result of defended){if(result.endProjectile)hazards=hazards.filter(p=>p.emissionId!==result.packet.emissionId);if(result.damage>0)hurt(result.damage);}
    motion(h,c,dt);ageFeedback(dt);networkFX=networkFX.filter(n=>clock-n.at<.18);for(const [id,root]of rootRecords)if(clock>=root.expires){rootRecords.delete(id);combatState.evaluated.delete(id);}
    if(h.dead){phase='dead';G.state='dead';clearInput();overlay('Try again','Committed equipment is safe. This encounter restarts at full health.',['r7Reload']);return;}
    if(!labMode&&G.enemies.length&&G.enemies.every(e=>e.dead)&&hazards.length===0){
      clearInput();if(level===1){phase='saving';G.state='r7-save';persist(R7Store.reward(profile),resume);}
      else{phase='end';G.state='r7-end';overlay('First playable slice complete','Arcade opponents cleared in this preview. GPU equipment remains saved. G2 completion and its Breakthrough reward are not recorded yet; this checkpoint ends before that next increment. Reload resumes G2.',['r7Reload']);}
    }
  }
  function update(dt){
    viewport();if(live()){acc+=Math.min(dt,.05);while(acc>=FIXED&&live()){if(G.hitStop>0)G.hitStop=Math.max(0,G.hitStop-FIXED);else fixed(FIXED);acc=Math.max(0,acc-FIXED);}}
    else acc=0;
    G.rt+=dt;updateCamera(dt);ui();
  }
  function pause(value,auto=false){
    if(phase!=='combat')return;G.paused=value;clearInput();Sfx.suspend(value);show('ovPause',value);
    for(const id of ['game','hudR','touchUI'])$(id).inert=value;
    $('game').inert=value||portrait;$(portrait?'r9RotateFullscreen':value?'btnResume':'game').focus();
    $('pauseWhy').textContent=auto?'Paused on focus loss.':'Paused';$('pauseRunes').textContent='';touchControls();
  }
  function key(c){
    if(/^(Key[WASD]|Arrow(Up|Down|Left|Right))$/.test(c)&&Input.st.mode==='touch'){mode('kb');Input.keys.add(c);}
    if(portrait)return;
    if(['Enter','Space'].includes(c)&&['n00','n01','onboarding'].includes(phase)){advanceStory();return;}
    if(/^Digit[12]$/.test(c)){requestActive(Number(c.slice(-1)));return;}
    if(c==='KeyM'){toggleMute();return;}
    if(c==='KeyP'||c==='Escape'){pause(!G.paused);return;}
    if(c==='Enter'&&G.paused){pause(false);return;}
    if(c==='Enter'&&phase==='title')start();
  }
  function ui(){
    const touch=Input.st.mode==='touch';touchControls();document.body.classList.toggle('touch',touch);
    $('btnAtk').textContent=labMode?'瞄准':'攻击';$('btnAtk').setAttribute('aria-label',labMode?'拖动预览，松手攻击；轻点自动瞄准最近对手':'攻击');$('r12ApproachLabel').textContent=touch?'摇杆靠近':'点选敌人';$('r7DiagramTitle').textContent=touch?'左摇杆靠近，按住攻击交替出拳。只有接触到的对手受伤，每拳最多三人。':'Select an enemy to approach, then the GPU gauntlets alternate. Only touching opponents take damage, at most three per strike.';
    $('r13Learn').textContent=touch?'左摇杆靠近，按住右侧攻击交替出拳。最多命中三人。':'点选敌人，靠近后交替出拳。最多命中三人。';
    $('r7Hud').hidden=phase!=='combat';$('r9Pause').hidden=phase!=='combat';$('r7Health').textContent='HP '+Math.ceil(G.hero?.hp||0)+' / '+(labMode?G.hero.maxHp:100);
    $('r7Kit').textContent=(labMode?'调试 G'+level:level===1?'餐厅':'街机')+' · '+G.enemies.filter(e=>!e.dead).length;
    const skillState=combatState?JensenCombatActions.inspect(combatState):null;
    for(const slot of [1,2]){const button=$('r14Skill'+slot),owned=combatConfig?.entry['slot_'+slot],cd=skillState?Math.max(0,skillState.cdEnd[slot]-clock):0;button.disabled=!owned||!live();button.textContent=owned?slot+' · '+(cd>0?cd.toFixed(1)+'s':slot===1?'突围':'清场'):slot+' · —';button.setAttribute('aria-label',owned?(slot===1?'突围':'清场')+(cd>0?'冷却中':'就绪'):'技能位'+slot+'尚未解锁');}
    $('r7Replay').disabled=labMode||!profile?.receipt;
    const provider=allies.findLast(a=>a.until>clock);$('r8Cue').textContent=provider?(provider.target===0?'同事：托盘放这儿！':'领班：这里还有托盘！')+(tray?'（已持盘）':''):clock<hintUntil?(touch?(labMode?'左侧落点移动 · 右侧瞄准松手攻击':'左摇杆移动 · 按住右侧攻击'):'点地移动 · 点敌追击'): '';$('r8Cue').hidden=phase!=='combat'||(!provider&&clock>=hintUntil);
  }
  function drawHero(ctx,h){
    const a=action,angle=h.bodyAng,skill=combatState?JensenCombatActions.inspect(combatState).active:null,equipment=labMode?combatConfig.entry.equipment:profile?.owned?.equipment||{right:profile?.frontier===2?'gpu_gauntlet':null,left:profile?.frontier===2?'gpu_gauntlet':null};
    const s={materials:labMode,x:h.x,y:h.y,bodyAng:angle,headAng:h.headAng,walk:h.walk,moveAmt:h.moveAmt,vx:h.vx,vy:h.vy,pose:h.pose,hurtT:h.hurtT,time:G.t,visual:h.visual,cloakAng:h.cloakAng};
    const guard=side=>({x:h.x+Math.cos(angle)*13-Math.sin(angle)*side*11,y:h.y+Math.sin(angle)*13+Math.cos(angle)*side*11});
    let handPos=guard(a?.side?1:-1);
    if(a){const begin=a.profile.contactStart??.1,finish=a.profile.contactEnd??.18,start=handPoint(h,a,begin),end=handPoint(h,a,finish),q=a.age<begin?easeOut(a.age/begin):a.age>finish?easeIO(clamp((a.age-finish)/.14,0,1)):0;
      handPos=a.age<begin?{x:lerp(handPos.x,start.x,q),y:lerp(handPos.y,start.y,q)}:a.age<=finish?handPoint(h,a,a.age):{x:lerp(end.x,handPos.x,q),y:lerp(end.y,handPos.y,q)};
    }
    let activeHand=activeCarrier?.hand||(skill?.variant==='shield_brace'?'right':skill?.variant==='hammer_ring'?'left':a?.side?'right':'left');if(activeCarrier)handPos={x:h.x+Math.cos(activeCarrier.endAngle)*activeCarrier.reach,y:h.y+Math.sin(activeCarrier.endAngle)*activeCarrier.reach};
    const otherHand=activeHand==='left'?'right':'left',otherGuard=guard(activeHand==='left'?1:-1);
    s.prototypeHands={[activeHand]:{x:handPos.x,y:handPos.y-handHeight()},[otherHand]:{x:otherGuard.x,y:otherGuard.y-handHeight()}};
    const toolAngle=activeCarrier?.endAngle??skill?.angle??a?.angle??angle;
    if(activeCarrier||a){const tool=equipment[activeHand],offset=tool==='thor_hammer'?14:tool==='wafer_shield'?(labMode?4:12):tool==='gpu_gauntlet'&&labMode?2:0;if(offset){s.prototypeHands[activeHand].x-=Math.cos(toolAngle)*offset;s.prototypeHands[activeHand].y-=Math.sin(toolAngle)*offset;}}
    const drawEquipment=(ctx,layer,rig)=>{
    if(equipment.left||equipment.right){for(const key of ['left','right']){const point=s.prototypeHands[key];if(labMode&&(point.y<rig.bodyY?'back':'front')!==layer)continue;const facing=key===activeHand?toolAngle:angle,tool=equipment[key];if(tool==='gpu_gauntlet')drawGauntlet(ctx,point,facing);else if(tool==='wafer_shield')drawShield(ctx,point,facing);else if(tool==='thor_hammer')drawHammer(ctx,point,facing);}}
    else{if(labMode&&(handPos.y-handHeight()<rig.bodyY?'back':'front')!==layer)return;ctx.save();ctx.translate(handPos.x,handPos.y-handHeight());ctx.rotate(a?.angle??angle);
      if(tray){ctx.fillStyle='#9ca9a6';ctx.strokeStyle='#252f33';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,14,10,0,0,TAU);ctx.fill();ctx.stroke();ctx.strokeStyle='#f3ead0';ctx.lineWidth=1.7;ctx.beginPath();ctx.ellipse(0,0,12,8,0,0,TAU);ctx.stroke();ctx.strokeStyle='#627174';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-7,3);ctx.lineTo(7,3);ctx.stroke();}
      else{ctx.fillStyle='#e3bf93';ctx.beginPath();ctx.arc(0,0,labMode?4.3:5,0,TAU);ctx.fill();}
      ctx.restore();
    }
    };
    CharacterRenderer.drawCharacter(ctx,s,level===1?'jensen-young':'jensen-founder',{shadow:false,drawProp:false,drawEquipment});
    if(level===1&&!labMode){ctx.save();ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#e4f2bb';ctx.fillText('Jensen · 少年',h.x,h.y-47);ctx.restore();}
  }
  function metal(ctx,points,base,light){
    ctx.beginPath();for(const [x,y]of points)ctx.lineTo(x,y);ctx.closePath();ctx.fillStyle=base;ctx.strokeStyle='#0a090b';ctx.lineWidth=2;ctx.fill();ctx.stroke();
    ctx.save();ctx.clip();ctx.strokeStyle='rgba(8,9,10,.5)';ctx.lineWidth=.8;for(let y=-24;y<=24;y+=4){ctx.beginPath();ctx.moveTo(-20,y);ctx.lineTo(20,y+12);ctx.stroke();}ctx.restore();ctx.strokeStyle=light;ctx.lineWidth=1;ctx.beginPath();for(const [x,y]of points.slice(0,4))ctx.lineTo(x+1,y+1);ctx.stroke();
  }
  function drawShield(ctx,point,angle){
    ctx.save();ctx.translate(point.x,point.y);ctx.rotate(angle);
    metal(ctx,[[-6,-19],[1,-23],[8,-19],[12,-9],[13,7],[8,20],[1,23],[-6,18]],'#344237','#b9bd91');
    ctx.beginPath();ctx.ellipse(2,0,7,18,0,0,TAU);ctx.fillStyle='#4d6150';ctx.fill();ctx.strokeStyle='#101b18';ctx.lineWidth=1.1;ctx.stroke();
    ctx.save();ctx.clip();ctx.strokeStyle='#899974';ctx.lineWidth=.6;for(let y=-12;y<=12;y+=6){ctx.beginPath();ctx.moveTo(-5,y);ctx.lineTo(11,y);ctx.stroke();}for(const x of[-2,3,8]){ctx.beginPath();ctx.moveTo(x,-19);ctx.lineTo(x,19);ctx.stroke();}ctx.restore();ctx.beginPath();ctx.ellipse(3,-3,3.5,5,0,0,TAU);ctx.fillStyle='#bac998';ctx.fill();ctx.restore();
  }
  function drawHammer(ctx,point,angle){
    ctx.save();ctx.translate(point.x,point.y);ctx.rotate(angle);ctx.lineCap='round';ctx.strokeStyle='#0a090b';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-5,0);ctx.lineTo(15,0);ctx.stroke();ctx.strokeStyle='#725438';ctx.lineWidth=3.5;ctx.stroke();ctx.strokeStyle='#c0a779';ctx.lineWidth=.65;for(let x=-3;x<9;x+=3){ctx.beginPath();ctx.moveTo(x,-1.5);ctx.lineTo(x+2,1.5);ctx.stroke();}
    metal(ctx,[[7,-8],[11,-12],[21,-9],[23,-5],[23,8],[19,12],[9,9],[7,5]],'#7e8988','#d8dbca');metal(ctx,[[10,-8],[17,-7],[17,8],[10,7]],'#abb5ad','#ece5ce');ctx.strokeStyle='#343e3b';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(12,-4);ctx.lineTo(15,-1);ctx.lineTo(12,2);ctx.lineTo(15,5);ctx.stroke();ctx.restore();
  }
  function drawGauntlet(ctx,point,angle){
    ctx.save();ctx.translate(point.x,point.y);ctx.rotate(angle);
    metal(ctx,[[-11,-5],[-7,-9],[4,-9],[10,-5],[11,3],[7,8],[-6,9],[-10,5]],'#47523e','#bcc4a5');
    ctx.beginPath();ctx.ellipse(-5,0,4,6,0,0,TAU);ctx.fillStyle='#697569';ctx.fill();ctx.strokeStyle='#151c1a';ctx.lineWidth=1;ctx.stroke();
    for(const y of[-3,3]){ctx.beginPath();ctx.ellipse(2,y,3.6,2.5,0,0,TAU);ctx.fillStyle='#252d27';ctx.fill();ctx.strokeStyle='#90a076';ctx.lineWidth=.7;ctx.stroke();ctx.beginPath();ctx.moveTo(-.5,y);ctx.lineTo(4.5,y);ctx.moveTo(2,y-1.5);ctx.lineTo(2,y+1.5);ctx.stroke();}
    ctx.strokeStyle='#bcc68e';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(7,-4);ctx.lineTo(9,-2);ctx.moveTo(7,1);ctx.lineTo(9,3);ctx.stroke();ctx.restore();
  }
  function drawImpact(ctx,f){
    const q=clamp(f.age/f.life,0,1);ctx.save();ctx.globalCompositeOperation='source-over';ctx.translate(f.x,f.y);ctx.globalAlpha=1-q;ctx.lineCap='round';ctx.lineJoin='round';
    if(f.kit==='bare'){ctx.strokeStyle='#d9c2a0';ctx.lineWidth=1.6;ctx.beginPath();for(const a of [-.8,.5,2.2]){ctx.moveTo(Math.cos(a)*2,Math.sin(a)*2);ctx.lineTo(Math.cos(a)*(5+q*2),Math.sin(a)*(5+q*2));}ctx.stroke();}
    else if(f.kit==='tray'){ctx.strokeStyle='#252f33';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-8,-4);ctx.lineTo(8,4);ctx.moveTo(-3,6);ctx.lineTo(4,-7);ctx.stroke();ctx.strokeStyle='#e9e1bd';ctx.lineWidth=1;ctx.stroke();}
    else if(f.kit==='hammer'){ctx.strokeStyle='#c8c7a3';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<6;i++){const angle=i*TAU/6;ctx.moveTo(Math.cos(angle)*(3+q*4),Math.sin(angle)*(3+q*4));ctx.lineTo(Math.cos(angle)*(10+q*8),Math.sin(angle)*(10+q*8));}ctx.stroke();ctx.strokeStyle='#484d45';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(0,3,8+q*8,4+q*4,0,0,TAU);ctx.stroke();}
    else{ctx.strokeStyle='#222f2f';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-8,2);ctx.lineTo(-3,-3);ctx.lineTo(0,2);ctx.lineTo(3,-3);ctx.lineTo(8,-1);ctx.stroke();ctx.strokeStyle='#b9e9bd';ctx.lineWidth=1.3;ctx.stroke();}
    ctx.restore();
  }
  function foreground(ctx){
    if(phase!=='combat')return;
    const a=action,h=G.hero;
    if(labMode&&aimGesture?.explicit){
      const p=current(),angle=lastAim??h.aim;ctx.save();ctx.translate(h.x,h.y-handHeight());ctx.rotate(angle);ctx.lineCap='round';ctx.strokeStyle='rgba(9,12,10,.9)';ctx.lineWidth=2*p.radius+3;ctx.beginPath();ctx.arc(0,0,p.reach-p.radius,-.9,.9);ctx.stroke();ctx.strokeStyle='rgba(218,220,167,.45)';ctx.lineWidth=2*p.radius;ctx.stroke();ctx.strokeStyle='#fff4b9';ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(p.reach,0);ctx.strokeStyle='#0b100d';ctx.lineWidth=4;ctx.stroke();ctx.strokeStyle='#fff4b9';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
    }
    for(const trail of swingTrails){ctx.save();ctx.globalAlpha=(1-trail.age/trail.life)*.65;ctx.lineCap='round';ctx.strokeStyle=trail.material==='hammer'?'#cad4c5':trail.material==='gpu'?'#adc995':'#cfb99a';ctx.lineWidth=trail.material==='hammer'?4:2;ctx.beginPath();ctx.moveTo(trail.from.x,trail.from.y-handHeight());ctx.lineTo(trail.to.x,trail.to.y-handHeight());ctx.stroke();ctx.restore();}
    if(a&&kit(a.profile)==='tray'&&a.age>=(a.profile.contactStart??.1)&&a.age<=(a.profile.contactEnd??.18)){const from=handPoint(h,a,Math.max(a.profile.contactStart??.1,a.age-.025)),to=handPoint(h,a,a.age);ctx.save();ctx.strokeStyle='#d8dfcd';ctx.globalAlpha=.35;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(from.x,from.y-handHeight());ctx.lineTo(to.x,to.y-handHeight());ctx.stroke();ctx.restore();}
    if(activeCarrier?.source==='clear_space'){ctx.save();ctx.strokeStyle='#c6dabc';ctx.globalAlpha=.55;ctx.lineWidth=2;ctx.beginPath();ctx.arc(h.x,h.y-handHeight(),activeCarrier.reach,activeCarrier.startAngle,activeCarrier.endAngle);ctx.stroke();ctx.restore();}
    for(const e of G.enemies)if(e.hp>0&&e.state==='active'&&['locked_fist_sweep','shield_cycle_bash'].includes(e.config.pattern)&&e.attack?.contactShape){
      const shape=e.attack.contactShape;drawThreat(ctx,shape,'#e4ba80',true);
      if(shape.kind==='capsule'){ctx.save();ctx.strokeStyle='#172128';ctx.lineWidth=14;ctx.beginPath();ctx.moveTo(e.x,e.y-17*e.scale);ctx.lineTo(shape.to.x,shape.to.y-handHeight());ctx.stroke();ctx.strokeStyle='#7b929b';ctx.lineWidth=9;ctx.stroke();ctx.fillStyle='#b3c1bc';ctx.strokeStyle='#172128';ctx.lineWidth=2;ctx.fillRect(shape.to.x-9,shape.to.y-26,18,18);ctx.strokeRect(shape.to.x-9,shape.to.y-26,18,18);ctx.restore();}
    }
    for(const net of networkFX){ctx.save();ctx.globalAlpha=clamp(1-(clock-net.at)/.18,0,1);ctx.strokeStyle='#a9d9b2';ctx.lineWidth=1.5;for(const edge of net.edges){const mx=(edge.from.x+edge.to.x)/2,my=(edge.from.y+edge.to.y)/2;ctx.beginPath();ctx.moveTo(edge.from.x,edge.from.y-handHeight());ctx.lineTo(mx+3,my-20);ctx.lineTo(mx-3,my-14);ctx.lineTo(edge.to.x,edge.to.y-handHeight());ctx.stroke();}ctx.restore();}
    for(const e of G.enemies)if(e.entered&&e.hp>0&&e.state==='tell'&&['troublemaker_boss','champion'].includes(e.role)&&e.attack){
      // Directional spine and source chevrons clarify the existing tell, not its danger boundary.
      ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.attack.angle);ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(72,0);ctx.strokeStyle='#172128';ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle='#ffe1a0';ctx.lineWidth=2;ctx.stroke();ctx.restore();
      ctx.save();ctx.translate(e.x,e.y-(labMode?52:24)*e.scale);ctx.rotate(e.attack.angle);ctx.beginPath();for(const x of [15,25]){ctx.moveTo(x-5,-5);ctx.lineTo(x,0);ctx.lineTo(x-5,5);}ctx.strokeStyle='#172128';ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle='#ffe1a0';ctx.lineWidth=1.8;ctx.stroke();ctx.restore();
    }
  }
  function drawEnemy(ctx,e){
    if(e.dead||!e.entered)return;
    const boss=e.role==='troublemaker_boss',customer=e.role==='troublemaker_customer',diner=boss||customer;
    const appearance={marker:diner?'none':undefined,outfit:diner?'bomber':'shirt',hairStyle:boss?'swept':customer||e.role==='rusher'?'cropped':'swept',hairColor:diner?'#181b1c':'#5a5147',faceShape:boss?'square':'oval',skin:'#bca184',cloth:'hem',palette:{cloth:boss?'#672d3c':customer?['#304459','#41464c','#566044'][e.id-1]:e.role==='rusher'?'#a04945':'#536caf',light:diner?'#d5d3cb':'#d5c6a0',dark:'#252f30',accent:diner?'#88897f':'#e3aa4b',metal:'#9fa6a4'},prop:'none'};
    if(level>=3){appearance.palette.cloth=e.config.render.cloth||appearance.palette.cloth;appearance.hairStyle=['ati_captain','disc_champion'].includes(e.typeId)?'long':appearance.hairStyle;}
    const recovering=boss&&e.state==='recover',telling=boss&&e.state==='tell';
    const pose={tw:0,hip:0,sa:0,hr:14,ha:0,ld:e.state==='active'?(boss?10:5):telling?-7:recovering?6+Math.sin(clock*8)*.6:0,cr:recovering?.45+Math.sin(clock*8)*.025:telling?.2:e.state==='tell'?.25:0};
    const recoil=e.recoil||0;pose.tw+=Math.sin((e.recoilAngle||0)-e.face)*recoil*.25;pose.ld-=recoil*(e.state==='tell'?1:3);pose.cr+=recoil*.08;
    const snapshot={materials:labMode,x:0,y:0,bodyAng:e.bodyAng??e.face,headAng:e.headAng??e.face,walk:telling?Math.PI/2:e.walk,moveAmt:telling?.65:e.moveAmt,pose,hurtT:e.flash,time:G.t,visual:e.visual,cloakAng:e.visual?.cloakAng};
    ctx.save();ctx.globalAlpha=e.hp<=0?Math.max(0,e.retire/.5):1;
    ctx.save();ctx.translate(e.x,e.y);ctx.scale(e.scale*(boss?1.12:1),e.scale);CharacterRenderer.drawCharacter(ctx,snapshot,appearance,{shadow:false,drawProp:false,...(labMode&&level>=3?{drawEquipment:(g,layer)=>{if(layer===(Math.sin(e.face)<-.2?'back':'front'))drawEnemyTool(g,{...e,x:0,y:0,scale:1});}}:{})});ctx.restore();
    if(level>=3&&!labMode)drawEnemyTool(ctx,e);
    if(e.role==='champion'){ctx.strokeStyle='#8df1e5';ctx.lineWidth=4;ctx.strokeRect(e.x-27,e.y-30,54,32);}
    ctx.fillStyle='#e2eed8';ctx.font='11px sans-serif';ctx.textAlign='center';if(!labMode||e.id===targetId||e.flash>0||e.config.boss&&e.config.ownerKind!=='independent_seat')ctx.fillText(boss?'带头闹事的大客':customer?'闹事顾客':e.config?.label||e.role,e.x,e.y-(labMode?64:boss?64:46));
    if(boss&&['tell','active','recover'].includes(e.state)){ctx.fillStyle='#ffe3a1';ctx.fillText(telling?'蓄力 · 侧移':recovering?'喘气 · 反击':'重冲撞',e.x,e.y+22);}
    ctx.fillStyle='#26312b';ctx.fillRect(e.x-22,e.y-(labMode?51:40),44,4);ctx.fillStyle=e.flash?'#fff1a8':'#e9ad6b';ctx.fillRect(e.x-22,e.y-(labMode?51:40),44*Math.max(0,e.hp/e.maxHp),4);ctx.restore();
  }
  function drawEnemyTool(ctx,e){
    const p=e.config.pattern,a=e.face,scale=e.scale;ctx.save();ctx.translate(e.x,e.y-handHeight()*scale);ctx.rotate(a);ctx.scale(scale,scale);ctx.strokeStyle='#182227';ctx.lineWidth=2;
    if(p==='shield_cycle_bash'){const open=!e.shieldClosed;for(const side of e.typeId==='ati_captain'?[-1,1]:[1]){ctx.save();ctx.translate(open?-6:12,side*(open?20:12));ctx.rotate(open?side*.9:0);ctx.fillStyle='#667a84';ctx.fillRect(-5,-11,11,22);ctx.strokeRect(-5,-11,11,22);ctx.strokeStyle='#d5d7bf';ctx.strokeRect(-3,-8,7,16);ctx.restore();}}
    else if(p==='locked_fist_sweep'){ctx.fillStyle='#596d76';ctx.fillRect(-10,-20,25,40);ctx.strokeRect(-10,-20,25,40);ctx.fillStyle='#a9b6af';ctx.fillRect(6,-27,14,13);ctx.fillRect(6,14,14,13);ctx.strokeRect(6,-27,14,13);ctx.strokeRect(6,14,14,13);ctx.fillStyle='#d7bb99';ctx.beginPath();ctx.arc(-6,0,5,0,TAU);ctx.fill();ctx.stroke();}
    else if(p==='return_disc'){ctx.fillStyle='#a7bdbd';ctx.beginPath();ctx.ellipse(15,9,11,7,0,0,TAU);ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(15,9,5,3,0,0,TAU);ctx.stroke();}
    else if(p==='ground_heat'){ctx.strokeStyle='#d1ae73';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(15,9,10,6,0,0,TAU);ctx.stroke();ctx.strokeStyle='#25312f';ctx.lineWidth=1;ctx.stroke();}
    else if(['fixed_shot','alternating_lane','curved_arc_shot'].includes(p)){ctx.fillStyle='#697d87';ctx.fillRect(4,4,24,8);ctx.strokeRect(4,4,24,8);ctx.fillStyle='#d7bf8a';ctx.fillRect(22,5,6,6);}
    else{ctx.fillStyle=p==='heavy_charge'?'#835f4f':'#8d8e77';ctx.fillRect(8,-16,11,10);ctx.fillRect(8,6,11,10);ctx.strokeRect(8,-16,11,10);ctx.strokeRect(8,6,11,10);}
    ctx.restore();if(e.typeId.startsWith('seat_')&&(!labMode||e.id===targetId||e.flash>0)){ctx.save();ctx.fillStyle='#14231f';ctx.strokeStyle='#d4c9a3';ctx.lineWidth=1.5;ctx.fillRect(e.x-8,e.y-(labMode?65:34),16,14);ctx.strokeRect(e.x-8,e.y-(labMode?65:34),16,14);ctx.fillStyle='#f1e5bd';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillText(e.typeId.slice(-2),e.x,e.y-(labMode?54:23));ctx.restore();}
  }
  function drawThreat(ctx,shape,color='#e7bd78',fill=false){
    ctx.save();ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=2;ctx.globalAlpha=fill?.3:.65;if(!fill)ctx.setLineDash([5,4]);ctx.beginPath();
    if(shape.kind==='circle'){ctx.arc(shape.x,shape.y,shape.r,0,TAU);if(fill)ctx.fill();else ctx.stroke();}
    else if(shape.kind==='arc'){ctx.moveTo(shape.x,shape.y);ctx.arc(shape.x,shape.y,shape.radius,shape.angle-shape.halfAngle,shape.angle+shape.halfAngle);ctx.closePath();if(fill)ctx.fill();else ctx.stroke();}
    else{ctx.lineWidth=Math.max(2,shape.r*2);ctx.globalAlpha=fill?.35:.22;ctx.moveTo(shape.from.x,shape.from.y);ctx.lineTo(shape.to.x,shape.to.y);ctx.stroke();ctx.lineWidth=2;ctx.globalAlpha=.8;ctx.stroke();}ctx.restore();
  }
  function drawSupport(ctx){
    for(const ally of allies){
      const p=pickups[ally.target],pointing=ally.until>clock,angle=Math.atan2(p.y-ally.y,p.x-ally.x);
      const s={x:ally.x,y:ally.y,bodyAng:angle,headAng:angle,walk:0,moveAmt:0,pose:{tw:0,hip:0,sa:0,hr:10,ha:0,ld:0,cr:0},time:G.t};
      if(pointing)s.prototypeHands={left:{x:ally.x+Math.cos(angle)*30,y:ally.y-17+Math.sin(angle)*30}};
      const appearance={outfit:'apron',cloth:'apron',hairStyle:'receding',hairColor:ally.target?'#43372e':'#bca184',skin:'#bca184',palette:{cloth:ally.color,light:'#d5c6a0',dark:'#293331',accent:'#e3d5b4',metal:'#9fa6a4'},prop:'none'};
      ctx.save();CharacterRenderer.drawCharacter(ctx,s,appearance,{shadow:false,drawProp:false});
      if(ally.target){const rig=CharacterRenderer.computeRig(s);ctx.save();ctx.translate(rig.headX,rig.headY);ctx.rotate(angle);ctx.fillStyle='#43372e';ctx.beginPath();ctx.ellipse(5,0,3,5,0,0,TAU);ctx.fill();ctx.restore();}
      ctx.fillStyle='#bfe9d3';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText(ally.label,ally.x,ally.y-46);ctx.restore();
    }
  }
  function ground(ctx){
    if(level===1&&!labMode){ctx.save();ctx.fillStyle='#394d43';ctx.fillRect(0,0,World.W,World.H);for(let y=World.WALL;y<World.H-World.WALL;y+=84)for(let x=World.WALL;x<World.W-World.WALL;x+=84){ctx.fillStyle=(Math.floor(x/84)+Math.floor(y/84))%2?'#455347':'#5b5e4f';ctx.fillRect(x,y,Math.min(84,World.W-World.WALL-x),Math.min(84,World.H-World.WALL-y));}if(phase==='combat')B1Appearance.drawFloor(ctx,World.W,World.H,World.WALL);ctx.strokeStyle='#a68458';ctx.lineWidth=World.WALL;ctx.strokeRect(World.WALL/2,World.WALL/2,World.W-World.WALL,World.H-World.WALL);ctx.fillStyle='#d2c297';ctx.font='bold 26px sans-serif';ctx.textAlign='center';ctx.fillText('DINER · 守住这一班',720,180);ctx.restore();}
    else if(!labMode){ctx.save();ctx.fillStyle='rgba(18,38,60,.8)';ctx.fillRect(45,45,World.W-90,World.H-90);ctx.strokeStyle='#426c87';ctx.lineWidth=1;for(let x=80;x<World.W;x+=80){ctx.beginPath();ctx.moveTo(x,45);ctx.lineTo(x,World.H-45);ctx.stroke();}ctx.restore();}
    if(phase!=='combat')return;
    drawSupport(ctx);
    const selected=G.enemies.find(e=>e.id===targetId&&e.entered&&!e.dead&&e.hp>0),mark=selected||destination;if(mark){ctx.save();ctx.strokeStyle=selected?'#f4be71':'#a6e3cc';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(mark.x,mark.y,selected?selected.r+8:10,selected?selected.r*.6+5:6,0,0,TAU);ctx.stroke();ctx.restore();}
    for(const p of pickups)if(p.visible&&!p.taken){ctx.save();ctx.globalAlpha=p.disabled?.45:1;ctx.fillStyle='#d3d8cd';ctx.strokeStyle='#e7d17b';ctx.lineWidth=2;ctx.fillRect(p.x-15,p.y-10,30,20);ctx.strokeRect(p.x-15,p.y-10,30,20);ctx.fillStyle='#fff1ba';ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillText(p.disabled?'已持托盘 · 无需再拾':'托盘 · 走近拾取',p.x,p.y-18);ctx.restore();}
    for(const e of G.enemies)if(!labMode&&level<=2&&e.entered&&e.hp>0&&e.state==='tell'){const a=e.attack.angle,len=e.role==='gunner'||e.role==='champion'?650:140;ctx.save();ctx.strokeStyle='#f4bc63';ctx.lineWidth=e.role==='champion'?20:8;ctx.globalAlpha=.5;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(a)*len,e.y+Math.sin(a)*len);ctx.stroke();ctx.restore();}
    for(const e of G.enemies)if((labMode||level>=3)&&e.entered&&e.hp>0&&e.state==='tell'&&e.attack){for(const shape of e.attack.shapes)drawThreat(ctx,shape);if(e.attack.trajectory){ctx.save();ctx.strokeStyle='#dab774';ctx.setLineDash([4,4]);ctx.beginPath();e.attack.trajectory.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.restore();}if(e.attack.turnPoint){const p=e.attack.turnPoint;ctx.save();ctx.strokeStyle='#d8c395';ctx.strokeRect(p.x-5,p.y-5,10,10);ctx.restore();}}
    for(const p of hazards){ctx.save();ctx.fillStyle='#ffcf76';ctx.strokeStyle='#ffcf76';if(p.kind==='heat'){drawThreat(ctx,{kind:'circle',x:p.x,y:p.y,r:p.r},'#e28b51',true);ctx.restore();continue;}if(p.kind==='returnDisc'){ctx.strokeStyle=p.phase==='return'?'#a0d8e6':'#f0cb81';ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,TAU);ctx.stroke();ctx.lineWidth=1;ctx.strokeRect(p.x-3,p.y-3,6,6);ctx.restore();continue;}if(p.kind==='curvedArc'&&p.trail?.length){ctx.strokeStyle='#bdc8a1';ctx.globalAlpha=.5;ctx.lineWidth=2;ctx.beginPath();p.trail.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.stroke();ctx.globalAlpha=1;}if(p.kind==='beam'){const end=beamEnd(p);ctx.lineWidth=p.r*2;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(end.x,end.y);ctx.stroke();ctx.lineWidth=3;ctx.strokeStyle='#fff9dc';ctx.stroke();}else{ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,TAU);ctx.fill();}ctx.restore();}
  }
  function drawProp(ctx,p){if(labMode){World.drawProp(ctx,p);return;}ctx.save();ctx.fillStyle=level===1&&!labMode?'#806443':'#38475f';ctx.strokeStyle='#bcad80';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle='#d4c8ab';ctx.beginPath();ctx.ellipse(p.x,p.y-4,p.r*.6,p.r*.35,0,0,TAU);ctx.fill();ctx.restore();}
  function labSnapshot(){const config=copy(labConfig);Object.assign(config.hero,{hp:G.hero.hp,maxHp:G.hero.maxHp,r:G.hero.r});return config;}
  function legalPosition(x,y,r,exclude=null){return World.walkable(x,y,r)&&[G.hero,...G.enemies].every(e=>e===exclude||e.dead||(e!==G.hero&&e.hp<=0)||e.entered===false||Math.hypot(x-e.x,y-e.y)>=r+e.r);}
  function placeNear(x,y,r,exclude=null){
    if(legalPosition(x,y,r,exclude))return {x,y};
    for(let d=8;d<=400;d+=8)for(let i=0;i<32;i++){const a=i*TAU/32,px=x+Math.cos(a)*d,py=y+Math.sin(a)*d;if(legalPosition(px,py,r,exclude))return {x:px,y:py};}return null;
  }
  function labActor(typeId,spawn){const id=++labOrdinal;return JensenCombatEnemies.create(labConfig.types[typeId],{...spawn,id,spawnOrdinal:id,initialWait:labConfig.limits.initialWaitBase+id*labConfig.limits.initialWaitStep},attempt);}
  function labReset(stage){
    if(!Number.isInteger(stage)||stage<1||stage>8)return {ok:false,error:'入场状态必须为G1–G8'};
    labConfig=JensenCombatData.growthDefaults(stage);damageLog=[];swingTrails=[];profile=null;receipt=null;busy=false;pending=null;labOrdinal=0;labStatic=false;labImmortal=true;tray=false;
    enter(Math.min(stage,2));level=stage;G.lab=true;G.hero.maxHp=labConfig.hero.maxHp;G.hero.hp=G.hero.hpLag=labConfig.hero.hp;G.hero.r=labConfig.hero.r;
    if(stage<=2){for(const e of G.enemies){e.typeId=e.role;e.ownerId=attempt+':owner:'+e.id;e.spawnOrdinal=e.id;e.config=copy(labConfig.types[e.role]);e.hp=e.maxHp=e.config.hp;labOrdinal=Math.max(labOrdinal,e.id);}}
    else{G.enemies=[];allies=[];pickups=[];const formation=labConfig.encounters.find(e=>e.stage===stage);G.hero.x=formation.hero_xy[0];G.hero.y=formation.hero_xy[1];World.collide(G.hero,G.hero.r);for(const spawn of formation.actors){const e=labActor(spawn.typeId,spawn),point=placeNear(e.x,e.y,e.r);if(!point)throw Error('调试阵型无法合法放置 '+spawn.typeId);Object.assign(e,point);G.enemies.push(e);}}
    G.growth.chapterId='arcade';G.cam.x=G.hero.x;G.cam.y=G.hero.y;if(!labMounted){labMounted=true;JensenLab.mount(labAPI);}ui();return {ok:true};
  }
  function labSpawn(typeId,count){
    if(!labConfig.types[typeId]||!Number.isInteger(count)||count<0||count>30)return {ok:false,error:'请选择有效对手与0–30整数数量'};
    const cfg=labConfig.types[typeId],cap=cfg.boss?labConfig.limits.bossCap:labConfig.limits.normalCap,used=G.enemies.filter(e=>!e.dead&&!!e.config?.boss===!!cfg.boss).length;
    if(used+count>cap)return {ok:false,error:'超过'+(cfg.boss?'Boss':'普通')+'容量；已有敌人不会删除'};
    const created=[];for(let i=0;i<count;i++){const e=labActor(typeId,{x:G.hero.x+Math.cos(G.hero.aim)*180,y:G.hero.y+Math.sin(G.hero.aim)*180}),point=placeNear(e.x,e.y,e.r);if(!point){G.enemies.splice(G.enemies.length-created.length);return {ok:false,error:'没有足够的合法召唤位置'};}Object.assign(e,point);G.enemies.push(e);created.push(e);}return {ok:true};
  }
  function labPatch(section,patch,existing){
    const result=JensenCombatData.validatePatch(labSnapshot(),section,patch);if(!result.ok)return result;const next=result.value;
    if(section==='hero'&&next.hero.r!==G.hero.r&&!legalPosition(G.hero.x,G.hero.y,next.hero.r,G.hero))return {ok:false,error:'新主角尺寸与场地或实体冲突'};
    if(existing&&section.startsWith('enemy:')){const type=section.slice(6),cfg=next.types[type];if(G.enemies.some(e=>e.typeId===type&&!e.dead&&cfg.collision_r!==e.r&&!legalPosition(e.x,e.y,cfg.collision_r,e)))return {ok:false,error:'新敌人尺寸与实体冲突；可先清空或仅应用下次召唤'};}
    labConfig=next;combatConfig=labConfig;if(section==='hero'){Object.assign(G.hero,{hp:next.hero.hp,maxHp:next.hero.maxHp,r:next.hero.r});if(G.hero.hp===0&&!labImmortal)labSetImmortal(false);}
    if(existing&&section.startsWith('enemy:'))for(const e of G.enemies)if(e.typeId===section.slice(6)&&!e.dead){e.config=copy(next.types[e.typeId]);e.r=e.config.collision_r;e.scale=e.config.scale;e.parity=typeof e.config.pattern_params.parity==='number'?e.config.pattern_params.parity:e.parity;if(Object.hasOwn(patch,'hp'))e.hp=e.maxHp=e.config.hp;}
    return {ok:true};
  }
  function labSetImmortal(value){labImmortal=!!value;if(!labImmortal&&G.hero.hp===0&&!G.hero.dead){G.hero.dead=true;phase='dead';G.state='dead';clearInput();show('ovPause',false);overlay('调试角色已倒下','重置入场可继续。',['r7Reload']);}}
  function setTray(value){
    if(level!==1)return {ok:false,error:'临时托盘仅用于G1'};
    value=!!value;
    if(labMode){
      const candidate=labSnapshot();candidate.auto=value?{...profiles.tray,damage:35,cycle:.55,critChance:candidate.auto.critChance,critMultiplier:candidate.auto.critMultiplier,id:'tray_sweep',contactStart:.1,contactEnd:.18}:JensenCombatData.growthDefaults(1).auto;
      const checked=JensenCombatData.validatePatch(candidate,'auto',{});if(!checked.ok)return checked;
      labConfig=checked.value;combatConfig=labConfig;
    }
    tray=value;return {ok:true};
  }
  const labAPI=Object.freeze({
    config:labSnapshot,reset:labReset,spawn:labSpawn,patch:labPatch,cancelInput:()=>clearInput(),immortal:labSetImmortal,
    staticAI:value=>{labStatic=!!value;clearInput();},
    clear:()=>{clearInput();damageLog=[];swingTrails=[];G.enemies=[];hazards=[];reservations.clear();incomingSeen.clear();rootRecords.clear();combatState.evaluated.clear();networkFX=[];},
    tray:value=>{const result=setTray(value);if(result.ok)clearInput();return result;},
    inspect:()=>({stage:level,hp:G.hero.hp,maxHp:G.hero.maxHp,count:G.enemies.filter(e=>!e.dead).length,immortal:labImmortal,staticAI:labStatic,tray,phase,portrait,paused:G.paused,latestDamage:damageLog.at(-1)?copy(damageLog.at(-1)):null,latestDirect:copy(damageLog.findLast(hit=>hit.source!=='cuda')||null),latestCuda:copy(damageLog.findLast(hit=>hit.source==='cuda')||null)})
  });
  function home(){if(!busy)start();}
  function mount(){
    document.body.classList.add('r7');$('game').tabIndex=0;
    $('r7Skip').textContent='跳过';$('r7Previous').textContent='上一镜';$('btnResume').textContent='继续';$('btnRestartP').textContent='重试本关';$('r7Replay').textContent='重看创始故事';
    for(const type of ['blur','pagehide'])addEventListener(type,cancelStoryGesture);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelStoryGesture();});document.addEventListener('freeze',cancelStoryGesture);
    const surface=$('r7Next');surface.addEventListener('pointerdown',storyDown);
    surface.addEventListener('pointermove',e=>{if(storyPointer?.id===e.pointerId&&Math.hypot(e.clientX-storyPointer.x,e.clientY-storyPointer.y)>12)storyPointer=null;});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])surface.addEventListener(type,storyEnd);
    surface.addEventListener('click',e=>{e.preventDefault();if(e.detail===0&&!e.sourceCapabilities?.firesTouchEvents)advanceStory();});
    for(const slot of [1,2]){const button=$('r14Skill'+slot);
      button.addEventListener('pointerdown',e=>{if(!live()||button.disabled||e.button>0)return;if(e.pointerType==='touch')mode('touch');e.preventDefault();if(activeFingers[slot]!==null)return;activeFingers[slot]=e.pointerId;try{button.setPointerCapture(e.pointerId);}catch(_){}requestActive(slot);});
      for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,e=>{if(activeFingers[slot]===e.pointerId)activeFingers[slot]=null;});
      button.addEventListener('click',e=>{if(e.detail===0&&!button.disabled)requestActive(slot);});
    }
    $('r9Pause').addEventListener('click',()=>pause(!G.paused));
    for(const id of ['r9Fullscreen','r9RotateFullscreen'])$(id).addEventListener('click',()=>fullscreen());
    $('game').addEventListener('pointerdown',command);
    addEventListener('resize',viewport);viewport();

    $('r7Retry').addEventListener('click',()=>{if(pending&&!busy)persist(pending.next,pending.after);});$('r7Reload').addEventListener('click',()=>start());
    $('r7Replay').addEventListener('click',()=>{if(!profile?.receipt||phase!=='combat')return;replay=true;phase='n01';shot=0;show('ovPause',false);showStory();});
    $('ovPause').addEventListener('keydown',e=>{if(e.key!=='Tab'||!G.paused||phase!=='combat')return;const buttons=[...$('ovPause').querySelectorAll('button,input,[tabindex]')].filter(b=>!b.disabled&&!b.hidden&&b.offsetParent!==null);const first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
    addEventListener('storage',e=>{if(!labMode&&e.key===R7Store.KEY&&phase!=='title'){clearInput();G.paused=true;phase='blocked';G.state='r7-blocked';overlay('Saved career changed','Another page changed this career. Reload to continue from the saved frontier.',['r7Reload']);}});
    $('r7Modal').addEventListener('keydown',e=>{if(e.key!=='Tab')return;const buttons=['r7Previous','r7Next','r7Skip','r7Retry','r7Reload'].map(id=>$(id)).filter(b=>!b.hidden&&!b.disabled);if(!buttons.length){e.preventDefault();$('r7Heading').focus();return;}const first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===$('r7Heading'))){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===$('r7Heading'))){e.preventDefault();first.focus();}});
    ui();
  }
  return Object.freeze({enabled:true,labMode,lab:labAPI,start,update,pause,key,ui,battleGesture:live,mode,touchPointer,touchReset,touchAttack,touchAim,touchEnd,drawHero,drawEnemy,drawImpact,foreground,ground,drawProp,home,mount,inspect:()=>({phase,level,clock,attempt,aim:aimGesture?{...aimGesture,angle:lastAim}:null,lastAim,releaseRequest:releaseRequest?copy(releaseRequest):null,damageLog:copy(damageLog),inputMode:Input.st.mode,activeState:combatState?JensenCombatActions.inspect(combatState):null,carrier:activeCarrier?copy(activeCarrier):null,network:copy(networkFX),reservations:[...reservations.entries()].map(([id,value])=>({id,...value})),targetId,destination:destination?copy(destination):null,route:copy(route),portrait,action:action?{...action,hits:[...action.hits]}:null,tray,pickups:copy(pickups),allies:copy(allies),offers:copy(offers),hazards:copy(hazards),profile:profile?copy(profile):null,receipt,contacts,lastError,busy}),retry:()=>pending&&!busy?persist(pending.next,pending.after):null});
})();
/* R7_RUNTIME_END */
