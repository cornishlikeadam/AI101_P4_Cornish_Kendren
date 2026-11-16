import os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'characters'))
AUTH = 'original, hand-authored SVG, Waldo\'s Savannah 2026-11-15'
STYLE = '''<style>
.o{stroke:#2B1D16;stroke-width:1.5;stroke-linejoin:round;stroke-linecap:round}
.l{fill:none;stroke:#2B1D16;stroke-width:1;stroke-linecap:round;stroke-linejoin:round}
.fold{fill:none;stroke:#2B1D16;stroke-opacity:.4;stroke-width:.8;stroke-linecap:round}
.sh{fill:#2B1D16;opacity:.15}.ink{fill:#2B1D16}.wht{fill:#FFFFFF}
.skin{fill:var(--skin,#E0A97E)}.hair{fill:var(--hair,#4A2F1E)}
.hat{fill:var(--hat,#3E8E7E)}.hat2{fill:var(--hat2,#F5F0E6)}
</style>'''
def part(path, kind, body, extra=''):
    name = os.path.basename(path)
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="10 -8 48 52" width="48" height="52" data-anchor="34 44" data-part="{kind}" data-asset="characters/parts/{path}" {extra} data-author="{AUTH}">\n{STYLE}\n{body.strip()}\n</svg>\n'
    open(f'parts/{path}.svg', 'w').write(svg)

HEAD = '''<path class="skin o" d="M23,21 C23,13.5 28,9.5 34,9.5 C40.5,9.5 44.6,14 44.6,21 C44.6,27.6 40.6,32.6 33.6,32.6 C27,32.6 23,28 23,21 Z"/>
<path class="skin o" d="M43.8,20.4 C47.4,20.6 48.2,24.6 44.4,25.6"/>
<path class="sh" style="opacity:.1" d="M40.6,12.4 C43.4,14.4 44.6,17.4 44.6,21 C44.6,27.6 40.6,32.6 33.6,32.6 C38.4,30.4 41,26 41,20.6 C41,17.4 41,14.8 40.6,12.4 Z"/>
<ellipse class="skin o" cx="25.4" cy="22.4" rx="2.3" ry="3.1"/>
<path class="l" d="M25.6,21 q-1,1.4 0,2.8"/>
<circle cx="42.4" cy="25.2" r="1.8" fill="#F08C7A" opacity=".45"/>'''
faces = {
 'smile': '''<circle cx="32.6" cy="21" r=".95" class="ink"/><circle cx="41" cy="21" r=".95" class="ink"/>
<path class="l" d="M30.4,17.8 Q32.4,16.9 34.2,17.8 M39.4,17.6 Q41.2,16.8 42.8,17.8"/>
<path class="l" d="M36.4,27.2 Q39.6,29.6 42.2,26.8"/>''',
 'neutral': '''<circle cx="32.6" cy="21.2" r=".95" class="ink"/><circle cx="41" cy="21.2" r=".95" class="ink"/>
<path class="l" d="M30.4,18.4 L34.2,18 M39.4,18 L42.8,18.2"/>
<path class="l" d="M37.6,27.6 L41.6,27.2"/>''',
 'talk': '''<circle cx="32.6" cy="20.8" r=".95" class="ink"/><circle cx="41" cy="20.8" r=".95" class="ink"/>
<path class="l" d="M30.4,16.8 Q32.4,15.6 34.2,16.6 M39.4,16.4 Q41.2,15.4 42.8,16.6"/>
<path class="ink" d="M37.2,26.6 Q40,26 42.2,26.4 Q41.6,30 39.4,30 Q37.6,29.8 37.2,26.6 Z"/>
<path fill="#E07A7A" d="M38.4,28.8 Q39.8,28 41,28.8 Q40.4,29.8 39.4,29.8 Q38.8,29.6 38.4,28.8 Z"/>''',
 'happy': '''<path class="l" style="stroke-width:1.2" d="M31.2,21.6 q1.4,-1.8 2.8,0 M39.6,21.6 q1.4,-1.8 2.8,0"/>
<path class="l" d="M30.4,17.4 Q32.4,16.4 34.2,17.4 M39.4,17.2 Q41.2,16.4 42.8,17.4"/>
<path class="wht o" style="stroke-width:1.1" d="M36,26.2 Q39.4,26.8 43,25.8 Q42,30.6 39.2,30.4 Q36.6,30 36,26.2 Z"/>''',
 'surprised': '''<circle cx="32.6" cy="21" r="1.5" class="wht o" style="stroke-width:.8"/><circle cx="41" cy="21" r="1.5" class="wht o" style="stroke-width:.8"/>
<circle cx="32.9" cy="21.1" r=".7" class="ink"/><circle cx="41.3" cy="21.1" r=".7" class="ink"/>
<path class="l" d="M30.2,16.2 Q32.4,14.8 34.4,16 M39.2,15.8 Q41.2,14.6 43,16"/>
<ellipse class="ink" cx="39.6" cy="28" rx="1.3" ry="1.6"/>''',
}
for k, v in faces.items():
    part(f'faces/{k}', 'face', HEAD + '\n' + v)

