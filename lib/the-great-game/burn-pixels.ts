/** Every source RGBA pixel belongs to exactly one dust layer. Their union is the original image. */
export function distributeBurnPixels(source: Uint8ClampedArray, width: number, height: number, count: number): Uint8ClampedArray<ArrayBuffer>[] {
  const groups = Array.from({ length: count }, () => new Uint8ClampedArray(width * height * 4));
  for (let pixel = 0; pixel < width * height; pixel++) {
    const offset = pixel * 4;
    if (!source[offset + 3]) continue;
    let hash = Math.imul(pixel + 1, 0x45d9f3b);
    hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
    const noise = ((hash ^ (hash >>> 16)) >>> 0) / 4294967296;
    const peak = (1 - (pixel % width) / Math.max(1, width - 1)) * (count - 1);
    const index = Math.max(0, Math.min(count - 1, Math.round(peak + (noise - .5) * count * .32)));
    // Avoid allocating a typed-array view for every pixel during reveal preparation.
    const group = groups[index];
    group[offset] = source[offset];
    group[offset + 1] = source[offset + 1];
    group[offset + 2] = source[offset + 2];
    group[offset + 3] = source[offset + 3];
  }
  return groups;
}
