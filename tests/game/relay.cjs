'use strict';
// Real journey screens + store, with DOM and clipboard stubs; engine defeat order has its own native test.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),source=fs.readFileSync(root+'/combat/journey.js','utf8');
const S=vm.runInNewContext(fs.readFileSync(root+'/game/store.js','utf8')+'\nR7Store;');
const all=first=>[first,...Array.from({length:10},(_,i)=>i+1).filter(n=>n!==first)];
function element(){return {hidden:true,textContent:'',value:'',style:{},dataset:{},children:[],handlers:{},classList:{toggle(){},add(){}},firstElementChild:{setAttribute(k,v){this[k]=v;}},setAttribute(k,v){this[k]=v;},addEventListener(k,fn){this.handlers[k]=fn;},append(x){this.children.push(x);},replaceChildren(...children){this.children=children;},focus(){},select(){}};}
function setup(href,raw,session){
  const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);};
  let copied='',assigned='',replaced='',reads=0,writes=0,sessionReads=0,sessionWrites=0;
  const sessions=session||new Map();
  const sessionStorage={getItem(key){sessionReads++;return sessions.get(key)??null;},setItem(key,value){sessionWrites++;sessions.set(key,value);},removeItem(key){sessionWrites++;sessions.delete(key);}};
  const location=new URL(href);location.assign=url=>{assigned=url;};location.replace=url=>{replaced=url;location.href=url;};
  const localStorage={getItem(){reads++;if(raw===undefined)throw Error('Challenge touched career storage');return raw;},setItem(key,value){writes++;raw=value;}};
  const ctx={URL,URLSearchParams,location,localStorage,sessionStorage,document:{getElementById:node,createElement:element,body:element(),documentElement:{dataset:{publicCombat:'https://example.org/not-yet-published/'}},hasFocus:()=>false},navigator:{clipboard:{writeText:async text=>{copied=text;}},locks:{request:async(key,fn)=>fn()}},matchMedia:()=>({matches:false}),crypto:{randomUUID:()=> 'relay_career_001'},R7Store:S,window:{R24Data:{finale:{hp:3800,seats:Object.fromEntries(Array.from({length:10},(_,i)=>['seat_'+String(i+1).padStart(2,'0'),{label:'Seat '+(i+1)}]))}}}};
  node('journeyNewsSource').href='https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Board-Reinstates-Jensen-Huang/default.aspx';
  vm.runInNewContext(source,ctx);const api=ctx.window.JensenJourney;
  return {node,api,ctx,copy:async()=>{await node('journeyShare').handlers.click();return copied;},assigned:()=>assigned,replaced:()=>replaced,reads:()=>reads,writes:()=>writes,raw:()=>raw,sessions,sessionReads:()=>sessionReads,sessionWrites:()=>sessionWrites};
}
let checks=0;async function check(name,fn){await fn();checks++;console.log('ok · '+name);}
(async()=>{
await check('each earned opening makes a real relocatable v2 link from that won result',async()=>{
  for(let first=1;first<=10;first++){
    const env=setup('https://example.org/mounted/combat/index.html?mode=challenge&v=1#old');assert.equal(await env.api.open('challenge'),'seats');
    await env.api.finish({won:true,hp:.5,seatsDown:all(first)});
    const text=await env.copy(),url=new URL(text.split('\n').at(-1));
    assert.equal(url.origin,'https://example.org');assert.equal(url.pathname,'/mounted/combat/index.html');assert.equal(url.search,'?mode=challenge&v=2&first='+first);assert.equal(url.hash,'');
    assert.match(text,/I cleared all ten/);assert.equal(env.node('journeyShare').textContent,'Copy relay');assert.equal(env.reads(),0);assert.equal(env.writes(),0);
    const recipient=setup(url.href);assert.equal(await recipient.api.open('challenge'),'seats');assert.match(recipient.node('journeyStory').textContent,new RegExp('Seat '+first+' ·'));
  }
});
await check('recipient HUD updates from actual first defeat, success differs from same-seat solo clear and loss',async()=>{
  for(const [won,first,title] of [[true,6,'Relay complete'],[true,5,'Solo clear · relay incomplete'],[false,6,'Relay incomplete · fight lost'],[false,null,'Relay incomplete · fight lost']]){
    const env=setup('https://example.org/combat/?mode=challenge&v=2&first=5');await env.api.open('challenge');let starts=0,retries=0;env.api.ready(()=>starts++,()=>retries++);env.node('journeyAction').onclick({});
    assert.equal(starts,1);assert.equal(env.node('journeyRelay').hidden,false);assert.match(env.node('journeyRelay').textContent,/other than Seat 5 · long rifle/);
    if(first){env.api.firstDown(first);assert.match(env.node('journeyRelay').textContent,first===5?/Same opening/:/Different opening achieved/);}
    await env.api.finish({won,hp:won?2005:0,seatsDown:won?all(first):first?[first]:[]});
    assert.equal(env.node('journeyTitle').textContent,title);assert.equal(env.node('journeyPair').dataset.lit,String(title==='Relay complete'));assert.equal(env.node('journeyRelay').hidden,true);assert.equal(env.node('journeyPair').hidden,false);assert.match(env.node('journeySender').textContent,/Seat 5 · long rifle/);
    assert.equal(env.node('journeyOwnWeapon').style.display,first ? '' : 'none');assert.equal(env.node('journeyShare').hidden,!won);
    if(first&&first!==5)assert.notEqual(env.node('journeySenderWeapon').firstElementChild.d,env.node('journeyOwnWeapon').firstElementChild.d);
    if(won){const next=new URL((await env.copy()).split('\n').at(-1));assert.equal(next.searchParams.get('first'),String(first));}
    env.node('journeyAction').onclick({});assert.equal(retries,1);assert.match(env.node('journeyRelay').textContent,/other than Seat 5/);assert.equal(env.reads(),0);assert.equal(env.writes(),0);
  }
});
await check('v1 generic replay stays separate, loss never earns a relay and invalid full results cannot offer one',async()=>{
  for(const result of [{won:false,hp:0,seatsDown:[5]},{won:false,hp:0,seatsDown:[]},{won:true,hp:100,seatsDown:[5]},{won:true,hp:0,seatsDown:all(5)},{won:true,hp:Infinity,seatsDown:all(5)},{won:true,hp:100,seatsDown:[5,5,2,3,4,6,7,8,9,10]}]){
    const env=setup('https://example.org/combat/?mode=challenge&v=1');assert.equal(await env.api.open('challenge'),'seats');assert.match(await env.copy(),/\?mode=challenge&v=1$/);assert.equal(env.node('journeyPair').hidden,true);
    await env.api.finish(result);assert.equal(env.node('journeyShare').hidden,true);assert.equal(env.reads(),0);assert.equal(env.writes(),0);
  }
});
await check('malformed, duplicate, extra and unsupported parameters decline without engine boot or storage',async()=>{
  const invalid=['mode=challenge','mode=challenge&v=4','mode=challenge&v=3&first=00','mode=challenge&v=3&first=5&first=6','mode=challenge&v=2','mode=challenge&v=2&first=0','mode=challenge&v=2&first=11','mode=challenge&v=2&first=01','mode=challenge&v=2&first=1.0','mode=challenge&v=2&first=1%20','mode=challenge&v=2&first=NaN','mode=challenge&v=2&first=%3Cscript%3E','mode=challenge&v=1&first=5','mode=challenge&v=2&first=5&first=6','mode=challenge&v=2&first=5&v=2','mode=challenge&mode=story&v=2&first=5','mode=story&mode=challenge&v=2&first=5','mode=challenge&v=2&first=5&hp=3800'];
  for(const query of invalid){const env=setup('https://example.org/combat/?'+query);assert.equal(await env.api.open(query.startsWith('mode=story')?'story':'challenge'),null);assert.equal(env.node('journeyTitle').textContent,'Invalid invitation');assert.equal(env.node('journeyShare').hidden,true);env.node('journeyAction').onclick();assert.equal(new URL(env.assigned()).search,'?mode=challenge&v=3');assert.equal(env.reads(),0);assert.equal(env.writes(),0);}
});
await check('offline copy contains portable code only; import accepts exact codes and same-device replay works',async()=>{
  const env=setup('file:///private/offline/story.html?mode=challenge&v=1');await env.api.open('challenge');assert.equal(env.node('journeyImport').hidden,false);
  assert.match(await env.copy(),/^JH1\n/);await env.api.finish({won:true,hp:2005,seatsDown:all(10)});const text=await env.copy();assert.match(text,/\nJH2:10\n/);assert.doesNotMatch(text,/file:|private\/|https:/);
  const importer=setup('file:///different/device/story.html?mode=challenge&v=1');await importer.api.open('challenge');
  for(const code of ['JH2:0','JH2:11','JH2:01','JH2:1&first=2','JH4:5','JH3:05','file:///private/story.html','JH2:5\nJH2:6']){importer.node('journeyCode').value=code;importer.node('journeyImport').handlers.submit({preventDefault(){}});assert.equal(importer.assigned(),'');assert.match(importer.node('journeyNotice').textContent,/Unknown challenge code/);}
  for(const [code,query] of [['JH3','?mode=challenge&v=3'],['JH3:5','?mode=challenge&v=3&first=5'],['JH1','?mode=challenge&v=1'],['JH2:1','?mode=challenge&v=2&first=1'],['JH2:10','?mode=challenge&v=2&first=10']]){importer.node('journeyCode').value=code;importer.node('journeyImport').handlers.submit({preventDefault(){}});assert.equal(importer.assigned(),'file:///different/device/story.html'+query);}
  const denied=setup('file:///offline/story.html?mode=challenge&v=2&first=5');await denied.api.open('challenge');denied.ctx.navigator.clipboard.writeText=async()=>{throw Error('denied');};await denied.copy();assert.equal(denied.node('journeyManual').hidden,false);assert.match(denied.node('journeyText').value,/JH2:5/);assert.doesNotMatch(denied.node('journeyText').value,/file:|https:/);
});
await check('edition 3 report uses actual first and last defeats and keeps the portable invitation tied to the sender',async()=>{
  const order=[7,4,1,9,3,8,10,5,2,6];
  for (const base of ['file:///portable/story.html','https://example.org/mounted/story.html']) {
    const env=setup(base+'?mode=challenge&v=3&first=9');
    await env.api.open('challenge');
    env.node('journeyScoutSeat').value='5';
    env.node('journeyScoutSeat').handlers.change();
    const before=await env.copy();
    assert.doesNotMatch(before,/860|Seat 7|Seat 6/);
    await env.api.finish({won:true,hp:860.5,seatsDown:order});
    const payload=await env.copy();
    assert.equal(env.node('reportMessage').textContent,payload);
    assert.equal(env.node('reportFirst').textContent,'Seat 7');
    assert.equal(env.node('reportLast').textContent,'Seat 6');
    assert.equal(env.node('reportDare').textContent,'Can you take Seat 6 first?');
    assert.match(payload,/Can you take Seat 6 first\? Clear all ten with any opener except Seat 7/);
    assert.equal(env.node('reportHP').textContent,'860.5 / 3,800');
    assert.equal(env.node('journeyReport').hidden,false);assert.equal(env.node('journeyTab').open,true);
    assert.match(payload,/Seat 7\b/);
    assert.match(payload,/Seat 6\b/);
    assert.match(payload,/860\.5/);
    if (base.startsWith('file')) {
      assert.match(payload,/\bJH3:7\b/);
      assert.doesNotMatch(payload,/file:\/\/|JH3:[59]\b/);
    } else {
      const link=new URL(payload.split('\n').at(-1));
      assert.equal(link.search,'?mode=challenge&v=3&first=7');
    }
    assert.equal(env.reads(),0);
    assert.equal(env.writes(),0);
  }
});
await check('a delayed clipboard denial cannot reopen an old battle report after retry',async()=>{
  const env=setup('file:///story.html?mode=challenge&v=3&first=9');
  await env.api.open('challenge');
  env.api.ready(()=>{},()=>{});
  await env.api.finish({won:true,hp:860.5,seatsDown:all(7)});
  let rejectCopy;
  env.ctx.navigator.clipboard.writeText=()=>new Promise((_,reject)=>{rejectCopy=reject;});
  const copying=env.copy();
  env.node('journeyAction').onclick({});
  await env.api.finish({won:false,hp:0,seatsDown:[]});
  rejectCopy(Error('denied'));
  await copying;
  assert.equal(env.node('journeyManual').hidden,true);
  assert.equal(env.node('journeyNotice').textContent,'');
  assert.equal(env.node('journeyShare').hidden,true);
});
await check('survivor editions stay paired from entry through replay, share and resumed story ending',async()=>{
  for(const scheme of ['https://example.org/combat/','file:///story.html']){
    for(const suffix of ['','&first=4']){
      const env=setup(scheme+'?mode=challenge&v=3'+suffix);assert.equal(await env.api.open('challenge'),'seats');
      assert.equal(env.api.survivorEdition(),true);await env.api.finish({won:true,hp:900,seatsDown:all(1)});
      assert.match(await env.copy(),scheme.startsWith('file')?/JH3:1/:/v=3&first=1/);assert.equal(env.writes(),0);
    }
  }
  let profile=S.create('survivor_ending_001');for(const chapter of ['diner','arcade','cuda'])profile=S.journeyAdvance(profile,chapter);
  const env=setup('https://example.org/combat/?mode=story',JSON.stringify(profile));await env.api.open('story');
  await env.api.finish({won:true,hp:1500,seatsDown:all(6)});assert.equal(JSON.parse(env.raw()).journey.edition,3);
  const restored=setup('https://example.org/combat/?mode=story',env.raw());await restored.api.open('story');
  assert.match(await restored.copy(),/v=3&first=6/);assert.equal(restored.writes(),0);
});
await check('saved older ending remains read-only and can seed relay from its preserved first result',async()=>{
  let profile=S.create('legacy_ending_001');for(const chapter of ['diner','arcade','cuda','seats'])profile=S.journeyAdvance(profile,chapter,chapter==='seats'?{hp:2005,seatsDown:all(9)}:undefined);
  const raw=JSON.stringify(profile),env=setup('file:///offline/story.html?mode=story',raw);assert.equal(await env.api.open('story'),null);assert.equal(env.node('journeyTitle').textContent,'The last booth');assert.equal(env.raw(),raw);assert.equal(env.writes(),0);assert.equal(env.node('journeyImport').hidden,false);assert.match(await env.copy(),/JH2:9/);assert.equal(new URL(env.node('journeyOther').href).search,'?mode=challenge&v=2&first=9');env.node('journeyAction').onclick();assert.equal(new URL(env.assigned()).search,'?mode=story&encounter=reflection');
});
await check('edition 3 booth napkin scouts ten rivals without awarding an opening',async()=>{
  for(let sender=1;sender<=10;sender++){
    const env=setup('file:///story.html?mode=challenge&v=3&first='+sender);
    assert.equal(await env.api.open('challenge'),'seats');
    assert.equal(env.node('journeyTitle').textContent,'Seat '+sender+' fell first.');
    assert.equal(env.node('journeyScout').hidden,false);
    const select=env.node('journeyScoutSeat');
    assert.equal(select.children.length,10);
    assert.notEqual(select.value,String(sender));
    for(const option of select.children){
      select.value=option.value;select.handlers.change();
      const tip=env.node('journeyScoutTip').textContent;
      assert(tip.length>20);
      assert.equal(tip.startsWith('Your friend opened here.'),Number(option.value)===sender);
    }
    let starts=0;env.api.ready(()=>starts++,()=>{});env.node('journeyAction').onclick({});
    assert.equal(starts,1);assert.equal(env.node('journeyScore').hidden,true);
    assert.doesNotMatch(await env.copy(),/I cleared all ten/);
    await env.api.finish({won:false,hp:0,seatsDown:[]});
    assert.equal(env.node('journeyScout').hidden,true);assert.equal(env.node('journeyShare').hidden,true);
    assert.equal(env.reads(),0);assert.equal(env.writes(),0);
  }
  for(const query of ['v=1','v=2&first=9','v=3','v=3&first=0']){
    const env=setup('file:///story.html?mode=challenge&'+query);
    await env.api.open('challenge');assert.equal(env.node('journeyScout').hidden,true);
  }
});
await check('CUDA chapter names the targeting gesture on mouse and touch',async()=>{
  let profile=S.create('cuda_intro_gestures');
  for(const chapter of ['diner','arcade'])profile=S.journeyAdvance(profile,chapter);
  for(const touch of [false,true]){
    const env=setup('file:///story.html',JSON.stringify(profile));
    env.ctx.matchMedia=()=>({matches:touch});
    assert.equal(await env.api.open('story'),'cuda');
    const gesture=touch?'tap':'click';
    assert.match(env.node('journeyControls').textContent,new RegExp(gesture+' a ringed rival.*'+gesture+' another ringed rival','i'));
  }
});
await check('portable import stays reachable on every resumed offline chapter and save error',async()=>{
  let profile=S.create('resume_relay_001');
  for(const chapter of ['diner','arcade','cuda','seats']){
    const env=setup('file:///offline/story.html',JSON.stringify(profile));assert.equal(await env.api.open('story'),chapter);assert.equal(env.node('journeyImport').hidden,false);assert.equal(env.writes(),0);
    profile=S.journeyAdvance(profile,chapter,chapter==='seats'?{hp:100,seatsDown:all(1)}:undefined);
  }
  const broken=setup('file:///offline/story.html','{bad');assert.equal(await broken.api.open('story'),null);assert.equal(broken.node('journeyImport').hidden,false);assert.equal(broken.writes(),0);
});
function career(chapter='ending',edition=3){
  let p=S.create('reflection_career_001');
  for(const step of ['diner','arcade','cuda','seats']){if(S.journeyChapter(p)===chapter)break;p=S.journeyAdvance(p,step,step==='seats'?{hp:1234,seatsDown:all(7)}:undefined,edition);}
  return JSON.stringify(p);
}
await check('practice uses a labelled leap demonstration with zero career or session access through loss, retry and win',async()=>{
  const env=setup('https://example.org/combat/?mode=reflection');
  env.ctx.sessionStorage=new Proxy({}, {get(){throw Error('Practice touched session storage');}});
  assert.equal(await env.api.open('reflection'),'reflection');assert.equal(env.api.reflectionMove(),'leap');assert.equal(env.api.survivorEdition(),true);
  assert.match(env.node('journeyPlace').textContent,/Leap demonstration/);
  let starts=0,retries=0;env.api.ready(()=>starts++,()=>retries++);env.node('journeyAction').onclick({});assert.equal(starts,1);
  await env.api.finish({won:false});env.node('journeyAction').onclick({});assert.equal(retries,1);
  await env.api.finish({won:true,reflection:{counters:2}});assert.equal(env.node('journeyPanel').dataset.art,'coffee');assert.match(env.node('journeyTitle').textContent,/I left you a seat/);
  assert.equal(env.reads(),0);assert.equal(env.writes(),0);assert.equal(env.sessionReads(),0);assert.equal(env.sessionWrites(),0);
  const offline=setup('file:///offline/the-reflection.html');offline.ctx.document.documentElement.dataset.mode='reflection';assert.equal(await offline.api.open('reflection'),'reflection');assert.equal(offline.reads(),0);
  for(const query of ['mode=reflection&mode=story','mode=reflection&v=3']){const bad=setup('https://example.org/?'+query);assert.equal(await bad.api.open('reflection'),null);assert.equal(bad.reads(),0);assert.equal(bad.sessionReads(),0);}
});
await check('story reflection route requires an already earned ending and never shortcuts a chapter',async()=>{
  for(const chapter of ['diner','arcade','cuda','seats']){
    const env=setup('https://example.org/combat/?mode=story&encounter=reflection',career(chapter));
    assert.equal(await env.api.open('story'),chapter);assert.equal(env.api.reflectionMove(),'hammer');assert.equal(env.writes(),0);assert.equal(env.sessionReads(),0);
    if(chapter==='seats')assert.match(env.node('journeyStory').textContent,/November 12, 2026.*resignation.*imagined/s);
  }
  for(const edition of [2,3]){
    const env=setup('https://example.org/combat/?mode=story&encounter=reflection',career('ending',edition));
    assert.equal(await env.api.open('story'),'reflection');assert.equal(env.node('journeyTab').open,false);assert.equal(env.api.reflectionMove(),'hammer');assert.match(env.node('journeyStory').textContent,/hammer demonstration/);assert.equal(env.writes(),0);assert.equal(env.node('journeyShare').hidden,false);
  }
});
await check('dated board news follows a safe Ten Seats write and transfers only its actual same-run signature once',async()=>{
  for(const move of ['leap','cyclone',null,'fake']){
    const env=setup('https://example.org/combat/?mode=story',career('seats'));
    assert.equal(await env.api.open('story'),'seats');
    await env.api.finish({won:true,hp:1234,seatsDown:all(7),lastMove:move});
    assert.equal(JSON.parse(env.raw()).journey.chapter,'ending');assert.equal(env.node('journeyPanel').dataset.art,'return');assert.equal(env.node('journeyTab').open,false);
    assert.match(env.node('journeyPlace').textContent,/November 23, 2026/);assert.match(env.node('journeyStory').textContent,/board had reinstated.*president, CEO and director.*November 22/s);
    assert.equal(env.node('journeyNewsSource').hidden,false);assert.match(env.node('journeyNewsSource').href,/NVIDIA-Board-Reinstates/);
    assert.match(await env.copy(),/I left you a seat/);assert.equal(env.sessionWrites(),0);
    const saved=env.raw();assert.deepEqual(Object.keys(JSON.parse(saved).journey.score).sort(),['hp','seatsDown']);
    env.node('journeyOther').onclick({preventDefault(){}});assert.equal(env.node('journeyTitle').textContent,'The last booth');
    env.node('journeyAction').onclick();
    const resumed=setup(env.assigned(),saved,env.sessions);assert.equal(await resumed.api.open('story'),'reflection');assert.equal(resumed.api.reflectionMove(),['leap','cyclone'].includes(move)?move:'hammer');
    if(move==='cyclone')assert.match(resumed.node('journeyStory').textContent,/your last Cyclone Guard from the Ten Seats/);
    const cold=setup(env.assigned(),saved,env.sessions);await cold.api.open('story');assert.equal(cold.api.reflectionMove(),'hammer');
    assert.equal(resumed.writes(),0);
    env.node('journeyAction').onclick();const back=setup(env.assigned(),saved,env.sessions);await back.api.open('story');assert.equal(back.api.reflectionMove(),'hammer');
  }
});
await check('missing, denied and wrong-revision signature storage honestly falls back to the hammer demonstration',async()=>{
  const raw=career(),p=JSON.parse(raw),sessions=new Map([['jensen_reflection_once:'+p.careerId+':'+(p.revision-1),'leap']]);
  const wrong=setup('https://example.org/?mode=story&encounter=reflection',raw,sessions);await wrong.api.open('story');assert.equal(wrong.api.reflectionMove(),'hammer');
  const denied=setup('https://example.org/?mode=story&encounter=reflection',raw);denied.ctx.sessionStorage={getItem(){throw Error('denied');}};await denied.api.open('story');assert.equal(denied.api.reflectionMove(),'hammer');
});
await check('reflection loss and malformed victory cannot write; verified victory preserves the original receipt and survives reload',async()=>{
  const raw=career(),env=setup('https://example.org/?mode=story&encounter=reflection',raw);await env.api.open('story');env.api.ready(()=>{},()=>{});
  for(const result of [{won:false},{won:true},{won:true,reflection:{counters:1}},{won:true,reflection:{counters:'2'}}]){await env.api.finish(result);assert.equal(env.writes(),0);assert.equal(env.raw(),raw);}
  await env.api.finish({won:true,reflection:{counters:2}});
  const saved=JSON.parse(env.raw());assert.equal(saved.journey.reflection.proof.counters,2);assert.deepEqual(saved.journey.score,JSON.parse(raw).journey.score);assert.deepEqual(saved.journey.receipts,JSON.parse(raw).journey.receipts);assert.equal(env.writes(),1);
  assert.equal(env.node('journeyPanel').dataset.art,'coffee');assert.equal(env.node('journeyTab').open,false);assert.match(env.node('journeyStory').textContent,/coffee.*empty seat/s);assert.match(await env.copy(),/v=3&first=7/);
  await env.api.finish({won:true,reflection:{counters:2}});assert.equal(env.writes(),1);
  assert.equal(new URL(env.replaced()).search,'?mode=story');const cold=setup(env.replaced(),env.raw());assert.equal(await cold.api.open('story'),null);assert.equal(cold.node('journeyPanel').dataset.art,'coffee');assert.equal(cold.writes(),0);
});
await check('a failed Ten Seats save cannot show reinstatement news or offer the earned reflection entry',async()=>{
  const env=setup('https://example.org/?mode=story',career('seats'));await env.api.open('story');env.ctx.localStorage.setItem=()=>{throw Error('Quota exceeded');};
  await env.api.finish({won:true,hp:1234,seatsDown:all(7),lastMove:'leap'});
  assert.equal(env.node('journeyTitle').textContent,'Checkpoint paused');assert.equal(env.node('journeyNewsSource').hidden,true);assert.equal(env.sessions.size,0);
});
await check('stale reflection retries cannot overwrite another ending and denied transfers remain neutral',async()=>{
  const raw=career(),env=setup('https://example.org/?mode=story&encounter=reflection',raw);await env.api.open('story');env.api.ready(()=>{},()=>{});
  const newer=S.clone(JSON.parse(raw));newer.revision++;newer.phase='combat2';const external=JSON.stringify(newer);
  env.ctx.localStorage.getItem=()=>external;
  await env.api.finish({won:true,reflection:{counters:2}});assert.equal(env.node('journeyTitle').textContent,'Checkpoint paused');assert.equal(env.writes(),0);
  await env.node('journeyAction').onclick();assert.equal(env.writes(),0);assert.equal(env.node('journeyTitle').textContent,'Checkpoint paused');
  const fresh=setup('https://example.org/?mode=story',career('seats'));await fresh.api.open('story');await fresh.api.finish({won:true,hp:1234,seatsDown:all(7),lastMove:'cyclone'});
  fresh.ctx.sessionStorage={removeItem(){throw Error('denied');}};fresh.node('journeyAction').onclick();
  const loaded=setup(fresh.assigned(),fresh.raw());await loaded.api.open('story');assert.equal(loaded.api.reflectionMove(),'hammer');
});
await check('acknowledged story reflection wins replace the encounter endpoint with the saved booth on HTTPS and file routes',async()=>{
  for(const base of ['https://example.org/mounted/combat/index.html','file:///offline/story.html']){
    const raw=career(),env=setup(base+'?mode=story&encounter=reflection',raw);await env.api.open('story');
    // Reloading an unfinished duel still opens its honest neutral demonstration.
    const before=setup(env.ctx.location.href,raw);assert.equal(await before.api.open('story'),'reflection');assert.equal(before.api.reflectionMove(),'hammer');
    env.api.ready(()=>{},()=>{});await env.api.finish({won:true,reflection:{counters:2}});
    assert.equal(env.replaced(),base+'?mode=story');assert.equal(env.writes(),1);
    const saved=env.raw(),reload=setup(env.replaced(),saved);assert.equal(await reload.api.open('story'),null);assert.equal(reload.node('journeyPanel').dataset.art,'coffee');assert.equal(reload.writes(),0);
    const replay=setup(base+'?mode=story&encounter=reflection',saved);assert.equal(await replay.api.open('story'),'reflection');replay.api.ready(()=>{},()=>{});await replay.api.finish({won:true,reflection:{counters:2}});
    assert.equal(replay.replaced(),base+'?mode=story');assert.equal(replay.writes(),0);assert.equal(replay.raw(),saved);
  }
  const practice=setup('https://example.org/combat/?mode=reflection');await practice.api.open('reflection');practice.api.ready(()=>{},()=>{});await practice.api.finish({won:true,reflection:{counters:2}});assert.equal(practice.replaced(),'');
  const failed=setup('https://example.org/combat/?mode=story&encounter=reflection',career());await failed.api.open('story');failed.ctx.localStorage.setItem=()=>{throw Error('Quota exceeded');};await failed.api.finish({won:true,reflection:{counters:2}});assert.equal(failed.replaced(),'');assert.equal(failed.node('journeyTitle').textContent,'Checkpoint paused');
});
const html=fs.readFileSync(root+'/combat/index.html','utf8'),css=fs.readFileSync(root+'/combat/journey.css','utf8');
for(const id of ['journeyRelay','journeySenderWeapon','journeyOwnWeapon','journeyImport','journeyCode','cudaLesson'])assert(html.includes('id="'+id+'"'));
assert.match(css,/\.relaySender\{color:#edbd7d\}/);assert.match(css,/\.relayOwn\{color:#8acbff\}/);
console.log(checks+' relay checks passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
