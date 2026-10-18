# -*- coding: utf-8 -*-
from pet import pet, arm, feet, shadow, BG_NIGHT, BG_DAWN, LIME, INK

S = {}

def trees(ox):
    """Лента пейзажа шириной 240. Две такие встык дают бесшовную прокрутку."""
    out = []
    for x, h, c in ((18, 54, '#9ccf9a'), (62, 38, '#b6dcae'), (104, 64, '#86c08b'),
                    (158, 44, '#aad7a6'), (206, 56, '#93c895')):
        out.append('<ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="%s"></ellipse>'
                   % (ox + x, 150 - h, 17, 20, c))
        out.append('<rect x="%d" y="%d" width="5" height="%d" fill="#b79b74"></rect>'
                   % (ox + x - 2, 150 - h, h))
    out.append('<rect x="%d" y="112" width="34" height="38" rx="4" fill="#e9d6b8"></rect>' % (ox + 128))
    out.append('<path d="M%d 112 L%d 96 L%d 112 Z" fill="#c98f68"></path>' % (ox + 124, ox + 145, ox + 166))
    return ''.join(out)


S['travel'] = {
 'title': u'Дорога', 'alt': u'Питомец едет в транспорте',
 'defs': '<clipPath id="cWin"><rect x="62" y="64" width="236" height="104" rx="16"></rect></clipPath>',
 'css': """
@keyframes tScroll { from { transform: translateX(0); } to { transform: translateX(-240px); } }
@keyframes tBump { 0%, 100% { transform: translateY(0) rotate(0deg); } 28% { transform: translateY(1.8px) rotate(0.6deg); } 56% { transform: translateY(-1px) rotate(-0.4deg); } }
.t-scroll { animation: tScroll 7s linear infinite; }
.t-bump { animation: tBump 1.1s ease-in-out infinite; }
""",
 'svg': """
<rect x="0" y="0" width="360" height="360" fill="#e7ebe0"></rect>
<rect x="54" y="56" width="252" height="120" rx="22" fill="#b9c4a6"></rect>
<rect x="62" y="64" width="236" height="104" rx="16" fill="#cfe9f5"></rect>
<g clip-path="url(#cWin)">
  <rect x="62" y="130" width="236" height="38" fill="#cfe2b6"></rect>
  <g class="a t-scroll">""" + trees(62) + trees(302) + """</g>
</g>
<rect x="62" y="64" width="236" height="104" rx="16" fill="none" stroke="#a7b394" stroke-width="5"></rect>
<rect x="24" y="238" width="312" height="54" rx="18" fill="#8fa0c0"></rect>
<rect x="24" y="238" width="312" height="12" rx="6" fill="#a7b6d2"></rect>
<rect x="44" y="196" width="272" height="56" rx="20" fill="#9cabc8"></rect>
"""
 + '<g transform="translate(180 160)"><g class="a t-bump">'
 + pet(0, 0, mouth='small', mouth_y=15)
 + arm(-42, 26, 'M0 0 C-8 12, -8 22, -4 30', -4, 33, '')
 + arm(42, 26, 'M0 0 C8 12, 8 22, 4 30', 4, 33, '')
 + '</g></g>',
}

