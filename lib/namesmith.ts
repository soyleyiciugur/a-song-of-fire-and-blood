export type NamesmithEntity = "house"|"place"|"ship"|"dragon"|"inn"|"epithet";
type Profile={label:string;group:string;roots:string[];land:string[];waters:string[];beasts:string[];materials:string[]};

export const NAMING_REGIONS:Record<string,Profile>={
  north:{label:"The North",group:"Westeros",roots:["Winter","Grey","Cold","Long","Deep","Frost"],land:["wood","hold","barrow","watch","fell","moor"],waters:["White Knife","Shivering Sea","Ice Bay"],beasts:["Wolf","Bear","Elk","Raven"],materials:["Iron","Flint","Pine","Snow"]},
  riverlands:{label:"The Riverlands",group:"Westeros",roots:["Red","Green","Fair","Willow","Old","Muddy"],land:["ford","crossing","mill","bank","field","pool"],waters:["Trident","Red Fork","Blue Fork","river"],beasts:["Trout","Heron","Otter","Pike"],materials:["Reed","Oak","Mud","Riverstone"]},
  vale:{label:"The Vale",group:"Westeros",roots:["High","Sky","Moon","White","Sharp","Cloud"],land:["gate","peak","perch","mont","ledge","rest"],waters:["narrow sea","mountain spring","Gulltown bay"],beasts:["Falcon","Eagle","Gull","Ram"],materials:["Stone","Silver","Marble","Slate"]},
  reach:{label:"The Reach",group:"Westeros",roots:["Green","Golden","Sweet","Fair","Summer","Rose"],land:["garden","meadow","field","grove","bury","hall"],waters:["Mander","Whispering Sound","sunset sea"],beasts:["Fox","Hart","Bee","Lark"],materials:["Rose","Apple","Vine","Honey"]},
  stormlands:{label:"The Stormlands",group:"Westeros",roots:["Storm","Rain","Black","Thunder","Gale","Wrath"],land:["break","watch","cliff","march","wood","end"],waters:["Shipbreaker Bay","rainwood coast","narrow sea"],beasts:["Stag","Boar","Gryphon","Crow"],materials:["Iron","Lightning","Oak","Basalt"]},
  westerlands:{label:"The Westerlands",group:"Westeros",roots:["Gold","Bright","Deep","Red","Proud","Lion"],land:["rock","mine","crag","tooth","hall","den"],waters:["Sunset Sea","Lannisport bay","golden strait"],beasts:["Lion","Boar","Hound","Hawk"],materials:["Gold","Copper","Ruby","Stone"]},
  crownlands:{label:"The Crownlands",group:"Westeros",roots:["Crown","King","Black","Dragon","Harbor","Rosy"],land:["gate","landing","hill","port","watch","rest"],waters:["Blackwater","narrow sea","Gullet"],beasts:["Dragon","Stag","Crab","Raven"],materials:["Steel","Brick","Jet","Gold"]},
  dorne:{label:"Dorne",group:"Westeros",roots:["Sun","Sand","Dusk","Red","Salt","Spear"],land:["well","garden","spire","stone","pass","rest"],waters:["Greenblood","Summer Sea","Torrentine"],beasts:["Viper","Scorpion","Hawk","Horse"],materials:["Sand","Copper","Silk","Bloodstone"]},
  ironislands:{label:"The Iron Islands",group:"Westeros",roots:["Iron","Salt","Drowned","Grey","Black","Wave"],land:["pyke","reef","holm","rock","cliff","wrack"],waters:["Sunset Sea","Ironman's Bay","grey sea"],beasts:["Kraken","Seal","Shark","Gull"],materials:["Iron","Salt","Driftwood","Blackstone"]},
  valyrian:{label:"Valyrian",group:"Essos",roots:["Vhael","Aery","Rhae","Daem","Belaer","Zal"],land:["ys","ion","or","agon","erys","yra"],waters:["Smoking Sea","Gullet","narrow sea"],beasts:["Dragon","Wyrm","Sphinx","Phoenix"],materials:["Flame","Obsidian","Silver","Blood"]},
  braavosi:{label:"Braavos",group:"Essos",roots:["Purple","Moon","Canal","Fog","Titan","Silver"],land:["bridge","quay","court","harbor","isle","gate"],waters:["Braavosi lagoon","Shivering Sea","canals"],beasts:["Cat","Eel","Gull","Fox"],materials:["Iron","Silver","Velvet","Glass"]},
  freecities:{label:"The Free Cities",group:"Essos",roots:["Perfumed","Bright","Velvet","Free","Golden","Painted"],land:["market","tower","court","port","garden","square"],waters:["narrow sea","Rhoyne","summer waters"],beasts:["Elephant","Tiger","Peacock","Fox"],materials:["Silk","Amber","Ivory","Glass"]},
  dothraki:{label:"The Dothraki Sea",group:"Essos",roots:["Horse","Wind","Red","Wide","Burning","Sun"],land:["grass","khal","ridge","plain","camp","road"],waters:["poison water","Mother of Mountains","grass sea"],beasts:["Stallion","Mare","Hawk","Wolf"],materials:["Bronze","Leather","Bone","Blood"]},
  freefolk:{label:"Beyond the Wall",group:"Free Folk",roots:["Ice","Free","Crow","Frost","Wild","White"],land:["fist","cave","wood","fang","hollow","camp"],waters:["Milkwater","Shivering Sea","frozen river"],beasts:["Mammoth","Bear","Crow","Elk"],materials:["Bone","Ice","Fur","Stone"]},
};

