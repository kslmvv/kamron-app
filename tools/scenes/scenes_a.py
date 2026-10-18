# -*- coding: utf-8 -*-
from pet import pet, arm, feet, shadow, BG_DAY, LIME, LIME_DEEP, INK, ARM

S = {}

# ── Работа ──────────────────────────────────────────────────────────────
S['work'] = {
 'title': u'Работа', 'alt': u'Питомец работает за ноутбуком',
 'css': """
@keyframes wTap { 0% { transform: translateY(0); } 24% { transform: translateY(2.6px); } 58%, 100% { transform: translateY(0); } }
@keyframes wType { 0% { transform: scaleX(0.03); } 34%, 92% { transform: scaleX(1); } 100% { transform: scaleX(0.03); } }
@keyframes wCaret { 0%, 48% { opacity: 1; } 50%, 100% { opacity: 0; } }
@keyframes wGlow { 0%, 100% { opacity: 0.4; } 34% { opacity: 0.72; } 68% { opacity: 0.5; } }
@keyframes wRead { 0%, 10% { transform: translateX(-2.6px); } 46%, 56% { transform: translateX(2.6px); } 70%, 100% { transform: translateX(-2.6px); } }
@keyframes wChew { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(2.2px); } }
@keyframes wSteam { 0% { transform: translate(0,0) scale(0.6); opacity: 0; } 22% { opacity: 0.75; } 100% { transform: translate(7px,-28px) scale(1.5); opacity: 0; } }
.w-tapL { animation: wTap 0.44s cubic-bezier(0.3,0.9,0.3,1) infinite; }
.w-tapR { animation: wTap 0.44s cubic-bezier(0.3,0.9,0.3,1) 0.22s infinite; }
.w-l1 { animation: wType 2.8s steps(16) infinite; }
.w-l2 { animation: wType 2.8s steps(16) 0.7s infinite; }
.w-l3 { animation: wType 2.8s steps(16) 1.4s infinite; }
.w-l4 { animation: wType 2.8s steps(16) 2.1s infinite; }
.w-caret { animation: wCaret 1s steps(1) infinite; }
.w-glow { animation: wGlow 2.8s ease-in-out infinite; }
.w-eyes { animation: wRead 4.6s ease-in-out infinite; }
.w-mouth { animation: wChew 3.6s ease-in-out infinite; }
.w-s1 { animation: wSteam 2.8s ease-out infinite; }
.w-s2 { animation: wSteam 2.8s ease-out 1.4s infinite; }
""",
 'svg': """
<rect x="0" y="272" width="360" height="88" fill="#d9c3a0"></rect>
<rect x="0" y="272" width="360" height="6" fill="#e9d6b8"></rect>
<g transform="translate(36 242)"><ellipse class="a w-s1" cx="0" cy="0" rx="5.4" ry="4.4" fill="#fff" opacity="0.7"></ellipse></g>
<g transform="translate(47 243)"><ellipse class="a w-s2" cx="0" cy="0" rx="4.4" ry="3.6" fill="#fff" opacity="0.7"></ellipse></g>
<path d="M22 244 H60 V266 C60 272 55 276 49 276 H33 C27 276 22 272 22 266 Z" fill="#d6f24b"></path>
<path d="M60 250 C69 250 74 254 74 260 C74 266 69 270 60 270" stroke="#aacf24" stroke-width="5" fill="none"></path>
<rect x="296" y="262" width="52" height="10" rx="4" fill="#f2f5e8"></rect>
<rect x="302" y="254" width="42" height="10" rx="4" fill="#fff"></rect>
<path d="M84 258 H276 L292 274 H68 Z" fill="#aab49e"></path>
<path d="M68 274 H292 L291 279 H69 Z" fill="#8d9784"></path>
<rect x="84" y="186" width="192" height="72" rx="9" fill="#2a3220"></rect>
<rect x="92" y="194" width="176" height="56" rx="4" fill="#10150f"></rect>
<g transform="translate(104 204)"><rect class="a w-l1" x="0" y="-2.5" width="86" height="5" rx="2.5" fill="#d6f24b"></rect></g>
<g transform="translate(104 216)"><rect class="a w-l2" x="0" y="-2.5" width="64" height="5" rx="2.5" fill="#9fb183"></rect></g>
<g transform="translate(112 228)"><rect class="a w-l3" x="0" y="-2.5" width="98" height="5" rx="2.5" fill="#9fb183"></rect></g>
<g transform="translate(104 240)"><rect class="a w-l4" x="0" y="-2.5" width="54" height="5" rx="2.5" fill="#6f7d5c"></rect></g>
<rect class="a w-caret" x="162" y="236" width="4" height="8" rx="1.5" fill="#d6f24b"></rect>
<g transform="translate(180 188)"><ellipse class="a w-glow" cx="0" cy="0" rx="92" ry="26" fill="url(#gWarm)"></ellipse></g>
""" + arm(126, 184, 'M14 -22 C4 -16, 0 -8, 0 -2', 0, 0, 'w-tapL')
    + arm(234, 184, 'M-14 -22 C-4 -16, 0 -8, 0 -2', 0, 0, 'w-tapR')
    + pet(180, 150, brows='focus', eyes_cls='w-eyes', mouth_cls='w-mouth', mouth_y=16, eye_dy=-5)
    + '<g transform="translate(180 184)"><ellipse class="a w-glow" cx="0" cy="0" rx="52" ry="15" fill="url(#gWarm)" opacity="0.5"></ellipse></g>',
}

