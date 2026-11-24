'use strict';
// Downloads the Unsplash photos in content/photos.json and writes WebP sizes to public/img/<name>-<w>.webp.
// Also writes content/credits.json for the credits page. Usage: node scripts/photos.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const list = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'photos.json'), 'utf8'));
const OUT = path.join(ROOT, 'public', 'img');
const SIZES = [640, 1024, 1600];
const PORTRAIT_SIZES = [320, 640];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const credits = [];
  for (const [name, photo, author, username, alt] of list) {
    const portrait = name.startsWith('person-');
    const sizes = portrait ? PORTRAIT_SIZES : SIZES;
    const done = sizes.every((w) => fs.existsSync(path.join(OUT, `${name}-${w}.webp`)));
    if (!done) {
      const url = `https://images.unsplash.com/${photo}?ixlib=rb-4.1.0&q=85&fm=jpg&w=${portrait ? 900 : 2000}${portrait ? '&h=1100&fit=crop&crop=faces' : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      for (const w of sizes) {
        await sharp(buf).resize({ width: w, withoutEnlargement: true }).webp({ quality: portrait ? 78 : 72 }).toFile(path.join(OUT, `${name}-${w}.webp`));
      }
      console.log('saved', name);
    }
    const meta = await sharp(path.join(OUT, `${name}-${sizes[0]}.webp`)).metadata();
    credits.push({ name, author, profile: `https://unsplash.com/@${username}`, alt, ratio: +(meta.width / meta.height).toFixed(4), sizes });
  }
  fs.writeFileSync(path.join(ROOT, 'content', 'credits.json'), JSON.stringify(credits, null, 2) + '\n');
  console.log(`${credits.length} photos ready.`);
})().catch((e) => { console.error(e.message); process.exit(1); });
