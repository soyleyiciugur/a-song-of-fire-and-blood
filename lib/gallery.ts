import galleryData from "@/data/gallery.json";

const VIDEO_EXT = [".mp4", ".webm", ".mov"];
function isVideo(src: string) {
  const lower = src.toLowerCase();
  return VIDEO_EXT.some((ext) => lower.endsWith(ext));
}

export function getRandomSeriousGalleryItem() {
  const serious = (galleryData as any[]).filter(
    (item) => item.category === "raven" && !isVideo(item.src)
  );
  if (serious.length === 0) return null;
  return serious[Math.floor(Math.random() * serious.length)];
}