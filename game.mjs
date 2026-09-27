import{Game,photographers,END}from'./engine.mjs';
import{FestivalMusic}from'./music.mjs';
const $=s=>document.querySelector(s),canvas=$('#game'),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
const MAPS={hongkong:{name:'HONG KONG',zone:'HONG KONG · LANTERN FESTIVAL',asset:'./street.png',stages:['LANTERN STREET','THE CROWD GOES WILD','PRECISION PARADE','RISING LANTERNS','DRIFT TO THE GATE'],parallax:.32,pole:'#ae424c',trim:'#d49b4e',floor:'#504957'},shanghai:{name:'SHANGHAI BUND',zone:'SHANGHAI · THE BUND',asset:'./shanghai.png',stages:['RIVERSIDE PROMENADE','HUANGPU CELEBRATION','RIVERSIDE BALANCE','RISING SKYLINE','HUANGPU FINALE'],parallax:.13,pole:'#367e95',trim:'#deb773',floor:'#374359'},melbourne:{name:'MELBOURNE CHINATOWN',zone:'MELBOURNE · LITTLE BOURKE STREET',asset:'./melbourne.png',stages:['LITTLE BOURKE STREET','LANTERN LANE','LANEWAY BALANCE','RISING LANTERNS','CHINATOWN FINALE'],parallax:.27,pole:'#bb3e42',trim:'#ddaa55',floor:'#414753'}};
let selectedMap='hongkong';const game=new Game(),keys={},pressed={},bg=new Image(),sheet=new Image();bg.src=MAPS[selectedMap].asset;sheet.src='./lion.png';let sprites=[],artReady=false,camera=0,cameraY=0,shake=0,showText=0,particles=[],soundOn=true,audioCtx=null,music=null,firePops=new Map(),cheerUntil=0;
const palette={gold:'#f3b946',cream:'#f9d995',red:'#b73238',dark:'#262432',teal:'#35605a'};
// Native sprite bounds preserve transparent padding and full costume details.
sheet.onload=()=>{sprites=[[27,407,595,885],[605,271,1117,815],[1151,95,1512,891]].map(([l,t,r,b])=>({img:sheet,x:l,y:t,w:r-l,h:b-t}));artReady=true;readyUI();};
function readyUI(){if(artReady&&bg.complete&&bg.naturalWidth){const b=$('#start');if(b){b.disabled=false;b.innerHTML='LET’S DANCE <span>▸</span>';}}}
bg.onload=readyUI;
bg.onerror=sheet.onerror=()=>{$('#message').textContent='ART COULD NOT LOAD · RELOAD TO RETRY';showText=9999;};
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
function text(t,x,y,size=12,color='#ffe0a0',align='center'){ctx.fillStyle=color;ctx.font=`bold ${size}px monospace`;ctx.textAlign=align;ctx.fillText(t,Math.round(x),Math.round(y))}
function enableAudio(){if(!soundOn)return;try{audioCtx??=new(window.AudioContext||window.webkitAudioContext)();music??=new FestivalMusic(audioCtx);audioCtx.resume();music.setPlaying(game.state==='playing');}catch{soundOn=false;}}
function drawSkyFireworks(t){
 const colors=['#ffce7a','#f7798f','#a4e7eb','#ffecc1','#eda0ef'];
 for(let i=0;i<7;i++){
  const cycle=5.8+i*.31,phase=(t+i*.83)%cycle,round=Math.floor((t+i*.83)/cycle);
  const x=90+((i*173+round*71)%800),y=48+((i*47+round*29)%135),color=colors[(i+round)%colors.length];
  if(phase<.8){const ry=350-(350-y)*phase/.8;for(let j=0;j<7;j++){ctx.globalAlpha=(1-j/7)*.8;rect(x,ry+j*5,2,4,color)}}
  else if(phase<3.1){const age=phase-.8,radius=age*44,alpha=Math.max(0,1-age/2.3);ctx.globalAlpha=alpha;
   for(let ray=0;ray<38;ray++){const angle=ray*Math.PI*2/38,stretch=.78+Math.sin(ray*4.7+i)*.22;
    for(let tail=0;tail<5;tail++){const r=Math.max(0,radius-tail*3)*stretch;ctx.globalAlpha=alpha*(1-tail/6);rect(x+Math.cos(angle)*r,y+Math.sin(angle)*r+age*age*12,tail===0?3:2,2,color)}
   }
   ctx.globalAlpha=alpha*.45;rect(x-2,y-2,4,4,'#fff4d1');
  }
 }
 ctx.globalAlpha=1;
}
function drawFirecrackers(h,t){
 const x=h.x-camera;if(x<-100||x>viewWidth+100)return;const f=game.firecrackerState(h),sway=Math.sin(t*1.5+h.x)*3;
 rect(x-1,0,2,h.bottom,'#5c3c32');rect(x-6,h.top-7,12,10,'#eac071');
 for(let y=h.top;y<h.bottom;y+=11){
  if(f.active&&y>f.y+7)continue;
  for(const side of[-1,1]){ctx.save();ctx.translate(Math.round(x+sway),y);ctx.rotate(side*.32);rect(side<0?-24:2,-3,22,9,'#641f31');rect(side<0?-23:3,-3,20,6,'#c93a43');rect(side<0?-22:4,-2,18,2,'#ed6257');rect(side<0?-25:23,-2,4,7,'#43202c');rect(side<0?-24:24,-1,2,3,'#251b28');ctx.restore();}
 }
 if(f.warning){text('!',x,h.bottom+28,20,'#ffd575');const flick=Math.sin(t*47)>0;rect(x-2,h.bottom+2,4,7,flick?'#fff2a0':'#f08337');}
 if(f.active){const y=f.y,burst=Math.floor(t*18);for(let j=0;j<16;j++){const a=j*2.399+burst*.7,r=12+(j*13+burst*7)%37;rect(x+Math.cos(a)*r,y+Math.sin(a)*r,3+(j%3),2,j%3?'#ffc05b':'#fff4bd');}rect(x-7,y-6,14,12,'#fff3bc');rect(x-12,y-2,24,4,'#ffe06e');
  for(let j=0;j<18;j++){const age=((t*1.3+j*.119)%1),px=x+Math.sin(j*32)*age*80,py=y+age*95;ctx.globalAlpha=1-age;rect(px,py,4,3,j%2?'#d74242':'#9d293a');}ctx.globalAlpha=1;
  for(let j=0;j<5;j++){ctx.globalAlpha=.13;rect(x-20+Math.sin(j+t)*17,y-15-j*13,32+j*5,17,'#dccad1')}ctx.globalAlpha=1;
  const pop=Math.floor(t*14);if(game.state==='playing'&&firePops.get(h.x)!==pop){firePops.set(h.x,pop);if(Math.abs(h.x-game.p.x)<650&&soundOn)music?.crackle();}
 }
}
function sound(kind){if(!soundOn)return;try{audioCtx??=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();let t=audioCtx.currentTime,osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.connect(gain);gain.connect(audioCtx.destination);osc.type=kind==='hit'?'sawtooth':'triangle';let notes={jump:[260,580,.13],coin:[880,1320,.12],rise:[330,660,.2],hit:[160,45,.3],beat:[90,35,.09],win:[520,1050,.4]};let [a,b,len]=notes[kind]||notes.coin;osc.frequency.setValueAtTime(a,t);osc.frequency.exponentialRampToValueAtTime(b,t+len);gain.gain.setValueAtTime(kind==='beat'?.045:.07,t);gain.gain.exponentialRampToValueAtTime(.001,t+len);osc.start(t);osc.stop(t+len);}catch{soundOn=false;}}
function confetti(x,y,n=15){for(let i=0;i<n;i++)particles.push({x,y,vx:Math.random()*150-75,vy:-Math.random()*180-50,life:1.4,color:['#efb945','#ef5541','#fff0b1'][i%3]})}
function person(x,y,i,photo=false,flash=false){let c=photo?'#223d4c':['#953c42','#537f75','#c99a4b','#576488','#ad715b'][i%5];rect(x-8,y-36,16,23,c);rect(x-6,y-49,12,13,'#d7a071');rect(x-7,y-50,14,5,'#272934');rect(x-8,y-13,6,13,'#252d39');rect(x+2,y-13,6,13,'#252d39');rect(x-11,y-1,9,3,'#141e2b');rect(x+2,y-1,9,3,'#141e2b');rect(x-11,y-33,4,17,c);rect(x+8,y-33,4,17,c);if(!photo&&game.time<cheerUntil){const wave=Math.sin(game.time*18+i)*3;rect(x-15,y-48+wave,4,20,c);rect(x+12,y-48-wave,4,20,c);rect(x-15,y-52+wave,4,5,'#d7a071');rect(x+12,y-52-wave,4,5,'#d7a071');}if(photo){rect(x-13,y-40,27,9,'#16232e');rect(x-2,y-42,9,13,'#77848a');rect(x,y-40,5,8,'#18232b');rect(x+8,y-45,5,4,flash?'#fff5be':'#a7abb0');if(flash){ctx.fillStyle='#fff3b34d';ctx.beginPath();ctx.moveTo(x,y-42);ctx.lineTo(x-150,y-85);ctx.lineTo(x-150,y-5);ctx.fill();ctx.beginPath();ctx.moveTo(x,y-42);ctx.lineTo(x+150,y-85);ctx.lineTo(x+150,y-5);ctx.fill();rect(x-4,y-48,12,19,'#fff8d1');rect(x-10,y-41,24,5,'#fff8d1');}}}
function drawPlatform(a){let x=a.x-camera;if(x+a.w<-50||x>viewWidth+70)return;if(a.type==='ground'){rect(x,a.y,a.w,80,MAPS[selectedMap].floor);rect(x,a.y,a.w,5,'#b79075');rect(x,a.y+5,a.w,6,'#766776');for(let t=0;t<a.w;t+=44){rect(x+t,a.y+20,40,2,'#34333f');rect(x+t+21,a.y+9,2,13,'#34333f');rect(x+t,a.y+43,40,2,'#34333f');rect(x+t,a.y+22,2,19,'#34333f');}return;}if(a.type==='crowd'){for(let i=0;i<a.w/18;i++)person(x+i*18+6,a.y+55,i+Math.floor(a.x));rect(x,a.y,a.w,5,'#b67e4b');rect(x,a.y+5,a.w,4,'#533a42');for(let i=0;i<a.w/30;i++){rect(x+i*30+4,a.y+8,3,12,'#dda478');rect(x+i*30+19,a.y+8,3,12,'#dda478');}return;}
 const mid=x+a.w/2;rect(mid-11,a.y+9,22,540-a.y,'#502c43');rect(mid-6,a.y+9,12,540-a.y,MAPS[selectedMap].pole);rect(mid-5,a.y+11,4,540-a.y,'#d35a55');for(let y=a.y+40;y<540;y+=49){rect(mid-12,y,24,7,MAPS[selectedMap].trim);rect(mid-12,y+7,24,3,'#402b3d');}rect(x-3,a.y+5,a.w+6,9,'#312634');rect(x,a.y,a.w,7,'#d0a15c');rect(x+5,a.y,a.w-10,3,'#f0d08a');
 if(a.highStep)text(mobileLayout.matches?'2× JUMP':'2× SPACE',mid,a.y-16,9,'#fff0a8');
 if(a.moveY){text(a.dy<0?'▲':'▼',mid,a.y+29,10,'#b0edda');}
 if(a.moveX){text(a.dx<0?'◀':'▶',mid,a.y+43,10,'#b0edda');}
 if(a.w<60){rect(x+3,a.y+2,5,3,'#ed6f50');rect(x+a.w-8,a.y+2,5,3,'#ed6f50');}
}
// Deform the existing sprite as a connected cloth-and-dancer mesh: the
// head nods separately while front and rear feet alternate lift and slide.
function drawDancingSprite(s,w,h,time,shuffle,moving,p){
 const cols=18,rows=14,phase=p.gait??time*10,stride=shuffle?5:moving?7:0;
 const smooth=(a,b,v)=>{let t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t)};
 const deform=(u,v)=>{
  const head=smooth(.46,.71,u)*(1-smooth(.52,.76,v));
  const feet=smooth(.62,.94,v),front=smooth(.4,.75,u);
  // Four independent dancer legs: left / right pairs alternate instead of
  // translating both front feet or both rear feet as one block.
  const centers=[.075,.325,.60,.885],phases=[0,Math.PI,.35*Math.PI,1.35*Math.PI];
  let footX=0,footY=0,total=0;
  for(let i=0;i<4;i++){const weight=Math.exp(-Math.pow((u-centers[i])/.105,2));
   footX+=Math.sin(phase+phases[i])*stride*weight;
   footY-=Math.max(0,Math.cos(phase+phases[i]))*(shuffle?6:10)*weight*(moving||shuffle?1:0);total+=weight;
  }
  footX/=total||1;footY/=total||1;
  const bob=(moving||shuffle)?Math.sin(phase*2)*1.8:Math.sin(time*3)*.5;
  const nod=(moving||shuffle)?Math.sin(phase+.6)*(shuffle?5:4):Math.sin(time*3)*1.1;
  let bodyY=bob+head*nod,scaleX=1;
  if(p.takeoff>0){const progress=1-p.takeoff/.105;bodyY=(1-front)*3-front*progress*11;footX=front*progress*6;footY=-front*progress*13;}
  else if(!p.onGround){const age=p.airTime||0,tuck=Math.min(1,age/.2);bodyY=0;scaleX=1.07;footX=(front-.5)*12;footY=-((front?15:10)*tuck);if(age<.16)footY=-front*14-(1-front)*(age/.16)*9;}
  else if(p.landTime>0){const progress=1-p.landTime/.22;bodyY=front*Math.sin(progress*Math.PI)*4;footX=0;footY=-(1-front)*(1-progress)*17;}
  return {x:(-w/2+u*w)*scaleX+feet*footX,y:-h+v*h+bodyY*(1-feet*.5)+feet*footY};
 };
 const triangle=(a,b,c,sa,sb,sc)=>{
  ctx.save();ctx.beginPath();const cx=(a.x+b.x+c.x)/3,cy=(a.y+b.y+c.y)/3;
  // Slight overlap hides hairline gaps between the connected triangles.
  for(const [i,p]of[a,b,c].entries()){let dx=p.x-cx,dy=p.y-cy,len=Math.hypot(dx,dy)||1;const x=p.x+dx/len*.35,y=p.y+dy/len*.35;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.clip();
  const det=sa.x*(sb.y-sc.y)+sb.x*(sc.y-sa.y)+sc.x*(sa.y-sb.y);
  const ax=(a.x*(sb.y-sc.y)+b.x*(sc.y-sa.y)+c.x*(sa.y-sb.y))/det;
  const bx=(a.x*(sc.x-sb.x)+b.x*(sa.x-sc.x)+c.x*(sb.x-sa.x))/det;
  const tx=(a.x*(sb.x*sc.y-sc.x*sb.y)+b.x*(sc.x*sa.y-sa.x*sc.y)+c.x*(sa.x*sb.y-sb.x*sa.y))/det;
  const ay=(a.y*(sb.y-sc.y)+b.y*(sc.y-sa.y)+c.y*(sa.y-sb.y))/det;
  const by=(a.y*(sc.x-sb.x)+b.y*(sa.x-sc.x)+c.y*(sb.x-sa.x))/det;
  const ty=(a.y*(sb.x*sc.y-sc.x*sb.y)+b.y*(sc.x*sa.y-sa.x*sc.y)+c.y*(sa.x*sb.y-sb.x*sa.y))/det;
  ctx.transform(ax,ay,bx,by,tx,ty);ctx.drawImage(s.img,s.x,s.y,s.w,s.h,0,0,w,h);ctx.restore();
 };
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  const u=col/cols,v=row/rows,uu=(col+1)/cols,vv=(row+1)/rows;
  const a=deform(u,v),b=deform(uu,v),c=deform(uu,vv),d=deform(u,vv);
  const sa={x:u*w,y:v*h},sb={x:uu*w,y:v*h},sc={x:uu*w,y:vv*h},sd={x:u*w,y:vv*h};
  triangle(a,b,c,sa,sb,sc);triangle(a,c,d,sa,sc,sd);
 }
}
function drawLion(p,time){
 const x=p.x-camera,y=p.y,standing=p.rise>0;const h=standing?165:p.shuffle?74:90;
 ctx.save();if(p.inv>0&&Math.floor(time*13)%2===0)ctx.globalAlpha=.4;
 ctx.translate(Math.round(x),Math.round(y));ctx.scale(p.face,1);
 const s=sprites[standing?2:0];if(s){const w=h*s.w/s.h;
  if(standing){const sway=Math.sin(time*5)*1.5;ctx.rotate(sway*.008);ctx.drawImage(s.img,s.x,s.y,s.w,s.h,-w/2,-h+sway,w,h);}
  else{let pitch=0;if(p.takeoff>0)pitch=-(1-p.takeoff/.105)*.075;else if(!p.onGround)pitch=Math.max(-.16,Math.min(.16,p.vy/3000));else if(p.landTime>0)pitch=p.landTime/.22*.12;
   const pivot=p.takeoff>0?-w*.35:p.onGround&&p.landTime>0?w*.34:0;ctx.translate(pivot,0);ctx.rotate(pitch);ctx.translate(-pivot,0);drawDancingSprite(s,w,h,time,p.shuffle,Math.abs(p.vx)>5,p);
  }
 }ctx.restore();
}

