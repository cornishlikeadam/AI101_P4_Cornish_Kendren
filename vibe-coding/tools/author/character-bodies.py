import os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'characters'))
AUTH = "original, hand-authored SVG, Waldo's Savannah 2026-11-15"
STYLE = '''<style>
.o{stroke:#2B1D16;stroke-width:1.5;stroke-linejoin:round;stroke-linecap:round}
.l{fill:none;stroke:#2B1D16;stroke-width:1;stroke-linecap:round;stroke-linejoin:round}
.fold{fill:none;stroke:#2B1D16;stroke-opacity:.4;stroke-width:.8;stroke-linecap:round}
.sh{fill:#2B1D16;opacity:.15}.ink{fill:#2B1D16}.wht{fill:#FFFFFF}
.skin{fill:var(--skin,#E0A97E)}.hair{fill:var(--hair,#4A2F1E)}
.top{fill:var(--top,#4F6CC4)}.top2{fill:var(--top2,#F5F0E6)}.bottom{fill:var(--bottom,#3B3A48)}
.hat{fill:var(--hat,#3E8E7E)}.hat2{fill:var(--hat2,#F5F0E6)}.acc{fill:var(--acc,#F2D55C)}.shoe{fill:var(--shoe,#5A3A28)}
</style>'''
NECK = '''<path class="skin o" d="M28.4,30 L36.2,30 L36.6,36.4 Q32.4,38.6 28,36.4 Z"/>'''
def body(name, vb, anchor, content, extra=''):
    w, h = vb.split()[2:]
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{w}" height="{h}" data-anchor="{anchor}" data-asset="characters/bodies/{name}" data-slots="skin hair top top2 bottom shoe acc" {extra} data-author="{AUTH}">\n{STYLE}\n{content.strip()}\n</svg>\n'
    open(f'bodies/{name}.svg', 'w').write(svg)

# 1. walking, trousers, arms swinging
body('walk', '0 -8 64 112', '32 100', '''
<ellipse cx="34" cy="100" rx="15" ry="3" class="sh"/>
<path class="top o" d="M23.5,38 C19,44 17,52 16.2,60.5 L21.6,61.5 C22.2,54 24.4,47 27.5,41.5 Z"/>
<path class="sh" d="M23.5,38 C19,44 17,52 16.2,60.5 L21.6,61.5 C22.2,54 24.4,47 27.5,41.5 Z"/>
<circle class="skin o" cx="18.6" cy="63.4" r="2.9"/>
<path class="bottom o" d="M25,64 C24.5,74 23,84 21.5,94 L28,95 C29,85 30.5,75 32,65 Z"/>
<path class="sh" d="M25,64 C24.5,74 23,84 21.5,94 L28,95 C29,85 30.5,75 32,65 Z"/>
<path class="shoe o" d="M20,93.6 L28.4,93.8 C30.8,94 31.6,96.6 30.6,98.6 L19,98.6 C18.2,96.6 18.6,94.4 20,93.6 Z"/>
<path class="bottom o" d="M31,64 C34,73 37,83 40,93 L46.5,92 C44,82 41.5,72 40,63 Z"/>
<path class="sh" style="opacity:.1" d="M40,63 C41.5,72 44,82 46.5,92 L44.4,92.4 C42.6,83 40.8,73 38.2,63.4 Z"/>
<path class="fold" d="M37.4,71 C38.8,75 40,79 41,83.5"/>
<path class="shoe o" d="M39.4,92 L47,91.2 C50.6,91 52,93.6 51.4,96 L40,97.4 C38.8,95.4 38.8,93.2 39.4,92 Z"/>
<path class="top o" d="M21.5,41 C21.5,36.5 25.5,34.5 32,34.5 C38.5,34.5 43,36.5 43.5,41 L44.5,66.5 C37,69 27,69 20.5,66.5 Z"/>
<path class="sh" d="M38,35 C42,36.4 43.5,38.4 43.5,41 L44.5,66.5 C42,67.6 40,67.9 38,68.1 C39.6,58 39.6,46 38,35 Z"/>
<path class="fold" d="M27,60 q3,2.4 6,.6 M24,52 q1.6,2 1,4.4"/>
''' + NECK + '''
<path class="top2 o" d="M27.2,35 Q32.4,39.4 37.6,35 L38.4,36.4 Q32.4,41.4 26.4,36.4 Z"/>
<path class="top o" d="M38.5,38.2 C42,42 44.5,48 46,56.5 L40.8,58 C39.8,51 38.4,46 36.4,42 Z"/>
<path class="fold" d="M40.6,47 q1.2,1.4 1.2,3.4"/>
<circle class="skin o" cx="43.6" cy="59.8" r="2.9"/>
<!--HEAD-->''', 'data-head="0 0 1"')

