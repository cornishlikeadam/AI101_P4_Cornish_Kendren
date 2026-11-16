import os, math, random
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'props'))
AUTH = "original, hand-authored SVG, Waldo's Savannah 2026-11-15"
INK = '#2B1D16'
def w(path, vb, anchor, body, extra=''):
    W, H = vb.split()[2:]
    open(path + '.svg', 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{W}" height="{H}" data-anchor="{anchor}" data-asset="props/{path}" {extra} data-author="{AUTH}">\n{body.strip()}\n</svg>\n')
f = lambda v: round(v, 1)

# Sabal palmetto: fan fronds radiating from a crown; frond geometry is hand-specified (angle, length, droop)
fronds = [(-160, 62, .5), (-140, 70, .3), (-118, 66, .1), (-96, 60, 0), (-74, 64, -.1), (-52, 70, -.25), (-28, 64, -.45), (-180+8, 54, .7), (-6, 54, -.65), (-128, 46, .2), (-64, 48, -.2), (-100, 40, 0)]
cx, cy = 80, 70
def frond(a, L, droop, fill):
    r = math.radians(a); L = L * 1.5
    tx, ty = cx + math.cos(r) * L, cy + math.sin(r) * L + abs(droop) * 26 + (16 if abs(math.cos(r)) > .6 else 0)
    # fan blade: a wedge from the crown to the tip with a jagged leaflet edge
    nx, ny = -math.sin(r), math.cos(r)
    spread = L * 0.32
    lx, ly = tx + nx * spread, ty + ny * spread
    rx, ry = tx - nx * spread, ty - ny * spread
    d = f'M{cx},{cy} Q{f((cx+lx)/2 + nx*4)},{f((cy+ly)/2 + ny*4 - 6)} {f(lx)},{f(ly)} '
    n = 7
    for i in range(1, n + 1):
        t = i / n
        px, py = lx + (rx - lx) * t, ly + (ry - ly) * t
        mx, my = lx + (rx - lx) * (t - .5 / n), ly + (ry - ly) * (t - .5 / n)
        d += f'L{f(mx + math.cos(r) * 9)},{f(my + math.sin(r) * 9 + 3)} L{f(px)},{f(py)} '
    d += f'Q{f((cx+rx)/2 - nx*4)},{f((cy+ry)/2 - ny*4 - 6)} {cx},{cy} Z'
    ribs = ''.join(f'M{cx},{cy} L{f(lx + (rx-lx)*t + math.cos(r)*4)},{f(ly + (ry-ly)*t + math.sin(r)*4)} ' for t in (.2, .4, .6, .8))
    return f'<path fill="{fill}" stroke="{INK}" stroke-width="1.4" stroke-linejoin="round" d="{d}"/><path fill="none" stroke="#1F3A22" stroke-opacity=".45" stroke-width=".9" d="{ribs}"/>'
back = ''.join(frond(a, L, dr, '#3F6B3A') for a, L, dr in fronds[:9])
front = ''.join(frond(a, L, dr, '#5C9A48') for a, L, dr in fronds[9:])
boots = ''.join(f'<path d="M{f(73+ (i%2)*3)},{f(96+i*13)} l7,-6 l7,6" fill="none" stroke="#5A4232" stroke-width="1.1"/>' for i in range(10))
w('vegetation/palmetto', '0 -56 220 356', '110 296', f'''<g transform="translate(30 0)">
<ellipse cx="86" cy="295" rx="30" ry="5" fill="{INK}" opacity=".16"/>
<path fill="#9C8466" stroke="{INK}" stroke-width="1.8" stroke-linejoin="round" d="M72,80 C74,140 70,220 69,294 L91,294 C90,220 87,140 89,80 Z"/>
<path fill="#7F6A52" d="M84,80 C86,140 89,220 91,294 L84,294 C84,220 83,140 82,80 Z"/>
<g fill="#B39C7C" stroke="{INK}" stroke-width=".9" stroke-linejoin="round">{''.join(f'<path d="M{f(71.4+(i%2))},{f(88+i*11)} L80,{f(81+i*11)} L{f(89.6-(i%2))},{f(88+i*11)} L80,{f(94+i*11)} Z"/>' for i in range(9))}</g>
<path fill="none" stroke="#5A4232" stroke-width=".8" stroke-opacity=".6" d="M73,190 h16 M72.6,214 h17 M72.2,238 h17.6 M71.8,262 h18"/>
{back}
<path fill="#7B5A3A" stroke="{INK}" stroke-width="1.2" d="M72,76 C74,68 86,68 88,76 C86,84 74,84 72,76 Z"/>
{front}</g>
''', 'data-layer="world"')

# Hedge (foreground screen); clipped box hedge with leaf scallops on top
random.seed(5)
top = 'M0,30 '
x = 0
while x < 240:
    s = 8 + random.random() * 7
    top += f'A{f(s*.6)},{f(s*.6)} 0 0,1 {f(min(240, x+s))},{f(26 + random.random()*6)} '
    x += s
marks = ''.join(f'M{f(random.random()*232+4)},{f(36+random.random()*30)} q2,-2.4 4,0 ' for _ in range(60))
lights = ''.join(f'M{f(random.random()*232+4)},{f(30+random.random()*10)} q2,-2.4 4,0 ' for _ in range(26))
w('vegetation/hedge', '0 0 240 80', '120 76', f'''
<ellipse cx="124" cy="76" rx="122" ry="4" fill="{INK}" opacity=".16"/>
<path fill="#3E6E37" stroke="{INK}" stroke-width="1.6" stroke-linejoin="round" d="{top} L240,74 Q120,78 0,74 Z"/>
<path fill="#2F5934" d="M0,52 Q120,58 240,52 L240,74 Q120,78 0,74 Z" opacity=".7"/>
<path fill="none" stroke="#1F3A22" stroke-opacity=".5" stroke-width="1.1" stroke-linecap="round" d="{marks}"/>
<path fill="none" stroke="#79A856" stroke-width="1.2" stroke-linecap="round" d="{lights}"/>
''')

# Market stall: awning in vertical stripes (two colour slots), table, goods by kind
GOODS = {
 'peaches': ''.join(f'<circle cx="{f(22+i*7.2 + (j%2)*3.6)}" cy="{f(60 - j*4)}" r="3.4" fill="{["#F2A65A","#F08C5A","#F7B86A"][(i+j)%3]}" stroke="{INK}" stroke-width=".9"/>' for j in range(3) for i in range(9 - j)) +
   '<path fill="#C99A62" stroke="#2B1D16" stroke-width="1.2" d="M86,56 L104,56 L102,66 L88,66 Z"/>' + ''.join(f'<circle cx="{f(89+i*4.4)}" cy="54" r="2.8" fill="#F08C5A" stroke="#2B1D16" stroke-width=".8"/>' for i in range(4)),
 'flowers': ''.join(f'<path d="M{f(20+i*9)},64 l0,-10" stroke="#3F6B3A" stroke-width="1.4"/><circle cx="{f(20+i*9)}" cy="52" r="4" fill="{["#E2557E","#F7C548","#F07FA2","#FFFFFF","#7D5BA6"][i%5]}" stroke="#2B1D16" stroke-width=".9"/><circle cx="{f(20+i*9)}" cy="52" r="1.3" fill="#F2A65A"/>' for i in range(10)) +
   ''.join(f'<path fill="#C8693F" stroke="#2B1D16" stroke-width="1" d="M{18+i*20},62 L{30+i*20},62 L{28+i*20},68 L{20+i*20},68 Z"/>' for i in range(5)),
 'honey': ''.join(f'<path fill="#E8A53A" stroke="#2B1D16" stroke-width="1" d="M{f(20+i*8.6)},{f(66-(i%2)*0)} L{f(20+i*8.6)},{f(55)} Q{f(23.2+i*8.6)},{f(52)} {f(26.4+i*8.6)},{f(55)} L{f(26.4+i*8.6)},66 Z"/><rect x="{f(20.4+i*8.6)}" y="51" width="5.6" height="3" fill="{["#F5F0E6","#C73E3A"][i%2]}" stroke="#2B1D16" stroke-width=".8"/><rect x="{f(21+i*8.6)}" y="58" width="4.4" height="4" fill="#F5F0E6" opacity=".85"/>' for i in range(10)),
}
for kind, goods in GOODS.items():
    stripes = ''.join(f'<path class="aw2" d="M{8+i*16},14 L{16+i*16},14 L{16+i*16},30 L{8+i*16},30 Z"/>' for i in range(7))
    scal = ''.join(f'<path class="{["aw","aw2"][i%2]}" stroke="{INK}" stroke-width="1.2" d="M{f(i*8)},30 L{f(i*8+8)},30 Q{f(i*8+4)},37 {f(i*8)},30 Z"/>' for i in range(15))
    w(f'market/stall-{kind}', '-4 0 128 100', '60 98', f'''
<style>.aw{{fill:var(--awn,#2F7FA8)}}.aw2{{fill:var(--awn2,#F5F0E6)}}.cloth{{fill:var(--cloth,#F2D55C)}}</style>
<ellipse cx="62" cy="97" rx="62" ry="4" fill="{INK}" opacity=".16"/>
<path fill="none" stroke="{INK}" stroke-width="4.2" stroke-linecap="round" d="M6,30 L6,96 M114,30 L114,96"/>
<path fill="none" stroke="#C9C2B2" stroke-width="2.2" stroke-linecap="round" d="M6,30 L6,96 M114,30 L114,96"/>
<path class="cloth" stroke="{INK}" stroke-width="1.5" stroke-linejoin="round" d="M10,66 L110,66 L112,92 L8,92 Z"/>
<path fill="{INK}" opacity=".14" d="M80,66 L110,66 L112,92 L82,92 Z"/>
<path fill="none" stroke="{INK}" stroke-opacity=".35" stroke-width=".8" d="M30,68 L29,90 M56,68 L56,90 M82,68 L83,90"/>
<path fill="#B98A5E" stroke="{INK}" stroke-width="1.4" d="M6,64 L114,64 L114,68 L6,68 Z"/>
{goods}
<path class="aw" stroke="{INK}" stroke-width="1.6" stroke-linejoin="round" d="M2,30 L10,6 L110,6 L118,30 Z"/>
<g>{stripes}</g>
<path fill="none" stroke="{INK}" stroke-width="1.6" stroke-linejoin="round" d="M2,30 L10,6 L110,6 L118,30 Z"/>
{scal}
<path fill="{INK}" opacity=".12" d="M86,6 L110,6 L118,30 L92,30 Z"/>
''', f'data-slots="awn awn2 cloth"')

# Cafe table with an umbrella and two chairs
w('furniture/cafe-table', '0 -6 96 106', '48 98', f'''
<style>.umb{{fill:var(--umb,#2F5D50)}}.umb2{{fill:var(--umb2,#F5F0E6)}}</style>
<ellipse cx="50" cy="97" rx="40" ry="4" fill="{INK}" opacity=".16"/>
<g fill="none" stroke="{INK}" stroke-width="3.6" stroke-linecap="round"><path d="M14,70 L14,96 M26,72 L24,96 M14,70 L26,72 M15,58 L14,70"/><path d="M82,70 L82,96 M70,72 L72,96 M82,70 L70,72 M81,58 L82,70"/></g>
<g fill="none" stroke="#3D4F6E" stroke-width="1.8" stroke-linecap="round"><path d="M14,70 L14,96 M26,72 L24,96 M14,70 L26,72 M15,58 L14,70"/><path d="M82,70 L82,96 M70,72 L72,96 M82,70 L70,72 M81,58 L82,70"/></g>
<path fill="none" stroke="{INK}" stroke-width="4" stroke-linecap="round" d="M48,14 L48,96 M38,96 L58,96"/>
<path fill="none" stroke="#C9C2B2" stroke-width="2" stroke-linecap="round" d="M48,14 L48,96 M38,96 L58,96"/>
<ellipse cx="48" cy="66" rx="22" ry="5" fill="#F4F1E8" stroke="{INK}" stroke-width="1.5"/>
<path fill="#F4F1E8" stroke="{INK}" stroke-width="1.2" d="M26,66 L26,68.6 Q48,74.6 70,68.6 L70,66"/>
<path fill="#F5F0E6" stroke="{INK}" stroke-width="1" d="M40,63 L44,63 L43.6,66 L40.4,66 Z M53,62 L57,62 L56.6,65.4 L53.4,65.4 Z"/>
<path class="umb" stroke="{INK}" stroke-width="1.6" stroke-linejoin="round" d="M6,24 Q20,4 48,0 Q76,4 90,24 Q48,30 6,24 Z"/>
<path class="umb2" d="M30,4.6 Q38,1.4 48,0 Q44,14 40,27.6 Q32,27 24,26.4 Q26,14 30,4.6 Z M66,4.6 Q58,1.4 48,0 Q52,14 56,27.6 Q64,27 72,26.4 Q70,14 66,4.6 Z"/>
<path fill="none" stroke="{INK}" stroke-width="1.6" stroke-linejoin="round" d="M6,24 Q20,4 48,0 Q76,4 90,24 Q48,30 6,24 Z"/>
<path fill="{INK}" opacity=".12" d="M64,3.6 Q78,8 90,24 Q78,26.6 66,27.4 Z"/>
<circle cx="48" cy="-1.4" r="2" fill="#C9C2B2" stroke="{INK}" stroke-width="1"/>
''', 'data-slots="umb umb2"')

# Kite on a long string (effects layer, drawn above the crowd)
w('../effects/kite', '0 0 70 120', '6 118', f'''
<path fill="none" stroke="{INK}" stroke-opacity=".55" stroke-width=".8" d="M6,118 C20,96 30,70 44,36"/>
<path fill="var(--kite,#E8457A)" stroke="{INK}" stroke-width="1.4" stroke-linejoin="round" d="M44,8 L62,26 L44,40 L32,22 Z"/>
<path fill="var(--kite2,#F7C548)" d="M44,8 L44,40 L32,22 Z"/>
<path fill="none" stroke="{INK}" stroke-width="1.4" stroke-linejoin="round" d="M44,8 L62,26 L44,40 L32,22 Z M44,8 L44,40 M32,22 L62,26"/>
<path fill="none" stroke="{INK}" stroke-width=".9" d="M44,40 C40,48 48,54 42,62 C38,68 44,74 40,80"/>
<g fill="var(--kite2,#F7C548)" stroke="{INK}" stroke-width=".8"><path d="M41,50 l3,-2 l1,3 Z"/><path d="M42,64 l3,-2 l1,3 Z"/><path d="M39.6,76 l3,-2 l1,3 Z"/></g>
''', 'data-layer="effects" data-slots="kite kite2"')
print('ok')
