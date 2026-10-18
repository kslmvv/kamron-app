# -*- coding: utf-8 -*-
from pet import pet, arm, feet, shadow, BG_DAY, LIME, INK

S = {}

S['call'] = {
 'title': u'Звонок', 'alt': u'Питомец говорит по телефону',
 'css': """
@keyframes clTalk { 0%, 100% { transform: scaleY(1) scaleX(1); } 22% { transform: scaleY(1.9) scaleX(0.9); } 46% { transform: scaleY(1.1); } 68% { transform: scaleY(1.7) scaleX(0.95); } }
@keyframes clWave { 0% { transform: scale(0.5); opacity: 0.9; } 100% { transform: scale(1.5); opacity: 0; } }
@keyframes clNod { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(2.2deg); } }
.cl-mouth { animation: clTalk 1.3s ease-in-out infinite; }
.cl-w1 { animation: clWave 1.8s ease-out infinite; }
.cl-w2 { animation: clWave 1.8s ease-out 0.6s infinite; }
.cl-w3 { animation: clWave 1.8s ease-out 1.2s infinite; }
.cl-nod { animation: clNod 3.4s ease-in-out infinite; }
""",
 'svg': shadow(176, 292, 66) + feet(176, 270, 25, 20, 11)
 + '<g transform="translate(176 194)"><g class="a cl-nod">'
 + pet(0, 0, mouth='open', mouth_y=15, mouth_cls='cl-mouth', eyes='happy')
 + arm(-42, 24, 'M0 0 C-8 12, -8 22, -4 30', -4, 33, '')
 + '<g transform="translate(40 18)"><path d="M0 0 C12 -6, 18 -16, 20 -26" stroke="#e3eccb" stroke-width="14" stroke-linecap="round" fill="none"></path><circle cx="21" cy="-29" r="11.5" fill="url(#gMitt)"></circle></g>'
 + '<g transform="translate(50 -16)"><rect x="-11" y="-20" width="22" height="40" rx="6" fill="#2a3220"></rect><rect x="-8" y="-16" width="16" height="30" rx="3" fill="#d6f24b"></rect></g>'
 + '</g></g>'
 + ''.join('<g transform="translate(252 170)"><circle class="a cl-%s" cx="0" cy="0" r="22" fill="none" stroke="#aacf24" stroke-width="3.4" style="transform-origin: 0 0"></circle></g>' % n
           for n in ('w1', 'w2', 'w3')),
}

S['meeting'] = {
 'title': u'Встреча', 'alt': u'Питомец на встрече',
 'css': """
@keyframes mtPop { 0%, 4% { transform: scale(0.3); opacity: 0; } 12% { transform: scale(1.06); opacity: 1; } 18%, 40% { transform: scale(1); opacity: 1; } 48%, 100% { transform: scale(0.9); opacity: 0; } }
@keyframes mtNod { 0%, 44% { transform: rotate(0deg); } 56% { transform: rotate(3deg); } 68% { transform: rotate(0.6deg); } 80%, 100% { transform: rotate(0deg); } }
@keyframes mtBreathe2 { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2.4px); } }
.mt-b1 { animation: mtPop 5.2s ease-in-out infinite; }
.mt-b2 { animation: mtPop 5.2s ease-in-out 2.6s infinite; }
.mt-nod { animation: mtNod 5.2s ease-in-out 1.1s infinite; }
.mt-g1 { animation: mtBreathe2 3.7s ease-in-out infinite; }
.mt-g2 { animation: mtBreathe2 4.9s ease-in-out 0.8s infinite; }
""",
 'svg': """
<rect x="0" y="264" width="360" height="96" fill="#d9c3a0"></rect>
<rect x="0" y="264" width="360" height="6" fill="#e9d6b8"></rect>
<g transform="translate(46 226)"><g class="a mt-g1">
  <rect x="-26" y="-26" width="52" height="52" rx="17" fill="#a9b8d6"></rect>
  <circle cx="-8" cy="-2" r="4.4" fill="#48527a"></circle><circle cx="8" cy="-2" r="4.4" fill="#48527a"></circle>
</g></g>
<g transform="translate(314 230)"><g class="a mt-g2">
  <rect x="-24" y="-24" width="48" height="48" rx="16" fill="#c2b3d6"></rect>
  <circle cx="-7" cy="-2" r="4.2" fill="#52487a"></circle><circle cx="7" cy="-2" r="4.2" fill="#52487a"></circle>
</g></g>
<g transform="translate(70 148)"><g class="a mt-b1">
  <path d="M-34 -22 H34 C40 -22 44 -18 44 -12 V12 C44 18 40 22 34 22 H-10 L-22 34 L-20 22 H-34 C-40 22 -44 18 -44 12 V-12 C-44 -18 -40 -22 -34 -22 Z" fill="#fdfff5" stroke="#c8d2b7" stroke-width="2.4"></path>
  <path d="M-26 -6 H22 M-26 6 H8" stroke="#c8d2b7" stroke-width="4" stroke-linecap="round"></path>
</g></g>
<g transform="translate(292 134)"><g class="a mt-b2">
  <path d="M-32 -20 H32 C38 -20 42 -16 42 -10 V10 C42 16 38 20 32 20 H14 L20 32 L4 20 H-32 C-38 20 -42 16 -42 10 V-10 C-42 -16 -38 -20 -32 -20 Z" fill="#fdfff5" stroke="#c8d2b7" stroke-width="2.4"></path>
  <path d="M-24 -4 H18 M-24 8 H2" stroke="#c8d2b7" stroke-width="4" stroke-linecap="round"></path>
</g></g>
"""
 + '<g transform="translate(180 162)"><g class="a mt-nod">'
 + pet(0, 0, mouth='smile', mouth_y=15, eyes='open')
 + arm(-42, 26, 'M0 0 C-8 14, -10 26, -6 34', -6, 37, '')
 + arm(42, 26, 'M0 0 C8 14, 10 26, 6 34', 6, 37, '')
 + '</g></g>',
}