# 2. walking in a dress with a shoulder bag
body('dress', '0 -8 64 112', '32 100', '''
<ellipse cx="33" cy="100" rx="14" ry="3" class="sh"/>
<path class="skin o" d="M26.4,80 C26,86 24.6,90 23.4,94.4 L28.2,95 C29.4,90.6 30.6,86 31.2,80 Z"/>
<path class="shoe o" d="M21.8,93.6 L28.6,94 C30.4,94.4 31,96.6 30.2,98.4 L21,98.4 C20.4,96.6 20.6,94.6 21.8,93.6 Z"/>
<path class="skin o" d="M34.4,80 C36.2,85 38,89 39.8,93.2 L44.4,92 C42.6,88 41,84 39.6,79.4 Z"/>
<path class="shoe o" d="M39.2,92.6 L45,91.4 C47.8,91 49,93.2 48.4,95.4 L40,96.8 C39,95.4 38.8,93.8 39.2,92.6 Z"/>
<path class="top o" d="M24.4,38 C20.6,44 19,51 18.6,58.6 L23.8,59.4 C24.4,52.6 26,46.4 28.6,41.6 Z"/>
<path class="sh" d="M24.4,38 C20.6,44 19,51 18.6,58.6 L23.8,59.4 C24.4,52.6 26,46.4 28.6,41.6 Z"/>
<circle class="skin o" cx="21" cy="61.2" r="2.8"/>
<path class="top o" d="M23,41 C23,36.4 26.6,34.6 32,34.6 C37.6,34.6 41.4,36.4 41.6,41 L41.2,58 C46,66 48,74 47.6,81.6 C38,84.6 26.4,84.6 17.6,81.4 C18.6,73 20.6,65.4 23.4,58 Z"/>
<path class="sh" d="M37.4,35.2 C40.4,36.4 41.6,38.4 41.6,41 L41.2,58 C46,66 48,74 47.6,81.6 C44.6,82.4 42.2,82.9 40,83.2 C42.4,74 40.4,65 37.6,58 C38.6,50 38.6,42 37.4,35.2 Z"/>
<path class="top2 o" style="stroke-width:1.1" d="M23.2,56.4 C29,58.6 35.6,58.6 41.4,56.4 L41.2,59.6 C35.6,61.6 29,61.6 23.2,59.6 Z"/>
<path class="fold" d="M27,66 q-2,7 -3.4,14.6 M33,64 q.4,8 0,17.6 M38.6,66 q2.6,6.6 3.4,14.4"/>
''' + NECK + '''
<path class="top2 o" style="stroke-width:1.1" d="M27.6,35.4 Q32.4,39 37.2,35.4 L37.8,36.6 Q32.4,41 27,36.6 Z"/>
<path class="l" style="stroke-width:1.4" d="M30,37.4 C34,45 39,52 44.4,56.8"/>
<path class="acc o" d="M41.4,54.6 C44.6,53.4 49.6,53.8 51.4,55.6 L51,63.4 C47.6,64.8 43.8,64.6 41,63.4 Z"/>
<path class="sh" d="M47.4,54 C49.4,54.2 50.8,54.8 51.4,55.6 L51,63.4 C50,63.8 49,64 48,64.2 C48.4,60.6 48.2,57 47.4,54 Z"/>
<path class="l" d="M42.4,57.6 C45,58.4 48,58.4 50.6,57.4"/>
<path class="top o" d="M38.4,38.2 C41.2,41.4 43,45.6 43.6,50.6 L38.6,51.4 C38.2,47.4 37.2,44.4 35.6,41.6 Z"/>
<circle class="skin o" cx="41.6" cy="53.4" r="2.8"/>
<!--HEAD-->''', 'data-head="0 0 1"')

