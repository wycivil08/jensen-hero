/* R7_STORE_BEGIN */
const R7Store=(()=>{
  const KEY='jensen_r7_career_v1',REWARD='r7_l01_gpu_pair';
  const CHAPTERS=['diner','arcade','cuda','seats','ending'];
  const JOURNEY_REWARDS=[['r10_arcade_cuda','passive'],['r10_cuda_hammer_shield','equipment'],['r10_seats_ending','completion']];
  const clone=x=>JSON.parse(JSON.stringify(x));
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
  function owned(gpu=false){return {equipment:{right:gpu?'gpu_gauntlet':null,left:gpu?'gpu_gauntlet':null},auto_attack:gpu?'gpu_fast':'bare_fists',slot_1:null,slot_2:null,buffs:[],max_hp:100,career_complete:false};}
  function validScore(s){return !!s&&Number.isFinite(s.hp)&&s.hp>0&&s.hp<=3800&&Array.isArray(s.seatsDown)&&s.seatsDown.length===10&&s.seatsDown.every(n=>Number.isInteger(n)&&n>=1&&n<=10)&&new Set(s.seatsDown).size===10&&same(Object.keys(s).sort(),['hp','seatsDown']);}
  function journeyReceipt(p,index,revision){const [rewardId,category]=JOURNEY_REWARDS[index];return {key:p.careerId+':'+rewardId,rewardId,category,revision};}
  const chapterOf=p=>p.journey?.chapter||(p.frontier===1?'diner':'arcade');
  function validate(p){
    if(!p||p.version!==1||typeof p.careerId!=='string'||!/^[a-zA-Z0-9_-]{8,100}$/.test(p.careerId)||!Number.isSafeInteger(p.revision)||p.revision<0||![1,2].includes(p.frontier))throw Error('Unknown or invalid career record. Original data preserved.');
    const gpu=p.frontier===2,phases=gpu?['n01','onboarding','combat2']:['n00','combat1'];
    if(!phases.includes(p.phase)||!Number.isInteger(p.shot)||p.shot<0||p.shot>3||(!p.phase.startsWith('n0')&&p.shot!==0)||!same(p.owned,owned(gpu)))throw Error('Career frontier or equipment mismatch. Original data preserved.');
    if(gpu){const r=p.receipt;if(!r||r.key!==p.careerId+':'+REWARD||r.rewardId!==REWARD||r.category!=='equipment'||!Number.isInteger(r.revision)||r.revision<1||r.revision>p.revision||!same(r.ownedBefore,owned())||!same(r.ownedAfter,owned(true)))throw Error('Invalid reward receipt. Original data preserved.');}
    else if(p.receipt!==null)throw Error('Unexpected reward before completion.');
    if(Object.hasOwn(p,'journey')){
      const j=p.journey,index=CHAPTERS.indexOf(j?.chapter),count=index-1;
      if(!gpu||index<2||!same(Object.keys(j).sort(),['chapter','receipts','score'])||!Array.isArray(j.receipts)||j.receipts.length!==count)throw Error('Invalid journey checkpoint. Original data preserved.');
      let revision=p.receipt.revision;
      for(let i=0;i<count;i++){const r=j.receipts[i];if(!r||!Number.isSafeInteger(r.revision)||r.revision<=revision||r.revision>p.revision||!same(r,journeyReceipt(p,i,r.revision)))throw Error('Invalid journey reward receipt. Original data preserved.');revision=r.revision;}
      if(index===4?!validScore(j.score):j.score!==null)throw Error('Invalid journey result. Original data preserved.');
    }
    return p;
  }
  function create(careerId){return validate({version:1,careerId,revision:0,frontier:1,owned:owned(),receipt:null,phase:'n00',shot:0});}
  function reward(p){
    validate(p);if(p.receipt)return clone(p);
    const n=clone(p);n.revision++;n.frontier=2;n.owned=owned(true);n.phase='n01';n.shot=0;
    n.receipt={key:p.careerId+':'+REWARD,rewardId:REWARD,category:'equipment',revision:n.revision,ownedBefore:owned(),ownedAfter:owned(true)};return validate(n);
  }
  function journeyChapter(p){validate(p);return chapterOf(p);}
  function journeyScore(p){validate(p);return p.journey?.score?freeze(clone(p.journey.score)):null;}
  function journeyAdvance(p,chapter,score){
    validate(p);const index=CHAPTERS.indexOf(chapter),current=CHAPTERS.indexOf(chapterOf(p));
    if(index<0||index>current)throw Error('Invalid journey chapter transition.');
    if(index<current||chapter==='ending')return p;
    if(chapter==='diner')return reward(p);
    if(chapter==='seats'&&!validScore(score))throw Error('A completed Ten Seats result is required.');
    const n=clone(p);n.revision++;n.journey={chapter:CHAPTERS[index+1],receipts:[...(n.journey?.receipts||[]),journeyReceipt(n,index-1,n.revision)],score:chapter==='seats'?clone(score):null};
    return validate(n);
  }
  function connect(storage,withLock){
    let expectedRaw,base;
    function read(){const raw=storage.getItem(KEY);const parsed=raw===null?null:validate(JSON.parse(raw));expectedRaw=raw;base=parsed;return parsed?freeze(clone(parsed)):null;}
    async function save(next){
      next=clone(validate(next));const target=JSON.stringify(next),expected=expectedRaw,previous=base;
      if(expected===undefined)throw Error('Read the existing record before writing.');
      if(previous){
        const before=CHAPTERS.indexOf(chapterOf(previous)),after=CHAPTERS.indexOf(chapterOf(next));
        if(next.careerId!==previous.careerId||next.revision!==previous.revision+1||next.frontier<previous.frontier||next.frontier>previous.frontier+1||after<before||after>before+1)throw Error('Invalid or stale revision.');
        if(previous.receipt&&!same(next.receipt,previous.receipt))throw Error('Saved equipment reward cannot be changed.');
        if(previous.journey){
          const j=previous.journey,n=next.journey;
          if(!n||!same(n.receipts.slice(0,j.receipts.length),j.receipts)||j.score&&!same(n.score,j.score))throw Error('Saved journey rewards or result cannot be changed.');
        }
        if(after>before){const r=next.journey?.receipts.at(-1)||next.receipt;if(r.revision!==next.revision)throw Error('New reward must belong to this revision.');}
      }
      if(!previous&&next.revision!==0)throw Error('New career must start at revision zero.');
      return withLock(async()=>{
        const current=storage.getItem(KEY);
        // A prior write may have succeeded even though its acknowledgement failed.
        if(current!==target){
          if(current!==expected)throw Error('Save changed in another page. Reload the saved career; this page cannot overwrite it.');
          storage.setItem(KEY,target);
          if(storage.getItem(KEY)!==target)throw Error('Save acknowledgement unavailable.');
        }
        expectedRaw=target;base=clone(next);return freeze(clone(next));
      });
    }
    return {read,save};
  }
  return Object.freeze({KEY,REWARD,owned,create,validate,reward,journeyChapter,journeyAdvance,journeyScore,connect,clone,freeze});
})();
/* R7_STORE_END */
