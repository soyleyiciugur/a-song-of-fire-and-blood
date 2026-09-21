// Preserve current edited SVG compositions and replace embedded raster layers
// with smooth, native-color vector contours. Never regenerate from old atlases.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const { trace } = require('./vectorize-dragon-sizes.cjs');
const directory = 'public/images/dragons/sizes/clean';
const backups = 'public/images/dragons/sizes/edited-sources';
const distance = (a,b) => a.reduce((sum,v,i)=>sum+(v-b[i])**2,0);
(async()=>{
  fs.mkdirSync(backups,{recursive:true});
  for(const name of fs.readdirSync(directory).filter(name=>name.endsWith('.svg'))) {
    const file=path.join(directory,name),source=fs.readFileSync(file,'utf8');
    if(!source.includes('<image'))continue;
    const backup=path.join(backups,name);
    if(fs.existsSync(backup)&&fs.readFileSync(backup,'utf8')!==source)throw new Error(`Source backup already exists: ${name}`);
    fs.writeFileSync(backup,source);
    const {data,info}=await sharp(Buffer.from(source)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const {width:w,height:h}=info,labels=new Int8Array(w*h).fill(-1),mask=new Uint8Array(w*h),hist=new Map();
    const color=p=>Array.from(data.subarray(p*4,p*4+3));
    for(let p=0;p<w*h;p++)if(data[p*4+3]>=128) {
      mask[p]=1;const c=color(p);if(Math.min(...c)>248)continue;
      const key=c.map(v=>Math.round(v/8)*8).join(',');
      const bin=hist.get(key)||{count:0,sum:[0,0,0]};bin.count++;c.forEach((v,i)=>bin.sum[i]+=v);hist.set(key,bin);
    }
    const palette=[];
    for(const bin of [...hist.values()].sort((a,b)=>b.count-a.count)) {
      const c=bin.sum.map(v=>Math.round(v/bin.count));
      if(palette.every(p=>distance(p,c)>(name==='grey-ghost.svg'?600:1800)))palette.push(c);
      if(palette.length===(name==='morghul-shrykos.svg'?3:2))break;
    }
    const queue=[];
    for(let p=0;p<mask.length;p++)if(mask[p]) {
      const c=color(p),distances=palette.map(v=>distance(v,c)),nearest=distances.indexOf(Math.min(...distances));
      if(distances[nearest]<900){labels[p]=nearest;queue.push(p);}
    }
    for(let i=0;i<queue.length;i++) {
      const p=queue[i],x=p%w,y=Math.floor(p/w);
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const xx=x+dx,yy=y+dy,n=yy*w+xx;
        if(xx>=0&&xx<w&&yy>=0&&yy<h&&mask[n]&&labels[n]===-1){labels[n]=labels[p];queue.push(n);}
      }
    }
    const paths=palette.map((c,i)=>`<path fill="rgb(${c.join(',')})" d="${trace(labels,w,h,i)}"/>`).join('');
    fs.writeFileSync(file,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${paths}</svg>\n`);
    // Silhouette area remains within a tight tolerance of the edited composition.
    const converted=await sharp(file).ensureAlpha().raw().toBuffer();
    let intersection=0,union=0;
    for(let p=0;p<mask.length;p++){const a=!!mask[p],b=converted[p*4+3]>=128;if(a&&b)intersection++;if(a||b)union++;}
    const overlap=intersection/union;
    if(overlap<.97)throw new Error(`Review silhouette overlap for ${name}: ${overlap}`);
    console.log(`${name}: ${(overlap*100).toFixed(2)}% silhouette overlap; ${palette.length} original fill colors`);
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
