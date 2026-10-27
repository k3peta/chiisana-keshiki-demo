import{lighting}from'./lighting.mjs';
// No new dependencies. Unknown license evidence fails closed.
export const packageStates=()=>({package:'complete',macBuild:'not_built',windowsBuild:'not_built',runtimeQA:'not_tested',signing:'not_performed',notarization:'not_performed',distribution:'not_ready'});
export function base64Bytes(bytes){let a=new Uint8Array(bytes),s='';for(let i=0;i<a.length;i+=8192)s+=String.fromCharCode(...a.subarray(i,i+8192));return btoa(s)}
export async function makeWorkExport(scene,catalog,evidence,readModel,hash,readRuntime){
 let files={},assets=[];const put=(path,text)=>files[path]=base64Bytes(new TextEncoder().encode(text));
 for(let id of new Set(scene.objects.map(o=>o.assetId))){let a=catalog.find(a=>a.id===id),proof=evidence[id];if(!a||!proof||proof.sha256!==a.sha256||proof.license!=='CC0-1.0'||!proof.text.includes('CC0'))throw Error(id+'：同じ版のライセンス根拠が未登録です。公開用パッケージは作成していません');let bytes=await readModel(a);if(bytes.byteLength>80*1024*1024||await hash(bytes)!==a.sha256)throw Error('素材のサイズまたはハッシュが不正です');let row={id:a.id,name:a.name,sha256:a.sha256,unit:a.unit||1,category:a.category||'',license:'CC0-1.0',file:'models/'+a.sha256+'.glb',licenseFile:'licenses/'+a.id+'.txt'};files[row.file]=base64Bytes(bytes);put(row.licenseFile,proof.text);assets.push(row)}
 for(let name of evidence.$runtime){put('runtime/'+name,await readRuntime(name))}
 const work={format:'chiisana-work',version:1,id:'work-'+crypto.randomUUID(),title:'小さな景色の作品',assets,lighting:{type:'directional-plus-ambient',...lighting(scene.lighting)},states:packageStates(),dependencies:[{name:'Application renderer',license:'proprietary; source not publicly licensed'},{name:'OS host',license:'build separately; not included'}]};
 put('work.json',JSON.stringify(work,null,2));put('author.scene.json',JSON.stringify(scene,null,2));put('PLAY.md','作者構図から開きます。編集・保存・作者リセットはOS別ホストで行います。作品パッケージの生成だけでは配布できません。');put('DEPENDENCIES.md','モデルはlicenses内のCC0根拠を参照。OSホストとその依存は別ビルド工程。署名・公証・配布確認は未実施。');return{format:'chiisana-work-transfer',version:1,files};
}
