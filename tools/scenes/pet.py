# -*- coding: utf-8 -*-
"""Общий питомец для всех сцен.

Одна функция рисует его везде, иначе в тридцати сценах он будет
тридцатью разными существами. Поза и лицо меняются параметрами,
а пропорции, цвета и базовые движения — нет.
"""

LIME = '#d6f24b'
LIME_DEEP = '#aacf24'
INK = '#151813'
ARM = '#e3eccb'
SOLE = '#bccb97'
FOOT = '#eaf3d6'

# Фон приложения. Ночные сцены подменяют его своим.
BG_DAY = ("radial-gradient(62% 48% at 16% 6%, #eafc8d 0%, rgba(234,252,141,0) 62%),"
          " radial-gradient(58% 44% at 92% 20%, #bfeeda 0%, rgba(191,238,218,0) 60%), #eef1e6")
BG_NIGHT = ("radial-gradient(60% 46% at 74% 14%, #35406b 0%, rgba(53,64,107,0) 64%),"
            " linear-gradient(170deg, #27304d 0%, #171d31 60%, #10141f 100%)")
BG_DAWN = ("radial-gradient(70% 54% at 50% 86%, #ffd9a8 0%, rgba(255,217,168,0) 62%),"
           " linear-gradient(170deg, #cfe2ff 0%, #ffe4c4 70%, #ffd1a6 100%)")

DEFS = """<linearGradient id="gPearl" x1="0.15" y1="0" x2="0.8" y2="1">
  <stop offset="0" stop-color="#ffffff"></stop>
  <stop offset="0.55" stop-color="#f7fbec"></stop>
  <stop offset="1" stop-color="#e4efcd"></stop>
</linearGradient>
<radialGradient id="gLime" cx="0.5" cy="0.95" r="0.62">
  <stop offset="0" stop-color="#d6f24b" stop-opacity="0.5"></stop>
  <stop offset="1" stop-color="#d6f24b" stop-opacity="0"></stop>
</radialGradient>
<linearGradient id="gGloss" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#ffffff" stop-opacity="0.95"></stop>
  <stop offset="1" stop-color="#ffffff" stop-opacity="0"></stop>
</linearGradient>
<linearGradient id="gMitt" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#e2fa6c"></stop>
  <stop offset="1" stop-color="#aacf24"></stop>
</linearGradient>
<radialGradient id="gWarm" cx="0.5" cy="0.5" r="0.5">
  <stop offset="0" stop-color="#eaff8a" stop-opacity="0.9"></stop>
  <stop offset="0.5" stop-color="#d6f24b" stop-opacity="0.35"></stop>
  <stop offset="1" stop-color="#d6f24b" stop-opacity="0"></stop>
</radialGradient>"""

# Базовые движения. Периоды нарочно несоизмеримы: 4.2 / 11 / 5.3 / 7.4 —
# они почти не совпадают, и питомец не выглядит заведённой игрушкой.
BASE_CSS = """body { margin: 0; }

/* Позиция детали живёт в родительском <g transform>, анимация — на вложенном
   узле от собственного нуля. CSS-transform затирает атрибут transform,
   и деталь с анимацией прямо на ней улетает в угол кадра. */
.a { transform-origin: 0 0; }

@keyframes pBreathe {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-2.8px) scale(1.012); }
}
@keyframes pTurn {
  0%, 100% { transform: rotate(44deg); }
  50% { transform: rotate(46.6deg); }
}
@keyframes pCrest {
  0%, 100% { transform: translateY(0) rotate(-7deg); }
  50% { transform: translateY(-5px) rotate(5deg); }
}
@keyframes pBlink {
  0%, 93% { transform: scaleY(1); }
  94.6% { transform: scaleY(0.08); }
  96.2%, 100% { transform: scaleY(1); }
}
@keyframes pGlance {
  0%, 48%, 100% { transform: translateX(0); }
  60%, 74% { transform: translateX(4px); }
}
@keyframes pShadow {
  0%, 100% { transform: scale(1); opacity: 0.13; }
  50% { transform: scale(0.955, 0.92); opacity: 0.095; }
}

.p-breathe { animation: pBreathe 4.2s ease-in-out infinite; }
.p-turn    { animation: pTurn 11s ease-in-out infinite; }
.p-crest   { animation: pCrest 4.2s cubic-bezier(0.34, 1.26, 0.5, 1) 0.3s infinite; }
.p-eye     { animation: pBlink 5.3s ease-in-out infinite; }
.p-eyes    { animation: pGlance 7.4s ease-in-out infinite; }
.p-shadow  { animation: pShadow 4.2s ease-in-out infinite; }
.p-slow    { animation-duration: 7.6s; }
"""


