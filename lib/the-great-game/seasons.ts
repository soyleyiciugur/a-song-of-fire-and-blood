/** Seasons change only through explicit persisted administrative action, never the calendar. */
export type Season = {id:string;stage:string;name:string;status:'planned'|'active'|'closed';started_at:string|null;ended_at:string|null};
export function currentSeason(seasons:readonly Season[]):Season|null {return seasons.find(season=>season.status==='active')??null;}
export function seasonDisplayName(season:Pick<Season,'stage'|'name'>):string {return season.stage+' Season — '+season.name;}
export function seasonPeriod(seasons:readonly Season[],id:string):Season|null {return seasons.find(season=>season.id===id&&season.status!=='planned')??null;}
export type SeasonResult = { match_type?: "custom" | "ranked"; user_id: string; result: string; rating_before: number; rating_after: number };
export function seasonStandings(rows: SeasonResult[]) {
  const totals = new Map<string, { userId: string; points: number; games: number; wins: number; losses: number; draws: number }>();
  for (const row of rows) {
    if (row.match_type !== "ranked") continue;
    const entry = totals.get(row.user_id) ?? { userId: row.user_id, points: 0, games: 0, wins: 0, losses: 0, draws: 0 };
    entry.points += row.rating_after - row.rating_before; entry.games++;
    if (row.result === 'win') entry.wins++; else if (row.result === 'draw') entry.draws++; else entry.losses++;
    totals.set(row.user_id, entry);
  }
  const sorted = [...totals.values()].sort((a,b)=>b.points-a.points || b.wins-a.wins || a.userId.localeCompare(b.userId));
  let rank=0;
  return sorted.map((entry,index)=> { if (!index || entry.points!==sorted[index-1].points || entry.wins!==sorted[index-1].wins) rank=index+1; return {...entry,rank}; });
}