# 3. standing, reading a phone held at chest height
body('phone', '0 -8 64 112', '32 100', '''
<ellipse cx="32" cy="100" rx="14" ry="3" class="sh"/>
<path class="bottom o" d="M25.6,64 C25.4,74 25,84 24.6,94.6 L30.6,94.8 C31,85 31.6,75 32.4,65 Z"/>
<path class="sh" d="M25.6,64 C25.4,74 25,84 24.6,94.6 L30.6,94.8 C31,85 31.6,75 32.4,65 Z"/>
<path class="shoe o" d="M23,94 L31,94.2 C33.4,94.6 34,96.8 33.2,98.6 L22,98.6 C21.4,96.8 21.6,94.8 23,94 Z"/>
<path class="bottom o" d="M31.6,64 C32.6,74 33.6,84 34.6,94 L40.6,93.6 C39.8,84 39.2,74 39.4,63.6 Z"/>
<path class="sh" style="opacity:.1" d="M39.4,63.6 C39.2,74 39.8,84 40.6,93.6 L38.6,93.8 C37.8,84 37.4,74 37.4,63.8 Z"/>
<path class="shoe o" d="M34,93.4 L41.2,93 C44.4,93 45.6,95.4 45,97.8 L34.2,98.2 C33.4,96.6 33.4,94.8 34,93.4 Z"/>
<path class="top o" d="M23.6,38.2 C20.4,44 19.6,50 21.2,55.4 C23.6,58.6 28.4,58.4 33,56.4 L32,51.8 C29.4,52.8 27,53 25.8,52 C25.4,48 26.4,44.4 28,41.6 Z"/>
<path class="sh" d="M23.6,38.2 C20.4,44 19.6,50 21.2,55.4 C23.6,58.6 28.4,58.4 33,56.4 L32,51.8 C29.4,52.8 27,53 25.8,52 C25.4,48 26.4,44.4 28,41.6 Z"/>
<path class="top o" d="M21.6,41 C21.6,36.5 25.5,34.5 32,34.5 C38.5,34.5 42.6,36.5 43,41 L43.6,66.4 C36.6,68.6 27.4,68.6 21,66.4 Z"/>
<path class="sh" d="M37.6,35 C41.4,36.4 43,38.4 43,41 L43.6,66.4 C41.6,67.2 39.6,67.6 37.6,67.8 C39,58 39,46 37.6,35 Z"/>
<path class="top2 o" style="stroke-width:1" d="M31.6,38.6 L33,38.6 L33.4,67.6 L31.8,67.6 Z"/>
<g class="top2"><circle cx="35.4" cy="44" r=".9"/><circle cx="35.6" cy="51" r=".9"/><circle cx="35.8" cy="58" r=".9"/></g>
''' + NECK + '''
<path class="top o" d="M38.4,38.2 C42.4,41.6 44,46.4 43.4,51.6 C41,53.4 38,53.6 35.4,52.8 L35.2,48.6 C37.2,48.8 38.8,48.6 39.6,48 C39.6,45 38.4,43 36.8,41.6 Z"/>
<rect x="33.2" y="44.4" width="6" height="9.6" rx="1.2" transform="rotate(-14 36 49)" fill="#2B1D16"/>
<rect x="34.1" y="45.4" width="4.2" height="7.4" rx=".6" transform="rotate(-14 36 49)" fill="#9ED6E6"/>
<circle class="skin o" cx="33.4" cy="53" r="2.8"/>
<circle class="skin o" cx="37.6" cy="52" r="2.6"/>
<!--HEAD-->''', 'data-head="1.4 1.8 1"')

