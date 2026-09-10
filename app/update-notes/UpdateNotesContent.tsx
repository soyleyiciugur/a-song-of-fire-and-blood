"use client";

import { useCommunity, refreshCommunity } from '@/lib/communityStore';
import UpdatesFeed from '@/components/UpdatesFeed';

export default function UpdateNotesContent(){
  const data=useCommunity();
  return <>
    {!data.loaded&&!data.error&&<p role="status">Loading update notes…</p>}
    {data.error&&<p role="status">{data.error} <button onClick={()=>void refreshCommunity()}>Retry</button></p>}
    {data.loaded&&<UpdatesFeed updates={data.updates} now={Date.parse(data.serverTime)}/>}
  </>;
}