# ── Учёба ───────────────────────────────────────────────────────────────
S['read'] = {
 'title': u'Учёба', 'alt': u'Питомец читает книгу',
 'css': """
@keyframes rFlip { 0%, 62% { transform: scaleX(1); opacity: 1; } 78% { transform: scaleX(-0.06); opacity: 0.85; } 79%, 100% { transform: scaleX(-0.06); opacity: 0; } }
@keyframes rScan { 0%, 6% { transform: translateX(-3.2px); } 40%, 46% { transform: translateX(3.2px); } 56%, 100% { transform: translateX(-3.2px); } }
@keyframes rHold { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-1.6px) rotate(-1deg); } }
.r-flip { animation: rFlip 3.6s ease-in-out infinite; }
.r-eyes { animation: rScan 3.6s ease-in-out infinite; }
.r-book { animation: rHold 4.2s ease-in-out infinite; }
""",
 'svg': shadow(180, 288, 74) + feet(180, 266, 26)
    + pet(180, 180, eyes_cls='r-eyes', mouth='small', mouth_y=16)
    + """
<g transform="translate(180 238)">
  <g class="a r-book">
    <path d="M-62 -8 C-40 -16, -14 -14, 0 -6 L0 26 C-14 18, -40 16, -62 24 Z" fill="#fff"></path>
    <path d="M62 -8 C40 -16, 14 -14, 0 -6 L0 26 C14 18, 40 16, 62 24 Z" fill="#f4f7ec"></path>
    <path d="M-66 -6 C-42 -15, -14 -13, 0 -5 L0 30 C-14 22, -42 20, -66 28 Z" fill="none" stroke="#c8d2b7" stroke-width="2.4" stroke-linejoin="round"></path>
    <path d="M66 -6 C42 -15, 14 -13, 0 -5 L0 30 C14 22, 42 20, 66 28 Z" fill="none" stroke="#c8d2b7" stroke-width="2.4" stroke-linejoin="round"></path>
    <path d="M-50 0 H-14 M-54 8 H-18 M-50 16 H-22" stroke="#d7dec9" stroke-width="2.6" stroke-linecap="round"></path>
    <path d="M14 0 H50 M18 8 H54 M22 16 H50" stroke="#d7dec9" stroke-width="2.6" stroke-linecap="round"></path>
    <g class="a r-flip" style="transform-origin: 0 0">
      <path d="M0 -6 C14 -14, 40 -16, 62 -8 L62 24 C40 16, 14 18, 0 26 Z" fill="#fdfff5" stroke="#c8d2b7" stroke-width="2"></path>
    </g>
    <rect x="-3" y="-8" width="6" height="38" rx="2" fill="#aacf24"></rect>
  </g>
</g>"""
    + arm(136, 208, 'M0 0 C-8 10, -10 18, -6 24', -6, 27, '')
    + arm(224, 208, 'M0 0 C8 10, 10 18, 6 24', 6, 27, ''),
}

