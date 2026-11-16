# Writes three more crowd bodies with silhouettes unlike the first seven (walk, dress, tote, phone, coffee,
# cane, child): a walker under an open umbrella, a student in a skirt with a backpack hugging books, and a
# person waving (two drawn frames: the waving arm swings). Same 64 x 112 frame, anchor and head socket as
# bodies/walk, so head kits, colour slots and the decoy rules apply unchanged. Plus three story props.
# Coordinates are written by hand; the script only wraps them into files.
# usage: python3 tools/author/character-bodies-2.py
import os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets'))
AUTH = "original, hand-authored SVG, Waldo's Savannah 2026-11-16"
STYLE = '''<style>
.o{stroke:#2B1D16;stroke-width:1.5;stroke-linejoin:round;stroke-linecap:round}
.l{fill:none;stroke:#2B1D16;stroke-width:1;stroke-linecap:round;stroke-linejoin:round}
.fold{fill:none;stroke:#2B1D16;stroke-opacity:.4;stroke-width:.8;stroke-linecap:round}
.sh{fill:#2B1D16;opacity:.15}.ink{fill:#2B1D16}.wht{fill:#FFFFFF}
.skin{fill:var(--skin,#E0A97E)}.hair{fill:var(--hair,#4A2F1E)}
.top{fill:var(--top,#4F6CC4)}.top2{fill:var(--top2,#F5F0E6)}.bottom{fill:var(--bottom,#3B3A48)}
.hat{fill:var(--hat,#3E8E7E)}.hat2{fill:var(--hat2,#F5F0E6)}.acc{fill:var(--acc,#F2D55C)}.shoe{fill:var(--shoe,#5A3A28)}
</style>'''
def body(name, vb, inner, extra=''):
    open(f'characters/bodies/{name}.svg', 'w').write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{vb.split()[2]}" height="{vb.split()[3]}" data-anchor="32 100" data-asset="characters/bodies/{name}" data-slots="skin hair top top2 bottom shoe acc" data-head="0 0 1" {extra}data-author="{AUTH}">\n{STYLE}\n{inner.strip()}\n</svg>\n')

NECK = '''<path class="skin o" d="M28.4,30 L36.2,30 L36.6,36.4 Q32.4,38.6 28,36.4 Z"/>
<path class="top2 o" d="M27.2,35 Q32.4,39.4 37.6,35 L38.4,36.4 Q32.4,41.4 26.4,36.4 Z"/>'''
# walking legs, frame 1 (stride) and frame 2 (passing), as in bodies/walk
LEGS1 = '''<path class="bottom o" d="M25,64 C24.5,74 23,84 21.5,94 L28,95 C29,85 30.5,75 32,65 Z"/>
<path class="shoe o" d="M20,93.6 L28.4,93.8 C30.8,94 31.6,96.6 30.6,98.6 L19,98.6 C18.2,96.6 18.6,94.4 20,93.6 Z"/>
<path class="bottom o" d="M31,64 C34,73 37,83 40,93 L46.5,92 C44,82 41.5,72 40,63 Z"/>
<path class="sh" style="opacity:.1" d="M40,63 C41.5,72 44,82 46.5,92 L44.4,92.4 C42.6,83 40.8,73 38.2,63.4 Z"/>
<path class="shoe o" d="M39.4,92 L47,91.2 C50.6,91 52,93.6 51.4,96 L40,97.4 C38.8,95.4 38.8,93.2 39.4,92 Z"/>'''
LEGS2 = '''<path class="bottom o" d="M26.4,64 C26.6,74 26.8,84 27,94.4 L32.6,94.6 C32.4,85 32.4,75 32.6,65 Z"/>
<path class="shoe o" d="M25.4,94 L33,94.2 C35.6,94.6 36.4,96.8 35.6,98.6 L24.6,98.6 C24,96.8 24.2,94.8 25.4,94 Z"/>
<path class="bottom o" d="M31.6,64 C33.4,72 35.2,80 35.6,88 C35.8,90.4 36.6,92.6 37.6,94 L42.6,92.6 C41,90 40.6,87.6 40.4,85 C40.2,77 40,70 39.6,63.6 Z"/>
<path class="shoe o" d="M37,92.6 L43.6,91.6 C46.6,91.4 47.8,93.8 47.2,96.2 L37.6,97.4 C36.6,96 36.4,94 37,92.6 Z"/>'''

