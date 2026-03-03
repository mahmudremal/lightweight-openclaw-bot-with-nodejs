const args = process.argv.slice(2);
const count = parseInt(args[0]) || 5;

const generateColor = () => {
  const h = Math.floor(Math.random() * 360);
  const s = Math.floor(Math.random() * 40) + 40; // 40-80%
  const l = Math.floor(Math.random() * 40) + 30; // 30-70%
  return `hsl(${h}, ${s}%, ${l}%)`;
};

console.log(`\n🎨 Generated Color Palette (${count} colors):`);
console.log(`──────────────────────────────────────────`);
for (let i = 0; i < count; i++) {
  const color = generateColor();
  console.log(`${i + 1}. ${color}`);
}
console.log(`──────────────────────────────────────────\n`);