S['flight'] = {
 'title': u'Перелёт', 'alt': u'Питомец в самолёте у иллюминатора',
 'defs': '<clipPath id="cPort"><circle cx="180" cy="104" r="53"></circle></clipPath>',
 'css': """
@keyframes fCloud { from { transform: translateX(120px); } to { transform: translateX(-240px); } }
@keyframes fHum { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-1.2px); } }
.f-c1 { animation: fCloud 11s linear infinite; }
.f-c2 { animation: fCloud 15s linear 3s infinite; }
.f-c3 { animation: fCloud 9s linear 6s infinite; }
.f-hum { animation: fHum 0.9s ease-in-out infinite; }
""",
 'svg': """
<rect x="0" y="0" width="360" height="360" fill="#dfe4ec"></rect>
<rect x="0" y="196" width="360" height="164" fill="#cdd4e2"></rect>
<circle cx="180" cy="104" r="64" fill="#b9c2d4"></circle>
<circle cx="180" cy="104" r="54" fill="#8fb6dd"></circle>
<g clip-path="url(#cPort)">
  <rect x="120" y="44" width="120" height="120" fill="#7fb0dd"></rect>
  <rect x="120" y="128" width="120" height="36" fill="#9fc9e8"></rect>
  <g class="a f-c1"><ellipse cx="150" cy="80" rx="26" ry="12" fill="#fff" opacity="0.9"></ellipse><ellipse cx="166" cy="76" rx="16" ry="10" fill="#fff" opacity="0.9"></ellipse></g>
  <g class="a f-c2"><ellipse cx="200" cy="112" rx="22" ry="9" fill="#fff" opacity="0.75"></ellipse></g>
  <g class="a f-c3"><ellipse cx="170" cy="138" rx="30" ry="10" fill="#fff" opacity="0.6"></ellipse></g>
</g>
<circle cx="180" cy="104" r="54" fill="none" stroke="#aab4c8" stroke-width="7"></circle>
<rect x="30" y="296" width="300" height="58" rx="20" fill="#7d879c"></rect>
<rect x="30" y="296" width="300" height="12" rx="6" fill="#949eb4"></rect>
<rect x="52" y="254" width="256" height="56" rx="20" fill="#8a94a9"></rect>
"""
 + '<g transform="translate(180 218)"><g class="a f-hum">'
 + pet(0, 0, s=0.7, eyes='open', mouth='small', mouth_y=15)
 + arm(-38, 22, 'M0 0 C-8 12, -8 20, -4 28', -4, 31, '')
 + arm(38, 22, 'M0 0 C8 12, 8 20, 4 28', 4, 31, '')
 + '</g></g>',
}

S['sport'] = {
 'title': u'Спорт', 'alt': u'Питомец поднимает штангу',
 'css': """
@keyframes spPress { 0%, 100% { transform: translateY(0); } 42% { transform: translateY(32px); } 62% { transform: translateY(32px); } }
@keyframes spSquash { 0%, 100% { transform: translateY(0) scale(1, 1); } 42%, 62% { transform: translateY(7px) scale(1.05, 0.94); } }
@keyframes spBrow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(2px); } }
@keyframes spDrop { 0%, 54% { transform: translate(0,0) scale(0.3); opacity: 0; } 62% { transform: translate(0,0) scale(1); opacity: 0.9; } 100% { transform: translate(4px,26px) scale(0.9); opacity: 0; } }
.sp-bar { animation: spPress 2.6s cubic-bezier(0.4,0,0.3,1) infinite; }
.sp-body { animation: spSquash 2.6s cubic-bezier(0.4,0,0.3,1) infinite; }
.sp-brow { animation: spBrow 2.6s ease-in-out infinite; }
.sp-drop { animation: spDrop 2.6s ease-in 0.2s infinite; }
""",
 'svg': shadow(180, 294, 72) + feet(180, 272, 30, 22, 12)
 + '<g transform="translate(180 198)"><g class="a sp-body">'
 + pet(0, 0, eyes='happy', mouth='wide', mouth_y=14, brows='focus')
 + '</g></g>'
 + """
<g transform="translate(180 92)">
  <g class="a sp-bar">
    <rect x="-86" y="-5" width="172" height="10" rx="5" fill="#8d9784"></rect>
    <rect x="-96" y="-22" width="22" height="44" rx="7" fill="#d6f24b"></rect>
    <rect x="74" y="-22" width="22" height="44" rx="7" fill="#d6f24b"></rect>
    <rect x="-74" y="-14" width="10" height="28" rx="4" fill="#aacf24"></rect>
    <rect x="64" y="-14" width="10" height="28" rx="4" fill="#aacf24"></rect>
    <path d="M-52 4 C-50 22, -46 34, -44 44" stroke="#e3eccb" stroke-width="14" stroke-linecap="round" fill="none"></path>
    <path d="M52 4 C50 22, 46 34, 44 44" stroke="#e3eccb" stroke-width="14" stroke-linecap="round" fill="none"></path>
    <circle cx="-54" cy="0" r="11.5" fill="url(#gMitt)"></circle>
    <circle cx="54" cy="0" r="11.5" fill="url(#gMitt)"></circle>
  </g>
</g>
<g transform="translate(212 176)"><ellipse class="a sp-drop" cx="0" cy="0" rx="3.4" ry="4.6" fill="#9ed7ea"></ellipse></g>""",
}

