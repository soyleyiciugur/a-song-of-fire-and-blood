import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {findGameCard} from '@/lib/the-great-game/cards';
export async function GET(){
 const client=await createClient();const {data:{user}}=await client.auth.getUser();
 if(!user)return NextResponse.json({error:'Sign in to open your satchel.'},{status:401,headers:{'Cache-Control':'private, no-store'}});
 const quantities:Record<string,number>={};
 for(let offset=0;;offset+=500){
  const {data,error}=await client.from('great_game_collection').select('card_id,quantity').eq('user_id',user.id).order('card_id').range(offset,offset+499);
  if(error)return NextResponse.json({error:'Your collection could not be loaded. All cards remain available in Decks.'},{status:503,headers:{'Cache-Control':'private, no-store'}});
  for(const row of data??[])if(findGameCard(row.card_id)&&Number.isSafeInteger(row.quantity)&&row.quantity>0)quantities[row.card_id]=row.quantity;
  if(!data||data.length<500)break;
 }
 return NextResponse.json({userId:user.id,quantities},{headers:{'Cache-Control':'private, no-store'}});
}
