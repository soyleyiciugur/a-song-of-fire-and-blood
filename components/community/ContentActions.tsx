"use client";
import { useState } from "react";
import { refreshCommunity } from "@/lib/communityStore";
import styles from "./composer.module.css";

export default function ContentActions({kind,id,body}:{kind:"thread"|"post"|"raven";id:string;body:string}) {
  const [editing,setEditing]=useState(false);
  const [confirming,setConfirming]=useState(false);
  const [pending,setPending]=useState(false);
  const [error,setError]=useState("");
  async function request(method:"PATCH"|"DELETE",nextBody?:string) {
    if(pending)return;
    setPending(true);setError("");
    try {
      const response=await fetch("/api/community/content",{method,headers:{"Content-Type":"application/json"},body:JSON.stringify({kind,id,body:nextBody})});
      if(!response.ok){const data=await response.json();throw new Error(data.error??"Action failed.")}
      setEditing(false);setConfirming(false);await refreshCommunity();
    } catch(error) {setError(error instanceof Error?error.message:"Action failed. Please try again.")}
    finally {setPending(false)}
  }
  return <div className={styles.actions}>{editing?<form onSubmit={e=>{e.preventDefault();void request("PATCH",new FormData(e.currentTarget).get("body") as string)}}><textarea name="body" defaultValue={body} required disabled={pending}/><button disabled={pending}>Save</button><button type="button" disabled={pending} onClick={()=>setEditing(false)}>Cancel</button></form>:confirming?<div role="group" aria-label="Confirm deletion"><p>Delete this contribution? This cannot be undone.</p><button disabled={pending} onClick={()=>void request("DELETE")}>{pending?"Deleting?":"Delete contribution"}</button><button disabled={pending} onClick={()=>setConfirming(false)}>Cancel</button></div>:<><button onClick={()=>setEditing(true)}>Edit</button><button onClick={()=>setConfirming(true)}>Delete</button></>}{error&&<span role="alert">{error}</span>}</div>;
}
