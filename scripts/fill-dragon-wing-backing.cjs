// Add one continuous backing silhouette beneath independently traced color layers.
// Trace the original alpha, including its holes, so wing perforations stay open.
const fs=require('node:fs');
const sharp=require('sharp');
const {trace}=require('./vectorize-dragon-sizes.cjs');
const shapes=require('../data/dragon-size-shapes.json');
const wingFirst=new Set(['boneskin','dreamfyre','meleys','seasmoke','sheepstealer','sunfyre','vermithor']);
(async()=>{
  let count=0;
  for(const name of fs.readdirSync('public/images/dragons/sizes/clean')) {
    const id=name.replace(/\.svg$/,''),file=`public/images/dragons/sizes/clean/${name}`;
    const svg=fs.readFileSync(file,'utf8');
    if(svg.includes('data-wing-backing'))continue;
    const fills=[...svg.matchAll(/<path fill="([^"]+)"/g)].map(m=>m[1]);
    if(fills.length<2)continue;
    const edited=`public/images/dragons/sizes/edited-sources/${name}`;
    let labels,w,h;
    if(fs.existsSync(edited)) {
      const {data,info}=await sharp(edited).ensureAlpha().raw().toBuffer({resolveWithObject:true});
      w=info.width;h=info.height;labels=new Uint8Array(w*h);
      for(let p=0;p<labels.length;p++)labels[p]=data[p*4+3]>=128?1:0;
    } else {
      const shape=shapes[id];if(!shape)continue;
      const [left,top,width,height]=shape.box;w=width;h=height;labels=new Uint8Array(w*h);
      for(const m of shape.clip.matchAll(/M(\d+) (\d+)h(\d+)v1H\d+z/g)) {
        const x=+m[1]-left,y=+m[2]-top;for(let i=0;i<+m[3];i++)labels[y*w+x+i]=1;
      }
    }
    const fill=fills[wingFirst.has(id)?0:1];
    const backing=`<path data-wing-backing="true" fill="${fill}" d="${trace(labels,w,h,1)}"/>`;
    fs.writeFileSync(file,svg.replace(/(<svg\b[^>]*>)/,`$1${backing}`));
    console.log(id);count++;
  }
  require('./preserve-dragon-wing-holes.cjs');
  console.log(`Continuous backing added to ${count} silhouettes.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
