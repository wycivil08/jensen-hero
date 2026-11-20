'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const S=vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../game/store.js'),'utf8')+'\nR7Store;');
const score={hp:2005,seatsDown:[5,2,1,3,4,6,7,8,9,10]},plain=x=>JSON.parse(JSON.stringify(x));
let checks=0;
async function check(name,fn){await fn();checks++;console.log('ok · '+name);}
function memory(raw){
  const m={raw:raw??null,writes:0,failure:'',reads:0};let tail=Promise.resolve();
  m.storage={getItem(key){assert.equal(key,S.KEY);m.reads++;if(m.failure==='read')throw Error('Read denied');if(m.failure==='ack'&&m.writes>m.failureAt)return null;return m.raw;},setItem(key,value){assert.equal(key,S.KEY);if(m.failure==='before')throw Error('Quota exceeded');m.raw=value;m.writes++;if(m.failure==='after')throw Error('Acknowledgement lost');}};
  m.lock=fn=>{const next=tail.then(()=>{if(m.failure==='lock')throw Error('Lock unavailable');return fn();});tail=next.catch(()=>{});return next;};
  m.open=()=>S.connect(m.storage,m.lock);return m;
}
async function seeded(){const m=memory(),store=m.open();assert.equal(store.read(),null);const profile=await store.save(S.create('journey_test_001'));return {m,store,profile};}
async function through(chapter){const env=await seeded();while(S.journeyChapter(env.profile)!==chapter){const current=S.journeyChapter(env.profile);env.profile=await env.store.save(S.journeyAdvance(env.profile,current,current==='seats'?score:undefined));}return env;}
(async()=>{
await check('fresh save and legacy phase updates retain the original key, equipment and reward',async()=>{
  const {m,store,profile}=await seeded();assert.equal(S.KEY,'jensen_r7_career_v1');assert.equal(S.journeyChapter(profile),'diner');assert.equal(S.journeyScore(profile),null);assert(Object.isFrozen(profile.owned));
  const story=S.clone(profile);story.phase='combat1';story.revision++;const combat=await store.save(story),gpu=await store.save(S.reward(combat));
  assert.equal(gpu.frontier,2);assert.equal(S.journeyChapter(gpu),'arcade');assert.equal(gpu.owned.slot_1,null);assert.equal(gpu.owned.slot_2,null);assert.equal(Object.hasOwn(gpu,'journey'),false);
  const old=S.clone(gpu);old.phase='combat2';old.revision++;await store.save(old);assert.deepEqual(plain(m.open().read().receipt),plain(gpu.receipt));
});
await check('every battle creates one durable checkpoint and repeated settlement returns the same profile',async()=>{
  const {m,store,profile:initial}=await seeded();let profile=initial;
  for(const chapter of ['diner','arcade','cuda','seats']){
    const prior=plain(profile),next=S.journeyAdvance(profile,chapter,chapter==='seats'?score:undefined);assert.deepEqual(plain(profile),prior);assert.equal(next.revision,profile.revision+1);
    profile=await store.save(next);const resumed=m.open().read();assert.equal(S.journeyChapter(resumed),['arcade','cuda','seats','ending'][['diner','arcade','cuda','seats'].indexOf(chapter)]);
    assert.strictEqual(S.journeyAdvance(profile,chapter,{hp:1,seatsDown:score.seatsDown}),profile);assert.equal(profile.journey?.receipts.length??0,Math.max(0,['diner','arcade','cuda','seats'].indexOf(chapter)));
  }
  assert.deepEqual(plain(S.journeyScore(profile)),score);assert(Object.isFrozen(S.journeyScore(profile).seatsDown));assert.strictEqual(S.journeyAdvance(profile,'ending'),profile);
  const later=S.clone(profile);later.phase='combat2';later.shot=0;later.revision++;const saved=await store.save(later);assert.deepEqual(plain(S.journeyScore(saved)),score);assert.equal(m.writes,6);
});
await check('old v1 records resume without conversion or writes; unknown and corrupt values remain byte exact',async()=>{
  for(const p of [S.create('old_career_001'),S.reward(S.create('old_career_002'))]){const raw=JSON.stringify(p),m=memory(raw);assert.equal(S.journeyChapter(m.open().read()),p.frontier===1?'diner':'arcade');assert.equal(m.raw,raw);assert.equal(m.writes,0);}
  for(const raw of ['{bad','null','{}',JSON.stringify({...S.create('old_career_003'),version:2}),JSON.stringify({...S.create('old_career_004'),journey:{future:true}}),JSON.stringify({...S.reward(S.create('old_career_005')),owned:S.owned()})]){
    const m=memory(raw),store=m.open();assert.throws(()=>store.read());await assert.rejects(store.save(S.create('new_career_001')),/Read the existing/);assert.equal(m.raw,raw);assert.equal(m.writes,0);
  }
});
await check('checkpoint jumps, stale revisions, reward rewrites and old 2D rollback attempts cannot write',async()=>{
  const {m,store,profile}=await through('seats'),raw=m.raw;
  assert.throws(()=>S.journeyAdvance(profile,'unknown'),/chapter/);assert.throws(()=>S.journeyAdvance(S.create('jump_test_001'),'cuda'),/transition/);
  const changes=[p=>{delete p.journey;},p=>{p.journey.receipts[0].revision++;},p=>{p.receipt.revision++;},p=>{p.revision--;},p=>{p.careerId='other_career_001';}];
  for(const change of changes){const next=S.clone(profile);next.revision++;change(next);await assert.rejects(store.save(next));assert.equal(m.raw,raw);}
  const next=S.clone(profile);next.revision++;next.phase='onboarding';const saved=await store.save(next);assert.equal(S.journeyChapter(saved),'seats');assert.deepEqual(plain(saved.journey),plain(profile.journey));
  const stale=S.journeyAdvance(saved,'seats',score);stale.revision=saved.revision;await assert.rejects(store.save(stale));
});
await check('ending needs an actual full ordered defeat result and its first saved score cannot change',async()=>{
  const {m,store,profile}=await through('seats');
  for(const bad of [null,{}, {...score,hp:0},{...score,hp:-.5},{...score,hp:3800.5},{...score,hp:NaN},{...score,hp:Infinity},{...score,hp:-Infinity},{...score,seatsDown:[1,2,3]},{...score,seatsDown:[1,1,2,3,4,5,6,7,8,9]},{...score,seatsDown:[0,1,2,3,4,5,6,7,8,9]},{...score,unverified:true}])assert.throws(()=>S.journeyAdvance(profile,'seats',bad),/result/);
  assert.equal(S.journeyScore(S.journeyAdvance(profile,'seats',{...score,hp:3800})).hp,3800);
  const input=plain({...score,hp:.5}),next=S.journeyAdvance(profile,'seats',input);input.seatsDown[0]=10;const ended=await store.save(next),raw=m.raw;assert.equal(S.journeyScore(m.open().read()).hp,.5);
  for(const change of [p=>{p.journey.score.hp=17;},p=>{p.journey.score.seatsDown.reverse();}]){const bad=S.clone(ended);bad.revision++;change(bad);await assert.rejects(store.save(bad),/cannot be changed/);assert.equal(m.raw,raw);}
});
await check('two tabs and same-tab queued conflicts cannot overwrite another checkpoint',async()=>{
  const {m,store,profile}=await seeded(),other=m.open(),old=other.read(),a=S.journeyAdvance(profile,'diner'),b=S.clone(a);b.phase='combat2';
  const results=await Promise.allSettled([store.save(a),other.save(b)]);assert.equal(results[0].status,'fulfilled');assert.equal(results[1].status,'rejected');assert.match(results[1].reason.message,/another page/);assert.equal(m.writes,2);
  await assert.rejects(other.save({...S.clone(old),revision:old.revision+1,shot:1}),/another page/);
  const winner=store.read(),first=S.journeyAdvance(winner,'arcade'),second=S.clone(first);second.phase='combat2';const queued=await Promise.allSettled([store.save(first),store.save(second)]);assert.equal(queued[0].status,'fulfilled');assert.equal(queued[1].status,'rejected');assert.equal(S.journeyChapter(m.open().read()),'cuda');
});
await check('quota, locks, denied reads and missing acknowledgement preserve recovery boundaries',async()=>{
  for(const failure of ['before','after','ack','lock']){
    const {m,store,profile}=await seeded(),old=m.raw,next=S.journeyAdvance(profile,'diner');m.failureAt=m.writes;m.failure=failure;
    await assert.rejects(store.save(next));assert.equal(m.raw,failure==='before'||failure==='lock'?old:JSON.stringify(next));const writes=m.writes;m.failure='';
    const saved=await store.save(next);assert.equal(S.journeyChapter(saved),'arcade');assert.equal(m.writes,writes+(failure==='before'||failure==='lock'?1:0));
  }
  const m=memory(),store=m.open();m.failure='read';assert.throws(()=>store.read(),/Read denied/);m.failure='';await assert.rejects(store.save(S.create('read_test_001')),/Read the existing/);assert.equal(m.writes,0);
});
await check('queued saves snapshot the proposed record before waiting for the lock',async()=>{
  const {m,profile}=await seeded();let release;const store=S.connect(m.storage,async fn=>{await new Promise(resolve=>{release=resolve;});return fn();});store.read();
  const next=S.journeyAdvance(profile,'diner'),saving=store.save(next);next.phase='combat2';release();const saved=await saving;assert.equal(saved.phase,'n01');assert.equal(m.open().read().phase,'n01');
});
console.log(checks+' journey save checks passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
