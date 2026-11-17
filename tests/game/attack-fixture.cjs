'use strict';
// Explicit already-released actor snapshot for controlled contact/clock fixtures.
function attackFixture(e,angle,id='fixture'){
 const config=JSON.parse(JSON.stringify(e.config));return {id,rootId:id,attempt:e.attempt,ownerId:e.ownerId,typeId:e.typeId,config,bodyRadius:e.r,angle,origin:{x:e.x,y:e.y},target:{x:e.x+Math.cos(angle)*100,y:e.y+Math.sin(angle)*100},hit:false,released:true,reservationReleased:true,damage:config.damage,damageKind:config.damageKind,active:config.active_seconds,recovery:config.recovery_seconds,travelled:0,shapes:[]};
}
// A firing fixture starts a real admitted tell so its emission owns a real reservation.
function primeTell(r,e,angle,t=.001){e.state='chase';e.wait=0;e.entered=true;r.step(1/120);if(e.state!=='tell'||!e.attack)throw Error('Fixture could not start real tell');e.attack.angle=angle;e.t=t;}
module.exports={attackFixture,primeTell};