# ---------- umbrella: a knee-length raincoat, and an open umbrella held high ----------
body('umbrella', '-8 -46 80 154', f'''
<ellipse cx="34" cy="100" rx="15" ry="3" class="sh"/>
<path class="top o" d="M23.5,38 C19,44 17,52 16.2,60.5 L21.6,61.5 C22.2,54 24.4,47 27.5,41.5 Z"/>
<circle class="skin o" cx="18.6" cy="63.4" r="2.9"/>
<g data-frame="1">
{LEGS1}
</g>
<g data-frame="2" display="none">
{LEGS2}
</g>
<path class="top o" d="M21.5,41 C21.5,36.5 25.5,34.5 32,34.5 C38.5,34.5 43,36.5 43.5,41 L47.4,79 C38,82.4 26,82.4 16.6,79 Z"/>
<path class="sh" d="M38,35 C42,36.4 43.5,38.4 43.5,41 L47.4,79 C44,80.2 41,80.9 38.6,81.3 C40.4,66 40,48 38,35 Z"/>
<path class="top2 o" d="M20.4,62 C28,64.4 37,64.4 45.2,62 L45.5,65.4 C37,67.8 28,67.8 20,65.4 Z"/>
<circle class="ink" cx="33" cy="47" r="1"/><circle class="ink" cx="33.4" cy="55" r="1"/><circle class="ink" cx="34" cy="72" r="1"/>
<path class="fold" d="M25,70 q-1,5 -2,9 M41,70 q1.4,4 2,8"/>
{NECK}
<!--HEAD-->
<path class="top o" d="M38.5,38.5 C43,36 46,30 47,24 L42.4,23 C41.6,28 39.6,32 36,35.5 Z"/>
<path d="M44.6,22 L34,-34" stroke="#2B1D16" stroke-width="2.6" stroke-linecap="round"/><path d="M44.6,22 L34,-34" stroke="#8A6B4A" stroke-width="1.2" stroke-linecap="round"/>
<circle class="skin o" cx="44.8" cy="22.4" r="3"/>
<path class="acc o" d="M-4,-8 C-2,-30 14,-42 34,-42 C54,-42 70,-30 72,-8 C66,-12 60,-12 55,-7 C49,-12 41,-12 34,-7 C27,-12 19,-12 13,-7 C8,-12 2,-12 -4,-8 Z"/>
<path class="top2" d="M34,-42 C26,-40 19,-30 13,-7 C19,-12 27,-12 34,-7 Z M34,-42 C46,-40 52,-30 55,-7 C49,-12 41,-12 34,-7 Z" opacity=".95"/>
<path class="l" d="M34,-42 C26,-40 19,-30 13,-7 M34,-42 C42,-40 50,-30 55,-7 M34,-42 V-7"/>
<path class="acc o" d="M-4,-8 C-2,-30 14,-42 34,-42 C54,-42 70,-30 72,-8 C66,-12 60,-12 55,-7 C49,-12 41,-12 34,-7 C27,-12 19,-12 13,-7 C8,-12 2,-12 -4,-8 Z" style="fill:none"/>
<path d="M34,-42 v-5" stroke="#2B1D16" stroke-width="2" stroke-linecap="round"/>
<path d="M14,-34 C20,-39 26,-40 30,-40" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity=".5"/>
''')

