# Writes the Bull Street assets that join the districts into one walk from the river to Forsyth Park:
# the Jones Street row (with SCAD's Poetter Hall), Mercer House and Temple Mickve Israel on Monterey Square,
# the Pulaski Monument, street signs, parked and moving cars, a shuttle stop and small street furniture.
# Facades are composed from hand-drawn modules; the script only repeats and varies them along the street.
# Real buildings are simplified drawings from public street-level knowledge, not traced from photographs.
# usage: python3 tools/author/bull-street.py
import os, random, math
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets'))
AUTH = "original, hand-authored SVG, Waldo's Savannah 2026-11-16"
INK = '#2B1D16'
O = f'stroke="{INK}" stroke-width="1.6" stroke-linejoin="round"'
o1 = f'stroke="{INK}" stroke-width="1.2" stroke-linejoin="round"'
f = lambda v: round(v, 1)
def w(path, vb, anchor, body, extra=''):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    W, H = vb.split()[2:]
    open(path + '.svg', 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{W}" height="{H}" data-anchor="{anchor}" data-asset="{path}" {extra} data-author="{AUTH}">\n{body.strip()}\n</svg>\n')

def window(x, y, ww, hh, trim, shut=None, arch=False, cols=2):
    s = ''
    if arch: s += f'<path d="M{f(x)},{f(y+hh)} V{f(y+ww/2)} A{f(ww/2)},{f(ww/2)} 0 0,1 {f(x+ww)},{f(y+ww/2)} V{f(y+hh)} Z" fill="#3D5468" {O}/>'
    else: s += f'<rect x="{f(x)}" y="{f(y)}" width="{f(ww)}" height="{f(hh)}" fill="#3D5468" {O}/>'
    s += f'<path d="M{f(x+ww/2)},{f(y+(ww/2 if arch else 0))} V{f(y+hh)} M{f(x)},{f(y+hh*0.55)} H{f(x+ww)}" stroke="{trim}" stroke-width="1.5"/>'
    s += f'<path d="M{f(x+3)},{f(y+4+(ww/2 if arch else 0))} V{f(y+hh-4)}" stroke="#9FC0D4" stroke-width="2" opacity=".55"/>'
    if shut: s += f'<rect x="{f(x-ww*0.36)}" y="{f(y)}" width="{f(ww*0.32)}" height="{f(hh)}" fill="{shut}" {o1}/><rect x="{f(x+ww*1.04)}" y="{f(y)}" width="{f(ww*0.32)}" height="{f(hh)}" fill="{shut}" {o1}/>'
    s += f'<rect x="{f(x-3)}" y="{f(y+hh)}" width="{f(ww+6)}" height="4" fill="{trim}" {o1}/>'
    return s
def stoop(cx, base, door, trim, wide=46):
    s = f'<rect x="{f(cx-13)}" y="{base-58}" width="26" height="42" fill="{door}" {O}/><path d="M{f(cx-17)},{base-58} A17,13 0 0,1 {f(cx+17)},{base-58}" fill="{trim}" {O}/>'
    s += f'<rect x="{f(cx-wide/2)}" y="{base-16}" width="{wide}" height="6" fill="#C9C2B2" {O}/>'
    s += ''.join(f'<rect x="{f(cx-wide/2-k*4)}" y="{base-10+k*3.4}" width="{wide+k*8}" height="3.4" fill="#BDB5A3" stroke="{INK}" stroke-width=".8"/>' for k in range(3))
    s += f'<path d="M{f(cx-wide/2)},{base-24} L{f(cx-wide/2-12)},{base} M{f(cx+wide/2)},{base-24} L{f(cx+wide/2+12)},{base}" stroke="{INK}" stroke-width="1.8"/>'
    return s
def iron_balcony(x, y, wdt):
    s = f'<rect x="{x}" y="{y}" width="{wdt}" height="4" fill="{INK}"/><path d="M{x},{y-16} H{x+wdt}" stroke="{INK}" stroke-width="1.8"/>'
    s += ''.join(f'<path d="M{f(x+3+k*6)},{y-16} v16" stroke="{INK}" stroke-width="1"/>' for k in range(int(wdt/6)))
    s += ''.join(f'<path d="M{f(x+6+k*12)},{y-6} q3,-6 6,0" fill="none" stroke="{INK}" stroke-width=".9"/>' for k in range(int((wdt-8)/12)))
    return s
def potted(x, y):
    return f'<path d="M{x-7},{y} l2,-10 h10 l2,10 Z" fill="#B4573E" {o1}/>' + ''.join(f'<circle cx="{f(x+dx)}" cy="{f(y-13+dy)}" r="4.4" fill="{c}" {o1}/>' for dx, dy, c in ((-4, 0, '#5C9E4A'), (4, -1, '#5C9E4A'), (0, -5, '#E2557E')))

# ---------- Jones Street: Victorian, Italianate and Second Empire houses, with SCAD Poetter Hall ----------
random.seed(1888)
WALLS = ['#E7C07A', '#9EC3B5', '#E8A28C', '#F0E2C4', '#C9D6E2', '#B4573E', '#A85A3E', '#D9B48C', '#C7B3D6']
SHUT = ['#2F5D50', '#3D4F6E', '#7A3B3B', '#2B2B2B', '#5E6B3A']
H = 260
def italianate(x, wdt):
    wall = random.choice(WALLS); trim = '#F7F1E3'; shut = random.choice(SHUT)
    s = f'<rect x="{x}" y="34" width="{wdt}" height="{H-34}" fill="{wall}" {O}/><rect x="{x+wdt-10}" y="34" width="10" height="{H-34}" fill="{INK}" opacity=".12"/>'
    s += f'<path d="M{x-6},34 H{x+wdt+6} L{x+wdt+2},22 H{x-2} Z" fill="{trim}" {O}/>' + ''.join(f'<path d="M{x+6+k*11},34 v6" stroke="{INK}" stroke-width="1.3"/>' for k in range(int(wdt/11)))
    cols = 3 if wdt > 140 else 2; gap = wdt / cols
    for fy, hh in ((52, 42), (118, 56)):
        for i in range(cols): s += window(x + gap*i + gap*0.3, fy, gap*0.4, hh, trim, shut, arch=fy > 100)
    s += iron_balcony(x + 6, 178, wdt - 12)
    s += stoop(x + wdt*0.5, H, shut, trim)
    s += f'<rect x="{x}" y="{H-22}" width="{wdt}" height="22" fill="#B9A88C" {O}/>'
    for k in range(int(wdt / 40)):
        px = x + 14 + k * 40
        if abs(px - (x + wdt/2)) > 44: s += potted(px, H - 22)
    return s
def victorian(x, wdt):
    wall = random.choice(['#9EC3B5', '#E8A28C', '#C7B3D6', '#F0E2C4', '#E7C07A']); trim = '#FFFDF6'; roof = random.choice(['#5A4A5E', '#3D4F6E', '#6B3A33'])
    s = f'<rect x="{x}" y="70" width="{wdt}" height="{H-70}" fill="{wall}" {O}/>'
    # clapboard siding
    s += ''.join(f'<path d="M{x+1},{yy} H{x+wdt-1}" stroke="{INK}" stroke-opacity=".14" stroke-width=".8"/>' for yy in range(78, H - 30, 7))
    gx = x + wdt * 0.32
    s += f'<path d="M{f(gx-56)},74 L{f(gx)},6 L{f(gx+56)},74 Z" fill="{wall}" {O}/><path d="M{f(gx-62)},76 L{f(gx)},0 L{f(gx+62)},76" fill="none" stroke="{roof}" stroke-width="7" stroke-linejoin="round"/><path d="M{f(gx-62)},76 L{f(gx)},0 L{f(gx+62)},76" fill="none" stroke="{INK}" stroke-width="1.4"/>'
    s += f'<circle cx="{f(gx)}" cy="44" r="10" fill="#3D5468" {O}/><path d="M{f(gx-10)},44 h20 M{f(gx)},34 v20" stroke="{trim}" stroke-width="1.4"/>'
    s += ''.join(f'<path d="M{f(gx-30+k*10)},{68} q5,6 10,0" fill="none" stroke="{trim}" stroke-width="1.6"/>' for k in range(6))
    s += f'<path d="M{x+wdt*0.58},70 H{x+wdt+4} L{x+wdt-6},50 H{x+wdt*0.62} Z" fill="{roof}" {O}/>'
    # bay window
    s += f'<path d="M{f(gx-34)},96 H{f(gx+34)} L{f(gx+28)},160 H{f(gx-28)} Z" fill="{trim}" {O}/>' + window(gx - 26, 104, 18, 48, trim) + window(gx + 8, 104, 18, 48, trim)
    s += window(x + wdt*0.72, 96, 22, 46, trim, random.choice(SHUT))
    # porch with turned posts and gingerbread trim
    s += f'<rect x="{x+4}" y="176" width="{wdt-8}" height="10" fill="{trim}" {O}/>'
    s += ''.join(f'<rect x="{f(x+8+k*((wdt-20)/4))}" y="186" width="5" height="{H-206}" fill="{trim}" {o1}/>' for k in range(5))
    s += ''.join(f'<path d="M{f(x+12+k*12)},186 q6,8 12,0" fill="none" stroke="{trim}" stroke-width="1.6"/>' for k in range(int((wdt-24)/12)))
    s += f'<rect x="{f(x+wdt*0.55)}" y="196" width="24" height="{H-216}" fill="{random.choice(SHUT)}" {O}/>'
    s += f'<rect x="{x+4}" y="{H-24}" width="{wdt-8}" height="8" fill="#C9B79A" {O}/>' + ''.join(f'<path d="M{f(x+8+k*7)},{H-40} v16" stroke="{trim}" stroke-width="2"/>' for k in range(int((wdt*0.5)/7)))
    s += f'<path d="M{x+8},{H-40} H{f(x+wdt*0.52)}" stroke="{trim}" stroke-width="2.4"/>'
    s += f'<rect x="{x}" y="{H-16}" width="{wdt}" height="16" fill="#B9A88C" {O}/>'
    return s
def second_empire(x, wdt):
    wall = random.choice(['#D9B48C', '#F0E2C4', '#B4573E', '#9EC3B5']); trim = '#F7F1E3'; shut = random.choice(SHUT)
    s = f'<rect x="{x}" y="70" width="{wdt}" height="{H-70}" fill="{wall}" {O}/>'
    s += f'<path d="M{x-4},72 L{x+8},18 H{x+wdt-8} L{x+wdt+4},72 Z" fill="#4E5A66" {O}/>'
    s += ''.join(f'<path d="M{f(x+6+k*1.2)},{24+k*9} H{f(x+wdt-6-k*1.2)}" stroke="#3A444E" stroke-width="1"/>' for k in range(5))
    for i in range(3):
        dx = x + wdt * (0.2 + i * 0.3)
        s += f'<path d="M{f(dx-10)},62 V40 A10,10 0 0,1 {f(dx+10)},40 V62 Z" fill="#3D5468" {O}/><path d="M{f(dx-14)},40 A14,14 0 0,1 {f(dx+14)},40" fill="none" stroke="{trim}" stroke-width="3"/>'
    s += f'<rect x="{x-6}" y="70" width="{wdt+12}" height="10" fill="{trim}" {O}/>'
    cols = 3; gap = wdt / cols
    for fy, hh in ((94, 48), (162, 50)):
        for i in range(cols): s += window(x + gap*i + gap*0.3, fy, gap*0.4, hh, trim, shut)
    s += stoop(x + wdt*0.5, H, shut, trim, 40)
    return s
def poetter_hall(x, wdt=330):
    # SCAD Poetter Hall (1892, the former Savannah Volunteer Guards Armory): red brick, Romanesque arches,
    # a crenellated corner tower. Drawn here at the corner of Bull Street.
    B, B2, T = '#A9483A', '#8A3A2E', '#E3D3B4'
    s = f'<rect x="{x}" y="30" width="{wdt}" height="{H-30}" fill="{B}" {O}/>'
    s += ''.join(f'<path d="M{x+2},{yy} H{x+wdt-2}" stroke="{INK}" stroke-opacity=".12" stroke-width=".8"/>' for yy in range(40, H - 20, 8))
    tx = x + 6
    s += f'<rect x="{tx}" y="-34" width="86" height="{H+34}" fill="{B2}" {O}/>' + ''.join(f'<rect x="{tx-4+k*18}" y="-46" width="12" height="14" fill="{B2}" {O}/>' for k in range(5))
    s += f'<rect x="{tx-6}" y="-34" width="98" height="8" fill="{T}" {O}/>'
    s += window(tx + 30, -14, 26, 46, T, arch=True) + window(tx + 30, 60, 26, 56, T, arch=True)
    s += f'<rect x="{x}" y="22" width="{wdt}" height="12" fill="{T}" {O}/>' + ''.join(f'<rect x="{f(x+100+k*20)}" y="10" width="12" height="14" fill="{B}" {O}/>' for k in range(int((wdt-104)/20)))
    for i in range(3):
        ax = x + 118 + i * 70
        s += window(ax, 52, 40, 70, T, arch=True)
        s += f'<path d="M{ax-6},{H} V{H-62} A26,26 0 0,1 {ax+46},{H-62} V{H}" fill="#3B2A24" {O}/>' if i == 1 else window(ax, 146, 40, 62, T, arch=True)
    s += f'<rect x="{x+112}" y="128" width="{wdt-118}" height="10" fill="{T}" {O}/>'
    # SCAD banners and a sign over the door
    for bx, col in ((x + 108, '#F2D55C'), (x + wdt - 22, '#F2D55C')):
        s += f'<path d="M{bx},150 h14 v40 l-7,-6 l-7,6 Z" fill="{col}" {o1}/><text x="{bx+7}" y="174" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="6" fill="{INK}" transform="rotate(-90 {bx+7} 172)">SCAD</text>'
    s += f'<rect x="{x+150}" y="{H-92}" width="{wdt-180}" height="16" rx="2" fill="{T}" {o1}/><text x="{f(x+150+(wdt-180)/2)}" y="{H-80}" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="10" fill="{INK}" letter-spacing="1.5">POETTER HALL</text>'
    s += f'<rect x="{x}" y="{H-12}" width="{wdt}" height="12" fill="#9C948A" {O}/>'
    return s
body = ''; x = 0
for a, b in ((0, 1515), (1685, 3200)):
    x = a
    if a > 0: body += poetter_hall(x + 4, 330); x += 340
    while x < b:
        kind = random.choice([italianate, italianate, victorian, second_empire])
        wdt = {italianate: random.choice([130, 150, 170]), victorian: 190, second_empire: 160}[kind]
        if b - x < 120: break
        wdt = min(wdt, b - x)
        if b - x - wdt < 140: wdt = b - x           # the last house on the block reaches the corner
        body += kind(x, wdt); x += wdt + (random.choice([0, 0, 12]) if b - x - wdt > 200 else 0)
w('environments/monterey/jones-row', '0 -50 3200 310', '0 260', body, 'data-layer="far"')

# ---------- Monterey Square: Mercer House (west) and Temple Mickve Israel (east) ----------
def mercer_house():
    B, T, IR = '#B04A36', '#F2E9D6', INK
    W, Hh = 440, 300; s = f'<ellipse cx="{W/2}" cy="{Hh}" rx="{W/2}" ry="8" fill="{INK}" opacity=".15"/>'
    s += f'<rect x="20" y="40" width="{W-40}" height="{Hh-40}" fill="{B}" {O}/>' + ''.join(f'<path d="M22,{yy} H{W-22}" stroke="{INK}" stroke-opacity=".12" stroke-width=".8"/>' for yy in range(50, Hh - 30, 8))
    s += f'<path d="M10,40 H{W-10} L{W-16},24 H16 Z" fill="{T}" {O}/>' + ''.join(f'<rect x="{24+k*16}" y="40" width="7" height="9" fill="{T}" {o1}/>' for k in range(int((W-48)/16)))
    for fy in (70, 154):
        for i in range(5):
            wx = 50 + i * 76
            s += f'<path d="M{wx},{fy+60} V{fy+12} A14,14 0 0,1 {wx+28},{fy+12} V{fy+60} Z" fill="#3D5468" {O}/><path d="M{wx+14},{fy} V{fy+60}" stroke="{T}" stroke-width="1.4"/><path d="M{wx-4},{fy+12} A18,18 0 0,1 {wx+32},{fy+12}" fill="none" stroke="{T}" stroke-width="4"/>'
        s += iron_balcony(30, fy + 64, W - 60)
    s += f'<path d="M{W/2-18},{Hh} V{Hh-50} A18,18 0 0,1 {W/2+18},{Hh-50} V{Hh}" fill="#5A3A28" {O}/>'
    s += f'<rect x="20" y="{Hh-14}" width="{W-40}" height="14" fill="#9C948A" {O}/>'
    return W, Hh, s
W_, H_, b = mercer_house()
w('environments/monterey/mercer-house', f'0 0 {W_} {H_+8}', f'{W_/2} {H_}', b)
def temple():
    S, S2, T = '#EFE6D2', '#D8CDB5', '#B9A88C'
    W, Hh = 360, 340; s = f'<ellipse cx="{W/2}" cy="{Hh}" rx="{W/2}" ry="8" fill="{INK}" opacity=".15"/>'
    s += f'<rect x="30" y="120" width="{W-60}" height="{Hh-120}" fill="{S}" {O}/><path d="M24,124 L{W/2},70 L{W-24},124 Z" fill="{S2}" {O}/>'
    cx = W / 2
    s += f'<rect x="{cx-36}" y="40" width="72" height="{Hh-40}" fill="{S}" {O}/><rect x="{cx-40}" y="32" width="80" height="12" fill="{S2}" {O}/>'
    for px in (cx - 40, cx - 14, cx + 12, cx + 36): s += f'<path d="M{px-4},34 L{px},10 L{px+4},34 Z" fill="{S2}" {o1}/>'
    s += f'<path d="M{cx-20},120 V78 L{cx},56 L{cx+20},78 V120 Z" fill="#3D5468" {O}/><circle cx="{cx}" cy="168" r="18" fill="#7D9BC0" {O}/><path d="M{cx-18},168 h36 M{cx},150 v36" stroke="{INK}" stroke-width="1.2"/>'
    for wx in (56, 104, W - 132, W - 84):
        s += f'<path d="M{wx},{Hh-40} V170 L{wx+14},148 L{wx+28},170 V{Hh-40} Z" fill="#3D5468" {O}/><path d="M{wx+14},150 V{Hh-40}" stroke="{S}" stroke-width="1.4"/>'
    for px in (30, W - 30, cx - 36, cx + 36): s += f'<rect x="{px-5}" y="120" width="10" height="{Hh-130}" fill="{S2}" {o1}/>'
    s += f'<path d="M{cx-22},{Hh} V{Hh-52} L{cx},{Hh-76} L{cx+22},{Hh-52} V{Hh}" fill="#5A3A28" {O}/>'
    s += f'<rect x="24" y="{Hh-12}" width="{W-48}" height="12" fill="{T}" {O}/>'
    return W, Hh, s
W_, H_, b = temple()
w('environments/monterey/temple', f'0 0 {W_} {H_+8}', f'{W_/2} {H_}', b)

# ---------- Pulaski Monument (Monterey Square): a marble shaft carrying the figure of Liberty ----------
s = f'<ellipse cx="70" cy="420" rx="66" ry="7" fill="{INK}" opacity=".16"/>'
s += f'<path d="M8,386 H132 V420 H8 Z" fill="#B9B3A5" {O}/><path d="M22,362 H118 V388 H22 Z" fill="#C9C2B2" {O}/><path d="M34,330 H106 V364 H34 Z" fill="#D8D2C4" {O}/>'
s += f'<rect x="44" y="338" width="52" height="20" fill="#8A6B3A" {o1}/>'
s += f'<path d="M48,330 L54,96 H86 L92,330 Z" fill="#E9E4D8" {O}/><path d="M74,96 H86 L92,330 H78 Z" fill="#CFC8B9"/>'
s += ''.join(f'<path d="M{50+k*0.4},{150+k*60} H{90-k*0.4}" stroke="{INK}" stroke-opacity=".3" stroke-width="1"/>' for k in range(3))
s += f'<rect x="48" y="86" width="44" height="12" fill="#D8D2C4" {O}/><rect x="56" y="76" width="28" height="12" fill="#D8D2C4" {O}/>'
# Liberty with a banner, arm raised
s += f'<path d="M62,76 C60,58 62,44 66,36 C70,30 74,30 76,36 C80,44 80,58 78,76 Z" fill="#EFEAE0" {O}/><circle cx="71" cy="28" r="6" fill="#EFEAE0" {O}/>'
s += f'<path d="M76,40 L90,14" stroke="{INK}" stroke-width="3.4" stroke-linecap="round"/><path d="M76,40 L90,14" stroke="#EFEAE0" stroke-width="2" stroke-linecap="round"/>'
s += f'<path d="M62,46 L48,40 L52,56 Z" fill="#EFEAE0" {o1}/>'
s += f'<g stroke="{INK}" stroke-width="2.2"><path d="M4,416 V390 M30,420 V394 M56,420 V396 M84,420 V396 M110,420 V394 M136,416 V390"/><path d="M4,394 H136" stroke-width="1.6"/></g>'
w('props/landmarks/pulaski-monument', '0 0 140 428', '70 420', s)

# ---------- Cars (side view, colour slot --car) ----------
def car(kind):
    s = '<style>.car{fill:var(--car,#4F6CC4)}.car2{fill:var(--car2,#F5F0E6)}</style>'
    s += f'<ellipse cx="80" cy="66" rx="72" ry="5" fill="{INK}" opacity=".18"/>'
    if kind == 'sedan':
        s += f'<path d="M10,52 C8,40 14,34 28,32 L46,30 C54,18 64,12 84,12 C104,12 114,18 124,30 L142,34 C152,36 154,44 152,52 Z" class="car" {O}/>'
        s += f'<path d="M52,30 C58,20 66,16 80,16 V30 Z M86,16 C102,16 110,20 116,30 H86 Z" fill="#9FC0D4" {O}/>'
        s += f'<path d="M84,12 V52" stroke="{INK}" stroke-width="1" opacity=".5"/><path d="M14,40 H150" stroke="#FFFFFF" stroke-width="2" opacity=".35"/>'
    else:   # a little hatchback
        s += f'<path d="M14,52 C12,38 18,32 30,30 L52,28 C58,16 66,10 92,10 C112,10 122,14 130,30 C142,32 148,40 146,52 Z" class="car" {O}/>'
        s += f'<path d="M58,28 C62,18 68,14 88,14 V28 Z M94,14 C110,14 118,18 122,28 H94 Z" fill="#9FC0D4" {O}/>'
    s += f'<rect x="146" y="38" width="8" height="6" rx="2" fill="#F7E08A" {o1}/><rect x="6" y="38" width="8" height="6" rx="2" fill="#E5533D" {o1}/>'
    s += f'<path d="M66,36 h10" stroke="{INK}" stroke-width="2" stroke-linecap="round"/>'
    for cx in (40, 122): s += f'<circle cx="{cx}" cy="54" r="12" fill="#2B2B2B" {O}/><circle cx="{cx}" cy="54" r="5" fill="#C9C2B2" {o1}/>'
    return s
w('props/vehicles/car', '0 0 160 72', '80 66', car('sedan'), 'data-slots="car car2"')
w('props/vehicles/car-small', '0 0 160 72', '80 66', car('hatch'), 'data-slots="car car2"')

# ---------- Street signs at Bull Street intersections ----------
def sign(cross):
    s = f'<ellipse cx="20" cy="124" rx="10" ry="3" fill="{INK}" opacity=".18"/><rect x="18" y="20" width="5" height="104" fill="#3B4048" {o1}/>'
    s += f'<rect x="2" y="8" width="62" height="14" rx="2" fill="#2F6B4F" {o1}/><text x="33" y="19" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="9" fill="#FFFFFF">BULL ST</text>'
    s += f'<rect x="-22" y="24" width="64" height="14" rx="2" fill="#2F6B4F" {o1}/><text x="10" y="35" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="9" fill="#FFFFFF">{cross} ST</text>'
    return s
for cross in ('BAY', 'CONGRESS', 'HARRIS', 'CHARLTON', 'JONES', 'GORDON', 'GASTON'):
    w(f'props/street/sign-{cross.lower()}', '-24 0 92 128', '20 124', sign(cross))

# ---------- small street furniture ----------
w('props/street/hydrant', '0 0 24 34', '12 32', f'<ellipse cx="12" cy="32" rx="9" ry="2.4" fill="{INK}" opacity=".2"/><path d="M6,30 V12 C6,6 18,6 18,12 V30 Z" fill="#D8413A" {O}/><rect x="3" y="15" width="18" height="5" rx="2" fill="#B5332D" {o1}/><rect x="4" y="28" width="16" height="4" fill="#B5332D" {o1}/><circle cx="12" cy="6" r="2.4" fill="#B5332D" {o1}/>')
w('props/street/bin', '0 0 30 44', '15 42', f'<ellipse cx="15" cy="42" rx="12" ry="2.6" fill="{INK}" opacity=".2"/><path d="M4,10 H26 L24,42 H6 Z" fill="#2F5D50" {O}/>' + ''.join(f'<path d="M{8+k*5},14 V38" stroke="{INK}" stroke-opacity=".35" stroke-width="1"/>' for k in range(4)) + f'<path d="M2,10 C2,2 28,2 28,10 Z" fill="#2F5D50" {O}/>')
rack = f'<ellipse cx="50" cy="44" rx="46" ry="3" fill="{INK}" opacity=".18"/>' + ''.join(f'<path d="M{10+k*20},44 V24 A8,8 0 0,1 {26+k*20},24 V44" fill="none" stroke="#5E6670" stroke-width="3"/>' for k in range(4))
for k, col in enumerate(('#E8457A', '#3E8E7E')):
    bx = 18 + k * 40
    rack += f'<g transform="translate({bx} 18)"><circle cx="6" cy="18" r="8" fill="none" stroke="{INK}" stroke-width="2.4"/><circle cx="30" cy="18" r="8" fill="none" stroke="{INK}" stroke-width="2.4"/><path d="M6,18 L14,6 H26 L30,18 M14,6 L18,18 L26,6" fill="none" stroke="{col}" stroke-width="2.6" stroke-linejoin="round"/><path d="M12,4 h6" stroke="{INK}" stroke-width="2.6" stroke-linecap="round"/></g>'
w('props/street/bike-rack', '0 0 100 48', '50 44', rack)
stop = f'<ellipse cx="80" cy="106" rx="76" ry="5" fill="{INK}" opacity=".18"/>'
stop += f'<rect x="8" y="20" width="4" height="86" fill="#3B4048" {o1}/><rect x="148" y="20" width="4" height="86" fill="#3B4048" {o1}/>'
stop += f'<path d="M2,20 H158 L152,8 H8 Z" fill="#2F6B4F" {O}/><rect x="12" y="24" width="136" height="56" fill="#CFE6EE" opacity=".55" {o1}/>'
stop += f'<rect x="28" y="78" width="104" height="8" rx="2" fill="#8A6B4A" {o1}/><path d="M36,86 v14 M124,86 v14" stroke="{INK}" stroke-width="2.4"/>'
stop += f'<rect x="160" y="10" width="4" height="96" fill="#3B4048" {o1}/><rect x="150" y="2" width="30" height="22" rx="3" fill="#F2D55C" {o1}/><text x="165" y="17" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="9" fill="{INK}">DOT</text>'
stop += f'<rect x="40" y="34" width="40" height="30" rx="2" fill="#F7F1E3" {o1}/><path d="M46,42 h28 M46,48 h22 M46,54 h26" stroke="{INK}" stroke-width="1.4" opacity=".6"/>'
w('props/street/bus-stop', '0 0 186 112', '80 106', stop)
print('Bull Street assets written')
