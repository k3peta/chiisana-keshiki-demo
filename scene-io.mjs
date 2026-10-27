import{verifiedLocalAsset}from'./public-placement.mjs';
import{botanicalAsset}from'./ground-terrain.mjs';
import{validate}from'./state.mjs';
import{sceneVersions,checkSceneVersions}from'./assets.mjs';
export function exportScene(state,catalog){return {...state,assetVersions:sceneVersions(state,catalog),assetRefs:catalog.filter(a=>state.objects.some(o=>o.assetId===a.id)).map(a=>({id:a.id,name:a.name,sha256:a.sha256,unit:a.unit||1,...(a.publicRelease?{publicRelease:true}:{})}))}}
export function prepareScene(raw,catalog){
 let refs=raw.assetRefs||[];if(!Array.isArray(refs)||refs.length>40)throw Error('素材参照が不正です');let used=new Set((raw.objects||[]).map(o=>o.assetId)),seen=new Set();
 for(let a of refs){if(!a||typeof a.id!=='string'||!used.has(a.id)||seen.has(a.id)||typeof a.name!=='string'||! /^[a-f0-9]{64}$/.test(a.sha256)||![1,.01,.001].includes(a.unit))throw Error('素材参照・単位が不正です');seen.add(a.id)}
 let next=validate(raw,[...new Set([...catalog.map(a=>a.id),...refs.map(a=>a.id)])]);let merged=catalog.map(a=>({...a}));
 for(let a of refs){let known=botanicalAsset(a.sha256,a.unit)||verifiedLocalAsset(a.sha256,a.unit),old=merged.find(v=>v.id===a.id);if(known&&known.id===a.id&&old)old.category=known.category;if(old){if((old.sha256&&old.sha256!==a.sha256)||(old.unit||1)!==a.unit)throw Error(a.id+'の素材版または単位が一致しません');if(!old.sha256)old.sha256=a.sha256}else merged.push({...((known&&known.id===a.id)?known:{}),...a,genre:'作品の追加素材',revision:'scene',license:'利用者が確認'})}
 checkSceneVersions(next,merged);let missing=merged.filter(a=>used.has(a.id)&&!a.file&&!a.localFile);return{scene:next,catalog:merged,missing};
}
export function attachSceneFile(pending,file,hash){let matched=pending.missing.filter(a=>a.sha256===hash);if(!matched.length)throw Error('このGLBは作品が要求する素材と一致しません。元と同じファイルを選んでください');for(let a of matched){let entry=pending.catalog.find(v=>v.id===a.id);entry.localFile=file}pending.missing=pending.missing.filter(a=>a.sha256!==hash);return matched.length}