S['shop'] = {
 'title': u'Покупки', 'alt': u'Питомец катит тележку',
 'css': """
@keyframes shStep { 0%, 100% { transform: translateY(0) rotate(-0.8deg); } 50% { transform: translateY(-4px) rotate(0.8deg); } }
@keyframes shWheel { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes shJig { 0%, 100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-2.4px) rotate(2deg); } }
.sh-step { animation: shStep 0.78s ease-in-out infinite; }
.sh-wheel { animation: shWheel 1.1s linear infinite; }
.sh-jig { animation: shJig 0.78s ease-in-out infinite; }
.sh-jig2 { animation: shJig 0.78s ease-in-out 0.2s infinite; }
""",
 'svg': """
<rect x="0" y="288" width="360" height="72" fill="#dcd6c6"></rect>
<rect x="0" y="288" width="360" height="5" fill="#eae5d8"></rect>
"""
 + shadow(118, 296, 54) + feet(118, 278, 20, 18, 10)
 + '<g transform="translate(118 206)"><g class="a sh-step">'
 + pet(0, 0, s=0.7, eyes='happy', mouth='wide', mouth_y=13)
 + '<g transform="translate(38 20)"><path d="M0 0 C14 2, 24 6, 32 12" stroke="#e3eccb" stroke-width="13" stroke-linecap="round" fill="none"></path><circle cx="34" cy="14" r="10.5" fill="url(#gMitt)"></circle></g>'
 + '</g></g>'
 + """
<g transform="translate(236 230)">
  <path d="M-48 -34 H-34 L-20 20 H42 L52 -16 H-28" stroke="#9aa6b8" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"></path>
  <path d="M-24 -6 H48 M-18 6 H44 M-4 -16 V20 M16 -16 V20 M34 -16 V20" stroke="#b7c2d2" stroke-width="3.4" stroke-linecap="round"></path>
  <g class="a sh-jig" transform="translate(2 -24)"><rect x="-13" y="-12" width="26" height="22" rx="4" fill="#ff9b7a"></rect></g>
  <g class="a sh-jig2" transform="translate(30 -22)"><circle cx="0" cy="0" r="11" fill="#d6f24b"></circle></g>
  <g transform="translate(-12 32)"><g class="a sh-wheel"><circle cx="0" cy="0" r="9" fill="#5e6678"></circle><path d="M0 -9 V9 M-9 0 H9" stroke="#8d95a6" stroke-width="2.6"></path></g></g>
  <g transform="translate(36 32)"><g class="a sh-wheel"><circle cx="0" cy="0" r="9" fill="#5e6678"></circle><path d="M0 -9 V9 M-9 0 H9" stroke="#8d95a6" stroke-width="2.6"></path></g></g>
</g>""",
}

