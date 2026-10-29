/* Sprint widget: an always-on-top coach via Document Picture-in-Picture (Chrome 116+),
   falling back to a draggable in-page mini widget. Same markup + CSS in both. */
(() => {
  const CSS = `
  .wg{--c:#e5322d;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;color:#111;background:#f5f5f3;display:grid;grid-template-rows:auto auto 1fr auto auto;height:100%;box-sizing:border-box;padding:14px 16px 14px;gap:8px;border-top:8px solid var(--c);-webkit-font-smoothing:antialiased}
  .wg *{box-sizing:border-box;margin:0}
  .wg-top{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
  .wg-top span:last-child{color:#74746f}
  .wg-clock{font-size:64px;font-weight:700;letter-spacing:-.05em;line-height:.9;font-variant-numeric:tabular-nums}
  .wg.paused .wg-clock{color:#a9a9a4}
  .wg-bar{height:4px;background:#ddd;position:relative;overflow:hidden}.wg-bar i{position:absolute;inset:0 auto 0 0;background:var(--c)}
  .wg-stage{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;display:flex;gap:6px;align-items:center}
  .wg-stage b{display:inline-block;background:var(--c);color:#fff;padding:3px 5px 2px}
  .wg-note{font-size:18px;font-weight:700;letter-spacing:-.02em;line-height:1.1;display:grid;gap:4px;align-content:start}
  .wg-note span+span{font-size:14px;font-weight:400;letter-spacing:0;color:#444}
  .wg-ctrl{display:flex;gap:6px}
  .wg button{appearance:none;font:inherit;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;border:1.5px solid #111;background:transparent;color:#111;padding:9px 10px 8px;cursor:pointer;flex:1}
  .wg button:hover{background:#111;color:#f5f5f3}
  .wg button.hot{background:var(--c);border-color:var(--c);color:#fff}
  .wg.flash{animation:wgf .9s ease 2}@keyframes wgf{50%{background:var(--c);color:#fff}}
  .wg-tip{font-size:11px;color:#74746f;line-height:1.25}
  .wg-segs{display:flex;gap:2px}.wg-segs i{flex:1;height:3px;background:#d6d6d1}.wg-segs i.d{background:#111}.wg-segs i.c{background:var(--c)}
  `;
  let pip = null; let root = null; let mode = null; let actions = null; let last = '';

  const build = (doc) => {
    const w = doc.createElement('div'); w.className = 'wg';
    w.innerHTML = '<div class="wg-top"><span data-k="title"></span><span data-k="count"></span></div>' +
      '<div><div class="wg-clock" data-k="clock">00:00</div><div class="wg-segs" data-k="segs"></div></div>' +
      '<div style="display:grid;gap:8px;align-content:start"><p class="wg-stage" data-k="stage"></p><div class="wg-note" data-k="note"></div></div>' +
      '<div class="wg-ctrl" data-k="ctrl"></div>' +
      '<p class="wg-tip">Coach only. Design in Figma, Illustrator, or on paper. Keep this timer open.</p>';
    w.addEventListener('click', (e) => { const b = e.target.closest('button[data-a]'); if (b && actions) actions[b.dataset.a](); });
    return w;
  };
  const q = (k) => root && root.querySelector(`[data-k="${k}"]`);

  const update = (v) => {
    if (!root) return;
    root.style.setProperty('--c', v.color);
    root.classList.toggle('paused', !!v.paused);
    q('title').textContent = v.title; q('count').textContent = v.count; q('clock').textContent = v.clock;
    const segs = q('segs'); if (segs.children.length !== v.total) { segs.innerHTML = ''; for (let i = 0; i < v.total; i++) segs.append(root.ownerDocument.createElement('i')); }
    [...segs.children].forEach((s, i) => { s.className = i < v.idx ? 'd' : i === v.idx ? 'c' : ''; });
    const key = v.stage + '|' + v.done + '|' + v.paused;
    if (key !== last) {
      last = key;
      q('stage').innerHTML = ''; const b = root.ownerDocument.createElement('b'); b.textContent = v.done ? 'Done' : String(v.idx + 1).padStart(2, '0'); q('stage').append(b, root.ownerDocument.createTextNode(v.stage));
      const n = q('note'); n.innerHTML = ''; v.notes.forEach((t) => { const s = root.ownerDocument.createElement('span'); s.textContent = t; n.append(s); });
      q('ctrl').innerHTML = v.done
        ? '<button class="hot" data-a="submit">Submit piece →</button>'
        : `<button data-a="pause">${v.paused ? 'Resume' : 'Pause'}</button><button data-a="next" title="Skip to the next stage">Next</button>` +
          (mode === 'pip' ? '<button data-a="back" title="Back to the Show Up tab">Show Up</button>' : window.Widget && window.Widget.supported ? '<button data-a="float" title="Float this timer on top of Figma and other apps">Float</button>' : '');
    }
  };
  const flash = () => { if (!root) return; root.classList.remove('flash'); void root.offsetWidth; root.classList.add('flash'); };

  const mountMini = () => {
    const box = document.getElementById('mini');
    if (!document.getElementById('wg-css')) { const s = document.createElement('style'); s.id = 'wg-css'; s.textContent = CSS; document.head.append(s); }
    box.innerHTML = ''; root = build(document); box.append(root); box.hidden = false; mode = 'mini'; last = '';
    // drag by the top strip
    let sx, sy, ox, oy;
    root.querySelector('.wg-top').onpointerdown = (e) => {
      sx = e.clientX; sy = e.clientY; const r = box.getBoundingClientRect(); ox = r.left; oy = r.top;
      const mv = (ev) => { box.style.left = Math.max(0, ox + ev.clientX - sx) + 'px'; box.style.top = Math.max(0, oy + ev.clientY - sy) + 'px'; box.style.right = 'auto'; box.style.bottom = 'auto'; };
      const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); };
      addEventListener('pointermove', mv); addEventListener('pointerup', up);
    };
  };

  // Must be called from a user gesture for PiP.
  const open = async (acts) => {
    actions = acts;
    if (pip && !pip.closed) { pip.focus(); return 'pip'; }
    if ('documentPictureInPicture' in window && !window.__noPiP) {
      try {
        pip = await window.documentPictureInPicture.requestWindow({ width: 300, height: 360 });
        const s = pip.document.createElement('style'); s.textContent = CSS + 'html,body{margin:0;height:100%;background:#f5f5f3}';
        pip.document.head.append(s); pip.document.title = 'Sprint coach';
        root = build(pip.document); pip.document.body.append(root); mode = 'pip'; last = '';
        document.getElementById('mini').hidden = true;
        pip.addEventListener('pagehide', () => { pip = null; if (mode === 'pip') { root = null; mode = null; if (actions && actions.onClosed) actions.onClosed(); } });
        return 'pip';
      } catch (e) { /* fall through to mini */ }
    }
    mountMini(); return 'mini';
  };
  const showMini = (acts) => { if (acts) actions = acts; if (mode !== 'mini') mountMini(); };
  const close = () => {
    const wasPip = mode === 'pip'; mode = null; root = null;
    if (wasPip && pip) { try { pip.close(); } catch (e) {} pip = null; }
    const box = document.getElementById('mini'); box.hidden = true; box.innerHTML = '';
  };
  window.Widget = { open, update, close, flash, showMini, get mode() { return mode; }, get supported() { return 'documentPictureInPicture' in window && !window.__noPiP; } };
})();