# 4. standing with a coffee cup, other hand in pocket
body('coffee', '0 -8 64 112', '32 100', '''
<ellipse cx="32" cy="100" rx="14" ry="3" class="sh"/>
<path class="bottom o" d="M24.6,64 C23,74 21.6,84 21,94.4 L27,94.8 C28.2,85 29.8,75 32,65 Z"/>
<path class="sh" d="M24.6,64 C23,74 21.6,84 21,94.4 L27,94.8 C28.2,85 29.8,75 32,65 Z"/>
<path class="shoe o" d="M19.4,94 L27.4,94.2 C29.8,94.6 30.4,96.8 29.6,98.6 L18.4,98.6 C17.8,96.8 18,94.8 19.4,94 Z"/>
<path class="bottom o" d="M31,64 C32.6,74 34,84 35,94 L41,93.6 C40.2,84 39.6,74 39.8,63.6 Z"/>
<path class="sh" style="opacity:.1" d="M39.8,63.6 C39.6,74 40.2,84 41,93.6 L39,93.8 C38.2,84 37.8,74 37.8,63.8 Z"/>
<path class="fold" d="M35.6,72 q1,4 1,8"/>
<path class="shoe o" d="M34.4,93.4 L41.6,93 C44.8,93 46,95.4 45.4,97.8 L34.6,98.2 C33.8,96.6 33.8,94.8 34.4,93.4 Z"/>
<path class="top o" d="M23.6,38.2 C20.6,43.6 19.6,50 20.4,56.6 L25.4,57.6 C25,52 25.8,46 28,41.6 Z"/>
<path class="sh" d="M23.6,38.2 C20.6,43.6 19.6,50 20.4,56.6 L25.4,57.6 C25,52 25.8,46 28,41.6 Z"/>
<path class="top o" d="M21.6,41 C21.6,36.5 25.5,34.5 32,34.5 C38.5,34.5 42.6,36.5 43,41 L44,66.4 C37,68.6 27.4,68.6 20.6,66.4 Z"/>
<path class="sh" d="M37.6,35 C41.4,36.4 43,38.4 43,41 L44,66.4 C42,67.2 40,67.6 38,67.8 C39.4,58 39.2,46 37.6,35 Z"/>
<path class="top2 o" style="stroke-width:1.1" d="M20.8,60.4 C28,62.6 36.6,62.6 43.8,60.4 L44,66.4 C37,68.6 27.4,68.6 20.6,66.4 Z"/>
<path class="fold" d="M26.4,50 q2.4,2 5,1.2"/>
''' + NECK + '''
<path class="top2 o" d="M27.2,35 Q32.4,39.4 37.6,35 L38.4,36.4 Q32.4,41.4 26.4,36.4 Z"/>
<path class="top o" d="M38.4,38.2 C42.6,42 44.6,47.6 44.4,53.4 C42.4,55.6 39.4,55.8 36.6,54.6 L37,50.4 C38.6,50.8 39.8,50.6 40.4,50 C40.2,46.6 39,44 36.8,41.6 Z"/>
<path class="wht o" d="M33.6,45.8 L40,45.8 L39.2,53.6 C37.6,54.4 35.8,54.4 34.4,53.6 Z"/>
<path class="acc o" style="stroke-width:1" d="M33.9,48.2 L39.7,48.2 L39.4,51 L34.2,51 Z"/>
<path class="ink" d="M33.2,44.4 L40.4,44.4 L40.2,46 L33.4,46 Z"/>
<circle class="skin o" cx="38.6" cy="52.4" r="2.7"/>
<!--HEAD-->''', 'data-head="0 0 1"')

