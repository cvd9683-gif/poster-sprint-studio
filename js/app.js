/* Poster Sprint Studio v2: Today / Challenges / The Wall. Classic script, no build step. */
(() => {
  const { PRACTICES, EXTRA_LESSONS } = window.STUDIO_DATA;
  const LESSONS = window.LESSONS;
  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, '0');
  const clock = (sec) => pad(Math.floor(Math.max(0, sec) / 60)) + ':' + pad(Math.floor(Math.max(0, sec) % 60));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const dateKey = (d = new Date()) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const COLORS = { red: '#e5322d', violet: '#5b3fd1', pink: '#ff3e9a', mustard: '#f2b705', green: '#12a150' };
  const colorOf = (practice) => COLORS[(PRACTICES[practice] || {}).color] || COLORS.red;

  const params = new URLSearchParams(location.search);
  const SPEED = Math.max(1, Number(params.get('speed')) || 1);
  if (params.has('nopip')) window.__noPiP = true;
  if (SPEED > 1) { $('devTag').hidden = false; $('devTag').textContent = 'Debug speed ×' + SPEED; }

  // ---- state: small things in localStorage, pieces (images) in IndexedDB ----
  const KEY = 'posterSprintStudio.v2';
  const fresh = () => ({ challenges: [], sprint: null, openId: null, settings: { chime: true, demo: false } });
  if (params.has('reset')) { localStorage.removeItem(KEY); localStorage.removeItem('posterSprintStudio.v1'); }
  let state;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY)) || (() => { const o = JSON.parse(localStorage.getItem('posterSprintStudio.v1')); return o ? { challenges: o.challenges || [], settings: { chime: o.settings ? o.settings.chime !== false : true, demo: !!(o.settings && o.settings.demo) } } : {}; })();
    state = Object.assign(fresh(), raw || {});
  } catch (e) { state = fresh(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };

  let pieces = [];
  const loadPieces = async () => { pieces = (await DB.all('pieces')).sort((a, b) => a.createdAt - b.createdAt); };

  // ---- challenges ----
  const makeChallenge = (practice, days, sprintMin, custom) => ({ id: uid(), practice, days, sprintMin, custom: custom || null, createdAt: Date.now() });
  const byId = (id) => state.challenges.find((c) => c.id === id);
  const nameOf = (c) => c.custom ? c.custom.title || 'Custom challenge' : PRACTICES[c.practice].name;
  const doneFor = (c) => pieces.filter((p) => p.challengeId === c.id && !p.demo);
  const currentDay = (c) => { const n = doneFor(c).length + 1; return n > c.days ? null : n; };
  const promptFor = (c, day) => {
    if (c.custom) return { title: c.custom.title || 'Custom challenge', brief: c.custom.brief || 'Your own brief.', constraint: c.custom.constraint || 'None. Set your own.', focus: c.custom.focus || 'Composition' };
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
  const streak = () => {
    const days = new Set(pieces.filter((p) => !p.demo || state.settings.demo).map((p) => p.date));
    const d = new Date(); let n = 0;
    if (!days.has(dateKey(d))) d.setDate(d.getDate() - 1);
    while (days.has(dateKey(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  };

  // ---- navigation ----
  let view = 'today';
  const VIEWS = ['today', 'challenges', 'day', 'wall'];
  const go = (v) => {
    view = v;
    VIEWS.forEach((k) => { $('v-' + k).hidden = k !== v; });
    document.querySelectorAll('.navb').forEach((b) => b.classList.toggle('on', b.dataset.view === v || (v === 'day' && b.dataset.view === 'today')));
    ({ today: renderToday, challenges: renderChallenges, day: renderDay, wall: renderWall })[v]();
    $('main').scrollTop = 0;
    $('app').classList.toggle('on-wall', v === 'wall');
  };
  document.querySelectorAll('.navb').forEach((b) => b.addEventListener('click', () => go(b.dataset.view)));
  document.addEventListener('click', (e) => { const g = e.target.closest('[data-go]'); if (g) go(g.dataset.go); });

  // ---- sidebar ----
  const renderSide = () => {
    const n = streak(); const s = $('sideStreak'); s.innerHTML = '';
    s.append(el('p', 'label mid', 'Streak'), el('p', 'streak', String(n)), el('p', 'small mid', n === 1 ? 'day in a row' : 'days in a row'));
    $('optChime').checked = state.settings.chime; $('optDemo').checked = state.settings.demo;
  };
  $('optChime').addEventListener('change', (e) => { state.settings.chime = e.target.checked; save(); });
  $('optDemo').addEventListener('change', async (e) => { state.settings.demo = e.target.checked; save(); await setDemo(state.settings.demo); renderSide(); go(view === 'day' ? 'day' : view); });

  // ---- filters ----
  const filterState = { today: 'all', challenges: 'all' };
  const renderFilters = (box, which, keys) => {
    box.innerHTML = '';
    [['all', 'All']].concat(keys.map((k) => [k, PRACTICES[k].name])).forEach(([k, n]) => {
      const b = el('button', 'chip' + (filterState[which] === k ? ' on' : ''), n); b.type = 'button';
      if (k !== 'all') b.style.setProperty('--c', colorOf(k));
      b.onclick = () => { filterState[which] = k; which === 'today' ? renderToday() : renderChallenges(); };
      box.append(b);
    });
  };
  const segs = (c, done) => { const w = el('div', 'segs'); for (let i = 1; i <= c.days; i++) w.append(el('i', i <= done ? 'f' : i === done + 1 ? 'c' : '')); return w; };

  // ---- today ----
  const renderToday = () => {
    $('todayDate').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    const live = state.challenges.filter((c) => currentDay(c));
    const finished = state.challenges.filter((c) => !currentDay(c));
    $('todayLede').textContent = live.length ? (live.length === 1 ? 'One challenge in progress. Pick it up where you left off.' : live.length + ' challenges in progress. Pick one to keep going.') : 'Nothing in progress. Start a challenge to get your first brief.';
    renderFilters($('todayFilters'), 'today', [...new Set(state.challenges.map((c) => c.practice))]);
    const box = $('todayCards'); box.innerHTML = '';
    const f = filterState.today;
    live.slice().reverse().filter((c) => f === 'all' || c.practice === f).forEach((c) => {
      const day = currentDay(c); const done = day - 1; const p = promptFor(c, day);
      const card = el('button', 'card pcard'); card.type = 'button'; card.style.setProperty('--c', colorOf(c.practice));
      const band = el('div', 'band'); band.append(el('span', 'label', c.custom ? 'Custom · ' + PRACTICES[c.practice].name : PRACTICES[c.practice].name), el('span', 'label', 'Day ' + day + ' / ' + c.days));
      const running = state.sprint && state.sprint.challengeId === c.id;
      const body = el('div', 'cbody');
      body.append(el('p', 'label mid', (c.custom ? c.custom.title : PRACTICES[c.practice].program) + ' · ' + c.sprintMin + ' min'), el('b', 'ctitle', p.title), el('p', 'small mid clamp', p.brief));
      const foot = el('div', 'cfoot'); foot.append(segs(c, done), el('span', 'go', running ? 'Sprint running →' : done ? 'Continue →' : 'Begin →'));
      if (running) card.classList.add('running');
      card.append(band, body, foot);
      card.onclick = () => openDay(c.id);
      box.append(card);
    });
    const add = el('button', 'card addcard'); add.type = 'button'; add.append(el('span', 'plus', '+'), el('b', '', 'Start a new challenge'), el('p', 'small mid', 'Poster, type, motion, color, layout, or your own.'));
    add.onclick = () => go('challenges'); box.append(add);
    if (finished.length && f === 'all') {
      finished.forEach((c) => {
        const card = el('button', 'card pcard finished'); card.type = 'button'; card.style.setProperty('--c', colorOf(c.practice));
        const band = el('div', 'band'); band.append(el('span', 'label', nameOf(c)), el('span', 'label', 'Complete'));
        const body = el('div', 'cbody'); body.append(el('b', 'ctitle', c.days + ' days done'), el('p', 'small mid', 'Every piece is on the wall.'));
        const foot = el('div', 'cfoot'); foot.append(segs(c, c.days), el('span', 'go', 'See the wall →'));
        card.append(band, body, foot); card.onclick = () => go('wall'); box.append(card);
      });
    }
  };

  // ---- challenges ----
  const renderChallenges = () => {
    renderFilters($('chFilters'), 'challenges', Object.keys(PRACTICES));
    const box = $('chCards'); box.innerHTML = '';
    const f = filterState.challenges;
    Object.entries(PRACTICES).filter(([k]) => f === 'all' || f === k).forEach(([k, v]) => {
      const card = el('button', 'card tcard'); card.type = 'button'; card.style.setProperty('--c', colorOf(k));
      const band = el('div', 'band'); band.append(el('span', 'label', v.name), el('span', 'label', v.prompts.length + ' briefs'));
      const body = el('div', 'cbody'); body.append(el('b', 'ctitle', v.program), el('p', 'small mid', v.blurb));
      const ul = el('ul', 'tlist'); v.prompts.slice(0, 3).forEach((p) => ul.append(el('li', '', p.title + ' · ' + p.focus))); body.append(ul);
      const foot = el('div', 'cfoot'); foot.append(el('span', 'label mid', '5 / 10 / 30 days'), el('span', 'go', 'Set up →'));
      card.append(band, body, foot); card.onclick = () => openSetup(k); box.append(card);
    });
    const own = el('button', 'card tcard owncard'); own.type = 'button';
    const band = el('div', 'band'); band.append(el('span', 'label', 'Custom'), el('span', 'label', 'Your brief'));
    const body = el('div', 'cbody'); body.append(el('b', 'ctitle', 'Make your own'), el('p', 'small mid', 'Write a brief, a constraint, and a focus skill. Practice anything.'));
    const foot = el('div', 'cfoot'); foot.append(el('span', 'label mid', 'Any practice'), el('span', 'go', 'Write it →'));
    own.append(band, body, foot); own.onclick = () => openSetup('custom'); box.append(own);

    const ul = $('chList'); ul.innerHTML = '';
    if (!state.challenges.length) ul.append(el('li', 'small mid', 'None yet.'));
    state.challenges.slice().reverse().forEach((c) => {
      const li = el('li'); li.style.setProperty('--c', colorOf(c.practice));
      const t = el('div'); t.append(el('b', '', nameOf(c)), el('p', 'small mid', doneFor(c).length + ' / ' + c.days + ' days · ' + c.sprintMin + ' min sprints'));
      const open = el('button', 'btn quiet', currentDay(c) ? 'Open' : 'Done'); open.disabled = !currentDay(c); open.onclick = () => openDay(c.id);
      const del = el('button', 'btn quiet', 'Remove');
      del.onclick = () => { if (!confirm('Remove this challenge? Its posters stay on the wall.')) return; state.challenges = state.challenges.filter((x) => x.id !== c.id); if (state.sprint && state.sprint.challengeId === c.id) stopSprint(); save(); renderChallenges(); };
      li.append(el('i', 'swatch'), t, open, del); ul.append(li);
    });
  };
  const openSetup = (k) => {
    const custom = k === 'custom'; const practice = custom ? 'poster' : k;
    const box = $('mBox'); box.innerHTML = ''; box.className = 'm-box setup'; box.style.setProperty('--c', custom ? '#111' : colorOf(k));
    const f = el('form', 'setupf');
    f.innerHTML = `<div class="band"><span class="label">${custom ? 'Make your own' : PRACTICES[k].name}</span><button type="button" class="x" data-close>Close</button></div>
      <h2>${custom ? 'Your challenge' : PRACTICES[k].program}</h2>
      ${custom ? `<label>Title<input name="title" required placeholder="e.g. Album covers for imaginary bands"></label>
      <label>Brief<textarea name="brief" rows="2" placeholder="What are you making, and for whom?"></textarea></label>
      <div class="two"><label>Constraint<input name="constraint" placeholder="e.g. Two colors only"></label><label>Focus skill<input name="focus" placeholder="e.g. Hierarchy"></label></div>
      <label>Practice<select name="practice">${Object.entries(PRACTICES).map(([pk, v]) => `<option value="${pk}">${v.name}</option>`).join('')}</select></label>` : `<p class="small mid">${PRACTICES[k].blurb}</p>`}
      <fieldset><legend class="label">Days</legend><div class="seg" data-name="days"><button type="button" value="5">5</button><button type="button" value="10" class="on">10</button><button type="button" value="30">30</button></div></fieldset>
      <fieldset><legend class="label">Sprint length</legend><div class="seg" data-name="sprint"><button type="button" value="10">10 min</button><button type="button" value="20" class="on">20 min</button></div></fieldset>
      <button class="btn hot" type="submit">Start challenge</button>`;
    f.querySelectorAll('.seg').forEach((s) => s.addEventListener('click', (e) => { if (e.target.tagName !== 'BUTTON') return; s.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === e.target)); }));
    f.querySelector('[data-close]').onclick = closeModal;
    f.onsubmit = (e) => {
      e.preventDefault();
      const seg = (n) => Number(f.querySelector(`.seg[data-name=${n}] .on`).value);
      let cu = null; let pr = practice;
      if (custom) { const fd = new FormData(f); cu = { title: fd.get('title').trim(), brief: fd.get('brief').trim(), constraint: fd.get('constraint').trim(), focus: fd.get('focus').trim() }; pr = fd.get('practice'); }
      const c = makeChallenge(pr, seg('days'), seg('sprint'), cu);
      state.challenges.push(c); save(); closeModal(); openDay(c.id);
    };
    box.append(f); $('modal').hidden = false;
    const first = f.querySelector('input,button.on'); if (first) first.focus();
  };

  // ---- day view ----
  let step = 'brief';
  const openDay = (id, s) => {
    state.openId = id; save();
    const running = state.sprint && state.sprint.challengeId === id;
    step = s || (running ? 'sprint' : 'brief');
    go('day');
  };
  const openC = () => byId(state.openId);
  const setStep = (s) => {
    step = s;
    ['brief', 'lesson', 'sprint', 'submit'].forEach((k) => { $('s-' + k).hidden = k !== s; });
    document.querySelectorAll('.step').forEach((b) => b.classList.toggle('on', b.dataset.step === s));
    if (s === 'lesson') renderLesson();
    if (s === 'sprint') renderSprintPane();
    $('main').scrollTop = 0;
  };
  document.querySelectorAll('.step').forEach((b) => b.addEventListener('click', () => setStep(b.dataset.step)));
  document.querySelectorAll('[data-step-go]').forEach((b) => b.addEventListener('click', () => setStep(b.dataset.stepGo)));
  const renderDay = () => {
    const c = openC(); if (!c) { go('today'); return; }
    const v = $('v-day'); v.style.setProperty('--c', colorOf(c.practice));
    const day = currentDay(c);
    $('steps').hidden = !day; $('s-done').hidden = !!day;
    if (!day) { ['brief', 'lesson', 'sprint', 'submit'].forEach((k) => { $('s-' + k).hidden = true; }); $('dayMeta').textContent = nameOf(c) + ' · Complete'; return; }
    const p = promptFor(c, day);
    $('dayMeta').textContent = nameOf(c) + ' · Day ' + pad(day) + ' / ' + pad(c.days);
    $('pFocus').textContent = PRACTICES[c.practice].name + ' · ' + p.focus;
    $('pTitle').textContent = p.title; $('pBrief').textContent = p.brief;
    $('pConstraint').textContent = p.constraint; $('pFocus2').textContent = p.focus;
    $('pLen').textContent = c.sprintMin + ' minutes, coached';
    setStep(step);
  };

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
    const c = openC(); const day = c && currentDay(c); if (!day) return;
    const L = lessonFor(c, day);
    const k = c.id + day; if (k !== lessonKey) { lessonKey = k; lessonScreen = 0; }
    const screens = screensFor(L);
    lessonScreen = Math.max(0, Math.min(lessonScreen, screens.length - 1));
    const s = screens[lessonScreen]; const box = $('lScreen'); box.innerHTML = '';
    const add = (tag, cls, txt, parent = box) => { const e = el(tag, cls, txt); parent.append(e); return e; };
    const figures = (list, cls) => { const w = add('div', cls); list.forEach(([mk, cap]) => { const f = add('figure', '', null, w); f.innerHTML = mk; if (cap) add('figcaption', '', cap, f); }); };
    add('p', 'label tag-color', LABELS[s.type] + ' — ' + L.focus);
    if (s.type === 'what') { add('p', 'l-lead', L.what[0]); if (L.what[1]) add('p', 'l-support', L.what[1]); }
    else if (s.type === 'video') { const isFile = /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(L.video); const v = document.createElement(isFile ? 'video' : 'iframe'); v.className = 'l-video'; v.src = L.video; if (isFile) v.controls = true; else v.setAttribute('allowfullscreen', ''); box.append(v); }
    else if (s.type === 'article') { const a = add('div', 'l-article'); L.article.forEach((t) => add('p', '', t, a)); }
    else if (s.type === 'look') { const ul = add('ul', 'l-look'); L.look.forEach((t) => add('li', '', t, ul)); }
    else if (s.type === 'example') { const ex = L.examples[s.i]; figures(ex.figs, 'l-figs'); if (ex.note) add('p', 'l-note', ex.note); }
    else if (s.type === 'recap') { figures(LESSONS.slice(0, 9).map((l, i) => { const f = l.examples[0].figs; return [f[f.length - 1][0], pad(i + 1) + ' ' + L.recapNames[i]]; }), 'l-recap'); }
    else if (s.type === 'questions') { const q = add('div', 'l-questions'); L.questions.forEach((t) => add('p', 'l-lead', t, q)); }
    else if (s.type === 'try') { add('p', 'l-lead', L.try[0]); if (L.try[1]) add('p', 'l-support', L.try[1]); }
    $('lCount').textContent = pad(lessonScreen + 1) + ' / ' + pad(screens.length);
    $('prevBtn').disabled = lessonScreen === 0;
    const last = lessonScreen === screens.length - 1;
    $('nextBtn').textContent = last ? 'To the sprint →' : 'Next';
  };
  $('prevBtn').addEventListener('click', () => { lessonScreen--; renderLesson(); });
  $('nextBtn').addEventListener('click', () => { const c = openC(); const n = screensFor(lessonFor(c, currentDay(c))).length; if (lessonScreen >= n - 1) setStep('sprint'); else { lessonScreen++; renderLesson(); } });

  // ---- coached sprint (stages scale with sprint length) ----
  const STAGES = (focus) => [
    { to: .10, name: 'Read + Respond', color: 'mustard', note: ['Who is this for?', 'What should someone notice first? What is the feeling?'] },
    { to: .25, name: 'Gather references', color: 'pink', note: ['Go find references.', 'Pinterest, Are.na, your camera roll. Keep it quick.'] },
    { to: .50, name: 'Design', color: 'violet', note: ['Start designing.', 'Make, don’t browse.'] },
    { to: .65, name: 'Check ' + focus.toLowerCase(), color: 'green', note: ['What does your eye see first?', 'Is ' + focus.toLowerCase() + ' doing the work?'] },
    { to: .75, name: 'Commit', color: 'red', note: ['Commit to what you have.', 'No new concept.'] },
    { to: .90, name: 'Refine', color: 'violet', note: ['Stop inventing. Start refining.', 'Remove. Resize. Reposition. Retype.'] },
    { to: .95, name: 'Wrap up', color: 'red', note: ['Wrap it up.', 'Fix the one thing that bugs you most.'] },
    { to: 1.0, name: 'Export', color: 'red', note: ['Export now.', 'PNG or JPG from Figma.'] }
  ];
  let ac = null;
  const chime = (done) => {
    if (!state.settings.chime) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      (done ? [523, 659, 784] : [660, 880]).forEach((f, i) => {
        const o = ac.createOscillator(); const g = ac.createGain(); const t = ac.currentTime + i * 0.18;
        o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
        o.connect(g).connect(ac.destination); o.start(t); o.stop(t + 1);
      });
    } catch (e) {}
  };
  const elapsed = () => { const s = state.sprint; if (!s) return 0; return Math.min(s.totalMs, ((s.pausedAt || Date.now()) - s.startedAt - s.pausedTotal) * SPEED); };
  const sprintView = () => {
    const s = state.sprint; const c = s ? byId(s.challengeId) : openC();
    const day = c && (s ? s.day : currentDay(c));
    const p = c && day ? promptFor(c, day) : { focus: 'Focus', title: '' };
    const stages = STAGES(p.focus);
    const totalMs = s ? s.totalMs : (c ? c.sprintMin * 60000 : 1200000);
    const e = elapsed(); const frac = e / totalMs;
    const idx = s ? (frac >= 1 ? stages.length : stages.findIndex((st) => frac < st.to)) : -1;
    const done = !!s && idx >= stages.length;
    const st = stages[Math.max(0, Math.min(idx, stages.length - 1))];
    return {
      c, day, p, stages, idx, done, totalMs, e, frac,
      title: c ? (PRACTICES[c.practice].name + ' · Day ' + day) : '', count: done ? 'Time' : s ? pad(idx + 1) + ' / ' + pad(stages.length) : 'Ready',
      clock: clock(Math.ceil((totalMs - e) / 1000)), total: stages.length, paused: !!(s && s.pausedAt),
      stage: done ? 'Pens down' : s ? st.name : 'Ready', notes: done ? ['Pens down.', 'Export from Figma, then paste it on the wall.'] : s ? st.note : ['Start when you are ready.'],
      color: done ? colorOf(c ? c.practice : 'poster') : s ? COLORS[st.color] : colorOf(c ? c.practice : 'poster')
    };
  };
  const widgetActions = {
    pause: () => togglePause(), next: () => nextStage(),
    back: () => { try { window.focus(); } catch (e) {} },
    submit: () => { const s = state.sprint; Widget.close(); try { window.focus(); } catch (e) {} if (s) openDay(s.challengeId, 'submit'); },
    onClosed: () => { renderSprintPane(); }
  };
  const startSprint = async () => {
    const c = openC(); const day = currentDay(c); if (!day) return;
    if (state.sprint && state.sprint.challengeId !== c.id && !confirm('Another sprint is running. Replace it?')) return;
    state.sprint = { challengeId: c.id, day, startedAt: Date.now(), pausedAt: null, pausedTotal: 0, totalMs: c.sprintMin * 60000, stage: 0 };
    lastStage = 0; save(); chime();
    await Widget.open(widgetActions); tick(true); renderSprintPane();
  };
  const togglePause = () => {
    const s = state.sprint; if (!s) return;
    if (s.pausedAt) { s.pausedTotal += Date.now() - s.pausedAt; s.pausedAt = null; } else s.pausedAt = Date.now();
    save(); tick(true);
  };
  const nextStage = () => {
    const v = sprintView(); const s = state.sprint; if (!s || v.done) return;
    const target = v.stages[v.idx].to * v.totalMs; s.startedAt -= (target - v.e) / SPEED + 5; save(); tick(true);
  };
  const stopSprint = () => { state.sprint = null; save(); Widget.close(); lastStage = -1; document.title = 'Poster Sprint Studio'; renderSprintPane(); renderRun(); };
  $('spStart').addEventListener('click', startSprint);
  $('spPop').addEventListener('click', () => Widget.open(widgetActions).then(() => tick(true)));
  $('spPause').addEventListener('click', togglePause);
  $('spNext').addEventListener('click', nextStage);
  $('spReset').addEventListener('click', () => { if (confirm('Reset this sprint?')) stopSprint(); });

  const renderSprintPane = () => {
    if (view !== 'day' || step !== 'sprint') return;
    const v = sprintView(); const s = state.sprint;
    const mine = s && v.c && s.challengeId === state.openId;
    $('spLabel').textContent = mine ? (v.done ? 'Sprint finished' : v.paused ? 'Paused' : 'Sprint running' + (Widget.mode === 'pip' ? ' in the floating widget' : '')) : 'Ready when you are · ' + Math.round(v.totalMs / 60000) + ' min';
    $('spClock').textContent = mine ? v.clock : clock(v.totalMs / 1000);
    $('spStage').textContent = mine ? v.stage : '';
    $('spStage').style.color = mine ? v.color : '';
    const n = $('spNote'); n.innerHTML = ''; (mine ? v.notes : []).forEach((t) => n.append(el('span', '', t)));
    $('spStart').hidden = !!mine; $('spPause').hidden = !mine || v.done; $('spNext').hidden = !mine || v.done; $('spReset').hidden = !mine;
    $('spPop').hidden = !mine || v.done || Widget.mode === 'pip';
    $('spPop').textContent = Widget.supported ? 'Pop out widget' : 'Show mini widget';
    $('spPause').textContent = v.paused ? 'Resume' : 'Pause';
    $('spHint').hidden = !!mine && !v.done;
    if (mine && v.done) { $('spHint').hidden = false; $('spHint').innerHTML = ''; const b = el('button', 'btn hot', 'Submit your piece →'); b.onclick = () => setStep('submit'); $('spHint').append(b); }
    else $('spHint').textContent = Widget.supported ? 'The coach pops out as a small floating widget that stays on top, so you can work in Figma, Pinterest, or wherever you make things.' : 'Your browser can’t float windows on top (Chrome 116+ can), so the coach shows as a mini widget in the corner of this tab.';
    const list = $('spStages'); list.innerHTML = ''; let from = 0;
    v.stages.forEach((st, i) => {
      const li = el('li', mine ? (i < v.idx ? 'done' : i === v.idx ? 'cur' : '') : ''); li.style.setProperty('--sc', COLORS[st.color]);
      li.append(el('i'), el('span', '', st.name), el('span', 'mid', clock(Math.round((st.to - from) * v.totalMs / 1000)))); from = st.to; list.append(li);
    });
  };
  const renderRun = () => {
    const box = $('sideRun'); const s = state.sprint;
    if (!s) { box.hidden = true; return; }
    const v = sprintView(); box.hidden = false; box.style.setProperty('--c', v.color); box.innerHTML = '';
    box.append(el('p', 'label', v.done ? 'Sprint done' : v.paused ? 'Paused' : 'Sprint running'), el('p', 'run-clock', v.clock), el('p', 'small', v.stage));
    box.onclick = () => openDay(s.challengeId, v.done ? 'submit' : 'sprint');
  };
  let lastStage = -1;
  const tick = (force) => {
    const s = state.sprint; if (!s) return;
    const v = sprintView();
    if (!v.c) { stopSprint(); return; }
    if (v.idx !== lastStage) {
      if (lastStage !== -1) { chime(v.done); Widget.flash(); }
      lastStage = v.idx; s.stage = v.idx; save(); force = true;
    }
    Widget.update(v);
    document.title = v.clock + ' · ' + v.stage;
    renderRun();
    if (view === 'day' && step === 'sprint') renderSprintPane();
  };
  setInterval(tick, 250);

  // ---- submit: drop, browse, or paste the export ----
  let upload = null;
  const setUpload = (f) => {
    if (!f || !/^image\/(png|jpeg|webp|gif)$/.test(f.type)) { $('saveMsg').textContent = 'Use a PNG, JPG, WebP, or GIF export.'; return; }
    upload = f; $('saveMsg').textContent = '';
    const box = $('drop'); box.querySelectorAll('img').forEach((n) => n.remove());
    const m = el('img'); m.src = URL.createObjectURL(f); m.alt = 'Your piece'; box.append(m); box.classList.add('has');
    $('dropHint').hidden = true;
  };
  const drop = $('drop');
  drop.addEventListener('click', () => $('pieceFile').click());
  drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('pieceFile').click(); } });
  $('pieceFile').addEventListener('change', (e) => { setUpload(e.target.files[0]); e.target.value = ''; });
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); setUpload(e.dataTransfer.files[0]); });
  document.addEventListener('paste', (e) => {
    if (view !== 'day' || step !== 'submit') return;
    const f = [...(e.clipboardData ? e.clipboardData.files : [])].find((x) => x.type.startsWith('image/'));
    if (f) { e.preventDefault(); setUpload(f); }
  });
  $('reflectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!upload) { $('saveMsg').textContent = 'Add your exported piece first.'; drop.classList.add('nudge'); setTimeout(() => drop.classList.remove('nudge'), 600); return; }
    const c = openC(); const day = currentDay(c); const fd = new FormData(e.target);
    const piece = { id: uid(), challengeId: c.id, challengeName: nameOf(c), practice: c.practice, day, prompt: promptFor(c, day), blob: upload, mime: upload.type, reflection: { tried: fd.get('tried'), worked: fd.get('worked'), change: fd.get('change') }, critique: null, date: dateKey(), createdAt: Date.now(), demo: false };
    await DB.put('pieces', piece); await loadPieces();
    if (state.sprint && state.sprint.challengeId === c.id) stopSprint();
    upload = null; e.target.reset(); drop.querySelectorAll('img').forEach((n) => n.remove()); drop.classList.remove('has'); $('dropHint').hidden = false;
    step = 'brief'; renderSide();
    go('wall');
    await Wall.paste($('wall'), piece.id);
    openPiece(piece.id, true);
  });

  // ---- the wall ----
  const urls = new Map();
  const blobUrl = (id, blob) => { if (!urls.has(id)) urls.set(id, URL.createObjectURL(blob)); return urls.get(id); };
  const visible = () => pieces.filter((p) => !p.demo || state.settings.demo);
  const mediaFor = (p) => {
    if (p.svg) { const d = el('div', 'svgwrap'); d.innerHTML = p.svg; return d; }
    const m = el('img'); m.src = blobUrl(p.id, p.blob); m.alt = p.prompt.title; m.draggable = false; return m;
  };
  const renderWall = () => {
    const list = visible(); const st = $('stats'); st.innerHTML = '';
    const stat = (n, l) => { const d = el('div'); d.append(el('b', '', String(n)), el('p', 'label mid', l)); st.append(d); };
    stat(list.length, 'Posters up'); stat(new Set(list.map((p) => p.date)).size, 'Days practiced'); stat(streak(), 'Day streak');
    Wall.render($('wall'), list, mediaFor, (id) => openPiece(id));
  };
  // horizontal wheel → sideways walk
  $('wallScroll').addEventListener('wheel', (e) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { $('wallScroll').scrollLeft += e.deltaY; e.preventDefault(); } }, { passive: false });

  // ---- poster detail + embedded critique ----
  const closeModal = () => { $('modal').hidden = true; $('mBox').className = 'm-box'; };
  $('modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('modal').hidden) closeModal(); });
  const scoreEl = (n) => { const s = el('div', 'score'); for (let i = 1; i <= 5; i++) s.append(el('i', i <= n ? 'f' : '')); s.append(el('span', 'label', n + ' / 5')); return s; };
  const openPiece = (id, fresh) => {
    const p = pieces.find((x) => x.id === id); if (!p) return;
    const box = $('mBox'); box.innerHTML = ''; box.className = 'm-box detail'; box.style.setProperty('--c', colorOf(p.practice));
    const media = el('div', 'm-media'); media.append(mediaFor(p));
    const info = el('div', 'm-info');
    const top = el('div', 'band'); top.append(el('span', 'label', (p.challengeName || 'Poster') + ' · Day ' + pad(p.day) + ' · ' + p.date));
    const x = el('button', 'x', 'Close'); x.onclick = closeModal; top.append(x);
    info.append(top, el('h2', '', p.prompt.title));
    if (fresh) info.append(el('p', 'pasted label', 'Pasted up. Nice work.'));
    const sec = (label, cls) => { const s = el('div', 'm-sec ' + (cls || '')); s.append(el('p', 'label', label)); info.append(s); return s; };
    const b = sec('Brief'); b.append(el('p', '', p.prompt.brief));
    const cf = sec('Constraint · Focus'); cf.append(el('p', '', p.prompt.constraint), el('p', '', 'Focus: ' + p.prompt.focus));
    const r = sec('1 · My read', 'mine');
    [['What I tried', p.reflection.tried], ['What worked', p.reflection.worked], ['What I’d change', p.reflection.change]].forEach(([q, a]) => r.append(el('p', 'label mid', q), el('p', '', a || '—')));
    const ai = sec('2 · The critic on ' + p.prompt.focus.toLowerCase(), 'critic');
    const fill = (c) => {
      ai.querySelectorAll(':scope > :not(.label:first-child)').forEach((n) => n.remove());
      if (c.reply) ai.append(el('p', 'reply', '“' + c.reply + '”'));
      ai.append(scoreEl(c.score), el('p', 'label mid', 'Works'), el('p', '', c.works), el('p', 'label mid', 'Push'), el('p', '', c.push));
      if (c.constraint) ai.append(el('p', 'label mid', 'Constraint'), el('p', '', c.constraint));
      ai.append(el('p', 'small mid', 'Feedback from ' + (c.model || 'AI') + '. Your read comes first; take what helps.'));
    };
    const ask = async () => {
      ai.querySelectorAll(':scope > :not(.label:first-child)').forEach((n) => n.remove());
      const ld = el('p', 'loading', 'The critic is looking'); ai.append(ld);
      try {
        p.critique = await window.critique({ blob: p.blob, prompt: p.prompt, practice: p.practice, reflection: p.reflection });
        await DB.put('pieces', p); if (!$('modal').hidden) fill(p.critique);
      } catch (err) {
        ld.remove();
        const off = err instanceof window.CritiqueNotConfigured;
        ai.append(el('p', '', off ? err.message + ' Your reflection is saved; feedback will appear here once it’s on.' : err.message));
        const again = el('button', 'btn quiet', 'Try again'); again.onclick = ask; ai.append(again);
      }
    };
    if (p.critique) fill(p.critique);
    else if (p.svg) ai.append(el('p', 'small mid', 'Demo poster. Real pieces get feedback here.'));
    else ask();
    const row = el('div', 'row');
    const del = el('button', 'btn quiet', 'Take it down'); del.onclick = async () => { if (!confirm('Remove this poster from the wall?')) return; await DB.del('pieces', p.id); await loadPieces(); closeModal(); renderSide(); renderWall(); };
    row.append(del); info.append(row);
    box.append(media, info); $('modal').hidden = false;
  };

  // ---- export / import ----
  const toDataURL = (blob) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); });
  $('exportBtn').addEventListener('click', async () => {
    const out = [];
    for (const p of pieces.filter((x) => !x.demo)) { const c = Object.assign({}, p); if (p.blob) c.blob = await toDataURL(p.blob); out.push(c); }
    const data = { app: 'poster-sprint-studio', version: 2, exportedAt: new Date().toISOString(), challenges: state.challenges, pieces: out };
    const a = el('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' })); a.download = 'poster-wall-' + dateKey() + '.json'; a.click();
  });
  $('importFile').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!Array.isArray(data.pieces)) throw new Error('Not an archive file');
      for (const p of data.pieces) { if (typeof p.blob === 'string') p.blob = await (await fetch(p.blob)).blob(); await DB.put('pieces', p); }
      (data.challenges || []).forEach((c) => { if (!state.challenges.some((x) => x.id === c.id)) state.challenges.push(c); });
      save(); await loadPieces(); renderSide(); renderWall(); alert('Imported ' + data.pieces.length + ' posters.');
    } catch (err) { alert('Import failed: ' + err.message); }
    e.target.value = '';
  });

  // ---- demo posters ----
  const setDemo = async (on) => {
    const old = (await DB.all('pieces')).filter((p) => p.demo);
    for (const p of old) await DB.del('pieces', p.id);
    if (on) {
      const D = window.DEMO; const now = new Date();
      for (let i = 0; i < D.posters.length; i++) {
        const day = new Date(now); day.setDate(now.getDate() - (D.posters.length - i)); day.setHours(12);
        const [practice, pi] = D.meta[i]; const r = D.reflect[i];
        await DB.put('pieces', { id: 'demo-' + i, demo: true, challengeId: 'demo', challengeName: PRACTICES[practice].name + ' · demo', practice, day: pi + 1, prompt: PRACTICES[practice].prompts[pi], svg: D.posters[i], reflection: { tried: r[0], worked: r[1], change: r[2] }, critique: i % 3 === 2 ? null : { works: 'The dominant element gives a clear first read from across the street.', push: 'Open up more space between the second and third read.', constraint: 'Constraint followed.', reply: i % 2 ? 'Agreed, the small text needs one more step of contrast.' : 'You are right about the first read; it lands immediately.', score: 3 + (i % 3), model: 'demo' }, date: dateKey(day), createdAt: day.getTime() });
      }
    }
    await loadPieces();
  };

  // ---- boot ----
  (async () => {
    if (!state.challenges.length) { state.challenges.push(makeChallenge('poster', 10, 20, null)); save(); }
    if (params.has('demo')) { state.settings.demo = true; save(); }
    await loadPieces();
    if (state.settings.demo && !pieces.some((p) => p.demo)) await setDemo(true);
    renderSide();
    const v = params.get('view');
    if (v === 'day' && state.openId) openDay(state.openId, params.get('step') || undefined); else go(VIEWS.includes(v) ? v : 'today');
    if (state.sprint) { lastStage = state.sprint.stage; tick(true); Widget.showMini(widgetActions); Widget.update(sprintView()); }
  })();
})();