S['gift'] = {
 'title': u'Подарок', 'alt': u'Питомец держит подарок',
 'css': """
@keyframes gfJig { 0%, 62%, 100% { transform: rotate(0deg) translateY(0); } 68% { transform: rotate(-5deg) translateY(-4px); } 76% { transform: rotate(5deg) translateY(-2px); } 84% { transform: rotate(-2deg) translateY(0); } }
@keyframes gfSpark { 0%, 58% { transform: scale(0); opacity: 0; } 70% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(0.6) translateY(-20px); opacity: 0; } }
@keyframes gfJoy { 0%, 60% { transform: scaleY(1); } 72% { transform: scaleY(1.5); } 88%, 100% { transform: scaleY(1); } }
.gf-jig { animation: gfJig 3.4s ease-in-out infinite; }
.gf-s1 { animation: gfSpark 3.4s ease-out infinite; }
.gf-s2 { animation: gfSpark 3.4s ease-out 0.14s infinite; }
.gf-s3 { animation: gfSpark 3.4s ease-out 0.28s infinite; }
.gf-mouth { animation: gfJoy 3.4s ease-in-out infinite; }
""",
 'svg': shadow(180, 292, 66) + feet(180, 270, 25, 20, 11)
 + pet(180, 190, eyes='happy', mouth='wide', mouth_y=14, mouth_cls='gf-mouth')
 + arm(142, 216, 'M0 0 C-6 10, -4 18, 2 24', 4, 26, '')
 + arm(218, 216, 'M0 0 C6 10, 4 18, -2 24', -4, 26, '')
 + """
<g transform="translate(180 244)">
  <g class="a gf-jig">
    <rect x="-36" y="-26" width="72" height="52" rx="7" fill="#ff9b7a"></rect>
    <rect x="-36" y="-26" width="72" height="12" rx="5" fill="#ffb49a"></rect>
    <rect x="-7" y="-26" width="14" height="52" fill="#d6f24b"></rect>
    <path d="M-7 -26 C-24 -40, -34 -28, -20 -24 C-10 -22, -7 -26, -7 -26 Z" fill="#d6f24b"></path>
    <path d="M7 -26 C24 -40, 34 -28, 20 -24 C10 -22, 7 -26, 7 -26 Z" fill="#d6f24b"></path>
    <circle cx="0" cy="-26" r="6" fill="#aacf24"></circle>
  </g>
</g>"""
 + ''.join('<g transform="translate(%d %d)"><g class="a gf-%s"><path d="M0 -9 C1.1 -2.8 2.8 -1.1 9 0 C2.8 1.1 1.1 2.8 0 9 C-1.1 2.8 -2.8 1.1 -9 0 C-2.8 -1.1 -1.1 -2.8 0 -9Z" fill="#ffd166"></path></g></g>'
           % (x, y, n) for x, y, n in ((128, 206, 's1'), (232, 198, 's2'), (206, 160, 's3'))),
}

S['money'] = {
 'title': u'Деньги', 'alt': u'Питомец откладывает монеты',
 'css': """
@keyframes mnDrop { 0% { transform: translateY(-62px) rotate(-16deg); opacity: 0; } 14% { opacity: 1; } 62% { transform: translateY(0) rotate(8deg); opacity: 1; } 70%, 100% { transform: translateY(0) rotate(8deg); opacity: 0; } }
@keyframes mnPlus { 0%, 58% { transform: scale(0) translateY(0); opacity: 0; } 70% { transform: scale(1.1) translateY(-6px); opacity: 1; } 100% { transform: scale(0.9) translateY(-28px); opacity: 0; } }
@keyframes mnEyes { 0%, 100% { transform: translateY(-2px); } 56% { transform: translateY(3px); } }
.mn-c1 { animation: mnDrop 2.6s cubic-bezier(0.5,0,0.7,1) infinite; }
.mn-c2 { animation: mnDrop 2.6s cubic-bezier(0.5,0,0.7,1) 0.9s infinite; }
.mn-c3 { animation: mnDrop 2.6s cubic-bezier(0.5,0,0.7,1) 1.8s infinite; }
.mn-plus { animation: mnPlus 2.6s ease-out infinite; }
.mn-eyes { animation: mnEyes 2.6s ease-in-out infinite; }
""",
 'svg': """
<rect x="0" y="272" width="360" height="88" fill="#d9c3a0"></rect>
<rect x="0" y="272" width="360" height="6" fill="#e9d6b8"></rect>
"""
 + pet(144, 152, eyes_cls='mn-eyes', glance=False, mouth='small', mouth_y=15)
 + arm(104, 186, 'M0 0 C-10 12, -12 24, -8 32', -8, 35, '')
 + arm(182, 184, 'M0 0 C10 10, 16 20, 20 30', 22, 32, '')
 + """
<g transform="translate(252 190)">
  <g class="a mn-c1"><circle cx="0" cy="0" r="12" fill="#ffd166" stroke="#e0a93c" stroke-width="2.4"></circle></g>
</g>
<g transform="translate(268 196)">
  <g class="a mn-c2"><circle cx="0" cy="0" r="10" fill="#ffd166" stroke="#e0a93c" stroke-width="2.4"></circle></g>
</g>
<g transform="translate(240 198)">
  <g class="a mn-c3"><circle cx="0" cy="0" r="9" fill="#ffd166" stroke="#e0a93c" stroke-width="2.4"></circle></g>
</g>
<path d="M216 202 H296 C300 202 302 206 300 210 L292 268 C291 272 288 274 284 274 H228 C224 274 221 272 220 268 L212 210 C210 206 212 202 216 202 Z" fill="#cfe9f5" opacity="0.72"></path>
<path d="M222 240 H290 L286 268 C285 272 282 274 278 274 H234 C230 274 227 272 226 268 Z" fill="#ffd166" opacity="0.85"></path>
<rect x="210" y="194" width="92" height="12" rx="6" fill="#aab49e"></rect>
<g transform="translate(300 170)"><g class="a mn-plus"><path d="M0 -11 V11 M-11 0 H11" stroke="#aacf24" stroke-width="6" stroke-linecap="round"></path></g></g>""",
}