# hair: back layer is drawn before the face, front layer after it
hair = {
 'crop': ('', '''<path class="hair o" d="M22.6,20.6 C21.4,13 26,8.2 33.4,8 C40.2,7.8 45.2,11.4 45.2,16.2 C42.6,15 39.6,14.6 37,15.4 C35,16.2 32.4,15.6 30.8,14.4 C29.4,16.4 27.6,18 26.6,20.2 C26,22 25.2,23 24.2,23.6 C23.4,22.8 22.8,21.8 22.6,20.6 Z"/>
<path class="fold" d="M28,11.2 q3,-1.6 6.4,-1 M36.4,10.4 q3.4,.4 5.6,2.8 M25,16.4 q1,-2.6 3,-4"/>''', 'all'),
 'sidepart': ('', '''<path class="hair o" d="M22.6,21 C21,12.6 26.4,7.4 34,7.6 C41,7.8 46,11.6 45.6,17.4 C44.4,14.6 41.4,12.8 37.8,12.8 C34.6,13 32,15 29.2,15.2 C28.4,17.4 27.4,19.6 26.4,21.6 C25.8,23 25,23.8 24,24 C23.2,23.2 22.8,22.2 22.6,21 Z"/>
<path class="fold" d="M37.8,12.8 C35,10.6 31,10.4 27.6,12 M41,10.2 q2.6,1.4 3.8,3.8"/>''', 'all'),
 'bob': ('''<path class="hair o" d="M23.4,13.6 C19,19 18.6,28 21.4,34.6 L30.6,34.6 C27.6,30.6 26.8,26 27.2,21.6 Z"/>''',
 '''<path class="hair o" d="M22.4,21 C21.2,12.4 26.6,7.6 34,7.6 C41.4,7.6 46.2,12 45.8,18.4 C43,17.6 40.6,17.4 38.2,17.6 L37.6,15.4 L36.8,17.8 C34,18 31.4,17.4 29.6,15.6 C28.6,18.6 27.2,21.4 25.8,23 C24.6,24 23.4,23.6 22.4,21 Z"/>
<path class="fold" d="M28,11.4 q4,-2 8.6,-1.2 M24.6,18 q.6,-3 2.6,-5"/>''', 'cap sunhat boater beanie bobble bucket fedora'),
 'long': ('''<path class="hair o" d="M23,13 C17.6,21 17,33 19.4,44.6 C22.6,46.4 26.8,46.2 29.6,44.6 C28,38 27.2,30 28.4,22.6 Z"/>
<path class="fold" d="M21.6,26 q-.8,8 .4,15 M24.6,30 q-.4,6 .8,12"/>''',
 '''<path class="hair o" d="M22.6,21.4 C21,12.6 26.8,7.4 34.4,7.6 C41.4,7.8 46.4,12 45.8,18 C42.8,15.4 39.2,14 35.6,14.4 C32.4,14.8 30,16.6 28.4,19.4 C27.4,21.6 26.4,23.4 25,24.4 C23.8,24 23,22.8 22.6,21.4 Z"/>
<path class="fold" d="M35.6,14.4 C33,11 29,10.4 26,12.4 M39.6,10 q3.2,1.6 4.6,4.6"/>''', 'all'),
 'bun': ('''<circle class="hair o" cx="27.4" cy="7.6" r="5.2"/><path class="fold" d="M24.6,6.4 q2.6,-2.4 5.6,-.4 M25.2,9.6 q2.4,1 4.6,-.4"/>''',
 '''<path class="hair o" d="M22.6,20.6 C21.6,12.6 27,8.6 34,8.6 C41,8.6 45.4,12.8 45,17.4 C42.4,14.6 38,13.2 33.6,13.6 C30.4,14 28.2,16 27,19 C26.4,21 25.4,22.6 24.2,23.2 C23.4,22.6 22.8,21.6 22.6,20.6 Z"/>
<path class="fold" d="M33.6,13.6 C31,11.4 28,11.4 25.4,13.4 M38.4,10 q3.4,.8 5,3.6"/>''', 'sunhat headwrap'),
 'afro': ('', '''<path class="hair o" d="M20.6,24 C15.6,20 15.4,10 21,4.4 C25.6,-.6 33.6,-2 40.4,.6 C47,3.2 50,9.6 47.6,16 C46.6,18.4 45.6,19 44.8,17.8 C42.6,14.6 38.4,13.2 34.6,13.6 C31,14 28.2,15.8 27,18.6 C26.2,20.6 25.4,22.4 24.4,23.8 C23.2,25 21.8,25 20.6,24 Z"/>
<path class="fold" style="stroke-opacity:.55" d="M22,10 q1.4,-1.2 2.6,0 M27.6,4.4 q1.4,-1.2 2.6,0 M34.6,2.8 q1.4,-1.2 2.6,0 M41.2,5 q1.4,-1.2 2.6,0 M45,10.4 q1.4,-1.2 2.6,0 M19.6,16.6 q1.4,-1.2 2.6,0 M31,8.6 q1.4,-1.2 2.6,0 M38.4,9.6 q1.4,-1.2 2.6,0 M24.8,13.6 q1.4,-1.2 2.6,0"/>''', 'none'),
 'ponytail': ('''<path class="hair o" d="M23.4,14 C17,14 14.6,20 15.4,27 C16,31 18,34 17.6,38 C21,35.6 22,31 21.4,27 C21,23 22.4,19 24.8,17.4 Z"/>
<path class="hat o" d="M21.4,15.4 L24.6,14.4 L25.4,17.8 L22.4,18.8 Z"/>''',
 '''<path class="hair o" d="M22.6,20.8 C21.4,12.6 26.8,8.2 34,8.2 C41,8.2 45.4,12.2 45.2,16.6 C40.8,14.4 34.4,13.6 29.8,15 C27.8,16.6 26.6,19.2 25.8,21.4 C25.2,23 24.4,23.6 23.6,23.4 C23,22.6 22.7,21.8 22.6,20.8 Z"/>
<path class="fold" d="M29.8,15 C28,12.6 25.6,12.4 23.6,14 M33.6,11 q4.4,-.6 8.4,1.8"/>''', 'cap visor sunhat bucket'),
 'bald': ('', '''<path class="hair o" d="M23,16.8 C21.4,20 21.8,24.6 23.8,27.6 C24.8,24.8 25.2,21.6 24.8,18 C24.2,17.4 23.6,17 23,16.8 Z"/>
<path fill="none" stroke="#FFFFFF" stroke-opacity=".55" stroke-width="1.4" stroke-linecap="round" d="M30.4,12.4 q3.4,-1.8 6.6,-.8"/>''', 'all'),
 'locs': ('''<g fill="none" stroke-linecap="round"><path stroke="#2B1D16" stroke-width="4.6" d="M24.4,12.6 L19.6,37 M27.6,10.4 L24,40 M22,16.4 L17.4,33.4 M30.6,10 L28.6,38.6"/>
<path stroke="var(--hair,#4A2F1E)" stroke-width="2.8" d="M24.4,12.6 L19.6,37 M27.6,10.4 L24,40 M22,16.4 L17.4,33.4 M30.6,10 L28.6,38.6"/></g>''',
 '''<path class="hair o" d="M22.6,21 C21.4,12.4 27,7.6 34.2,7.8 C41.2,8 45.8,12 45.4,17 C43.4,15.2 41.2,14.6 39,15.2 C37,13.6 34,13.4 31.6,14.8 C29.6,15.6 28.4,17.4 27.6,19.4 C26.8,21.4 25.4,23.4 24,23.6 C23.2,22.8 22.8,22 22.6,21 Z"/>
<path class="fold" style="stroke-opacity:.55" d="M27.4,10.6 L26,16.6 M31.4,9 L30.6,14.4 M35.6,8.6 L35.4,13.8 M39.6,9.4 L40,14.6 M43,11.6 L43.6,15.6"/>''', 'headwrap beanie bucket'),
 'curly': ('', '''<path class="hair o" d="M22.8,21.4 C20.6,20.4 20.4,17.4 22,16 C20.8,13.6 22.4,11 24.8,11 C25,8.4 27.8,6.8 30.2,7.8 C31.6,5.8 35,5.6 36.6,7.4 C38.8,6.2 41.8,7.4 42.4,9.8 C44.8,10.2 46.2,12.6 45.4,14.8 C46.4,16.6 45.2,18.4 43.6,18 C41.6,15.2 37.6,14.2 34.2,15.2 C31.6,15.8 29.4,16.4 28,18.6 C27.2,20.6 26.2,22.6 24.8,23 C23.8,22.8 23.2,22.2 22.8,21.4 Z"/>
<path class="fold" style="stroke-opacity:.55" d="M26.4,12.6 q1.2,-1.4 2.4,0 M32,10.4 q1.2,-1.4 2.4,0 M38,11 q1.2,-1.4 2.4,0 M23.6,17 q1.2,-1.4 2.4,0"/>''', 'cap beanie bobble bucket fedora'),
}
for k, (back, front, hats) in hair.items():
    body = (f'<!--back-->\n{back}\n<!--/back-->\n' if back else '') + f'<!--front-->\n{front}\n<!--/front-->'
    part(f'hair/{k}', 'hair', body, f'data-hats="{hats}"')

