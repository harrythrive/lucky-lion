export const END=9300;
export const RUNS=[
 {start:610,end:1550,count:9,level:0},
 {start:3210,end:4440,count:9,level:1},
 {start:5130,end:6570,count:11,level:2},
 {start:7180,end:8660,count:11,level:3}
];
export const platforms=[{x:-200,y:460,w:740,type:'ground'},
 {x:1610,y:460,w:1550,type:'ground'},
 {x:1840,y:400,w:145,type:'crowd'},{x:2005,y:365,w:170,type:'crowd'},
 {x:2205,y:390,w:150,type:'crowd'},{x:2450,y:395,w:190,type:'crowd'},{x:2660,y:370,w:200,type:'crowd'},
 {x:4480,y:460,w:570,type:'ground'}, {x:4735,y:400,w:150,type:'crowd'},
 {x:6640,y:460,w:470,type:'ground'}, {x:6780,y:400,w:140,type:'crowd'},
 {x:8740,y:460,w:1100,type:'ground'},{x:8990,y:405,w:155,type:'crowd'}];
export const photographers=[{x:1820,phase:.2},{x:2350,phase:1.3},{x:2925,phase:2.5},{x:4760,phase:.7},{x:6855,phase:1.1},{x:9140,phase:2.1}];
export function platformPosition(a,time){
 const wave=(phase)=>Math.sin(phase)*.82+Math.sin(phase)*Math.abs(Math.sin(phase))*.18;
 const phase=time*(a.speed||0)+(a.phase||0);
 return {x:a.baseX+(a.moveX||0)*wave(phase),y:a.baseY+(a.moveY||0)*wave(phase+(a.offset||0))};
}
export function makeCourse(seed,map='hongkong'){
 let state=seed>>>0;const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};
 const course=platforms.map(p=>({...p}));
 for(const {start,end,count,level} of RUNS){
  const widths=Array.from({length:count},(_,i)=>{
   if(level===0)return 86+Math.floor(rand()*13);
   const narrow=i>0&&i<count-1&&rand()<(level===1?.22:.32);
   return narrow?46+Math.floor(rand()*12):76+Math.floor(rand()*17);
  });
  const occupied=widths.slice(0,-1).reduce((sum,w,i)=>sum+(w+widths[i+1])/2,0);
  const available=end-start-occupied,weights=Array.from({length:count-1},(_,i)=>(.65+rand()*.95)*(1+i*.045)),total=weights.reduce((a,b)=>a+b,0);
  let center=start,y=390;
  for(let i=0;i<count;i++){
   const previousHeight=y;
   if(i){center+=(widths[i-1]+widths[i])/2+available*weights[i-1]/total;const previous=y;let heightChange=80+Math.floor(rand()*121);
    if(level===0&&i===1)heightChange=85+Math.floor(rand()*35);
    let direction=rand()<.53?-1:1;if(y<220)direction=1;if(y>360)direction=-1;
    y=Math.max(150,Math.min(425,y+direction*heightChange));
    if(Math.abs(y-previous)<65)y=previous>280?previous-100:previous+100;}
   if(i===count-2)y=Math.max(240,y);if(i===count-1)y=395;
   let moveX=0,moveY=0;
   if(i>0&&i<count-1&&level>=2){
    const roll=rand();
    if(level===2){if(roll<.76)moveY=20+rand()*17;}
    else if(roll<.44){moveX=15+rand()*11;}else if(roll<.78){moveY=22+rand()*14;}else {moveX=12+rand()*7;moveY=15+rand()*10;}
    if(widths[i]<60)moveX=Math.min(moveX,13);
   }
   course.push({x:center-widths[i]/2,y,w:widths[i],type:'stilt',level,highStep:i>0&&previousHeight-y>145,moveX,moveY,speed:.7+rand()*.5,phase:rand()*Math.PI*2,offset:rand()*Math.PI});
  }
 }
 return course.sort((a,b)=>a.x-b.x).map((a,id)=>({...a,id,baseX:a.x,baseY:a.y,prevX:a.x,prevY:a.y,dx:0,dy:0}));
}
export function makePackets(course,seed){
 let state=(seed^0x9e3779b9)>>>0;const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};
 const packets=course.filter(a=>a.type!=='ground').map(a=>({platformId:a.id,offsetX:0,offsetY:-57,x:a.x+a.w/2,y:a.y-57,value:100,cluster:null,taken:false}));
 let cluster=0;
 for(const a of course.filter(a=>a.type==='stilt')){
  // Optional high arcs reach out over the gaps, away from the safe deck packets.
  if(rand()>.32)continue;
  const count=7+Math.floor(rand()*4),side=rand()<.75?1:-1;
  const reach=side*(a.w/2+36+rand()*22),height=130+rand()*45;
  for(let i=0;i<count;i++){const angle=Math.PI*i/(count-1);const ox=reach+(i/(count-1)-.5)*100,oy=-height-Math.sin(angle)*70;
   packets.push({platformId:a.id,offsetX:ox,offsetY:oy,x:a.x+a.w/2+ox,y:a.y+oy,value:150,cluster,taken:false});
  }cluster++;
 }
 return packets;
}
export function makeFirecrackers(course){
 // Stable early obstacles; leave most moving-platform timing windows clear.
 const stilts=course.filter(p=>p.type==='stilt'&&p.level<2);
 return stilts.map((_,i)=>i).filter(i=>i%4===1&&stilts[i+1]&&stilts[i+1].x-stilts[i].x<300).map((index,i)=>{
  const a=stilts[index],b=stilts[index+1];return{x:(a.x+a.w+b.x)/2,top:55+(i%3)*22,bottom:Math.max(a.y,b.y)-12,phase:i*1.27,period:6.4+(i%3)*.55};
 }).concat([{x:2510,top:95,bottom:420,phase:2.3,period:6.2},{x:4830,top:110,bottom:415,phase:.7,period:5.9},{x:9070,top:105,bottom:410,phase:1.9,period:6.5}]);
}
const approach=(v,target,amount)=>v<target?Math.min(target,v+amount):Math.max(target,v-amount);
export class Game{
 constructor(){this.reset();this.state='title'}
 reset(seed=Math.floor(Math.random()*4294967296),map=this.map||'hongkong'){
  this.map=map;this.seed=seed;this.platforms=makeCourse(seed,map);this.firecrackers=makeFirecrackers(this.platforms);this.state='playing';this.time=0;this.lives=3;this.score=0;this.distance=0;this.lastSection=0;
  this.p={x:125,y:460,vx:0,vy:0,onGround:true,support:this.platforms[0].id,face:1,inv:0,rise:0,cooldown:0,shuffle:false,coyote:.1,jumpBuffer:0,takeoff:0,airTime:0,landTime:0,gait:0,heldDirection:0,directionHeld:0,momentum:false,highJump:false,lastJumpTap:-10,launchY:0,photoRise:false};
  this.checkpoint={x:125,y:460};this.lastInput={};this.events=[];
  this.envelopes=makePackets(this.platforms,seed);this.claimedClusters=new Set();this.riseAward=false;this.finishBonus=false;
 }
 emit(type,text){this.events.push({type,text})}
 hit(reason){if(this.p.inv>0||this.state!=='playing')return;this.lives--;this.emit('hit',reason);if(this.lives<=0){this.state='lost';return}
  const support=this.platforms.find(a=>a.type==='ground'&&this.checkpoint.x>=a.x&&this.checkpoint.x<=a.x+a.w);
  Object.assign(this.p,{x:this.checkpoint.x,y:this.checkpoint.y,vx:0,vy:0,onGround:true,support:support?.id??null,inv:2.5,rise:0,cooldown:0,coyote:.1,jumpBuffer:0,takeoff:0,airTime:0,landTime:0,heldDirection:0,directionHeld:0,momentum:false,highJump:false,lastJumpTap:-10,launchY:0,photoRise:false});
 }
 firePhase(h){return(this.time+h.phase)%h.period}
 firecrackerState(h){let phase=this.firePhase(h),active=phase>=1.2&&phase<2.9;return{warning:phase<1.2,active,progress:Math.max(0,Math.min(1,(phase-1.2)/1.7)),y:h.bottom-(h.bottom-h.top)*Math.max(0,Math.min(1,(phase-1.2)/1.7))}}
 photoPhase(h){return(this.time+h.phase)%3.7}
 updatePlatforms(){for(const a of this.platforms){a.prevX=a.x;a.prevY=a.y;const pos=platformPosition(a,this.time);a.x=pos.x;a.y=pos.y;a.dx=a.x-a.prevX;a.dy=a.y-a.prevY;}
  for(const e of this.envelopes){const a=this.platforms[e.platformId];e.x=a.x+a.w/2+e.offsetX;e.y=a.y+e.offsetY;}
 }
 update(dt,k={}){
  if(this.state!=='playing')return;dt=Math.min(dt,.0334);this.time+=dt;this.updatePlatforms();const p=this.p;
  // A planted lion rides the deck. Walking past its edge releases it immediately.
  let support=this.platforms[p.support];if(p.onGround&&support){p.x+=support.dx;p.y=support.y;}
  const wasGround=p.onGround;
  p.inv=Math.max(0,p.inv-dt);p.rise=Math.max(0,p.rise-dt);p.cooldown=Math.max(0,p.cooldown-dt);p.landTime=Math.max(0,p.landTime-dt);p.jumpBuffer=Math.max(0,p.jumpBuffer-dt);
  p.shuffle=!!k.down&&p.onGround&&p.rise===0;p.coyote=p.onGround?.11:Math.max(0,p.coyote-dt);
  const jumpTap=!!k.jumpPressed||(k.jump&&!this.lastInput.jump);
  if(jumpTap){
   const doubleTap=this.time-p.lastJumpTap<=.34;p.lastJumpTap=this.time;
   if(doubleTap&&!p.highJump&&(p.takeoff>0||(!p.onGround&&p.airTime<.34&&p.vy<0))){
    p.highJump=true;p.jumpBuffer=0;
    if(!p.onGround){const climbed=Math.max(0,p.launchY-p.y);p.vy=-Math.sqrt(Math.max(0,970*970-2*1450*climbed));this.emit('jump','HIGH LEAP!');}
   }else if(p.onGround||p.coyote>0)p.jumpBuffer=.15;
  }
  if(k.up&&!this.lastInput.up&&p.onGround&&p.cooldown===0&&!p.shuffle&&!p.takeoff&&!k.jump&&p.jumpBuffer===0){p.rise=2;p.cooldown=4.5;this.riseAward=false;p.photoRise=photographers.some(h=>Math.abs(p.x-h.x)<=145)&&p.y>=330;this.emit('rise','STAND TALL · ABOVE CAMERA FLASHES');if(p.photoRise)this.emit('cheer','THE CROWD LOVES IT!')}
  if(p.rise>0&&p.rise<.7&&!this.riseAward){this.riseAward=true;const points=p.photoRise?500:150;this.score+=points;this.emit('bonus',p.photoRise?'PHOTO FINISH POSE +500':'BEAUTIFUL FORM +150')}
  const dir=(k.right?1:0)-(k.left?1:0);
  // Precision controls are the default, including in mid-air. Only a deliberate
  // uninterrupted run earns extra speed; release, reversal or braking cancels it.
  if(dir&&!k.down&&p.rise===0){
   p.directionHeld=p.heldDirection===dir?p.directionHeld+dt:dt;p.heldDirection=dir;
  }else{p.directionHeld=0;p.heldDirection=0;}
  p.momentum=p.directionHeld>3;
  const maxSpeed=p.shuffle?100:p.rise>0?85:k.down?150:p.momentum?265:235;
  if(p.momentum)p.vx=approach(p.vx,dir*maxSpeed,120*dt);
  else p.vx=dir*maxSpeed;
  if(dir)p.face=dir;
  if(p.jumpBuffer>0&&p.coyote>0&&!p.takeoff){p.takeoff=p.onGround?.105:.001;p.highJump=false;p.launchY=p.y;if(p.highJump&&p.rise>1.8)p.cooldown=0;p.jumpBuffer=0;p.rise=0;p.landTime=0;}
  let launched=false;
  if(p.takeoff>0){p.takeoff-=dt;if(p.takeoff<=0||!p.onGround){p.takeoff=0;p.vy=p.highJump?-970:-655;p.onGround=false;p.support=null;p.coyote=0;p.airTime=0;launched=true;this.emit('jump',p.highJump?'HIGH LEAP!':'');}}
  p.x=Math.max(25,Math.min(END+50,p.x+p.vx*dt));p.gait+=Math.abs(p.vx)*dt/13+(p.shuffle?dt*7:0);
  // A narrower balance point makes narrow decks meaningful without pixel-perfect feet.
  if(p.onGround&&support&&p.x+10>support.x&&p.x-10<support.x+support.w){p.y=support.y;p.vy=0;p.airTime=0;}
  else{
   p.onGround=false;p.support=null;const prevY=p.y;p.vy+=1450*dt;p.y+=p.vy*dt;p.airTime+=dt;
   // Solve the relative crossing of moving deck and falling feet, not its old height.
   let landing=null,earliest=2;
   if(!launched)for(const a of this.platforms){const before=prevY-a.prevY,after=p.y-a.y,relative=after-before;
    if(relative>0&&before<=4&&after>=0&&p.vy>=-20){const fraction=Math.max(0,Math.min(1,-before/relative));const deckX=a.prevX+(a.x-a.prevX)*fraction;
     const lionX=p.x-p.vx*dt*(1-fraction);
     if(lionX+10>deckX&&lionX-10<deckX+a.w&&fraction<earliest){landing=a;earliest=fraction;}
    }
   }
   if(landing){p.y=landing.y;p.vy=0;p.onGround=true;p.support=landing.id;p.airTime=0;p.landTime=.22;p.coyote=.11;p.highJump=false;}
  }
  if(wasGround&&!p.onGround&&!launched&&p.takeoff>0){p.takeoff=.001;}
  // Safe rest areas divide the longer course into manageable retries.
  const checkpoints=[{from:1650,to:1750,x:1660},{from:3000,to:3120,x:3070},{from:4490,to:4580,x:4510},{from:4980,to:5030,x:4990},{from:6650,to:6750,x:6680},{from:7020,to:7090,x:7050},{from:8750,to:8850,x:8780}];
  for(const c of checkpoints)if(p.onGround&&p.x>c.from&&p.x<c.to&&c.x>this.checkpoint.x){this.checkpoint={x:c.x,y:460};this.emit('checkpoint','CHECKPOINT · CATCH YOUR BREATH');}
  const section=p.x<1640?0:p.x<3160?1:p.x<5050?2:p.x<7110?3:4;
  if(section>this.lastSection){this.lastSection=section;if(section===3)this.emit('tip','RISING STILTS · WATCH THEIR RHYTHM');if(section===4)this.emit('tip','DRIFTING STILTS · BRAKE BEFORE LANDING');}
  if(p.y>610){this.hit('MISSED THE LANDING');this.lastInput={...k};return;}
  let packetValue=0;
  for(const e of this.envelopes)if(!e.taken&&Math.abs(p.x-e.x)<31&&Math.abs((p.y-(p.rise>0?105:48))-e.y)<42){e.taken=true;this.score+=e.value;packetValue+=e.value;}
  if(packetValue)this.emit('coin',`LUCK +${packetValue}`);
  for(const id of new Set(this.envelopes.filter(e=>e.cluster!==null).map(e=>e.cluster)))if(!this.claimedClusters.has(id)&&this.envelopes.filter(e=>e.cluster===id).every(e=>e.taken)){this.claimedClusters.add(id);this.score+=500;this.emit('bonus','PACKET CLUSTER COMPLETE +500');}

  for(const h of photographers){const phase=this.photoPhase(h);if(Math.abs(p.x-h.x)<26&&p.y>420)this.hit('WATCH THE PHOTOGRAPHERS');if(phase>2.65&&phase<3.05&&Math.abs(p.x-h.x)<145&&p.y>413&&!p.shuffle&&p.rise===0)this.hit('CAMERA FLASH! SHUFFLE TO DUCK');}
  for(const h of this.firecrackers){const f=this.firecrackerState(h),top=p.y-(p.rise>0?155:p.shuffle?52:80);if(f.active&&Math.abs(p.x-h.x)<48&&f.y+34>top&&f.y-34<p.y-5)this.hit('FIRECRACKERS! WAIT FOR THE STRING TO FINISH');}
  if(p.x>this.distance){this.score+=Math.floor(p.x/10)-Math.floor(this.distance/10);this.distance=p.x;}
  if(p.x>=END&&p.onGround){this.state='won';if(!this.finishBonus){this.score+=this.lives*1000;this.finishBonus=true;}this.emit('win','GOOD FORTUNE!');}
  this.lastInput={...k};
 }
}