function drawGate(){let x=END-camera;if(x>viewWidth+100||x<-200)return;rect(x-60,230,15,230,'#962e3a');rect(x+100,230,15,230,'#962e3a');rect(x-64,238,23,10,'#f6c16a');rect(x+96,238,23,10,'#f6c16a');rect(x-83,210,221,18,'#304e50');rect(x-69,194,191,16,'#4b7670');rect(x-51,181,155,13,'#65928a');rect(x-35,170,123,11,'#82a491');rect(x-75,226,206,10,'#e4a44f');rect(x-18,241,104,42,'#422d3e');rect(x-15,244,98,36,'#bd8844');text('福',x+34,271,26,'#452d35');text('FINISH',x+31,320,16);for(let side of[-1,1]){let lx=x+30+side*67;rect(lx-9,276,18,25,'#d9413d');rect(lx-6,277,4,23,'#f39442');rect(lx-6,273,12,4,'#e9bd66');rect(lx-1,301,2,13,'#d99043')}}
function draw(){ctx.clearRect(0,0,viewWidth,viewHeight);let t=game.state==='title'?performance.now()/1000:game.time;rect(0,0,viewWidth,viewHeight,'#402d42');if(bg.complete&&bg.naturalWidth){let bh=Math.max(640,viewHeight+100),bw=Math.max(960,viewWidth);let offset=(camera*MAPS[selectedMap].parallax)%bw;ctx.drawImage(bg,-offset,-60,bw,bh);ctx.drawImage(bg,bw-offset,-60,bw,bh);ctx.fillStyle='#211b2c22';ctx.fillRect(0,0,viewWidth,viewHeight);}ctx.save();if(shake>0)ctx.translate(Math.random()*shake-shake/2,Math.random()*shake-shake/2);
 drawSkyFireworks(t);
 ctx.translate(0,worldOffsetY-Math.round(cameraY));
 // The distant spectators sit behind the performance route.
 for(let i=0;i<55;i++){let x=i*27-(camera*.55)%27;person(x,475+(i%3)*3,i)}
 for(const a of game.platforms)drawPlatform(a);drawGate();
 for(const e of game.envelopes){if(e.taken)continue;let x=e.x-camera,y=e.y+Math.sin(t*3+e.x)*4;if(x<-20||x>viewWidth+20)continue;rect(x-8,y-12,16,23,'#542637');rect(x-7,y-13,14,20,'#e44e3c');rect(x-5,y-11,10,2,'#ffd379');rect(x-3,y-6,6,6,'#f4c45b');rect(x-1,y-8,2,10,'#fce196');if(e.cluster!==null){rect(x-9,y-15,18,2,'#ffd870');if(Math.sin(t*5+e.x)>.6){rect(x+10,y-10,2,6,'#fff1b3');rect(x+8,y-8,6,2,'#fff1b3')}}}
 for(const h of game.firecrackers)drawFirecrackers(h,t);
 for(let i=0;i<photographers.length;i++){let h=photographers[i],x=h.x-camera,phase=game.photoPhase(h);person(x,460,i,true,phase>2.65&&phase<3.05);if(phase>1.8&&phase<2.65)text('!',x,386,20,'#ffe087')}
 if(game.state==='title'){drawLion({x:game.platforms[2].x+game.platforms[2].w/2,y:game.platforms[2].y,onGround:true,face:-1,vx:15,rise:0,inv:0},t);}else drawLion(game.p,t);
 for(const p of particles){rect(p.x-camera,p.y,5,3,p.color)}
 if(game.state==='won'){for(let i=0;i<65;i++){let x=(i*37+t*23)%960,y=(i*63+t*65)%540;rect(x,y,4,7,['#edbc59','#da594c','#d4dfb4'][i%3])}}
 ctx.restore();}
