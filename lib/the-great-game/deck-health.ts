import {findGameCard} from './cards';
import {validateStoredDeck} from './deck-records';
import type {StoredDeck} from './stored-decks';
import type {CardType} from './types';
/** Diagnostics describe the saved roster; legality belongs exclusively to validateStoredDeck. */
export function deckHealth(deck:Pick<StoredDeck,'cards'>){
 const types:Record<CardType,number>={character:0,dragon:0,event:0,artifact:0,location:0};
 const curve=Array<number>(11).fill(0);let count=0,known=0,cost=0,invalidEntries=0;
 for(const [id,n]of Object.entries(deck.cards)){
  if(!Number.isSafeInteger(n)||n<0||n>30){invalidEntries++;continue;}
  count+=n;const card=findGameCard(id);if(!card)continue;
  types[card.cardType]+=n;curve[Math.min(10,card.cost)]+=n;known+=n;cost+=card.cost*n;
 }
 return {validation:validateStoredDeck(deck),count,missing:Math.max(0,30-count),unknown:count-known,invalidEntries,types,curve,averageCommand:known?cost/known:0};
}
