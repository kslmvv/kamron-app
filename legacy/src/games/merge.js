/** Игра 2048: ходы, объединение плиток и проверка завершения. */
import { data, view } from '../core/state.js';
import { toast } from '../core/toast.js';
import { $ } from '../core/utils.js';
import { persistGames } from './index.js';
import { render } from '../ui/shell.js';

export function randomEmpty(grid) {
  const spots = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (!grid[r][c]) spots.push([r, c]);
  if (spots.length) {
    const [r, c] = spots[Math.floor(Math.random() * spots.length)];
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  }
}

export function newMerge() {
  const game = {
    grid: Array.from({ length: 4 }, () => Array(4).fill(0)),
    score: 0,
    over: false,
    won: false,
    keepPlaying: false,
    lastGain: 0,
    moves: 0
  };
  randomEmpty(game.grid);
  randomEmpty(game.grid);
  return game;
}

export function mergeMovesAvailable(grid) {
  return grid.some((row, r) =>
    row.some(
      (value, c) => !value || (r < 3 && value === grid[r + 1][c]) || (c < 3 && value === grid[r][c + 1])
    )
  );
}

export function moveMerge(direction) {
  const game = view.merge;
  if (game.over || (game.won && !game.keepPlaying)) return;
  const before = JSON.stringify(game.grid);
  let gain = 0;
  for (let i = 0; i < 4; i++) {
    const coords = Array.from({ length: 4 }, (_, j) =>
      direction === 'left'
        ? [i, j]
        : direction === 'right'
          ? [i, 3 - j]
          : direction === 'up'
            ? [j, i]
            : [3 - j, i]
    );
    const vals = coords.map(([r, c]) => game.grid[r][c]).filter(Boolean),
      merged = [];
    for (let j = 0; j < vals.length; j++) {
      if (vals[j] === vals[j + 1]) {
        const next = vals[j] * 2;
        merged.push(next);
        game.score += next;
        gain += next;
        if (next === 2048 && !game.won) game.won = true;
        j++;
      } else merged.push(vals[j]);
    }
    coords.forEach(([r, c], j) => (game.grid[r][c] = merged[j] || 0));
  }
  if (JSON.stringify(game.grid) === before) return;
  randomEmpty(game.grid);
  game.lastGain = gain;
  game.moves = (game.moves || 0) + 1;
  if (game.score > data.best.merge) data.best.merge = game.score;
  game.over = !mergeMovesAvailable(game.grid);
  if (game.over) toast(`Игра окончена · ${game.score} очков`);
  else if (game.won && !game.keepPlaying) toast('2048! Победа — можно продолжить');
  persistGames();
  render();
}