def shadow(cx, cy, rx=70, ry=11, fill='#3f4a2e'):
    return ('<g transform="translate(%g %g)"><ellipse class="a p-shadow" cx="0" cy="0" '
            'rx="%g" ry="%g" fill="%s"></ellipse></g>' % (cx, cy, rx, ry, fill))


def feet(cx, y, dx=26, rx=21, ry=12, cls_l='', cls_r=''):
    """Ноги стоят на месте — от них и читается дыхание корпуса.

    Первым аргументом идёт центр питомца: ноги живут в координатах холста,
    и без него они собираются в левом верхнем углу кадра.
    """
    out = []
    for sign, cls in ((-1, cls_l), (1, cls_r)):
        g = '<g transform="translate(%g %g)">' % (cx + sign * dx, y)
        inner = ('<ellipse cx="0" cy="4" rx="%g" ry="%g" fill="%s"></ellipse>'
                 '<ellipse cx="0" cy="0" rx="%g" ry="%g" fill="%s"></ellipse>'
                 % (rx, ry, SOLE, rx, ry, FOOT))
        if cls:
            inner = '<g class="a %s">%s</g>' % (cls, inner)
        out.append(g + inner + '</g>')
    return ''.join(out)


def _eyes(kind, dx, dy, r, blink, glance, eyes_cls):
    def one(sign):
        if kind == 'shut':
            return ('<path d="M%g %g C%g %g, %g %g, %g %g" stroke="%s" stroke-width="4.2" '
                    'stroke-linecap="round" fill="none"></path>'
                    % (sign * dx - 6.5, dy, sign * dx - 3, dy + 4, sign * dx + 3, dy + 4,
                       sign * dx + 6.5, dy, INK))
        if kind == 'happy':
            return ('<path d="M%g %g C%g %g, %g %g, %g %g" stroke="%s" stroke-width="4.2" '
                    'stroke-linecap="round" fill="none"></path>'
                    % (sign * dx - 6.5, dy + 2, sign * dx - 3, dy - 4, sign * dx + 3, dy - 4,
                       sign * dx + 6.5, dy + 2, INK))
        body = ('<circle cx="0" cy="0" r="%g" fill="%s"></circle>'
                '<circle cx="-2.4" cy="-2.6" r="%g" fill="#ffffff"></circle>'
                % (r, INK, r * 0.35))
        if blink:
            body = '<g class="a p-eye">%s</g>' % body
        return '<g transform="translate(%g %g)">%s</g>' % (sign * dx, dy, body)

    inner = one(-1) + one(1)
    cls = eyes_cls or ('p-eyes' if glance else '')
    if cls:
        inner = '<g class="a %s">%s</g>' % (cls, inner)
    return inner


def _mouth(kind, y, cls):
    shapes = {
        'smile': '<path d="M-10 0 C-5 4, 5 4, 10 0" stroke="%s" stroke-width="4.6" stroke-linecap="round" fill="none"></path>' % INK,
        'wide': '<path d="M-14 -2 C-7 8, 7 8, 14 -2" stroke="%s" stroke-width="4.6" stroke-linecap="round" fill="none"></path>' % INK,
        'flat': '<path d="M-8 0 H8" stroke="%s" stroke-width="4.4" stroke-linecap="round" fill="none"></path>' % INK,
        'small': '<path d="M-5 0 C-2 3, 2 3, 5 0" stroke="%s" stroke-width="4.2" stroke-linecap="round" fill="none"></path>' % INK,
        'open': '<ellipse cx="0" cy="2" rx="7.5" ry="6.5" fill="%s"></ellipse>' % INK,
        'none': '',
    }
    s = shapes.get(kind, shapes['smile'])
    if not s:
        return ''
    if cls:
        s = '<g class="a %s">%s</g>' % (cls, s)
    return '<g transform="translate(0 %g)">%s</g>' % (y, s)


