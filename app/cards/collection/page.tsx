import CardCollection from '@/components/the-great-game/CardCollection';
export default async function CollectionPage({searchParams}:{searchParams:Promise<{card?:string|string[]}>}){
 const params=await searchParams;return <CardCollection initialCard={Array.isArray(params.card)?params.card[0]:params.card}/>;
}
