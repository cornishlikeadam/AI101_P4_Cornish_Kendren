# Riverboat deckhand, festival-goer and lantern-carrying historian, plus a tricorn hat part.
# Hand-written coordinates on the shared 64 x 112 body frame (head socket at <!--HEAD-->).
import os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'characters'))
AUTH = "original, hand-authored SVG, Waldo's Savannah 2026-11-15"
STYLE = '<style>' + open('bodies/walk.svg').read().split('<style>')[1].split('</style>')[0] + '</style>'
NECK = '<path class="skin o" d="M28.4,30 L36.2,30 L36.6,36.4 Q32.4,38.6 28,36.4 Z"/>'
LEGS_STAND = '''<path class="bottom o" d="M25.6,64 C25.4,74 25,84 24.6,94.6 L30.6,94.8 C31,85 31.6,75 32.4,65 Z"/>
<path class="sh" d="M25.6,64 C25.4,74 25,84 24.6,94.6 L30.6,94.8 C31,85 31.6,75 32.4,65 Z"/>
<path class="shoe o" d="M23,94 L31,94.2 C33.4,94.6 34,96.8 33.2,98.6 L22,98.6 C21.4,96.8 21.6,94.8 23,94 Z"/>
<path class="bottom o" d="M31.6,64 C32.6,74 33.6,84 34.6,94 L40.6,93.6 C39.8,84 39.2,74 39.4,63.6 Z"/>
<path class="shoe o" d="M34,93.4 L41.2,93 C44.4,93 45.6,95.4 45,97.8 L34.2,98.2 C33.4,96.6 33.4,94.8 34,93.4 Z"/>'''
TORSO = '''<path class="top o" d="M21.6,41 C21.6,36.5 25.5,34.5 32,34.5 C38.5,34.5 42.6,36.5 43,41 L43.6,66.4 C36.6,68.6 27.4,68.6 21,66.4 Z"/>
<path class="sh" d="M37.6,35 C41.4,36.4 43,38.4 43,41 L43.6,66.4 C41.6,67.2 39.6,67.6 37.6,67.8 C39,58 39,46 37.6,35 Z"/>'''
def arch(name, vb, anchor, content, extra):
    W, H = vb.split()[2:]
    open(f'archetypes/{name}.svg', 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{W}" height="{H}" data-anchor="{anchor}" data-asset="characters/archetypes/{name}" data-slots="skin hair top top2 bottom shoe acc hat" {extra} data-author="{AUTH}">\n{STYLE}\n{content.strip()}\n</svg>\n')

# deckhand with a coil of rope on the shoulder, orange life vest, rubber boots
arch('riverboat-worker', '0 -8 66 112', '32 100', '<ellipse cx="33" cy="100" rx="14" ry="3" class="sh"/>' + LEGS_STAND.replace('class="shoe o"', 'fill="#F2D55C" class="o"') + '''
<path class="top o" d="M23.6,38.2 C20.4,44 19.6,50 20.4,56.6 L25.4,57.6 C25,52 25.8,46 28,41.6 Z"/>
<circle class="skin o" cx="22.8" cy="59.4" r="2.8"/>''' + TORSO + '''
<path fill="#E8742E" stroke="#2B1D16" stroke-width="1.4" stroke-linejoin="round" d="M22.6,40 C24,36.8 27,35.6 29.6,35.8 L32.2,48 L34.8,35.8 C37.6,35.6 41,36.8 42.4,40 L43,60 L22,60 Z"/>
<path fill="#E8E8E8" stroke="#2B1D16" stroke-width=".8" d="M22.2,50 H42.8 V53 H22.2 Z"/>
''' + NECK + '''
<path fill="none" stroke="#2B1D16" stroke-width="4.4" d="M40,36 C52,34 56,46 50,52 C44,58 34,54 34,46 C34,38 44,36 48,42"/>
<path fill="none" stroke="#D9B06A" stroke-width="2.8" d="M40,36 C52,34 56,46 50,52 C44,58 34,54 34,46 C34,38 44,36 48,42"/>
<path fill="none" stroke="#2B1D16" stroke-opacity=".35" stroke-width=".8" d="M44,37 l2,3 M51,43 l-3,1 M47,53 l-1,-3 M37,49 l3,-1"/>
<path class="top o" d="M38.4,38.2 C42.6,42 44.6,47.6 44.4,53.4 L39.6,54 C39.6,49.6 38.4,46 36.4,42 Z"/>
<circle class="skin o" cx="42" cy="56" r="2.8"/>
<!--HEAD-->''', 'data-head="0 0 1" data-kit="face=talk hair=crop hat=cap"')

# festival-goer with cotton candy and a pennant, mid-wave
arch('festival-goer', '0 -26 66 130', '32 100', '<ellipse cx="33" cy="100" rx="14" ry="3" class="sh"/>' + LEGS_STAND + '''
<path class="top o" d="M23.6,38.2 C18,36 14,30 12.6,22 L17.6,20.8 C18.8,27 21.6,31.2 26.4,33.6 Z"/>
<circle class="skin o" cx="14.6" cy="18.4" r="2.8"/>
<path d="M14.4,16 L8,-14" stroke="#2B1D16" stroke-width="1.8"/>
<path fill="var(--acc,#3FC1C9)" stroke="#2B1D16" stroke-width="1.2" stroke-linejoin="round" d="M8,-14 L22,-9 L9.4,-3 Z"/>
''' + TORSO + '''
<path class="top2 o" style="stroke-width:1.1" d="M27,44 h10 v8 h-10 Z"/>
''' + NECK + '''
<path class="top2 o" d="M27.2,35 Q32.4,39.4 37.6,35 L38.4,36.4 Q32.4,41.4 26.4,36.4 Z"/>
<path class="top o" d="M38.4,38.2 C42.6,42 44.6,47.6 44.4,53.4 L39.6,54 C39.6,49.6 38.4,46 36.4,42 Z"/>
<path d="M42.6,54 L50,40" stroke="#E8E2D2" stroke-width="1.6"/>
<path fill="#F4A3C8" stroke="#2B1D16" stroke-width="1.2" d="M46,40 C42,36 44,28 50,28 C52,24 60,24 60,30 C64,32 62,40 57,40 C55,44 48,44 46,40 Z"/>
<path fill="none" stroke="#FFFFFF" stroke-opacity=".7" stroke-width="1.2" d="M48,33 q3,-3 6,-2"/>
<circle class="skin o" cx="42" cy="56" r="2.8"/>
<!--HEAD-->''', 'data-head="0 0 1" data-kit="face=happy hair=ponytail"')

# historian in period dress (frock coat, breeches, buckled shoes) raising a lantern
arch('historian', '0 -14 70 118', '32 100', '<ellipse cx="33" cy="100" rx="14" ry="3" class="sh"/>' + '''
<path fill="#F4F1E8" class="o" d="M26,72 L26.6,92 L31,92 L31.6,72 Z M33.4,72 L34.4,92 L38.8,92 L38.4,72 Z"/>
<path class="shoe o" d="M23.6,92 L31.6,92.4 C33.6,93 34,96.4 33,98.6 L22.6,98.6 C22,96.4 22.2,93.6 23.6,92 Z M33.6,92 L41.2,91.6 C44,91.8 45,94.6 44.4,97.6 L33.8,98.2 C33,96.4 33,93.6 33.6,92 Z"/>
<rect x="25.6" y="93.4" width="4" height="2.6" fill="#F2C76A" stroke="#2B1D16" stroke-width=".6"/><rect x="36" y="93" width="4" height="2.6" fill="#F2C76A" stroke="#2B1D16" stroke-width=".6"/>
<path class="bottom o" d="M24.6,62 L40.4,62 L39.6,74 L25.4,74 Z"/>
<path class="top o" d="M23.6,38.2 C20.4,44 19.6,50 20.4,56.6 L25.4,57.6 C25,52 25.8,46 28,41.6 Z"/>
<circle class="skin o" cx="22.8" cy="59.4" r="2.8"/>
<path class="top o" d="M21.2,41 C21.2,36.4 25.4,34.4 32,34.4 C38.6,34.4 42.8,36.4 43.2,41 L45,82 C41,84 37,84 34.6,82 L33.4,64 L30.6,64 L29.4,82 C27,84 23,84 19.4,82 Z"/>
<path class="sh" d="M38,35 C41.6,36.4 43.2,38.4 43.2,41 L45,82 C43.2,82.8 41.6,83.2 40,83.2 C40.6,66 39.8,50 38,35 Z"/>
<path class="top2 o" d="M27.6,36.4 L36.6,36.4 L36,62 L28.2,62 Z"/>
<g class="acc" stroke="#2B1D16" stroke-width=".7"><circle cx="26.6" cy="44" r="1.1"/><circle cx="26.8" cy="52" r="1.1"/><circle cx="27" cy="60" r="1.1"/><circle cx="37.4" cy="44" r="1.1"/><circle cx="37.6" cy="52" r="1.1"/><circle cx="37.8" cy="60" r="1.1"/></g>
''' + NECK + '''
<path fill="#FFFFFF" class="o" style="stroke-width:1" d="M29,35.6 L35.8,35.6 L34.4,42 L32.4,40 L30.4,42 Z"/>
<path class="top o" d="M38.4,38.2 C44,36 48,30 50,22 L54.6,23.4 C53,32.6 47.6,40.6 40.2,44.2 Z"/>
<circle class="skin o" cx="52.6" cy="20.6" r="2.8"/>
<path d="M52.6,18 V8" stroke="#2B1D16" stroke-width="1.4"/>
<path fill="#2B2B2B" stroke="#2B1D16" stroke-width="1.2" stroke-linejoin="round" d="M47.6,8 L57.6,8 L56.6,4 L48.6,4 Z M48,22 L57.2,22 L56,24 L49.2,24 Z"/>
<path fill="#F7D774" stroke="#2B1D16" stroke-width="1.2" d="M48.4,8 L56.8,8 L57.2,22 L48,22 Z"/>
<circle cx="52.6" cy="15" r="2.6" fill="#FFFFFF" opacity=".85"/>
<circle cx="52.6" cy="15" r="12" fill="#F7D774" opacity=".18"/>
<!--HEAD-->''', 'data-head="0 0 1" data-kit="face=talk hair=ponytail hat=tricorn"')

# tricorn hat part (used by the historian; not in the random crowd pool)
head = open('parts/hats/fedora.svg').read().split('<path')[0].replace('hats/fedora', 'hats/tricorn')
open('parts/hats/tricorn.svg', 'w').write(head + '''<path class="hat o" d="M17.6,14.6 C22,8.6 28,10.4 34,6.6 C40,10.4 46,8.6 50.6,14.4 C46,17 40,16 34,18 C28,16 22,17.2 17.6,14.6 Z"/>
<path class="hat o" d="M24.4,12 C25.6,5.4 29.6,2.6 34,2.6 C38.4,2.6 42.6,5.4 43.6,12 C40,13.4 28,13.4 24.4,12 Z"/>
<path class="hat2 o" style="stroke-width:1" d="M18.4,14.4 C22.4,9.8 28,11.4 34,7.8 C40,11.4 45.8,9.8 49.8,14.2" fill="none" stroke="var(--hat2,#F2C76A)"/>
<path class="sh" d="M40,4.6 C42,6.2 43.2,8.6 43.6,12 L40.4,12.6 Z"/>
</svg>
''')
print('district characters written')