S['family'] = {
 'title': u'Семья', 'alt': u'Питомец с близкими',
 'css': """
@keyframes faHeart { 0% { transform: translateY(0) scale(0.4); opacity: 0; } 20% { opacity: 1; } 100% { transform: translateY(-62px) scale(1.1); opacity: 0; } }
.fa-b2 { animation-delay: -1.5s; }
.fa-b3 { animation-delay: -2.9s; }
.fa-h1 { animation: faHeart 3.6s ease-out infinite; }
.fa-h2 { animation: faHeart 3.6s ease-out 1.8s infinite; }
""",
 'svg': """
<rect x="0" y="286" width="360" height="74" fill="#dbe7c8"></rect>
<rect x="0" y="286" width="360" height="5" fill="#e9f2db"></rect>
"""
 + shadow(180, 296, 44, 9) + shadow(96, 300, 32, 7) + shadow(264, 300, 32, 7)
 + feet(180, 280, 18, 15, 9)
 + '<g transform="translate(96 230)">' + pet(0, 0, s=0.52, eyes='happy', mouth='wide', mouth_y=13,
        breathe_cls='p-breathe fa-b2', crest_cls='p-crest fa-b2') + '</g>'
 + '<g transform="translate(264 230)">' + pet(0, 0, s=0.52, eyes='happy', mouth='wide', mouth_y=13,
        breathe_cls='p-breathe fa-b3', crest_cls='p-crest fa-b3') + '</g>'
 + pet(180, 212, s=0.72, eyes='happy', mouth='wide', mouth_y=14)
 + arm(140, 234, 'M0 0 C-12 4, -20 10, -26 16', -28, 18, '')
 + arm(220, 234, 'M0 0 C12 4, 20 10, 26 16', 28, 18, '')
 + ''.join('<g transform="translate(%d %d)"><g class="a fa-%s"><path d="M0 9 C-13 0, -17 -8, -11 -13 C-6 -18, -1 -15, 0 -10 C1 -15, 6 -18, 11 -13 C17 -8, 13 0, 0 9Z" fill="#ff7a6b"></path></g></g>'
           % (x, y, n) for x, y, n in ((150, 170, 'h1'), (214, 176, 'h2'))),
}

S['clean'] = {
 'title': u'Уборка', 'alt': u'Питомец подметает',
 'css': """
@keyframes clnSweep { 0%, 100% { transform: rotate(-13deg); } 50% { transform: rotate(13deg); } }
@keyframes clnLean { 0%, 100% { transform: translateX(-3px) rotate(-1.4deg); } 50% { transform: translateX(3px) rotate(1.4deg); } }
@keyframes clnDust { 0% { transform: translate(0,0) scale(0.4); opacity: 0; } 26% { opacity: 0.8; } 100% { transform: translate(24px,-26px) scale(1.3); opacity: 0; } }
.cln-broom { animation: clnSweep 1.6s ease-in-out infinite; }
.cln-lean { animation: clnLean 1.6s ease-in-out infinite; }
.cln-d1 { animation: clnDust 1.6s ease-out infinite; }
.cln-d2 { animation: clnDust 1.6s ease-out 0.8s infinite; }
""",
 'svg': """
<rect x="0" y="286" width="360" height="74" fill="#e2dccc"></rect>
<rect x="0" y="286" width="360" height="5" fill="#efeade"></rect>
"""
 + shadow(140, 296, 58) + feet(140, 276, 22, 19, 10)
 + '<g transform="translate(140 198)"><g class="a cln-lean">'
 + pet(0, 0, s=0.72, eyes='open', mouth='small', mouth_y=14, brows='focus')
 + '<g transform="translate(38 18)"><path d="M0 0 C12 4, 20 10, 26 16" stroke="#e3eccb" stroke-width="13" stroke-linecap="round" fill="none"></path><circle cx="28" cy="18" r="10.5" fill="url(#gMitt)"></circle></g>'
 + '</g></g>'
 + """
<g transform="translate(206 180)">
  <g class="a cln-broom">
    <rect x="-3.4" y="0" width="6.8" height="86" rx="3.4" fill="#c98f68"></rect>
    <path d="M-20 86 H20 L26 112 H-26 Z" fill="#e0b36a"></path>
    <path d="M-16 92 V110 M-6 92 V112 M4 92 V112 M14 92 V110" stroke="#c99a52" stroke-width="2.6"></path>
  </g>
</g>
<g transform="translate(244 282)"><circle class="a cln-d1" cx="0" cy="0" r="5.4" fill="#cfc8b6" opacity="0.9"></circle></g>
<g transform="translate(258 286)"><circle class="a cln-d2" cx="0" cy="0" r="4.2" fill="#cfc8b6" opacity="0.9"></circle></g>""",
}

