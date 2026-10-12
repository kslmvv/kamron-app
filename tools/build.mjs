/**
 * Сборка приложения: модули из src/ собираются в один файл app.js.
 *
 * Зачем бандл, а если модули и так работают в браузере: страницу нужно
 * открывать и напрямую из файла (file://), а там ES-модули запрещены
 * политикой источников. Один классический скрипт открывается и локально,
 * и с GitHub Pages, и кэшируется service worker одной записью.
 */
import { build, context } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const watch = process.argv.includes('--watch');

/** Версия сборки попадает и в интерфейс, и в имя кэша service worker. */
const buildName = `MVP ${pkg.version.split('.').slice(0, 2).join('.')}`;

const options = {
  entryPoints: [join(root, 'src/main.js')],
  outfile: join(root, 'app.js'),
  bundle: true,
  format: 'iife',
  target: ['safari15', 'chrome100', 'firefox100'],
  charset: 'utf8',
  sourcemap: true,
  legalComments: 'none',
  define: { __APP_BUILD__: JSON.stringify(buildName) },
  banner: {
    js:
      `/* Kamron APP ${pkg.version} — собрано из src/. Не редактируйте этот файл: ` +
      `правки вносятся в src/ и применяются командой npm run build. */`
  }
};

/** Имя кэша service worker привязано к версии, иначе старые файлы останутся у пользователя. */
function syncServiceWorker() {
  const path = join(root, 'sw.js');
  const next = readFileSync(path, 'utf8').replace(
    /const CACHE = '[^']*'/,
    `const CACHE = 'kamron-app-v${pkg.version}'`
  );
  writeFileSync(path, next);
}

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  syncServiceWorker();
  console.log('Следим за src/ — app.js пересобирается при каждом изменении.');
} else {
  const result = await build({ ...options, metafile: true });
  syncServiceWorker();
  const out = Object.values(result.metafile.outputs).find(o => o.entryPoint);
  console.log(
    `app.js собран: ${(out.bytes / 1024).toFixed(1)} КБ, модулей: ${Object.keys(result.metafile.inputs).length}`
  );
}
