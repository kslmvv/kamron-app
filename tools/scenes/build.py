# -*- coding: utf-8 -*-
"""Собирает из описаний сцен доски для холста, страницы для проверки
и ассеты для приложения. Одна сцена описана один раз."""
import io, json, os, re, sys
import pet as P

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
ANIM = os.path.join(ROOT, 'anim')
W = H = 360


def scope(css):
    """Запирает правила сцен внутри .scene.

    В приложении эта таблица живёт рядом с его собственной, и короткое
    имя вроде .a без ограничения рано или поздно зацепит чужой элемент.
    @keyframes трогать нельзя — у них нет селектора.
    """
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    out, i, n = [], 0, len(css)
    while i < n:
        j = css.find('{', i)
        if j < 0:
            break
        head = css[i:j]
        depth, k = 1, j + 1
        while k < n and depth:
            if css[k] == '{':
                depth += 1
            elif css[k] == '}':
                depth -= 1
            k += 1
        block = css[j:k]
        stripped = head.strip()
        if stripped.startswith('@'):
            out.append(head + block)
        elif stripped.startswith('body'):
            pass  # страница приложения своя, поля ей не трогаем
        else:
            keep = head[:len(head) - len(head.lstrip())]
            sels = ', '.join('.scene ' + s.strip() for s in stripped.split(',') if s.strip())
            out.append(keep + sels + block)
        i = k
    return ''.join(out).strip() + '\n'


def main():
    import scenes
    svg = {}
    for name in scenes.ORDER:
        sc = scenes.SCENES[name]
        # Фон у сцены свой: ночь, рассвет, кафель в душе. На доске его
        # давала страница, в приложении его нужно нести с собой — иначе
        # «Сон» показывался бы на дневном фоне.
        svg[name] = ('<div class="sbg" style="background: %s">'
                     '<svg viewBox="0 0 %d %d" aria-hidden="true"><defs>%s%s</defs>%s</svg></div>'
                     % (sc.get('bg', P.BG_DAY), W, H, P.DEFS, sc.get('defs', ''), sc['svg']))

    css = [P.BASE_CSS]
    for name in scenes.ORDER:
        css.append(scenes.SCENES[name].get('css', ''))
    # Подложка сцены: скруглена под карточку питомца и режет всё лишнее.
    frame = ('.scene .sbg { position: absolute; inset: 0; overflow: hidden;'
             ' border-radius: 24px; }\n'
             '.scene .sbg svg { width: 100%; height: 100%; display: block; }\n')
    io.open(os.path.join(ANIM, 'scenes.css'), 'w', encoding='utf-8').write(
        frame + scope('\n'.join(css)))

    js = ['/* Сцены питомца. Файл собран: python3 tools/scenes/build.py.',
          '   Править исходники в tools/scenes/, а не этот файл. */',
          '(function () {',
          '  window.KAMRON_SCENES = ' + json.dumps(svg, ensure_ascii=False) + ';',
          '}());', '']
    io.open(os.path.join(ANIM, 'scenes.js'), 'w', encoding='utf-8').write('\n'.join(js))
    print('Сцен собрано: %d' % len(scenes.ORDER))


if __name__ == '__main__':
    main()
