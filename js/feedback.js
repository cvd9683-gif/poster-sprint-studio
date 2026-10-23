/* Teaching feedback: zoom into each annotated region, then a redesign suggestion with a before/after slider. */
(() => {
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  let st = null;

  const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = src; });

  // A drawn mockup of the suggested moves, used when no AI image edit is available.
  const mockup = async (src, moves) => {
    const img = await loadImg(src); const W = img.naturalWidth || 900, H = img.naturalHeight || 1200;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    g.drawImage(img, 0, 0, W, H);
    const u = Math.max(W, H) / 400;
    moves.forEach((m, i) => {
      const b = m.box; let x = b.x * W, y = b.y * H, w = b.w * W, h = b.h * H;
      const a = m.action.toLowerCase();
      let k = 1; const mx = a.match(/(\d+(?:\.\d+)?)\s*x\b/); const pc = a.match(/(\d+)\s*%/);
      if (mx) k = parseFloat(mx[1]); else if (/(reduce|shrink|smaller)/.test(a)) k = pc ? 1 - parseInt(pc[1]) / 100 : .6; else if (/(enlarge|bigger|scale up|increase|larger)/.test(a)) k = pc ? 1 + parseInt(pc[1]) / 100 : 1.5;
      k = Math.max(.3, Math.min(2.5, k));
      if (m.color) { g.save(); g.globalAlpha = .82; g.fillStyle = m.color; g.globalCompositeOperation = 'source-over'; g.fillRect(x, y, w, h); g.restore();
        // keep the original shapes visible as a knockout
        g.save(); g.globalAlpha = .55; g.globalCompositeOperation = 'luminosity'; g.drawImage(img, b.x * W, b.y * H, w, h, x, y, w, h); g.restore(); }
      if (k !== 1) {
        const nw = w * k, nh = h * k, nx = x + (w - nw) / 2, ny = y + (h - nh) / 2;
        g.save(); g.globalAlpha = .9; g.drawImage(img, b.x * W, b.y * H, w, h, nx, ny, nw, nh); g.restore();
        g.save(); g.setLineDash([4 * u, 3 * u]); g.strokeStyle = '#111'; g.lineWidth = 1.2 * u; g.strokeRect(x, y, w, h); g.restore();
        x = nx; y = ny; w = nw; h = nh;
      }
      g.lineWidth = 2.2 * u; g.strokeStyle = '#ff3e9a'; g.strokeRect(x, y, w, h);
      const r = 11 * u; g.fillStyle = '#ff3e9a'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.font = `700 ${13 * u}px Helvetica, Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(i + 1), x, y + u);
    });
    return c.toDataURL('image/jpeg', .9);
  };

  const smallData = async (src) => { const img = await loadImg(src); const s = Math.min(1, 1024 / Math.max(img.naturalWidth, img.naturalHeight)); const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s); const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', .86); };

  const zoomTo = (box) => {
    const z = st.root.querySelector('.fb-zoom'); const f = st.root.querySelector('.fb-frame');
    const W = f.clientWidth, H = f.clientHeight;
    if (!box) { z.style.transform = 'translate(0,0) scale(1)'; return; }
    const k = Math.max(1.35, Math.min(3.2, .95 / box.w, .7 / box.h));
    const cx = (box.x + box.w / 2) * W, cy = (box.y + box.h / 2) * H;
    let tx = W / 2 - cx * k, ty = H / 2 - cy * k;
    tx = Math.min(0, Math.max(W - W * k, tx)); ty = Math.min(0, Math.max(H - H * k, ty));
    z.style.transform = `translate(${tx}px,${ty}px) scale(${k})`;
  };
  const mark = (box, kind, n) => {
    const m = st.root.querySelector('.fb-mark');
    if (!box) { m.hidden = true; return; }
    m.hidden = false; m.className = 'fb-mark on ' + kind; m.dataset.n = n;
    Object.assign(m.style, { left: box.x * 100 + '%', top: box.y * 100 + '%', width: box.w * 100 + '%', height: box.h * 100 + '%' });
    m.style.animation = 'none'; void m.offsetWidth; m.style.animation = '';
  };

  const side = () => st.root.querySelector('.fb-side');
  const nav = (prev, next, nextLabel) => {
    const r = el('div', 'fb-nav');
    const p = el('button', 'btn quiet', 'Back'); p.disabled = !prev; p.onclick = prev; r.append(p);
    const n = el('button', 'btn hot', nextLabel || 'Next'); n.onclick = next; r.append(n);
    return r;
  };

  const show = (i) => {
    st.i = i; const c = st.crit; const notes = c.notes || []; const s = side(); s.innerHTML = '';
    const steps = notes.length + 2; // notes, redesign, wrap
    const dots = el('div', 'fb-dots'); for (let k = 0; k < steps; k++) dots.append(el('i', k === i ? 'on' : k < i ? 'd' : '')); s.append(dots);
    st.root.querySelector('.fb-ab').hidden = true; st.root.querySelector('.fb-frame').hidden = false;
    if (i < notes.length) {
      const n = notes[i];
      zoomTo(n.box); mark(n.box, n.kind, i + 1);
      s.append(el('p', 'fb-kind ' + n.kind, n.kind === 'fix' ? 'Fix' : 'Working'), el('h2', 'fb-h', n.title), el('p', 'fb-p', n.note));
      if (n.fix) { const f = el('div', 'fb-fix'); f.append(el('b', '', 'Try'), el('p', '', n.fix)); s.append(f); }
      s.append(nav(i ? () => show(i - 1) : null, () => show(i + 1)));
    } else if (i === notes.length) {
      zoomTo(null); mark(null);
      s.append(el('p', 'fb-kind fix', 'Redesign'), el('h2', 'fb-h', c.redesign && c.redesign.summary ? c.redesign.summary : 'One version, pushed further.'));
      const ol = el('ol', 'fb-moves'); ((c.redesign && c.redesign.moves) || []).forEach((m) => { const li = el('li'); if (m.color) { const sw = el('i', 'sw'); sw.style.background = m.color; li.append(sw); } li.append(el('span', '', m.action)); ol.append(li); }); s.append(ol);
      const note = el('p', 'fb-small', ''); s.append(note);
      s.append(nav(() => show(i - 1), () => show(i + 1)));
      showRedesign(note);
    } else {
      zoomTo(null); mark(null);
      s.append(el('p', 'fb-kind', 'Your read'), el('h2', 'fb-h', '“' + (c.reply || c.works) + '”'));
      if (c.push) { const f = el('div', 'fb-fix'); f.append(el('b', '', 'Next time'), el('p', '', c.push)); s.append(f); }
      const sc = el('p', 'fb-score'); sc.textContent = (st.piece.prompt.focus || 'Focus') + ' ' + c.score + '/5'; s.append(sc);
      const r = nav(() => show(i - 1), () => st.opts.onWall && st.opts.onWall(), 'Back to the wall'); s.append(r);
      if (st.opts.remove) { const d = el('button', 'fb-link', 'Take it down'); d.onclick = st.opts.remove; s.append(d); }
    }
  };

  const showRedesign = async (note) => {
    const ab = st.root.querySelector('.fb-ab'); st.root.querySelector('.fb-frame').hidden = true; ab.hidden = false;
    const after = ab.querySelector('.after img');
    if (!st.after) {
      note.textContent = 'Drawing the redesign…'; after.src = st.src;
      st.after = (async () => {
        const moves = (st.crit.redesign && st.crit.redesign.moves) || [];
        try {
          if (location.protocol !== 'file:' && !st.piece.svg) {
            const r = await fetch('/api/redesign', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ image: await smallData(st.src), moves, summary: st.crit.redesign && st.crit.redesign.summary }) });
            const j = await r.json(); if (j.available && j.image) return { src: j.image, ai: true };
          }
        } catch (e) {}
        return { src: await mockup(st.src, moves), ai: false };
      })();
    }
    const a = await st.after; if (!st || st.i !== (st.crit.notes || []).length) return;
    after.src = a.src; note.textContent = a.ai ? 'AI redesign. Drag to compare.' : 'Suggested moves, drawn on your poster. Drag to compare.';
  };

  const open = (piece, src, critP, opts) => {
    close();
    const root = $('fb'); root.innerHTML = ''; root.hidden = false;
    st = { piece, src, opts: opts || {}, root, i: 0, crit: null, after: null };
    const stage = el('div', 'fb-stage');
    const frame = el('div', 'fb-frame'); const zoom = el('div', 'fb-zoom'); const img = el('img'); img.src = src; img.alt = '';
    const m = el('div', 'fb-mark'); m.hidden = true; zoom.append(img, m); frame.append(zoom);
    const ab = el('div', 'fb-ab'); ab.hidden = true;
    ab.innerHTML = '<div class="before"><img alt=""></div><div class="after"><img alt=""></div><input type="range" min="0" max="100" value="50" aria-label="Compare"><span class="tag l">Before</span><span class="tag r">After</span>';
    ab.querySelector('.before img').src = src;
    const rng = ab.querySelector('input'); const setR = () => ab.style.setProperty('--p', rng.value + '%'); rng.oninput = setR; setR();
    stage.append(frame, ab);
    const x = el('button', 'fb-x', '×'); x.onclick = () => (opts && opts.onWall ? opts.onWall() : close());
    const sd = el('div', 'fb-side');
    root.append(stage, sd, x);
    img.onload = () => { const r = img.naturalWidth / img.naturalHeight; root.style.setProperty('--ar', r); };
    const stat = el('p', 'fb-status'); sd.append(el('p', 'fb-kind', 'Critique'), el('h2', 'fb-h loading', 'Reading your piece'), stat);
    st.onStatus = (e) => { stat.textContent = e.detail || ''; };
    frame.classList.add('scanning');
    critP.then((c) => { if (!st || st.piece !== piece) return; frame.classList.remove('scanning'); st.crit = c; show(0); })
      .catch((err) => {
        if (!st || st.piece !== piece) return; frame.classList.remove('scanning'); sd.innerHTML = '';
        sd.append(el('p', 'fb-kind', 'Critique'), el('h2', 'fb-h', err.message || 'Feedback is unavailable.'), el('p', 'fb-status', 'Your piece is saved on the wall.'));
        if (opts && opts.retry) { const b = el('button', 'btn hot', 'Try again'); b.onclick = () => open(piece, src, opts.retry(), opts); sd.append(b); }
        const w = el('button', 'btn quiet', 'Back to the wall'); w.onclick = () => (opts && opts.onWall ? opts.onWall() : close()); sd.append(w);
      });
  };
  window.addEventListener('critique-status', (e) => { if (st && st.onStatus) st.onStatus(e); });
  const close = () => { const r = $('fb'); if (r) { r.hidden = true; r.innerHTML = ''; } st = null; };
  document.addEventListener('keydown', (e) => {
    if (!st || !st.crit) { if (e.key === 'Escape' && st) close(); return; }
    const n = (st.crit.notes || []).length + 2;
    if (e.key === 'ArrowRight' && st.i < n - 1) show(st.i + 1);
    if (e.key === 'ArrowLeft' && st.i > 0) show(st.i - 1);
    if (e.key === 'Escape') close();
  });
  window.Feedback = { open, close };
})();