S['laundry'] = {
 'title': u'Стирка', 'alt': u'Питомец у стиральной машины',
 'css': """
@keyframes lnSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes lnShake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-1.4px); } 75% { transform: translateX(1.4px); } }
@keyframes lnBub { 0% { transform: translateY(0) scale(0.4); opacity: 0; } 25% { opacity: 0.9; } 100% { transform: translateY(-58px) scale(1.2); opacity: 0; } }
@keyframes lnLed { 0%, 48% { opacity: 1; } 52%, 100% { opacity: 0.2; } }
.ln-spin { animation: lnSpin 2.2s linear infinite; }
.ln-shake { animation: lnShake 0.22s linear infinite; }
.ln-led { animation: lnLed 1.2s steps(1) infinite; }
.ln-b1 { animation: lnBub 3s ease-out infinite; }
.ln-b2 { animation: lnBub 3s ease-out 1s infinite; }
.ln-b3 { animation: lnBub 3s ease-out 2s infinite; }
""",
 'svg': """
<rect x="0" y="286" width="360" height="74" fill="#dde3e6"></rect>
<rect x="0" y="286" width="360" height="5" fill="#eaeff1"></rect>
<g transform="translate(234 196)">
  <g class="a ln-shake">
    <rect x="-70" y="-84" width="140" height="170" rx="16" fill="#eef2f4"></rect>
    <rect x="-70" y="-84" width="140" height="34" rx="16" fill="#dfe6ea"></rect>
    <rect x="-56" y="-72" width="52" height="10" rx="5" fill="#c3ced4"></rect>
    <circle class="a ln-led" cx="48" cy="-67" r="5" fill="#d6f24b"></circle>
    <circle cx="0" cy="18" r="52" fill="#cdd8de"></circle>
    <circle cx="0" cy="18" r="43" fill="#2f3a40"></circle>
    <g transform="translate(0 18)">
      <g class="a ln-spin">
        <circle cx="0" cy="0" r="38" fill="#5f7a86"></circle>
        <path d="M-22 -20 C-6 -30, 14 -24, 20 -8 C24 6, 14 20, -2 22 C-18 24, -30 12, -28 -2 Z" fill="#fdfff5"></path>
        <circle cx="12" cy="12" r="11" fill="#d6f24b"></circle>
        <circle cx="-16" cy="12" r="8" fill="#ff9b7a"></circle>
      </g>
    </g>
    <circle cx="0" cy="18" r="43" fill="none" stroke="#9fb0b8" stroke-width="5"></circle>
  </g>
</g>
"""
 + shadow(96, 296, 48) + feet(96, 278, 18, 16, 9)
 + pet(96, 214, s=0.62, eyes='open', mouth='small', mouth_y=14)
 + arm(66, 234, 'M0 0 C-8 8, -10 16, -6 22', -6, 24, '')
 + arm(126, 234, 'M0 0 C8 8, 10 16, 6 22', 6, 24, '')
 + ''.join('<g transform="translate(%d %d)"><circle class="a ln-%s" cx="0" cy="0" r="%g" fill="#fff" opacity="0.85"></circle></g>'
           % (x, y, n, r) for x, y, n, r in ((164, 156, 'b1', 7), (186, 140, 'b2', 5), (150, 134, 'b3', 6))),
}

S['repair'] = {
 'title': u'Починка', 'alt': u'Питомец закручивает болт',
 'css': """
@keyframes rpTurn { 0%, 10% { transform: rotate(-22deg); } 42%, 58% { transform: rotate(16deg); } 72%, 100% { transform: rotate(-22deg); } }
@keyframes rpBolt { 0%, 44% { transform: rotate(0deg); } 58%, 100% { transform: rotate(38deg); } }
@keyframes rpSpark { 0%, 52% { transform: scale(0); opacity: 0; } 60% { transform: scale(1); opacity: 1; } 76%, 100% { transform: scale(1.4); opacity: 0; } }
@keyframes rpTongue { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(3px); } }
.rp-arm { animation: rpTurn 2.2s cubic-bezier(0.4,0,0.3,1) infinite; }
.rp-bolt { animation: rpBolt 2.2s cubic-bezier(0.4,0,0.3,1) infinite; }
.rp-spark { animation: rpSpark 2.2s ease-out infinite; }
.rp-mouth { animation: rpTongue 2.2s ease-in-out infinite; }
""",
 'svg': """
<rect x="0" y="272" width="360" height="88" fill="#d9c3a0"></rect>
<rect x="0" y="272" width="360" height="6" fill="#e9d6b8"></rect>
<rect x="196" y="212" width="132" height="62" rx="10" fill="#b2bcc6"></rect>
<rect x="196" y="212" width="132" height="12" rx="6" fill="#c7d0d8"></rect>
<circle cx="296" cy="248" r="9" fill="#8e99a4"></circle>
"""
 + pet(128, 158, eyes='open', brows='focus', mouth='small', mouth_y=15, mouth_cls='rp-mouth')
 + arm(92, 192, 'M0 0 C-10 12, -12 24, -8 32', -8, 35, '')
 + """
<g transform="translate(166 196)">
  <g class="a rp-arm">
    <path d="M0 0 C14 6, 26 14, 34 24" stroke="#e3eccb" stroke-width="14" stroke-linecap="round" fill="none"></path>
    <circle cx="36" cy="26" r="11.5" fill="url(#gMitt)"></circle>
    <g transform="translate(36 26)">
      <rect x="-4" y="-4" width="56" height="9" rx="4.5" fill="#9aa6b8"></rect>
      <path d="M48 -10 H62 C66 -10 68 -7 68 -2 L62 -2 L62 4 L68 4 C68 9 66 12 62 12 H48 Z" fill="#8792a4"></path>
    </g>
  </g>
</g>
<g transform="translate(246 224)">
  <g class="a rp-bolt">
    <path d="M0 -13 L11 -6.5 L11 6.5 L0 13 L-11 6.5 L-11 -6.5 Z" fill="#7e8a99"></path>
    <circle cx="0" cy="0" r="5" fill="#5f6b79"></circle>
  </g>
</g>
<g transform="translate(262 206)"><g class="a rp-spark"><path d="M0 -8 C1 -2.5 2.5 -1 8 0 C2.5 1 1 2.5 0 8 C-1 2.5 -2.5 1 -8 0 C-2.5 -1 -1 -2.5 0 -8Z" fill="#ffd166"></path></g></g>""",
}

