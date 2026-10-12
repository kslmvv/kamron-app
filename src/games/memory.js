/** Игра «Пары»: раскрытие карточек и подсчёт ходов. */
import { data, view } from '../core/state.js';
import { toast } from '../core/toast.js';
import { $ } from '../core/utils.js';
import { persistGames } from './index.js';
import { render } from '../ui/shell.js';

export function newMemory() {
  const values = ['🌙', '🚀', '🍋', '🎧', '🪐', '🎨', '⚡', '🌿'];
  const cards = [...values, ...values];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return { cards, flipped: [], matched: [], moves: 0, busy: false };
}

export function flipMemory(index) {
  const g = view.memory;
  if (g.busy || g.matched.includes(index) || g.flipped.includes(index)) return;
  g.flipped.push(index);
  if (g.flipped.length === 2) {
    g.moves++;
    const [a, b] = g.flipped;
    if (g.cards[a] === g.cards[b]) {
      g.matched.push(a, b);
      g.flipped = [];
      if (g.matched.length === 16) {
        if (!data.best.memory || g.moves < data.best.memory) data.best.memory = g.moves;
        toast(`Все пары найдены за ${g.moves} ходов!`);
      }
    } else {
      g.busy = true;
      setTimeout(() => {
        if (view.memory !== g) return;
        g.flipped = [];
        g.busy = false;
        persistGames();
        if (view.page === 'games' && view.game === 'memory') render();
      }, 750);
    }
  }
  persistGames();
  render();
}
