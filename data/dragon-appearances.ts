import chaptersData from "./chapters.json";
import { dragons } from "./dragons";

type AppearanceRef = { chapterSlug: string; anchor: string; label: string };

// Editorial pointers only: scene copy always comes from chapters.json. Each
// pointer confirms a physical appearance, excluding recollections and props.
const APPEARANCE_REFS: Record<string, AppearanceRef[]> = {
  maelwing: [{ chapterSlug: "the-mummers-blood", anchor: "Maelwing!", label: "The claiming of Maelwing" }],
  jhagar: [
    { chapterSlug: "a-crown-of-thorns", anchor: "To clear his head, Jace sought out the Dragonpit", label: "Training in the Dragonpit" },
    { chapterSlug: "the-viper-in-silk", anchor: "A few yards away, the young dragon Jhagar", label: "The training yard" },
    { chapterSlug: "the-reunion", anchor: "Jace had begun training his young dragon", label: "A particular maneuver" },
    { chapterSlug: "the-glass-flower", anchor: "the young dragon Jhagar were far away", label: "The glass-flower proposal" },
  ],
  cloudgazer: [
    { chapterSlug: "the-weight-of-loyalty", anchor: "Cloudgazer waited upon the cliffs", label: "Flight from King's Landing" },
    { chapterSlug: "the-glass-flower", anchor: "High above in the clouds, Cloudgazer", label: "The high valley and the northern flight" },
    { chapterSlug: "the-children-pay", anchor: "Cloudgazer crouched beneath the pale morning sky", label: "Departure from Winterfell" },
    { chapterSlug: "until-the-last-breath", anchor: "Cloudgazer settled heavily upon the ground", label: "Return to King's Landing" },
    { chapterSlug: "the-eye-in-the-storm", anchor: "The dragon spread her wings", label: "Into the storm" },
  ],
  jadefyre: [
    { chapterSlug: "the-poison-beneath-the-crown", anchor: "the dragon eggs began to crack", label: "Three hatchlings" },
    { chapterSlug: "fathers-and-their-sins", anchor: "the small, scaled head of the hatchling dragon", label: "Maela's hatchling" },
  ],
  boneskin: [
    { chapterSlug: "the-climb-and-the-kneel", anchor: "Boneskin emerged from the cave", label: "The first approach" },
    { chapterSlug: "the-viper-in-silk", anchor: "Boneskin heard him coming", label: "The bond and the hidden egg" },
    { chapterSlug: "the-children-pay", anchor: "Boneskin remained within", label: "Rhaella at the cave" },
    { chapterSlug: "the-children-pay", anchor: "Boneskin came low over the ridge", label: "Rhaella's final command" },
  ],
  "boneskins-egg": [{ chapterSlug: "the-viper-in-silk", anchor: "staring pointedly at the large, scaled egg", label: "The egg in the mountain cave" }],
  ashfyre: [{ chapterSlug: "the-poison-beneath-the-crown", anchor: "the dragon eggs began to crack", label: "Three hatchlings" }],
  palefyre: [{ chapterSlug: "the-poison-beneath-the-crown", anchor: "the dragon eggs began to crack", label: "Three hatchlings" }],
  sheepstealer: [{ chapterSlug: "judgment-by-blood", anchor: "Angos, Sheepstealer", label: "Beneath the Dragonpit" }],
  sunfyre: [{ chapterSlug: "judgment-by-blood", anchor: "Golden wings caught the light", label: "The dragons beyond the Narrow Sea" }],
  "unknown-white-dragon": [{ chapterSlug: "the-eye-in-the-storm", anchor: "A dragon emerged through the storm", label: "The eye in the storm" }],
};

type ChapterRow = { slug: string; title: string; content: string[] };
const chapters = chaptersData as ChapterRow[];

export type DragonAppearance = { dragonId: string; dragonName: string; chapterSlug: string; chapterTitle: string; label: string; excerpt: string };

function sceneExcerpt(text: string) {
  const clean = text.trim();
  return clean.length > 210 ? `${clean.slice(0, 207).trimEnd()}…` : clean;
}

export function getDragonAppearances(dragonId: string): DragonAppearance[] {
  const dragon = dragons.find((item) => item.id === dragonId);
  if (!dragon) return [];
  return (APPEARANCE_REFS[dragonId] ?? []).flatMap((ref) => {
    const chapter = chapters.find((item) => item.slug === ref.chapterSlug);
    const paragraph = chapter?.content.find((item) => item.includes(ref.anchor));
    if (!chapter || !paragraph) return [];
    return [{ dragonId, dragonName: dragon.name, chapterSlug: chapter.slug, chapterTitle: chapter.title, label: ref.label, excerpt: sceneExcerpt(paragraph) }];
  });
}

export function getChapterDragonAppearances(chapterSlug: string): DragonAppearance[] {
  return dragons.flatMap((dragon) => getDragonAppearances(dragon.id)).filter((appearance) => appearance.chapterSlug === chapterSlug);
}