# 5. walking with a tote bag and a baguette
body('tote', '0 -8 64 112', '32 100', '''
<ellipse cx="34" cy="100" rx="15" ry="3" class="sh"/>
<path class="bottom o" d="M25,64 C24.5,74 23,84 21.5,94 L28,95 C29,85 30.5,75 32,65 Z"/>
<path class="sh" d="M25,64 C24.5,74 23,84 21.5,94 L28,95 C29,85 30.5,75 32,65 Z"/>
<path class="shoe o" d="M20,93.6 L28.4,93.8 C30.8,94 31.6,96.6 30.6,98.6 L19,98.6 C18.2,96.6 18.6,94.4 20,93.6 Z"/>
<path class="bottom o" d="M31,64 C34,73 37,83 40,93 L46.5,92 C44,82 41.5,72 40,63 Z"/>
<path class="shoe o" d="M39.4,92 L47,91.2 C50.6,91 52,93.6 51.4,96 L40,97.4 C38.8,95.4 38.8,93.2 39.4,92 Z"/>
<path class="top o" d="M23.5,38 C19,44 17,52 16.2,60.5 L21.6,61.5 C22.2,54 24.4,47 27.5,41.5 Z"/>
<path class="sh" d="M23.5,38 C19,44 17,52 16.2,60.5 L21.6,61.5 C22.2,54 24.4,47 27.5,41.5 Z"/>
<circle class="skin o" cx="18.6" cy="63.4" r="2.9"/>
<path class="top o" d="M21.5,41 C21.5,36.5 25.5,34.5 32,34.5 C38.5,34.5 43,36.5 43.5,41 L44.5,66.5 C37,69 27,69 20.5,66.5 Z"/>
<path class="sh" d="M38,35 C42,36.4 43.5,38.4 43.5,41 L44.5,66.5 C42,67.6 40,67.9 38,68.1 C39.6,58 39.6,46 38,35 Z"/>
<g class="top2"><path d="M24,46 L42.6,46 L42.7,48 L23.6,48 Z"/><path d="M23.4,53 L43,53 L43.1,55 L23.2,55 Z"/></g>
<path class="l" style="stroke-width:1.4" d="M27,37 C24,44 23,52 23.6,58"/>
<path fill="#E8B26A" stroke="#2B1D16" stroke-width="1.3" stroke-linejoin="round" d="M17.4,52.6 C16.4,46 17,40 18.6,35.4 C19.6,33.8 21.4,34 21.8,35.8 C21.4,41 21.6,46.6 22.6,52 Z"/>
<path class="fold" d="M18.4,39 l2.4,-1 M18.2,43 l2.4,-1 M18.4,47 l2.4,-1"/>
<path class="acc o" d="M16.4,52 C20.6,50.6 27,50.6 30.4,52 L31.4,66.2 C26,68 19.6,67.8 15.4,66 Z"/>
<path class="sh" d="M26.6,51 C28.4,51.2 29.6,51.6 30.4,52 L31.4,66.2 C30,66.8 28.6,67.1 27.4,67.3 C27.8,61.6 27.6,56 26.6,51 Z"/>
<path class="fold" d="M19.6,58 q4,1.6 8,0"/>
''' + NECK + '''
<path class="top2 o" d="M27.2,35 Q32.4,39.4 37.6,35 L38.4,36.4 Q32.4,41.4 26.4,36.4 Z"/>
<path class="top o" d="M38.5,38.2 C42,42 44.5,48 46,56.5 L40.8,58 C39.8,51 38.4,46 36.4,42 Z"/>
<circle class="skin o" cx="43.6" cy="59.8" r="2.9"/>
<!--HEAD-->''', 'data-head="0 0 1"')

