import os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'characters'))
AUTH = "original, hand-authored SVG, Waldo's Savannah 2026-11-15"
STYLE = open('bodies/walk.svg').read().split('<style>')[1].split('</style>')[0]
STYLE = '<style>' + STYLE + '</style>'
NECK = '<path class="skin o" d="M28.4,30 L36.2,30 L36.6,36.4 Q32.4,38.6 28,36.4 Z"/>'
def neck(dx, dy):
    return f'<g transform="translate({dx} {dy})">{NECK}</g>'
def arch(name, vb, anchor, content, extra):
    w, h = vb.split()[2:]
    open(f'archetypes/{name}.svg', 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{w}" height="{h}" data-anchor="{anchor}" data-asset="characters/archetypes/{name}" data-slots="skin hair top top2 bottom shoe acc hat" {extra} data-author="{AUTH}">\n{STYLE}\n{content.strip()}\n</svg>\n')

# top hat part, used by the juggler and occasionally by the crowd
open('parts/hats/tophat.svg', 'w').write(open('parts/hats/fedora.svg').read().split('<path')[0].replace('hats/fedora', 'hats/tophat') + '''<path class="hat o" d="M19.4,15.4 C24,13.2 44,13.2 48.6,15 C47.6,17.2 44,16.8 34,16.4 C24,16.8 20.4,17.4 19.4,15.4 Z"/>
<path class="hat o" d="M25.4,14.6 L24.6,-3.6 C30,-5 38,-5 43.4,-3.6 L42.6,14.6 Z"/>
<path class="hat2 o" style="stroke-width:1.1" d="M25.2,9.6 C31,8.8 37,8.8 42.8,9.6 L42.7,13 C37,12.2 31,12.2 25.3,13 Z"/>
<path class="sh" d="M39.6,-4.2 L43.4,-3.6 L42.6,14.6 L39.8,14.8 Z"/>
<ellipse class="hat o" cx="34" cy="-3.8" rx="9.4" ry="1.6"/>
</svg>
''')

# 1. sculptor at a plinth, mallet raised over the chisel
arch('sculptor', '0 -8 92 112', '32 100', '''
<ellipse cx="50" cy="100" rx="34" ry="3.4" class="sh"/>
<path fill="#D8D2C4" stroke="#2B1D16" stroke-width="1.5" stroke-linejoin="round" d="M56,66 L78,66 L78,99 L56,99 Z"/>
<path fill="#EAE5DA" stroke="#2B1D16" stroke-width="1.5" stroke-linejoin="round" d="M56,66 L60,62 L82,62 L78,66 Z"/>
<path fill="#BFB8A8" stroke="#2B1D16" stroke-width="1.5" stroke-linejoin="round" d="M78,66 L82,62 L82,95 L78,99 Z"/>
<path fill="#C9C2B2" stroke="#2B1D16" stroke-width="1.4" stroke-linejoin="round" d="M60,64 C59.4,58 62,54.6 66,53.6 L66.4,50.6 C62.6,48.6 61.6,44 63,40.6 C64.6,36.6 70.6,36 73.4,39.2 C76,42.2 75.4,47.6 72,50.2 L72.4,53.4 C76.6,54.4 79,58 78.4,64 Z"/>
<path class="fold" d="M64.6,58.4 l2,1.4 M70,57 l1.6,2 M73.8,43.6 q1.4,.8 2,2.4 M68,45 q1.4,-1 2.8,0"/>
<path class="l" d="M71,42.6 l.1,0 M74.6,44.6 q1.2,1.4 .2,2.6"/>
<g fill="#C9C2B2" stroke="#2B1D16" stroke-width=".8"><path d="M60,97 l2.4,-1.6 l1.2,2.4 Z"/><path d="M50,98 l2,-1.2 l.8,2 Z"/><path d="M66,98.6 l1.6,-1.4 l1.4,1.8 Z"/></g>
<path class="bottom o" d="M25.6,64 C25.4,74 25,84 24.6,94.6 L30.6,94.8 C31,85 31.6,75 32.4,65 Z"/>
<path class="sh" d="M25.6,64 C25.4,74 25,84 24.6,94.6 L30.6,94.8 C31,85 31.6,75 32.4,65 Z"/>
<path class="shoe o" d="M23,94 L31,94.2 C33.4,94.6 34,96.8 33.2,98.6 L22,98.6 C21.4,96.8 21.6,94.8 23,94 Z"/>
<path class="bottom o" d="M31.6,64 C33.4,74 35.6,84 37.6,93.6 L43.6,92.6 C41.8,83.6 40.4,73.6 39.8,63.6 Z"/>
<path class="shoe o" d="M37,93 L44.2,92.2 C47.4,92 48.6,94.4 48,96.8 L37.2,97.6 C36.4,96.2 36.4,94.4 37,93 Z"/>
<path class="top o" d="M25,39.4 C30,44 38,47.6 48.6,49.6 L48.2,54.6 C37,53.4 28.4,50.4 22.6,45.4 Z"/>
<path class="sh" d="M25,39.4 C30,44 38,47.6 48.6,49.6 L48.2,54.6 C37,53.4 28.4,50.4 22.6,45.4 Z"/>
<path class="top o" d="M21.6,41 C21.6,36.5 25.5,34.5 32,34.5 C38.5,34.5 42.6,36.5 43,41 L43.6,66.4 C36.6,68.6 27.4,68.6 21,66.4 Z"/>
<path class="acc o" d="M24.2,44.6 C29,46 36,46 41.6,44.6 L43.4,69.6 C36,71.4 28.6,71.4 22.2,69.6 Z"/>
<path class="sh" d="M37.8,45.4 C39.4,45.2 40.6,45 41.6,44.6 L43.4,69.6 C41.6,70.1 39.8,70.4 38,70.6 C39,62 38.8,53 37.8,45.4 Z"/>
<path class="l" d="M24.6,44.8 C26,41 28,38.6 30.4,37.4 M41.4,44.8 C40.4,41 38.6,38.6 36.4,37.4"/>
<g fill="#C9C2B2" opacity=".9"><circle cx="30" cy="56" r="1"/><circle cx="35.6" cy="61" r=".8"/><circle cx="28" cy="64" r=".9"/><circle cx="38" cy="52" r=".7"/></g>
<path class="fold" d="M29,50 q3,1.4 6,0"/>
<path d="M50,51.6 L61.6,48.8" stroke="#2B1D16" stroke-width="3.2" stroke-linecap="round"/>
<path d="M50,51.6 L61.6,48.8" stroke="#A8B0B8" stroke-width="1.7" stroke-linecap="round"/>
<circle class="skin o" cx="50.2" cy="52" r="2.9"/>
''' + NECK + '''
<path class="top2 o" d="M27.2,35 Q32.4,39.4 37.6,35 L38.4,36.4 Q32.4,41.4 26.4,36.4 Z"/>
<path class="top o" d="M38.4,38.4 C43.4,38 47.6,35 50.2,30 L54.6,32.4 C51.6,38.6 46.2,43.2 40.2,44.2 Z"/>
<path class="sh" style="opacity:.1" d="M50.2,30 L54.6,32.4 C53.4,34.6 52,36.4 50.4,38 C51,35.4 50.8,32.6 50.2,30 Z"/>
<path d="M52.4,30 L57,19" stroke="#2B1D16" stroke-width="3.4" stroke-linecap="round"/>
<path d="M52.4,30 L57,19" stroke="#A0754E" stroke-width="1.9" stroke-linecap="round"/>
<path fill="#B98A5E" stroke="#2B1D16" stroke-width="1.4" stroke-linejoin="round" d="M52.6,17.4 L60.4,14 L62.4,18.6 L54.6,22 Z"/>
<circle class="skin o" cx="52.6" cy="30.2" r="3"/>
<path class="l" style="stroke-opacity:.5" d="M62,24 q3,2 3.6,5.4 M64.6,21.4 q3.4,1.2 4.8,4"/>
<!--HEAD-->''', 'data-head="0 0 1" data-kit="face=neutral hair=curly"')

# 2. dancer mid-twirl, skirt flaring
arch('dancer', '0 -12 80 116', '38 100', '''
<ellipse cx="38" cy="100" rx="22" ry="2.8" class="sh"/>
<path class="skin o" d="M33.6,70 C29,74 24,77.4 19.4,79.4 L21,84 C26.6,82 32,78.6 37,74.4 Z"/>
<path class="acc o" d="M17.8,77.8 C14.8,78.6 13.2,81.4 14.4,84 L21.2,84.4 Z"/>
<path class="skin o" d="M36,72 C36.4,80 36.6,88 36.4,95.6 L41,95.6 C41.4,88 41.6,80 41.2,72 Z"/>
<path class="acc o" d="M35.6,94.6 L41.6,94.6 C43.8,95 44.6,97 43.8,99 L35.2,99 C34.4,97.4 34.4,95.6 35.6,94.6 Z"/>
<path class="l" d="M36,96.6 L42.6,96.4"/>
<path class="top o" d="M30.2,40 C24,40 17.4,42 11.6,46 L13.4,50.4 C19,47.6 24.8,46.4 30.6,46.4 Z"/>
<path class="sh" d="M30.2,40 C24,40 17.4,42 11.6,46 L13.4,50.4 C19,47.6 24.8,46.4 30.6,46.4 Z"/>
<circle class="skin o" cx="10.6" cy="48.6" r="2.8"/>
<path class="top o" d="M27,54 C18,57.6 9,63 3.6,70.4 C16,75.6 30,76.4 40,75 C52,76.4 66,74 76,68 C70,61.6 59,56.6 49,54 Z"/>
<path class="sh" d="M49,54 C59,56.6 70,61.6 76,68 C70.6,71.2 64,73.4 57.6,74.6 C58,67.6 55,60 49,54 Z"/>
<path class="fold" d="M27,58 Q19,66 14,73 M36,57 Q31,66 28,75.4 M43,57 Q44,66 44,75.6 M48,57 Q55,64 60,74"/>
<path class="top2 o" style="stroke-width:1.1" d="M3.6,70.4 C16,75.6 30,76.4 40,75 C52,76.4 66,74 76,68 L76.8,70.6 C66,77 52,79 40,77.8 C30,79 16,78.4 3,73 Z"/>
<path class="top o" d="M28,40.6 C27.6,36.6 31.4,34.8 37.8,34.8 C44.2,34.8 48,36.6 48,40.6 L47,55.4 C41,57.4 34,57.4 28.6,55.4 Z"/>
<path class="sh" d="M43.6,35.2 C46.4,36.2 48,38 48,40.6 L47,55.4 C45.6,56 44.2,56.3 42.8,56.5 C44.2,49.6 44.6,42 43.6,35.2 Z"/>
<path class="top2 o" style="stroke-width:1.1" d="M28.6,52 C34.6,54 41.6,54 47.2,52 L47,55.4 C41,57.4 34,57.4 28.6,55.4 Z"/>
''' + neck(4, 0) + '''
<path class="top o" d="M43,38.2 C47.6,34.6 50.6,29 51.4,22.2 L56.2,22.8 C55.8,30.6 52,37.6 45.6,42.8 Z"/>
<path class="skin o" d="M51.4,22.2 C51,17.6 50.4,13.4 49,9.6 L53.4,8.4 C55,12.6 56,17.4 56.2,22.8 Z"/>
<circle class="skin o" cx="50.4" cy="7.4" r="2.8"/>
<path class="l" style="stroke-opacity:.45" d="M60,12 q4,4 3.6,9.4 M64,9 q5,5.6 4.4,12 M6,62 q-3,4 -2.6,8"/>
<!--HEAD-->''', 'data-head="4 0 1" data-kit="face=happy hair=bun"')

# 3. gardener kneeling to plant an azalea tray
arch('gardener', '0 4 96 100', '34 100', '''
<ellipse cx="46" cy="100" rx="40" ry="3" class="sh"/>
<path fill="#7A5A3E" stroke="#2B1D16" stroke-width="1.3" d="M52,95 C56,92.6 64,92.4 70,94.6 C66,97.4 56,97.6 52,95 Z"/>
<path fill="#C8693F" stroke="#2B1D16" stroke-width="1.4" stroke-linejoin="round" d="M66,86 L90,86 L88,98 L68,98 Z"/>
<path fill="#A85730" d="M84,86 L90,86 L88,98 L84.4,98 Z"/>
<g stroke="#2B1D16" stroke-width="1.1" stroke-linejoin="round">
<path fill="#4E8A3A" d="M68,86 C67,80 70.6,76.4 74,78 C76,74 81,74.6 81.6,78.6 C85,77 89.4,79.8 88,86 Z"/>
<circle fill="#E2557E" cx="71.4" cy="79.6" r="2.2"/><circle fill="#F07FA2" cx="77" cy="77" r="2.2"/><circle fill="#E2557E" cx="83" cy="79" r="2.2"/><circle fill="#F7C548" cx="86.2" cy="82.4" r="2"/><circle fill="#F07FA2" cx="74.4" cy="83" r="2"/>
<path fill="#4E8A3A" d="M58,94 C56.6,89.6 58.6,86 61.6,87 C63.6,85 66.6,87.4 65.6,91 C66.6,92.4 66,94 64,94.6 Z"/>
<circle fill="#F07FA2" cx="60" cy="89" r="1.9"/><circle fill="#E2557E" cx="63.8" cy="90.2" r="1.9"/>
</g>
<path class="bottom o" d="M28,78 C22,84 15,90 8,94 L11.4,99 C19,96 27,90.6 34,84.6 Z"/>
<path class="sh" d="M28,78 C22,84 15,90 8,94 L11.4,99 C19,96 27,90.6 34,84.6 Z"/>
<path class="shoe o" d="M4.4,92.4 C6.4,90.6 9.6,91.4 10.8,93.6 L12,99 L3.6,99 C2.6,97 3,94 4.4,92.4 Z"/>
<path class="top o" d="M30.4,52 C27,58 26,64 26.4,70.2 L31.4,70.4 C31.4,65 32.4,60 34.6,56 Z"/>
<path class="sh" d="M30.4,52 C27,58 26,64 26.4,70.2 L31.4,70.4 C31.4,65 32.4,60 34.6,56 Z"/>
<circle class="skin o" cx="29" cy="72.4" r="2.8"/>
<path class="top o" d="M27.6,56 C28.6,51 33,48.4 39,49.4 C45,50.4 48.2,54 47.4,58.6 L44.6,80.6 C38,82.6 30.6,82 25,79.4 Z"/>
<path class="sh" d="M43,50.4 C46,51.8 47.8,54.6 47.4,58.6 L44.6,80.6 C43,81.2 41.4,81.5 39.8,81.6 C42,73 43.6,61 43,50.4 Z"/>
<path class="bottom o" d="M25.8,76 C33,74.6 42,74.6 50,76.4 L50.6,82.6 C42,84 32.6,84.2 25,82.6 Z"/>
<path class="bottom o" d="M44,76.6 C49.6,75.4 54,76.6 56.4,79.6 L57,96.2 L51,96.6 L50.4,84.2 C47,84.8 44.8,83.4 44,76.6 Z"/>
<path class="sh" style="opacity:.1" d="M52.6,76.4 C54.4,77 55.6,78.2 56.4,79.6 L57,96.2 L54.8,96.4 L54.4,80.4 C54,78.8 53.4,77.6 52.6,76.4 Z"/>
<path class="shoe o" d="M50.2,95.4 L57.6,95.4 C60.4,95.8 61.4,98 60.6,99.4 L49.6,99.4 C49,98 49.2,96.4 50.2,95.4 Z"/>
<path class="acc o" style="stroke-width:1.2" d="M27.6,64 C32,62.8 40,63.2 45.4,64.8 L44.6,72 C38.6,73 32,72.6 26.4,71.2 Z"/>
''' + neck(6, 19) + '''
<path class="top2 o" d="M33.2,54 Q38.4,58.4 43.6,54 L44.4,55.4 Q38.4,60.4 32.4,55.4 Z"/>
<path class="top o" d="M44,56.6 C49.4,62 53,69 55.6,77.6 L50.6,79.4 C48.6,72 45.8,66.4 41.6,61.6 Z"/>
<path class="acc o" style="stroke-width:1.1" d="M57.8,88 L61.6,92.8 L59,94.4 L55.6,89.2 Z"/>
<path d="M53.4,80.4 L56.8,88.4" stroke="#2B1D16" stroke-width="3.2" stroke-linecap="round"/>
<path d="M53.4,80.4 L56.8,88.4" stroke="#A0754E" stroke-width="1.7" stroke-linecap="round"/>
<circle class="skin o" cx="53.2" cy="80" r="3"/>
<!--HEAD-->''', 'data-head="6 19 1" data-kit="face=smile hair=crop hat=sunhat"')

# 4. maintenance worker raking leaves, hi-vis vest
arch('maintenance-worker', '0 -8 100 112', '32 100', '''
<ellipse cx="54" cy="100" rx="40" ry="3.2" class="sh"/>
<g stroke="#2B1D16" stroke-width=".9" stroke-linejoin="round">
<path fill="#D9822B" d="M66,99 C64,94 68,90 74,90 C80,88 88,90 90,95 C92,97 91,99 89,99.6 Z"/>
<path fill="#B5452C" d="M70,92 l3,-2.4 l2,3 Z"/><path fill="#E8A53A" d="M78,90 l3.2,-1.6 l1.4,3.2 Z"/><path fill="#8A5A2E" d="M84,93 l2.6,-2 l1.8,2.8 Z"/>
<path fill="#E8A53A" d="M58,98 l3,-1.6 l1.6,2.6 Z"/><path fill="#B5452C" d="M93,98 l2.4,-2 l1.6,2.6 Z"/>
</g>
<path class="bottom o" d="M25.6,64 C25.4,74 25,84 24.6,94.6 L30.6,94.8 C31,85 31.6,75 32.4,65 Z"/>
<path class="sh" d="M25.6,64 C25.4,74 25,84 24.6,94.6 L30.6,94.8 C31,85 31.6,75 32.4,65 Z"/>
<path class="shoe o" d="M23,94 L31,94.2 C33.4,94.6 34,96.8 33.2,98.6 L22,98.6 C21.4,96.8 21.6,94.8 23,94 Z"/>
<path class="bottom o" d="M31.6,64 C33.4,74 35.6,84 37.6,93.6 L43.6,92.6 C41.8,83.6 40.4,73.6 39.8,63.6 Z"/>
<path fill="#E8E8E8" stroke="#2B1D16" stroke-width=".8" d="M34.6,80 L41.4,79.2 L41.8,81.6 L35,82.4 Z"/>
<path class="shoe o" d="M37,93 L44.2,92.2 C47.4,92 48.6,94.4 48,96.8 L37.2,97.6 C36.4,96.2 36.4,94.4 37,93 Z"/>
<path class="top o" d="M24.6,39.4 C29,44 36,48 44.6,50.6 L43.4,55.4 C34,53 27,49 22.4,44.6 Z"/>
<path class="sh" d="M24.6,39.4 C29,44 36,48 44.6,50.6 L43.4,55.4 C34,53 27,49 22.4,44.6 Z"/>
<path class="top o" d="M21.6,41 C21.6,36.5 25.5,34.5 32,34.5 C38.5,34.5 42.6,36.5 43,41 L43.6,66.4 C36.6,68.6 27.4,68.6 21,66.4 Z"/>
<path fill="#CDEB3B" stroke="#2B1D16" stroke-width="1.4" stroke-linejoin="round" d="M22.4,40 C24,36.6 27,35.4 29.4,35.6 L32.4,45 L35.4,35.6 C38,35.4 41.4,36.6 42.6,40 L43.4,66.4 C36.6,68.6 27.4,68.6 21.2,66.4 Z"/>
<path fill="#E8E8E8" stroke="#2B1D16" stroke-width=".8" d="M21.6,54 C28.6,55.6 36.4,55.6 43.2,54 L43.3,57.2 C36.4,58.8 28.6,58.8 21.5,57.2 Z M21.4,61 C28.6,62.6 36.4,62.6 43.4,61 L43.4,64 C36.4,65.6 28.6,65.6 21.3,64 Z"/>
<path class="sh" d="M38,36 C41,37 42.4,38.4 42.6,40 L43.4,66.4 C41.6,67.2 39.8,67.6 38,67.8 C39.4,58 39.4,46 38,36 Z"/>
''' + NECK + '''
<path class="top2 o" d="M27.2,35 Q32.4,39.4 37.6,35 L38.4,36.4 Q32.4,41.4 26.4,36.4 Z"/>
<path d="M42,45.4 L86,97" stroke="#2B1D16" stroke-width="3.6" stroke-linecap="round"/>
<path d="M42,45.4 L86,97" stroke="#C99A62" stroke-width="2" stroke-linecap="round"/>
<path fill="none" stroke="#2B1D16" stroke-width="3.4" stroke-linecap="round" d="M77,99 L95,93"/>
<path fill="none" stroke="#7A7F86" stroke-width="1.8" stroke-linecap="round" d="M77,99 L95,93"/>
<circle class="skin o" cx="45.8" cy="50" r="2.9"/>
<path class="top o" d="M38.4,38.2 C44,42 50,50 54.4,58.4 L50,61 C46.4,54 42,47.6 36.6,42.4 Z"/>
<circle class="skin o" cx="55.4" cy="61.6" r="3"/>
<!--HEAD-->''', 'data-head="0 0 1" data-kit="face=neutral hair=crop hat=cap"')

# 5. chess game: two seated players at a stone table (second player mirrored, own colour slots)
def seated(head_marker):
    return '''
<path fill="#8A8A86" stroke="#2B1D16" stroke-width="1.4" d="M16,78 L32,78 L31,82 L17,82 Z M18.6,82 L18,99 M29.4,82 L30,99"/>
<path class="bottom o" d="M30,74 C34,74 40,74.4 44,75 L44,80.6 C40,80.6 34,80.6 29,80 Z"/>
<path class="bottom o" d="M39.6,75.4 L45,75 C45.6,82 46,89 46,95.4 L40.6,95.6 C40.6,89 40.2,82 39.6,75.4 Z"/>
<path class="sh" d="M39.6,75.4 L45,75 C45.6,82 46,89 46,95.4 L40.6,95.6 C40.6,89 40.2,82 39.6,75.4 Z"/>
<path class="shoe o" d="M39.6,94.8 L46.6,94.6 C49.6,94.8 50.6,97 49.8,98.8 L39.2,98.8 C38.6,97.4 38.8,95.8 39.6,94.8 Z"/>
<path class="top o" d="M20.4,56.6 C20.4,52.4 24,50.6 29.6,50.6 C35.2,50.6 38.4,52.4 38.8,56.6 L39.4,78 C33,79.6 25.4,79.4 19.6,77.4 Z"/>
<path class="sh" d="M34.6,51 C37.4,52 38.8,54 38.8,56.6 L39.4,78 C37.6,78.6 35.8,78.9 34,79 C35.4,70 35.6,60 34.6,51 Z"/>
<path class="fold" d="M24,70 q3,1.6 6.6,.6"/>
<g transform="translate(-4 16)">''' + NECK + '''</g>
<path class="top2 o" d="M23.2,51 Q28.4,55.4 33.6,51 L34.4,52.4 Q28.4,57.4 22.4,52.4 Z"/>
<path class="top o" d="M35,54 C39.6,57 43.6,61 46.4,65.6 L42.6,68.8 C40,64.6 36.4,61.4 32.6,59 Z"/>
<circle class="skin o" cx="46.4" cy="67.8" r="2.8"/>
''' + head_marker
P2 = '--skin:var(--skin2,#6E432A);--hair:var(--hair2,#8E8E8E);--top:var(--top3,#2F7FA8);--top2:var(--top4,#F5F0E6);--bottom:var(--bottom2,#4A4A52);--shoe:var(--shoe2,#2B1D16);--hat:var(--hat3,#3D4F6E)'
arch('chess-players', '0 6 120 98', '60 100', '''
<ellipse cx="60" cy="100" rx="48" ry="3.2" class="sh"/>
''' + seated('<!--HEAD-->') + '''
<g transform="translate(120 0) scale(-1 1)" style="''' + P2 + '''">''' + seated('<!--HEAD2-->') + '''</g>
<path fill="#B9B3A5" stroke="#2B1D16" stroke-width="1.5" stroke-linejoin="round" d="M54,73 L66,73 L67,99 L53,99 Z"/>
<path fill="#A29C8E" d="M62,73 L66,73 L67,99 L63,99 Z"/>
<path fill="#D8D2C4" stroke="#2B1D16" stroke-width="1.5" stroke-linejoin="round" d="M42,66 L78,66 L80,72 L40,72 Z"/>
<path fill="#B9B3A5" stroke="#2B1D16" stroke-width="1.2" d="M40,72 L80,72 L80,74.4 L40,74.4 Z"/>
<path fill="#F4EEDD" stroke="#2B1D16" stroke-width="1" d="M47,66.4 L73,66.4 L74.4,71.2 L45.6,71.2 Z"/>
<g fill="#2B1D16"><path d="M47,66.4 L50.3,66.4 L50,67.6 L46.6,67.6 Z M53.6,66.4 L56.9,66.4 L56.8,67.6 L53.3,67.6 Z M60.2,66.4 L63.4,66.4 L63.5,67.6 L60.1,67.6 Z M66.8,66.4 L70,66.4 L70.3,67.6 L66.9,67.6 Z"/>
<path d="M50,67.6 L53.3,67.6 L53.1,68.8 L49.6,68.8 Z M56.8,67.6 L60.1,67.6 L60,68.8 L56.5,68.8 Z M63.5,67.6 L66.9,67.6 L67,68.8 L63.4,68.8 Z M70.3,67.6 L73.6,67.6 L74,68.8 L70.6,68.8 Z"/>
<path d="M46.2,68.8 L49.6,68.8 L49.3,70 L45.9,70 Z M53.1,68.8 L56.5,68.8 L56.4,70 L52.9,70 Z M60,68.8 L63.4,68.8 L63.5,70 L60,70 Z M67,68.8 L70.6,68.8 L70.9,70 L67.3,70 Z"/></g>
<g stroke="#2B1D16" stroke-width=".8"><path fill="#F4EEDD" d="M51,66 l1.2,-4.4 l1.2,4.4 Z"/><circle fill="#F4EEDD" cx="52.2" cy="61.2" r="1.2"/><path fill="#2B1D16" d="M66,66 l1.2,-5 l1.2,5 Z"/><circle fill="#2B1D16" cx="67.2" cy="60.6" r="1.3"/><path fill="#2B1D16" d="M70.6,66 l1,-3.4 l1,3.4 Z"/><path fill="#F4EEDD" d="M57,68 l1,-3 l1,3 Z"/></g>
<path class="l" style="stroke-opacity:.5" d="M57.4,57 q2.6,-2.4 5.2,0"/>''', 'data-head="-4 16 1" data-head2="-4 16 1" data-kit="face=neutral hair=bald glasses=square" data-kit2="face=talk hair=crop beard=full"')

# 6. costumed juggler in a top hat and diamond waistcoat
arch('juggler', '0 -40 72 140', '34 100', '''
<ellipse cx="34" cy="100" rx="15" ry="3" class="sh"/>
<defs><clipPath id="jv"><path d="M21.6,41 C21.6,36.5 25.5,34.5 32,34.5 C38.5,34.5 42.6,36.5 43,41 L43.6,66.4 C36.6,68.6 27.4,68.6 21,66.4 Z"/></clipPath></defs>
<path class="bottom o" d="M25,64 C23.6,74 22.4,84 21.6,94.4 L27.6,94.8 C28.6,85 30,75 32,65 Z"/>
<path class="sh" d="M25,64 C23.6,74 22.4,84 21.6,94.4 L27.6,94.8 C28.6,85 30,75 32,65 Z"/>
<path class="shoe o" d="M20,94 L28,94.2 C30.4,94.6 31,96.8 30.2,98.6 L19,98.6 C18.4,96.8 18.6,94.8 20,94 Z"/>
<path class="bottom o" d="M31.6,64 C33.6,74 35.4,84 36.8,93.6 L42.8,92.8 C41.6,83.6 40.6,73.6 40.2,63.6 Z"/>
<path class="shoe o" d="M36.2,93 L43.4,92.2 C46.6,92 47.8,94.4 47.2,96.8 L36.4,97.6 C35.6,96.2 35.6,94.4 36.2,93 Z"/>
<path class="top o" d="M24,38.6 C18.6,40.4 14.6,44.4 12.6,49.6 C12,53 13.6,55.2 16,55.6 L17.4,51 C17,50 17.4,48.6 18.6,47.6 C21.6,45.6 24.6,44 27.6,43.2 Z"/>
<path class="sh" d="M24,38.6 C18.6,40.4 14.6,44.4 12.6,49.6 C12,53 13.6,55.2 16,55.6 L17.4,51 C17,50 17.4,48.6 18.6,47.6 C21.6,45.6 24.6,44 27.6,43.2 Z"/>
<path class="skin o" d="M12.8,50.6 C10.6,46.6 10.6,42.4 12,39 L16.4,40.4 C15.6,43.2 15.8,46 17,48.8 Z"/>
<circle class="skin o" cx="13.8" cy="38" r="2.8"/>
<path class="top o" d="M21.6,41 C21.6,36.5 25.5,34.5 32,34.5 C38.5,34.5 42.6,36.5 43,41 L43.6,66.4 C36.6,68.6 27.4,68.6 21,66.4 Z"/>
<g clip-path="url(#jv)"><g class="top2"><path d="M26,34 L30,40 L26,46 L22,40 Z M38,34 L42,40 L38,46 L34,40 Z M32,46 L36,52 L32,58 L28,52 Z M20,46 L24,52 L20,58 L16,52 Z M44,46 L48,52 L44,58 L40,52 Z M26,58 L30,64 L26,70 L22,64 Z M38,58 L42,64 L38,70 L34,64 Z"/></g>
<path class="sh" d="M37.6,35 C41.4,36.4 43,38.4 43,41 L43.6,66.4 C41.6,67.2 39.6,67.6 37.6,67.8 C39,58 39,46 37.6,35 Z"/></g>
<path class="o" fill="none" d="M21.6,41 C21.6,36.5 25.5,34.5 32,34.5 C38.5,34.5 42.6,36.5 43,41 L43.6,66.4 C36.6,68.6 27.4,68.6 21,66.4 Z"/>
<g class="acc" stroke="#2B1D16" stroke-width=".8"><circle cx="32.4" cy="44" r="1.1"/><circle cx="32.6" cy="51" r="1.1"/><circle cx="32.8" cy="58" r="1.1"/></g>
''' + NECK + '''
<path class="acc o" d="M28,36.6 L32.4,38.6 L36.8,36.4 L37.4,40.4 L32.4,38.8 L27.6,40.6 Z"/>
<path class="top o" d="M39,38.4 C44.6,40.4 48.6,44.4 50.6,49.6 C51.2,53 49.6,55.2 47.2,55.6 L45.8,51 C46.2,50 45.8,48.6 44.6,47.6 C42,45.8 39.4,44.4 36.6,43.4 Z"/>
<path class="skin o" d="M50.4,50.6 C52.6,46.6 52.6,42.4 51.2,39 L46.8,40.4 C47.6,43.2 47.4,46 46.2,48.8 Z"/>
<circle class="skin o" cx="49.4" cy="38" r="2.8"/>
<g stroke="#2B1D16" stroke-width="1.3"><circle fill="#E8457A" cx="16" cy="18" r="3.4"/><circle fill="#F7C548" cx="32" cy="-30" r="3.4"/><circle fill="#3FC1C9" cx="50" cy="12" r="3.4"/></g>
<path fill="none" stroke="#2B1D16" stroke-opacity=".35" stroke-width=".9" stroke-dasharray="2 2" stroke-linecap="round" d="M14,32 C8,10 20,-22 30,-28 M35,-29 C46,-24 54,-4 51,8"/>
<!--HEAD-->''', 'data-head="0 0 1" data-kit="face=happy hair=sidepart hat=tophat beard=moustache"')
print('ok')