# ---------- books: a student in an A-line skirt with a backpack, hugging a stack of books ----------
body('books', '0 -8 64 112', '''
<ellipse cx="32" cy="100" rx="13" ry="3" class="sh"/>
<path class="acc o" d="M22.4,39 C15.4,40 12.6,46 12.8,54 C13,60 14.4,64 17,66 L24,66 L24.4,40 Z"/>
<path class="sh" d="M13,56 C13.4,61 14.6,64 17,66 L24,66 L24,60 Z"/>
<path class="l" d="M15,50 h8 M15.4,57 h8"/>
<path class="skin o" d="M25.6,76 L25.2,93.6 L30.4,93.6 L30.8,76 Z"/>
<path class="skin o" d="M33.4,76 L33.8,93.6 L39,93.6 L38.6,76 Z"/>
<path class="shoe o" d="M23.8,93 L30.8,93 C32.6,93.4 33,96.4 32,98.4 L23,98.4 C22.4,96.4 22.6,94 23.8,93 Z"/>
<path class="shoe o" d="M33,93 L40,93 C41.8,93.4 42.2,96.4 41.2,98.4 L32.2,98.4 C31.6,96.4 31.8,94 33,93 Z"/>
<path class="bottom o" d="M22,59.6 L42.4,59.6 L47.6,78.4 C38.6,81.6 25.6,81.6 16.6,78.4 Z"/>
<path class="sh" d="M37,59.6 L42.4,59.6 L47.6,78.4 C45,79.4 42.6,80 40.4,80.4 Z"/>
<path class="fold" d="M28,66 l-3,11 M34,66 l1,13"/>
<path class="top o" d="M22,40.6 C22,36.4 25.8,34.4 32,34.4 C38.4,34.4 42.4,36.4 42.8,40.6 L42.8,61.6 C36,63.4 28.4,63.4 21.6,61.6 Z"/>
<path class="sh" d="M38,35 C41.6,36.4 42.8,38.4 42.8,40.6 L42.8,61.6 C41,62.2 39.6,62.5 38,62.7 C39.4,53 39.4,44 38,35 Z"/>
<path d="M24.4,37.4 L22.6,58" stroke="#2B1D16" stroke-width="2.6" stroke-linecap="round"/><path d="M24.4,37.4 L22.6,58" fill="none" style="stroke:var(--acc,#F2D55C)" stroke-width="1.2" stroke-linecap="round"/>
<path class="top o" d="M24.4,40 C21.6,46 24,51.6 31,53 L31.6,49 C27.6,48 26.4,45.4 28,41.6 Z"/>
<rect x="29.6" y="43" width="17" height="5" rx="1" fill="#C73E3A" class="o"/>
<rect x="30.6" y="48" width="16" height="4.6" rx="1" fill="#2F7FA8" class="o"/>
<rect x="29.2" y="52.6" width="17.6" height="5" rx="1" fill="#F2D55C" class="o"/>
<path d="M44,44.2 h2 M44.4,49.2 h2 M44,53.8 h2.4" stroke="#FFFFFF" stroke-width=".8"/>
<path class="top o" d="M38.6,38.8 C42.6,43 43.6,48 41.6,53.6 L37.4,52.4 C38.8,48.4 38.4,45 36,42 Z"/>
<circle class="skin o" cx="38.4" cy="53.4" r="2.8"/>
<circle class="skin o" cx="31.6" cy="51" r="2.6"/>
''' + NECK + '\n<!--HEAD-->\n')

