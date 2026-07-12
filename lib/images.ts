// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\lib\images.ts
export const IMAGE_PATHS = {
  characters: "/images/characters",
  chapters: "/images/chapters",
} as const;

export function characterPortrait(filename: string) {
  return `${IMAGE_PATHS.characters}/${filename}.webp`;
}

export function chapterCover(filename: string) {
  return `${IMAGE_PATHS.chapters}/${filename}.webp`;
}