S['ball'] = {
 'title': u'Мяч', 'alt': u'Питомец играет с мячом',
 'css': """
@keyframes bHop { 0%, 100% { transform: translateY(-96px); } 46% { transform: translateY(0); } 50% { transform: translateY(0); } }
@keyframes bSquash { 0%, 38%, 62%, 100% { transform: scale(1,1); } 48% { transform: scale(1.18, 0.82); } }
@keyframes bSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes bShade { 0%, 100% { transform: scale(0.6); opacity: 0.07; } 46%, 50% { transform: scale(1); opacity: 0.16; } }
@keyframes bWatch { 0%, 100% { transform: translateY(-3px); } 48% { transform: translateY(3px); } }
.b-hop { animation: bHop 1.1s cubic-bezier(0.4,0,0.7,1) infinite; }
.b-squash { animation: bSquash 1.1s ease-in-out infinite; }
.b-spin { animation: bSpin 2.4s linear infinite; }
.b-shade { animation: bShade 1.1s cubic-bezier(0.4,0,0.7,1) infinite; }
.b-eyes { animation: bWatch 1.1s cubic-bezier(0.4,0,0.7,1) infinite; }
""",
 'svg': """
<rect x="0" y="282" width="360" height="78" fill="#bcd9a4"></rect>
<rect x="0" y="282" width="360" height="5" fill="#cfe7b8"></rect>
"""
 + shadow(150, 292, 62) + feet(150, 272, 24, 20, 11)
 + pet(150, 196, eyes_cls='b-eyes', glance=False, mouth='wide', mouth_y=14, brows='up')
 + arm(108, 222, 'M0 0 C-10 10, -12 20, -8 28', -8, 31, '')
 + arm(192, 222, 'M0 0 C10 10, 12 20, 8 28', 8, 31, '')
 + """
<g transform="translate(268 276)"><ellipse class="a b-shade" cx="0" cy="0" rx="26" ry="7" fill="#2f4a22"></ellipse></g>
<g transform="translate(268 252)">
  <g class="a b-hop">
    <g class="a b-squash">
      <g class="a b-spin">
        <circle cx="0" cy="0" r="24" fill="#fdfff5" stroke="#c8d2b7" stroke-width="2"></circle>
        <path d="M0 -13 L11 -5 L7 9 L-7 9 L-11 -5 Z" fill="#2a3220"></path>
        <path d="M0 -24 V-13 M11 -5 L22 -9 M7 9 L13 20 M-7 9 L-13 20 M-11 -5 L-22 -9" stroke="#2a3220" stroke-width="2.6" stroke-linecap="round"></path>
      </g>
    </g>
  </g>
</g>""",
}

S['screen'] = {
 'title': u'Экран', 'alt': u'Питомец смотрит фильм',
 'css': """
@keyframes scFlick { 0%, 100% { opacity: 0.3; } 18% { opacity: 0.62; } 36% { opacity: 0.38; } 58% { opacity: 0.7; } 78% { opacity: 0.42; } }
@keyframes scShot { 0%, 23% { opacity: 1; } 25%, 100% { opacity: 0; } }
@keyframes scMunch { 0%, 70% { transform: scaleY(1); } 78% { transform: scaleY(1.7); } 88%, 100% { transform: scaleY(1); } }
.sc-glow { animation: scFlick 3.4s ease-in-out infinite; }
.sc-1 { animation: scShot 4.8s steps(1) infinite; }
.sc-2 { animation: scShot 4.8s steps(1) 1.2s infinite; }
.sc-3 { animation: scShot 4.8s steps(1) 2.4s infinite; }
.sc-4 { animation: scShot 4.8s steps(1) 3.6s infinite; }
.sc-mouth { animation: scMunch 3.1s ease-in-out infinite; }
""",
 'svg': """
<rect x="0" y="252" width="360" height="108" fill="#c9bfae"></rect>
<rect x="0" y="252" width="360" height="5" fill="#d8cfc0"></rect>
<rect x="34" y="186" width="292" height="62" rx="20" fill="#b2a4c8"></rect>
"""
 + pet(180, 168, eyes='open', eye_r=8, mouth='small', mouth_y=16, mouth_cls='sc-mouth', glance=False)
 + arm(142, 200, 'M0 0 C-10 10, -12 20, -8 28', -8, 31, '')
 + arm(218, 200, 'M0 0 C10 10, 12 20, 8 28', 8, 31, '')
 + """
<rect x="34" y="236" width="292" height="50" rx="18" fill="#9c8fb4"></rect>
<rect x="34" y="236" width="292" height="12" rx="6" fill="#ab9ec2"></rect>
<rect x="22" y="228" width="30" height="58" rx="14" fill="#8c7ea6"></rect>
<rect x="308" y="228" width="30" height="58" rx="14" fill="#8c7ea6"></rect>
<g transform="translate(180 282)"><ellipse class="a sc-glow" cx="0" cy="0" rx="150" ry="86" fill="url(#gWarm)"></ellipse></g>
<rect x="150" y="330" width="60" height="10" rx="5" fill="#1d2516"></rect>
<rect x="100" y="300" width="160" height="38" rx="7" fill="#2a3220"></rect>
<rect x="108" y="306" width="144" height="26" rx="4" fill="#10150f"></rect>
<g transform="translate(296 296)">
  <path d="M-18 -12 H18 L14 24 H-14 Z" fill="#ff7a6b"></path>
  <path d="M-10 -12 H-4 L-3 24 H-8 Z" fill="#fff" opacity="0.75"></path>
  <ellipse cx="-8" cy="-14" rx="7" ry="5" fill="#fdfff5"></ellipse>
  <ellipse cx="3" cy="-17" rx="7" ry="5" fill="#fdfff5"></ellipse>
  <ellipse cx="13" cy="-13" rx="6" ry="4.5" fill="#fdfff5"></ellipse>
</g>""",
}

