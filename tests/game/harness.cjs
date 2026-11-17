'use strict';
const vm=require('node:vm');
function makeRuntime(html,{seed=9031,storage,locks,width=1280,height=800,coarse=false,search='?debug=1'}={}){
  const ids=new Map(),images=[],events=new Map(),errors=[];
  let rng=seed>>>0,now=0,raf=null,rngCalls=0;
  const random=()=>{rngCalls++;rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
  function dispatch(target,type,event={}){const e={type,target,currentTarget:target,preventDefault(){},stopPropagation(){},...event};for(const cb of target.listeners?.get(type)||[])cb(e);return e;}
  const context2d=()=>new Proxy({canvas:{width:1280,height:800},measureText(t){return {width:String(t).length*7};},createLinearGradient(){return {addColorStop(){}};},createRadialGradient(){return {addColorStop(){}};},createPattern(){return {};},getImageData(){return {data:new Uint8ClampedArray(16)};},getTransform(){return {a:1,b:0,c:0,d:1,e:0,f:0};}}, {get(t,k){if(k in t)return t[k];return (...args)=>{};},set(t,k,v){t[k]=v;return true;}});
  function element(tag='div',id=''){
    const classes=new Set(),attributes=new Map(),listeners=new Map();let htmlValue='',textValue='';
    const e={tagName:tag.toUpperCase(),id,dataset:{},listeners,children:[],width:800,height:180,disabled:false,
      style:{setProperty(k,v){this[k]=v;}},classList:{add(...v){v.forEach(x=>classes.add(x));},remove(...v){v.forEach(x=>classes.delete(x));},contains(k){return classes.has(k);},toggle(k,b){const on=b===undefined?!classes.has(k):b;on?classes.add(k):classes.delete(k);return on;}},
      addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},removeEventListener(){},setAttribute(k,v){attributes.set(k,String(v));},getAttribute(k){return attributes.has(k)?attributes.get(k):null;},hasAttribute(k){return attributes.has(k);},removeAttribute(k){attributes.delete(k);},
      getBoundingClientRect(){return {left:0,top:0,width:1280,height:800};},getContext(){return e.ctx||(e.ctx=context2d());},setPointerCapture(){},releasePointerCapture(){},blur(){doc.activeElement=null;},focus(){doc.activeElement=e;},
      appendChild(c){e.children.push(c);c.parentNode=e;return c;},replaceChildren(...c){e.children=[...c];textValue='';htmlValue='';},remove(){},querySelectorAll(sel){const result=[];const visit=n=>{for(const child of n.children||[]){if(sel==='input'&&child.tagName==='INPUT')result.push(child);visit(child);}};visit(e);return result;},closest(sel){return e.tagName==='BUTTON'&&sel.includes('button')?e:null;},click(){dispatch(e,'click',{detail:0});}
    };
    e.namespaceURI=tag==='svg'?'http://www.w3.org/2000/svg':'http://www.w3.org/1999/xhtml';
    if(tag!=='svg')Object.defineProperty(e,'hidden',{get(){return attributes.has('hidden');},set(value){if(value)attributes.set('hidden','');else attributes.delete('hidden');}});
    Object.defineProperty(e,'innerHTML',{get(){return htmlValue;},set(s){htmlValue=String(s);for(const m of htmlValue.matchAll(/<([a-z0-9]+)\b[^>]*\sid="([^"]+)"[^>]*>/gi)){const child=element(m[1],m[2]);ids.set(m[2],child);e.children.push(child);}}});
    Object.defineProperty(e,'textContent',{get(){return textValue;},set(s){textValue=String(s);htmlValue='';e.children=[];}});
    if(tag==='img')images.push(e);return e;
  }
  for(const m of html.slice(0,html.indexOf('<script>')).matchAll(/<([a-z0-9]+)\b[^>]*\sid="([^"]+)"[^>]*>/gi)){
    const e=element(m[1],m[2]);if(/\shidden(?:\s|=|>)/i.test(m[0]))e.setAttribute("hidden","");if(/class="[^"]*\bhidden\b/.test(m[0]))e.classList.add('hidden');ids.set(m[2],e);
  }
  const labs=[];
  for(const m of html.slice(0,html.indexOf('<script>')).matchAll(/<button data-lab="([^"]+)"[^>]*>([^<]*)<\/button>/g)){
    const e=element('button','lab:'+m[1]);e.dataset.lab=m[1];e.textContent=m[2];labs.push(e);ids.set(e.id,e);
  }
  const options=[...html.matchAll(/<option value="([^"]+)">([^<]*)<\/option>/g)].map(m=>({value:m[1],textContent:m[2]}));
  const doc={hidden:false,body:element('body'),documentElement:element('html'),listeners:new Map(),getElementById:id=>ids.get(id)||null,querySelectorAll(sel){return sel==='[data-lab]'?labs:[];},createElement:tag=>element(tag),addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,[]);this.listeners.get(type).push(fn);}};
  const queryIds=new Map();doc.querySelector=sel=>{if(!['#ovTitle h1','.titleLead','.quickControls','.titleNotice'].includes(sel))throw Error('Unstubbed selector '+sel);if(!queryIds.has(sel))queryIds.set(sel,element());return queryIds.get(sel);};
  const math=Object.create(Math);math.random=random;
  class TestDate extends Date {static now(){return 1700000000000+Math.floor(now);}}
  const sandbox={document:doc,console:{log(){},warn(){},error(...x){errors.push(x.map(String).join(' '));}},Math:math,performance:{now:()=>now},Date:TestDate,URLSearchParams,location:{search},innerWidth:width,innerHeight:height,devicePixelRatio:1,
    localStorage:storage||{getItem(){return null;},setItem(){}}, navigator:{locks},crypto:{randomUUID:()=>"test-career-123456"},matchMedia:q=>({matches:q.includes('pointer:coarse')?coarse:q.includes('hover:hover')?!coarse:false,addEventListener(){}}),getComputedStyle:()=>({getPropertyValue:()=>''}),setTimeout(){return 0;},clearTimeout(){},requestAnimationFrame(fn){raf=fn;return 1;},cancelAnimationFrame(){},focus(){},
    addEventListener(type,fn){if(!events.has(type))events.set(type,[]);events.get(type).push(fn);},removeEventListener(){},Uint8ClampedArray};
  sandbox.window=sandbox;sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  const script=html.slice(html.indexOf('<script>')+8,html.indexOf('</script>')).replace('window.JensenDebug={','window.JensenDebug={frame,').replace('makeEnemy,spawnEnemy,addFire,addPoise,', 'updateSpawner,updateElite,Trial,makeEnemy,spawnEnemy,addFire,addPoise,');
  new vm.Script(script,{filename:'slice-candidate-in-memory.js'}).runInContext(sandbox,{timeout:30000});
  const api=sandbox.JensenDebug;if(!api)throw Error('Debug export missing');
  return {api,document:doc,ids,images,errors,dispatch,options,sandbox,setViewport(w,h,touch=coarse){sandbox.innerWidth=w;sandbox.innerHeight=h;coarse=touch;for(const fn of events.get('resize')||[])fn({});},rng:()=>({state:rng,calls:rngCalls}),
    emit(type,event={}){for(const cb of events.get(type)||[])cb({type,target:ids.get('game'),preventDefault(){},repeat:false,...event});},
    step(dt=1/60){now+=dt*1000;api.update(dt);},
    frame(dt=1/60){now+=dt*1000;api.frame(now);},
    syntaxSource:script};
}
module.exports={makeRuntime};
