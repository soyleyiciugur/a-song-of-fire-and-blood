"use client";
import { useEffect, useState } from "react";
import styles from "./direct-raven.module.css";
export type RavenGif={id:string;title:string;url:string};
type Gif=RavenGif;
export default function GiphyPicker({onSelect}:{onSelect:(gif:Gif)=>void}){
 const [query,setQuery]=useState(""),[rows,setRows]=useState<Gif[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState("");
 useEffect(()=>{if(!query.trim()){setRows([]);setLoading(false);setError("");return;}const controller=new AbortController();setLoading(true);setError("");const timer=setTimeout(()=>{void (async()=>{try{const response=await fetch(`/api/giphy/search?q=${encodeURIComponent(query)}`,{signal:controller.signal});const result=await response.json();if(!response.ok){if(result?.error==="giphy_not_configured")throw new Error("NOT_CONFIGURED");throw new Error("UNAVAILABLE");}setRows(result.data??[]);}catch(e){if(!controller.signal.aborted)setError(e instanceof Error&&e.message==="NOT_CONFIGURED"?"GIF search needs a GIPHY API key configured on the server.":"GIF search is unavailable. Try again.");}finally{if(!controller.signal.aborted)setLoading(false);}})();},300);return()=>{clearTimeout(timer);controller.abort();};},[query]);
 return <div className={styles.giphyPicker} aria-label="GIPHY search">
   <div className={styles.giphyHeader}><span>Search GIFs</span><a href="https://giphy.com" target="_blank" rel="noreferrer">Powered by GIPHY</a></div>
   <div className={styles.giphySearchWrap}><span aria-hidden="true">⌕</span><input type="search" aria-label="Search GIFs" maxLength={50} value={query} placeholder="Search GIPHY…" onChange={e=>setQuery(e.target.value)}/></div>
   {loading&&<p className={styles.giphyStatus} role="status">Searching the rookery…</p>}
   <div className={styles.giphyGrid}>{rows.map(g=><button className={styles.giphyResult} type="button" key={g.id} aria-label={`Select ${g.title||"GIF"}`} onClick={()=>onSelect(g)}><img src={g.url} alt={g.title}/></button>)}</div>
   {!loading&&query&&!rows.length&&!error&&<p className={styles.giphyStatus}>No GIFs found.</p>}{error&&<p className={`${styles.giphyStatus} ${styles.giphyError}`} role="status">{error}</p>}
 </div>;
}
