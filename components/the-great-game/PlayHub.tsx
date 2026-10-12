"use client";
import InvitationType, {useInvitationType} from "./InvitationType";
import SeasonReference from "./SeasonReference";
import CardsSelect from "@/components/the-great-game/CardsSelect";
import { validateStoredDeck } from "@/lib/the-great-game/deck-records";
import DeckValidationNotice from "./DeckValidationNotice";
import Link from "next/link";
import MatchTypePicker from "./MatchTypePicker";
import {matchTypeLabel,type MatchType} from "@/lib/the-great-game/match-types";
import { Suspense, useEffect, useState } from "react";
import type { StoredDeck } from "@/lib/the-great-game/stored-decks";
import type { GreatGameOnlineMatchSummary, GreatGameOnlineMatchView } from "@/lib/the-great-game/online";
import HubFriends from "./HubFriends";
import { useHubData } from "./useHubData";
import ParchmentDialog, { ParchmentNote } from "./ParchmentDialog";
import styles from "./play-hub.module.css";
import JoinInvitation from "./JoinInvitation";
import HubNavFrame from "./HubNavFrame";
import InnQuote from "./InnQuote";

export function CupIcon() {
  return <svg viewBox="0 0 32 36" fill="none" aria-hidden="true"><path d="M9 3h14v8c0 6-3 9-7 9s-7-3-7-9V3Z" fill="currentColor"/><path d="M9 5H4v5c0 4 3 6 7 6M23 5h5v5c0 4-3 6-7 6M16 20v9m-7 4h14l-4-4h-6l-4 4Z" stroke="currentColor" strokeWidth="2"/></svg>;
}