export const TONE_OPTIONS=[{value:"noble",label:"Noble / courtly"},{value:"grim",label:"Grim / ominous"},{value:"rustic",label:"Rustic / common"},{value:"martial",label:"Martial"},{value:"mysterious",label:"Mysterious"}];
const toneWords:Record<string,string[]>={noble:["Golden","Gallant","Crowned","Radiant","Proud"],grim:["Bleak","Broken","Last","Ashen","Dread"],rustic:["Old","Crooked","Merry","Sleepy","Three"],martial:["Iron","Bold","Bloody","Red","Victorious"],mysterious:["Pale","Veiled","Whispering","Moonlit","Starless"],mocking:["Little","Limp","Goat-kissed","Ale-soaked","Halfwise"]};
const pick=<T,>(a:T[])=>a[Math.floor(Math.random()*a.length)];
const join=(a:string,b:string)=>`${a}${b}`.replace(/([a-z])([A-Z])/g,"$1$2");

export function generateContextName(entity:NamesmithEntity,regionId:string,tone:string,subtype:string){
  const p=NAMING_REGIONS[regionId]??NAMING_REGIONS.north; const mood=toneWords[subtype==="mocking"?"mocking":tone]??toneWords.noble;
  const root=pick(p.roots),land=pick(p.land),beast=pick(p.beasts),material=pick(p.materials),toneWord=pick(mood);
  if(entity==="house"){
    const core=join(root,land); if(subtype==="great")return `House ${pick([core,`${material}${beast}`,`${root}${beast}`])}`;
    if(subtype==="minor")return `House ${pick([core,`${beast}${land}`,`${material}${land}`])}`;
    return `House ${pick([core,`${root}${beast}`,`${material}${land}`])}`;
  }
  if(entity==="place"){
    if(subtype==="castle")return pick([`${root}${land} Keep`,`${toneWord} ${beast} Hold`,`${material}${land}`]);
    if(subtype==="village")return pick([`${root}${land}`,`${beast}'s Rest`,`${material}field`]);
    if(subtype==="natural")return pick([`${root} ${pick(["Wood","Hills","Fells","Dunes","Marsh"])}`,`${beast}'s ${pick(["Pass","Tooth","Claw","Crown"])}`]);
    if(subtype==="island")return pick([`${root} Isle`,`${beast} Island`,`${material}holm`]);
    return pick([`${root}${land}`,`${toneWord} ${beast}`,`${material}${land}`]);
  }
  if(entity==="ship"){
    const noun=pick([beast,material,"Maiden","Fortune","Daughter","Promise"]); const sea=pick(p.waters);
    return subtype==="warship"?`The ${pick(["Red","Iron","Dread",toneWord])} ${noun}`:subtype==="merchant"?`The ${pick(["Golden","Laughing","Lucky",root])} ${noun}`:`The ${pick([toneWord,root])} ${noun} of the ${sea}`;
  }
  if(entity==="dragon"){
    if(subtype==="common")return join(pick([toneWord,material,root]),pick(["wing","flame","fyre","maw","scale","claw"]));
    return join(pick(NAMING_REGIONS.valyrian.roots),pick(["ax","ion","arys","or","eryx","agon","yra"]));
  }
  if(entity==="inn"){
    const subject=pick([beast,material,"Cup","Lantern","Crown","Boot"]);
    return subtype==="rough"?`The ${pick(["Broken","Bloody","Drunken","Crooked"])} ${subject}`:subtype==="coaching"?`The ${subject} and ${pick(p.beasts)}`:`The ${toneWord} ${subject}`;
  }
  const noun=pick([beast,"Sword","Hand","Voice","Heart","Fool"]);
  return subtype==="mocking"?`the ${pick(toneWords.mocking)} ${noun}`:subtype==="popular"?`the ${pick(["Bold","Black","Young","Old",toneWord])} ${noun}`:`the ${pick([toneWord,material,root])}`;
}

export const BASTARD_TRADITIONS:Record<string,string>={north:"Snow",house_stark:"Snow",vale:"Stone",house_arryn:"Stone",riverlands:"Rivers",house_tully:"Rivers",westerlands:"Hill",house_lannister:"Hill",reach:"Flowers",house_tyrell:"Flowers",stormlands:"Storm",house_baratheon:"Storm",crownlands:"Waters",house_targaryen:"Waters",dorne:"Sand",house_martell:"Sand",ironislands:"Pyke",house_greyjoy:"Pyke"};
