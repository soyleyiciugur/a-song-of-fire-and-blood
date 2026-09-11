import Link from "next/link";
import MiniPortrait from "@/components/MiniPortrait";
import styles from "@/app/users/[username]/profile.module.css";
type Option={id:string;title:string;href:string;image?:string;portrait?:string};
type Field={key:string;label:string;options:Option[]};
export default function ProfileAffinity({values,catalog}:{profileId?:string;values:Record<string,string>;catalog:Field[];editable?:boolean}){
 const selected=catalog.flatMap(field=>{const id=values[field.key];const item=field.options.find(option=>option.id===id);return item?[{field,item}]:[]});
 if(!selected.length)return null;
 return <section className={styles.affinity}><div className={styles.sectionHeading}><div><span>Personal canon</span><h2>Affinity</h2></div></div><div className={styles.affinityGrid}>{selected.map(({field,item})=><Link href={item.href} className={styles.affinityCard} key={field.key}><div className={styles.affinityVisual}>{item.portrait?<MiniPortrait id={item.portrait} alt="" size={52}/>:item.image?<img src={item.image} alt=""/>:<span>✦</span>}</div><div><small>{field.label}</small><strong>{item.title}</strong></div></Link>)}</div></section>;
}
