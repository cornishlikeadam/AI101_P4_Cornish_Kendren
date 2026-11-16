# Writes the district assets for River Street, Festival Pier, City Market and the squares.
# Building facades are composed from hand-drawn modules (window, door, sign, balcony); the script repeats
# and varies them along the street. Vehicles, statues and characters are hand-written path coordinates.
import os, random
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets'))
AUTH = "original, hand-authored SVG, Waldo's Savannah 2026-11-15"
INK = '#2B1D16'
f = lambda v: round(v, 1)
def w(path, vb, anchor, body, extra=''):
    W, H = vb.split()[2:]
    open(path + '.svg', 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{W}" height="{H}" data-anchor="{anchor}" data-asset="{path}" {extra} data-author="{AUTH}">\n{body.strip()}\n</svg>\n')
O = f'stroke="{INK}" stroke-width="1.6" stroke-linejoin="round"'

# ---------- River Street cotton warehouses (four storeys, arched openings) ----------
random.seed(41)
BRICK = ['#9C4A33', '#B4573E', '#8A3F2E', '#A85A3E', '#C06A48', '#7E3A2C']
SIGNS = ['PRALINES', 'TAVERN', 'GALLERY', 'CANDY', 'OYSTERS', 'GIFTS', 'RIVER INN', 'FUDGE', 'BOOKS', 'BBQ']
def arch_window(x, y, ww, hh, shut):
    r = ww / 2
    s = f'<path d="M{f(x)},{f(y+hh)} L{f(x)},{f(y+r)} A{f(r)},{f(r)} 0 0,1 {f(x+ww)},{f(y+r)} L{f(x+ww)},{f(y+hh)} Z" fill="#3D5468" {O}/>'
    s += f'<path d="M{f(x+r)},{f(y+2)} L{f(x+r)},{f(y+hh)} M{f(x)},{f(y+hh*0.55)} L{f(x+ww)},{f(y+hh*0.55)}" stroke="#E8E2D2" stroke-width="1.6"/>'
    s += f'<path d="M{f(x+3)},{f(y+r+2)} L{f(x+3)},{f(y+hh-3)}" stroke="#9FC0D4" stroke-width="2" opacity=".6"/>'
    if shut: s += f'<rect x="{f(x-ww*0.42)}" y="{f(y+r*0.5)}" width="{f(ww*0.38)}" height="{f(hh-r*0.5)}" fill="{shut}" {O}/><rect x="{f(x+ww*1.04)}" y="{f(y+r*0.5)}" width="{f(ww*0.38)}" height="{f(hh-r*0.5)}" fill="{shut}" {O}/>'
    s += f'<rect x="{f(x-3)}" y="{f(y+hh)}" width="{f(ww+6)}" height="4" fill="#D8CBB0" {O}/>'
    return s
def warehouse(x, wdt):
    H = 330; brick = random.choice(BRICK); shut = random.choice([None, '#2F5D50', '#3D4F6E', None])
    s = f'<rect x="{x}" y="10" width="{wdt}" height="{H-10}" fill="{brick}" {O}/>'
    s += f'<rect x="{x+wdt-14}" y="10" width="14" height="{H-10}" fill="{INK}" opacity=".14"/>'
    for yy in range(26, H - 70, 9): s += f'<path d="M{x+2},{yy} H{x+wdt-2}" stroke="{INK}" stroke-opacity=".12" stroke-width=".8"/>'
    s += f'<rect x="{x-4}" y="2" width="{wdt+8}" height="14" fill="#D8CBB0" {O}/><path d="M{x-4},16 H{x+wdt+4}" stroke="{INK}" stroke-width="1"/>'
    for k in range(int((wdt + 8) / 12)): s += f'<rect x="{x - 2 + k*12}" y="16" width="5" height="6" fill="#D8CBB0" stroke="{INK}" stroke-width=".8"/>'
    n = max(2, int(wdt / 54)); gap = wdt / n
    for floor, fy in enumerate([30, 92, 154]):
        for i in range(n): s += arch_window(x + gap * i + gap * 0.28, fy, gap * 0.44, 50, shut)
        if floor == 1 and random.random() < 0.5:
            s += f'<rect x="{x+8}" y="{fy+52}" width="{wdt-16}" height="5" fill="{INK}"/>'
            s += ''.join(f'<path d="M{f(x+10+k*8)},{fy+36} V{fy+52}" stroke="{INK}" stroke-width="1.3"/>' for k in range(int((wdt-18)/8)))
            s += f'<path d="M{x+8},{fy+36} H{x+wdt-8}" stroke="{INK}" stroke-width="2"/>'
    sy = 214; sign = random.choice(SIGNS); sc = random.choice(['#2F5D50', '#F2D55C', '#E8E2D2', '#3D4F6E', '#7A3B3B'])
    tc = INK if sc in ('#F2D55C', '#E8E2D2') else '#F5F0E6'
    s += f'<rect x="{x+wdt*0.15}" y="{sy}" width="{wdt*0.7}" height="24" rx="3" fill="{sc}" {O}/>'
    s += f'<text x="{f(x+wdt/2)}" y="{sy+17}" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="14" fill="{tc}" letter-spacing="1.5">{sign}</text>'
    for i in range(n):
        dx = x + gap * i + gap * 0.2; dw = gap * 0.6
        s += f'<path d="M{f(dx)},{H} L{f(dx)},{f(258+dw/2)} A{f(dw/2)},{f(dw/2)} 0 0,1 {f(dx+dw)},{f(258+dw/2)} L{f(dx+dw)},{H} Z" fill="{INK}" {O}/>'
        s += f'<path d="M{f(dx+4)},{H} L{f(dx+4)},{f(262+dw/2)}" stroke="#F2C76A" stroke-width="2" opacity=".55"/>'
        s += f'<path d="M{f(dx-3)},{f(258+dw/2)} A{f(dw/2+3)},{f(dw/2+3)} 0 0,1 {f(dx+dw+3)},{f(258+dw/2)}" fill="none" stroke="#D8CBB0" stroke-width="4"/>'
    s += f'<path d="M{x+wdt-6},20 V{H}" stroke="{INK}" stroke-width="3"/><path d="M{x+wdt-6},20 V{H}" stroke="#7E7A72" stroke-width="1.5"/>'
    return s
body = ''; x = 0
while x < 3200:
    wdt = random.choice([170, 200, 230, 260]); wdt = min(wdt, 3200 - x)
    if wdt < 90: break
    body += warehouse(x, wdt); x += wdt
w('environments/riverfront/warehouse-row', '0 0 3200 330', '0 330', f'<rect x="0" y="300" width="3200" height="30" fill="{INK}" opacity=".08"/>' + body, 'data-layer="far"')

# ---------- City Market shopfronts (two storeys, striped awnings) ----------
random.seed(77)
MAWN = ['#2F7FA8', '#3E8E7E', '#E07A3F', '#7D5BA6', '#2F5D50', '#C73E3A', '#E8457A']
MSIGNS = ['ART', 'CAFÉ', 'PRALINES', 'BISTRO', 'TOYS', 'ICE CREAM', 'MUSIC', 'MAPS', 'HATS', 'TEA']
WALL = ['#B4573E', '#E7C07A', '#9EC3B5', '#E8A28C', '#C9805E', '#D8CBB0', '#A85A3E']
def shop(x, wdt):
    H = 300; wall = random.choice(WALL); aw = random.choice(MAWN)
    s = f'<rect x="{x}" y="20" width="{wdt}" height="{H-20}" fill="{wall}" {O}/><rect x="{x+wdt-12}" y="20" width="12" height="{H-20}" fill="{INK}" opacity=".12"/>'
    s += f'<rect x="{x-4}" y="12" width="{wdt+8}" height="14" fill="#F4EEDD" {O}/>'
    n = max(2, int(wdt / 70)); gap = wdt / n
    for i in range(n):
        wx = x + gap * i + gap * 0.22; ww = gap * 0.56
        s += f'<rect x="{f(wx)}" y="48" width="{f(ww)}" height="70" fill="#3D5468" {O}/><path d="M{f(wx+ww/2)},48 V118 M{f(wx)},82 H{f(wx+ww)}" stroke="#F4EEDD" stroke-width="2"/>'
        s += f'<rect x="{f(wx-3)}" y="118" width="{f(ww+6)}" height="5" fill="#F4EEDD" {O}/>'
        if random.random() < .5: s += f'<rect x="{f(wx+2)}" y="104" width="{f(ww-4)}" height="12" fill="#5C9E4A" {O}/>' + ''.join(f'<circle cx="{f(wx+6+k*7)}" cy="103" r="3" fill="{random.choice(["#E2557E","#F7C548","#F07FA2"])}" stroke="{INK}" stroke-width=".7"/>' for k in range(int((ww-6)/7)))
    s += f'<rect x="{x+wdt*0.18}" y="134" width="{wdt*0.64}" height="22" rx="3" fill="#F4EEDD" {O}/><text x="{f(x+wdt/2)}" y="150" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="13" fill="{INK}" letter-spacing="1">{random.choice(MSIGNS)}</text>'
    s += f'<rect x="{x+8}" y="196" width="{wdt-16}" height="{H-196}" fill="#2B3A44" {O}/>'
    s += f'<rect x="{x+wdt/2-14}" y="210" width="28" height="{H-210}" fill="{INK}" {O}/>'
    s += f'<path d="M{x+14},214 H{x+wdt/2-20} M{x+wdt/2+20},214 H{x+wdt-14}" stroke="#F2C76A" stroke-width="2" opacity=".5"/>'
    # awning: vertical stripes only (horizontal red and white belongs to the target)
    s += f'<path d="M{x+2},166 L{x+wdt-2},166 L{x+wdt+8},196 L{x-8},196 Z" fill="{aw}" {O}/>'
    k = 0; sx = x + 2
    while sx < x + wdt - 2:
        if k % 2: s += f'<path d="M{f(sx)},166 L{f(min(sx+14, x+wdt-2))},166 L{f(min(sx+14, x+wdt-2) + (min(sx+14,x+wdt-2)-x-wdt/2)*0.1)},196 L{f(sx + (sx-x-wdt/2)*0.1)},196 Z" fill="#F5F0E6"/>'
        sx += 14; k += 1
    s += f'<path d="M{x+2},166 L{x+wdt-2},166 L{x+wdt+8},196 L{x-8},196 Z" fill="none" {O}/>'
    s += ''.join(f'<path d="M{f(x-8+j*14)},196 q7,9 14,0" fill="{aw}" {O}/>' for j in range(int((wdt+16)/14)))
    return s
body = ''; x = 0
while x < 3200:
    wdt = min(random.choice([180, 220, 260]), 3200 - x)
    if wdt < 100: break
    body += shop(x, wdt); x += wdt
gate = f'''<path d="M1480,300 V60 M1720,300 V60" stroke="{INK}" stroke-width="12"/><path d="M1480,300 V60 M1720,300 V60" stroke="#3D4F6E" stroke-width="7"/>
<path d="M1474,70 Q1600,4 1726,70 L1726,92 Q1600,30 1474,92 Z" fill="#3D4F6E" {O}/>
<text x="1600" y="64" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="22" fill="#F2D55C" letter-spacing="3">CITY MARKET</text>'''
w('environments/market/market-row', '0 0 3200 300', '0 300', body + gate, 'data-layer="far"')

# ---------- riverboat: two-deck paddle-wheeler ----------
win = lambda x0, y0, n, sp, ww, hh: ''.join(f'<rect x="{x0+i*sp}" y="{y0}" width="{ww}" height="{hh}" rx="2" fill="#3D5468" stroke="{INK}" stroke-width="1"/>' for i in range(n))
rail = lambda x0, x1, y0: f'<path d="M{x0},{y0} H{x1}" stroke="{INK}" stroke-width="1.6"/>' + ''.join(f'<path d="M{x},{y0} v10" stroke="{INK}" stroke-width="1"/>' for x in range(x0, x1, 8))
w('props/river/riverboat', '0 0 600 300', '300 286', f'''
<ellipse cx="300" cy="288" rx="290" ry="12" fill="#2F5D72" opacity=".35"/>
<path d="M30,240 L560,240 C548,262 520,282 470,286 L80,286 C50,282 36,262 30,240 Z" fill="#F4F1E8" {O}/>
<path d="M36,254 L556,254" stroke="#C73E3A" stroke-width="5"/><path d="M44,266 L548,266" stroke="#C73E3A" stroke-width="2"/>
<rect x="40" y="186" width="470" height="54" fill="#F4F1E8" {O}/>{win(56, 200, 13, 34, 22, 22)}
{rail(40, 510, 176)}<rect x="40" y="172" width="470" height="6" fill="#C73E3A" {O}/>
<rect x="80" y="130" width="380" height="44" fill="#F4F1E8" {O}/>{win(96, 140, 11, 33, 20, 20)}
{rail(80, 460, 120)}<rect x="80" y="116" width="380" height="6" fill="#C73E3A" {O}/>
<rect x="250" y="80" width="100" height="38" fill="#F4F1E8" {O}/>{win(262, 90, 4, 22, 14, 16)}
<path d="M244,82 L356,82 L346,70 L254,70 Z" fill="#C73E3A" {O}/>
<path d="M200,116 V22 M226,116 V22" stroke="{INK}" stroke-width="16" stroke-linecap="square"/><path d="M200,116 V22 M226,116 V22" stroke="#2B2B2B" stroke-width="12"/>
<path d="M190,28 L210,28 L206,18 L194,18 Z M216,28 L236,28 L232,18 L220,18 Z" fill="#F2C76A" {O}/>
<path d="M300,70 V30" stroke="{INK}" stroke-width="2"/><path d="M300,32 L326,38 L300,46 Z" fill="#2F7FA8" {O}/>
<circle cx="560" cy="220" r="58" fill="#C73E3A" {O}/><circle cx="560" cy="220" r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/>
{''.join(f'<path d="M560,220 L{f(560+58*__import__("math").cos(a*0.5236))},{f(220+58*__import__("math").sin(a*0.5236))}" stroke="{INK}" stroke-width="2.4"/>' for a in range(12))}
<rect x="505" y="160" width="20" height="80" fill="#F4F1E8" {O}/>
<path d="M60,286 q10,6 20,0 M180,288 q10,6 20,0 M330,288 q10,6 20,0 M460,288 q10,6 20,0" fill="none" stroke="#FFFFFF" stroke-width="2"/>
''')
w('props/river/tugboat', '0 0 220 130', '110 122', f'''
<ellipse cx="110" cy="124" rx="104" ry="6" fill="#2F5D72" opacity=".35"/>
<path d="M8,86 L212,86 C204,106 186,120 160,122 L40,122 C22,118 12,104 8,86 Z" fill="#C73E3A" {O}/>
<path d="M14,98 H206" stroke="{INK}" stroke-width="3"/>
{''.join(f'<circle cx="{30+i*40}" cy="96" r="7" fill="#2B2B2B" {O}/>' for i in range(5))}
<rect x="60" y="48" width="90" height="38" fill="#F4F1E8" {O}/>{win(70, 58, 3, 26, 16, 14)}
<rect x="88" y="26" width="50" height="22" fill="#F4F1E8" {O}/>{win(96, 32, 2, 20, 12, 10)}
<path d="M84,28 L142,28 L136,20 L90,20 Z" fill="#2F5D50" {O}/>
<rect x="44" y="20" width="16" height="66" fill="#2B2B2B" {O}/><rect x="44" y="26" width="16" height="8" fill="#F2C76A"/>
''')

# ---------- statues and monuments ----------
w('props/landmarks/waving-girl', '0 0 120 240', '60 236', f'''
<ellipse cx="62" cy="236" rx="50" ry="5" fill="{INK}" opacity=".16"/>
<path d="M18,150 L102,150 L106,236 L14,236 Z" fill="#C9C2B2" {O}/><path d="M86,150 L102,150 L106,236 L90,236 Z" fill="#A9A294"/>
<path d="M12,146 L108,146 L108,156 L12,156 Z M10,222 L110,222 L110,236 L10,236 Z" fill="#D8D2C4" {O}/>
<g fill="#5E8C78" {O}>
<path d="M44,146 C40,124 42,104 48,86 L68,86 C74,104 76,124 72,146 Z"/>
<path d="M50,90 C48,74 52,64 58,62 C64,64 68,74 66,90 Z"/>
<circle cx="58" cy="52" r="10"/>
<circle cx="52.6" cy="45" r="4.6"/><path d="M48.6,52 C48,58 49,62 51,64 L54,58 Z"/>
<path d="M64,68 C72,58 80,44 84,28 L90,30 C88,46 80,62 70,74 Z"/>
<path d="M86,30 C96,12 110,8 116,14 C108,18 104,26 104,36 C98,30 92,30 86,30 Z" fill="#7FA898"/>
<path d="M52,70 C46,80 44,92 46,104 L52,104 C51,94 53,84 58,76 Z"/>
<path d="M24,146 C22,136 26,128 32,126 C34,120 40,120 42,126 C46,130 46,140 44,146 Z"/>
</g>
<path d="M50,100 C52,116 50,132 48,146 M62,100 C64,118 66,132 64,146" fill="none" stroke="{INK}" stroke-opacity=".4" stroke-width="1"/>
<path d="M48,48 q2,-6 8,-6" stroke="#A9CDBE" stroke-width="2" fill="none"/>
''')
w('props/landmarks/obelisk', '0 0 140 340', '70 334', f'''
<ellipse cx="74" cy="334" rx="66" ry="6" fill="{INK}" opacity=".16"/>
<path d="M10,300 L130,300 L130,334 L10,334 Z" fill="#B9B3A5" {O}/><path d="M24,280 L116,280 L116,302 L24,302 Z" fill="#C9C2B2" {O}/>
<path d="M40,262 L100,262 L100,282 L40,282 Z" fill="#D8D2C4" {O}/>
<path d="M50,262 L58,40 L82,40 L90,262 Z" fill="#E4DED0" {O}/><path d="M72,40 L82,40 L90,262 L76,262 Z" fill="#C9C2B2"/>
<path d="M58,40 L70,14 L82,40 Z" fill="#E4DED0" {O}/><path d="M70,14 L82,40 L74,40 Z" fill="#C9C2B2"/>
<path d="M60,120 H82 M58,180 H84" stroke="{INK}" stroke-opacity=".3" stroke-width="1"/>
<g stroke="{INK}" stroke-width="2.4"><path d="M4,330 V306 M28,334 V310 M52,334 V312 M88,334 V312 M112,334 V310 M136,330 V306"/></g>
<path d="M4,308 Q70,296 136,308" fill="none" stroke="{INK}" stroke-width="2"/>
''')

# ---------- festival tent ----------
w('props/festival/tent', '0 0 140 132', '70 128', f'''
<style>.t{{fill:var(--tent,#C73E3A)}}.t2{{fill:var(--tent2,#F5F0E6)}}</style>
<ellipse cx="72" cy="128" rx="68" ry="4" fill="{INK}" opacity=".16"/>
<path d="M14,40 V128 M126,40 V128" stroke="{INK}" stroke-width="4"/><path d="M14,40 V128 M126,40 V128" stroke="#D8D2C4" stroke-width="2"/>
<rect x="20" y="92" width="100" height="34" fill="var(--cloth,#F2D55C)" {O}/>
{''.join(f'<rect x="{26+i*12}" y="82" width="8" height="10" rx="2" fill="{["#E8457A","#F7C548","#3FC1C9","#5C9E4A","#7D5BA6"][i%5]}" stroke="{INK}" stroke-width=".8"/>' for i in range(8))}
<path d="M70,4 L136,42 L4,42 Z" class="t2" {O}/>
<path d="M70,4 L92,42 L70,42 Z M70,4 L48,42 L26,42 Z M70,4 L114,42 L136,42 Z" class="t"/>
<path d="M70,4 L136,42 L4,42 Z" fill="none" {O}/>
{''.join(f'<path d="M{4+j*16},42 q8,10 16,0" class="{["t","t2"][j%2]}" {O}/>' for j in range(9))}
<path d="M70,4 V-6" stroke="{INK}" stroke-width="1.6"/><path d="M70,-6 L84,-2 L70,2 Z" class="t" {O}/>
''', 'data-slots="tent tent2 cloth"')

# ---------- horse carriage and tour trolley ----------
w('props/vehicles/carriage', '0 0 250 150', '130 144', f'''
<ellipse cx="130" cy="144" rx="120" ry="6" fill="{INK}" opacity=".16"/>
<g fill="#7A4A2A" {O}>
<path d="M150,72 C170,62 196,62 214,70 C222,62 230,50 234,40 C238,34 246,36 246,44 C244,56 238,70 228,82 C226,92 220,98 210,100 L208,140 L200,140 L198,104 L170,104 L168,140 L160,140 L156,100 C148,96 146,82 150,72 Z"/>
</g>
<path d="M232,38 L238,28 L242,38" fill="#7A4A2A" {O}/><path d="M228,50 C226,62 222,70 216,74" fill="none" stroke="#2B1D16" stroke-width="3" stroke-linecap="round"/>
<circle cx="240" cy="46" r="1.6" fill="{INK}"/>
<path d="M150,76 C140,84 138,98 140,110" fill="none" stroke="#2B1D16" stroke-width="4" stroke-linecap="round"/>
<path d="M168,82 L228,82" stroke="#C73E3A" stroke-width="3"/>
<path d="M40,60 L120,60 C128,60 130,66 130,74 L130,108 L30,108 L30,74 C30,66 34,60 40,60 Z" fill="#3B2A3A" {O}/>
<path d="M44,66 L80,66 L80,94 L44,94 Z M88,66 L120,66 L120,94 L88,94 Z" fill="#9FC0D4" {O}/>
<path d="M26,58 C30,36 50,26 80,26 C110,26 128,36 134,58 Z" fill="#2B1D16" {O}/>
<path d="M130,90 L176,90" stroke="{INK}" stroke-width="3"/>
<circle cx="50" cy="122" r="22" fill="none" stroke="{INK}" stroke-width="5"/><circle cx="50" cy="122" r="22" fill="none" stroke="#C99A62" stroke-width="2.5"/>
{''.join(f'<path d="M50,122 l{f(22*__import__("math").cos(a*0.785))},{f(22*__import__("math").sin(a*0.785))}" stroke="#C99A62" stroke-width="1.6"/>' for a in range(8))}
<circle cx="116" cy="126" r="17" fill="none" stroke="{INK}" stroke-width="5"/><circle cx="116" cy="126" r="17" fill="none" stroke="#C99A62" stroke-width="2.5"/>
{''.join(f'<path d="M116,126 l{f(17*__import__("math").cos(a*0.785))},{f(17*__import__("math").sin(a*0.785))}" stroke="#C99A62" stroke-width="1.4"/>' for a in range(8))}
''')
w('props/vehicles/trolley', '0 0 320 160', '160 154', f'''
<ellipse cx="160" cy="154" rx="152" ry="6" fill="{INK}" opacity=".16"/>
<path d="M12,40 L300,40 C310,40 314,48 314,58 L314,130 L8,130 L8,52 C8,44 10,40 12,40 Z" fill="#2F6B4A" {O}/>
<path d="M8,104 H314 M8,112 H314" stroke="#F2A65A" stroke-width="5"/>
<path d="M4,40 L316,40 L306,22 L14,22 Z" fill="#E07A3F" {O}/>
<text x="160" y="36" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="12" fill="#F5F0E6" letter-spacing="2">HISTORIC TOURS</text>
{''.join(f'<rect x="{22+i*42}" y="50" width="32" height="44" rx="4" fill="#9FC0D4" {O}/><path d="M{26+i*42},54 l8,30" stroke="#FFFFFF" stroke-opacity=".6" stroke-width="2"/>' for i in range(7))}
<rect x="292" y="56" width="18" height="40" rx="3" fill="#F2D55C" {O}/>
<circle cx="64" cy="132" r="16" fill="#2B2B2B" {O}/><circle cx="64" cy="132" r="6" fill="#C9C2B2"/>
<circle cx="256" cy="132" r="16" fill="#2B2B2B" {O}/><circle cx="256" cy="132" r="6" fill="#C9C2B2"/>
''')
print('district assets written')

# ---------- squares: Italianate row houses with high stoops, and a twin-spired church ----------
random.seed(203)
STUCCO = ['#E7C07A', '#9EC3B5', '#E8A28C', '#F0E2C4', '#C9D6E2', '#D9B48C', '#B4573E']
def rowhouse(x, wdt):
    H = 290; wall = random.choice(STUCCO); trim = '#F7F1E3'; shut = random.choice(['#2F5D50', '#3D4F6E', '#7A3B3B', '#2B2B2B'])
    s = f'<rect x="{x}" y="40" width="{wdt}" height="{H-40}" fill="{wall}" {O}/><rect x="{x+wdt-10}" y="40" width="10" height="{H-40}" fill="{INK}" opacity=".12"/>'
    s += f'<path d="M{x-6},40 L{x+wdt+6},40 L{x+wdt+2},28 L{x-2},28 Z" fill="{trim}" {O}/>'
    s += ''.join(f'<path d="M{x+6+k*12},40 v6" stroke="{INK}" stroke-width="1.4"/>' for k in range(int(wdt/12)))
    cols = 3 if wdt >= 150 else 2; gap = wdt / cols
    for fy, hh in [(62, 48), (140, 64)]:
        for i in range(cols):
            wx = x + gap*i + gap*0.28; ww = gap*0.44
            s += f'<rect x="{f(wx)}" y="{fy}" width="{f(ww)}" height="{hh}" fill="#3D5468" {O}/><path d="M{f(wx+ww/2)},{fy} v{hh} M{f(wx)},{fy+hh*0.5} h{f(ww)}" stroke="{trim}" stroke-width="1.6"/>'
            s += f'<path d="M{f(wx-4)},{fy-2} h{f(ww+8)} l-3,-7 h{f(-ww-2)} Z" fill="{trim}" {O}/>'
            s += f'<rect x="{f(wx-ww*0.36)}" y="{fy}" width="{f(ww*0.32)}" height="{hh}" fill="{shut}" {O}/><rect x="{f(wx+ww*1.04)}" y="{fy}" width="{f(ww*0.32)}" height="{hh}" fill="{shut}" {O}/>'
    # cast-iron balcony across the parlour floor
    s += f'<rect x="{x+6}" y="206" width="{wdt-12}" height="5" fill="{INK}"/>' + ''.join(f'<path d="M{f(x+8+k*7)},188 v18" stroke="{INK}" stroke-width="1.1"/>' for k in range(int((wdt-14)/7))) + f'<path d="M{x+6},188 H{x+wdt-6}" stroke="{INK}" stroke-width="2"/>'
    s += ''.join(f'<path d="M{f(x+10+k*14)},198 q4,-6 8,0" fill="none" stroke="{INK}" stroke-width="1"/>' for k in range(int((wdt-20)/14)))
    # high stoop with a double stair up to the door
    dx = x + wdt*0.5
    s += f'<rect x="{f(dx-14)}" y="218" width="28" height="44" fill="{shut}" {O}/><path d="M{f(dx-18)},218 A18,14 0 0,1 {f(dx+18)},218" fill="{trim}" {O}/>'
    s += f'<rect x="{f(dx-24)}" y="260" width="48" height="8" fill="#C9C2B2" {O}/>'
    s += f'<path d="M{f(dx-24)},268 L{f(dx-62)},290 L{f(dx-40)},290 L{f(dx-12)},268 Z M{f(dx+24)},268 L{f(dx+62)},290 L{f(dx+40)},290 L{f(dx+12)},268 Z" fill="#C9C2B2" {O}/>'
    s += f'<path d="M{f(dx-24)},258 L{f(dx-64)},282 M{f(dx+24)},258 L{f(dx+64)},282" stroke="{INK}" stroke-width="2"/>'
    s += f'<rect x="{x}" y="262" width="{wdt}" height="28" fill="#B9A88C" {O}/>' + ''.join(f'<rect x="{f(x+10+k*30)}" y="270" width="16" height="12" fill="#3D5468" stroke="{INK}" stroke-width="1"/>' for k in range(int((wdt-20)/30)) if abs(x+18+k*30-dx) > 70)
    return s
def church(x):
    W = 420; s = ''
    for sx in (x + 20, x + W - 100):
        s += f'<rect x="{sx}" y="70" width="80" height="220" fill="#EDE6D6" {O}/>'
        s += f'<path d="M{sx-4},70 L{sx+40},-80 L{sx+84},70 Z" fill="#5E8C78" {O}/><path d="M{sx+40},-80 L{sx+84},70 L{sx+56},70 Z" fill="#4A7262"/>'
        s += f'<path d="M{sx+40},-80 v-22 M{sx+32},-94 h16" stroke="{INK}" stroke-width="2.4"/>'
        s += f'<path d="M{sx+24},230 V140 A16,16 0 0,1 {sx+56},140 V230 Z" fill="#3D5468" {O}/><circle cx="{sx+40}" cy="100" r="12" fill="#F2D55C" {O}/>'
    s += f'<rect x="{x+100}" y="130" width="{W-200}" height="160" fill="#E4DCC8" {O}/><path d="M{x+96},130 L{x+W/2},70 L{x+W-96},130 Z" fill="#E4DCC8" {O}/>'
    s += f'<circle cx="{x+W/2}" cy="168" r="30" fill="#7D5BA6" {O}/>' + ''.join(f'<path d="M{x+W/2},168 l{f(30*__import__("math").cos(a*0.785))},{f(30*__import__("math").sin(a*0.785))}" stroke="{INK}" stroke-width="1.2"/>' for a in range(8))
    s += f'<circle cx="{x+W/2}" cy="168" r="10" fill="#F2D55C" {O}/>'
    s += f'<path d="M{x+W/2-30},290 V236 A30,30 0 0,1 {x+W/2+30},236 V290 Z" fill="#5A3A28" {O}/><path d="M{x+W/2},206 V290" stroke="{INK}" stroke-width="1.4"/>'
    return s, W
body = ''; x = 0; churchdone = False
while x < 3200:
    if not churchdone and x > 1350:
        c, cw = church(x); body += c; x += cw; churchdone = True; continue
    wdt = min(random.choice([140, 160, 180]), 3200 - x)
    if wdt < 100: break
    body += rowhouse(x, wdt); x += wdt
w('environments/squares/row-houses', '0 -110 3200 400', '0 290', body, 'data-layer="far"')
print('square row houses written')
