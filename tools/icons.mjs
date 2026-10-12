/**
 * Растровые иконки из SVG.
 *
 * SVG хватает для вкладки браузера, но iOS не берёт его для иконки на
 * домашнем экране, а Android ждёт отдельный maskable-вариант с запасом
 * по краям. Запускать только после правки файлов в icons/*.svg.
 */
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const icons = join(root, 'icons');

const JOBS = [
  ['icon-square.svg', 'apple-touch-icon.png', 180],
  ['icon-square.svg', 'icon-192.png', 192],
  ['icon-square.svg', 'icon-512.png', 512],
  ['icon-maskable.svg', 'icon-maskable-512.png', 512],
  ['icon-square.svg', 'icon-1024.png', 1024]
];

for (const [from, to, size] of JOBS) {
  await sharp(readFileSync(join(icons, from)), { density: 384 })
    .resize(size, size, { fit: 'cover' })
    .flatten({ background: '#e9f2fb' })
    .png({ compressionLevel: 9 })
    .toFile(join(icons, to));
  console.log(`${to.padEnd(26)} ${size}x${size}`);
}
