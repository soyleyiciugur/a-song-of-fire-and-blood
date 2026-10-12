"use client";
import {useEffect,useState} from 'react';
import {matchTypeLabel,type MatchType} from '@/lib/the-great-game/match-types';
export function useInvitationType(code:string) {
 const [preview,setPreview]=useState<{code:string;type?:MatchType;error?:string}|null>(null);
 useEffect(()=>{if(code.length!==6)return;const controller=new AbortController();
 fetch('/api/great-game?code='+encodeURIComponent(code),{signal:controller.signal,cache:'no-store'}).then(async response=>{const body=await response.json();if(!response.ok)throw Error(body.error||'Unable to check this table.');setPreview({code,type:body.matchType});}).catch(error=>{if(!controller.signal.aborted)setPreview({code,error:error.message});});return ()=>controller.abort();},[code]);
 return preview?.code===code?preview:null;
}
export default function InvitationType({code,preview}:{code:string;preview:ReturnType<typeof useInvitationType>}) {
 if(code.length!==6)return null;
 if(preview?.code!==code)return <small role="status">Checking the invitation...</small>;
 return <small role="status">{preview.error || (matchTypeLabel(preview.type)+(preview.type==='custom'?' · No rating changes.':' · Counts toward rating and Ranks.'))}</small>;
}
