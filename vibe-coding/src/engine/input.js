/* Input (Agent 1). Drag and pinch pan and zoom; a tap counts only if one pointer travelled under 6 CSS px
   and was not cancelled. Wheel zooms toward the pointer. Arrows/WASD pan, + and - zoom, 0 resets. */
(function () {
  const WS = (window.WS = window.WS || {});
  const CLICK_PX = 6;
  function attach(canvas, engine, onTap) {
    const cam = engine.camera;
    const pts = new Map();
    let gesture = null;   // { start: {x,y}, moved, multi, lastMid, lastDist }
    const mid = () => { const a = [...pts.values()]; return a.length === 1 ? a[0] : { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 }; };
    const dist = () => { const a = [...pts.values()]; return a.length < 2 ? 0 : Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); };
    const local = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

    canvas.addEventListener('pointerdown', (e) => {
      canvas.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, local(e));
      if (pts.size === 1) gesture = { start: local(e), moved: 0, multi: false, lastMid: mid(), lastDist: 0 };
      else if (gesture) { gesture.multi = true; gesture.lastMid = mid(); gesture.lastDist = dist(); }
      canvas.classList.add('grabbing');
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId) || !gesture) return;
      pts.set(e.pointerId, local(e));
      const m = mid();
      if (pts.size === 1) {
        const p = pts.get(e.pointerId);
        gesture.moved = Math.max(gesture.moved, Math.hypot(p.x - gesture.start.x, p.y - gesture.start.y));
        if (gesture.moved >= CLICK_PX || gesture.multi) cam.panBy(m.x - gesture.lastMid.x, m.y - gesture.lastMid.y);
      } else {
        const d = dist();
        if (gesture.lastDist > 0) cam.zoomAt(d / gesture.lastDist, m.x, m.y);
        cam.panBy(m.x - gesture.lastMid.x, m.y - gesture.lastMid.y);
        gesture.lastDist = d;
      }
      gesture.lastMid = m;
    });
    const end = (e, cancelled) => {
      if (!pts.has(e.pointerId)) return;
      const p = local(e);
      pts.delete(e.pointerId);
      if (pts.size === 0) {
        canvas.classList.remove('grabbing');
        const g = gesture; gesture = null;
        if (g && !cancelled && !g.multi && g.moved < CLICK_PX && Math.hypot(p.x - g.start.x, p.y - g.start.y) < CLICK_PX) onTap(e.clientX, e.clientY);
      } else if (gesture) { gesture.lastMid = mid(); gesture.lastDist = dist(); }
    };
    canvas.addEventListener('pointerup', (e) => end(e, false));
    canvas.addEventListener('pointercancel', (e) => end(e, true));
    canvas.addEventListener('lostpointercapture', (e) => end(e, true));
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const p = local(e);
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      cam.zoomAt(Math.exp(-dy * 0.0016), p.x, p.y);
    }, { passive: false });
    window.addEventListener('keydown', (e) => {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      const step = 80, k = e.key;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') cam.panBy(step, 0);
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') cam.panBy(-step, 0);
      else if (k === 'ArrowUp' || k === 'w' || k === 'W') cam.panBy(0, step);
      else if (k === 'ArrowDown' || k === 's' || k === 'S') cam.panBy(0, -step);
      else if (k === '+' || k === '=') cam.zoomAt(1.25);
      else if (k === '-' || k === '_') cam.zoomAt(1 / 1.25);
      else if (k === '0') cam.reset();
      else return;
      e.preventDefault();
    });
  }
  WS.input = { attach, CLICK_PX };
})();