# ---------- wave: standing with one hand on the hip and the other waving (two frames) ----------
body('wave', '0 -12 64 116', '''
<ellipse cx="32" cy="100" rx="16" ry="3" class="sh"/>
<path class="bottom o" d="M25,63.4 C24,74 22.6,85 21,95.4 L27.6,95.8 C29,85 30.4,75 31.6,64.6 Z"/>
<path class="bottom o" d="M32.6,64.6 C34.6,75 36.6,85 38.6,95.6 L45,95 C43,84 41.2,73.6 40,63.4 Z"/>
<path class="sh" style="opacity:.1" d="M40,63.4 C41.2,73.6 43,84 45,95 L42.8,95.2 C41,85 39.4,75 37.6,64.4 Z"/>
<path class="shoe o" d="M19.4,95 L27.8,95.2 C30,95.6 30.8,98 30,99.6 L18.6,99.6 C17.8,97.8 18.2,95.8 19.4,95 Z"/>
<path class="shoe o" d="M38,95.2 L45.6,94.8 C48.6,95 49.6,97.6 48.8,99.6 L38.2,99.6 C37.4,98 37.2,96.2 38,95.2 Z"/>
<path class="top o" d="M23.4,39.4 C18.4,44 16.8,49.6 19.4,54 L24.2,57 L26.4,53.4 L23.4,51 C22.2,48.4 23.4,45 27,41.6 Z"/>
<circle class="skin o" cx="24.6" cy="55.6" r="2.7"/>
<path class="top o" d="M21.5,41 C21.5,36.5 25.5,34.5 32,34.5 C38.5,34.5 43,36.5 43.5,41 L44.5,66.5 C37,69 27,69 20.5,66.5 Z"/>
<path class="sh" d="M38,35 C42,36.4 43.5,38.4 43.5,41 L44.5,66.5 C42,67.6 40,67.9 38,68.1 C39.6,58 39.6,46 38,35 Z"/>
<path class="top2 o" d="M21,60 C28,62 37,62 44.2,60 L44.4,63.4 C37,65.6 28,65.6 20.8,63.4 Z"/>
<path class="fold" d="M27,52 q3,2.4 6,.6 M31,44 q1.6,2 1,4.4"/>
''' + NECK + '''
<!--HEAD-->
<g data-frame="1">
<path class="top o" d="M38.5,38.5 C43.5,34 46.6,26 47.6,16 L42.4,15.4 C41.8,24 39.4,30 35.8,35 Z"/>
<path class="skin o" d="M42,15.6 C40.6,12 41,7.4 43.4,6 L44.2,10 L45,5 L46.6,5.2 L46.6,10.4 L48.2,6.4 L49.6,7 L48.6,12.6 C48.8,14.6 47.6,16.4 45.4,16.8 Z"/>
<path d="M52,8 q2,2 1.4,5 M53.6,4.6 q3,3 2,8" fill="none" stroke="#2B1D16" stroke-width="1" stroke-linecap="round" opacity=".55"/>
</g>
<g data-frame="2" display="none">
<path class="top o" d="M38.5,38.5 C45,35 49.6,28 53,19.6 L48.2,17.4 C45.6,24 41.6,30 35.8,35 Z"/>
<path class="skin o" d="M47.8,18.4 C45.4,15.4 45,11 47,9 L48.6,12.6 L48.6,7.6 L50.2,7.4 L51,12.2 L51.8,7.8 L53.4,8.2 L53.6,14 C54.4,16 53.6,18.4 51.4,19.4 Z"/>
<path d="M57,10 q2,2.4 1,5.4 M59,7 q3.4,3 2,8.6" fill="none" stroke="#2B1D16" stroke-width="1" stroke-linecap="round" opacity=".55"/>
</g>
''')