S['haircut'] = {
 'title': u'Стрижка', 'alt': u'Питомца стригут',
 'css': """
@keyframes hcSnip { 0%, 100% { transform: rotate(-9deg); } 50% { transform: rotate(0deg); } }
@keyframes hcSnip2 { 0%, 100% { transform: rotate(9deg); } 50% { transform: rotate(0deg); } }
@keyframes hcMove { 0%, 100% { transform: translateX(-26px); } 50% { transform: translateX(26px); } }
@keyframes hcFall { 0% { transform: translateY(0) rotate(0deg); opacity: 0; } 12% { opacity: 1; } 100% { transform: translateY(96px) rotate(180deg); opacity: 0; } }
@keyframes hcEyes { 0%, 100% { transform: translateY(-2.4px); } 50% { transform: translateY(0); } }
.hc-s1 { animation: hcSnip 0.62s ease-in-out infinite; }
.hc-s2 { animation: hcSnip2 0.62s ease-in-out infinite; }
.hc-move { animation: hcMove 4.4s ease-in-out infinite; }
.hc-f1 { animation: hcFall 2.2s ease-in infinite; }
.hc-f2 { animation: hcFall 2.2s ease-in 0.7s infinite; }
.hc-f3 { animation: hcFall 2.2s ease-in 1.4s infinite; }
.hc-eyes { animation: hcEyes 4.4s ease-in-out infinite; }
""",
 'svg': """
<rect x="0" y="288" width="360" height="72" fill="#e3dad4"></rect>
<rect x="0" y="288" width="360" height="5" fill="#eee7e2"></rect>
<rect x="150" y="256" width="60" height="38" rx="8" fill="#8c7a74"></rect>
<rect x="128" y="240" width="104" height="24" rx="10" fill="#a3908a"></rect>
"""
 + pet(180, 170, eyes_cls='hc-eyes', glance=False, mouth='small', mouth_y=15)
 + """
<path d="M130 226 C130 212, 150 204, 180 204 C210 204, 230 212, 230 226 L234 250 H126 Z" fill="#cfe2ff" opacity="0.9"></path>
<path d="M126 250 H234 L236 258 H124 Z" fill="#b6d1f5" opacity="0.95"></path>
<g transform="translate(180 86)">
  <g class="a hc-move">
    <g transform="translate(0 0)">
      <g class="a hc-s1"><rect x="-3" y="0" width="6" height="34" rx="3" fill="#b7c2d2"></rect><circle cx="0" cy="42" r="8" fill="none" stroke="#b7c2d2" stroke-width="4"></circle></g>
      <g class="a hc-s2"><rect x="-3" y="0" width="6" height="34" rx="3" fill="#9aa6b8"></rect><circle cx="0" cy="42" r="8" fill="none" stroke="#9aa6b8" stroke-width="4"></circle></g>
      <circle cx="0" cy="2" r="4" fill="#7e8a99"></circle>
    </g>
  </g>
</g>
"""
 + ''.join('<g transform="translate(%d %d)"><g class="a hc-%s"><rect x="-4" y="-1.4" width="8" height="2.8" rx="1.4" fill="#cdd7ba"></rect></g></g>'
           % (x, y, n) for x, y, n in ((150, 146, 'f1'), (212, 150, 'f2'), (180, 140, 'f3'))),
}