# 6. elder walking with a cane, slight stoop
body('cane', '0 -8 66 112', '32 100', '''
<ellipse cx="34" cy="100" rx="15" ry="3" class="sh"/>
<path class="bottom o" d="M26,64 C25.4,74 24.6,84 24,94.4 L30,94.8 C30.6,85 31.6,75 32.8,65 Z"/>
<path class="sh" d="M26,64 C25.4,74 24.6,84 24,94.4 L30,94.8 C30.6,85 31.6,75 32.8,65 Z"/>
<path class="shoe o" d="M22.4,94 L30.4,94.2 C32.8,94.6 33.4,96.8 32.6,98.6 L21.4,98.6 C20.8,96.8 21,94.8 22.4,94 Z"/>
<path class="bottom o" d="M32,64 C34,73 35.6,83 37,93 L43,92.4 C41.6,83 40.4,73 40.2,63.4 Z"/>
<path class="fold" d="M36.4,72 q1.2,4.4 1.6,9"/>
<path class="shoe o" d="M36.4,92.4 L43.6,91.6 C46.8,91.4 48,94 47.4,96.4 L37,97.4 C35.8,95.6 35.8,93.8 36.4,92.4 Z"/>
<path class="top o" d="M25.4,39.6 C21.6,45 20.4,51.6 20.4,58 L25.6,58.4 C25.8,52.6 27,47.2 29.6,43 Z"/>
<path class="sh" d="M25.4,39.6 C21.6,45 20.4,51.6 20.4,58 L25.6,58.4 C25.8,52.6 27,47.2 29.6,43 Z"/>
<circle class="skin o" cx="23" cy="60.4" r="2.8"/>
<path class="top o" d="M22.6,43 C22.4,38 27.6,35.2 34,35.4 C40.4,35.6 44.6,38.6 44.2,43.4 L43.8,67 C37,69 28,69 21.8,66.6 Z"/>
<path class="sh" d="M39.6,36.2 C42.8,37.6 44.4,40.2 44.2,43.4 L43.8,67 C42,67.6 40.2,68 38.4,68.2 C40,58.6 40.6,47 39.6,36.2 Z"/>
<g class="top2"><circle cx="34.6" cy="45" r="1"/><circle cx="34.8" cy="52" r="1"/><circle cx="35" cy="59" r="1"/></g>
<path class="fold" d="M26,62 q3.4,1.6 6.6,.4"/>
<path class="skin o" d="M30.6,31.4 L38.4,31.4 L38.4,37.6 Q34.2,39.6 30,37.4 Z"/>
<path class="top2 o" d="M29,36 Q34.4,40.4 39.6,36 L40.4,37.6 Q34.4,42.4 28.2,37.6 Z"/>
<path d="M49.4,57 L52,99" fill="none" stroke="#2B1D16" stroke-width="3.8" stroke-linecap="round"/>
<path d="M45.4,55.4 C45.4,52.4 49.6,52 50,55.6 L52,99" fill="none" stroke="#2B1D16" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M45.4,55.4 C45.4,52.4 49.6,52 50,55.6 L52,99" fill="none" stroke="var(--acc,#3B3A48)" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>
<path class="top o" d="M40.2,39 C44.2,42.4 46.6,47.6 47.2,53.6 L42.2,54.6 C41.4,49.6 40,46 37.8,43 Z"/>
<circle class="skin o" cx="46.2" cy="56.4" r="2.9"/>
<!--HEAD-->''', 'data-head="2.4 2 1" data-traits="stick"')

