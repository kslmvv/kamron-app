/**
 * Сверяет, что всё, на что ссылается опубликованная страница, в сборке есть.
 *
 * На Pages уезжает не весь репозиторий, а явный список файлов, и новая
 * папка в него легко не попадает. Так уже случилось дважды: vendor/ и
 * anim/ остались дома, страница ссылалась на пустоту, и приложение на
 * телефоне молча оставалось прежним. Пусть падает сборка, а не телефон.
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize } from 'node:path';

const dist = process.argv[2] || join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const html = readFileSync(join(dist, 'index.html'), 'utf8');

const refs = new Set();
for (const m of html.matchAll(/(?:src|href)="(\.\/[^"#?]+)"/g)) refs.add(m[1]);

const missing = [...refs].filter(ref => !existsSync(join(dist, normalize(ref))));
if (missing.length) {
  console.error('В сборке нет файлов, на которые ссылается index.html:');
  for (const ref of missing) console.error('  ' + ref);
  console.error('Добавьте их в шаг «Собрать то, что уходит на хостинг» в .github/workflows/pages.yml.');
  process.exit(1);
}
console.log(`Сборка полная: ${refs.size} ссылок, все файлы на месте.`);
