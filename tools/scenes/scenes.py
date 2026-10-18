# -*- coding: utf-8 -*-
import scenes_a, scenes_b, scenes_c

SCENES = {}
for m in (scenes_a, scenes_b, scenes_c):
    SCENES.update(m.S)

# Порядок на холсте: день питомца сверху вниз, а не алфавит.
ORDER = [
    'wake', 'read', 'work', 'write', 'present', 'meeting',
    'travel', 'flight', 'eat', 'drink', 'shop', 'money',
    'sport', 'ball', 'walk', 'music', 'game', 'screen',
    'shower', 'clean', 'laundry', 'repair', 'haircut', 'health',
    'family', 'gift', 'call', 'photo', 'pray', 'sleep', 'idle',
]
missing = set(SCENES) ^ set(ORDER)
assert not missing, missing
