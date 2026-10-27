// Deliberate display approximation, not physical transmission/refraction.
export function transmissionDisplay(material={}) {
 const ext=material.extensions?.KHR_materials_transmission;
 if(!ext)return null;
 const t=ext.transmissionFactor??0;
 if(!Number.isFinite(t)||t<0||t>1)return {notice:'透過率が不正なため不透明表示',opacity:1};
 if(t===0)return null;
 if(ext.transmissionTexture||material.alphaMode&&material.alphaMode!=='OPAQUE')return {notice:'この透過テクスチャ・アルファ併用は未対応のため不透明表示',opacity:1};
 return {opacity:1-t,doubleSided:material.doubleSided===true,notice:'簡易透過表示（屈折・厚み・物理的なTransmissionは未対応）'};
}
// Sort across all objects, per triangle, after the opaque pass.
export function transparentOrder(queue){return queue.sort((a,b)=>b.depth-a.depth)}
