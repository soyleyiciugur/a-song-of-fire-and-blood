// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\data\nameGenerator.ts
// Curated + procedural name pools for the Westeros Name Generator (admin tools).
// Regional/culture pools below are original inventions styled after each
// culture's real-world linguistic flavor — none are lifted from the source
// material. The "Great Houses" pools use real first names from the books
// (individual names aren't protected expression, same reason fan name
// generator sites can list them) paired with original bynames.

export type Gender = "male" | "female";

export interface SyllableBank {
  start: string[];
  end: string[];
}

export interface CultureBank {
  id: string;
  name: string;
  group: "Westeros" | "Essos" | "Free Folk" | "Great Houses";
  hasSurnames: boolean;
  given: Record<Gender, string[]>;
  surnames: string[];
  bynames: string[];
  syllables: {
    given: Record<Gender, SyllableBank>;
    surname?: SyllableBank;
  };
}

export const NAME_CULTURES: CultureBank[] = [
  {
    id: "north",
    name: "The North",
    group: "Westeros",
    hasSurnames: true,
    given: {
      male: ["Aldric", "Brynden", "Corwin", "Osric", "Torvald", "Halden", "Dunmore", "Wilfred", "Bryce", "Cedric", "Osgood", "Roderick", "Thoren", "Aldwyn", "Garrow", "Brannock"],
      female: ["Alysse", "Ceris", "Elsbeth", "Rowan", "Wynne", "Maris", "Gwyneth", "Hilda", "Sarra", "Brenna", "Ashlyn", "Mirna", "Edda", "Thora", "Beren", "Ferra"],
    },
    surnames: ["Stonewood", "Coldmoor", "Greywater", "Blackpine", "Frostholt", "Ashcombe", "Thornhollow", "Winterhall", "Ironglen", "Ravenscar", "Wolfden", "Deepwood", "Hollowmere", "Gravenoak"],
    bynames: ["the Ironfoot", "the Grey", "Longstride", "the Silent", "Wolfheart", "Frostborn", "the Stonehearted", "Icewalker", "the Grim", "Northbound", "the Bear-handed", "Cold-eyed"],
    syllables: {
      given: {
        male: { start: ["Ald", "Bryn", "Cor", "Os", "Tor", "Hal", "Dun", "Wil", "Gar", "Bran", "Cael", "Dorr"], end: ["ric", "den", "win", "gar", "vald", "mund", "stan", "bert", "row", "nock", "dan", "wyn"] },
        female: { start: ["Al", "Ce", "Els", "Ro", "Wyn", "Mar", "Gwen", "Hil", "Sar", "Bren", "Ash", "Mir"], end: ["ysse", "ris", "beth", "wan", "ne", "isa", "da", "wyn", "ra", "na", "lyn", "eth"] },
      },
    },
  },
  {
    id: "riverlands",
    name: "The Riverlands",
    group: "Westeros",
    hasSurnames: true,
    given: {
      male: ["Denys", "Harlan", "Mallon", "Perren", "Wendel", "Jorren", "Roswell", "Halbert", "Corrin", "Fennick", "Osbert", "Marlow", "Tobin", "Waldric", "Elmar", "Godfrey"],
      female: ["Meraud", "Talia", "Ysolde", "Perianne", "Marsel", "Ede", "Rosalind", "Wilene", "Corale", "Ysbeth", "Fennelle", "Odette", "Marielle", "Sabine", "Tavia", "Bettany"],
    },
    surnames: ["Millwater", "Redbrook", "Fisherton", "Oakford", "Riverbend", "Marshfield", "Hallcross", "Wickfen", "Streamhollow", "Fenwater", "Elderford", "Greenford", "Duskmill", "Ashenford"],
    bynames: ["the Fisherman", "Mudfoot", "the Ferryman", "Reedcutter", "the Miller's Son", "Streamwise", "the Netmaker", "Riverborn", "the Eel-catcher", "Marsh-treader", "the Boatwright", "Weirwatcher"],
    syllables: {
      given: {
        male: { start: ["Den", "Har", "Mal", "Per", "Wen", "Jor", "Ed", "Rowe", "Os", "Marl", "Tob", "Wald"], end: ["ys", "lan", "lon", "ren", "del", "ren", "mund", "ford", "bert", "ow", "in", "ric"] },
        female: { start: ["Mer", "Tal", "Ys", "Per", "Mar", "Ed", "Ce", "Ann", "Ros", "Wil", "Cor", "Fen"], end: ["aud", "ia", "olde", "ianne", "sel", "e", "lyn", "wen", "alind", "ene", "ale", "elle"] },
      },
    },
  },
  {
    id: "vale",
    name: "The Vale",
    group: "Westeros",
    hasSurnames: true,
    given: {
      male: ["Edmond", "Lucan", "Peris", "Aldous", "Ronnel", "Gerold", "Wayland", "Aerion", "Bellamy", "Corvic", "Denton", "Halric", "Osmund", "Perceval", "Rennick", "Yorwick"],
      female: ["Elowen", "Anya", "Selyne", "Mirielle", "Ysabel", "Corenna", "Gwynora", "Fairenne", "Larissa", "Miren", "Alistra", "Bellwyn", "Cerise", "Delane", "Rowena", "Ysalind"],
    },
    surnames: ["Falconreach", "Skyvane", "Stonewing", "Larkspur", "Mistmoor", "Eyrieholt", "Aldermont", "Wrenfield", "Cloudreach", "Highperch", "Windgate", "Sparhollow", "Talonrest", "Frostpeak"],
    bynames: ["the Falcon-eyed", "Skyborn", "the Climber", "Mistwalker", "Stoneheart", "the Highborn", "Cloudtreader", "the Sure-footed", "Wind-caller", "Talon-marked", "the Ledgewalker", "Peakborn"],
    syllables: {
      given: {
        male: { start: ["Ed", "Lu", "Per", "Al", "Ron", "Ger", "Way", "Aer", "Bel", "Corv", "Den", "Yor"], end: ["mond", "can", "is", "dous", "nel", "old", "land", "ric", "amy", "ic", "ton", "wick"] },
        female: { start: ["El", "An", "Sel", "Mir", "Ys", "Cor", "Gwyn", "Fai", "Lar", "Ali", "Bell", "Del"], end: ["owen", "ya", "yne", "ielle", "abel", "enna", "ora", "renne", "issa", "stra", "wyn", "ane"] },
      },
    },
  },
  {
    id: "reach",
    name: "The Reach",
    group: "Westeros",
    hasSurnames: true,
    given: {
      male: ["Alerin", "Bertrand", "Denholt", "Garrick", "Peronne", "Wilombe", "Florian", "Ambrose", "Corwyn", "Delmar", "Harwick", "Lorent", "Merrick", "Osbourne", "Renfrew", "Tancred"],
      female: ["Roseanne", "Liana", "Maribel", "Ysbel", "Fennelyn", "Aurelie", "Belanna", "Clarisse", "Desmona", "Elowyn", "Fayette", "Marigold", "Perrine", "Selesta", "Verena", "Wisteria"],
    },
    surnames: ["Vinewood", "Appleford", "Sunmeadow", "Greenhollow", "Fairbloom", "Larchmont", "Meadowvale", "Rosewatch", "Blossomcrest", "Goldenvine", "Hollyfield", "Orchardglen", "Thornbury", "Wheatmoor"],
    bynames: ["the Green Thumb", "Rosecutter", "the Vintner", "Sunkissed", "Bloomborn", "the Orchardman", "Vine-tender", "the Meadowlark", "Petal-hand", "Harvestborn", "the Grafter", "Fieldwise"],
    syllables: {
      given: {
        male: { start: ["Al", "Ber", "Den", "Gar", "Per", "Wil", "Fen", "Lor", "Amb", "Del", "Har", "Ren"], end: ["erin", "trand", "holt", "rick", "onne", "ombe", "ric", "ance", "rose", "mar", "wick", "frew"] },
        female: { start: ["Ros", "Li", "Mar", "Ys", "Fen", "Au", "Ce", "Bri", "Bel", "Clar", "Des", "Wis"], end: ["eanne", "ana", "ibel", "bel", "elyn", "relie", "line", "ony", "anna", "isse", "mona", "teria"] },
      },
    },
  },
  {
    id: "stormlands",
    name: "The Stormlands",
    group: "Westeros",
    hasSurnames: true,
    given: {
      male: ["Ormund", "Alyn", "Bertram", "Coren", "Harmond", "Renwick", "Aldric", "Barric", "Corwyn", "Dennard", "Galen", "Kester", "Marden", "Osborn", "Perrin", "Wystan"],
      female: ["Bethany", "Elowyn", "Maris", "Talya", "Wynafred", "Ariessa", "Brissa", "Cordelia", "Delwyn", "Falena", "Gwyndolyn", "Hesper", "Marnia", "Perisse", "Rowenna", "Ysanne"],
    },
    surnames: ["Stormcrest", "Thunderhollow", "Windwatch", "Gullcliff", "Squallmoor", "Tidewrack", "Stagmoor", "Brackenshore", "Gravenwind", "Halewatch", "Ravencliff", "Saltbourne", "Thornwatch", "Windmere"],
    bynames: ["Thunderfist", "the Bull", "Gale-runner", "Squallheart", "the Unbowed", "Stagheart", "Storm-caller", "the Cliffborn", "Tidebreaker", "Windfast", "the Gull-marked", "Brackenborn"],
    syllables: {
      given: {
        male: { start: ["Or", "Al", "Ber", "Cor", "Har", "Ren", "Stef", "Bal", "Bar", "Den", "Gal", "Wys"], end: ["mund", "yn", "tram", "en", "mond", "wick", "fen", "dric", "ric", "nard", "en", "tan"] },
        female: { start: ["Beth", "El", "Mar", "Tal", "Wyn", "Ari", "Cas", "Sel", "Bris", "Cor", "Fal", "Hes"], end: ["any", "owyn", "is", "ya", "afred", "essa", "sana", "wyn", "sa", "delia", "ena", "per"] },
      },
    },
  },
  {
    id: "westerlands",
    name: "The Westerlands",
    group: "Westeros",
    hasSurnames: true,
    given: {
      male: ["Cerion", "Corvan", "Harlon", "Ormond", "Rennick", "Waldemar", "Aldric", "Bramwell", "Damar", "Ellery", "Godric", "Lucen", "Marlowe", "Percival", "Reynard", "Tybor"],
      female: ["Serena", "Ilyana", "Marigold", "Aurelia", "Perrine", "Isolde", "Belisse", "Cerelia", "Damaris", "Elowyn", "Genevra", "Larenne", "Marisette", "Rosalyn", "Serelle", "Vivane"],
    },
    surnames: ["Goldcrest", "Ironvale", "Suncliff", "Deepmine", "Amberfall", "Stonecoin", "Richmoor", "Goldenhall", "Copperfield", "Delvemount", "Faircoin", "Highglint", "Minersfall", "Sunveil"],
    bynames: ["the Golden", "Lionheart", "Coinclipper", "the Proud", "Deepdelver", "Brightblade", "the Gilded Hand", "Coin-counted", "the Vault-keeper", "Sunmetal", "the Rich-blooded", "Glintborn"],
    syllables: {
      given: {
        male: { start: ["Cer", "Cor", "Har", "Or", "Ren", "Wal", "Tyb", "Dam", "Bram", "Ell", "God", "Rey"], end: ["ion", "van", "lon", "mond", "nick", "demar", "olt", "aris", "well", "ery", "ric", "nard"] },
        female: { start: ["Ser", "Il", "Mar", "Au", "Per", "Is", "Gen", "Jo", "Bel", "Cer", "Dam", "Viv"], end: ["ena", "yana", "igold", "relia", "rine", "olde", "evra", "sette", "isse", "elia", "aris", "ane"] },
      },
    },
  },
  {
    id: "crownlands",
    name: "The Crownlands",
    group: "Westeros",
    hasSurnames: true,
    given: {
      male: ["Corlan", "Denton", "Harmon", "Ollan", "Wayland", "Percel", "Aldous", "Bramston", "Corren", "Delwin", "Garreth", "Hallis", "Marston", "Renfield", "Torwin", "Wystoke"],
      female: ["Celestine", "Elara", "Marielle", "Sable", "Ysolt", "Doranette", "Aveline", "Bryony", "Corliss", "Delsie", "Fenella", "Harlowe", "Marceline", "Perse", "Rosamund", "Thessaly"],
    },
    surnames: ["Ashford", "Wavecrest", "Millhaven", "Cobblestone", "Riverside", "Kingsreach", "Harborlight", "Bellhaven", "Dockmoor", "Gatewright", "Slateford", "Tideward", "Watchbell", "Wharfstone"],
    bynames: ["the Cutpurse", "Streetwise", "the Gilded", "Silverfoot", "the Whisperer", "Cobbleborn", "the Wharfrat", "Bellringer", "the Gate-keeper", "Harborhand", "Dockside-bred", "the Quick-fingered"],
    syllables: {
      given: {
        male: { start: ["Cor", "Den", "Har", "Ol", "Way", "Per", "Aem", "Vael", "Bram", "Del", "Gar", "Tor"], end: ["lan", "ton", "mon", "lan", "land", "cel", "on", "yc", "ston", "win", "reth", "win"] },
        female: { start: ["Cel", "El", "Mar", "Sa", "Ys", "Do", "Rhae", "Cas", "Ave", "Bry", "Fen", "Ros"], end: ["estine", "ara", "ielle", "ble", "olt", "rette", "lyn", "sia", "line", "ony", "ella", "amund"] },
      },
    },
  },
  {
    id: "dorne",
    name: "Dorne",
    group: "Westeros",
    hasSurnames: true,
    given: {
      male: ["Alvarro", "Damaso", "Fennaro", "Ramiro", "Tarico", "Ynigo", "Bellizar", "Corvantes", "Estevan", "Malick", "Oreno", "Salazan", "Tomasso", "Xarrio", "Domarco", "Reynaldo"],
      female: ["Delfina", "Mireya", "Serafina", "Ynez", "Zorah", "Estrella", "Alessa", "Camara", "Doriane", "Fennia", "Malinda", "Nerissa", "Perlana", "Rosalinde", "Salvara", "Ynara"],
    },
    surnames: ["Duskrun", "Sablewind", "Redsand", "Firegate", "Thornspear", "Windrunner", "Duneshadow", "Emberfall", "Goldensand", "Scorpiontail", "Silverthorn", "Sunveil"],
    bynames: ["the Sandwalker", "Sunscorched", "Duskborn", "the Spear-hand", "Firedance", "Windswift", "the Sun's Own", "Dune-marked", "the Scorpion's Kin", "Emberblood", "the Silk-veiled", "Redsand-born"],
    syllables: {
      given: {
        male: { start: ["Alv", "Dam", "Fen", "Ram", "Tar", "Yn", "Sal", "Mor", "Bell", "Corv", "Est", "Xar"], end: ["arro", "aso", "naro", "iro", "ico", "igo", "azar", "eo", "izar", "antes", "evan", "rio"] },
        female: { start: ["Del", "Mir", "Sera", "Yn", "Zor", "Estre", "Nym", "Ari", "Ales", "Cam", "Dor", "Nerr"], end: ["fina", "eya", "fina", "ez", "ah", "lla", "essa", "ane", "sa", "ara", "iane", "issa"] },
      },
    },
  },
  {
    id: "ironislands",
    name: "The Iron Islands",
    group: "Westeros",
    hasSurnames: true,
    given: {
      male: ["Dagmar", "Halvard", "Ivarr", "Ragnor", "Torvin", "Ulfric", "Aslak", "Bjornar", "Colborn", "Erik", "Gundred", "Knarl", "Orvyn", "Skorri", "Thoros", "Wulfstan"],
      female: ["Sigrun", "Astrid", "Helka", "Sigrid", "Thyra", "Runa", "Bryndis", "Dagny", "Frida", "Gerda", "Ingra", "Kolfinn", "Ravna", "Sela", "Tordis", "Yrsa"],
    },
    surnames: ["Stormrend", "Ironkeel", "Wavecutter", "Blackreef", "Drownmoor", "Seaborn", "Reeftide", "Deepwake", "Gullbreaker", "Ravenhull", "Saltfang", "Wrackwater"],
    bynames: ["the Drowned", "Saltborn", "the Reaver", "Stormreaver", "Oarbreaker", "the Wave-walker", "Ironkeeled", "the Sea's Own", "Deepwater-born", "the Gull-marked", "Wrackwood", "the Longship's Own"],
    syllables: {
      given: {
        male: { start: ["Dag", "Hal", "Iv", "Rag", "Tor", "Ulf", "Bal", "Eur", "Asl", "Bjor", "Erik", "Gun"], end: ["mar", "vard", "arr", "nor", "vin", "ric", "on", "on", "ak", "nar", "-", "dred"] },
        female: { start: ["Sig", "As", "Hel", "Thy", "Run", "Ash", "Ya", "Freya", "Bryn", "Dag", "Ing", "Tor"], end: ["run", "trid", "ka", "ra", "a", "a", "ra", "-a", "dis", "ny", "ra", "dis"] },
      },
    },
  },
  {
    id: "valyrian",
    name: "Valyrian Nobility",
    group: "Essos",
    hasSurnames: true,
    given: {
      male: ["Aeryon", "Daemyr", "Jaehon", "Vaeron", "Qorren", "Ondaryon", "Zhaeros", "Maelyx", "Corvaeryx", "Halaeryn", "Torvaeys", "Vhaerion", "Aemondar", "Belaeryx", "Draemos", "Solveryn"],
      female: ["Elaeryn", "Maelyra", "Vhaera", "Zaeryssa", "Aeliana", "Saelyra", "Rhaenora", "Ondriva", "Belaera", "Corveyra", "Daelyssa", "Faelyra", "Maeryssa", "Rhaevyn", "Vaelora", "Zhaelira"],
    },
    surnames: [],
    bynames: ["the Silver-eyed", "Flamebound", "the Ashwalker", "Highvalyrian", "the Old Blood", "Sky-touched", "the Fire-marked", "Valebound", "the Freehold's Own", "Ashen-crowned", "the Steel-blooded", "Starwrought"],
    syllables: {
      given: {
        male: { start: ["Aer", "Dae", "Jae", "Vae", "Qor", "Ondar", "Vhal", "Zhae", "Corv", "Hal", "Torv", "Bel"], end: ["yon", "myr", "hon", "ron", "ren", "yon", "ys", "mor", "aeryx", "aeryn", "aeys", "aeryx"] },
        female: { start: ["Elae", "Mae", "Vhae", "Zae", "Ael", "Sael", "Rhae", "Ondre", "Bel", "Corv", "Dael", "Fael"], end: ["ryn", "lyra", "ra", "ryssa", "iana", "yra", "nora", "iva", "aera", "eyra", "yssa", "yra"] },
      },
      surname: { start: ["Vhal", "Zar", "Qor", "Ondar", "Sael", "Dorn", "Maeg", "Tarv", "Rhaz", "Vael"], end: ["essar", "adon", "ivos", "ynar", "ossei", "ymere", "arys", "endor", "iveth", "arnis"] },
    },
  },
  {
    id: "braavosi",
    name: "Braavos",
    group: "Essos",
    hasSurnames: true,
    given: {
      male: ["Doriano", "Enzolo", "Marchetto", "Pietrande", "Ravello", "Salvazzo", "Andriano", "Cassivo", "Ferranzo", "Lucavio", "Montrello", "Oderico", "Tancredo", "Vespario", "Bellario", "Nicandro"],
      female: ["Beatrizza", "Fiorenta", "Lucrezia", "Sabrienne", "Vittora", "Zanetta", "Alessandrine", "Carmesia", "Doriella", "Estavine", "Larenzia", "Marisola", "Petravia", "Rosellina", "Sorenna", "Valentyra"],
    },
    surnames: [],
    bynames: ["of the Canal", "the Coinwise", "the Masked", "Silver-tongued", "the Sealord's Man", "Windward", "the Salt-tide", "Bridge-born", "the Water-dancer", "Lanternlit", "the Bank's Own", "Glasswrought"],
    syllables: {
      given: {
        male: { start: ["Dor", "Enz", "March", "Pietr", "Ravel", "Salvaz", "Cor", "Bel", "Andr", "Cass", "Ferr", "Luc"], end: ["iano", "olo", "etto", "ande", "lo", "zo", "vino", "assio", "iano", "ivo", "anzo", "avio"] },
        female: { start: ["Beatr", "Fior", "Lucr", "Sabri", "Vitt", "Zanet", "Mor", "Val", "Aless", "Carm", "Dor", "Estav"], end: ["izza", "enta", "ezia", "enne", "ora", "ta", "andra", "essa", "andrine", "esia", "iella", "ine"] },
      },
      surname: { start: ["Vel", "Bel", "Zan", "Cor", "Mor", "Sal", "Dar", "Ost"], end: ["assio", "andra", "ovine", "etti", "isso", "agno", "endro", "avin"] },
    },
  },
  {
    id: "dothraki",
    name: "The Dothraki",
    group: "Essos",
    hasSurnames: false,
    given: {
      male: ["Zhorak", "Vashak", "Kharo", "Dorvo", "Rakkar", "Motho", "Aggeth", "Bharo", "Fennak", "Haggar", "Jommo", "Kharzo", "Lhazor", "Ondek", "Shakko", "Vorreth"],
      female: ["Jhona", "Vaeska", "Zorrah", "Mirree", "Sethka", "Doshka", "Ashae", "Bhesa", "Fennika", "Haleth", "Jhirree", "Kessha", "Lharra", "Ondeska", "Shakia", "Vorra"],
    },
    surnames: [],
    bynames: ["Horselord", "the Bloodrider", "Windrider", "Stallion-kin", "the Sky-eyed", "Grass-born", "the Sea-crosser", "Bell-counted", "the Wide-plains-walker", "Sun-scorched Rider", "the Mare's Own", "Thunderhoof"],
    syllables: {
      given: {
        male: { start: ["Zho", "Vash", "Kha", "Dor", "Rak", "Mo", "Qot", "Ja", "Agg", "Bha", "Fenn", "Hagg"], end: ["rak", "ak", "ro", "vo", "kar", "tho", "hal", "kko", "eth", "ro", "ak", "ar"] },
        female: { start: ["Jho", "Vaes", "Zor", "Mir", "Seth", "Dosh", "Ir", "Le", "Ash", "Bhe", "Fenn", "Hal"], end: ["na", "ka", "rah", "ree", "ka", "ka", "ri", "ka", "ae", "sa", "ika", "eth"] },
      },
    },
  },
  {
    id: "freecities",
    name: "Free Cities (Merchant)",
    group: "Essos",
    hasSurnames: true,
    given: {
      male: ["Corvalio", "Estefano", "Milvestro", "Ondrago", "Petralio", "Vantoro", "Alderano", "Bellazar", "Casimero", "Dravento", "Ferronio", "Gallavesto", "Marentio", "Odarrio", "Salvestro", "Tancario"],
      female: ["Camilessa", "Estrelia", "Larenna", "Miravel", "Petrona", "Solvestra", "Alderina", "Bellandra", "Carmessa", "Dravena", "Ferrenza", "Galvessa", "Marenta", "Odaria", "Salvenna", "Tancessa"],
    },
    surnames: ["Silkhand", "Ambercoin", "Spicewright", "Goldweave", "Truehold", "Farsail", "Coinmark", "Veilcast", "Tradewind", "Amberglass", "Salttongue", "Windfare"],
    bynames: ["the Spice Trader", "Silktongue", "the Coin-counter", "Farsailor", "the Velvet Merchant", "Windcaller", "the Auction-hand", "Cargoborn", "the Fair-dealer", "Silkclad", "the Wharf-lord", "Tradewise"],
    syllables: {
      given: {
        male: { start: ["Corv", "Estef", "Milv", "Ondr", "Petr", "Vant", "Illyr", "Xar", "Alder", "Bell", "Casim", "Drav"], end: ["alio", "ano", "estro", "ago", "alio", "oro", "io", "ello", "ano", "azar", "ero", "ento"] },
        female: { start: ["Camil", "Estr", "Laren", "Mirav", "Petr", "Solv", "Dor", "Val", "Alder", "Bell", "Carm", "Ferr"], end: ["essa", "elia", "na", "el", "ona", "estra", "ea", "ondra", "ina", "andra", "essa", "enza"] },
      },
      surname: { start: ["Silk", "Amber", "Spice", "Gold", "True", "Far", "Coin", "Veil", "Trade", "Salt"], end: ["hand", "coin", "wright", "weave", "hold", "sail", "mark", "cast", "wind", "tongue"] },
    },
  },
  {
    id: "freefolk",
    name: "Free Folk",
    group: "Free Folk",
    hasSurnames: false,
    given: {
      male: ["Haldor", "Ragnvald", "Ulfgar", "Braggen", "Skarrow", "Vondrik", "Bjarn", "Colgrim", "Draven", "Erlend", "Gorrik", "Hraven", "Kolborn", "Norrik", "Torgeir", "Yorik"],
      female: ["Frigga", "Brenna", "Sela", "Vandra", "Ashka", "Runhild", "Bryndis", "Dagra", "Erwyn", "Halda", "Gerra", "Hjordis", "Kelda", "Norra", "Torhild", "Ysbeth"],
    },
    surnames: [],
    bynames: ["the Spearwife", "Ice-runner", "the Bear-slayer", "Windswept", "the Free", "Stormrunner", "the Wall-climber", "Snowtracker", "the Antler-marked", "Frostbitten", "the Trueborn Wild", "Ravenkissed"],
    syllables: {
      given: {
        male: { start: ["Hal", "Ragn", "Ulf", "Brag", "Skar", "Von", "Torg", "Craw", "Bjar", "Colg", "Drav", "Erl"], end: ["dor", "vald", "gar", "gen", "row", "drik", "eir", "ford", "n", "rim", "en", "end"] },
        female: { start: ["Frig", "Bren", "Sel", "Van", "Ash", "Run", "Ygg", "Hal", "Bryn", "Dag", "Ger", "Hjor"], end: ["ga", "na", "a", "dra", "ka", "hild", "a", "wyn", "dis", "ra", "ra", "dis"] },
      },
    },
  },

  // --- Great Houses (canon) ---
  // First names below are drawn from the source material — individual names
  // aren't protected expression, the same reason sites like fan name
  // generators can list them. Bynames are original, not the characters'
  // famous epithets, so no single generated name reads as a specific
  // character. Surname is fixed to the house name; "Surprise Me" still
  // procedurally generates the given name using that region's syllable style.
  {
    id: "house_stark",
    name: "House Stark",
    group: "Great Houses",
    hasSurnames: true,
    given: {
      male: ["Eddard", "Brandon", "Robb", "Jon", "Bran", "Rickon", "Benjen", "Cregan", "Rickard", "Torrhen", "Willam", "Beron", "Artos", "Edwyle", "Rodrik", "Jonnel"],
      female: ["Catelyn", "Sansa", "Arya", "Lyanna", "Lyarra", "Alys", "Sara", "Beth", "Jonelle", "Serena", "Alarra", "Berena", "Rodda", "Bethany", "Wilma", "Alyssa"],
    },
    surnames: ["Stark"],
    bynames: ["of Winterfell", "Warden of the North", "the Quiet Wolf", "Winter-blooded", "Ice in the Veins", "the Direwolf's Own", "Crypt-sworn", "the Long Winter's Kin"],
    syllables: {
      given: {
        male: { start: ["Ald", "Bryn", "Cor", "Os", "Tor", "Hal", "Dun", "Wil"], end: ["ric", "den", "win", "gar", "vald", "mund", "stan", "bert"] },
        female: { start: ["Al", "Ce", "Els", "Ro", "Wyn", "Mar", "Gwen", "Hil"], end: ["ysse", "ris", "beth", "wan", "ne", "isa", "da", "wyn"] },
      },
    },
  },
  {
    id: "house_lannister",
    name: "House Lannister",
    group: "Great Houses",
    hasSurnames: true,
    given: {
      male: ["Tywin", "Jaime", "Tyrion", "Kevan", "Lancel", "Damion", "Tygett", "Gerion", "Tyland", "Loreon", "Tybolt", "Gerold", "Damon", "Willem", "Stafford", "Daven"],
      female: ["Cersei", "Joanna", "Genna", "Myrcella", "Ellyn", "Cerenna", "Janei", "Tya", "Rohanne", "Lucinda", "Jocelyn", "Alysanne", "Dorna", "Tysha", "Rosamund", "Gemma"],
    },
    surnames: ["Lannister"],
    bynames: ["of Casterly Rock", "the Golden Lion", "Coin and Crown", "the Proud Lion", "Lord of the Rock", "Gold-handed", "the Rock-born", "Vault-sworn"],
    syllables: {
      given: {
        male: { start: ["Cer", "Cor", "Har", "Or", "Ren", "Wal", "Tyb", "Dam"], end: ["ion", "van", "lon", "mond", "nick", "demar", "olt", "aris"] },
        female: { start: ["Ser", "Il", "Mar", "Au", "Per", "Is", "Gen", "Jo"], end: ["ena", "yana", "igold", "relia", "rine", "olde", "na", "sette"] },
      },
    },
  },
  {
    id: "house_targaryen",
    name: "House Targaryen",
    group: "Great Houses",
    hasSurnames: true,
    given: {
      male: ["Aegon", "Rhaegar", "Viserys", "Daeron", "Baelor", "Maegor", "Aemon", "Jaehaerys", "Aerys", "Maekar", "Aegor", "Daemion", "Vaegon", "Aenys", "Duncan", "Maelor"],
      female: ["Rhaenys", "Daenerys", "Visenya", "Rhaella", "Naerys", "Alysanne", "Elaena", "Daenaera", "Rhaenyra", "Baela", "Rhaena", "Aemma", "Jaehaera", "Daella", "Shaera", "Elia"],
    },
    surnames: ["Targaryen"],
    bynames: ["of Dragonstone", "the Fireborn", "Dragonsong", "Blood of Old Valyria", "the Silver-haired", "Sky-blooded", "the Conqueror's Kin", "Flamewrought"],
    syllables: {
      given: {
        male: { start: ["Aer", "Dae", "Jae", "Vae", "Qor", "Ondar", "Vhal", "Zhae"], end: ["yon", "myr", "hon", "ron", "ren", "yon", "ys", "mor"] },
        female: { start: ["Elae", "Mae", "Vhae", "Zae", "Ael", "Sael", "Rhae", "Ondre"], end: ["ryn", "lyra", "ra", "ryssa", "iana", "yra", "nys", "a"] },
      },
    },
  },
  {
    id: "house_baratheon",
    name: "House Baratheon",
    group: "Great Houses",
    hasSurnames: true,
    given: {
      male: ["Robert", "Stannis", "Renly", "Orys", "Steffon", "Boremund", "Ormund", "Lyonel", "Rogar", "Borros", "Gowen", "Ossifer", "Ryam", "Argilac", "Durran", "Selwyn"],
      female: ["Cassana", "Shireen", "Argella", "Elenei", "Rhaelle", "Ossianne", "Maris", "Cassandra", "Ceriel", "Jocasta", "Lorra", "Argilla", "Wendra", "Bethel", "Marissa", "Alysanne"],
    },
    surnames: ["Baratheon"],
    bynames: ["of Storm's End", "the Stag-crowned", "Stormfist", "Thunder's Heir", "the Antlered Lord", "Storm-blooded", "the Tempest's Own", "Squall-marked"],
    syllables: {
      given: {
        male: { start: ["Or", "Al", "Ber", "Cor", "Har", "Ren", "Stef", "Bal"], end: ["mund", "yn", "tram", "en", "mond", "wick", "fen", "dric"] },
        female: { start: ["Beth", "El", "Mar", "Tal", "Wyn", "Ari", "Cas", "Sel"], end: ["any", "owyn", "is", "ya", "afred", "essa", "sana", "wyn"] },
      },
    },
  },
  {
    id: "house_tyrell",
    name: "House Tyrell",
    group: "Great Houses",
    hasSurnames: true,
    given: {
      male: ["Mace", "Garlan", "Loras", "Willas", "Luthor", "Leo", "Alester", "Moryn", "Theodore", "Victor", "Norbert", "Alan", "Osmund", "Denys", "Harlen", "Robar"],
      female: ["Olenna", "Margaery", "Alerie", "Elinor", "Desmera", "Janna", "Mina", "Victaria", "Amarei", "Bellena", "Corene", "Frennet", "Redanne", "Alysanne", "Rosamund", "Meredyth"],
    },
    surnames: ["Tyrell"],
    bynames: ["of Highgarden", "the Green Hand", "Rose and Thorn", "the Thornwise", "Bloom-blooded", "the Garden Lord", "Petal-sworn", "the Bountiful"],
    syllables: {
      given: {
        male: { start: ["Al", "Ber", "Den", "Gar", "Per", "Wil", "Fen", "Lor"], end: ["erin", "trand", "holt", "rick", "onne", "ombe", "ric", "ance"] },
        female: { start: ["Ros", "Li", "Mar", "Ys", "Fen", "Au", "Ce", "Bri"], end: ["eanne", "ana", "ibel", "bel", "elyn", "relie", "line", "ony"] },
      },
    },
  },
  {
    id: "house_martell",
    name: "House Martell",
    group: "Great Houses",
    hasSurnames: true,
    given: {
      male: ["Doran", "Oberyn", "Quentyn", "Trystane", "Maron", "Nymor", "Anders", "Qoren", "Dagos", "Ammon", "Deziel", "Edgar", "Simon", "Aidan", "Malcolm", "Cletus"],
      female: ["Elia", "Arianne", "Nymeria", "Meria", "Mariah", "Deria", "Loreza", "Sarella", "Delonne", "Larra", "Mellario", "Obara", "Sylva", "Alysanne", "Rhonda", "Tyene"],
    },
    surnames: ["Martell"],
    bynames: ["of Sunspear", "the Sandsnake", "Sun-scorched Blood", "the Spear-hand", "Dornish Fire", "the Desert Rose", "Sand-sworn", "the Viperkin"],
    syllables: {
      given: {
        male: { start: ["Alv", "Dam", "Fen", "Ram", "Tar", "Yn", "Sal", "Mor"], end: ["arro", "aso", "naro", "iro", "ico", "igo", "azar", "eo"] },
        female: { start: ["Del", "Mir", "Sera", "Yn", "Zor", "Estre", "Nym", "Ari"], end: ["fina", "eya", "fina", "ez", "ah", "lla", "essa", "ane"] },
      },
    },
  },
  {
    id: "house_tully",
    name: "House Tully",
    group: "Great Houses",
    hasSurnames: true,
    given: {
      male: ["Hoster", "Edmure", "Brynden", "Elmo", "Ryman", "Kermit", "Desmond", "Grover", "Petyr", "Andrew", "Clement", "Edwyn", "Mark", "Symon", "Deric", "Wayn"],
      female: ["Catelyn", "Lysa", "Minisa", "Mariya", "Roslin", "Cyrenna", "Ysilla", "Rhonda", "Lucinda", "Shella", "Wenna", "Bessa", "Perra", "Jeyne", "Ella", "Mya"],
    },
    surnames: ["Tully"],
    bynames: ["of Riverrun", "the River Lord", "Trout-blooded", "the Steadfast Fish", "the Riverborn", "Current-kept", "Weir-sworn", "the Fording Lord"],
    syllables: {
      given: {
        male: { start: ["Den", "Har", "Mal", "Per", "Wen", "Jor", "Ed", "Rowe"], end: ["ys", "lan", "lon", "ren", "del", "ren", "mund", "ford"] },
        female: { start: ["Mer", "Tal", "Ys", "Per", "Mar", "Ed", "Ce", "Ann"], end: ["aud", "ia", "olde", "ianne", "sel", "e", "lyn", "wen"] },
      },
    },
  },
  {
    id: "house_arryn",
    name: "House Arryn",
    group: "Great Houses",
    hasSurnames: true,
    given: {
      male: ["Jon", "Elbert", "Jasper", "Ronnel", "Osric", "Rodrik", "Denys", "Jeffory", "Marq", "Isembard", "Symond", "Terrance", "Gerold", "Ellard", "Vance", "Uthor"],
      female: ["Lysa", "Alys", "Jeyne", "Amanda", "Coryanne", "Ysilla", "Marla", "Anya", "Denyse", "Ravella", "Elys", "Cassella", "Iona", "Wynetta", "Alynne", "Tessaria"],
    },
    surnames: ["Arryn"],
    bynames: ["of the Eyrie", "the Falcon's Ward", "Sky-throned", "the High Lord", "Eyrie-born", "the Mountain Judge", "Cloud-sworn", "Vale-blooded"],
    syllables: {
      given: {
        male: { start: ["Ed", "Lu", "Per", "Al", "Ron", "Ger", "Way", "Aer"], end: ["mond", "can", "is", "dous", "nel", "old", "land", "ric"] },
        female: { start: ["El", "An", "Sel", "Mir", "Ys", "Cor", "Gwyn", "Fai"], end: ["owen", "ya", "yne", "ielle", "abel", "enna", "eth", "rah"] },
      },
    },
  },
  {
    id: "house_greyjoy",
    name: "House Greyjoy",
    group: "Great Houses",
    hasSurnames: true,
    given: {
      male: ["Balon", "Euron", "Victarion", "Aeron", "Theon", "Quellon", "Rodrik", "Urrigon", "Dagon", "Sawane", "Torgon", "Gorold", "Quenton", "Dunstan", "Erik", "Hotho"],
      female: ["Asha", "Alannys", "Gwynesse", "Dalla", "Nyessa", "Cerys", "Alysanne", "Gwin", "Sharra", "Aelyn", "Denna", "Wylla", "Ysella", "Ornela", "Bethany", "Marla"],
    },
    surnames: ["Greyjoy"],
    bynames: ["of Pyke", "the Kraken's Own", "Ironborn Reaver", "Salt and Iron", "the Drowned Heir", "Sea-taken", "Longship-sworn", "the Paying-price"],
    syllables: {
      given: {
        male: { start: ["Dag", "Hal", "Iv", "Rag", "Tor", "Ulf", "Bal", "Eur"], end: ["mar", "vard", "arr", "nor", "vin", "ric", "on", "on"] },
        female: { start: ["Sig", "As", "Hel", "Thy", "Run", "Ash", "Ya", "Freya"], end: ["run", "trid", "ka", "ra", "a", "a", "ra", "-a"] },
      },
    },
  },
];

export function getCulture(id: string): CultureBank | undefined {
  return NAME_CULTURES.find((c) => c.id === id);
}
