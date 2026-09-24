// Original pentatonic festival tune, synthesized locally: reed lead, plucked strings,
// barrel drums, cymbals and gong. No recordings or network audio requests.
export class FestivalMusic{
 constructor(context){this.ctx=context;this.bus=context.createGain();this.bus.gain.value=0;this.bus.connect(context.destination);this.playing=false;this.step=0;this.next=0;this.noise=context.createBuffer(1,context.sampleRate,context.sampleRate);let d=this.noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;this.timer=setInterval(()=>this.schedule(),25)}
 setPlaying(on){if(this.playing===on)return;this.playing=on;const t=this.ctx.currentTime;this.bus.gain.cancelScheduledValues(t);this.bus.gain.setTargetAtTime(on?.38:0,t,.035);if(on){this.ctx.resume();this.next=t+.04;}}
 tone(freq,t,duration,volume,type='triangle',bend=1){let o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(freq*bend,t+duration);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(this.bus);o.start(t);o.stop(t+duration+.02)}
 noiseHit(t,duration,vol,freq){let n=this.ctx.createBufferSource(),f=this.ctx.createBiquadFilter(),g=this.ctx.createGain();n.buffer=this.noise;f.type='highpass';f.frequency.value=freq;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);n.connect(f);f.connect(g);g.connect(this.bus);n.start(t);n.stop(t+duration)}
 drum(t,strong=false){this.tone(strong?155:205,t,.23,strong?.42:.24,'sine',.3);this.noiseHit(t,.055,.075,700)}
 cymbal(t){this.noiseHit(t,.45,.095,3600);for(const f of[3730,5140,6370])this.tone(f,t,.26,.012,'square',.97)}
 gong(t){for(const [f,v]of[[98,.19],[148,.10],[207,.055],[281,.04],[421,.025]])this.tone(f,t,1.6,v,'sine',.985)}
 crackle(){if(!this.playing)return;this.noiseHit(this.ctx.currentTime,.075,.24,1400);this.tone(120,this.ctx.currentTime,.055,.12,'square',.35)}
 schedule(){if(!this.playing)return;const sixteenth=60/116/4;while(this.next<this.ctx.currentTime+.12){const s=this.step%128,b=s%16,bar=Math.floor(s/16),t=this.next;
  if([0,6,8,11,14].includes(b))this.drum(t,b===0||b===8);if(bar%2===1&&b>=12)this.drum(t,false);
  if(b===4||b===12)this.cymbal(t);if(s===0||s===64)this.gong(t);
  const melodies=[[74,76,79,81,79,76,74,69],[74,76,79,86,81,79,76,74],[79,81,86,88,86,81,79,76],[74,69,72,74,76,74,72,69],[74,79,81,86,81,79,76,79],[81,86,88,86,81,79,76,74],[79,76,74,72,74,79,76,72],[69,72,74,76,79,76,74,74]];
  if(b%2===0){const note=melodies[bar][b/2],f=440*2**((note-69)/12);this.tone(f,t,sixteenth*1.7,.074,'sawtooth');this.tone(f*2,t,sixteenth*1.5,.014,'sine');}
  if(b%4===0){const root=[50,50,55,57,50,55,57,50][bar],f=440*2**((root-69)/12);this.tone(f,t,.34,.18,'triangle');this.tone(f*4,t,.19,.045,'triangle');}
  this.step++;this.next+=sixteenth;
 }}
}