S['pray'] = {
 'title': u'Намаз', 'alt': u'Питомец в молитве',
 'bg': ("radial-gradient(64% 50% at 50% 24%, #ffeec4 0%, rgba(255,238,196,0) 62%),"
        " linear-gradient(170deg, #f3ead9 0%, #e9ddc6 60%, #ded0b6 100%)"),
 'css': """
@keyframes prGlow { 0%, 100% { opacity: 0.35; transform: scale(0.98); } 50% { opacity: 0.6; transform: scale(1.03); } }
@keyframes prCalm { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-2.2px) scale(1.009); } }
.pr-glow { animation: prGlow 6s ease-in-out infinite; }
.pr-calm { animation: prCalm 7.6s ease-in-out infinite; }
.pr-slow { animation-duration: 7.6s; }
""",
 'svg': """
<path d="M110 212 V124 C110 92, 142 68, 180 68 C218 68, 250 92, 250 124 V212 Z" fill="#e2d2b2"></path>
<path d="M122 212 V128 C122 100, 148 80, 180 80 C212 80, 238 100, 238 128 V212 Z" fill="#f6efdf"></path>
<path d="M180 46 C186 54, 192 56, 192 56 C186 58, 182 64, 180 72 C178 64, 174 58, 168 56 C168 56, 174 54, 180 46 Z" fill="#c9a44c"></path>
<g transform="translate(180 150)"><ellipse class="a pr-glow" cx="0" cy="0" rx="92" ry="78" fill="#ffd98f"></ellipse></g>
<path d="M78 268 L282 268 L306 302 L54 302 Z" fill="#9e5f52"></path>
<path d="M90 274 H270 L286 296 H74 Z" fill="#b9705f"></path>
<path d="M132 280 H228 M120 288 H240" stroke="#d99a86" stroke-width="3.4" stroke-linecap="round"></path>
"""
 + '<g transform="translate(180 214)"><g class="a pr-calm">'
 + pet(0, 0, s=0.74, eyes='shut', mouth='small', mouth_y=15, blink=False, glance=False,
       breathe_cls='', crest_cls='p-crest pr-slow')
 + '</g></g>'
 + arm(142, 240, 'M0 0 C-4 10, 0 18, 8 22', 10, 24, '')
 + arm(218, 240, 'M0 0 C4 10, 0 18, -8 22', -10, 24, ''),
}

S['photo'] = {
 'title': u'Фото', 'alt': u'Питомец фотографирует',
 'css': """
@keyframes phFlash { 0%, 62% { opacity: 0; transform: scale(0.4); } 66% { opacity: 1; transform: scale(1); } 78%, 100% { opacity: 0; transform: scale(1.7); } }
@keyframes phBlink2 { 0%, 60% { transform: scaleY(1); } 66%, 72% { transform: scaleY(0.1); } 80%, 100% { transform: scaleY(1); } }
@keyframes phLift { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2.4px); } }
@keyframes phLens { 0%, 100% { transform: scale(1); } 50% { transform: scale(0.92); } }
.ph-flash { animation: phFlash 3.2s ease-out infinite; }
.ph-eye { animation: phBlink2 3.2s ease-in-out infinite; }
.ph-cam { animation: phLift 3.2s ease-in-out infinite; }
.ph-lens { animation: phLens 3.2s ease-in-out infinite; }
""",
 'svg': shadow(180, 292, 66) + feet(180, 270, 25, 20, 11)
 + pet(180, 190, eyes_cls='ph-eye', glance=False, blink=False, mouth='wide', mouth_y=14)
 + arm(142, 212, 'M0 0 C-6 8, -2 16, 6 20', 8, 22, '')
 + arm(218, 212, 'M0 0 C6 8, 2 16, -6 20', -8, 22, '')
 + """
<g transform="translate(180 232)">
  <g class="a ph-cam">
    <rect x="-46" y="-22" width="92" height="56" rx="10" fill="#2a3220"></rect>
    <rect x="-20" y="-32" width="30" height="12" rx="4" fill="#2a3220"></rect>
    <rect x="-40" y="-18" width="22" height="9" rx="4" fill="#4a553c"></rect>
    <circle cx="6" cy="6" r="21" fill="#4a553c"></circle>
    <g class="a ph-lens" style="transform-origin: 6px 6px"><circle cx="6" cy="6" r="15" fill="#10150f"></circle><circle cx="1" cy="1" r="5" fill="#9fb183" opacity="0.6"></circle></g>
    <rect x="28" y="-16" width="12" height="8" rx="3" fill="#d6f24b"></rect>
  </g>
</g>
<g transform="translate(214 200)"><circle class="a ph-flash" cx="0" cy="0" r="30" fill="#fffbe6"></circle></g>""",
}