S['game'] = {
 'title': u'Игра', 'alt': u'Питомец играет на геймпаде',
 'css': """
@keyframes gaLean { 0%, 100% { transform: rotate(-2.6deg); } 50% { transform: rotate(2.6deg); } }
@keyframes gaThumbL { 0%, 100% { transform: translate(0,0); } 30% { transform: translate(-1.6px,1.6px); } 60% { transform: translate(1.4px,0); } }
@keyframes gaThumbR { 0%, 100% { transform: translate(0,0); } 22% { transform: translate(1.6px,1.4px); } 54% { transform: translate(-1.2px,0); } }
@keyframes gaLed { 0%, 44% { opacity: 1; } 50%, 100% { opacity: 0.25; } }
@keyframes gaEyes { 0%, 100% { transform: translateX(2.2px); } 50% { transform: translateX(-2.2px); } }
.ga-lean { animation: gaLean 2.3s ease-in-out infinite; }
.ga-tL { animation: gaThumbL 0.5s ease-in-out infinite; }
.ga-tR { animation: gaThumbR 0.62s ease-in-out infinite; }
.ga-led { animation: gaLed 0.8s steps(1) infinite; }
.ga-eyes { animation: gaEyes 2.3s ease-in-out infinite; }
""",
 'svg': shadow(180, 292, 68) + feet(180, 270, 26, 21, 11)
 + '<g transform="translate(180 194)"><g class="a ga-lean">'
 + pet(0, 0, eyes_cls='ga-eyes', glance=False, mouth='wide', mouth_y=14, brows='focus', eye_r=8)
 + arm(-44, 26, 'M0 0 C-6 12, -2 20, 6 26', 8, 28, '')
 + arm(44, 26, 'M0 0 C6 12, 2 20, -6 26', -8, 28, '')
 + """
<g transform="translate(0 56)">
  <path d="M-46 -12 C-56 -12, -62 -2, -58 10 C-54 22, -44 24, -36 16 L36 16 C44 24, 54 22, 58 10 C62 -2, 56 -12, 46 -12 Z" fill="#46548f"></path>
  <path d="M-46 -12 H46 C54 -12 59 -6 59 0 H-59 C-59 -6 -54 -12 -46 -12 Z" fill="#5a6aa8"></path>
  <g class="a ga-tL"><circle cx="-26" cy="2" r="7" fill="#2f3a63"></circle></g>
  <g class="a ga-tR"><circle cx="26" cy="2" r="7" fill="#2f3a63"></circle></g>
  <circle class="a ga-led" cx="0" cy="-4" r="3.4" fill="#d6f24b"></circle>
</g>"""
 + '</g></g>',
}

