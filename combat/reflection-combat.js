/* The diner encounter advances on simulation time. The view consumes its locked
   coordinates; only the combat controller can deliver or accept a real hit. */
(function(){
"use strict";
const glass=Object.freeze({x:0,z:-6.4}),arena=Object.freeze({x:0,z:0});
const moves=Object.freeze({
  hammer:{name:"Hammer swing",radius:1.75,tell:1.45,strike:.62,linger:.68,damage:1400},
  cyclone:{name:"Cyclone Guard",radius:2.25,tell:1.65,strike:.9,linger:.94,damage:950},
  leap:{name:"Thunder Leap",radius:2.8,tell:1.7,strike:.9,linger:1.15,damage:950}
});
const xy=p=>({x:p.x,z:p.z}),mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});
const smooth=t=>t*t*(3-2*t),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
class Duel{
  constructor(move){
    this.move=Object.hasOwn(moves,move)?move:"hammer";this.rule=moves[this.move];
    this.boss=xy(glass);this.target=xy(glass);this.hero={x:0,z:1.8};
    this.counters=0;this.cycle=0;this.caught=false;this.hits=[];
    this.set("preview",6);
  }
  set(phase,duration){
    this.phase=phase;this.elapsed=0;this.duration=duration;this.from=xy(this.boss);
  }
  get open(){return this.phase==="recovery"&&!this.caught;}
  counter(rootId,time){
    if(!this.open)return false;
    this.hits.push({cycle:this.cycle,rootId,time});this.counters++;
    const dx=this.boss.x-this.hero.x,dz=this.boss.z-this.hero.z,length=Math.hypot(dx,dz)||1;
    this.retreat={x:clamp(this.boss.x+.8*dx/length,-5,5),z:clamp(this.boss.z+.8*dz/length,-4,4)};
    this.set(this.counters===2?"return":"stagger",this.counters===2?3.1:5.2);
    return true;
  }
  pulse(damage,kind,emit){
    const hit=Math.hypot(this.hero.x-this.target.x,this.hero.z-this.target.z)<=this.rule.radius;
    if(hit)this.caught=true;
    emit({kind,damage,hit,cycle:this.cycle,at:xy(this.target)});
  }
  track(){this.cycle++;this.caught=false;this.set("track",this.counters?6.2:5.7);}
  advance(emit){
    switch(this.phase){
      case "preview":this.set("enter",2.8);break;
      case "enter":case "stagger":case "recovery":this.track();break;
      case "track":this.target=xy(this.hero);this.set("tell",this.rule.tell);break;
      case "tell":this.set("strike",this.rule.strike);break;
      case "strike":
        this.pulse(this.rule.damage,this.move==="leap"?"landing":this.move==="cyclone"?"sweep":"hammer",emit);
        this.set("aftershock",this.rule.linger);break;
      case "aftershock":
        if(this.move!=="hammer")this.pulse(this.move==="leap"?820:720,this.move==="leap"?"lightning":"last-sweep",emit);
        this.set("recovery",4.25);break;
      case "return":this.set("complete",1);emit({kind:"complete"});break;
    }
  }
  update(dt,hero,emit){
    this.hero=xy(hero);if(this.phase==="complete")return;
    this.elapsed=Math.min(this.duration,this.elapsed+dt);
    const p=this.elapsed/this.duration,q=smooth(p);
    switch(this.phase){
      case "enter":this.boss=mix(this.from,{x:0,z:-2.2},q);break;
      case "track":{
        // Flank the target in the clear aisle before committing to one spot.
        const a=(this.cycle%2?1:-1)*(.7+2.25*p),d=this.counters?2.8:3.2;
        const goal={x:clamp(hero.x+Math.sin(a)*d,-5,5),z:clamp(hero.z-Math.cos(a)*d,-4.1,4.1)};
        const length=Math.hypot(goal.x-this.boss.x,goal.z-this.boss.z);
        this.boss=mix(this.boss,goal,Math.min(1,dt*(this.counters?1.65:2.3)/Math.max(.001,length)));break;
      }
      case "strike":this.boss=mix(this.from,this.target,q);break;
      case "stagger":this.boss=mix(this.from,this.retreat,smooth(Math.min(1,p*3)));break;
      case "return":this.boss=mix(this.from,glass,q);break;
    }
    if(this.elapsed+1e-9>=this.duration)this.advance(emit);
  }
  view(){
    return {phase:this.phase,move:this.move,elapsed:this.elapsed,duration:this.duration,progress:this.elapsed/this.duration,
      boss:xy(this.boss),hero:xy(this.hero),target:xy(this.target),radius:this.rule.radius,counters:this.counters,cycle:this.cycle,open:this.open,caught:this.caught};
  }
  cue(){
    const name=this.rule.name;
    switch(this.phase){
      case "preview":return this.move==="hammer"?"In the glass · watch the hammer swing":name+" · watch the move in the glass";
      case "enter":return "The reflection steps through.";
      case "track":return "Bait the swing. Move when the floor lights up.";
      case "tell":case "strike":return name+" locked · leave the marked circle";
      case "aftershock":return this.move==="leap"?"Stay clear for the last lightning bolt.":this.move==="cyclone"?"Stay outside the final sweep.":"Wait for the hammer to settle.";
      case "recovery":return this.caught?"It caught you. Bait the next swing.":"Opening · close in and strike!";
      case "stagger":return "One clean counter. Its steps are slower.";
      case "return":case "complete":return "Two clean counters. The glass falls still.";
    }
  }
}
// Apply the same weapon carriage and joint silhouettes in the harmless window
// replay and live release. The native hero rig resets these joints every tick.
function pose(rig,duel,reduced){
  const {phase,move,elapsed,duration}=duel;
  const progress=elapsed/duration;
  let wind=0,swing=0,settle=0,spin=0;
  if(phase==="preview"){
    const t=(elapsed%3)/3;wind=clamp(t/.42,0,1)*(1-clamp((t-.50)/.18,0,1));
    swing=Math.sin(Math.PI*clamp((t-.44)/.35,0,1));spin=clamp((t-.38)/.45,0,1);
  }else if(phase==="tell")wind=smooth(progress);
  else if(phase==="strike"){wind=1-progress;swing=Math.sin(Math.PI*progress);spin=progress;}
  else if(phase==="aftershock"){settle=1-.35*progress;spin=progress;}
  else if(phase==="recovery"||phase==="stagger")settle=1-.6*progress;
  if(move==="cyclone"){
    rig.torso.rotation.y+=.4*wind;
    rig.pelvis.rotation.y+=spin*Math.PI*(reduced?.65:4);
    rig.limbs.r.shoulder.rotation.x-=1.15*Math.max(wind,swing);
    rig.limbs.l.shoulder.rotation.x-=1.35*Math.max(wind,swing);
  }else{
    rig.limbs.l.shoulder.rotation.x-=2.55*wind+.5*swing;
    rig.limbs.l.elbow.rotation.x-=.65*wind;
    rig.limbs.r.shoulder.rotation.x-=.8*(wind+swing);
    rig.torso.rotation.x+=-.22*wind+.45*settle;
    if(move==="leap")rig.pelvis.position.y+=(reduced?.36:1.22)*swing;
    else rig.torso.rotation.y+=-.66*wind+.85*swing;
  }
  rig.pelvis.position.y-=.17*settle;rig.head.rotation.x+=.24*settle;
}
window.ReflectionCombat=Object.freeze({Duel,pose,glass,arena});
})();
