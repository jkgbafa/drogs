import test from 'node:test';
import assert from 'node:assert/strict';
import frames from '../data/portrait-framing.json' with {type:'json'};
import {focalPosition} from '../src/runtime/portrait-framing.js';
test('portrait crops preserve the visible detected face for every current image',()=>{
 for(const [path,f] of Object.entries(frames)){
  if(!f.face)continue;
  const [x,y,w,h]=f.face,sr=f.width/f.height,visible=[Math.min(1,.8/sr),Math.min(1,sr/.8)],position=focalPosition(f);
  const start=position.map((p,i)=>p/100*(1-visible[i]));
  assert(Math.max(0,x)>=start[0]-.001&&Math.min(1,x+w)<=start[0]+visible[0]+.001,path+' horizontal face crop');
  assert(Math.max(0,y)>=start[1]-.001&&Math.min(1,y+h)<=start[1]+visible[1]+.001,path+' vertical face crop');
 }
});
