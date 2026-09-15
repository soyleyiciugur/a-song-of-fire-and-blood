import release from "@/data/app-shell-release.json";

export const shellRelease = release;
export function needsReinstall(installed: number | null) {
  return release.reinstallRequired && installed !== null && installed < release.version;
}
export const reinstallCopy = {
  mara: { title: "The old seal will not do.", body: "This update needs The Rookery 🐦‍⬛ added to your Home Screen again. Remove the old one and return when you are ready." },
  aldren: { title: "A fresh seal is required.", body: "My liege, this update asks that The Rookery 🐦‍⬛ be added to your Home Screen anew. A small ceremony, I assure you." },
};
