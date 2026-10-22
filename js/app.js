/* Poster Sprint Studio — workspace app. Classic script so it runs from file:// with no build step. */
(() => {
  const { PRACTICES, EXTRA_LESSONS } = window.STUDIO_DATA;
  const LESSONS = window.LESSONS;
  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, '0');
  const clock = (sec) => pad(Math.floor(sec / 60)) + ':' + pad(Math.floor(sec % 60));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const dateKey = (d = new Date()) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

  // Debug: ?speed=60 runs the sprint clock 60x faster. ?reset clears local state.
  const params = new URLSearchParams(location.search);
  const SPEED = Math.max(1, Number(params.get('speed')) || 1);
  $('devTag').hidden = SPEED === 1;
  if (SPEED > 1) $('devTag').textContent = 'Debug speed ×' + SPEED;

  // ---- local state (small things); pieces + refs live in IndexedDB ----
  const KEY = 'posterSprintStudio.v1';
  const fresh = () => ({ challenges: [], activeId: null, sprint: null, settings: { provider: 'gemini', key: '', model: '', chime: true, demo: false } });
  if (params.has('reset')) localStorage.removeItem(KEY);
  let state;
  try { state = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { state = fresh(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };

  let pieces = [];
  const loadPieces = async () => { pieces = (await DB.all('pieces')).sort((a, b) => a.createdAt - b.createdAt); };

  // ---- challenges ----
  const makeChallenge = (practice, days, sprintMin, custom) => ({ id: uid(), practice, days, sprintMin, custom: custom || null, createdAt: Date.now() });
  const active = () => state.challenges.find((c) => c.id === state.activeId);
  const nameOf = (c) => c.custom ? c.custom.title || 'Custom challenge' : PRACTICES[c.practice].name;
  const doneFor = (c) => pieces.filter((p) => p.challengeId === c.id && !p.demo);
  const currentDay = (c) => { const n = doneFor(c).length + 1; return n > c.days ? null : n; };
  const promptFor = (c, day) => {
    if (c.custom) return { title: c.custom.title || 'Custom challenge', brief: c.custom.brief || '—', constraint: c.custom.constraint || 'None. Set your own.', focus: c.custom.focus || 'Composition' };
    const list = PRACTICES[c.practice].prompts;
    return list[(day - 1) % list.length];
  };
  const norm = (s) => String(s).toLowerCase().replace(/\band\b|[^a-z]/g, '');
  const lessonFor = (c, day) => {
    if (!c.custom && c.practice === 'poster') return LESSONS[(day - 1) % LESSONS.length];
    const f = norm(promptFor(c, day).focus);
    const hit = LESSONS.find((l) => !l.recap && norm(l.focus) === f) || Object.values(EXTRA_LESSONS).find((l) => norm(l.focus) === f);
    return hit || { focus: promptFor(c, day).focus, examples: [], what: ['Today’s focus: ' + promptFor(c, day).focus + '.', 'Write down what this skill means to you before you start.'], look: ['One clear decision', 'One deliberate contrast', 'One thing you will not do'], try: ['Make the focus skill the most visible thing in the piece.'] };
  };

  // ---- streak ----
  const streak = () => {
    const days = new Set(pieces.filter((p) => !p.demo || state.settings.demo).map((p) => p.date));
    let d = new Date(); let n = 0;
    if (!days.has(dateKey(d))) d.setDate(d.getDate() - 1);
    while (days.has(dateKey(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  };

  // ---- navigation ----
  let view = 'today';
  let tab = 'brief';
  const go = (v) => {
    view = v;
    ['today', 'challenges', 'archive', 'settings'].forEach((k) => { $('v-' + k).hidden = k !== v; });
    document.querySelectorAll('.navb').forEach((b) => b.classList.toggle('on', b.dataset.view === v));
    ({ today: renderToday, challenges: renderChallenges, archive: renderArchive, settings: renderSettings })[v]();
    $('main').scrollTop = 0;
  };
  document.querySelectorAll('.navb').forEach((b) => b.addEventListener('click', () => go(b.dataset.view)));
  document.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));

  const setTab = (t) => {
    tab = t;
    ['brief', 'lesson', 'refs', 'submit'].forEach((k) => { $('t-' + k).hidden = k !== t; });
    document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('on', b.dataset.tab === t));
    if (t === 'lesson') renderLesson();
    if (t === 'refs') renderRefs();
  };
  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));

  // ---- sidebar progress ----
  const renderSide = () => {
    const c = active(); const box = $('sideProg'); box.innerHTML = '';
    const s = el('div'); s.append(el('p', 'label mid', 'Streak'), el('p', 'streak', String(streak())), el('p', 'small mid', streak() === 1 ? 'day in a row' : 'days in a row'));
    box.append(s);
    if (!c) return;
    const done = doneFor(c).length;
    const w = el('div'); w.style.display = 'grid'; w.style.gap = '8px';
    w.append(el('p', 'label', nameOf(c)), el('p', 'small mid', done + ' of ' + c.days + ' days · ' + c.sprintMin + ' min'));
    const dots = el('div', 'dots');
    for (let i = 1; i <= c.days; i++) { const d = el('i'); if (i <= done) d.className = 'f'; else if (i === done + 1) d.className = 'c'; dots.append(d); }
    w.append(dots); box.append(w);
  };

  // ---- today ----
  const renderToday = () => {
    const c = active();
    const day = currentDay(c);
    const panes = ['brief', 'lesson', 'refs', 'submit'];
    $('tabs').hidden = !day; $('t-none').hidden = !!day;
    if (!day) { panes.forEach((k) => { $('t-' + k).hidden = true; }); $('todayMeta').innerHTML = ''; $('todayMeta').append(el('span', '', nameOf(c)), el('span', '', 'Complete')); return; }
    const p = promptFor(c, day);
    const m = $('todayMeta'); m.innerHTML = '';
    m.append(el('span', '', 'Day ' + pad(day) + ' / ' + pad(c.days)), el('span', '', nameOf(c)), el('span', '', new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })));
    $('pFocus').textContent = PRACTICES[c.practice].name + ' · ' + p.focus;
    $('pTitle').textContent = p.title; $('pBrief').textContent = p.brief;
    $('pConstraint').textContent = p.constraint; $('pFocus2').textContent = p.focus;
    $('pLen').textContent = c.sprintMin + ' minutes, coached';
    const sp = state.sprint && state.sprint.challengeId === c.id && state.sprint.day === day;
    $('startBtn').textContent = sp ? 'Sprint running →' : 'Start sprint';
    setTab(tab);
    renderDock();
  };
  $('startBtn').addEventListener('click', () => { if (!state.sprint) startSprint(); setTab('refs'); });
  $('toLessonBtn').addEventListener('click', () => setTab('lesson'));

  // ---- lesson (render logic reused from Poster Sprint) ----
  const LABELS = { what: 'What it is', video: 'Watch', article: 'Read', look: 'Look for this', example: 'Examples', try: 'Try this today', recap: 'Nine principles', questions: 'Before you begin' };
  const screensFor = (L) => {
    if (L.recap) return [{ type: 'recap' }, { type: 'questions' }, { type: 'try' }];
    const s = [{ type: 'what' }];
    if (L.format === 'video' && L.video) s.push({ type: 'video' });
    if (L.format === 'article' && L.article && L.article.length) s.push({ type: 'article' });
    s.push({ type: 'look' });
    (L.examples || []).forEach((ex, i) => s.push({ type: 'example', i }));
    s.push({ type: 'try' });
    return s;
  };
  let lessonScreen = 0; let lessonKey = '';
  const renderLesson = () => {
    const c = active(); const day = currentDay(c); if (!day) return;
    const L = lessonFor(c, day);
    const k = c.id + day; if (k !== lessonKey) { lessonKey = k; lessonScreen = 0; }
    const screens = screensFor(L);
    lessonScreen = Math.max(0, Math.min(lessonScreen, screens.length - 1));
    const s = screens[lessonScreen]; const box = $('lScreen'); box.innerHTML = '';
    const add = (tag, cls, txt, parent = box) => { const e = el(tag, cls, txt); parent.append(e); return e; };
    const figures = (list, cls) => { const w = add('div', cls); list.forEach(([mk, cap]) => { const f = add('figure', '', null, w); f.innerHTML = mk; if (cap) add('figcaption', '', cap, f); }); };
    add('p', 'label', LABELS[s.type] + ' — ' + L.focus);
    if (s.type === 'what') { add('p', 'l-lead', L.what[0]); if (L.what[1]) add('p', 'l-support', L.what[1]); }
    else if (s.type === 'video') { const isFile = /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(L.video); const v = document.createElement(isFile ? 'video' : 'iframe'); v.className = 'l-video'; v.src = L.video; if (isFile) v.controls = true; else v.setAttribute('allowfullscreen', ''); box.append(v); }
    else if (s.type === 'article') { const a = add('div', 'l-article'); L.article.forEach((t) => add('p', '', t, a)); }
    else if (s.type === 'look') { const ul = add('ul', 'l-look'); L.look.forEach((t) => add('li', '', t, ul)); }
    else if (s.type === 'example') { const ex = L.examples[s.i]; figures(ex.figs, 'l-figs'); if (ex.note) add('p', 'l-note', ex.note); }
    else if (s.type === 'recap') { figures(LESSONS.slice(0, 9).map((l, i) => { const f = l.examples[0].figs; return [f[f.length - 1][0], pad(i + 1) + ' ' + L.recapNames[i]]; }), 'l-recap'); }
    else if (s.type === 'questions') { const q = add('div', 'l-questions'); L.questions.forEach((t) => add('p', 'l-lead', t, q)); }
    else if (s.type === 'try') { add('p', 'l-lead', L.try[0]); if (L.try[1]) add('p', 'l-support', L.try[1]); }
    $('lCount').textContent = pad(lessonScreen + 1) + ' / ' + pad(screens.length);
    $('prevBtn').disabled = lessonScreen === 0; $('nextBtn').disabled = lessonScreen === screens.length - 1;
  };
  $('prevBtn').addEventListener('click', () => { lessonScreen--; renderLesson(); });
  $('nextBtn').addEventListener('click', () => { lessonScreen++; renderLesson(); });

  // ---- references board ----
  const refKey = () => { const c = active(); return c.id + ':' + currentDay(c); };
  const urls = new Map();
  const blobUrl = (id, blob) => { if (!urls.has(id)) urls.set(id, URL.createObjectURL(blob)); return urls.get(id); };
  const renderRefs = async () => {
    const all = (await DB.all('refs')).filter((r) => r.key === refKey()).sort((a, b) => a.createdAt - b.createdAt);
    const b = $('refsBoard'); b.querySelectorAll('.ref').forEach((n) => n.remove());
    $('dropHint').hidden = all.length > 0;
    all.forEach((r) => {
      const card = el('div', 'ref ' + r.kind);
      if (r.kind === 'image') { const i = el('img'); i.src = blobUrl(r.id, r.blob); i.alt = 'Reference'; card.append(i); }
      else if (r.kind === 'url') { const t = el('div', 'rt'); const a = el('a', '', r.text); a.href = r.text; a.target = '_blank'; a.rel = 'noopener'; t.append(el('p', 'label mid', 'Link'), a); card.append(t); }
      else card.append(el('div', 'rt', r.text));
      const x = el('button', 'x', '×'); x.title = 'Remove'; x.onclick = async () => { await DB.del('refs', r.id); renderRefs(); };
      card.append(x); b.append(card);
    });
  };
  const addRef = async (r) => { await DB.put('refs', Object.assign({ id: uid(), key: refKey(), createdAt: Date.now() }, r)); renderRefs(); };
  const addFiles = (files) => [...files].filter((f) => f.type.startsWith('image/')).forEach((f) => addRef({ kind: 'image', blob: f, mime: f.type }));
  const addText = (t) => { t = t.trim(); if (!t) return; addRef({ kind: /^https?:\/\/\S+$/.test(t) ? 'url' : 'note', text: t }); };
  $('refText').addEventListener('keydown', (e) => { if (e.key === 'Enter') { addText(e.target.value); e.target.value = ''; } });
  $('refFile').addEventListener('change', (e) => { addFiles(e.target.files); e.target.value = ''; });
  const board = $('refsBoard');
  board.addEventListener('dragover', (e) => { e.preventDefault(); board.classList.add('over'); });
  board.addEventListener('dragleave', () => board.classList.remove('over'));
  board.addEventListener('drop', (e) => { e.preventDefault(); board.classList.remove('over'); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); else addText(e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text')); });
  document.addEventListener('paste', (e) => {
    if (view !== 'today' || tab !== 'refs' || e.target.tagName === 'TEXTAREA' || e.target.id === 'refText') return;
    const files = [...e.clipboardData.files]; if (files.length) addFiles(files); else addText(e.clipboardData.getData('text'));
  });

  // ---- coached sprint timer (stages scale with sprint length) ----
  // Based on the original 20-minute cue sheet; `to` is the fraction of the sprint at which the stage ends.
  const STAGES = (focus) => [
    { to: .10, name: 'Read + Respond', note: ['Who is this for?', 'What should someone notice first?', 'What is the feeling?'], tab: 'brief' },
    { to: .25, name: 'Gather references', note: ['Research, sketch, collect references.', 'Drop them on the board.'], tab: 'refs' },
    { to: .50, name: 'Design', note: ['Start designing.', 'Make, don’t browse.'] },
    { to: .65, name: 'Check ' + focus.toLowerCase(), note: ['What does your eye see first?', 'Is ' + focus.toLowerCase() + ' doing the work?'] },
    { to: .75, name: 'Commit to a direction', note: ['Commit to what you have.', 'No new concept.'], level: 'warn' },
    { to: .90, name: 'Refine', note: ['Stop inventing. Start refining.', 'Remove. Resize. Reposition. Retype.'] },
    { to: .95, name: 'Wrap up', note: ['Wrap it up.'], level: 'warn' },
    { to: 1.0, name: 'Export', note: ['Export now.'], level: 'warn', tab: 'submit' }
  ];
  let ac = null;
  const chime = () => {
    if (!state.settings.chime) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      [660, 880].forEach((f, i) => {
        const o = ac.createOscillator(); const g = ac.createGain(); const t = ac.currentTime + i * 0.18;
        o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
        o.connect(g).connect(ac.destination); o.start(t); o.stop(t + 1);
      });
    } catch (e) {}
  };
  const elapsed = () => { const s = state.sprint; if (!s) return 0; return Math.min(s.totalMs, ((s.pausedAt || Date.now()) - s.startedAt - s.pausedTotal) * SPEED); };
  const startSprint = () => {
    const c = active(); const day = currentDay(c); if (!day) return;
    state.sprint = { challengeId: c.id, day, startedAt: Date.now(), pausedAt: null, pausedTotal: 0, totalMs: c.sprintMin * 60000, stage: 0 };
    save(); chime(); tick(); renderToday();
  };
  const togglePause = () => {
    const s = state.sprint; if (!s) return;
    if (s.pausedAt) { s.pausedTotal += Date.now() - s.pausedAt; s.pausedAt = null; } else s.pausedAt = Date.now();
    save(); renderDock();
  };
  const resetSprint = () => { state.sprint = null; save(); document.body.classList.remove('focusing'); renderToday(); };
  let lastStage = -1;
  const renderDock = () => {
    const c = active(); const day = c && currentDay(c); const s = state.sprint;
    const totalMs = s ? s.totalMs : (c ? c.sprintMin * 60000 : 1200000);
    const p = c && day ? promptFor(c, day) : { focus: 'Focus' };
    const stages = STAGES(p.focus);
    const e = elapsed(); const frac = e / totalMs;
    const idx = s ? (frac >= 1 ? stages.length : stages.findIndex((st) => frac < st.to)) : -1;
    $('dClock').textContent = clock(Math.ceil((totalMs - e) / 1000));
    $('dBar').style.width = (frac * 100) + '%';
    const list = $('dStages'); list.innerHTML = '';
    let from = 0;
    stages.forEach((st, i) => {
      const li = el('li', i < idx ? 'done' : i === idx ? 'cur' : '');
      li.append(el('span', '', st.name), el('span', '', clock(Math.round((st.to - from) * totalMs / 1000)))); from = st.to; list.append(li);
    });
    const note = $('dNote'); note.innerHTML = '';
    const dock = $('dock');
    if (!s) { $('dStage').textContent = 'Ready · ' + Math.round(totalMs / 60000) + ' min'; note.append(el('span', '', 'Start when you are ready.')); }
    else if (idx >= stages.length) { $('dStage').textContent = 'Time'; note.append(el('span', '', 'Pens down.'), el('span', '', 'Upload and reflect.')); }
    else { const st = stages[idx]; $('dStage').textContent = pad(idx + 1) + ' / ' + pad(stages.length) + ' · ' + st.name; st.note.forEach((t) => note.append(el('span', '', t))); }
    dock.classList.toggle('alert', !!s && idx >= 0 && idx < stages.length && stages[idx].level === 'warn' && !s.pausedAt && (Date.now() - stageAt) < 6000 / Math.min(SPEED, 6));
    dock.classList.toggle('paused', !!(s && s.pausedAt));
    $('dStart').hidden = !!s; $('dPause').hidden = !s || idx >= stages.length; $('dReset').hidden = !s;
    $('dPause').textContent = s && s.pausedAt ? 'Resume' : 'Pause';
    document.title = s ? $('dClock').textContent + ' · ' + (idx < stages.length ? stages[idx].name : 'Done') : 'Poster Sprint Studio';
    return { idx, stages };
  };
  let stageAt = 0;
  const tick = () => {
    if (!state.sprint) return;
    const { idx, stages } = renderDock();
    if (idx !== lastStage) {
      if (lastStage !== -1) { chime(); stageAt = Date.now(); }
      lastStage = idx;
      if (state.sprint.stage !== idx) {
        state.sprint.stage = idx; save();
        const t = idx >= stages.length ? 'submit' : stages[idx].tab;
        if (t && view === 'today') setTab(t);
      }
    }
  };
  setInterval(tick, 250);
  $('dStart').addEventListener('click', () => { if (view !== 'today') go('today'); startSprint(); });
  $('dPause').addEventListener('click', togglePause);
  $('dReset').addEventListener('click', () => { if (confirm('Reset this sprint?')) resetSprint(); });
  $('dFocus').addEventListener('click', () => { const on = $('app').classList.toggle('focus'); $('dFocus').textContent = on ? 'Exit focus' : 'Focus mode'; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { $('modal').hidden = true; } });

  // ---- submit + reflect ----
  let upload = null;
  $('pieceFile').addEventListener('change', (e) => {
    const f = e.target.files[0]; if (!f) return; upload = f;
    const box = $('uploadBox'); box.querySelectorAll('img,video').forEach((n) => n.remove());
    const m = el(f.type.startsWith('video/') ? 'video' : 'img'); m.src = URL.createObjectURL(f); if (m.tagName === 'VIDEO') { m.muted = true; m.loop = true; m.autoplay = true; }
    $('uploadHint').hidden = true; box.append(m);
  });
  $('reflectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!upload) { $('saveMsg').textContent = 'Upload your finished piece first.'; return; }
    const c = active(); const day = currentDay(c); const fd = new FormData(e.target);
    const piece = { id: uid(), challengeId: c.id, challengeName: nameOf(c), practice: c.practice, day, prompt: promptFor(c, day), blob: upload, mime: upload.type, reflection: { tried: fd.get('tried'), worked: fd.get('worked'), change: fd.get('change') }, critique: null, date: dateKey(), createdAt: Date.now(), demo: false };
    await DB.put('pieces', piece); await loadPieces();
    if (state.sprint && state.sprint.challengeId === c.id) { state.sprint = null; save(); }
    upload = null; e.target.reset(); $('uploadBox').querySelectorAll('img,video').forEach((n) => n.remove()); $('uploadHint').hidden = false; $('saveMsg').textContent = '';
    lastStage = -1; tab = 'brief'; renderSide(); go('archive'); openPiece(piece.id);
  });

  // ---- archive ----
  const visible = () => pieces.filter((p) => !p.demo || state.settings.demo).slice().reverse();
  const mediaFor = (p) => {
    if (p.svg) { const d = el('div'); d.innerHTML = p.svg; return d.firstElementChild; }
    const m = el(p.mime && p.mime.startsWith('video/') ? 'video' : 'img');
    m.src = blobUrl(p.id, p.blob); if (m.tagName === 'VIDEO') { m.muted = true; m.loop = true; m.autoplay = true; m.playsInline = true; } else m.alt = p.prompt.title;
    return m;
  };
  const renderArchive = () => {
    const list = visible(); const st = $('stats'); st.innerHTML = '';
    const stat = (n, l) => { const d = el('div'); d.append(el('b', '', String(n)), el('p', 'label mid', l)); st.append(d); };
    stat(list.length, 'Pieces'); stat(new Set(list.map((p) => p.date)).size, 'Days practiced'); stat(streak(), 'Day streak');
    const g = $('archiveGrid'); g.innerHTML = '';
    if (!list.length) { g.append(el('p', 'empty', 'No pieces yet. Finish a sprint and save it here, or turn on demo pieces in Settings.')); return; }
    list.forEach((p) => {
      const b = el('button', 'piece'); const th = el('div', 'thumb'); th.append(mediaFor(p));
      const t = el('b', '', p.prompt.title); const lab = el('p', 'label mid', 'Day ' + pad(p.day) + ' · ' + p.prompt.focus); if (p.demo) lab.append(el('span', 'tag label', 'Demo'));
      b.append(th, lab, t, el('p', 'small mid', p.date));
      b.onclick = () => openPiece(p.id); g.append(b);
    });
  };
  const scoreEl = (n) => { const s = el('div', 'score'); for (let i = 1; i <= 5; i++) s.append(el('i', i <= n ? 'f' : '')); return s; };
  const openPiece = (id) => {
    const p = pieces.find((x) => x.id === id); if (!p) return;
    const box = $('mBox'); box.innerHTML = '';
    const media = el('div', 'm-media'); media.append(mediaFor(p));
    const info = el('div', 'm-info');
    const top = el('div', 'row'); top.style.justifyContent = 'space-between';
    top.append(el('p', 'label mid', (p.challengeName || 'Poster') + ' · Day ' + pad(p.day) + ' · ' + p.date));
    const close = el('button', 'btn quiet', 'Close'); close.onclick = () => { $('modal').hidden = true; }; top.append(close);
    info.append(top, el('h2', '', p.prompt.title));
    const sec = (label, lines) => { const s = el('div', 'm-sec'); s.append(el('p', 'label', label)); lines.forEach((l) => s.append(el('p', '', l))); info.append(s); return s; };
    sec('Brief', [p.prompt.brief]); sec('Constraint · Focus', [p.prompt.constraint, 'Focus: ' + p.prompt.focus]);
    sec('My reflection', []).append(...[['What I tried', p.reflection.tried], ['What worked', p.reflection.worked], ['What I’d change', p.reflection.change]].flatMap(([q, a]) => [el('p', 'label mid', q), el('p', '', a || '—')]));
    const ai = sec('AI feedback · optional', []);
    const fill = (c) => { ai.querySelectorAll(':scope > :not(.label)').forEach((n) => n.remove()); ai.append(el('p', 'label mid', 'Works'), el('p', '', c.works), el('p', 'label mid', 'Push'), el('p', '', c.push), el('p', 'label mid', p.prompt.focus + ' · ' + c.score + ' / 5'), scoreEl(c.score)); };
    if (p.critique) fill(p.critique);
    else {
      const btn = el('button', 'btn quiet', 'Get feedback'); const msg = el('p', 'small mid', state.settings.key ? 'Sends the image, prompt, constraint, and focus to ' + (state.settings.provider === 'anthropic' ? 'Anthropic' : 'Gemini') + '.' : 'Add your own API key in Settings to enable this.');
      btn.disabled = !state.settings.key || !!p.svg; if (p.svg) msg.textContent = 'Demo pieces can’t be sent for feedback.';
      btn.onclick = async () => {
        btn.disabled = true; msg.textContent = 'Asking for feedback…';
        try { p.critique = await window.critique({ blob: p.blob, mime: p.mime, prompt: p.prompt, settings: state.settings }); await DB.put('pieces', p); fill(p.critique); }
        catch (err) { msg.textContent = err.message; btn.disabled = false; }
      };
      ai.append(btn, msg);
    }
    const del = el('button', 'btn quiet', 'Delete piece'); del.onclick = async () => { if (!confirm('Delete this piece?')) return; await DB.del('pieces', p.id); await loadPieces(); $('modal').hidden = true; renderSide(); renderArchive(); };
    info.append(del);
    box.append(media, info); $('modal').hidden = false;
  };
  $('modal').addEventListener('click', (e) => { if (e.target.id === 'modal') $('modal').hidden = true; });

  // export / import
  const toDataURL = (blob) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); });
  $('exportBtn').addEventListener('click', async () => {
    const out = [];
    for (const p of pieces.filter((x) => !x.demo)) { const c = Object.assign({}, p); if (p.blob) c.blob = await toDataURL(p.blob); out.push(c); }
    const data = { app: 'poster-sprint-studio', version: 1, exportedAt: new Date().toISOString(), challenges: state.challenges, pieces: out };
    const a = el('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' })); a.download = 'poster-sprint-archive-' + dateKey() + '.json'; a.click();
  });
  $('importFile').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!Array.isArray(data.pieces)) throw new Error('Not an archive file');
      for (const p of data.pieces) { if (typeof p.blob === 'string') p.blob = await (await fetch(p.blob)).blob(); await DB.put('pieces', p); }
      (data.challenges || []).forEach((c) => { if (!state.challenges.some((x) => x.id === c.id)) state.challenges.push(c); });
      save(); await loadPieces(); renderSide(); renderArchive(); alert('Imported ' + data.pieces.length + ' pieces.');
    } catch (err) { alert('Import failed: ' + err.message); }
    e.target.value = '';
  });

  // ---- demo data (toggle in Settings) ----
  const DEMO_REFLECT = [
    ['Made the title huge and pushed everything else small.', 'The first read is obvious from across the room.', 'The date gets lost. Give it one more step of contrast.'],
    ['Built the whole poster out of type, no images.', 'The stacked letters feel like radio static.', 'Too many sizes. Cut to three.'],
    ['Limited myself to three colors.', 'The red really dominates.', 'Value contrast is weak on the small text.'],
    ['Pushed everything to the left third.', 'The imbalance feels intentional.', 'Needs one counterweight on the right.'],
    ['One photo, cropped and repeated.', 'The repetition reads like a menu board.', 'The crop is a bit timid.'],
    ['Turned a slang word into the main image.', 'People recognize it before they read it.', 'Info hierarchy below is muddy.']
  ];
  const setDemo = async (on) => {
    const old = (await DB.all('pieces')).filter((p) => p.demo);
    for (const p of old) await DB.del('pieces', p.id);
    if (on) {
      const d = new Date();
      for (let i = 0; i < 6; i++) {
        const day = new Date(d); day.setDate(d.getDate() - (6 - i));
        const L = LESSONS[i]; const f = L.examples[0].figs; const r = DEMO_REFLECT[i];
        await DB.put('pieces', { id: 'demo-' + i, demo: true, challengeId: 'demo', challengeName: 'Poster · demo', practice: 'poster', day: i + 1, prompt: PRACTICES.poster.prompts[i], svg: f[f.length - 1][0], reflection: { tried: r[0], worked: r[1], change: r[2] }, critique: i % 2 ? null : { works: 'The dominant element gives a clear first read.', push: 'Increase the gap between the second and third read.', score: 3 + (i % 3) }, date: dateKey(day), createdAt: day.getTime() });
      }
    }
    await loadPieces();
  };

  // ---- challenges view ----
  let pick = 'poster';
  const renderChallenges = () => {
    const cards = $('practiceCards'); cards.innerHTML = '';
    const opts = Object.entries(PRACTICES).map(([k, v]) => [k, v.name, v.prompts.length + ' prompts']).concat([['custom', 'Make your own', 'Your brief']]);
    opts.forEach(([k, n, sub]) => { const b = el('button', 'card' + (pick === k ? ' on' : '')); b.type = 'button'; b.append(el('p', 'label', sub), el('b', '', n)); b.onclick = () => { pick = k; renderChallenges(); }; cards.append(b); });
    $('customFields').hidden = pick !== 'custom';
    const ul = $('challengeList'); ul.innerHTML = '';
    state.challenges.slice().reverse().forEach((c) => {
      const li = el('li'); const t = el('div'); t.append(el('b', '', nameOf(c)), el('p', 'small mid', doneFor(c).length + ' / ' + c.days + ' days · ' + c.sprintMin + ' min sprints'));
      const b = el('button', 'btn quiet', c.id === state.activeId ? 'Active' : 'Make active'); b.disabled = c.id === state.activeId;
      b.onclick = () => { state.activeId = c.id; state.sprint = null; save(); lessonKey = ''; renderSide(); renderChallenges(); };
      const del = el('button', 'btn quiet', 'Remove'); del.disabled = state.challenges.length < 2;
      del.onclick = () => { if (!confirm('Remove this challenge? Archived pieces are kept.')) return; state.challenges = state.challenges.filter((x) => x.id !== c.id); if (state.activeId === c.id) state.activeId = state.challenges[0].id; save(); renderSide(); renderChallenges(); };
      li.append(t, b, del); ul.append(li);
    });
  };
  document.querySelectorAll('.seg').forEach((s) => s.addEventListener('click', (e) => { if (e.target.tagName !== 'BUTTON') return; s.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === e.target)); }));
  $('setupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const seg = (n) => Number(document.querySelector(`.seg[data-name=${n}] .on`).value);
    let custom = null;
    if (pick === 'custom') { const fd = new FormData(e.target); custom = { title: fd.get('title').trim(), brief: fd.get('brief').trim(), constraint: fd.get('constraint').trim(), focus: fd.get('focus').trim() }; if (!custom.title) { alert('Give your challenge a title.'); return; } }
    const c = makeChallenge(pick === 'custom' ? 'poster' : pick, seg('days'), seg('sprint'), custom);
    state.challenges.push(c); state.activeId = c.id; state.sprint = null; save(); tab = 'brief'; renderSide(); go('today');
    const pv = $('t-brief'); pv.classList.remove('reveal'); void pv.offsetWidth; pv.classList.add('reveal');
  });

  // ---- settings ----
  const renderSettings = () => { const f = $('settingsForm'); const s = state.settings; f.provider.value = s.provider; f.key.value = s.key; f.model.value = s.model; f.chime.checked = s.chime; f.demo.checked = s.demo; $('setMsg').textContent = ''; };
  $('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const wasDemo = state.settings.demo;
    state.settings = { provider: f.provider.value, key: f.key.value.trim(), model: f.model.value.trim(), chime: f.chime.checked, demo: f.demo.checked }; save();
    if (wasDemo !== state.settings.demo) await setDemo(state.settings.demo);
    renderSide(); $('setMsg').textContent = 'Saved.';
  });

  // ---- boot ----
  (async () => {
    if (!state.challenges.length) { const c = makeChallenge('poster', 10, 20, null); state.challenges.push(c); state.activeId = c.id; save(); }
    if (!active()) { state.activeId = state.challenges[0].id; save(); }
    if (params.has('demo')) { state.settings.demo = true; save(); }
    await loadPieces();
    if (state.settings.demo && !pieces.some((p) => p.demo)) await setDemo(true);
    renderSide(); go(params.get('view') || 'today');
    if (state.sprint) { lastStage = state.sprint.stage; tick(); }
  })();
})();
