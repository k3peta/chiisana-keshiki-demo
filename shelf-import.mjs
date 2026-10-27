import{inspectGLB}from'./catalog.mjs';
export function importTarget(catalog,id){let a=catalog.find(a=>a.id===id);if(!a?.manualImport||!/^https:\/\/github\.com\/k3peta\/tales-on-a-table\/releases\/download\//.test(a.sourceURL)||!/^[a-f0-9]{64}$/.test(a.sha256))throw Error('この素材は選択式取込みに対応していません');return a}
export async function verifySelectedFile(asset,file,hash){if(!file||file.size>8*1024*1024||file.size<28)throw Error('この棚のGLBは8MiB以内です。ZIPは展開してからGLBを選んでください');let bytes=await file.arrayBuffer();inspectGLB(bytes);if(await hash(bytes)!==asset.sha256)throw Error('選択した素材・版と一致しません。別素材や修正版を置き換えず、指定した原本GLBを選んでください');return bytes}
// Pure transactional staging: callers replace catalog only after verification succeeds.
export async function stageImport(catalog,id,file,hash){let a=importTarget(catalog,id);let bytes=await verifySelectedFile(a,file,hash);return {catalog:catalog.map(row=>row.id===id?{...row,localFile:file}:row),asset:a,bytes}}
