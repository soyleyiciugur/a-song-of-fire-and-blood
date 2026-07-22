// ─── C:\Users\Locpick-13\a-song-of-fire-and-blood\types\chapter.ts ───
//
// Updated Chapter type.  Drop this in place of the old types/chapter.ts.
//
// New optional fields:
//   titleTr    — Turkish chapter title (falls back to `title` if absent)
//   synopsisTr — Turkish synopsis      (falls back to `synopsis` if absent)
//   contentTr  — Turkish paragraphs    (falls back to `content` if absent)
//
// Image blocks:
//   Any string in `content` or `contentTr` that matches the pattern
//   [IMAGE:filename.webp]  will be rendered as an image in the reader.
//   The image file must live at  /public/images/chapters/filename.webp

export interface Chapter {
  slug:       string;
  title:      string;
  synopsis:   string;
  image:      string;
  content:    string[];

  // ── i18n (optional) ──────────────────────────────────────────
  titleTr?:    string;
  synopsisTr?: string;
  contentTr?:  string[];
}