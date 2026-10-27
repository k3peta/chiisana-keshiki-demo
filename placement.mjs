import{point,transform}from'./engine.mjs';
import{isTerrainAsset,isGround,surfaceHeight}from'./ground-terrain.mjs';
export const groundModels={};
// Exact public ZIP identities, not prefix aliases. Geometry verified against catalog GLB SHA256.
const supportAliases={pub_FT_002_198469072213:'FT_002',pub_FT_051_45e7f9494f14:'FT_051'};
// Model-specific surfaces, measured from GLB semantic parts. Never use overall bbox maximum.
export const surfaces=new Proxy({
 WS_010:[{id:'desktop',name:'研究机の天板',height:.8225000202655792,x:[-.84,.84],z:[-.43,.43]}],
 WS_011:[{"id": "shelf-1", "name": "書架の開架 1", "height": 1.0225000008940697, "x": [-0.54, 0.54], "z": [-0.21, 0.18]}, {"id": "shelf-2", "name": "書架の開架 2", "height": 1.4925000295042992, "x": [-0.54, 0.54], "z": [-0.21, 0.18]}, {"id": "shelf-3", "name": "書架の開架 3", "height": 1.9625000581145287, "x": [-0.54, 0.54], "z": [-0.21, 0.18]}],
 FT_045__repair:[{id:'floor-top',name:'板床の上面',height:.09999999403953552,x:[-1,1],z:[-1,1]}],
 FT_046__color:[{id:'floor-top',name:'石タイルの上面',height:.10000000149011612,x:[-1,1],z:[-1,1]}],
 FT_002:[{id:'tabletop',name:'テーブルの上',height:.7600000128149986,x:[-1.095,1.095],z:[-.455,.455]}],
 FT_051:[{id:'cover',name:'本の上',height:.04699999839067459,x:[-.105,.105],z:[-.14,.14],obstacles:[
  {x:[.0179,.113],z:[-.018,.018],height:.05245000123977661},
  {x:[.081,.112],z:[.115,.147],height:.04865001},{x:[.081,.112],z:[-.147,-.115],height:.04865001},
  {x:[-.108,-.055],z:[.105,.142],height:.04843193},
  {x:[-.103,.103],z:[-.138,.138],height:.04774458}]}]
},{get:(target,id)=>target[id]||target[supportAliases[id]]||(typeof id==='string'&&isTerrainAsset(id)?[{id:'ground',name:'地形の地表',height:0,x:[-1,1],z:[-1,1]}]:undefined)});
export const wrap=d=>((d+180)%360+360)%360-180;
export function rotateItem(o,degrees,axis='Y'){if(axis==='Y')o.rotation=wrap(o.rotation+degrees);else{if(!o.tilt)o.tilt=[0,0];let i=axis==='X'?0:1;o.tilt[i]=wrap(o.tilt[i]+degrees)}}
export const horizontal=o=>(o.tilt||[0,0]).every(v=>Math.abs(wrap(v))<.001);
export function bottom(item,geometry){if(horizontal(item))return geometry.bounds.min[1]*item.scale;let m=transform({...item,position:[0,0,0]}),low=Infinity;for(let v of geometry.vertices)low=Math.min(low,point(m,v)[1]);return low}
export function descendants(objects,id){let result=new Set([id]);for(let again=true;again;){again=false;for(let o of objects)if(o.support&&result.has(o.support.id)&&!result.has(o.id)){result.add(o.id);again=true}}return result}
function localXZ(item,parent){let a=parent.rotation*Math.PI/180,c=Math.cos(a),s=Math.sin(a),dx=item.position[0]-parent.position[0],dz=item.position[2]-parent.position[2];return [(c*dx-s*dz)/parent.scale,(s*dx+c*dz)/parent.scale]}
function contactHeight(item,geometry,parent,surface,offset){let m=transform({...item,position:[0,0,0],rotation:item.rotation-parent.rotation,scale:item.scale/parent.scale}),xs=[],zs=[];for(let x of [geometry.bounds.min[0],geometry.bounds.max[0]])for(let y of [geometry.bounds.min[1],geometry.bounds.max[1]])for(let z of [geometry.bounds.min[2],geometry.bounds.max[2]]){let p=point(m,[x,y,z]);xs.push(p[0]+offset[0]);zs.push(p[2]+offset[1])}let h=surface.height;if(surface.id==='ground'){let heights=[];for(let x of [Math.min(...xs),Math.max(...xs),(Math.min(...xs)+Math.max(...xs))/2])for(let z of [Math.min(...zs),Math.max(...zs),(Math.min(...zs)+Math.max(...zs))/2]){let value=surfaceHeight(groundModels[parent.assetId]?.groundTriangles,x,z);if(value!==null)heights.push(value)}h=heights.length?Math.max(...heights):0;}for(let b of surface.obstacles||[])if(Math.max(...xs)>=b.x[0]&&Math.min(...xs)<=b.x[1]&&Math.max(...zs)>=b.z[0]&&Math.min(...zs)<=b.z[1])h=Math.max(h,b.height);return parent.position[1]+h*parent.scale}
export function candidate(item,geometry,parent,surface){if(!horizontal(parent)||(surface.id==='ground'&&!isGround(parent)))return null;let offset=localXZ(item,parent);if(offset[0]<surface.x[0]||offset[0]>surface.x[1]||offset[1]<surface.z[0]||offset[1]>surface.z[1])return null;return {parent,surface,offset,height:contactHeight(item,geometry,parent,surface,offset)}}
export function attach(item,geometry,c){if(!c){delete item.support;item.position[1]=-bottom(item,geometry);return}item.position[1]=c.height-bottom(item,geometry);item.support={id:c.parent.id,surface:c.surface.id,offset:c.offset,yaw:wrap(item.rotation-c.parent.rotation)}}
export function autoSnap(scene,item,models,{vertical=false,force=false}={}){if(isGround(item)||item.modelOrigin===true)return false;let geometry=models[item.assetId],base=item.position[1]+bottom(item,geometry),excluded=descendants(scene.objects,item.id),candidates=[];for(let parent of scene.objects){if(excluded.has(parent.id))continue;for(let surface of surfaces[parent.assetId]||[]){let c=candidate(item,geometry,parent,surface);if(c&&(force||Math.abs(c.height-base)<(vertical?.12:.9)))candidates.push(c)}}candidates.sort((a,b)=>vertical?Math.abs(a.height-base)-Math.abs(b.height-base):b.height-a.height);let c=candidates[0];if(c){attach(item,geometry,c);return true}delete item.support;if(!vertical||Math.abs(base)<.12||force){attach(item,geometry,null);return true}return false}
export function snapNamed(scene,item,models,parentId,surfaceId){if(item.modelOrigin)throw Error('この地形はモデル原点を保持します。高さは数値で調整してください');if(parentId==='floor'){attach(item,models[item.assetId],null);return}if(descendants(scene.objects,item.id).has(parentId))throw Error('自分や上に積んだ物には置けません');let parent=scene.objects.find(o=>o.id===parentId),surface=surfaces[parent?.assetId]?.find(s=>s.id===surfaceId);if(!parent||!surface)throw Error('支持面未対応です');let c=candidate(item,models[item.assetId],parent,surface);if(!c)throw Error('まず小物を支持面の上へ動かしてください。遠い置き場所へは移動しません');attach(item,models[item.assetId],c)}
export function reconcile(scene,models){let done=new Set(),visiting=new Set();function update(o){if(done.has(o.id))return;if(visiting.has(o.id))throw Error('支持関係が循環しています');visiting.add(o.id);if(o.support){let parent=scene.objects.find(p=>p.id===o.support.id),surface=surfaces[parent?.assetId]?.find(s=>s.id===o.support.surface);if(!parent||!surface){delete o.support}else{update(parent);if(!horizontal(parent)){delete o.support}else{let a=parent.rotation*Math.PI/180,c=Math.cos(a),s=Math.sin(a),[x,z]=o.support.offset;o.position[0]=parent.position[0]+parent.scale*(c*x+s*z);o.position[2]=parent.position[2]+parent.scale*(-s*x+c*z);o.rotation=wrap(parent.rotation+o.support.yaw);let contact=candidate(o,models[o.assetId],parent,surface);if(contact)o.position[1]=contact.height-bottom(o,models[o.assetId]);else delete o.support}}}visiting.delete(o.id);done.add(o.id)}for(let o of scene.objects)update(o)}
export function projectedBounds(bounds,model,vp){let pts=[];for(let x of [bounds.min[0],bounds.max[0]])for(let y of [bounds.min[1],bounds.max[1]])for(let z of [bounds.min[2],bounds.max[2]]){let p=point(vp,point(model,[x,y,z]));if(p[3]<=.03)return null;pts.push([p[0]/p[3],p[1]/p[3]])}return {right:Math.max(...pts.map(p=>p[0])),top:Math.max(...pts.map(p=>p[1])),left:Math.min(...pts.map(p=>p[0])),bottom:Math.min(...pts.map(p=>p[1]))}}