# ── Письмо ──────────────────────────────────────────────────────────────
S['write'] = {
 'title': u'Записи', 'alt': u'Питомец пишет в тетради',
 'css': """
@keyframes nWrite { 0% { transform: translate(0,0) rotate(0deg); } 50% { transform: translate(38px,2px) rotate(3deg); } 51%, 100% { transform: translate(0,0) rotate(0deg); } }
@keyframes nInk { 0% { transform: scaleX(0.02); } 50% { transform: scaleX(1); } 51%, 100% { transform: scaleX(0.02); } }
@keyframes nInk2 { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 1; } }
@keyframes nLook { 0%, 44% { transform: translate(2.4px, 1.6px); } 60%, 90% { transform: translate(-2px, 1.6px); } 100% { transform: translate(2.4px, 1.6px); } }
.n-pen { animation: nWrite 2.6s ease-in-out infinite; }
.n-ink { animation: nInk 2.6s linear infinite; }
.n-eyes { animation: nLook 2.6s ease-in-out infinite; }
""",
 'svg': """
<rect x="0" y="272" width="360" height="88" fill="#d9c3a0"></rect>
<rect x="0" y="272" width="360" height="6" fill="#e9d6b8"></rect>
<path d="M96 246 H268 L288 276 H76 Z" fill="#fdfff5"></path>
<path d="M104 254 H258 L262 262 H100 Z" fill="#eef2e3"></path>
<path d="M112 266 H252" stroke="#dfe5d2" stroke-width="2.6" stroke-linecap="round"></path>
<g transform="translate(112 258)"><rect class="a n-ink" x="0" y="-1.8" width="42" height="3.6" rx="1.8" fill="#46548f" style="transform-origin: 0 0"></rect></g>
"""
    + pet(180, 150, brows='focus', eyes_cls='n-eyes', mouth='small', mouth_y=16, eye_dy=-4)
    + """
<g transform="translate(118 244)"><g class="a">""" + '' + """</g></g>
"""
    + arm(140, 196, 'M0 0 C-12 14, -16 28, -14 40', -14, 43, '')
    + """
<g transform="translate(206 196)">
  <g class="a n-pen">
    <path d="M0 0 C-4 16, -14 30, -22 40" stroke="#e3eccb" stroke-width="14" stroke-linecap="round" fill="none"></path>
    <circle cx="-22" cy="43" r="11.5" fill="url(#gMitt)"></circle>
    <g transform="translate(-22 43) rotate(28)">
      <rect x="-3" y="-34" width="6" height="34" rx="3" fill="#ff9b7a"></rect>
      <path d="M-3 0 L0 9 L3 0 Z" fill="#2a3220"></path>
    </g>
  </g>
</g>""",
}

# ── Выступление ─────────────────────────────────────────────────────────
S['present'] = {
 'title': u'Выступление', 'alt': u'Питомец показывает на график',
 'css': """
@keyframes gGrow { 0% { transform: scaleY(0.08); } 40%, 92% { transform: scaleY(1); } 100% { transform: scaleY(0.08); } }
@keyframes gPoint { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-9deg); } }
@keyframes gTalk { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.45); } }
.g-b1 { animation: gGrow 4.4s cubic-bezier(0.34,1.2,0.5,1) infinite; }
.g-b2 { animation: gGrow 4.4s cubic-bezier(0.34,1.2,0.5,1) 0.25s infinite; }
.g-b3 { animation: gGrow 4.4s cubic-bezier(0.34,1.2,0.5,1) 0.5s infinite; }
.g-b4 { animation: gGrow 4.4s cubic-bezier(0.34,1.2,0.5,1) 0.75s infinite; }
.g-arm { animation: gPoint 4.4s ease-in-out infinite; }
.g-mouth { animation: gTalk 0.52s ease-in-out infinite; }
""",
 'svg': """
<rect x="188" y="76" width="152" height="124" rx="10" fill="#fdfff5" stroke="#c8d2b7" stroke-width="2.4"></rect>
<path d="M206 188 V96" stroke="#dfe5d2" stroke-width="2.4" stroke-linecap="round"></path>
<path d="M206 188 H324" stroke="#dfe5d2" stroke-width="2.4" stroke-linecap="round"></path>
<g transform="translate(220 188)"><rect class="a g-b1" x="0" y="-34" width="18" height="34" rx="4" fill="#cfe2ff"></rect></g>
<g transform="translate(246 188)"><rect class="a g-b2" x="0" y="-54" width="18" height="54" rx="4" fill="#bfeeda"></rect></g>
<g transform="translate(272 188)"><rect class="a g-b3" x="0" y="-44" width="18" height="44" rx="4" fill="#ffd9a8"></rect></g>
<g transform="translate(298 188)"><rect class="a g-b4" x="0" y="-76" width="18" height="76" rx="4" fill="#d6f24b"></rect></g>
<path d="M232 200 L214 242 M284 200 L302 242" stroke="#c8d2b7" stroke-width="5" stroke-linecap="round"></path>
"""
    + shadow(120, 288, 58) + feet(120, 266, 22, 19, 11)
    + pet(120, 186, mouth='wide', mouth_y=14, mouth_cls='g-mouth', brows='up', glance=False)
    + arm(76, 212, 'M0 0 C-8 12, -10 24, -6 34', -6, 37, '')
    + """
<g transform="translate(164 206)">
  <g class="a g-arm">
    <path d="M0 0 C14 -8, 26 -16, 34 -24" stroke="#e3eccb" stroke-width="14" stroke-linecap="round" fill="none"></path>
    <circle cx="36" cy="-26" r="11.5" fill="url(#gMitt)"></circle>
  </g>
</g>""",
}

