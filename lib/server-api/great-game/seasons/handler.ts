import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {currentSeason,seasonPeriod,seasonDisplayName,seasonStandings,type SeasonResult} from '@/lib/the-great-game/seasons';
export async function GET(request:Request){
 const client=await createClient();
 const {data:seasons,error:seasonError}=await client.from('great_game_seasons').select('*').order('started_at',{ascending:false});
 if(seasonError)return NextResponse.json({error:'The season ledger could not be loaded.'},{status:503});
 const current=currentSeason(seasons??[]);const requested=new URL(request.url).searchParams.get('season');
 if(new URL(request.url).searchParams.get('summary')==='1')return NextResponse.json({season:current},{headers:{'Cache-Control':'no-store'}});
 const id=requested||current?.id;const period=id?seasonPeriod(seasons??[],id):null;
 if(!period)return NextResponse.json({error:'That season is not available.'},{status:requested?400:503});
 const rows:SeasonResult[]=[];
 for(let offset=0;;offset+=500){
  const {data,error}=await client.from('great_game_match_history').select('match_type,user_id,result,rating_before,rating_after').eq('match_type','ranked').eq('season_id',period.id).order('completed_at').order('match_id').order('user_id').range(offset,offset+499);
  if(error)return NextResponse.json({error:'The season results could not be loaded.'},{status:503});
  rows.push(...(data??[]));if(!data||data.length<500)break;
 }
 const standings=seasonStandings(rows).slice(0,100);
 const {data:profiles,error}=standings.length?await client.from('profiles').select('id,username,display_name').in('id',standings.map(row=>row.userId)):{data:[],error:null};
 if(error)return NextResponse.json({error:'The rulers could not be loaded.'},{status:503});
 const view=(s:NonNullable<typeof period>)=>({id:s.id,stage:s.stage,name:s.name,displayName:seasonDisplayName(s),status:s.status,start:s.started_at,end:s.ended_at});
 return NextResponse.json({period:view(period),current:current?.id??null,available:(seasons??[]).filter(s=>s.status!=='planned').map(view),standings:standings.map(row=>({...row,username:profiles?.find(p=>p.id===row.userId)?.username??null,name:profiles?.find(p=>p.id===row.userId)?.display_name||'A Ruler'}))},{headers:{'Cache-Control':'no-store'}});
}
