import 'server-only';
import {createAdminClient} from '@/lib/supabase/admin';
import {findGameCard} from './cards';
/** Future trusted fulfillment seam. Never expose this as a caller-controlled grant endpoint. */
export async function grantCollectedCards(input:{reference:string;userId:string;cardId:string;quantity:number}) {
 if(!input.reference.trim()||input.reference.length>200||!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(input.userId)||!findGameCard(input.cardId)||!Number.isSafeInteger(input.quantity)||input.quantity<=0||input.quantity>2147483647)throw Error('Invalid collection grant.');
 const admin=createAdminClient();if(!admin)throw Error('Collection fulfillment is unavailable.');
 const {error}=await admin.rpc('grant_great_game_cards',{p_reference:input.reference,p_user_id:input.userId,p_card_id:input.cardId,p_quantity:input.quantity});
 if(error)throw Error('The collection grant could not be recorded.');
}
