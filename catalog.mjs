// Metadata-only catalog. Importing a manifest never downloads its models or previews.
export const genreNames={FT:'酒場',AT:'骨董屋',FH:'港',OL:'ランプ店',local:'ローカル'};
export function genre(a){return a.genre||genreNames[a.id.split('_')[0]]||'その他'}
export function normalizeManifest(data,base){
 const rows=Array.isArray(data)?data:data.items||[data];if(!Array.isArray(rows)||rows.length>2000)throw Error('台帳は2000件以内にしてください');
 const seen=new Set();return rows.map(row=>{let id=row.asset_id||row.id;if(typeof id!=='string'||!/^[-\w]{1,80}$/.test(id)||seen.has(id))throw Error('素材IDが不正または重複しています');seen.add(id);
 if(row.license!=='CC0-1.0')throw Error(id+'：この試作ではCC0-1.0の台帳のみ対応しています');
 const hash=row.glb_sha256||row.files?.['model.glb']?.sha256||row.sha256;if(hash!==undefined&&!/^[a-f0-9]{64}$/.test(hash))throw Error(id+'：GLBハッシュが不正です');
 let file=row.glb_url||row.glb_file||(row.file?.endsWith('.glb')?row.file:null);if(file){if(!hash)throw Error(id+'：GLBのSHA256が必要です');if(base){let url=new URL(file,base);if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname)))throw Error('素材URLはHTTPSかlocalhostにしてください');if(url.username||url.password)throw Error('認証情報入りURLには対応しません');file=url.href}else file=null}
 return {id,name:String(row.names?.ja||row.name||id).slice(0,160),category:String(row.category||''),genre:genreNames[row.theme]||genre({id}),license:row.license,revision:row.revision||'external',sha256:hash,file,available:!!file};
 });
}
export function mergeCatalog(current,incoming){let next=current.map(a=>({...a}));for(let a of incoming){let old=next.find(v=>v.id===a.id);if(old){if(a.sha256&&old.sha256&&a.sha256!==old.sha256)throw Error(a.id+'：既存素材と版が異なります');Object.assign(old,{category:a.category||old.category,genre:a.genre||old.genre});if(!old.sha256&&a.sha256)Object.assign(old,a)}else next.push(a)}return next}
export function filterCatalog(catalog,query='',selectedGenre=''){let q=query.trim().toLocaleLowerCase();return catalog.filter(a=>(!selectedGenre||genre(a)===selectedGenre)&&(!q||[a.id,a.name,a.category,genre(a)].join(' ').toLocaleLowerCase().includes(q)))}
export function inspectGLB(bytes){if(bytes.byteLength<28)throw Error('GLBが破損しています（データが短すぎます）');if(bytes.byteLength>80*1024*1024)throw Error('GLBは80MB以内にしてください');let d=new DataView(bytes);if(d.getUint32(0,true)!==0x46546c67||d.getUint32(4,true)!==2||d.getUint32(8,true)!==bytes.byteLength||d.getUint32(16,true)!==0x4e4f534a)throw Error('GLB 2.0ではありません');let n=d.getUint32(12,true);if(20+n+8>bytes.byteLength)throw Error('GLBが破損しています');let j=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,n)));if((j.buffers||[]).some(v=>v.uri)||(j.images||[]).some(v=>v.uri))throw Error('外部画像・バッファを参照するGLBは未対応です');if(j.extensionsRequired?.length||j.skins?.length||j.animations?.length)throw Error('圧縮・必須拡張・スキン・アニメーションは未対応です');if((j.accessors||[]).some(a=>a.sparse||a.bufferView===undefined||![5126,5125,5123,5121].includes(a.componentType)||!['SCALAR','VEC2','VEC3','VEC4'].includes(a.type)))throw Error('このGLBのアクセサ形式は未対応です');return j}
export function localId(hash,unit){return 'local_'+hash.slice(0,32)+'_'+String(unit).replace('.','p')}
export async function connectPack(current,files){
 if(files.length>15000)throw Error('ファイル数が多すぎます');let manifests=files.filter(f=>f.name==='manifest.json'),next=current.map(a=>({...a})),linked=0;
 for(let f of manifests){if(f.size>5*1024*1024)throw Error('台帳JSONは5MB以内にしてください');let data=JSON.parse(await f.text());next=mergeCatalog(next,normalizeManifest(data));if(data.asset_id){let dir=f.webkitRelativePath.slice(0,-f.name.length),glb=files.find(v=>v.webkitRelativePath===dir+'model.glb');if(glb){let a=next.find(a=>a.id===data.asset_id);if(glb.size>80*1024*1024)throw Error(a.id+'は80MBを超えます');a.localFile=glb;linked++}}}
 if(!manifests.length)throw Error('manifest.jsonが見つかりません。単品GLB読込みも使えます');return {catalog:next,linked};
}
