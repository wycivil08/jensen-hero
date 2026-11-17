/* R7_STORE_BEGIN */
const R7Store=(()=>{
  const KEY='jensen_r7_career_v1',REWARD='r7_l01_gpu_pair';
  const clone=x=>JSON.parse(JSON.stringify(x));
  const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
  function owned(gpu=false){return {equipment:{right:gpu?'gpu_gauntlet':null,left:gpu?'gpu_gauntlet':null},auto_attack:gpu?'gpu_fast':'bare_fists',slot_1:null,slot_2:null,buffs:[],max_hp:100,career_complete:false};}
  function validate(p){
    if(!p||p.version!==1||typeof p.careerId!=='string'||!/^[a-zA-Z0-9_-]{8,100}$/.test(p.careerId)||!Number.isSafeInteger(p.revision)||p.revision<0||![1,2].includes(p.frontier))throw Error('Unknown or invalid career record. Original data preserved.');
    const gpu=p.frontier===2,phases=gpu?['n01','onboarding','combat2']:['n00','combat1'];
    if(!phases.includes(p.phase)||!Number.isInteger(p.shot)||p.shot<0||p.shot>3||(!p.phase.startsWith('n0')&&p.shot!==0)||JSON.stringify(p.owned)!==JSON.stringify(owned(gpu)))throw Error('Career frontier or equipment mismatch. Original data preserved.');
    if(gpu){const r=p.receipt;if(!r||r.key!==p.careerId+':'+REWARD||r.rewardId!==REWARD||r.category!=='equipment'||!Number.isInteger(r.revision)||r.revision<1||r.revision>p.revision||JSON.stringify(r.ownedBefore)!==JSON.stringify(owned())||JSON.stringify(r.ownedAfter)!==JSON.stringify(owned(true)))throw Error('Invalid reward receipt. Original data preserved.');}
    else if(p.receipt!==null)throw Error('Unexpected reward before completion.');
    return p;
  }
  function create(careerId){return validate({version:1,careerId,revision:0,frontier:1,owned:owned(),receipt:null,phase:'n00',shot:0});}
  function reward(p){
    validate(p);if(p.receipt)return clone(p);
    const n=clone(p);n.revision++;n.frontier=2;n.owned=owned(true);n.phase='n01';n.shot=0;
    n.receipt={key:p.careerId+':'+REWARD,rewardId:REWARD,category:'equipment',revision:n.revision,ownedBefore:owned(),ownedAfter:owned(true)};return validate(n);
  }
  function connect(storage,withLock){
    let expectedRaw,base;
    function read(){const raw=storage.getItem(KEY);const parsed=raw===null?null:validate(JSON.parse(raw));expectedRaw=raw;base=parsed;return parsed?freeze(clone(parsed)):null;}
    async function save(next){
      validate(next);const target=JSON.stringify(next),expected=expectedRaw,previous=base;
      if(expected===undefined)throw Error('Read the existing record before writing.');
      if(previous&&(next.careerId!==previous.careerId||next.revision!==previous.revision+1||next.frontier<previous.frontier||next.frontier>previous.frontier+1))throw Error('Invalid or stale revision.');
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
  return Object.freeze({KEY,REWARD,owned,create,validate,reward,connect,clone,freeze});
})();
/* R7_STORE_END */
