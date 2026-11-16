/* Input (Agent 1). One finger or the mouse drags the world; two fingers pinch-zoom around their midpoint.
   A tap counts only if a single pointer travelled under CLICK_PX (6 CSS px for a mouse, 10 for a finger)
   and the gesture was never multi-touch or cancelled. The wheel zooms smoothly toward the pointer;
   a trackpad two-finger swipe pans and a trackpad pinch (ctrl+wheel) zooms. Arrows/WASD pan, + and - zoom,
   0 resets to the home view. */
(function () {
  const WS = (window.WS = window.WS || {});
  const CLICK_PX = 6, TOUCH_CLICK_PX = 10;
  function attach(canvas, engine, onTap) {
    const cam = engine.camera;
    const pts = new Map();
    let gesture = null;   // { start, moved, multi, lastMid, lastDist, touch }
    const mid = () => { const a = [...pts.values()]; return a.length === 1 ? a[0] : { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 }; };
    const dist = () => { const a = [...pts.values()]; return a.length < 2 ? 0 : Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); };
    const local = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const slop = () => (gesture && gesture.touch ? TOUCH_CLICK_PX : CLICK_PX);

    canvas.addEventListener('pointerdown', (e) => {
      if (pts.size >= 2) return;                       // a third finger is ignored rather than jumping the view
      canvas.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, local(e));
      if (pts.size === 1) gesture = { start: local(e), moved: 0, multi: false, lastMid: mid(), lastDist: 0, touch: e.pointerType === 'touch' };
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
        if (gesture.moved >= slop() || gesture.multi) cam.panBy(m.x - gesture.lastMid.x, m.y - gesture.lastMid.y);
      } else {
        // pinch: scale about the midpoint, then follow the midpoint so the pinched spot stays under the fingers
        const d = dist();
        if (gesture.lastDist > 0 && d > 0) cam.zoomAt(d / gesture.lastDist, gesture.lastMid.x, gesture.lastMid.y);
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
        const s = g && g.touch ? TOUCH_CLICK_PX : CLICK_PX;
        if (g && !cancelled && !g.multi && g.moved < s && Math.hypot(p.x - g.start.x, p.y - g.start.y) < s) onTap(e.clientX, e.clientY, { touch: g.touch });
      } else if (gesture) { gesture.lastMid = mid(); gesture.lastDist = dist(); }   // 2 -> 1 finger: no jump
    };
    canvas.addEventListener('pointerup', (e) => end(e, false));
    canvas.addEventListener('pointercancel', (e) => end(e, true));
    canvas.addEventListener('lostpointercapture', (e) => end(e, true));

    // Wheel: normalise lines and pages to pixels and cap each event, so a fast mouse wheel never jumps
    // several zoom levels at once. Smooth zoom (engine.camera.zoomSmooth) animates toward the target.
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const p = local(e);
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? canvas.clientHeight : 1;
      let dx = e.deltaX * unit, dy = e.deltaY * unit;
      if (e.ctrlKey) {                                   // trackpad pinch (and ctrl+wheel): fine-grained zoom
        cam.zoomSmooth(Math.exp(-Math.max(-60, Math.min(60, dy)) * 0.012), p.x, p.y);
      } else if (e.deltaMode === 0 && Math.abs(dx) > 1.5) { // trackpad two-finger swipe: pan
        cam.panBy(-dx, -dy);
      } else {
        dy = Math.max(-120, Math.min(120, dy));
        cam.zoomSmooth(Math.exp(-dy * 0.0028), p.x, p.y);
      }
    }, { passive: false });
    // Stop the page itself from scrolling or rubber-banding on touch devices.
    for (const ev of ['touchmove', 'gesturestart']) canvas.addEventListener(ev, (e) => e.preventDefault(), { passive: false });

    window.addEventListener('keydown', (e) => {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const step = 90, k = e.key;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') cam.panBy(step, 0);
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') cam.panBy(-step, 0);
      else if (k === 'ArrowUp' || k === 'w' || k === 'W') cam.panBy(0, step);
      else if (k === 'ArrowDown' || k === 's' || k === 'S') cam.panBy(0, -step);
      else if (k === '+' || k === '=') cam.zoomSmooth(1.35);
      else if (k === '-' || k === '_') cam.zoomSmooth(1 / 1.35);
      else if (k === '0') cam.reset();
      else return;
      e.preventDefault();
    });
  }
  WS.input = { attach, CLICK_PX, TOUCH_CLICK_PX };
})();
