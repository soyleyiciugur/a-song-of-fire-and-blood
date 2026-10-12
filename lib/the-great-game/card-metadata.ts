import taxonomy from '@/data/the-great-game/metadata.json';
/** Editorial labels only: never consumed by the gameplay engine. */
export type CardMetadata = Record<string, readonly string[]>;
export type MetadataItem = {metadata?:CardMetadata};
export type MetadataSelection = Record<string,string>;
export type MetadataGroup = {id:string;label:string;options:{id:string;label:string}[]};
export const metadataGroups: readonly MetadataGroup[] = taxonomy.groups;
export function metadataValues(item:MetadataItem,group:string):readonly string[] {
 const values=item.metadata?.[group];return Array.isArray(values)?values.filter(value=>typeof value==='string'):[];
}
/** Offer only registered labels actually assigned in this browser's catalog. */
export function availableMetadata(items:readonly MetadataItem[],groups=metadataGroups):MetadataGroup[] {
 return groups.map(group=>({...group,options:group.options.filter(option=>items.some(item=>metadataValues(item,group.id).includes(option.id)))})).filter(group=>group.options.length>0);
}
export function matchesMetadata(item:MetadataItem,selection:MetadataSelection):boolean {
 return Object.entries(selection).every(([group,value])=>!value||metadataValues(item,group).includes(value));
}
export function metadataLabels(item:MetadataItem):string[] {
 return metadataGroups.flatMap(group=>group.options.filter(option=>metadataValues(item,group.id).includes(option.id)).map(option=>option.label));
}
export type OwnershipFilter = 'all'|'owned'|'unowned';
export type CardQuantities = Readonly<Record<string,number>>;
export function ownedQuantity(id:string,quantities:CardQuantities):number {
 const value=quantities[id];return Number.isSafeInteger(value)&&value>0?value:0;
}
export function matchesOwnership(id:string,filter:OwnershipFilter,quantities:CardQuantities):boolean {
 return filter==='all'||(filter==='owned'?ownedQuantity(id,quantities)>0:ownedQuantity(id,quantities)===0);
}
