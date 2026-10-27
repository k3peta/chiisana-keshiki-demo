// Two touches own the viewport until both lift. Objects never move in this mode.
import {trackballCamera,zoomCamera} from './orbit-camera.mjs';
export function touchCameraStep(camera,previous,current){
 const geometry=pair=>{if(pair.length!==2||pair.flat().some(v=>!Number.isFinite(v)))throw Error('タッチ座標が不正です');return {x:(pair[0][0]+pair[1][0])/2,y:(pair[0][1]+pair[1][1])/2,d:Math.max(8,Math.hypot(pair[1][0]-pair[0][0],pair[1][1]-pair[0][1]))}};
 let a=geometry(previous),b=geometry(current);
 return zoomCamera(trackballCamera(camera,(b.x-a.x)*.4,(b.y-a.y)*.4),a.d/b.d);
}
export function renderSize(cssWidth,deviceScale=1){
 const w=Number.isFinite(cssWidth)&&cssWidth>0?cssWidth:1200;
 const scale=Number.isFinite(deviceScale)?Math.min(2,Math.max(1,deviceScale)):1;
 const width=w<=760?Math.max(320,Math.min(1200,Math.round(w*scale))):1200;
 return {width,height:Math.round(width/1.6)};
}
export function installTouchCamera(viewport,api,host=window){
 const pointers=new Map();let active=false,before=null,previous=null,finished=false,promoting=false;
 const pair=()=>[...pointers.values()].slice(0,2);
 const block=e=>{e.preventDefault();e.stopImmediatePropagation()};
 function settle(cancel){if(!active||finished)return;finished=true;api.finish(before,cancel)}
 function reset(cancel){settle(cancel);active=false;before=null;previous=null;finished=false;const ids=[...pointers.keys()];pointers.clear();for(const id of ids)if(viewport.hasPointerCapture(id))viewport.releasePointerCapture(id)}
 viewport.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='touch'||!api.ready()||e.target.closest?.('button,input,select,a'))return;
  pointers.set(e.pointerId,[e.clientX,e.clientY]);
  if(pointers.size===2&&!active){promoting=true;try{api.cancelSingle()}finally{promoting=false}before=api.snapshot();active=true;previous=pair();finished=false;try{api.begin()}catch(error){reset(true);api.error(error);block(e);return}}
  if(active){block(e);if(pointers.size>2)settle(true);for(const id of pointers.keys())try{viewport.setPointerCapture(id)}catch{} }
 },true);
 viewport.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId))return;
  pointers.set(e.pointerId,[e.clientX,e.clientY]);if(!active)return;block(e);
  if(pointers.size!==2||finished)return;
  const current=pair();try{api.update(previous,current)}catch(error){api.error(error)}previous=current;
 },true);
 viewport.addEventListener('pointerup',e=>{if(!pointers.has(e.pointerId))return;if(active){block(e);settle(false)}pointers.delete(e.pointerId);if(!pointers.size)reset(false)},true);
 viewport.addEventListener('pointercancel',e=>{if(!pointers.has(e.pointerId))return;if(active)block(e);reset(true)},true);
 viewport.addEventListener('lostpointercapture',e=>{if(!active&&!promoting)pointers.delete(e.pointerId);if(active&&e.target===viewport&&pointers.has(e.pointerId))reset(true)},true);
 host.addEventListener('blur',()=>reset(true));
 host.addEventListener('keydown',e=>{if(e.key==='Escape')reset(true)});
 return {cancel:()=>reset(true),isActive:()=>active};
}
