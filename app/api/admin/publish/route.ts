// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\api\admin\publish\route.ts
import { after, NextResponse } from "next/server";
import { z } from "zod";
import { CharacterSchema } from "../../../../schemas/character";
import { HouseListSchema } from "../../../../schemas/house";
import { WorldDateSchema } from "../../../../schemas/worldDate";
import { ScrollListSchema } from "../../../../schemas/scroll";
import { KingsguardListSchema } from "../../../../schemas/kingsguardEntry";
import { DragonListSchema } from "../../../../schemas/dragon";
import { TimelineListSchema } from "../../../../schemas/timeline";
import { MapLocationListSchema } from "../../../../schemas/mapLocation";
import { CharacterPositionsSchema } from "../../../../schemas/characterPositions";
import { ChapterListSchema } from "../../../../schemas/chapter";
import { GalleryListSchema } from "../../../../schemas/gallery";
import { MapEventListSchema } from "../../../../schemas/map";
import { BloodshedListSchema } from "../../../../schemas/bloodshed";
import { updateMultipleFilesOnGithub } from "@/lib/github";
import currentGallery from "@/data/gallery.json";
import currentChapters from "@/data/chapters.json";
import { broadcastSiteNotification } from "@/lib/notifications/server";
import { isLuckAdmin } from "@/lib/adminAccess";

export async function POST(request: Request) {
  if (!(await isLuckAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await request.json();
    const {
      characters,
      quotes,
      houses,
      worldDate,
      scrolls,
      bookOfBrothers,
      dragons,
      timeline,
      mapLocations,
      characterPositions,
      chapters,
      gallery,
      events,
      bloodshed,
    } = body;

    const files: { path: string; content: unknown }[] = [];

    if (characters) {
      const validatedChars = z.array(CharacterSchema).parse(characters);
      files.push({ path: "data/characters/characters.json", content: validatedChars });
    }

    if (quotes) {
      files.push({ path: "data/quotes.json", content: quotes });
    }

    if (houses) {
      const validatedHouses = HouseListSchema.parse(houses);
      files.push({ path: "data/houses.json", content: validatedHouses });
    }

    if (worldDate) {
      const validatedDate = WorldDateSchema.parse(worldDate);
      files.push({ path: "data/worldDate.json", content: validatedDate });
    }

    if (scrolls) {
      const validatedScrolls = ScrollListSchema.parse(scrolls);
      files.push({ path: "data/scrolls.json", content: validatedScrolls });
    }

    if (bookOfBrothers) {
      const validatedEntries = KingsguardListSchema.parse(bookOfBrothers);
      files.push({ path: "data/bookOfBrothers.json", content: validatedEntries });
    }

    if (dragons) {
      const validatedDragons = DragonListSchema.parse(dragons);
      files.push({ path: "data/dragons.json", content: validatedDragons });
    }

    if (timeline) {
      const validatedTimeline = TimelineListSchema.parse(timeline);
      files.push({ path: "data/timeline.json", content: validatedTimeline });
    }

    if (mapLocations) {
      const validatedLocations = MapLocationListSchema.parse(mapLocations);
      files.push({ path: "data/map/locations.json", content: validatedLocations });
    }

    if (characterPositions) {
      const validatedPositions = CharacterPositionsSchema.parse(characterPositions);
      files.push({ path: "data/map/character-positions.json", content: validatedPositions });
    }

    if (chapters) {
      const validatedChapters = ChapterListSchema.parse(chapters);
      files.push({ path: "data/chapters.json", content: validatedChapters });
    }

    if (gallery) {
      const validatedGallery = GalleryListSchema.parse(gallery);
      files.push({ path: "data/gallery.json", content: validatedGallery });
    }

    if (events) {
      const validatedEvents = MapEventListSchema.parse(events);
      files.push({ path: "data/events.json", content: validatedEvents });
    }

    if (bloodshed) {
      const validatedBloodshed = BloodshedListSchema.parse(bloodshed);
      files.push({ path: "data/bloodshed.json", content: validatedBloodshed });
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, message: "No changes to publish." },
        { status: 400 }
      );
    }

    await updateMultipleFilesOnGithub(files, "Publish changes via admin panel");

    if (gallery) {
      const previousIds = new Set((currentGallery as { id: string }[]).map((item) => item.id));
      const added = (gallery as Array<{ id: string; src: string; caption?: string; category?: string }>).filter((item) => !previousIds.has(item.id));
      for (const item of added) {
        const isVideo = /\.(mp4|webm|mov)(?:[?#].*)?$/i.test(item.src);
        const kind = isVideo ? "gutter_reel" as const : item.category === "fleabottom" ? "gutter_meme" as const : "ravens_eye_image" as const;
        const href = kind === "gutter_reel" ? `/ravens-eye/reels?item=${encodeURIComponent(item.id)}` : kind === "gutter_meme" ? `/ravens-eye/memes?item=${encodeURIComponent(item.id)}` : `/ravens-eye?item=${encodeURIComponent(item.id)}`;
        after(() => broadcastSiteNotification({ kind, href, sourceLabel: item.caption?.trim().split("\n")[0].slice(0, 140) || "Fresh sighting", context: { entryId: item.id }, groupKey: `publish:${kind}`, dedupeKey: `publish:${kind}:${item.id}:{recipient}` }));
      }
    }
    if (chapters) {
      const previousSlugs = new Set((currentChapters as { slug: string }[]).map((item) => item.slug));
      const added = (chapters as Array<{ slug: string; title?: string }>).filter((item) => !previousSlugs.has(item.slug));
      for (const chapter of added) after(() => broadcastSiteNotification({ kind: "new_chapter", href: `/chapters/${encodeURIComponent(chapter.slug)}`, sourceLabel: chapter.title ?? "A new chapter", context: { chapterSlug: chapter.slug }, groupKey: "publish:new-chapter", dedupeKey: `publish:chapter:${chapter.slug}:{recipient}` }));
    }

    return NextResponse.json({ success: true, message: "Published successfully!" });
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json(
      { success: false, message: "Error publishing changes." },
      { status: 500 }
    );
  }
}
