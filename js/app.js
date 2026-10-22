/* Poster Sprint Studio v2: Today / Challenges / The Wall. Classic script, no build step. */
(() => {
  const { FORMATS, FORMAT_ORDER, FBRIEFS, PRACTICES, EXTRA_LESSONS, SCENARIOS, SKILLS, SKILL_ORDER, BRIEFS } = window.STUDIO_DATA;
  const LESSONS = window.LESSONS;
  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, '0');
  const clock = (sec) => pad(Math.floor(Math.max(0, sec) / 60)) + ':' + pad(Math.floor(Math.max(0, sec) % 60));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const dateKey = (d = new Date()) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const COLORS = { red: '#e5322d', violet: '#5b3fd1', pink: '#ff3e9a', mustard: '#f2b705', green: '#12a150', ink: '#111111' };
  const kindOf = (k) => FORMATS[k] || SCENARIOS[k] || PRACTICES[k] || SCENARIOS.own;
  const colorOf = (k) => COLORS[kindOf(k).color] || COLORS.red;

  const params = new URLSearchParams(location.search);
  const SPEED = Math.max(1, Number(params.get('speed')) || 1);
  if (params.has('nopip')) window.__noPiP = true;
  

  // ---- state: small things in localStorage, pieces (images) in IndexedDB ----
  const KEY = 'posterSprintStudio.v3';
  const fresh = () => ({ challenges: [], sprint: null, openId: null, settings: { chime: true, demo: false } });
  if (params.has('reset')) { localStorage.removeItem(KEY); localStorage.removeItem('posterSprintStudio.v1'); }
  let state;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY)) || {};
    state = Object.assign(fresh(), raw || {});
  } catch (e) { state = fresh(); }
  // v4 migration: older challenges (practice + focus + topic) become 'Make your own' scenarios.
  const skillKey = (focus) => { const n = String(focus || '').toLowerCase(); return SKILL_ORDER.find((k) => n.includes(k) || n.includes(SKILLS[k].lesson.toLowerCase().split(' ')[0])) || (n.includes('typo') ? 'type' : n.includes('compos') ? 'layout' : null); };
  state.challenges.forEach((c) => {
    if (c.scenario) return;
    const k = skillKey(c.focus);
    c.scenario = 'own'; c.own = c.topic || (PRACTICES[c.practice] || {}).name || 'your own project';
    c.plan = k ? 'one' : 'mixed'; c.skill = k || null; c.practice = 'own';
  });
  // v5 migration: every older challenge is a Poster; its scenario becomes the optional context.
  state.challenges.forEach((c) => {
    if (c.format) return;
    c.format = 'poster'; c.context = c.scenario && c.scenario !== 'own' ? c.scenario : ''; c.ctxText = c.scenario === 'own' ? (c.own || '') : ''; c.own = ''; c.practice = 'poster';
  });
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };

  let pieces = [];
  const loadPieces = async () => { pieces = (await DB.all('pieces')).sort((a, b) => a.createdAt - b.createdAt); };

  // ---- challenges ----
  const makeChallenge = (format, own, context, ctxText, plan, skill, days, sprintMin) => ({ id: uid(), format, practice: format, own, context, ctxText, plan, skill, days, sprintMin, createdAt: Date.now() });
  const byId = (id) => state.challenges.find((c) => c.id === id);
  const cap = (t) => t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
  const ctxOf = (c) => c.context && SCENARIOS[c.context] ? SCENARIOS[c.context].name : (c.ctxText || '');
  const fmtName = (c) => c.format === 'own' ? cap(c.own || 'Make your own') : (FORMATS[c.format] || FORMATS.poster).name;
  const nameOf = (c) => fmtName(c) + (ctxOf(c) ? ' · ' + ctxOf(c) : '');
  const skillFor = (c, day) => c.plan === 'one' && SKILLS[c.skill] ? c.skill : SKILL_ORDER[(day - 1) % SKILL_ORDER.length];
  const doneFor = (c) => pieces.filter((p) => p.challengeId === c.id && !p.demo);
  const currentDay = (c) => { const n = doneFor(c).length + 1; return n > c.days ? null : n; };
  const promptFor = (c, day) => {
    const fk = FORMATS[c.format] ? c.format : 'poster'; const F = FORMATS[fk]; const sk = skillFor(c, day); const i = day - 1;
    const v = (cell) => cell[(c.plan === 'one' ? i : Math.floor(i / SKILL_ORDER.length)) % cell.length];
    const ctx = ctxOf(c); const S = SCENARIOS[c.context];
    const base = { focus: SKILLS[sk].lesson, skill: SKILLS[sk].name, format: fmtName(c), formatKey: fk, context: ctx, scenario: ctx };
    if (fk === 'poster') {
      const job = S && S.jobs.length ? S.jobs[i % S.jobs.length] : { title: ctx ? cap(ctx) + ' — poster' : 'Poster', for: ctx ? 'a poster for ' + ctx : 'a poster on a topic you pick', copy: '' };
      const [brief, constraint] = v(BRIEFS[sk][S && S.jobs.length ? c.context : 'own']);
      return Object.assign(base, { piece: 'poster', title: job.title, brief: brief.replace('{job}', job.for) + (job.copy ? ' Copy: ' + job.copy : ''), constraint });
    }
    const piece = F.pieces.length ? F.pieces[i % F.pieces.length] : (c.own || 'piece');
    const [brief, constraint] = v(FBRIEFS[fk][sk]);
    return Object.assign(base, { piece, title: cap(piece) + (ctx ? ' — ' + ctx : ''), brief: brief.replace('{piece}', piece) + (ctx ? ' Context: ' + ctx + (S ? ' — ' + S.line : '') : ''), constraint });
  };
  const norm = (s) => String(s).toLowerCase().replace(/\band\b|[^a-z]/g, '');
  const lessonFor = (c, day) => {
    const f = norm(promptFor(c, day).focus);
    const hit = LESSONS.find((l) => !l.recap && norm(l.focus) === f) || Object.values(EXTRA_LESSONS).find((l) => norm(l.focus) === f) || null;
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
    s.append(el('p', 'streak', String(n)), el('p', 'streak-l', 'day streak'));
  };

  // ---- filters ----
  const filterState = { today: 'all', challenges: 'all' };
  const renderFilters = (box, which, keys) => {
    box.innerHTML = '';
    [['all', 'All']].concat(keys.map((k) => [k, kindOf(k).name])).forEach(([k, n]) => {
      const b = el('button', 'chip' + (filterState[which] === k ? ' on' : ''), n); b.type = 'button';
      if (k !== 'all') b.style.setProperty('--c', colorOf(k));
      b.onclick = () => { filterState[which] = k; which === 'today' ? renderToday() : renderChallenges(); };
      box.append(b);
    });
  };
  const segs = (c, done) => { const w = el('div', 'segs'); for (let i = 1; i <= c.days; i++) w.append(el('i', i <= done ? 'f' : i === done + 1 ? 'c' : '')); return w; };

  // ---- today ----
  const renderToday = () => {
    const live = state.challenges.filter((c) => currentDay(c));
    const kinds = [...new Set(live.map((c) => c.practice))];
    if (kinds.length > 1) renderFilters($('todayFilters'), 'today', kinds); else $('todayFilters').innerHTML = '';
    const box = $('todayCards'); box.innerHTML = '';
    const f = kinds.length > 1 ? filterState.today : 'all';
    live.slice().reverse().filter((c) => f === 'all' || c.practice === f).forEach((c) => {
      const day = currentDay(c); const done = day - 1;
      const card = el('button', 'card pcard'); card.type = 'button'; card.style.setProperty('--c', colorOf(c.practice));
      const band = el('div', 'band'); band.append(el('span', '', promptFor(c, day).skill), el('span', '', 'Day ' + day + '/' + c.days));
      const running = state.sprint && state.sprint.challengeId === c.id;
      const body = el('div', 'cbody'); body.append(el('b', 'ctitle', nameOf(c)), el('p', 'cfocus', 'Today: ' + promptFor(c, day).skill + (c.plan === 'one' ? '' : ' · mixed')));
      const foot = el('div', 'cfoot'); foot.append(segs(c, done));
      if (running) card.classList.add('running');
      card.append(band, body, foot); card.onclick = () => openDay(c.id); box.append(card);
    });
    const add = el('button', 'card addcard'); add.type = 'button'; add.append(el('span', 'plus', '+'), el('b', 'ctitle', 'New challenge'));
    add.onclick = () => go('challenges'); box.append(add);
  };

  // ---- new challenge: format, skills, optional context ----
  let pick = null, plan = 'mixed', planSkill = null, ctxPick = '';
  const renderChallenges = () => {
    const box = $('typeCards'); box.innerHTML = '';
    FORMAT_ORDER.forEach((k) => { const v = FORMATS[k];
      const card = el('button', 'tcard' + (pick === k ? ' on' : '')); card.type = 'button'; card.style.setProperty('--c', colorOf(k));
      card.append(el('b', '', v.name), el('span', '', v.line));
      card.onclick = () => { const first = !pick; pick = k; renderChallenges(); if (k === 'own') $('nfOwn').focus(); if (first) setTimeout(() => $('newForm').scrollIntoView({ behavior: 'smooth', block: 'start' }), 30); };
      box.append(card);
    });
    $('nfOwnRow').hidden = pick !== 'own'; $('nfOwn').required = pick === 'own';
    $('newForm').hidden = !pick;
    if (pick) $('newForm').style.setProperty('--c', colorOf(pick));
    const pb = $('planCards'); pb.innerHTML = '';
    [['mixed', 'Mixed', 'A different fundamental each day.'], ['one', 'One focus', 'Every day, the same skill.']].forEach(([k, n, d]) => {
      const c = el('button', 'tcard small' + (plan === k ? ' on' : '')); c.type = 'button'; c.append(el('b', '', n), el('span', '', d));
      c.onclick = () => { plan = k; if (k === 'one' && !planSkill) planSkill = 'type'; renderChallenges(); }; pb.append(c);
    });
    const sb = $('skillChips'); sb.innerHTML = ''; sb.hidden = false;
    SKILL_ORDER.forEach((k) => { const c = el('button', 'chip' + (plan === 'one' && planSkill === k ? ' on' : ''), SKILLS[k].name); c.type = 'button'; c.onclick = () => { plan = 'one'; planSkill = k; renderChallenges(); }; sb.append(c); });
    sb.classList.toggle('dim', plan !== 'one');
    const cb = $('ctxChips'); cb.innerHTML = '';
    Object.entries(SCENARIOS).filter(([k]) => k !== 'own').forEach(([k, v]) => { const c = el('button', 'chip' + (ctxPick === k ? ' on' : ''), v.name.replace(' brand', '').replace(' flyer', '')); c.type = 'button'; c.onclick = () => { ctxPick = ctxPick === k ? '' : k; if (ctxPick) $('nfCtx').value = ''; renderChallenges(); }; cb.append(c); });
  };
  $('nfCtx').addEventListener('input', () => { if ($('nfCtx').value && ctxPick) { ctxPick = ''; renderChallenges(); } });
  $('newForm').querySelectorAll('.seg').forEach((sg) => sg.addEventListener('click', (e) => { if (e.target.tagName !== 'BUTTON') return; sg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === e.target)); }));
  $('newForm').addEventListener('submit', (e) => {
    e.preventDefault(); if (!pick) return;
    const f = $('newForm'); const seg = (n) => Number(f.querySelector(`.seg[data-name=${n}] .on`).value);
    const c = makeChallenge(pick, pick === 'own' ? $('nfOwn').value.trim() : '', ctxPick, ctxPick ? '' : $('nfCtx').value.trim(), plan, plan === 'one' ? planSkill : null, seg('days'), seg('sprint'));
    state.challenges.push(c); save(); pick = null; plan = 'mixed'; planSkill = null; ctxPick = ''; $('nfOwn').value = ''; $('nfCtx').value = ''; openDay(c.id);
  });

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
    if (!day) { ['brief', 'lesson', 'sprint', 'submit'].forEach((k) => { $('s-' + k).hidden = true; }); $('dayMeta').textContent = nameOf(c); return; }
    const p = promptFor(c, day);
    $('dayMeta').textContent = 'Day ' + day + ' of ' + c.days;
    $('pFocus').textContent = 'Day ' + day + ' · ' + p.skill + ' — ' + p.piece + (p.context ? ' · for ' + p.context : '');
    $('pTitle').textContent = p.title; $('pBrief').textContent = p.brief;
    $('pConstraint').textContent = p.constraint;
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
    add('p', 'kicker', LABELS[s.type]);
    if (s.type === 'what') { add('p', 'l-lead', L.what[0]); if (L.what[1]) add('p', 'l-support', L.what[1]); }
    else if (s.type === 'video') { const isFile = /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(L.video); const v = document.createElement(isFile ? 'video' : 'iframe'); v.className = 'l-video'; v.src = L.video; if (isFile) v.controls = true; else v.setAttribute('allowfullscreen', ''); box.append(v); }
    else if (s.type === 'article') { const a = add('div', 'l-article'); L.article.forEach((t) => add('p', '', t, a)); }
    else if (s.type === 'look') { const ul = add('ul', 'l-look'); L.look.forEach((t) => add('li', '', t, ul)); }
    else if (s.type === 'example') { const ex = L.examples[s.i]; figures(ex.figs, 'l-figs'); if (ex.note) add('p', 'l-note', ex.note); }
    else if (s.type === 'recap') { figures(LESSONS.slice(0, 9).map((l, i) => { const f = l.examples[0].figs; return [f[f.length - 1][0], pad(i + 1) + ' ' + L.recapNames[i]]; }), 'l-recap'); }
    else if (s.type === 'questions') { const q = add('div', 'l-questions'); L.questions.forEach((t) => add('p', 'l-lead', t, q)); }
    else if (s.type === 'try') { add('p', 'l-lead', L.try[0]); if (L.try[1]) add('p', 'l-support', L.try[1]); }
    $('lCount').textContent = (lessonScreen + 1) + ' / ' + screens.length;
    $('prevBtn').disabled = lessonScreen === 0;
    const last = lessonScreen === screens.length - 1;
    $('nextBtn').textContent = last ? 'Sprint →' : 'Next';
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
      title: c ? (nameOf(c) + ' · Day ' + day) : '', count: done ? 'Time' : s ? pad(idx + 1) + ' / ' + pad(stages.length) : 'Ready',
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
    $('spClock').textContent = mine ? v.clock : clock(v.totalMs / 1000);
    $('spStage').textContent = mine ? v.stage : '';
    $('spStage').style.color = mine ? v.color : '';
    const n = $('spNote'); n.innerHTML = ''; (mine ? v.notes : []).forEach((t) => n.append(el('span', '', t)));
    $('spStart').hidden = !!mine; $('spPause').hidden = !mine || v.done; $('spNext').hidden = !mine || v.done; $('spReset').hidden = !mine;
    $('spPop').hidden = !mine || v.done || Widget.mode === 'pip';
    
    $('spPause').textContent = v.paused ? 'Resume' : 'Pause';
    $('spHint').innerHTML = '';
    if (mine && v.done) { const b = el('button', 'btn hot big', 'Paste it up →'); b.onclick = () => setStep('submit'); $('spHint').append(b); }
    const list = $('spStages'); list.innerHTML = ''; let from = 0;
    v.stages.forEach((st, i) => {
      const li = el('li', mine ? (i < v.idx ? 'done' : i === v.idx ? 'cur' : '') : ''); li.style.setProperty('--sc', COLORS[st.color]);
      li.append(el('i'), el('span', '', st.name)); from = st.to; list.append(li);
    });
  };
  const renderRun = () => {
    const box = $('sideRun'); const s = state.sprint;
    if (!s) { box.hidden = true; return; }
    const v = sprintView(); box.hidden = false; box.style.setProperty('--c', v.color); box.innerHTML = '';
    box.append(el('p', 'run-clock', v.clock), el('p', 'run-stage', v.stage));
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
    const piece = { id: uid(), challengeId: c.id, challengeName: nameOf(c), practice: c.format || 'poster', format: c.format || 'poster', day, prompt: promptFor(c, day), blob: upload, mime: upload.type, reflection: { tried: fd.get('tried'), worked: '', change: fd.get('change') }, critique: null, date: dateKey(), createdAt: Date.now(), demo: false };
    if (piece.format !== 'poster') { try { piece.sheet = await makeSheet(upload, (FORMATS[piece.format] || FORMATS.own).tag, piece.prompt.piece); } catch (err) {} }
    await DB.put('pieces', piece); await loadPieces();
    if (state.sprint && state.sprint.challengeId === c.id) stopSprint();
    upload = null; e.target.reset(); drop.querySelectorAll('img').forEach((n) => n.remove()); drop.classList.remove('has'); $('dropHint').hidden = false;
    step = 'brief'; renderSide();
    const crit = window.critique({ blob: piece.blob, prompt: piece.prompt, practice: piece.practice, reflection: piece.reflection })
      .then(async (cr) => { piece.critique = cr; await DB.put('pieces', piece); return cr; });
    crit.catch(() => {});
    pasting = piece.id; go('wall');
    await wallPaste(piece.id); pasting = null;
    Feedback.open(piece, blobUrl(piece.id, piece.blob), crit, { onWall: () => Feedback.close(), retry: () => window.critique({ blob: piece.blob, prompt: piece.prompt, practice: piece.practice, reflection: piece.reflection }).then(async (cr) => { piece.critique = cr; await DB.put('pieces', piece); return cr; }) });
  });

  // Non-poster work gets printed out: the image on a paper sheet with a stamped format tag (aspect ratio kept).
  const makeSheet = (blob, tag, piece) => new Promise((res, rej) => {
    const img = new Image(); img.onload = () => {
      const W = 1200, pad = 70, iw = W - pad * 2, ih = Math.round(iw * img.height / img.width), maxH = 1700;
      const h = Math.min(ih, maxH), w = h < ih ? Math.round(h * img.width / img.height) : iw;
      const c = document.createElement('canvas'); c.width = W; c.height = h + pad * 2 + 110; const g = c.getContext('2d');
      g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, c.width, c.height);
      g.drawImage(img, (W - w) / 2, pad, w, h); g.strokeStyle = 'rgba(0,0,0,.15)'; g.strokeRect((W - w) / 2, pad, w, h);
      g.font = '600 26px Helvetica, Arial, sans-serif'; g.fillStyle = '#555'; g.fillText(String(piece || '').toUpperCase(), pad, c.height - 60);
      g.save(); g.translate(W - pad - 10, c.height - 50); g.rotate(-0.06); g.font = '900 64px Helvetica, Arial, sans-serif';
      const tw = g.measureText(tag).width + 28; g.strokeStyle = '#e5322d'; g.lineWidth = 4; g.strokeRect(-tw, -56, tw, 80); g.fillStyle = '#e5322d'; g.fillText(tag, -tw + 14, 6); g.restore();
      c.toBlob((b) => b ? res(b) : rej(new Error('sheet')), 'image/png');
    }; img.onerror = rej; img.src = URL.createObjectURL(blob);
  });

  // ---- the wall ----
  const urls = new Map();
  const blobUrl = (id, blob) => { if (!urls.has(id)) urls.set(id, URL.createObjectURL(blob)); return urls.get(id); };
  const visible = () => pieces.filter((p) => !p.demo || state.settings.demo);
  const mediaFor = (p) => {
    if (p.svg) { const d = el('div', 'svgwrap'); d.innerHTML = p.svg; return d; }
    const m = el('img'); m.src = p.sheet ? blobUrl(p.id + ':s', p.sheet) : blobUrl(p.id, p.blob); m.alt = p.prompt.title; m.draggable = false; return m;
  };
  const srcOf = (p) => p.svg ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(p.svg.replace('<svg ', '<svg width="600" height="800" ')) : p.sheet ? blobUrl(p.id + ':s', p.sheet) : blobUrl(p.id, p.blob);
  let pasting = null; let use3d = null;
  const has3d = async () => {
    if (use3d !== null) return use3d;
    for (let i = 0; i < 60 && !window.Wall3D && !window.Wall3DFailed; i++) await new Promise((r) => setTimeout(r, 100));
    use3d = !!(window.Wall3D && window.Wall3D.ok());
    $('wall3d').hidden = !use3d; $('wallScroll').hidden = use3d;
    return use3d;
  };
  const renderWall = async () => {
    const list = visible();
    $('stats').textContent = list.length + (list.length === 1 ? ' piece' : ' pieces');
    if (await has3d()) Wall3D.render($('wall3d'), list, srcOf, (id) => openPiece(id), pasting);
    else Wall.render($('wall'), list, mediaFor, (id) => openPiece(id));
  };
  const wallPaste = async (id) => { if (await has3d()) { await Wall3D.ready; await Wall3D.paste(id); } else await Wall.paste($('wall'), id); };
  $('wallScroll').addEventListener('wheel', (e) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { $('wallScroll').scrollLeft += e.deltaY; e.preventDefault(); } }, { passive: false });

  const openPiece = (id) => {
    const p = pieces.find((x) => x.id === id); if (!p) return;
    const crit = p.critique ? Promise.resolve(p.critique) : p.svg ? Promise.reject(new Error('Demo poster.')) : window.critique({ blob: p.blob, prompt: p.prompt, practice: p.practice, reflection: p.reflection }).then(async (cr) => { p.critique = cr; await DB.put('pieces', p); return cr; });
    crit.catch(() => {});
    Feedback.open(p, srcOf(p), crit, { onWall: () => Feedback.close(), remove: async () => { if (!confirm('Take this poster down?')) return; await DB.del('pieces', p.id); await loadPieces(); Feedback.close(); renderSide(); renderWall(); } });
  };

  // ---- export / import ----
  const toDataURL = (blob) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); });
  $('exportBtn') && $('exportBtn').addEventListener('click', async () => {
    const out = [];
    for (const p of pieces.filter((x) => !x.demo)) { const c = Object.assign({}, p); if (p.blob) c.blob = await toDataURL(p.blob); out.push(c); }
    const data = { app: 'poster-sprint-studio', version: 2, exportedAt: new Date().toISOString(), challenges: state.challenges, pieces: out };
    const a = el('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' })); a.download = 'poster-wall-' + dateKey() + '.json'; a.click();
  });
  $('importFile') && $('importFile').addEventListener('change', async (e) => {
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
    if (!window.DEMO) return;
    for (const p of old) await DB.del('pieces', p.id);
    if (on) {
      const D = window.DEMO; const now = new Date();
      for (let i = 0; i < D.posters.length; i++) {
        const day = new Date(now); day.setDate(now.getDate() - (D.posters.length - i)); day.setHours(12);
        const [practice, pi] = D.meta[i]; const r = D.reflect[i];
        await DB.put('pieces', { id: 'demo-' + i, demo: true, challengeId: 'demo', challengeName: 'Demo', practice, day: pi + 1, prompt: { title: 'Demo', brief: '', constraint: '', focus: 'Hierarchy' }, svg: D.posters[i], reflection: { tried: r[0], worked: r[1], change: r[2] }, critique: i % 3 === 2 ? null : { works: 'The dominant element gives a clear first read from across the street.', push: 'Open up more space between the second and third read.', constraint: 'Constraint followed.', reply: i % 2 ? 'Agreed, the small text needs one more step of contrast.' : 'You are right about the first read; it lands immediately.', score: 3 + (i % 3), model: 'demo' }, date: dateKey(day), createdAt: day.getTime() });
      }
    }
    await loadPieces();
  };

  // ---- boot ----
  (async () => {
    
    if (params.has('demo')) { state.settings.demo = true; save(); }
    await loadPieces();
    if (state.settings.demo && !pieces.some((p) => p.demo)) await setDemo(true);
    renderSide();
    const v = params.get('view');
    if (v === 'day' && state.openId) openDay(state.openId, params.get('step') || undefined); else go(VIEWS.includes(v) ? v : 'today');
    if (state.sprint) { lastStage = state.sprint.stage; tick(true); Widget.showMini(widgetActions); Widget.update(sprintView()); }
  })();
})();
