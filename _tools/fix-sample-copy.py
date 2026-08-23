# -*- coding: utf-8 -*-
"""Bring /sample-report's copy back in line with what the engine actually returns.

The page quoted 729 and 739 for Sunthorn Phu. The engine returns 320 (Dawn ·
Top 97% globally) — the numbers date from before the score was recalibrated onto
the frozen reference distribution, so a reader who ran the date themselves got a
different answer than the page claimed. On a page whose entire argument is
"deterministic, go check it yourself", that is the worst possible thing to be
wrong about.

The prose also leaned on the score being HIGH as evidence the reading was
on-theme. It isn't high, and /how-it-works says plainly that low means a quieter
or more multi-faceted chart, never "bad" — so the archetype argument now rests
where it always belonged: on the Reflector and the Cancer-Cancer double water.
"""
import io

P = 'D:/Claude works here/Mythsensus/sample-report/index.html'
s = io.open(P, encoding='utf-8').read()
before = s

PAIRS = [
    # score banner
    ('<span class="score-banner-num">729</span>', '<span class="score-banner-num">320</span>'),
    ('<div class="score-banner-label">Resonant · Top 35%</div>',
     '<div class="score-banner-label">Dawn · Top 97% globally</div>'),

    # the deterministic claim — Thai numerals in the Thai copy
    ('คะแนน ๗๓๙ และคะแนนทั้ง ๒๖ ศาสตร์ในตัวอย่างนี้',
     'คะแนน ๓๒๐ และคะแนนทั้ง ๒๖ ศาสตร์ในตัวอย่างนี้'),
    ('๗๓๙/๙๙๙ เสมอ ไม่เปลี่ยนแปลง',
     '๓๒๐/๑,๐๐๐ เสมอ ไม่เปลี่ยนแปลง'),
    ('The 739 and all 26 system scores in this sample',
     'The 320 and all 26 system scores in this sample'),
    ("returns 739/999 every time, permanently",
     "returns 320/1,000 every time, permanently"),

    # the archetype argument — stop leaning on the number being high
    ('Engine คำนวณ Cosmic Score 729/1,000 + ประเภท Reflector + พระจันทร์-อาทิตย์อยู่ในราศีกรกฎ (ธาตุน้ำคู่) — สอดคล้องกับต้นแบบกวี-นักเล่าเรื่อง',
     'Engine ให้ Cosmic Score 320/1,000 (อรุณ — ดวงที่เงียบกว่า ไม่ใช่ดวงไม่ดี) แต่สิ่งที่บอกต้นแบบคือ ประเภท Reflector + พระจันทร์-อาทิตย์อยู่ในราศีกรกฎ (ธาตุน้ำคู่) — สอดคล้องกับต้นแบบกวี-นักเล่าเรื่อง'),
    ('Engine ให้ Cosmic Score 729/1,000 + Human Design Reflector + Cancer-Cancer double water — สอดคล้องกับ archetype กวี-นักเล่าเรื่อง-เชื่อมวัฒนธรรม',
     'Engine ให้ Cosmic Score 320/1,000 (อรุณ — ดวงที่เงียบกว่า ไม่ใช่ดวงไม่ดี) · ตัวที่บอก archetype คือ Human Design Reflector + Cancer-Cancer double water — สอดคล้องกับ archetype กวี-นักเล่าเรื่อง-เชื่อมวัฒนธรรม'),
    ("The engine returns a Cosmic Score of 729/1,000, a Human Design Reflector, and Cancer-Cancer double water — which lines up with the poet-storyteller-bridge-between-cultures archetype.",
     "The engine returns a Cosmic Score of 320/1,000 — Dawn, a quieter chart rather than a bad one — and it is the Human Design Reflector and the Cancer-Cancer double water that line up with the poet-storyteller-bridge-between-cultures archetype."),

    # send English readers to the English report
    ('<a href="/sample-report/sunthorn-phu/" class="btn-gold" target="_blank" rel="noopener">Open the in-depth sample report →</a>',
     '<a href="/sample-report/sunthorn-phu/en" class="btn-gold" target="_blank" rel="noopener">Open the in-depth sample report →</a>'),
    ('<a href="/sample-report/sunthorn-phu/" class="btn-gold" target="_blank" rel="noopener">Read the full in-depth sample →</a>',
     '<a href="/sample-report/sunthorn-phu/en" class="btn-gold" target="_blank" rel="noopener">Read the full in-depth sample →</a>'),
]

missed = []
for a, b in PAIRS:
    if a in s:
        s = s.replace(a, b)
    else:
        missed.append(a[:70])

io.open(P, 'w', encoding='utf-8').write(s)
print('replaced:', len(PAIRS) - len(missed), '/', len(PAIRS))
for m in missed:
    print('  NOT FOUND:', m)
left = [n for n in ('729', '739', '๗๓๙') if n in s]
print('stale numbers still present:', left or 'none')
print('changed bytes:', len(before) - len(s))
