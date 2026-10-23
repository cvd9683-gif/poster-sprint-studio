/* Challenge a friend: 1v1 over WebRTC (PeerJS public broker, no backend).
   Host is authoritative: it owns the phase + end timestamps; the guest corrects for clock offset. */
(() => {
  const $ = (id) => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const pad = (n) => String(n).padStart(2, '0');
  const clock = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return pad(Math.floor(s / 60)) + ':' + pad(s % 60); };
  const params = new URLSearchParams(location.search);
  const FAST = params.has('fast');
  const TURN_MS = FAST ? 10000 : 150000;
  const PREFIX = 'showup-duel-';

  const CSS = `
  .duel{position:fixed;inset:0;z-index:60;background:var(--paper,#f5f5f3);color:#111;display:grid;grid-template-rows:auto 1fr;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif}
  .duel *{box-sizing:border-box}
  .d-top{display:flex;justify-content:space-between;align-items:center;padding:18px 28px;border-bottom:1px solid #cdcdc8}
  .d-top b{font-size:13px;letter-spacing:.08em;text-transform:uppercase}
  .d-x{font-size:28px;line-height:1;padding:4px 8px}
  .d-body{overflow:auto;padding:36px 28px 140px;display:grid;align-content:start;gap:26px;max-width:1100px;width:100%;margin:0 auto}
  .d-h{font-size:clamp(34px,4.4vw,64px);font-weight:700;letter-spacing:-.045em;line-height:.95}
  .d-p{font-size:19px;max-width:34em;color:#333}
  .d-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
  .duel .d-link{font-size:17px;padding:13px 14px;border:1.5px solid #111;background:#fff;min-width:min(520px,100%);flex:1}
  .duel .d-name{font-size:17px;padding:12px 14px;border:0;border-bottom:1.5px solid #111;background:transparent;width:240px;outline:none;border-radius:0;height:auto}
  .d-cams{display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:760px}
  .d-tile{position:relative;aspect-ratio:4/3;background:#1b1b1b;overflow:hidden}
  .d-tile video{width:100%;height:100%;object-fit:cover;display:block}
  .d-tile .who{position:absolute;left:10px;bottom:8px;color:#fff;font-size:13px;font-weight:700;text-shadow:0 1px 3px rgba(0,0,0,.6)}
  .d-tile .ini{position:absolute;inset:0;display:grid;place-items:center;color:#777;font-size:44px;font-weight:700}
  .d-tile.off video{visibility:hidden}.d-tile:not(.off) .ini{display:none}
  .d-tile.wait .ini{font-size:15px;font-weight:400}
  .d-drop{border:1.5px dashed #999;min-height:300px;display:grid;place-items:center;cursor:pointer;background:#fff;position:relative}
  .d-drop img{max-width:100%;max-height:60vh;display:block}
  .d-drop span{font-size:17px;color:#74746f}
  .d-stage{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:22px;align-items:start}
  .d-stage .art{background:#fff;display:grid;place-items:center;min-height:56vh}
  .d-stage .art img{max-width:100%;max-height:66vh;display:block}
  .d-side{display:grid;gap:16px}
  .d-big{font-size:56px;font-weight:700;letter-spacing:-.05em;font-variant-numeric:tabular-nums;line-height:.9}
  .d-score{font-size:120px;font-weight:700;letter-spacing:-.06em;line-height:.85}
  .d-score small{font-size:36px;color:#74746f;letter-spacing:-.02em}
  .d-vs{display:grid;grid-template-columns:1fr 1fr;gap:22px}
  .d-vs figure{display:grid;gap:10px}.d-vs img{width:100%;max-height:52vh;object-fit:contain;background:#fff}
  .d-vs figcaption{font-size:22px;font-weight:700;letter-spacing:-.02em}
  .d-mid{color:#74746f;font-size:15px}
  /* the camera bar: in-page (bottom) or inside Document PiP */
  .dbar{--c:#e5322d;display:flex;align-items:stretch;gap:10px;background:#111;color:#f5f5f3;padding:8px;height:120px;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;border-top:6px solid var(--c);box-sizing:border-box}
  .dbar *{box-sizing:border-box;margin:0}
  .duel .dbar{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);width:min(760px,calc(100% - 36px));z-index:61;box-shadow:0 10px 30px rgba(0,0,0,.25)}
  .dbar .b-time{display:grid;align-content:center;padding:0 14px;min-width:170px}
  .dbar .b-clock{font-size:52px;font-weight:700;letter-spacing:-.05em;line-height:.9;font-variant-numeric:tabular-nums}
  .dbar .b-lab{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#a9a9a4;margin-top:6px}
  .dbar .d-tile{aspect-ratio:4/3;height:100%;flex:none}
  .dbar .d-tile .ini{font-size:26px}
  .dbar .b-ctrl{margin-left:auto;display:grid;gap:6px;align-content:center}
  .dbar button{appearance:none;font:inherit;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;border:1.5px solid #f5f5f3;background:transparent;color:#f5f5f3;padding:8px 12px 7px;cursor:pointer}
  .dbar button.on{background:#f5f5f3;color:#111}
  body.pipdoc{margin:0;background:#111;overflow:hidden}body.pipdoc .dbar{height:100vh}
  `;
  const style = el('style'); style.textContent = CSS; document.head.append(style);

  let S = null; // session

  const blankStream = () => { const c = document.createElement('canvas'); c.width = 64; c.height = 48; c.getContext('2d').fillRect(0, 0, 64, 48); return c.captureStream(1); };
  const getCam = async () => {
    try { return await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: true }); } catch (e) {}
    try { return await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } }); } catch (e) {}
    try { return await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) {}
    return null;
  };
  const toSmall = (blob, max = 1400) => new Promise((res, rej) => {
    const img = new Image(); const u = URL.createObjectURL(blob);
    img.onload = () => { const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight)); const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s); const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); c.toBlob(res, 'image/jpeg', 0.88); };
    img.onerror = () => rej(new Error('bad image')); img.src = u;
  });
  const b2d = (b) => new Promise((r) => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
  const d2b = async (d) => (await fetch(d)).blob();

  // ---- tiles (one video element per person, reused by lobby, bar and stage) ----
  const tile = (who) => {
    const t = el('div', 'd-tile off'); const v = el('video'); v.autoplay = true; v.playsInline = true; if (who === 'me') v.muted = true;
    t.append(v, el('div', 'ini', who === 'me' ? 'You' : '…'), el('div', 'who', who === 'me' ? 'You' : 'Friend')); return t;
  };
  const setTile = (t, stream, camOn, name) => {
    const v = t.querySelector('video'); if (stream && v.srcObject !== stream) { v.srcObject = stream; v.play().catch(() => {}); }
    t.classList.toggle('off', !camOn); if (name != null) { t.querySelector('.who').textContent = name; t.querySelector('.ini').textContent = (name || '?').slice(0, 1).toUpperCase(); }
  };
  const replay = (root) => root.querySelectorAll('video').forEach((v) => v.play().catch(() => {}));

  // ---- shell ----
  const open = () => {
    const root = el('div', 'duel'); root.id = 'duel';
    const top = el('div', 'd-top'); top.append(el('b', '', 'Challenge a friend')); const x = el('button', 'd-x', '×'); x.title = 'Leave'; x.onclick = () => leave(); top.append(x);
    const body = el('div', 'd-body');
    root.append(top, body); document.body.append(root);
    return { root, body };
  };
  const leave = () => {
    if (S && S.phase !== 'done' && S.phase !== 'judge' && !confirm('Leave the challenge?')) return;
    if (S) { try { S.conn && S.conn.close(); S.peer && S.peer.destroy(); } catch (e) {} if (S.local) S.local.getTracks().forEach((t) => t.stop()); closePip(); clearInterval(S.timer); S.ui.root.remove(); }
    S = null; history.replaceState(null, '', location.pathname);
  };

  const send = (m) => { if (S && S.conn && S.conn.open) S.conn.send(m); };
  const now = () => Date.now() + (S && !S.host ? S.offset : 0); // host-clock time

  // ---- bar ----
  const buildBar = () => {
    const bar = el('div', 'dbar'); bar.style.setProperty('--c', S.color || '#e5322d');
    const t = el('div', 'b-time'); S.bClock = el('div', 'b-clock', '00:00'); S.bLab = el('div', 'b-lab', ''); t.append(S.bClock, S.bLab);
    const ctrl = el('div', 'b-ctrl');
    const mic = el('button', '', 'Mute'); mic.onclick = () => { const a = S.local && S.local.getAudioTracks()[0]; if (!a) return; a.enabled = !a.enabled; mic.classList.toggle('on', !a.enabled); mic.textContent = a.enabled ? 'Mute' : 'Muted'; };
    S.popBtn = el('button', '', 'Pop out'); S.popBtn.onclick = () => (S.pip ? closePip() : openPip());
    S.popBtn.hidden = !('documentPictureInPicture' in window);
    ctrl.append(mic, S.popBtn);
    bar.append(t, S.tMe, S.tThem, ctrl); S.bar = bar; S.ui.root.append(bar);
  };
  const openPip = async () => {
    if (!('documentPictureInPicture' in window) || S.pip) return;
    try {
      const w = await documentPictureInPicture.requestWindow({ width: 640, height: 132 });
      const st = w.document.createElement('style'); st.textContent = CSS; w.document.head.append(st); w.document.body.className = 'pipdoc';
      w.document.body.append(S.bar); S.pip = w; S.popBtn.textContent = 'Back'; replay(S.bar);
      w.addEventListener('pagehide', () => { if (S && S.bar) { S.ui.root.append(S.bar); S.pip = null; S.popBtn.textContent = 'Pop out'; replay(S.bar); } });
    } catch (e) {}
  };
  const closePip = () => { if (S && S.pip) { try { S.pip.close(); } catch (e) {} } };

  // ---- phases ----
  const render = () => {
    const b = S.ui.body; b.innerHTML = '';
    const P = S.prompt;
    if (S.phase === 'lobby') {
      b.append(el('h1', 'd-h', S.host ? 'Send this link' : (P ? P.title : 'Joining…')));
      if (S.host) {
        const row = el('div', 'd-row'); const inp = el('input', 'd-link'); inp.readOnly = true; inp.value = S.link; inp.onclick = () => inp.select();
        const cp = el('button', 'btn', 'Copy'); cp.onclick = async () => { try { await navigator.clipboard.writeText(S.link); } catch (e) { inp.select(); document.execCommand('copy'); } cp.textContent = 'Copied'; };
        row.append(inp, cp); b.append(row);
      } else if (P) b.append(el('p', 'd-p', P.brief));
      const cams = el('div', 'd-cams'); cams.append(S.tMe, S.tThem); b.append(cams);
      const row = el('div', 'd-row'); const nm = el('input', 'd-name'); nm.placeholder = 'Your name'; nm.value = S.name || ''; nm.maxLength = 24;
      nm.oninput = () => { S.name = nm.value.trim(); localStorage.setItem('showup.name', S.name); setTile(S.tMe, null, S.camOn, S.name || 'You'); send({ t: 'name', name: S.name }); };
      row.append(nm);
      if (S.host) { const go = el('button', 'btn hot', S.connected ? 'Start' : 'Waiting for friend'); go.disabled = !S.connected; go.id = 'duelStart'; go.onclick = () => hostStart(); row.append(go); }
      else row.append(el('span', 'd-mid', S.connected ? 'Waiting for ' + (S.them || 'host') + ' to start' : 'Connecting…'));
      b.append(row);
      return;
    }
    if (!S.bar) buildBar();
    if (S.phase === 'sprint' || S.phase === 'upload') {
      b.append(el('p', 'd-mid', P.format + ' · ' + P.skill), el('h1', 'd-h', P.title), el('p', 'd-p', P.brief));
      if (P.constraint) b.append(el('p', 'd-p', P.constraint));
      const dz = el('div', 'd-drop'); dz.id = 'duelDrop'; const fi = el('input'); fi.type = 'file'; fi.accept = 'image/*'; fi.hidden = true; fi.id = 'duelFile';
      if (S.mine) { const im = el('img'); im.src = URL.createObjectURL(S.mine); dz.append(im); } else dz.append(el('span', '', S.phase === 'upload' ? 'Time. Drop your piece.' : 'Drop your piece when done'));
      dz.append(fi); dz.onclick = () => fi.click(); fi.onchange = () => fi.files[0] && handIn(fi.files[0]);
      dz.ondragover = (e) => e.preventDefault(); dz.ondrop = (e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handIn(f); };
      b.append(dz);
      if (S.mine) b.append(el('p', 'd-mid', S.theirs ? '' : 'Waiting for ' + (S.them || 'friend')));
      return;
    }
    if (S.phase === 'show') {
      const meUp = (S.turn === 'host') === S.host;
      const st = el('div', 'd-stage'); const art = el('div', 'art'); const im = el('img'); im.src = URL.createObjectURL(meUp ? S.mine : S.theirs); art.append(im);
      const sd = el('div', 'd-side');
      sd.append(el('p', 'd-mid', 'Show & tell'), el('h2', 'd-h', meUp ? 'You' : (S.them || 'Friend')));
      const big = meUp ? S.tMe : S.tThem; S.stageTile = big; const holder = el('div'); holder.append(big); sd.append(holder);
      S.turnClock = el('div', 'd-big', clock(S.turnEnd - now())); sd.append(S.turnClock);
      if (meUp) { const d = el('button', 'btn hot', 'Done'); d.id = 'duelDone'; d.onclick = () => (S.host ? hostNextTurn() : send({ t: 'done' })); sd.append(d); }
      st.append(art, sd); b.append(st);
      return;
    }
    if (S.phase === 'judge') {
      const c = S.crit;
      b.append(el('p', 'd-mid', 'Judged'));
      if (!c) { b.append(el('h1', 'd-h', S.critErr ? 'The critic is busy.' : 'Judging…')); if (S.critErr) { const r = el('button', 'btn hot', 'Try again'); r.onclick = () => judge(); b.append(r); } return; }
      const sc = el('div', 'd-score'); sc.innerHTML = c.score + '<small>/5</small>'; sc.id = 'duelScore'; b.append(sc);
      if (c.works) b.append(el('p', 'd-p', c.works));
      const row = el('div', 'd-row');
      const nb = el('button', 'btn', 'Notes'); nb.onclick = () => S.myId && window.App.openPiece(S.myId);
      const cb = el('button', 'btn quiet' + (S.cmpMe ? ' on' : ''), S.cmpMe ? (S.cmpThem ? 'Comparing' : 'Waiting for ' + (S.them || 'friend')) : 'Compare'); cb.id = 'duelCompare';
      cb.onclick = () => { S.cmpMe = !S.cmpMe; send({ t: 'cmp', on: S.cmpMe, score: S.crit.score }); render(); };
      const wb = el('button', 'btn quiet', 'Wall'); wb.onclick = async () => { const ids = [S.myId, S.theirId].filter(Boolean); S.phase = 'done'; leave(); await window.App.showWall(ids); };
      row.append(nb, cb, wb); b.append(row);
      if (S.cmpMe && S.cmpThem && S.themScore != null) {
        const vs = el('div', 'd-vs'); vs.id = 'duelVs';
        [[S.mine, 'You', c.score], [S.theirs, S.them || 'Friend', S.themScore]].forEach(([blob, n, s]) => { const f = el('figure'); const i = el('img'); i.src = URL.createObjectURL(blob); f.append(i, el('figcaption', '', n + ' · ' + s + '/5')); vs.append(f); });
        b.append(vs);
      }
    }
  };

  const tick = () => {
    if (!S || !S.bClock) return;
    const t = now();
    if (S.phase === 'sprint') { S.bClock.textContent = clock(S.endAt - t); S.bLab.textContent = S.prompt.title; if (S.host && t >= S.endAt) hostPhase({ phase: 'upload' }); }
    else if (S.phase === 'upload') { S.bClock.textContent = '00:00'; S.bLab.textContent = 'Hand in'; }
    else if (S.phase === 'show') { const r = S.turnEnd - t; S.bClock.textContent = clock(r); S.bLab.textContent = (S.turn === 'host') === S.host ? 'You present' : (S.them || 'Friend') + ' presents'; if (S.turnClock) S.turnClock.textContent = clock(r); if (S.host && r <= 0) hostNextTurn(); }
    else { S.bClock.textContent = '—'; S.bLab.textContent = 'Judged'; }
  };

  // host-only transitions
  const hostPhase = (m) => { apply(m); send(Object.assign({ t: 'phase' }, m)); };
  const hostStart = () => { openPip(); hostPhase({ phase: 'sprint', endAt: Date.now() + (FAST ? 25000 : S.sprintMin * 60000) }); };
  const hostCheck = () => { if (S.host && S.mine && S.theirs && (S.phase === 'sprint' || S.phase === 'upload')) hostPhase({ phase: 'show', turn: 'host', turnEnd: Date.now() + TURN_MS }); };
  const hostNextTurn = () => { if (S.phase !== 'show') return; if (S.turn === 'host') hostPhase({ phase: 'show', turn: 'guest', turnEnd: Date.now() + TURN_MS }); else hostPhase({ phase: 'judge' }); };

  const apply = (m) => {
    const was = S.phase; Object.assign(S, { phase: m.phase }, m.endAt ? { endAt: m.endAt } : {}, m.turn ? { turn: m.turn, turnEnd: m.turnEnd } : {});
    if (S.phase === 'show') { /* return stage tile to bar on each turn */ if (S.bar) { S.bar.insertBefore(S.tMe, S.bar.children[1]); S.bar.insertBefore(S.tThem, S.tMe.nextSibling); } }
    if (S.phase === 'judge' && was !== 'judge') { if (S.bar) { S.bar.insertBefore(S.tMe, S.bar.children[1]); S.bar.insertBefore(S.tThem, S.tMe.nextSibling); } judge(); }
    render(); tick(); if (S.bar) replay(S.bar);
  };

  const handIn = async (f) => {
    if (!/^image\//.test(f.type)) return;
    S.mine = await toSmall(f); send({ t: 'piece', img: await b2d(S.mine) }); render(); hostCheck();
  };

  const judge = async () => {
    S.critErr = false; render();
    const P = S.prompt;
    if (!S.myId) {
      const base = { prompt: P, format: S.format, name: 'vs ' + (S.them || 'Friend'), vs: S.them || 'Friend' };
      S.myId = (await window.App.savePiece(Object.assign({}, base, { blob: S.mine, mine: true, challengeId: S.host ? S.challengeId : 'duel', day: S.host ? S.day : 1 }))).id;
      S.theirId = (await window.App.savePiece(Object.assign({}, base, { name: (S.them || 'Friend') + ' · duel', blob: S.theirs, mine: false, challengeId: 'duel-them' }))).id;
    }
    try {
      const cr = await window.critique({ blob: S.mine, prompt: P, practice: S.format, reflection: { tried: '', worked: '', change: '' } });
      S.crit = cr; await window.App.setCritique(S.myId, cr); send({ t: 'cmp', on: S.cmpMe, score: cr.score });
    } catch (e) { S.critErr = true; }
    if (S && S.phase === 'judge') render();
  };

  const onMsg = (m) => {
    if (!S || !m || !m.t) return;
    if (m.t === 'hello') { S.them = m.name || ''; setTile(S.tThem, null, m.cam, S.them || 'Friend'); send({ t: 'room', prompt: S.prompt, format: S.format, color: S.color, name: S.name, cam: S.camOn }); render(); }
    if (m.t === 'room') { S.prompt = m.prompt; S.format = m.format; S.color = m.color; S.them = m.name || ''; setTile(S.tThem, null, m.cam, S.them || 'Host'); render(); }
    if (m.t === 'name') { S.them = m.name; setTile(S.tThem, null, null, m.name || 'Friend'); S.tThem.classList.toggle('off', !S.themCam); if (S.phase === 'lobby') render(); }
    if (m.t === 'ping') send({ t: 'pong', a: m.a, h: Date.now() });
    if (m.t === 'pong') { const rtt = Date.now() - m.a; const off = m.h + rtt / 2 - Date.now(); if (rtt < (S.bestRtt || 1e9)) { S.bestRtt = rtt; S.offset = off; } }
    if (m.t === 'phase' && !S.host) apply(m);
    if (m.t === 'piece') { d2b(m.img).then((b) => { S.theirs = b; if (S.phase === 'sprint' || S.phase === 'upload') render(); hostCheck(); }); }
    if (m.t === 'done' && S.host) hostNextTurn();
    if (m.t === 'cmp') { S.cmpThem = !!m.on; if (m.score != null) S.themScore = m.score; if (S.phase === 'judge') render(); }
    if (m.t === 'cam') { S.themCam = m.on; S.tThem.classList.toggle('off', !m.on); }
  };
  const wire = (conn) => {
    S.conn = conn;
    conn.on('open', () => {
      S.connected = true;
      if (!S.host) { send({ t: 'hello', name: S.name, cam: S.camOn }); for (let i = 0; i < 5; i++) setTimeout(() => send({ t: 'ping', a: Date.now() }), i * 400); }
      render();
    });
    conn.on('data', onMsg);
    conn.on('close', () => { if (S && S.phase !== 'judge' && S.phase !== 'done') { S.connected = false; if (S.phase === 'lobby') render(); else S.bLab && (S.bLab.textContent = 'Friend left'); } });
  };
  const onStream = (rs) => { S.remote = rs; const camOn = rs.getVideoTracks().length > 0 && S.themCam !== false; setTile(S.tThem, rs, camOn, null); };

  const start = async (host, code, info) => {
    if (S) leave();
    if (!window.Peer) { alert('Couldn’t load the connection library.'); return; }
    S = { host, code, phase: 'lobby', offset: 0, name: localStorage.getItem('showup.name') || '', ui: open(), tMe: tile('me'), tThem: tile('them') };
    Object.assign(S, info || {});
    S.tThem.classList.add('wait'); S.tThem.querySelector('.ini').textContent = host ? 'Waiting…' : 'Connecting…';
    render();
    S.local = await getCam(); S.camOn = !!(S.local && S.local.getVideoTracks().length); S.themCam = true;
    setTile(S.tMe, S.local, S.camOn, S.name || 'You');
    const out = S.local && S.local.getVideoTracks().length ? S.local : (() => { const b = blankStream(); if (S.local) S.local.getAudioTracks().forEach((t) => b.addTrack(t)); return b; })();
    S.timer = setInterval(tick, 250);
    const peer = host ? new Peer(PREFIX + code) : new Peer(); S.peer = peer;
    peer.on('error', (e) => { if (!S) return; if (e.type === 'unavailable-id' && host) { leave(); return start(true, Math.random().toString(36).slice(2, 7), info); } if (!S.connected) { S.ui.body.innerHTML = ''; S.ui.body.append(el('h1', 'd-h', e.type === 'peer-unavailable' ? 'This link has expired.' : 'Couldn’t connect.'), el('p', 'd-mid', 'Ask your friend for a new link.')); } });
    if (host) {
      S.link = location.origin + location.pathname + '?duel=' + code; render();
      peer.on('connection', (conn) => { if (S.conn && S.conn.open) { conn.close(); return; } wire(conn); });
      peer.on('call', (call) => { call.answer(out); call.on('stream', onStream); });
    } else {
      peer.on('open', () => {
        wire(peer.connect(PREFIX + code, { reliable: true }));
        const call = peer.call(PREFIX + code, out); call && call.on('stream', onStream);
      });
    }
    setTimeout(() => send({ t: 'cam', on: S.camOn }), 1500);
  };

  // entry points
  window.Duel = {
    host: () => {
      const cur = window.App && window.App.current(); if (!cur) return;
      start(true, Math.random().toString(36).slice(2, 7), { prompt: cur.prompt, format: cur.format, color: cur.color, sprintMin: cur.sprintMin, challengeId: cur.challengeId, day: cur.day });
    }
  };
  const btn = $('duelBtn'); if (btn) btn.addEventListener('click', () => window.Duel.host());
  const code = params.get('duel'); if (code && /^[a-z0-9]{3,12}$/.test(code)) window.addEventListener('load', () => start(false, code));
})();