BROWS = {
    'focus': ('<path d="M-26 -23 L-10 -21" stroke="%s" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.42"></path>'
              '<path d="M10 -21 L26 -23" stroke="%s" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.42"></path>' % (INK, INK)),
    'up': ('<path d="M-27 -26 L-11 -29" stroke="%s" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.42"></path>'
           '<path d="M11 -29 L27 -26" stroke="%s" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.42"></path>' % (INK, INK)),
}


def pet(cx, cy, s=0.78, eyes='open', mouth='smile', mouth_y=15, mouth_cls='',
        brows=None, crest=True, blink=True, glance=True, eyes_cls='',
        eye_dx=17, eye_dy=-6, eye_r=7.4, arms='', head='', front='',
        breathe_cls='p-breathe', crest_cls='p-crest'):
    """Питомец целиком. `arms` рисуются до корпуса — плечи прячутся под ромбом."""
    parts = []
    if arms:
        parts.append(arms)
    body = [
        '<g class="a p-turn"><rect x="-54" y="-54" width="108" height="108" rx="32" '
        'fill="url(#gPearl)" stroke="#dfe8c8" stroke-width="1.6"></rect></g>',
        '<ellipse cx="0" cy="34" rx="46" ry="30" fill="url(#gLime)"></ellipse>',
        '<g transform="translate(-18 -30) rotate(-28)"><ellipse cx="0" cy="0" rx="22" ry="11" fill="url(#gGloss)"></ellipse></g>',
        '<ellipse cx="-32" cy="8" rx="9" ry="5.2" fill="#ff9d8a" opacity="0.5"></ellipse>',
        '<ellipse cx="32" cy="8" rx="9" ry="5.2" fill="#ff9d8a" opacity="0.5"></ellipse>',
    ]
    if brows:
        body.append(BROWS[brows])
    body.append(_eyes(eyes, eye_dx, eye_dy, eye_r, blink, glance, eyes_cls))
    body.append(_mouth(mouth, mouth_y, mouth_cls))
    if head:
        body.append(head)
    parts.append('<g transform="scale(%g)">%s</g>' % (s, ''.join(body)))
    if crest:
        parts.append('<g transform="translate(0 %g)"><g class="a %s">'
                     '<path d="M0 -12 C1.5 -3.7 3.7 -1.5 12 0 C3.7 1.5 1.5 3.7 0 12 '
                     'C-1.5 3.7 -3.7 1.5 -12 0 C-3.7 -1.5 -1.5 -3.7 0 -12Z" fill="%s"></path>'
                     '</g></g>' % (-92 * s, crest_cls, LIME))
    if front:
        parts.append(front)
    return ('<g transform="translate(%g %g)"><g class="a %s">%s</g></g>'
            % (cx, cy, breathe_cls, ''.join(parts)))


def arm(x, y, d, hand_x, hand_y, cls='', w=14, r=11.5, hand=True):
    """Рука: короткая, с лаймовой рукавицей. Плечо прячется под корпусом."""
    inner = ('<path d="%s" stroke="%s" stroke-width="%g" stroke-linecap="round" fill="none"></path>'
             % (d, ARM, w))
    if hand:
        inner += '<circle cx="%g" cy="%g" r="%g" fill="url(#gMitt)"></circle>' % (hand_x, hand_y, r)
    if cls:
        inner = '<g class="a %s">%s</g>' % (cls, inner)
    return '<g transform="translate(%g %g)">%s</g>' % (x, y, inner)