function hud(){document.body.classList.toggle('game-playing',game.state==='playing');let p=game.p;$('#lives').textContent='♥ '.repeat(game.lives)+'♡ '.repeat(3-game.lives);$('#lives').setAttribute('aria-label',`${game.lives} lives`);$('#score').textContent=String(Math.floor(game.score)).padStart(6,'0');$('#progress').style.width=`${Math.min(100,game.distance/END*100)}%`;const stageIndex=p.x<1640?0:p.x<3160?1:p.x<5050?2:p.x<7110?3:4;$('#stage').textContent=`0${stageIndex+1} · ${MAPS[selectedMap].stages[stageIndex]}`;$('#stance').textContent=p.rise>0?`✦ FLASH SAFE · ${p.rise.toFixed(1)}s`:p.cooldown>0?`RISE READY IN ${p.cooldown.toFixed(1)}s`:!p.onGround&&p.highJump?'HIGH LEAP · STEER YOUR LANDING':p.shuffle?'SHUFFLE · BRAKING + FLASH SAFE':p.momentum?'RUN MOMENTUM · RELEASE TO STOP':'↑ RISE · FLASH SAFE + STYLE POINTS';$('#status').textContent=game.state==='playing'?'THE SHOW IS ON':game.state==='paused'?'TAKE A BREATHER':game.state==='won'?'GOOD FORTUNE!':game.state==='lost'?'UNTIL THE NEXT DANCE':'READY TO DANCE';}
function showOverlay(kind){const overlay=$('#overlay');overlay.classList.remove('hidden');const won=kind==='won',lost=kind==='lost';overlay.innerHTML=`<div class="start-content"><span class="eyebrow">${won?'THE FESTIVAL IS YOURS':lost?'EVERY LEGEND STARTS SOMEWHERE':'TAKE A BREATHER'}</span><h2 class="result-title">${won?'GOOD FORTUNE!':lost?'THE DANCE ENDS':'PAUSED'}</h2><p class="result-copy">${won?`You reached the golden gate with ${game.lives} ${game.lives===1?'life':'lives'}.<br>Final score: ${String(Math.floor(game.score)).padStart(6,'0')}`:lost?'Your three lives are spent.<br>Watch for warnings. Shuffle beneath camera flashes.':'Your lion is waiting. Pick up the rhythm.'}</p><button id="continue" class="primary">${kind==='paused'?'KEEP DANCING':'DANCE AGAIN'} <span>▸</span></button><button id="change-map" class="secondary">CHOOSE ANOTHER MAP</button><p class="press">PRESS ENTER</p></div>`;$('#continue').onclick=()=>kind==='paused'?togglePause():start();$('#pause').disabled=won||lost;$('#change-map').onclick=async()=>{if(document.fullscreenElement)await document.exitFullscreen();chooseMap(selectedMap);if(mobileLayout.matches){openMobileMenu();return;}document.querySelector('.map-picker').scrollIntoView({behavior:'smooth',block:'center'});document.querySelector(`[data-map="${selectedMap}"]`).focus();};}
function start(){if(!artReady||!bg.naturalWidth)return;game.reset(undefined,selectedMap);pressed.jump=false;pressed.up=false;enableAudio();camera=0;cameraY=0;particles=[];cheerUntil=0;firePops.clear();$('#overlay').classList.add('hidden');$('#pause').disabled=false;$('#pause').textContent='Ⅱ';$('#pause').setAttribute('aria-label','Pause game');showText=2;$('#message').textContent='LET THE DANCE BEGIN!';sound('rise');}
function togglePause(){if(game.state==='playing'){game.state='paused';showOverlay('paused');$('#pause').textContent='▶';$('#pause').setAttribute('aria-label','Resume game')}else if(game.state==='paused'){game.state='playing';$('#overlay').classList.add('hidden');$('#pause').textContent='Ⅱ';$('#pause').setAttribute('aria-label','Pause game')}}
function mapKey(code){return{ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowDown:'down',KeyS:'down',ArrowUp:'up',KeyW:'up',Space:'jump',KeyZ:'jump'}[code]}
window.addEventListener('keydown',e=>{if(mobileMenu?.open)return;let k=mapKey(e.code);if(k){e.preventDefault();keys[k]=true;if(!e.repeat&&(k==='jump'||k==='up'))pressed[k]=true}if(e.repeat)return;if(e.code==='Enter'){if(game.state==='paused')togglePause();else if(game.state!=='playing')start()}if(e.code==='KeyP'||e.code==='Escape')togglePause()});window.addEventListener('keyup',e=>{let k=mapKey(e.code);if(k){e.preventDefault();keys[k]=false}});window.addEventListener('blur',()=>{Object.keys(keys).forEach(k=>keys[k]=false);if(game.state==='playing')togglePause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.state==='playing')togglePause()});
const titleTemplate=$('#overlay').innerHTML;
function chooseMap(id){selectedMap=id;game.reset(undefined,id);game.state='title';camera=0;cameraY=0;particles=[];cheerUntil=0;firePops.clear();music?.setPlaying(false);for(const k of Object.keys(keys))keys[k]=false;$('#overlay').innerHTML=titleTemplate;$('#overlay').classList.remove('hidden');$('#start').onclick=start;$('#start').disabled=true;$('#start').textContent='LOADING THE STAGE…';$('#pause').disabled=true;$('#zone').textContent=MAPS[id].zone;$('#overlay .eyebrow').textContent=MAPS[id].name;$('#message').textContent='';showText=0;for(const b of document.querySelectorAll('[data-map]'))b.setAttribute('aria-pressed',String(b.dataset.map===id));bg.src=MAPS[id].asset;readyUI();}
for(const b of document.querySelectorAll('[data-map]'))b.onclick=()=>{chooseMap(b.dataset.map);resumeAfterMenu=false;if(mobileMenu.open)closeMobileMenu()};
$('#start').onclick=start;$('#pause').onclick=togglePause;$('#sound').onclick=()=>{soundOn=!soundOn;$('#sound').textContent=soundOn?'MUSIC ON':'MUSIC OFF';$('#sound').setAttribute('aria-pressed',soundOn);$('#sound').setAttribute('aria-label',soundOn?'Mute festival music and effects':'Enable festival music and effects');enableAudio();music?.setPlaying(soundOn&&game.state==='playing')};$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#cabinet').requestFullscreen()}catch{$('#message').textContent='FULL SCREEN IS NOT AVAILABLE HERE';showText=3}};
const mobileLayout=matchMedia('(max-width:800px), (pointer:coarse) and (max-width:1400px)');
const mobileMenu=$('#mobile-menu'), menuButton=$('#mobile-menu-button');
const mapPicker=$('.map-picker'), tools=$('.tools');
const mapHome=document.createComment('map picker'), toolsHome=document.createComment('tools');
mapPicker.before(mapHome);tools.before(toolsHome);
let resumeAfterMenu=false, viewWidth=960, viewHeight=540, worldOffsetY=0;
const touchPointers=new Map();
function clearTouch(){touchPointers.clear();Object.keys(keys).forEach(k=>keys[k]=false);pressed.jump=false;pressed.up=false;document.querySelectorAll('[data-touch]').forEach(b=>b.classList.remove('is-held'));}
function closeMobileMenu(){mobileMenu.close();menuButton.setAttribute('aria-expanded','false');if(resumeAfterMenu&&game.state==='paused')togglePause();resumeAfterMenu=false;menuButton.focus();}
function openMobileMenu(){clearTouch();resumeAfterMenu=game.state==='playing';if(resumeAfterMenu)togglePause();mobileMenu.showModal();menuButton.setAttribute('aria-expanded','true');}
menuButton.onclick=openMobileMenu;$('#close-mobile-menu').onclick=closeMobileMenu;$('#resume-mobile').onclick=closeMobileMenu;
mobileMenu.addEventListener('cancel',e=>{e.preventDefault();closeMobileMenu()});
function layoutGame(){
 if(mobileLayout.matches){$('#mobile-options').append(mapPicker,tools);}else{if(mobileMenu.open)closeMobileMenu();mapHome.after(mapPicker);toolsHome.after(tools);}
 const box=$('.screen').getBoundingClientRect();
 viewWidth=mobileLayout.matches?Math.max(480,540*box.width/box.height):960;
 viewHeight=mobileLayout.matches?viewWidth*box.height/box.width:540;
 canvas.width=Math.round(viewWidth);canvas.height=Math.round(viewHeight);ctx.imageSmoothingEnabled=false;
 worldOffsetY=(viewHeight-540)*.4;clearTouch();
}
mobileLayout.addEventListener('change',layoutGame);window.addEventListener('resize',layoutGame);layoutGame();
function syncTouch(){
 const active=new Set(touchPointers.values());
 keys.left=active.has('left');keys.right=active.has('right');keys.jump=active.has('jump');keys.up=active.has('rise');
 document.querySelectorAll('[data-touch]').forEach(b=>b.classList.toggle('is-held',active.has(b.dataset.touch)));
}
for(const b of document.querySelectorAll('[data-touch]')){
 b.addEventListener('contextmenu',e=>e.preventDefault());
 b.addEventListener('pointerdown',e=>{e.preventDefault();if(game.state!=='playing'||mobileMenu.open)return;touchPointers.set(e.pointerId,b.dataset.touch);syncTouch();if(b.dataset.touch==='jump')pressed.jump=true;if(b.dataset.touch==='rise')pressed.up=true;b.setPointerCapture(e.pointerId);});
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,e=>{touchPointers.delete(e.pointerId);syncTouch();});
}
window.addEventListener('blur',clearTouch);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTouch()});
let last=performance.now();function frame(now){let dt=Math.min((now-last)/1000,.033);last=now;let before=game.state;game.update(dt,{...keys,jump:keys.jump||pressed.jump,jumpPressed:pressed.jump,up:keys.up||pressed.up});pressed.jump=false;pressed.up=false;if(game.state==='playing'){let target=Math.max(0,Math.min(END-viewWidth*.77,game.p.x-viewWidth*.31));camera+=(target-camera)*Math.min(1,dt*7);const verticalTarget=Math.min(0,Math.max(-330,game.p.y-230));cameraY+=(verticalTarget-cameraY)*Math.min(1,dt*7);particles=particles.filter(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=230*dt;p.life-=dt;return p.life>0});}music?.setPlaying(soundOn&&game.state==='playing');for(const event of game.events.splice(0)){if(event.text){$('#message').textContent=event.text;showText=2.2}if(['jump','rise','hit','coin','bonus','win'].includes(event.type))sound(event.type);if(event.type==='cheer'){cheerUntil=game.time+2.2;if(soundOn)music?.cheer();}if(event.type==='coin'||event.type==='bonus')confetti(game.p.x,game.p.y-60);if(event.type==='hit'){shake=14;camera=Math.max(0,game.p.x-viewWidth*.31);cameraY=0}}if(before==='playing'&&(game.state==='lost'||game.state==='won'))showOverlay(game.state);if(game.state!=='paused'){showText-=dt;if(showText<=0)$('#message').textContent='';shake=Math.max(0,shake-dt*40)}draw();hud();requestAnimationFrame(frame)}requestAnimationFrame(frame);
// Read-only snapshot for local gameplay verification.
window.luckyLion={snapshot:()=>({state:game.state,map:selectedMap,lives:game.lives,score:game.score,x:game.p.x,y:game.p.y,artReady,spriteCount:sprites.length})};
