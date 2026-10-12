/**
 * Проверка собранного app.js на неопределённые ссылки.
 *
 * Разбиение на модули легко теряет импорт, и такая ошибка не видна ни
 * node --check, ни сборщику: она появляется только при открытии экрана.
 * Здесь код разбирается парсером, строятся области видимости и ищутся
 * имена, которые нигде не объявлены и не являются браузерным API.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as acorn from 'acorn';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(root, 'app.js');
const ast = acorn.parse(readFileSync(file, 'utf8'), { ecmaVersion: 2022, sourceType: 'script' });

const GLOBALS = new Set([
  'window','document','navigator','location','localStorage','sessionStorage','indexedDB','crypto',
  'console','setTimeout','clearTimeout','setInterval','clearInterval','requestAnimationFrame',
  'fetch','URL','URLSearchParams','Blob','File','FileReader','FormData','Headers','Request','Response',
  'Promise','Object','Array','String','Number','Boolean','Math','JSON','Date','RegExp','Map','Set',
  'WeakMap','WeakSet','Symbol','Error','TypeError','RangeError','Intl','isNaN','isFinite','parseInt',
  'parseFloat','encodeURIComponent','decodeURIComponent','encodeURI','decodeURI','structuredClone',
  'Notification','TextEncoder','TextDecoder','AbortController','Event','CustomEvent','globalThis',
  'undefined','NaN','Infinity','arguments','self','top','screen','history','performance','queueMicrotask',
  'Uint8Array','ArrayBuffer','DataView','Proxy','Reflect','BigInt','IntersectionObserver','MutationObserver',
  'ResizeObserver','matchMedia','getComputedStyle','alert','confirm','prompt','atob','btoa','Image','HTMLDocument'
]);

/** Область видимости: var/function поднимаются до функции, let/const — до блока. */
class Scope {
  constructor(parent, fnBoundary) {
    this.parent = parent;
    this.fnBoundary = fnBoundary;
    this.names = new Set();
  }
  declare(name, kind) {
    if (kind === 'var' || kind === 'fn') {
      let s = this;
      while (!s.fnBoundary && s.parent) s = s.parent;
      s.names.add(name);
    } else this.names.add(name);
  }
  has(name) {
    for (let s = this; s; s = s.parent) if (s.names.has(name)) return true;
    return false;
  }
}

const problems = [];

function patternNames(node, out = []) {
  if (!node) return out;
  switch (node.type) {
    case 'Identifier': out.push(node.name); break;
    case 'ObjectPattern': node.properties.forEach(p => patternNames(p.type === 'RestElement' ? p.argument : p.value, out)); break;
    case 'ArrayPattern': node.elements.forEach(e => patternNames(e, out)); break;
    case 'AssignmentPattern': patternNames(node.left, out); break;
    case 'RestElement': patternNames(node.argument, out); break;
  }
  return out;
}

/** Поднимаем объявления текущего уровня до обхода тела, как это делает движок. */
function hoist(body, scope) {
  for (const st of body || []) {
    if (st.type === 'VariableDeclaration')
      st.declarations.forEach(d => patternNames(d.id).forEach(n => scope.declare(n, st.kind === 'var' ? 'var' : 'let')));
    else if (st.type === 'FunctionDeclaration' && st.id) scope.declare(st.id.name, 'fn');
    else if (st.type === 'ClassDeclaration' && st.id) scope.declare(st.id.name, 'let');
  }
}

function walk(node, scope) {
  if (!node || typeof node.type !== 'string') return;
  switch (node.type) {
    case 'Program': {
      const s = new Scope(scope, true);
      hoist(node.body, s);
      node.body.forEach(n => walk(n, s));
      return;
    }
    case 'FunctionDeclaration':
    case 'FunctionExpression':
    case 'ArrowFunctionExpression': {
      const s = new Scope(scope, true);
      if (node.type === 'FunctionExpression' && node.id) s.declare(node.id.name, 'let');
      node.params.forEach(p => patternNames(p).forEach(n => s.declare(n, 'let')));
      node.params.forEach(p => walk(p.type === 'AssignmentPattern' ? p.right : null, s));
      if (node.body.type === 'BlockStatement') { hoist(node.body.body, s); node.body.body.forEach(n => walk(n, s)); }
      else walk(node.body, s);
      return;
    }
    case 'BlockStatement': {
      const s = new Scope(scope, false);
      hoist(node.body, s);
      node.body.forEach(n => walk(n, s));
      return;
    }
    case 'ForStatement': case 'ForInStatement': case 'ForOfStatement': {
      const s = new Scope(scope, false);
      const init = node.init || node.left;
      if (init && init.type === 'VariableDeclaration')
        init.declarations.forEach(d => patternNames(d.id).forEach(n => s.declare(n, init.kind === 'var' ? 'var' : 'let')));
      [node.init, node.left, node.right, node.test, node.update, node.body].forEach(n => walk(n, s));
      return;
    }
    case 'CatchClause': {
      const s = new Scope(scope, false);
      if (node.param) patternNames(node.param).forEach(n => s.declare(n, 'let'));
      walk(node.body, s);
      return;
    }
    case 'ClassDeclaration': case 'ClassExpression': {
      const s = new Scope(scope, false);
      if (node.id) s.declare(node.id.name, 'let');
      walk(node.superClass, s); walk(node.body, s);
      return;
    }
    case 'MemberExpression':
      walk(node.object, scope);
      if (node.computed) walk(node.property, scope);
      return;
    case 'Property':
      if (node.computed) walk(node.key, scope);
      walk(node.value, scope);
      return;
    case 'PropertyDefinition': case 'MethodDefinition':
      if (node.computed) walk(node.key, scope);
      walk(node.value, scope);
      return;
    case 'LabeledStatement': walk(node.body, scope); return;
    case 'BreakStatement': case 'ContinueStatement': return;
    case 'Identifier':
      if (!scope.has(node.name) && !GLOBALS.has(node.name))
        problems.push({ name: node.name, line: node.loc?.line, pos: node.start });
      return;
  }
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'range' || key === 'type' || key === 'start' || key === 'end') continue;
    const v = node[key];
    if (Array.isArray(v)) v.forEach(n => walk(n, scope));
    else if (v && typeof v.type === 'string') walk(v, scope);
  }
}

walk(ast, null);

const source = readFileSync(file, 'utf8');
const lineOf = pos => source.slice(0, pos).split('\n').length;
const unique = new Map();
for (const p of problems) if (!unique.has(p.name)) unique.set(p.name, lineOf(p.pos));

if (unique.size) {
  console.error(`Неопределённые ссылки в app.js (${unique.size}). Скорее всего потерян импорт в src/:`);
  for (const [name, line] of unique) console.error(`  ${name}  —  app.js:${line}`);
  process.exit(1);
}
console.log('app.js: неопределённых ссылок нет.');