# ---------- story props ----------
INK = '#2B1D16'; O = f'stroke="{INK}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"'
def prop(path, vb, anchor, inner):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    W, H = vb.split()[2:]
    open(path + '.svg', 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{W}" height="{H}" data-anchor="{anchor}" data-asset="{path}" data-author="{AUTH}">\n{inner.strip()}\n</svg>\n')
# an enormous student sculpture tilting on a hand truck
prop('props/street/sculpture-haul', '0 0 120 180', '58 172', f'''
<ellipse cx="60" cy="172" rx="48" ry="5" fill="{INK}" opacity=".18"/>
<g transform="rotate(-9 60 160)">
<path d="M34,158 L32,40 M84,158 L86,40" stroke="{INK}" stroke-width="4" stroke-linecap="round"/><path d="M34,158 L32,40 M84,158 L86,40" stroke="#8A8F96" stroke-width="2.2" stroke-linecap="round"/>
<path d="M28,158 H92 L90,166 H30 Z" fill="#8A8F96" {O}/>
<path d="M42,152 C30,130 34,110 52,98 C40,84 42,62 60,50 C54,36 64,22 80,20 C74,34 82,46 76,58 C92,70 88,92 72,100 C86,114 82,138 66,152 Z" fill="#3FC1C9" {O}/>
<path d="M60,50 C70,58 74,66 76,58 M52,98 C62,104 70,104 72,100" fill="none" stroke="{INK}" stroke-width="1.2"/>
<circle cx="56" cy="124" r="13" fill="#F2D55C" {O}/><circle cx="56" cy="124" r="5" fill="#FF6F61" {O}/>
<path d="M66,70 L92,58 L88,78 Z" fill="#FF6F61" {O}/>
<path d="M62,44 C58,38 64,30 72,30" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>
<path d="M34,96 C24,90 18,96 22,104" fill="none" stroke="{INK}" stroke-width="2"/><path d="M84,60 L104,48" stroke="{INK}" stroke-width="2"/>
</g>
<circle cx="38" cy="166" r="7" fill="#2B2B2B" {O}/><circle cx="82" cy="166" r="7" fill="#2B2B2B" {O}/>
''')
# a straw sun hat tumbling along the grass (a dog is after it)
prop('props/street/lost-hat', '0 0 52 34', '26 30', f'''
<ellipse cx="26" cy="30" rx="16" ry="2.6" fill="{INK}" opacity=".16"/>
<g transform="rotate(-22 26 16)"><ellipse cx="26" cy="20" rx="22" ry="7" fill="#E8C872" {O}/><path d="M14,19 C14,6 38,6 38,19 Z" fill="#E8C872" {O}/><path d="M14.4,16 C20,18.4 32,18.4 37.6,16 L37.8,19 C32,21.4 20,21.4 14.2,19 Z" fill="#E8457A" {O}/>
<path d="M8,22 q4,2 9,2 M33,24 q6,0 10,-3" fill="none" stroke="#B9953E" stroke-width="1"/></g>
<path d="M2,12 q4,-2 8,0 M0,20 q3,-1.4 6,0" fill="none" stroke="{INK}" stroke-width="1" stroke-linecap="round" opacity=".5"/>
''')
# a painter's dropped brushes and a tipped paint pot
prop('props/furniture/dropped-brushes', '0 0 90 34', '45 30', f'''
<ellipse cx="45" cy="30" rx="40" ry="3" fill="{INK}" opacity=".14"/>
<path d="M44,26 C52,22 66,22 74,26 C70,30 56,31 44,28 Z" fill="#3FC1C9" {O}/>
<path d="M58,24 C62,23 66,23 68,24.6" fill="none" stroke="#FFFFFF" stroke-width="1.4" opacity=".7"/>
<g transform="rotate(-70 40 22)"><path d="M32,14 H48 V30 H32 Z" fill="#C9C2B2" {O}/><path d="M32,18 H48" stroke="{INK}" stroke-width="1"/></g>
<path d="M4,22 L26,16" stroke="{INK}" stroke-width="3.6" stroke-linecap="round"/><path d="M4,22 L26,16" stroke="#C99A62" stroke-width="2" stroke-linecap="round"/><path d="M26,16 l5,-1.4" stroke="#E8457A" stroke-width="3.6" stroke-linecap="round"/>
<path d="M10,30 L30,27" stroke="{INK}" stroke-width="3.6" stroke-linecap="round"/><path d="M10,30 L30,27" stroke="#5C9E4A" stroke-width="2" stroke-linecap="round"/><path d="M30,27 l5,-.8" stroke="#F2D55C" stroke-width="3.6" stroke-linecap="round"/>
<path d="M76,18 L86,28" stroke="{INK}" stroke-width="3.6" stroke-linecap="round"/><path d="M76,18 L86,28" stroke="#C99A62" stroke-width="2" stroke-linecap="round"/><path d="M74,16 l-3,-3" stroke="#7D5BA6" stroke-width="3.6" stroke-linecap="round"/>
<circle cx="18" cy="26" r="1.6" fill="#E8457A"/><circle cx="62" cy="18" r="1.4" fill="#3FC1C9"/><circle cx="36" cy="31" r="1.2" fill="#F2D55C"/>
''')
print('bodies umbrella, books, wave and three story props written')
