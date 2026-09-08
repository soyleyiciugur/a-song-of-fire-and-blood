"use client";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";

export default function ChapterCover(props: ImageProps) {
  const [failed, setFailed] = useState(false);
  return <Image {...props} src={failed ? "/images/home/a-song-of-fire-and-blood.webp" : props.src} onError={() => setFailed(true)} />;
}