export default function PlayHub(props: {
  onNewGame: () => void; onlineOpen: boolean; onToggleOnline: () => void;
  decks: StoredDeck[]; deckId: string; onDeckChange: (value: string) => void;
  code: string; onCodeChange: (value: string) => void; onlineBusy: boolean; onlineError: string | null;
  matches: GreatGameOnlineMatchSummary[]; onCreateOnline: (matchType:MatchType) => void; onJoinOnline: () => void;
  onResumeOnline: (id: string) => void; onInvited: (match: GreatGameOnlineMatchView) => void;
}) {
  const { data, error, guest } = useHubData();
  const [matchType,setMatchType]=useState<MatchType>("custom");
  const [tableTab,setTableTab]=useState<"create"|"join"|"open">("create");
  const [openPage,setOpenPage]=useState(0);
  const [watchTables,setWatchTables]=useState<{id:string;matchType:MatchType;host:string;guest:string}[]>([]);
  const [watchError,setWatchError]=useState("");
  useEffect(()=>{
    if(!props.onlineOpen || tableTab!=="open")return;
    const controller=new AbortController();let timer:ReturnType<typeof setTimeout>;
    async function refresh(){try{const response=await fetch("/api/great-game/spectate",{signal:controller.signal,cache:"no-store"});const payload=await response.json();if(!response.ok)throw Error(payload.error||"Open tables could not be loaded.");setWatchTables(payload.tables??[]);setWatchError("");}catch(error){if(!controller.signal.aborted)setWatchError(error instanceof Error?error.message:"Open tables could not be loaded.");}finally{if(!controller.signal.aborted)timer=setTimeout(refresh,15000);}}
    void refresh();return()=>{controller.abort();clearTimeout(timer);};
  },[props.onlineOpen,tableTab]);
  const tables=[...props.matches.map(match=>({id:match.id,label:match.status==="waiting"?"Your reserved table":`vs. ${match.opponent?.username||"Opponent"}`,detail:matchTypeLabel(match.matchType)+" \u00b7 "+match.code,watch:false})),...watchTables.filter(table=>!props.matches.some(match=>match.id===table.id)).map(table=>({id:table.id,label:table.host+" vs. "+table.guest,detail:matchTypeLabel(table.matchType)+" \u00b7 Spectate",watch:true}))];
  const pages=Math.max(1,Math.ceil(tables.length/4));
  const activePage=Math.max(0,Math.min(openPage,pages-1));
  const invitation=useInvitationType(props.code);
  useEffect(()=>{if(props.onlineOpen && props.code.length===6)setTableTab("join");},[props.onlineOpen,props.code]);
  const last = data?.lastMatch;
  const validation = validateStoredDeck(props.decks.find(deck => deck.id === props.deckId));
  return <main className={`${styles.hub} great-game-page`} data-great-game-hub data-great-game-viewport>
    <Suspense fallback={null}><JoinInvitation onCode={props.onCodeChange} onOpen={props.onToggleOnline} open={props.onlineOpen} /></Suspense>
    <HubNavFrame active="play" data={data} guest={guest} showSign />
    <div className={`${styles.content} ${styles.playContent}`} data-great-game-play-content>
      <section className={styles.intro} aria-labelledby="play-heading" data-great-game-heading>
        <span className={styles.eyebrow}>The Great Game</span><h1 className={styles.title} id="play-heading">Play</h1>
        <h2>A table always awaits</h2><SeasonReference season={data?.season}/><InnQuote kind="welcome" className={styles.description} />
        <div className={styles.actions}><button type="button" onClick={props.onToggleOnline} aria-expanded={props.onlineOpen}>Challenge a Friend <span aria-hidden="true">⚔</span></button><button type="button" onClick={props.onNewGame}>Local Game <span aria-hidden="true">›</span></button></div>
        {!props.onlineOpen && props.onlineError && <p role="alert">{props.onlineError}</p>}
      </section>
      <section className={styles.recap} hidden={props.onlineOpen} aria-label="Last match recap"><div className={styles.panelHeading}><h2>Last match</h2><CupIcon /></div>
        {last ? <div className={styles.recapBody}><strong data-result={last.result}>{last.result === "win" ? "Victory" : last.result === "draw" ? "Draw" : "Defeat"}</strong><p>{matchTypeLabel(last.match_type)} · Against {last.opponent_display_name || last.opponent_username}</p><small>{last.turns} turns · {Math.floor(last.duration_seconds / 60)}m {last.duration_seconds % 60}s · {last.match_type === "custom" ? "Unranked" : `${last.rating_after - last.rating_before >= 0 ? "+" : ""}${last.rating_after-last.rating_before} rating`}</small><InnQuote kind={last.result === "abandon" ? "loss" : last.result} className={styles.voice} /></div>
          : error ? <p className={styles.empty}>The last match could not be loaded.</p> : <InnQuote kind="empty" className={styles.empty} />}
      </section>
      <div className={styles.socialColumn}>
        <HubFriends data={data} guest={guest} error={error} decks={props.decks} deckId={props.deckId} onDeckChange={props.onDeckChange} onInvited={props.onInvited} />
      </div>
    </div>
    <footer className={styles.footer}><span>Strength wins battles. Influence wins realms.</span></footer>
    {props.onlineOpen && <ParchmentDialog title="A table for two" noScroll onClose={() => { if (!props.onlineBusy) props.onToggleOnline(); }}>
      <nav className={styles.tableTabs} aria-label="Table options">
        <button type="button" aria-current={tableTab==="create"?"page":undefined} onClick={()=>setTableTab("create")}>Host Table</button>
        <button type="button" aria-current={tableTab==="join"?"page":undefined} onClick={()=>setTableTab("join")}>Join Table</button>
        <button type="button" aria-current={tableTab==="open"?"page":undefined} onClick={()=>setTableTab("open")}>Open Tables{tables.length?` (${tables.length})`:""}</button>
      </nav>
      <div className={styles.inviteForm}>
        {tableTab!=="open"&&<div className={styles.deckChoice}><label>Your deck<CardsSelect ariaLabel="Your deck" value={props.deckId} onChange={props.onDeckChange} disabled={props.onlineBusy} options={[...(!props.decks.some(deck=>deck.id==="practice")?[{value:"practice",label:"Practice Deck"}]:[]),...props.decks.map(deck=>({value:deck.id,label:deck.name})) ]} /></label><DeckValidationNotice validation={validation} editLink /></div>}
        {tableTab==="create"&&<div className={styles.tableBottomActions}>
          <MatchTypePicker value={matchType} onChange={setMatchType} disabled={props.onlineBusy} />
          <button type="button" className={styles.primary} onClick={()=>props.onCreateOnline(matchType)} disabled={props.onlineBusy || !validation.valid}>{props.onlineBusy ? "Preparing the table…" : "Host the Table"}</button>
        </div>}
        {tableTab==="join"&&<div className={styles.tableBottomActions}>
          <ParchmentNote speaker="aldren">An invitation, my liege? Give me the six characters and I shall show you to your seat.</ParchmentNote>
          <form className={styles.joinRow} onSubmit={event => { event.preventDefault(); if (props.code.length === 6 && invitation?.type && !props.onlineBusy && validation.valid) props.onJoinOnline(); }}><label className={styles.srOnly} htmlFor="table-code">Table code</label><input id="table-code" value={props.code} onChange={event => props.onCodeChange(event.target.value)} placeholder="TABLE CODE" maxLength={6} autoCapitalize="characters" autoComplete="off" spellCheck={false} disabled={props.onlineBusy} /><button className={styles.primary} disabled={props.onlineBusy || props.code.length !== 6 || !invitation?.type || !validation.valid}>{invitation?.type ? `Join ${invitation.type === "custom" ? "Friendly" : "Crown"}` : "Join"}</button></form>
          <InvitationType code={props.code} preview={invitation} />
        </div>}
        {tableTab==="open"&& <>{watchError&&<p role="status">{watchError}</p>}{tables.length?<><div className={styles.resumeList}>{tables.slice(activePage*4,(activePage+1)*4).map(table => table.watch ? <Link key={table.id} className={styles.openTableLink} href={`/cards/spectate/${table.id}`}>{table.label}<b>{table.detail}</b></Link> : <button type="button" key={table.id} disabled={props.onlineBusy} onClick={() => props.onResumeOnline(table.id)}>{table.label}<b>{table.detail}</b></button>)}</div>{pages>1&&<div className={styles.openTablePager}><button type="button" onClick={()=>setOpenPage(page=>Math.max(0,page-1))} disabled={activePage===0}>Previous</button><span>{activePage+1} / {pages}</span><button type="button" onClick={()=>setOpenPage(page=>Math.min(pages-1,page+1))} disabled={activePage===pages-1}>Next</button></div>}</>:!watchError&&<ParchmentNote speaker="mara">No open tables yet. Start one and I&apos;ll keep your place warm.</ParchmentNote>}</>}
        {props.onlineError && <p role="alert">{props.onlineError}{props.onlineError.toLowerCase().includes("sign in") && <> <Link href="/login">Sign in</Link></>}</p>}
      </div>
    </ParchmentDialog>}
  </main>;
}