# 7. child walking (head at 0.82 scale)
body('child', '0 0 50 80', '22 76', '''
<ellipse cx="23" cy="76" rx="11" ry="2.4" class="sh"/>
<path class="bottom o" d="M17,52 C16.6,58 16,64 15.2,70.6 L20,71 C20.8,65 21.6,59 22.4,52.6 Z"/>
<path class="sh" d="M17,52 C16.6,58 16,64 15.2,70.6 L20,71 C20.8,65 21.6,59 22.4,52.6 Z"/>
<path class="shoe o" d="M13.6,70 L20.4,70.2 C22.4,70.6 22.8,72.6 22,74.4 L12.8,74.4 C12.4,72.8 12.4,71 13.6,70 Z"/>
<path class="bottom o" d="M21.4,52 C23.4,58 25.4,64 27.4,69.6 L32,68.6 C30.4,63 29,57.6 28,51.6 Z"/>
<path class="shoe o" d="M26.8,69.2 L32.6,68 C35.4,67.8 36.6,70 36,72.2 L27.6,73.6 C26.6,72.4 26.4,70.6 26.8,69.2 Z"/>
<path class="top o" d="M16.6,35.6 C13.4,40 12,45 11.6,50.2 L15.6,50.8 C16,46.2 17.4,42.4 19.4,39.2 Z"/>
<path class="sh" d="M16.6,35.6 C13.4,40 12,45 11.6,50.2 L15.6,50.8 C16,46.2 17.4,42.4 19.4,39.2 Z"/>
<circle class="skin o" cx="13.6" cy="52.4" r="2.4"/>
<path class="top o" d="M15,38 C15,34.2 17.6,32.6 22,32.6 C26.4,32.6 29.4,34.2 29.6,38 L30.2,54 C25,55.8 19.4,55.8 14.4,54 Z"/>
<path class="sh" d="M26,33 C28.4,34 29.6,35.6 29.6,38 L30.2,54 C28.8,54.6 27.4,54.9 26,55.1 C27,48 27,40 26,33 Z"/>
<path class="top2 o" style="stroke-width:1.1" d="M17.8,40 C19.6,38.6 23.6,38.4 26,40 L25.6,46.4 C23.4,47.6 20,47.6 18,46.4 Z"/>
<path class="skin o" d="M19.2,29.6 L25,29.6 L25.4,33.6 Q22.2,35.4 18.8,33.6 Z"/>
<path class="top o" d="M26.6,35.4 C29.6,38.4 31.4,42.6 32.4,47.4 L28.6,48.6 C28,44.6 26.8,41.6 25,39 Z"/>
<circle class="skin o" cx="30.8" cy="50" r="2.4"/>
<!--HEAD-->''', 'data-head="-6.4 2.4 .82"')
# 8. seated on a cafe chair (the chair belongs to the table prop), holding a cup
body('seated', '0 30 64 72', '32 99', '''
<ellipse cx="34" cy="99" rx="13" ry="2.4" class="sh"/>
<path class="bottom o" d="M30,74 C34,74 40,74.4 44,75 L44,80.6 C40,80.6 34,80.6 29,80 Z"/>
<path class="bottom o" d="M39.6,75.4 L45,75 C45.6,82 46,89 46,95.4 L40.6,95.6 C40.6,89 40.2,82 39.6,75.4 Z"/>
<path class="sh" d="M39.6,75.4 L45,75 C45.6,82 46,89 46,95.4 L40.6,95.6 C40.6,89 40.2,82 39.6,75.4 Z"/>
<path class="shoe o" d="M39.6,94.8 L46.6,94.6 C49.6,94.8 50.6,97 49.8,98.8 L39.2,98.8 C38.6,97.4 38.8,95.8 39.6,94.8 Z"/>
<path class="top o" d="M20.4,56.6 C20.4,52.4 24,50.6 29.6,50.6 C35.2,50.6 38.4,52.4 38.8,56.6 L39.4,78 C33,79.6 25.4,79.4 19.6,77.4 Z"/>
<path class="sh" d="M34.6,51 C37.4,52 38.8,54 38.8,56.6 L39.4,78 C37.6,78.6 35.8,78.9 34,79 C35.4,70 35.6,60 34.6,51 Z"/>
<path class="top2 o" style="stroke-width:1.1" d="M19.8,72 C26,73.6 33,73.6 39.2,72 L39.4,78 C33,79.6 25.4,79.4 19.6,77.4 Z"/>
<g transform="translate(-4 16)">''' + NECK + '''</g>
<path class="top2 o" d="M23.2,51 Q28.4,55.4 33.6,51 L34.4,52.4 Q28.4,57.4 22.4,52.4 Z"/>
<path class="top o" d="M35,54 C39.6,56 43,59 45.4,62.6 L41.8,66 C39.6,62.8 36.4,60.6 32.6,59 Z"/>
<path class="wht o" d="M43.6,58.4 L49.4,58.4 L48.8,64.4 C47.4,65.2 45.4,65.2 44.2,64.4 Z"/>
<path class="l" d="M49.2,59.8 q2.4,.6 1.8,2.6 q-.6,1 -2,.6"/>
<circle class="skin o" cx="44.6" cy="64.4" r="2.8"/>
<!--HEAD-->''', 'data-head="-4 16 1"')
print('bodies written')