hats = {
 'cap': ('', '''<path class="hat o" d="M22,15.6 C21.6,8 26.6,4.4 33.4,4.4 C40.4,4.4 45.2,8.4 45.6,15 Z"/>
<path class="sh" d="M38.6,5.4 C42.8,7 45.4,10.4 45.6,15 L41.6,15.2 C41.6,11.2 40.6,8 38.6,5.4 Z"/>
<path class="fold" d="M33.4,4.6 C31,8 30.4,11.6 30.6,15.4 M33.6,4.6 C37,8 38.4,11.6 38.8,15.2"/>
<path class="hat o" d="M42,14.4 C46,13.4 51.4,13.8 53.8,15.6 C52.8,17.2 48.4,17.4 44.4,16.8 C43,16.4 42.2,15.6 42,14.4 Z"/>
<circle class="hat o" cx="33.5" cy="4.4" r="1.2" style="stroke-width:1"/>'''),
 'sunhat': ('', '''<path class="hat o" d="M14,16.6 C16,12.4 26,11 34,11 C42,11 52,12.6 54,16.6 C52,19.6 44,19.2 34,18.8 C24,19.2 16,19.8 14,16.6 Z"/>
<path class="hat o" d="M24.4,13.8 C24.4,6.6 28.6,3.6 34,3.6 C39.4,3.6 43.6,6.6 43.6,13.8 C38,15.2 30,15.2 24.4,13.8 Z"/>
<path class="hat2 o" style="stroke-width:1.1" d="M24.5,10.8 C30.6,12.2 37.4,12.2 43.5,10.8 L43.6,13.8 C37.6,15.2 30.4,15.2 24.4,13.8 Z"/>
<path class="sh" d="M44,13 C48,13.4 51.6,14.6 53.4,16.4 C50.6,18.6 46,18.6 42,18.4 Z"/>
<path class="fold" d="M18.4,16.4 q8,-2.8 15.6,-2.6 M34,13.8 q9,-.2 16,2.2"/>'''),
 'boater': ('', '''<path class="hat o" style="fill:var(--hat,#E8C872)" d="M18,15.8 C20,13.6 27,12.6 34,12.6 C41,12.6 48,13.6 50,15.8 C48,18 41,18.6 34,18.6 C27,18.6 20,18 18,15.8 Z"/>
<path class="hat o" style="fill:var(--hat,#E8C872)" d="M24.8,15 L25.4,6.8 C30,5.8 38,5.8 42.6,6.8 L43.2,15 C37,16 31,16 24.8,15 Z"/>
<path class="hat2 o" style="stroke-width:1.1;fill:var(--hat2,#2F5D50)" d="M25.2,10.4 C30.6,9.6 37.4,9.6 42.8,10.4 L43,13.2 C37.2,12.4 30.8,12.4 25,13.2 Z"/>
<path class="fold" d="M25.6,7 C30,7.8 38,7.8 42.4,7 M20.6,16.4 q13,2 27,-.6"/>
<path class="sh" d="M40,6.4 L42.6,6.8 L43.2,15 L40.6,15.4 Z"/>'''),
 'beanie': ('', '''<path class="hat o" d="M22.2,17.4 C21.4,7.8 26.8,3.6 34,3.6 C41.2,3.6 46.4,7.8 45.8,17 Z"/>
<path class="sh" d="M39.6,4.8 C44,6.6 46.2,10.6 45.8,15 L42,15 C42,11 41.2,7.6 39.6,4.8 Z"/>
<path class="hat o" d="M21.6,13.6 Q34,11.4 46.4,13.2 Q47.4,15.6 46.4,17.8 Q34,16 21.6,18.2 Q20.8,15.8 21.6,13.6 Z"/>
<path class="fold" style="stroke-opacity:.5" d="M25,13 L25,17 M28.4,12.4 L28.4,16.4 M31.8,12 L31.8,16 M35.2,11.9 L35.2,15.9 M38.6,12 L38.6,16 M42,12.2 L42,16.2 M45.2,12.4 L45.2,16.6"/>'''),
 'bobble': ('data-traits="bobble"', '''<path class="hat o" d="M22.2,17.4 C21.4,7.8 26.8,3.6 34,3.6 C41.2,3.6 46.4,7.8 45.8,17 Z"/>
<path class="sh" d="M39.6,4.8 C44,6.6 46.2,10.6 45.8,15 L42,15 C42,11 41.2,7.6 39.6,4.8 Z"/>
<path class="hat o" d="M21.6,13.6 Q34,11.4 46.4,13.2 Q47.4,15.6 46.4,17.8 Q34,16 21.6,18.2 Q20.8,15.8 21.6,13.6 Z"/>
<path class="fold" style="stroke-opacity:.5" d="M25,13 L25,17 M28.4,12.4 L28.4,16.4 M31.8,12 L31.8,16 M35.2,11.9 L35.2,15.9 M38.6,12 L38.6,16 M42,12.2 L42,16.2 M45.2,12.4 L45.2,16.6"/>
<path class="hat2 o" d="M33.6,-4.6 c1.6,-.8 3.4,0 3.8,1.4 c1.6,0 2.6,1.8 2,3.2 c1,1 .8,3 -.8,3.6 c-.4,1.6 -2.2,2.2 -3.4,1.4 c-1.2,1 -3.2,.8 -3.8,-.6 c-1.6,0 -2.6,-1.6 -2,-3 c-1,-1.2 -.4,-3 1,-3.4 c.4,-1.2 1.8,-1.8 3.2,-1.6 Z"/>'''),
 'bucket': ('', '''<path class="hat o" d="M23.4,13.6 C23.6,6.4 28,3.6 34,3.6 C40,3.6 44.4,6.4 44.6,13.6 Z"/>
<path class="hat o" d="M20.6,12.8 C28,11.2 40,11.2 47.4,12.8 L50.4,19.2 C40,17 28,17 17.6,19.4 Z"/>
<path class="sh" d="M44.6,12.4 L47.4,12.8 L50.4,19.2 L46.6,18.4 Z"/>
<path class="fold" style="stroke-dasharray:1.4 1.2" d="M21.2,15.4 C29,14 39,14 47.8,15.2 M24,9.6 C30,8.4 38,8.4 44,9.6"/>'''),
 'fedora': ('', '''<path class="hat o" d="M17.4,15.6 C22,13 46,13 50.6,15.2 C49.6,17.6 46,17.2 34,16.6 C22,17.2 18.4,17.8 17.4,15.6 Z"/>
<path class="hat o" d="M24.6,14.2 L25.2,6.4 C27,3.8 30,4.8 33.8,3.6 C37.6,4.8 40.8,3.8 42.6,6.4 L43.4,14.2 Z"/>
<path class="hat2 o" style="stroke-width:1.1" d="M24.8,11.2 L43.2,11.2 L43.4,14.2 L24.6,14.2 Z"/>
<path class="fold" d="M30.2,5.6 Q33.8,8.4 37.4,5.6"/>
<path class="sh" d="M40,5 C41.4,5.2 42,5.6 42.6,6.4 L43.4,14.2 L40.6,14.2 Z"/>'''),
 'headwrap': ('', '''<path class="hat o" d="M21.8,19.6 C19.8,10.6 25.4,4 34,4 C42.6,4 47,9.6 46,16.8 C41,14.4 30,14.6 24.6,20.6 C23.6,21 22.4,20.6 21.8,19.6 Z"/>
<path class="hat o" d="M36.6,5.4 C37.6,.6 43.4,-.4 44.6,3 C45.4,5.6 41.6,7.6 38.2,7 Z"/>
<path class="fold" d="M24.4,15.4 C30,11.6 38,10.6 45.6,12.4 M23,11.4 C28,7.8 34,7 39.6,7.6"/>
<g class="hat2"><circle cx="28" cy="10" r="1"/><circle cx="33" cy="12" r="1"/><circle cx="39" cy="10.2" r="1"/><circle cx="42.6" cy="14" r="1"/><circle cx="26.6" cy="15.6" r="1"/><circle cx="33.6" cy="6.6" r="1"/></g>'''),
}
for k, (extra, body) in hats.items():
    part(f'hats/{k}', 'hat', body, extra)