S['music'] = {
 'title': u'Музыка', 'alt': u'Питомец слушает музыку',
 'css': """
@keyframes muBob { 0%, 100% { transform: translateY(0) rotate(-1.8deg); } 50% { transform: translateY(-4px) rotate(1.8deg); } }
@keyframes muNote { 0% { transform: translate(0,0) scale(0.5) rotate(-12deg); opacity: 0; } 18% { opacity: 1; } 100% { transform: translate(26px,-74px) scale(1.1) rotate(16deg); opacity: 0; } }
@keyframes muPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.09); } }
.mu-bob { animation: muBob 0.86s ease-in-out infinite; }
.mu-n1 { animation: muNote 2.4s ease-out infinite; }
.mu-n2 { animation: muNote 2.4s ease-out 0.8s infinite; }
.mu-n3 { animation: muNote 2.4s ease-out 1.6s infinite; }
.mu-cup { animation: muPulse 0.86s ease-in-out infinite; }
""",
 'svg': shadow(180, 292, 66) + feet(180, 270, 25, 20, 11)
 + '<g transform="translate(180 192)"><g class="a mu-bob">'
 + pet(0, 0, eyes='happy', mouth='wide', mouth_y=14,
       head='<path d="M-62 -6 C-62 -44, -34 -68, 0 -68 C34 -68, 62 -44, 62 -6" stroke="#2a3220" stroke-width="9" fill="none" stroke-linecap="round"></path>')
 + """
<g class="a mu-cup" transform="translate(-50 -6)"><rect x="-13" y="-16" width="26" height="36" rx="11" fill="#2a3220"></rect><rect x="-8" y="-11" width="16" height="26" rx="8" fill="#d6f24b"></rect></g>
<g class="a mu-cup" transform="translate(50 -6)"><rect x="-13" y="-16" width="26" height="36" rx="11" fill="#2a3220"></rect><rect x="-8" y="-11" width="16" height="26" rx="8" fill="#d6f24b"></rect></g>
"""
 + arm(-44, 26, 'M0 0 C-8 12, -8 22, -4 30', -4, 33, '')
 + arm(44, 26, 'M0 0 C8 12, 8 22, 4 30', 4, 33, '')
 + '</g></g>'
 + ''.join('<g transform="translate(%d %d)"><g class="a mu-%s"><path d="M0 0 V-16 L12 -20 V-4" stroke="#aacf24" stroke-width="3.2" fill="none" stroke-linecap="round"></path><circle cx="-3" cy="1" r="4.4" fill="#d6f24b"></circle><circle cx="9" cy="-3" r="4.4" fill="#d6f24b"></circle></g></g>'
           % (x, y, n) for x, y, n in ((244, 188, 'n1'), (258, 206, 'n2'), (232, 214, 'n3'))),
}

S['sleep'] = {
 'title': u'Сон', 'alt': u'Питомец спит',
 'bg': BG_NIGHT,
 'css': """
@keyframes slBreathe { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-3.6px) scale(1.022); } }
@keyframes slZ { 0% { transform: translate(0,0) scale(0.5); opacity: 0; } 20% { opacity: 0.95; } 100% { transform: translate(30px,-62px) scale(1.25); opacity: 0; } }
@keyframes slStar { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }
.sl-breathe { animation: slBreathe 6.4s ease-in-out infinite; }
.sl-z1 { animation: slZ 3.6s ease-out infinite; }
.sl-z2 { animation: slZ 3.6s ease-out 1.2s infinite; }
.sl-z3 { animation: slZ 3.6s ease-out 2.4s infinite; }
.sl-s1 { animation: slStar 3.2s ease-in-out infinite; }
.sl-s2 { animation: slStar 4.1s ease-in-out 0.7s infinite; }
.sl-s3 { animation: slStar 2.7s ease-in-out 1.5s infinite; }
""",
 'svg': """
<circle class="a sl-s1" cx="62" cy="62" r="2.6" fill="#fff"></circle>
<circle class="a sl-s2" cx="300" cy="48" r="2.2" fill="#fff"></circle>
<circle class="a sl-s3" cx="252" cy="96" r="2.4" fill="#fff"></circle>
<circle class="a sl-s2" cx="96" cy="118" r="1.8" fill="#fff"></circle>
<path d="M286 66 A26 26 0 1 1 262 36 A20 20 0 1 0 286 66 Z" fill="#f4edc8" opacity="0.9"></path>
<rect x="28" y="256" width="304" height="58" rx="18" fill="#3c4668"></rect>
<rect x="28" y="256" width="304" height="12" rx="6" fill="#4b5780"></rect>
<ellipse cx="108" cy="240" rx="58" ry="30" fill="#e7ebf5"></ellipse>
<ellipse cx="108" cy="236" rx="50" ry="24" fill="#fdfff5"></ellipse>
"""
 + '<g transform="translate(182 222) rotate(-14)"><g class="a sl-breathe">'
 + pet(0, 0, s=0.74, eyes='shut', mouth='small', mouth_y=15, blink=False, glance=False,
       crest=False, breathe_cls='')
 + '</g></g>'
 + """
<path d="M118 262 C150 232, 230 230, 272 252 C292 262, 292 282, 268 282 H132 C112 282, 106 270, 118 262 Z" fill="#8fa0c0"></path>
<path d="M122 264 C152 238, 228 236, 268 256" stroke="#a7b6d2" stroke-width="7" fill="none" stroke-linecap="round"></path>
"""
 + ''.join('<g transform="translate(%d %d)"><g class="a sl-%s"><text x="0" y="0" font-family="Manrope, system-ui, sans-serif" font-size="%d" font-weight="800" fill="#eaf1ff">z</text></g></g>'
           % (x, y, n, sz) for x, y, n, sz in ((206, 176, 'z1', 20), (214, 160, 'z2', 16), (200, 190, 'z3', 13))),
}

