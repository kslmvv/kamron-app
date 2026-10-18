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

/**
 * Для iOS — отдельный исходник без скругления.
 *
 * Систему углы не интересуют: она накладывает свою маску поверх. Наше
 * скругление под ней превращается в светлый ореол по краю иконки, а
 * прозрачность в углах App Store вообще не принимает.
 */
const JOBS = [
  ['icon-ios.svg', join(icons, 'apple-touch-icon.png'), 180, '#0b0d08'],
  ['icon-square.svg', join(icons, 'icon-192.png'), 192, '#e9f2fb'],
  ['icon-square.svg', join(icons, 'icon-512.png'), 512, '#e9f2fb'],
  ['icon-maskable.svg', join(icons, 'icon-maskable-512.png'), 512, '#e9f2fb'],
  ['icon-square.svg', join(icons, 'icon-1024.png'), 1024, '#e9f2fb'],
  // Иконка нативного приложения живёт в каталоге Xcode, а не в icons/.
  // Пока её не собирала эта команда, она отстала от логотипа на три дня.
  ['icon-ios.svg', join(root, 'ios', 'KamronAPP', 'Assets.xcassets', 'AppIcon.appiconset', 'icon-1024.png'), 1024, '#0b0d08']
];

for (const [from, to, size, bg] of JOBS) {
  await sharp(readFileSync(join(icons, from)), { density: 384 })
    .resize(size, size, { fit: 'cover' })
    .flatten({ background: bg })
    .png({ compressionLevel: 9 })
    .toFile(to);
  console.log(`${to.replace(root + '/', '').padEnd(58)} ${size}x${size}`);
}