# ---- walk cycle: a second drawn frame ("passing" pose, legs together) for walking bodies ----
# Frame 1 is the stride already drawn above; frame 2 replaces only the legs. The composer swaps the
# two <g data-frame> groups; the engine alternates them in step with the walking bounce.
PASS = '''<path class="bottom o" d="M26.4,64 C26.6,74 26.8,84 27,94.4 L32.6,94.6 C32.4,85 32.4,75 32.6,65 Z"/>
<path class="sh" d="M26.4,64 C26.6,74 26.8,84 27,94.4 L32.6,94.6 C32.4,85 32.4,75 32.6,65 Z"/>
<path class="shoe o" d="M25.4,94 L33,94.2 C35.6,94.6 36.4,96.8 35.6,98.6 L24.6,98.6 C24,96.8 24.2,94.8 25.4,94 Z"/>
<path class="bottom o" d="M31.6,64 C33.4,72 35.2,80 35.6,88 C35.8,90.4 36.6,92.6 37.6,94 L42.6,92.6 C41,90 40.6,87.6 40.4,85 C40.2,77 40,70 39.6,63.6 Z"/>
<path class="shoe o" d="M37,92.6 L43.6,91.6 C46.6,91.4 47.8,93.8 47.2,96.2 L37.6,97.4 C36.6,96 36.4,94 37,92.6 Z"/>'''
PASS_DRESS = '''<path class="skin o" d="M27.6,80 L27.6,94.4 L31.6,94.6 L31.8,80 Z"/>
<path class="shoe o" d="M25.8,93.6 L32.2,94 C34,94.4 34.6,96.6 33.8,98.4 L25,98.4 C24.4,96.6 24.6,94.6 25.8,93.6 Z"/>
<path class="skin o" d="M33.4,80 C34.4,85 35.6,89 37,92.6 L41,91.6 C39.6,88 38.6,84 37.8,79.6 Z"/>
<path class="shoe o" d="M36.4,92 L42,91 C44.8,90.8 45.8,93 45.2,95.2 L37,96.4 C36,95 35.8,93.2 36.4,92 Z"/>'''
PASS_CHILD = '''<path class="bottom o" d="M17.6,52 C17.8,58 18,64 18.2,70.6 L22.6,70.8 C22.4,65 22.4,59 22.6,52.6 Z"/>
<path class="shoe o" d="M16.6,70 L23,70.2 C25,70.6 25.4,72.6 24.6,74.4 L15.8,74.4 C15.4,72.8 15.4,71 16.6,70 Z"/>
<path class="bottom o" d="M21.6,52 C23,57 24.4,62 25,66.6 C25.4,68 26,69 26.8,69.8 L30.6,68.8 C29.6,67 29.2,65 29,63 C28.6,59 28.4,55.6 28,51.6 Z"/>
<path class="shoe o" d="M26.2,69.2 L31.2,68.2 C33.8,68 35,70.2 34.4,72.2 L27,73.4 C26,72.2 25.8,70.6 26.2,69.2 Z"/>'''
def add_frame(name, alt):
    p = f'bodies/{name}.svg'
    lines = open(p).read().split('\n')
    if any('data-frame' in l for l in lines): return
    legs = [i for i, l in enumerate(lines) if ('class="bottom o"' in l or 'class="shoe o"' in l or (name == 'dress' and 'class="skin o" d="M' in l and ('M26.4,80' in l or 'M34.4,80' in l))) and i < len(lines) - 1]
    # the leg block is the contiguous run that ends at the last shoe before the torso
    torso = next(i for i, l in enumerate(lines) if ('class="top o" d="M21' in l or 'class="top o" d="M22' in l or 'class="top o" d="M23,41' in l or 'class="top o" d="M15,38' in l))
    legs = [i for i in legs if i < torso]
    a, b = legs[0], max(i for i in legs if 'shoe' in lines[i])
    block = [l for l in lines[a:b + 1] if 'class="top' not in l and 'class="skin o" cx' not in l]
    keep = [l for l in lines[a:b + 1] if l not in block]
    new = keep + ['<g data-frame="1">'] + block + ['</g>', '<g data-frame="2" display="none">', alt, '</g>']
    lines[a:b + 1] = new
    open(p, 'w').write('\n'.join(lines))
for n in ('walk', 'tote', 'cane'): add_frame(n, PASS)
add_frame('dress', PASS_DRESS)
add_frame('child', PASS_CHILD)
print('walk frames added')
