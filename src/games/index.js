/** Экран игр и сохранение партий. */
import { data, save, view } from '../core/state.js';
import { $ } from '../core/utils.js';
import { anyBlockMove, canPlace, newBlock, pieceHTML } from './blocks.js';
import { newMemory } from './memory.js';
import { mergeMovesAvailable, newMerge } from './merge.js';
import { heading } from '../ui/components.js';

export function persistGames() {
  data.games = {
    block: view.block,
    merge: view.merge,
    memory: view.memory ? { ...view.memory, flipped: [], busy: false } : null
  };
  save();
}

export function renderGames() {
  if (!view.block) view.block = data.games?.block?.grid?.length === 8 ? data.games.block : newBlock();
  if (!view.merge) view.merge = data.games?.merge?.grid?.length === 4 ? data.games.merge : newMerge();
  if (!view.memory) view.memory = data.games?.memory?.cards?.length === 16 ? data.games.memory : newMemory();
  view.block.combo ??= 0;
  view.block.lastClear ??= 0;
  view.block.moves ??= 0;
  if (!view.block.over && !anyBlockMove(view.block)) view.block.over = true;
  view.merge.won ??= false;
  view.merge.keepPlaying ??= false;
  view.merge.lastGain ??= 0;
  view.merge.moves ??= 0;
  if (!mergeMovesAvailable(view.merge.grid)) view.merge.over = true;
  const tabs = [
    ['block', '🧩', 'Блоки'],
    ['merge', '🔢', '2048'],
    ['memory', '🃏', 'Пары']
  ]
    .map(
      ([id, icon, label]) =>
        `<button class="game-tab ${view.game === id ? 'active' : ''}" data-action="game-tab" data-game="${id}" aria-pressed="${view.game === id}"><span aria-hidden="true">${icon}</span><strong>${label}</strong></button>`
    )
    .join('');
  let game = '';
  if (view.game === 'block') {
    const g = view.block;
    game = `<div class="game-info"><div class="game-scoreboard"><div><small>ОЧКИ</small><strong>${g.score}</strong></div><div><small>РЕКОРД</small><strong>${data.best.block}</strong></div></div><button class="secondary-btn" data-action="reset-game">Заново</button></div>
        <div class="game-board-wrap"><div class="block-grid" role="grid" aria-label="Поле 8 на 8">${g.grid.flatMap((row, r) => row.map((value, c) => `<button class="block-cell ${value ? `filled block-color-${value}` : ''}" data-action="block-cell" data-row="${r}" data-col="${c}" aria-label="Строка ${r + 1}, столбец ${c + 1}${value ? ' занята' : ' свободна'}"></button>`)).join('')}</div>${g.over ? `<div class="game-overlay"><strong>Игра окончена</strong><span>${g.score} очков</span><button data-action="reset-game">Играть снова</button></div>` : ''}</div>
        <div class="pieces">${g.pieces.map((shape, i) => `<button class="piece ${g.selected === i ? 'active' : ''} ${shape && !g.over && !Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => canPlace(g.grid, shape, r, c)).some(Boolean)).some(Boolean) ? 'unavailable' : ''}" data-action="select-piece" data-index="${i}" style="--piece-color:${['#f5bb32', '#48baff', '#fa8161'][i]}" ${shape && !g.over ? '' : 'disabled'} aria-label="Фигура ${i + 1}">${pieceHTML(shape)}</button>`).join('')}</div><div class="game-status">${g.combo > 1 ? `🔥 Комбо ×${g.combo}` : g.lastClear ? `✨ Очищено линий: ${g.lastClear}` : 'Выберите фигуру и поставьте её на поле'}</div><details class="game-help"><summary>Как играть</summary><p>Выберите фигуру и нажмите на клетку или перетащите её. После трёх фигур появятся новые. Игра окончена, когда ни одна оставшаяся фигура не помещается.</p></details>`;
  } else if (view.game === 'merge') {
    const g = view.merge;
    game = `<div class="game-info"><div class="game-scoreboard"><div><small>ОЧКИ</small><strong>${g.score}</strong></div><div><small>РЕКОРД</small><strong>${data.best.merge}</strong></div></div><button class="secondary-btn" data-action="reset-game">Заново</button></div>
        <div class="game-board-wrap"><div class="grid2048" id="merge-grid" aria-label="Поле 2048">${g.grid
          .flat()
          .map(
            value =>
              `<div class="tile2048 ${value >= 4096 ? 'super' : ''}" ${value ? `data-value="${value}"` : ''}>${value || ''}</div>`
          )
          .join(
            ''
          )}</div>${g.over ? `<div class="game-overlay merge-overlay"><strong>Игра окончена</strong><span>${g.score} очков</span><button data-action="reset-game">Играть снова</button></div>` : g.won && !g.keepPlaying ? `<div class="game-overlay merge-overlay"><strong>2048! Победа</strong><span>Можно продолжить и набрать ещё больше.</span><button data-action="continue-merge">Продолжить</button></div>` : ''}</div>
        <div class="game-status">${g.lastGain ? `+${g.lastGain} за последний ход` : 'Соединяйте одинаковые плитки'}</div><div class="arrow-pad"><span></span><button data-action="merge-move" data-dir="up" aria-label="Вверх" ${g.over || (g.won && !g.keepPlaying) ? 'disabled' : ''}>↑</button><span></span><button data-action="merge-move" data-dir="left" aria-label="Влево" ${g.over || (g.won && !g.keepPlaying) ? 'disabled' : ''}>←</button><button data-action="merge-move" data-dir="down" aria-label="Вниз" ${g.over || (g.won && !g.keepPlaying) ? 'disabled' : ''}>↓</button><button data-action="merge-move" data-dir="right" aria-label="Вправо" ${g.over || (g.won && !g.keepPlaying) ? 'disabled' : ''}>→</button></div><details class="game-help"><summary>Как играть</summary><p>Сдвигайте плитки свайпом, стрелками или кнопками. После каждого успешного хода появляется новая плитка. Соберите 2048.</p></details>`;
  } else {
    const g = view.memory;
    game = `<div class="game-info"><div class="game-scoreboard"><div><small>ХОДЫ</small><strong>${g.moves}</strong></div><div><small>РЕКОРД</small><strong>${data.best.memory || '—'}</strong></div></div><button class="secondary-btn" data-action="reset-game">Заново</button></div><div class="game-board-wrap"><div class="memory-grid">${g.cards.map((value, i) => `<button class="memory-cell ${g.matched.includes(i) ? 'matched' : g.flipped.includes(i) ? 'revealed' : ''}" data-action="memory-cell" data-index="${i}" aria-label="Карточка ${i + 1}${g.matched.includes(i) ? ' найдена' : g.flipped.includes(i) ? ' открыта' : ' закрыта'}" ${g.matched.includes(i) ? 'disabled' : ''}>${g.matched.includes(i) || g.flipped.includes(i) ? value : '?'}</button>`).join('')}</div>${g.matched.length === 16 ? `<div class="game-overlay memory-overlay"><strong>Все пары найдены!</strong><span>${g.moves} ходов</span><button data-action="reset-game">Играть снова</button></div>` : ''}</div><div class="game-status">Найдено пар: ${g.matched.length / 2} из 8</div><details class="game-help"><summary>Как играть</summary><p>Открывайте по две карточки. Одинаковые остаются открытыми; старайтесь уложиться в меньшее число ходов.</p></details>`;
  }
  return `${heading('ОТДОХНИ И ПЕРЕЗАГРУЗИСЬ', 'Игры', 'Короткий перерыв, который всегда под рукой.')}
      <div class="game-tabs">${tabs}</div><div class="game-panel game-${view.game}">${game}</div>`;
}