# ── Здоровье ────────────────────────────────────────────────────────────
S['health'] = {
 'title': u'Здоровье', 'alt': u'Питомец у кардиограммы',
 'css': """
@keyframes hBeat { 0%, 100% { transform: scale(1); } 12% { transform: scale(1.16); } 24% { transform: scale(0.98); } 36% { transform: scale(1.08); } 52% { transform: scale(1); } }
@keyframes hSweep { 0% { stroke-dashoffset: 300; } 100% { stroke-dashoffset: 0; } }
@keyframes hBlip { 0%, 100% { opacity: 0; } 6%, 14% { opacity: 1; } }
.h-heart { animation: hBeat 1.5s ease-in-out infinite; }
.h-line { stroke-dasharray: 300; animation: hSweep 3s linear infinite; }
.h-blip { animation: hBlip 1.5s linear infinite; }
""",
 'svg': """
<rect x="70" y="72" width="220" height="104" rx="14" fill="#1d2516"></rect>
<rect x="78" y="80" width="204" height="88" rx="9" fill="#10150f"></rect>
<path class="a h-line" d="M86 126 H126 L134 126 L140 104 L148 148 L156 118 L162 126 H206 L214 126 L220 108 L228 144 L236 120 L242 126 H274"
      stroke="#d6f24b" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"></path>
<g transform="translate(252 104)">
  <g class="a h-heart">
    <path d="M0 10 C-14 0, -18 -8, -12 -14 C-7 -19, -1 -16, 0 -11 C1 -16, 7 -19, 12 -14 C18 -8, 14 0, 0 10Z" fill="#ff7a6b"></path>
  </g>
</g>
<circle class="a h-blip" cx="96" cy="92" r="3.4" fill="#d6f24b"></circle>
"""
    + shadow(180, 290, 66) + feet(180, 268, 24, 20, 11)
    + pet(180, 192, mouth='small', mouth_y=16, eyes='open')
    + arm(138, 216, 'M0 0 C-10 12, -12 24, -8 34', -8, 37, '')
    + arm(222, 216, 'M0 0 C10 12, 12 24, 8 34', 8, 37, ''),
}

