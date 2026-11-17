'use strict';
const flush=()=>new Promise(setImmediate);
async function advance(r){r.step(.31);r.ids.get('r7Next').click();await flush();}
async function finish(r){for(let i=0;i<8&&['n00','n01','onboarding'].includes(r.api.R7.inspect().phase);i++)await advance(r);}
module.exports={advance,finish};
