/* THE WALL: a scrollable NYC street wall where every finished piece is wheatpasted. */
(() => {
  const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
  const seed = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; };
  const SCRAPS = ['#f2b705', '#ff3e9a', '#5b3fd1', '#12a150', '#e5322d', '#f4f1ea', '#111'];
  const SECTION = ['brick', 'ply', 'brick', 'black'];
  const PER_SECTION = 4;

  // Render the whole wall. pieces: oldest first. media(p) returns a fresh element.
  const render = (wall, pieces, media, onOpen) => {
    wall.innerHTML = '';
    const total = Math.max(pieces.length + 2, 8); // always a bit of empty wall to paste on
    let section = null;
    for (let i = 0; i < total; i++) {
      if (i % PER_SECTION === 0) {
        const k = SECTION[Math.floor(i / PER_SECTION) % SECTION.length];
        section = el('div', 'wsec ' + k); wall.append(section);
        if (k === 'ply') { const tag = el('div', 'ply-sign'); tag.innerHTML = '<b>POST NO BILLS</b>'; section.append(tag); }
        if (k === 'brick' && i === 0) { const s = el('div', 'street-sign'); s.innerHTML = '<b>Canal St</b>'; section.append(s); }
      }
      const p = pieces[i];
      const col = el('div', 'wcol'); section.append(col);
      const r = seed(p ? p.id : 'empty' + i);
      // old torn scraps behind, like layers of earlier paste-ups
      for (let k = 0, n = Math.floor(r() * 3); k < n; k++) {
        const s = el('i', 'scrap'); s.style.background = SCRAPS[Math.floor(r() * SCRAPS.length)];
        s.style.left = Math.round(r() * 70) + '%'; s.style.top = Math.round(r() * 85) + '%';
        s.style.width = 20 + Math.round(r() * 50) + 'px'; s.style.height = 14 + Math.round(r() * 40) + 'px';
        s.style.transform = 'rotate(' + Math.round(r() * 30 - 15) + 'deg)'; col.append(s);
      }
      if (!p) { col.classList.add('empty'); continue; }
      col.dataset.id = p.id;
      const copies = 2; // wheatpaste runs repeat the same poster
      for (let c = 0; c < copies; c++) {
        const wp = el('button', 'wp'); wp.type = 'button'; wp.title = p.prompt.title;
        wp.style.setProperty('--r', (r() * 2.4 - 1.2).toFixed(2) + 'deg');
        wp.style.setProperty('--dx', Math.round(r() * 8 - 4) + 'px');
        if (r() < 0.35) wp.classList.add('peel' + (r() < 0.5 ? 'L' : 'R'));
        if (r() < 0.2 && c === 1) wp.classList.add('torn');
        const m = el('div', 'wp-media'); m.append(media(p));
        wp.append(m, el('i', 'wrinkle'), el('i', 'sheen'));
        wp.onclick = () => onOpen(p.id);
        col.append(wp);
      }
      const cap = el('p', 'wcap'); cap.textContent = 'Day ' + String(p.day).padStart(2, '0') + ' · ' + p.prompt.focus; col.append(cap);
    }
  };

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  // The paste-up: roller lays glue, poster slaps on, roller topcoats, paper dries with wrinkles.
  const paste = async (wall, id) => {
    const col = wall.querySelector(`.wcol[data-id="${CSS.escape(id)}"]`); if (!col) return;
    const scroller = wall.parentElement;
    scroller.scrollTo({ left: Math.max(0, col.offsetLeft + col.parentElement.offsetLeft - scroller.clientWidth / 2 + col.clientWidth / 2), behavior: 'smooth' });
    const wps = [...col.querySelectorAll('.wp')];
    wps.forEach((w) => w.classList.add('pending'));
    await wait(650);
    const brush = el('div', 'brush'); brush.innerHTML = '<i class="roller"></i><i class="handle"></i>'; col.append(brush);
    for (const w of wps) {
      const glue = el('i', 'glue'); glue.style.top = w.offsetTop + 'px'; glue.style.height = w.offsetHeight + 'px'; col.append(glue);
      const top = w.offsetTop - 10; const bottom = w.offsetTop + w.offsetHeight - 30;
      brush.animate([{ transform: `translateY(${top}px)` }, { transform: `translateY(${bottom}px)` }, { transform: `translateY(${top + 40}px)` }], { duration: 700, easing: 'ease-in-out', fill: 'forwards' });
      glue.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 520, easing: 'ease-out', fill: 'forwards' });
      await wait(700);
      w.classList.remove('pending'); w.classList.add('slap');
      w.animate([
        { opacity: 0, transform: 'translate(var(--dx), -26px) rotate(calc(var(--r) * 4)) perspective(800px) rotateX(68deg) scale(1.06)' },
        { opacity: 1, offset: .55, transform: 'translate(var(--dx), 2px) rotate(var(--r)) perspective(800px) rotateX(-6deg) scale(1.01)' },
        { opacity: 1, transform: 'translate(var(--dx), 0) rotate(var(--r)) perspective(800px) rotateX(0) scale(1)' }
      ], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' });
      await wait(420);
      brush.animate([{ transform: `translateY(${top}px)` }, { transform: `translateY(${bottom}px)` }], { duration: 560, easing: 'ease-in-out', fill: 'forwards' });
      w.querySelector('.sheen').animate([{ opacity: .9, backgroundPosition: '0 -200%' }, { opacity: .5, backgroundPosition: '0 200%', offset: .6 }, { opacity: 0, backgroundPosition: '0 200%' }], { duration: 1600, easing: 'ease-out' });
      await wait(560);
      glue.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, fill: 'forwards' }).onfinish = () => glue.remove();
      w.classList.add('drying'); setTimeout(() => w.classList.remove('drying', 'slap'), 1800);
    }
    brush.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(-60px)' }], { duration: 400, fill: 'forwards' }).onfinish = () => brush.remove();
    await wait(400);
  };

  window.Wall = { render, paste };
})();
