/**
 * Сборка Kamron APP.
 *
 * Приложение — один классический скрипт app.js и один styles.css: страница
 * должна открываться и напрямую из файла (file://), где ES-модули запрещены
 * политикой источников. Собирать нечего, поэтому сборка делает то, что
 * иначе забывается руками: проставляет версию в имя кэша service worker
 * и в подпись в настройках.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

function stamp(file, pattern, replacement) {
  const path = join(root, file);
  const before = readFileSync(path, 'utf8');
  const after = before.replace(pattern, replacement);
  if (after !== before) writeFileSync(path, after);
  return after !== before;
}

const sw = stamp('sw.js', /const CACHE = '[^']*'/, `const CACHE = 'kamron-app-v${pkg.version}'`);
const app = stamp('app.js', /var VERSION = '[^']*'/, `var VERSION = '${pkg.version}'`);

/**
 * Список доступных анимаций.
 *
 * Без него приложение дёргало бы каждый файл наугад и ловило 404 на
 * каждой сцене, для которой анимацию ещё не положили. Список собирается
 * из папки, поэтому добавить анимацию — это положить файл и собрать.
 */
const animDir = join(root, 'anim');
const anims = readdirSync(animDir)
  .filter(name => name.endsWith('.json') && name !== 'index.json')
  .map(name => name.replace(/\.json$/, ''))
  .sort();
writeFileSync(join(animDir, 'index.json'), JSON.stringify(anims) + '\n');

console.log(
  `Версия ${pkg.version}: sw.js ${sw ? 'обновлён' : 'уже актуален'}, app.js ${app ? 'обновлён' : 'уже актуален'}.\n` +
    `Анимаций в anim/: ${anims.length}${anims.length ? ' — ' + anims.join(', ') : ''}.`
);