// Explicit move, distinct from height-only snap. commit() keeps failed placements atomic.
export function centerOnSupport(scene,item,models,parentId,surfaceId){
 if(parentId==='floor'){snapNamed(scene,item,models,'floor');return}
 if(descendants(scene.objects,item.id).has(parentId))throw Error('自分や上に積んだ物には置けません');
 const parent=scene.objects.find(p=>p.id===parentId),surface=surfaces[parent?.assetId]?.find(s=>s.id===surfaceId);
 if(!parent||!surface||!horizontal(parent))throw Error('この支持面には中央配置できません');
 const x=(surface.x[0]+surface.x[1])/2,z=(surface.z[0]+surface.z[1])/2,a=parent.rotation*Math.PI/180;
 item.position[0]=parent.position[0]+parent.scale*(Math.cos(a)*x+Math.sin(a)*z);
 item.position[2]=parent.position[2]+parent.scale*(-Math.sin(a)*x+Math.cos(a)*z);
 snapNamed(scene,item,models,parentId,surfaceId);
}

export function assertSupportAsset(asset){
 const expected={"WS_010":"d6cd30625c756f1197e5bd7d02cd853f30bdcac19c066c652eebdeaab0e6404a","WS_011":"936cd6218736c050b63076be33daf93fd0ded184dd7904eb9e8ae387f92d8361","FT_045__repair":"d488d509f9326fa782c1dc9738378e4f47294fcdc5fa8737dd09a2bdc3a28e30","FT_046__color":"dfbd71f88d7d403175888d840ffaa3df58b513c579356dba35c444cef1a46cd4",pub_FT_002_198469072213:'938fe7a1523b406124012dd9d7dd68944a61779ed0c11eb9bb309cbbf6c34d06',pub_FT_051_45e7f9494f14:'e2c1500eb96f31402a823877f4af3ab766003a60168a39dd442709f6f642bbbd'}[asset.id];
 if(expected&&(asset.sha256!==expected||(asset.unit||1)!==1))throw Error('支持面の登録版または単位が一致しません');
}
