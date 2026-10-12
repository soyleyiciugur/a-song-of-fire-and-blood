import { gameTurnLabel } from "@/lib/the-great-game/turn-labels";
import { matchBreakdown } from "@/lib/the-great-game/match-breakdown";
import type { GameState, PlayerId } from "@/lib/the-great-game/types";
import styles from "./play-hub.module.css";
export default function MatchBreakdown({state,names={player1:"Player 1",player2:"Player 2"}}:{state:GameState;names?:Record<PlayerId,string>}) {
  const {players,legacyActions}=matchBreakdown(state);
  const rows = [
    ["Final Standing",players.player1.standing,players.player2.standing],
    ["Turns started",players.player1.rulerTurns,players.player2.rulerTurns],
    ["Cards played",players.player1.plays,players.player2.plays],
    ["Characters / Dragons",`${players.player1.characters} / ${players.player1.dragons}`,`${players.player2.characters} / ${players.player2.dragons}`],
    ["Events / Artifacts / Locations",`${players.player1.events} / ${players.player1.artifacts} / ${players.player1.locations}`,`${players.player2.events} / ${players.player2.artifacts} / ${players.player2.locations}`],
    ["Military conflicts initiated",players.player1.military,players.player2.military],
    ["Political conflicts initiated",players.player1.political,players.player2.political],
    ["Units remaining",players.player1.units,players.player2.units],
    ["Cards in hand / deck",`${players.player1.hand} / ${players.player1.deck}`,`${players.player2.hand} / ${players.player2.deck}`],
    ["Cards burned",players.player1.burned,players.player2.burned],
    ["Royal Favor used",players.player1.favorUsed?"Yes":"No",players.player2.favorUsed?"Yes":"No"],
  ];
  return <section className={styles.matchBreakdown} aria-label="Match breakdown">
    <table><caption>{gameTurnLabel(state.turnNumber)} · Final table</caption><thead><tr><th scope="col">Statistic</th><th scope="col">{names.player1}</th><th scope="col">{names.player2}</th></tr></thead><tbody>{rows.map(([label,one,two],index)=><tr key={label}><th scope="row">{label}</th><td>{legacyActions&&index>=2&&index<=6?"—":one}</td><td>{legacyActions&&index>=2&&index<=6?"—":two}</td></tr>)}</tbody></table>
    <small>Turns include the final turn started. Cards played exclude Royal Favor. Conflicts count initiations, not victories.</small>
    {legacyActions&&<p>Action totals are unavailable for this older match; final table values remain accurate.</p>}
  </section>;
}
