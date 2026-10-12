/** Игра «Блоки»: поле 8x8, фигуры, предпросмотр и очистка линий. */
import { SHAPES } from '../core/constants.js';
import { data, view } from '../core/state.js';
import { toast } from '../core/toast.js';
import { $ } from '../core/utils.js';
import { persistGames } from './index.js';
import { render } from '../ui/shell.js';

export function newBlock() {
  return {
    grid: Array.from({ length: 8 }, () => Array(8).fill(0)),
    pieces: Array.from({ length: 3 }, () => SHAPES[Math.floor(Math.random() * SHAPES.length)]),
    selected: 0,
    score: 0,
    combo: 0,
    lastClear: 0,
    moves: 0,
    over: false
  };
}

export function canPlace(grid, shape, r, c) {
  return shape.every(([y, x]) => r + y < 8 && c + x < 8 && !grid[r + y][c + x]);
}

export function anyBlockMove(game) {
  return game.pieces.some(
    shape =>
      shape &&
      Array.from({ length: 8 }, (_, r) =>
        Array.from({ length: 8 }, (_, c) => canPlace(game.grid, shape, r, c)).some(Boolean)
      ).some(Boolean)
  );
}

export function placeBlock(r, c) {
  const game = view.block,
    shape = game.pieces[game.selected];
  if (!shape || game.over) return;
  if (!canPlace(game.grid, shape, r, c)) {
    toast('Фигура не помещается здесь');
    return;
  }
  shape.forEach(([y, x]) => (game.grid[r + y][c + x] = game.selected + 1));
  game.score += shape.length;
  game.moves++;
  game.pieces[game.selected] = null;
  const rows = [],
    cols = [];
  for (let i = 0; i < 8; i++) {
    if (game.grid[i].every(Boolean)) rows.push(i);
    if (game.grid.every(row => row[i])) cols.push(i);
  }
  const cleared = rows.length + cols.length;
  rows.forEach(y => game.grid[y].fill(0));
  cols.forEach(x => game.grid.forEach(row => (row[x] = 0)));
  if (cleared) {
    game.combo = (game.combo || 0) + 1;
    game.score += cleared * 10 + Math.max(0, cleared - 1) * 10 + Math.max(0, game.combo - 1) * 5;
    game.lastClear = cleared;
  } else {
    game.combo = 0;
    game.lastClear = 0;
  }
  if (game.pieces.every(x => !x))
    game.pieces = Array.from({ length: 3 }, () => SHAPES[Math.floor(Math.random() * SHAPES.length)]);
  game.selected = game.pieces.findIndex(Boolean);
  if (!anyBlockMove(game)) {
    game.over = true;
    toast(`Игра окончена · ${game.score} очков`);
  } else if (cleared)
    toast(
      cleared > 1 ? `Комбо: ${cleared} линии · ${game.score} очков` : `Линия очищена · ${game.score} очков`
    );
  if (game.score > data.best.block) data.best.block = game.score;
  persistGames();
  render();
}

export function pieceHTML(shape) {
  if (!shape) return '<span class="muted">✓</span>';
  const h = Math.max(...shape.map(x => x[0])) + 1,
    w = Math.max(...shape.map(x => x[1])) + 1;
  return `<div class="piece-grid" style="grid-template-columns:repeat(${w},11px)">${Array.from({ length: h * w }, (_, i) => `<span class="piece-cell ${shape.some(([r, c]) => r === Math.floor(i / w) && c === i % w) ? 'on' : ''}"></span>`).join('')}</div>`;
}

export function clearBlockPreview() {
  document
    .querySelectorAll('.block-cell.preview,.block-cell.invalid')
    .forEach(cell => cell.classList.remove('preview', 'invalid'));
}

export function previewBlock(cell) {
  if (!cell || view.page !== 'games' || view.game !== 'block') return;
  clearBlockPreview();
  const g = view.block,
    shape = g?.pieces[g.selected];
  if (!shape || g.over) return;
  const r = Number(cell.dataset.row),
    c = Number(cell.dataset.col),
    valid = canPlace(g.grid, shape, r, c);
  shape.forEach(([y, x]) => {
    const next = document.querySelector(`.block-cell[data-row="${r + y}"][data-col="${c + x}"]`);
    if (next) next.classList.add(valid ? 'preview' : 'invalid');
  });
}
