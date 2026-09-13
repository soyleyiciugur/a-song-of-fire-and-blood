import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "A Song of Fire and Blood",
    short_name: "The Rookery 🐦‍⬛",
    description: "A Song of Fire and Blood",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    orientation: "portrait-primary",
    categories: ["entertainment", "social"],
    prefer_related_applications: false,

    background_color: "#090706",
    theme_color: "#090706",

    icons: [
      {
        src: "/icon.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "any",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      { name: "Raven Notifications", short_name: "Ravens", url: "/notifications" },
      { name: "The Raven's Eye", short_name: "Raven's Eye", url: "/ravens-eye" },
      { name: "The Chronicle", short_name: "Chronicle", url: "/chapters" },
      { name: "Calendar", short_name: "Calendar", url: "/calendar" },
    ],
  };
}
