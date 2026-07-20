// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\api\admin\publish\route.ts
import { NextResponse } from "next/server";
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
import { updateMultipleFilesOnGithub } from "@/lib/github";

export async function POST(request: Request) {
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

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, message: "No changes to publish." },
        { status: 400 }
      );
    }

    await updateMultipleFilesOnGithub(files, "Publish changes via admin panel");

    return NextResponse.json({ success: true, message: "Published successfully!" });
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json(
      { success: false, message: "Error publishing changes." },
      { status: 500 }
    );
  }
}
