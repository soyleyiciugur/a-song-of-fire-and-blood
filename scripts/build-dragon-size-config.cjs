const fs = require("node:fs");

const config = JSON.parse(fs.readFileSync("data/dragon-size-comparison.json", "utf8"));

config.dragons = config.dragons.map((dragon) => {
  const svg = fs.readFileSync(`public/images/dragons/sizes/clean/${dragon.id}.svg`, "utf8");
  const [, viewBox] = svg.match(/viewBox="([^"]+)"/);
  const [, , intrinsicWidth, intrinsicHeight] = viewBox.split(/\s+/).map(Number);
  return {
    ...dragon,
    asset: `/images/dragons/sizes/clean/${dragon.id}.svg`,
    intrinsicWidth,
    intrinsicHeight,
  };
});

fs.writeFileSync("data/dragon-size-comparison.json", `${JSON.stringify(config, null, 2)}\n`);
console.log(`Refreshed dimensions for ${config.dragons.length} dragon comparison records.`);
