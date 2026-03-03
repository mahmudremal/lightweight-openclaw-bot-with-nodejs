const styles = [
  "Cyberpunk",
  "Minimalist",
  "Vibrant",
  "Ethereal",
  "Industrial",
  "Sketch",
  "Oil Painting",
];
const lights = [
  "Volumetric Lighting",
  "Golden Hour",
  "Neon Glow",
  "Soft Ambient",
  "High Contrast",
];
const cameras = [
  "8k Resolution",
  "Unreal Engine 5 Render",
  "Macro Shot",
  "Wide Angle",
  "Photorealistic",
];

const args = process.argv.slice(2);
const basePrompt = args.join(" ") || "Something beautiful";

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

const boosted = `${basePrompt}, ${random(styles)} style, ${random(lights)}, ${random(cameras)}, highly detailed, masterpiece quality.`;

console.log(`\n🚀 Enhanced Prompt for AI Generation:`);
console.log(`──────────────────────────────────────────`);
console.log(boosted);
console.log(`──────────────────────────────────────────\n`);
