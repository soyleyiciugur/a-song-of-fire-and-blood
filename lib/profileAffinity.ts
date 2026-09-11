import "server-only";
import { createHash } from "node:crypto";
import characters from "@/data/characters/characters.json";
import chapters from "@/data/chapters.json";
import quotes from "@/data/quotes.json";
import gallery from "@/data/gallery.json";
export type AffinityOption={id:string;title:string;href:string;image?:string;portrait?:string};
export type AffinityField={key:string;label:string;options:AffinityOption[]};
export function affinityCatalog():AffinityField[]{
 const media=(meme:boolean)=>gallery.filter(g=> (g.category==='fleabottom')===meme&&(meme||!/\.(mp4|webm|mov)$/i.test(g.src??''))).map(g=>({id:g.id,title:g.caption||g.id,href:`/ravens-eye${/\.(mp4|webm|mov)$/i.test(g.src??'')?'/reels':meme?'/memes':''}?item=${encodeURIComponent(g.id)}`,image:/\.(mp4|webm|mov)$/i.test(g.src??'')?undefined:g.src??undefined}));
 const fields:AffinityField[] = [
 {key:'character',label:'Favorite Character',options:characters.filter(c=>!('hidden' in c&&c.hidden)).map(c=>({id:c.id,title:c.name,href:`/characters/${c.id}`,portrait:c.id}))},
 {key:'chapter',label:'Favorite Chapter',options:chapters.map(c=>({id:c.slug,title:c.title,href:`/chapters/${c.slug}`,image:c.image}))},
 {key:'quote',label:'Favorite Quote',options:quotes.map(q=>({id:createHash('sha256').update(`${q.speakerId}\n${q.chapterSlug}\n${q.text}`).digest('hex').slice(0,24),title:`${q.text} — ${q.speakerName}`,href:q.chapterSlug?`/chapters/${q.chapterSlug}`:'/quotes',portrait:q.speakerId??undefined}))},
 {key:'meme',label:'Favorite Meme',options:media(true)},
 {key:'image',label:'Favorite Image',options:media(false)}];
 return fields.map(field=>({...field,options:[...new Map(field.options.map(option=>[option.id,option])).values()]}));
}