# ── Душ ─────────────────────────────────────────────────────────────────
S['shower'] = {
 'title': u'Душ', 'alt': u'Питомец под душем',
 'bg': ("radial-gradient(60% 46% at 18% 10%, #d9f3ff 0%, rgba(217,243,255,0) 62%),"
        " linear-gradient(170deg, #e8f6fb 0%, #dceff5 60%, #cfe6ef 100%)"),
 'css': """
@keyframes sDrop { 0% { transform: translateY(0) scaleY(0.6); opacity: 0; } 14% { opacity: 0.85; } 86% { opacity: 0.85; } 100% { transform: translateY(150px) scaleY(1.5); opacity: 0; } }
@keyframes sSway { 0%, 100% { transform: rotate(-1.6deg); } 50% { transform: rotate(1.6deg); } }
@keyframes sFoam { 0% { transform: translateY(0) scale(0.5); opacity: 0; } 25% { opacity: 0.9; } 100% { transform: translateY(-64px) scale(1.2); opacity: 0; } }
@keyframes sRipple { 0%, 100% { transform: scaleX(1); opacity: 0.5; } 50% { transform: scaleX(1.1); opacity: 0.3; } }
.s-sway { animation: sSway 3.4s ease-in-out infinite; }
.s-rip { animation: sRipple 2.2s ease-in-out infinite; }
"""
 + '\n'.join('.s-d%d { animation: sDrop %.2fs linear %.2fs infinite; }' % (i, 1.1 + (i % 3) * 0.12, i * 0.13) for i in range(1, 9))
 + '\n' + '\n'.join('.s-f%d { animation: sFoam %.2fs ease-out %.2fs infinite; }' % (i, 2.6 + i * 0.3, i * 0.7) for i in range(1, 4)),
 'svg': """
<rect x="172" y="28" width="16" height="30" rx="5" fill="#b9c6cc"></rect>
<path d="M140 58 H220 C226 58 230 63 228 69 L226 76 H134 L132 69 C130 63 134 58 140 58 Z" fill="#cdd9de"></path>
<path d="M140 62 H220 L218 72 H142 Z" fill="#e4edf1"></path>
"""
 + ''.join('<g transform="translate(%d 80)"><rect class="a s-d%d" x="-1.6" y="0" width="3.2" height="16" rx="1.6" fill="#8fd4ea" opacity="0.85"></rect></g>'
           % (142 + i * 11, i) for i in range(1, 9))
 + shadow(180, 290, 70, 10, '#2e4a55')
 + '<g transform="translate(180 282)"><ellipse class="a s-rip" cx="0" cy="0" rx="86" ry="13" fill="#9ed7ea"></ellipse></g>'
 + '<g transform="translate(180 282)"><ellipse class="a s-rip" cx="0" cy="0" rx="58" ry="9" fill="#c6e9f4" style="animation-delay:.6s"></ellipse></g>'
 + feet(180, 266, 24, 20, 11)
 + '<g transform="translate(180 192)"><g class="a s-sway">'
 + pet(0, 0, eyes='happy', mouth='wide', mouth_y=14)
 + arm(-44, 22, 'M0 0 C-8 12, -8 22, -4 32', -4, 35, '')
 + arm(44, 22, 'M0 0 C8 12, 8 22, 4 32', 4, 35, '')
 + '</g></g>'
 + ''.join('<g transform="translate(%d %d)"><circle class="a s-f%d" cx="0" cy="0" r="%g" fill="#fff" opacity="0.9"></circle></g>'
           % (x, y, i, r) for i, (x, y, r) in enumerate([(126, 244, 7), (236, 252, 5.4), (152, 258, 6)], 1)),
}

# ── Еда ─────────────────────────────────────────────────────────────────
S['eat'] = {
 'title': u'Еда', 'alt': u'Питомец ест',
 'css': """
@keyframes eSpoon { 0% { transform: rotate(0deg); } 34% { transform: rotate(-52deg); } 58% { transform: rotate(-52deg); } 92%, 100% { transform: rotate(0deg); } }
@keyframes eBite { 0%, 36% { transform: scaleY(1); } 44%, 54% { transform: scaleY(1.9); } 64%, 100% { transform: scaleY(1); } }
@keyframes eChew { 0%, 60% { transform: translateY(0); } 70% { transform: translateY(1.4px); } 80% { transform: translateY(0); } 90% { transform: translateY(1.4px); } 100% { transform: translateY(0); } }
@keyframes eSteam { 0% { transform: translate(0,0) scale(0.6); opacity: 0; } 22% { opacity: 0.7; } 100% { transform: translate(8px,-30px) scale(1.5); opacity: 0; } }
.e-spoon { animation: eSpoon 3.2s cubic-bezier(0.4,0.1,0.3,1) infinite; }
.e-mouth { animation: eBite 3.2s ease-in-out infinite; }
.e-head { animation: eChew 3.2s ease-in-out infinite; }
.e-s1 { animation: eSteam 2.6s ease-out infinite; }
.e-s2 { animation: eSteam 2.6s ease-out 1.3s infinite; }
""",
 'svg': """
<rect x="0" y="272" width="360" height="88" fill="#d9c3a0"></rect>
<rect x="0" y="272" width="360" height="6" fill="#e9d6b8"></rect>
<g transform="translate(176 240)"><ellipse class="a e-s1" cx="0" cy="0" rx="5.4" ry="4.4" fill="#fff" opacity="0.65"></ellipse></g>
<g transform="translate(190 243)"><ellipse class="a e-s2" cx="0" cy="0" rx="4.2" ry="3.4" fill="#fff" opacity="0.65"></ellipse></g>
<ellipse cx="180" cy="268" rx="76" ry="20" fill="#f2f5e8"></ellipse>
<ellipse cx="180" cy="265" rx="56" ry="14" fill="#e3e9d6"></ellipse>
<ellipse cx="180" cy="263" rx="40" ry="10" fill="#ffb27a"></ellipse>
<ellipse cx="166" cy="260" rx="10" ry="5" fill="#d6f24b"></ellipse>
<ellipse cx="192" cy="262" rx="8" ry="4" fill="#ff7a6b"></ellipse>
<rect x="268" y="256" width="46" height="8" rx="4" fill="#fff"></rect>
"""
 + pet(180, 148, mouth='open', mouth_y=16, mouth_cls='e-mouth', eyes='open', eye_dy=-4, breathe_cls='p-breathe e-head')
 + arm(136, 194, 'M0 0 C-12 12, -16 26, -12 36', -12, 39, '')
 + """
<g transform="translate(224 196)">
  <g class="a e-spoon">
    <path d="M0 0 C10 14, 14 28, 10 40" stroke="#e3eccb" stroke-width="14" stroke-linecap="round" fill="none"></path>
    <circle cx="10" cy="43" r="11.5" fill="url(#gMitt)"></circle>
    <g transform="translate(10 43)">
      <rect x="-2.6" y="-30" width="5.2" height="30" rx="2.6" fill="#b9c4a6"></rect>
      <ellipse cx="0" cy="-34" rx="8" ry="6" fill="#cdd7ba"></ellipse>
    </g>
  </g>
</g>""",
}

