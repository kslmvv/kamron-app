/** Встроенные SVG-иконки интерфейса. */
import { $ } from './utils.js';

export const icons = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-7h6v7"/>',
  plan: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
  notes: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 11h8M8 15h8M8 19h5"/>',
  games:
    '<path d="M7 8h10a5 5 0 0 1 4.7 3.3l1.1 3.2a3 3 0 0 1-4.5 3.4L15 16H9l-3.3 1.9a3 3 0 0 1-4.5-3.4l1.1-3.2A5 5 0 0 1 7 8z"/><path d="M7 11v4M5 13h4M16.5 12h.01M19 14h.01"/>',
  settings:
    '<path d="M9.55 4.60 L10.17 2.47 L13.83 2.47 L14.45 4.60 L15.50 5.03 L17.44 3.97 L20.03 6.56 L18.97 8.50 L19.40 9.55 L21.53 10.17 L21.53 13.83 L19.40 14.45 L18.97 15.50 L20.03 17.44 L17.44 20.03 L15.50 18.97 L14.45 19.40 L13.83 21.53 L10.17 21.53 L9.55 19.40 L8.50 18.97 L6.56 20.03 L3.97 17.44 L5.03 15.50 L4.60 14.45 L2.47 13.83 L2.47 10.17 L4.60 9.55 L5.03 8.50 L3.97 6.56 L6.56 3.97 L8.50 5.03 Z"/><circle cx="12" cy="12" r="3.1"/>',
  jarvis:
    '<path d="m12 2 1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8L12 2Z"/><path d="m19 17 .5 1.5L21 19l-1.5.5L19 21l-.5-1.5L17 19l1.5-.5L19 17Z"/>',
  more: '<circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  phone:
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.09 5.18 2 2 0 0 1 5.08 3h3a2 2 0 0 1 2 1.72l.4 2.81a2 2 0 0 1-.57 1.72L8.1 11.06a16 16 0 0 0 4.84 4.84l1.81-1.81a2 2 0 0 1 1.72-.57l2.81.4A2 2 0 0 1 22 16.92z"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>'
};

export const svg = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
