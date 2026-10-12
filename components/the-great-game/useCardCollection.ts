"use client";
import {createClient} from '@/lib/supabase/client';
import {useEffect,useState} from 'react';
import type {CardQuantities} from '@/lib/the-great-game/card-metadata';
export type CollectionState={status:'loading'|'ready'|'guest'|'error';quantities:CardQuantities;error?:string};
const EMPTY:CardQuantities={};
/** Account-keyed, uncached ownership. Authentication changes clear in-flight inventory. */
export function useCardCollection(accountId:string|null|undefined){
 const [result,setResult]=useState<CollectionState & {accountId?:string|null}>({status:'loading',quantities:EMPTY});
 const [revision,setRevision]=useState(0);
 useEffect(()=>{
  if(!accountId)return;
  const controller=new AbortController();
  const {data:{subscription}}=createClient().auth.onAuthStateChange((event,session)=>{
   if(event==='SIGNED_OUT'){
    controller.abort();setResult({accountId,status:'guest',quantities:EMPTY});
   }else if(event==='SIGNED_IN'&&session?.user.id!==accountId){
    controller.abort();setResult({accountId:session?.user.id,status:'loading',quantities:EMPTY});
   }
  });
  fetch('/api/great-game/collection',{signal:controller.signal,cache:'no-store'}).then(async response=>{
   if(controller.signal.aborted)return;
   if(response.status===401){setResult({accountId,status:'guest',quantities:EMPTY});return;}
   const body=await response.json();if(controller.signal.aborted)return;
   if(!response.ok)throw Error(body.error||'The collection is unavailable.');
   if(body.userId!==accountId)throw Error('Your account changed. Refresh to open your satchel.');
   setResult({accountId,status:'ready',quantities:body.quantities});
  }).catch(error=>{if(!controller.signal.aborted)setResult({accountId,status:'error',quantities:EMPTY,error:error.message});});
  return ()=>{controller.abort();subscription.unsubscribe();};
 },[accountId,revision]);
 const state:CollectionState=accountId===null?{status:'guest',quantities:EMPTY}:result.accountId===accountId&&accountId?result:{status:'loading',quantities:EMPTY};
 return {...state,retry:()=>{setResult({accountId,status:'loading',quantities:EMPTY});setRevision(value=>value+1);}};
}