# ── Питьё ───────────────────────────────────────────────────────────────
S['drink'] = {
 'title': u'Питьё', 'alt': u'Питомец пьёт из кружки',
 'css': """
@keyframes dSip { 0%, 24% { transform: translateY(0) rotate(0deg); } 44%, 62% { transform: translateY(-14px) rotate(-16deg); } 84%, 100% { transform: translateY(0) rotate(0deg); } }
@keyframes dEyes { 0%, 34% { transform: scaleY(1); } 48%, 60% { transform: scaleY(0.12); } 74%, 100% { transform: scaleY(1); } }
@keyframes dSteam { 0% { transform: translate(0,0) scale(0.55); opacity: 0; } 24% { opacity: 0.75; } 100% { transform: translate(9px,-34px) scale(1.6); opacity: 0; } }
.d-cup { animation: dSip 4.2s cubic-bezier(0.4,0.1,0.3,1) infinite; }
.d-eye { animation: dEyes 4.2s ease-in-out infinite; }
.d-s1 { animation: dSteam 2.6s ease-out infinite; }
.d-s2 { animation: dSteam 2.6s ease-out 1.3s infinite; }
""",
 'svg': shadow(180, 290, 66) + feet(180, 268, 24, 20, 11)
 + pet(180, 192, eyes_cls='d-eye', glance=False, mouth='small', mouth_y=15)
 + """
<g transform="translate(180 236)">
  <g class="a d-cup">
    <g transform="translate(-34 -34)"><ellipse class="a d-s1" cx="0" cy="0" rx="5" ry="4" fill="#fff" opacity="0.7"></ellipse></g>
    <g transform="translate(-20 -38)"><ellipse class="a d-s2" cx="0" cy="0" rx="4" ry="3.2" fill="#fff" opacity="0.7"></ellipse></g>
    <path d="M-30 -22 H30 V8 C30 18 22 26 12 26 H-12 C-22 26 -30 18 -30 8 Z" fill="#fdfff5"></path>
    <path d="M30 -12 C44 -12 52 -4 52 6 C52 16 44 24 30 24" stroke="#e3e9d6" stroke-width="7" fill="none"></path>
    <rect x="-30" y="-6" width="60" height="9" fill="#d6f24b"></rect>
    <rect x="-30" y="-22" width="60" height="7" rx="3.5" fill="#e3e9d6"></rect>
  </g>
</g>"""
 + arm(144, 214, 'M0 0 C-6 10, -4 18, 2 24', 4, 26, '')
 + arm(216, 214, 'M0 0 C6 10, 4 18, -2 24', -4, 26, ''),
}