glasses = {
 'round': ('data-traits="glasses"', '''<circle cx="32.4" cy="21" r="3.5" fill="#FFFFFF" fill-opacity=".3" stroke="#2B1D16" stroke-width="1.25"/>
<circle cx="40.8" cy="21" r="3.3" fill="#FFFFFF" fill-opacity=".3" stroke="#2B1D16" stroke-width="1.25"/>
<path class="l" d="M35.9,20.6 Q36.7,19.6 37.5,20.6 M28.9,20.4 L26.6,21.4"/>'''),
 'square': ('', '''<rect x="28.6" y="18.6" width="7.2" height="4.8" rx="1.4" fill="#FFFFFF" fill-opacity=".3" stroke="#2B1D16" stroke-width="1.25"/>
<rect x="37.6" y="18.6" width="6.4" height="4.8" rx="1.4" fill="#FFFFFF" fill-opacity=".3" stroke="#2B1D16" stroke-width="1.25"/>
<path class="l" d="M35.8,20.4 L37.6,20.4 M28.6,20.2 L26.4,21.2"/>'''),
 'sun': ('', '''<path fill="#2B1D16" stroke="#2B1D16" stroke-width="1.1" stroke-linejoin="round" d="M28.4,18.8 L35.8,18.8 L35.4,22.2 C35,23.8 30,24 29,22.4 Z M37.6,18.8 L44.2,18.8 L44,22 C43.6,23.6 39,23.8 38,22.2 Z"/>
<path class="l" d="M35.8,19.6 L37.6,19.6 M28.4,19.4 L26.2,20.6"/><path stroke="#FFFFFF" stroke-opacity=".6" stroke-width=".8" stroke-linecap="round" d="M30.2,20 L32,20 M39.2,20 L40.8,20"/>'''),
}
for k, (extra, body) in glasses.items():
    part(f'glasses/{k}', 'glasses', body, extra)

beards = {
 'full': '''<path class="hair o" d="M26.8,24.8 C27,30 30,34.4 35,34.6 C40.4,34.8 44.2,31 44.6,26 C42.6,27.6 41,28.4 39.4,27.6 C37.6,26.8 35.6,27.2 34.6,28.6 C32,28.6 29.8,27.4 28.2,24.6 Z"/>
<path class="skin" d="M37,29.6 Q39.6,31 42,29.4 Q40.6,31.2 39.4,31.2 Q37.8,31 37,29.6 Z"/><path class="l" d="M37,29.6 Q39.6,31 42,29.4"/>
<path class="fold" d="M31,30.4 q1.4,1.6 3,2 M41.6,31.6 q-1,1.2 -2.4,1.6"/>''',
 'moustache': '''<path class="hair o" style="stroke-width:1.1" d="M36,26.6 C37.4,25 39.8,25 40.6,26.2 C41.6,25 43.6,25.2 44.6,26.8 C43.4,28.2 41.6,28.4 40.6,27.6 C39.2,28.6 37,28.4 36,26.6 Z"/>''',
}
for k, v in beards.items():
    part(f'beards/{k}', 'beard', v)
print('parts written')