S['wake'] = {
 'title': u'Подъём', 'alt': u'Питомец потягивается на рассвете',
 'bg': BG_DAWN,
 'css': """
@keyframes wkSun { 0%, 100% { transform: translateY(16px); } 50% { transform: translateY(-6px); } }
@keyframes wkRay { 0%, 100% { opacity: 0.3; transform: scale(0.97); } 50% { opacity: 0.6; transform: scale(1.03); } }
@keyframes wkStretch { 0%, 100% { transform: translateY(0) scale(1,1); } 46% { transform: translateY(-9px) scale(0.97, 1.06); } }
@keyframes wkArm { 0%, 100% { transform: rotate(0deg); } 46% { transform: rotate(-26deg); } }
@keyframes wkArmR { 0%, 100% { transform: rotate(0deg); } 46% { transform: rotate(26deg); } }
@keyframes wkYawn { 0%, 16% { transform: scale(1, 1); } 40%, 58% { transform: scale(1.25, 2.3); } 82%, 100% { transform: scale(1,1); } }
@keyframes wkSquint { 0%, 20% { transform: scaleY(1); } 40%, 58% { transform: scaleY(0.2); } 78%, 100% { transform: scaleY(1); } }
.wk-sun { animation: wkSun 7s ease-in-out infinite; }
.wk-ray { animation: wkRay 4.2s ease-in-out infinite; }
.wk-body { animation: wkStretch 4.6s ease-in-out infinite; }
.wk-armL { animation: wkArm 4.6s ease-in-out infinite; }
.wk-armR { animation: wkArmR 4.6s ease-in-out infinite; }
.wk-mouth { animation: wkYawn 4.6s ease-in-out infinite; }
.wk-eye { animation: wkSquint 4.6s ease-in-out infinite; }
""",
 'svg': """
<g transform="translate(180 214)">
  <g class="a wk-sun">
    <g class="a wk-ray"><circle cx="0" cy="0" r="92" fill="#ffd9a8" opacity="0.5"></circle></g>
    <circle cx="0" cy="0" r="58" fill="#ffc46e"></circle>
    <circle cx="0" cy="0" r="48" fill="#ffd98f"></circle>
  </g>
</g>
<rect x="0" y="284" width="360" height="76" fill="#e2c79f"></rect>
<rect x="0" y="284" width="360" height="5" fill="#f0dab8"></rect>
"""
 + shadow(180, 294, 66) + feet(180, 272, 25, 20, 11)
 + '<g transform="translate(180 196)"><g class="a wk-body">'
 + pet(0, 0, eyes_cls='wk-eye', glance=False, blink=False, mouth='open', mouth_y=15, mouth_cls='wk-mouth')
 + '</g>'
 + '<g transform="translate(-42 20)"><g class="a wk-armL"><path d="M0 0 C-14 -6, -22 -16, -26 -28" stroke="#e3eccb" stroke-width="14" stroke-linecap="round" fill="none"></path><circle cx="-28" cy="-31" r="11.5" fill="url(#gMitt)"></circle></g></g>'
 + '<g transform="translate(42 20)"><g class="a wk-armR"><path d="M0 0 C14 -6, 22 -16, 26 -28" stroke="#e3eccb" stroke-width="14" stroke-linecap="round" fill="none"></path><circle cx="28" cy="-31" r="11.5" fill="url(#gMitt)"></circle></g></g>'
 + '</g>',
}