S['walk'] = {
 'title': u'Прогулка', 'alt': u'Питомец гуляет',
 'css': """
@keyframes wlBob { 0%, 100% { transform: translateY(0) rotate(-1.4deg); } 50% { transform: translateY(-5px) rotate(1.4deg); } }
@keyframes wlFootL { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(7px,-7px); } }
@keyframes wlFootR { 0%, 100% { transform: translate(7px,-7px); } 50% { transform: translate(0,0); } }
@keyframes wlArmL { 0%, 100% { transform: rotate(10deg); } 50% { transform: rotate(-10deg); } }
@keyframes wlArmR { 0%, 100% { transform: rotate(-10deg); } 50% { transform: rotate(10deg); } }
@keyframes wlLeaf { 0% { transform: translate(0,0) rotate(0deg); opacity: 0; } 12% { opacity: 1; } 100% { transform: translate(-42px,172px) rotate(260deg); opacity: 0; } }
.wl-bob { animation: wlBob 0.82s ease-in-out infinite; }
.wl-fL { animation: wlFootL 0.82s ease-in-out infinite; }
.wl-fR { animation: wlFootR 0.82s ease-in-out infinite; }
.wl-aL { animation: wlArmL 0.82s ease-in-out infinite; }
.wl-aR { animation: wlArmR 0.82s ease-in-out infinite; }
.wl-l1 { animation: wlLeaf 5s ease-in-out infinite; }
.wl-l2 { animation: wlLeaf 5s ease-in-out 2.5s infinite; }
""",
 'svg': """
<rect x="0" y="284" width="360" height="76" fill="#bcd9a4"></rect>
<rect x="0" y="284" width="360" height="5" fill="#cfe7b8"></rect>
<rect x="60" y="150" width="10" height="134" rx="5" fill="#b79b74"></rect>
<ellipse cx="65" cy="140" rx="42" ry="36" fill="#8fc48d"></ellipse>
<ellipse cx="48" cy="126" rx="24" ry="20" fill="#a6d6a0"></ellipse>
<rect x="300" y="186" width="8" height="98" rx="4" fill="#b79b74"></rect>
<ellipse cx="304" cy="178" rx="30" ry="26" fill="#9ccf9a"></ellipse>
"""
 + shadow(182, 292, 56) + feet(182, 272, 22, 18, 10, 'wl-fL', 'wl-fR')
 + '<g transform="translate(182 200)"><g class="a wl-bob">'
 + pet(0, 0, s=0.72, eyes='happy', mouth='wide', mouth_y=14)
 + '<g transform="translate(-40 20)"><g class="a wl-aL"><path d="M0 0 C-8 10, -8 20, -4 28" stroke="#e3eccb" stroke-width="13" stroke-linecap="round" fill="none"></path><circle cx="-4" cy="31" r="10.5" fill="url(#gMitt)"></circle></g></g>'
 + '<g transform="translate(40 20)"><g class="a wl-aR"><path d="M0 0 C8 10, 8 20, 4 28" stroke="#e3eccb" stroke-width="13" stroke-linecap="round" fill="none"></path><circle cx="4" cy="31" r="10.5" fill="url(#gMitt)"></circle></g></g>'
 + '</g></g>'
 + ''.join('<g transform="translate(%d %d)"><g class="a wl-%s"><path d="M0 0 C7 -5, 13 -2, 12 5 C11 11, 4 13, 0 9 Z" fill="#e0a95c"></path></g></g>'
           % (x, y, n) for x, y, n in ((96, 150, 'l1'), (288, 186, 'l2'))),
}

S['idle'] = {
 'title': u'Без задачи', 'alt': u'Питомец просто стоит',
 'css': """
@keyframes idSwayL { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(3.4deg); } }
@keyframes idSwayR { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-3.4deg); } }
@keyframes idPuff { 0% { transform: translate(0,0) scale(0.4); opacity: 0; } 24% { opacity: 0.55; } 100% { transform: translate(18px,-48px) scale(1.2); opacity: 0; } }
.id-aL { animation: idSwayL 4.2s ease-in-out 0.5s infinite; }
.id-aR { animation: idSwayR 4.2s ease-in-out 0.5s infinite; }
.id-p1 { animation: idPuff 6s ease-out infinite; }
.id-p2 { animation: idPuff 6s ease-out 3s infinite; }
""",
 'svg': shadow(180, 294, 70) + feet(180, 272, 26, 21, 12)
 + pet(180, 192, eyes='open', mouth='smile', mouth_y=15)
 + '<g transform="translate(138 218)"><g class="a id-aL"><path d="M0 0 C-12 12, -16 26, -10 38" stroke="#e3eccb" stroke-width="15" stroke-linecap="round" fill="none"></path><circle cx="-10" cy="41" r="11.5" fill="url(#gMitt)"></circle></g></g>'
 + '<g transform="translate(222 218)"><g class="a id-aR"><path d="M0 0 C12 12, 16 26, 10 38" stroke="#e3eccb" stroke-width="15" stroke-linecap="round" fill="none"></path><circle cx="10" cy="41" r="11.5" fill="url(#gMitt)"></circle></g></g>'
 + '<g transform="translate(258 206)"><circle class="a id-p1" cx="0" cy="0" r="7" fill="#d6f24b" opacity="0.6"></circle></g>'
 + '<g transform="translate(104 212)"><circle class="a id-p2" cx="0" cy="0" r="5.4" fill="#bfeeda" opacity="0.6"></circle></g>',
}
