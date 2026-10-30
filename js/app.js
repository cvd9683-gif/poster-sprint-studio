/* Show Up: Today / Challenges / The Wall. Classic script, no build step. */
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
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} try { window.dispatchEvent(new Event('showup-save')); } catch (e) {} };

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
  // Everyday subjects for missions with no client, so day 1 is never "a poster on a topic you pick".
  const SUBJECTS = ['a neighborhood farmers market', 'a late-night ramen shop', 'a lost cat', 'a community garden open day', 'a bike repair pop-up', 'a used bookstore sale',
    'a laundromat movie night', 'a dog adoption weekend', 'a corner bodega', 'a rooftop swap meet', 'a school bake sale', 'a pickup soccer league',
    'a free museum night', 'a record store reopening', 'a subway busker festival', 'a plant swap', 'a late bus route', 'a public pool opening'];
  const hashOf = (t) => { let h = 7; for (const ch of String(t)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
  const subjectFor = (c, day) => SUBJECTS[(hashOf(c.id) + (day - 1) * 7) % SUBJECTS.length];
  const promptFor = (c, day) => {
    const fk = FORMATS[c.format] ? c.format : 'poster'; const F = FORMATS[fk]; const sk = skillFor(c, day); const i = day - 1;
    const v = (cell) => cell[(c.plan === 'one' ? i : Math.floor(i / SKILL_ORDER.length)) % cell.length];
    const S = SCENARIOS[c.context]; const ctx = ctxOf(c) || subjectFor(c, day);
    const base = { focus: SKILLS[sk].lesson, skill: SKILLS[sk].name, format: fmtName(c), formatKey: fk, context: ctx, scenario: ctx };
    if (fk === 'poster') {
      const job = S && S.jobs.length ? S.jobs[(i + hashOf(c.id)) % S.jobs.length] : { title: cap(ctx), for: 'a poster for ' + ctx, copy: '' };
      const [brief, constraint] = v(BRIEFS[sk][S && S.jobs.length ? c.context : 'own']);
      return Object.assign(base, { piece: 'poster', title: job.title, brief: brief.replace('{job}', job.for).replace(/\bposter for a poster (for|on)\b/gi, 'poster $1').replace(/\ba poster for a poster\b/gi, 'a poster') + (job.copy ? ' Copy: ' + job.copy : ''), constraint });
    }
    const piece = F.pieces.length ? F.pieces[i % F.pieces.length] : (c.own || 'piece');
    const [brief, constraint] = v(FBRIEFS[fk][sk]);
    return Object.assign(base, { piece, title: cap(piece) + (ctx ? ' · ' + cap(ctx) : ''), brief: brief.replace('{piece}', piece) + (ctx ? ' Context: ' + ctx + (S ? '. ' + S.line : '.') : ''), constraint });
  };
  const norm = (s) => String(s).toLowerCase().replace(/\band\b|[^a-z]/g, '');
  const lessonFor = (c, day) => {
    const f = norm(promptFor(c, day).focus);
    const hit = LESSONS.find((l) => !l.recap && norm(l.focus) === f) || Object.values(EXTRA_LESSONS).find((l) => norm(l.focus) === f) || null;
    return hit || { focus: promptFor(c, day).focus, examples: [], what: ['Today’s focus: ' + promptFor(c, day).focus + '.', 'Write down what this skill means to you before you start.'], look: ['One clear decision', 'One deliberate contrast', 'One thing you will not do'], try: ['Make the focus skill the most visible thing in the piece.'] };
  };
  const streak = () => {
    const days = new Set(pieces.filter((p) => !p.demo).map((p) => p.date));
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
    let howHidden = false; try { howHidden = localStorage.getItem('showup.howHidden') === '1'; } catch (e) {}
    $('howItWorks').hidden = howHidden && state.challenges.length > 0;
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
    const add = el('button', 'card addcard'); add.type = 'button'; add.append(el('span', 'plus', '+'), el('b', 'ctitle', 'Add a mission'), el('p', 'cfocus', live.length ? 'Start another daily practice.' : 'Pick something to practice. Takes 30 seconds.'));
    add.onclick = () => go('challenges'); box.append(add);
  };

  $('howHide').addEventListener('click', () => { try { localStorage.setItem('showup.howHidden', '1'); } catch (e) {} $('howItWorks').hidden = true; });

  // ---- new challenge: format, skills, optional context ----
  let mode = 'solo', pick = null, plan = 'mixed', planSkill = null, ctxPick = '';
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
    const mb = $('modeCards'); mb.innerHTML = '';
    [['solo', 'Solo', 'Just you.'], ['duo', 'With a friend', 'Same prompts each day. You get an invite link to send.']].forEach(([k, n, d]) => {
      const c = el('button', 'tcard small' + (mode === k ? ' on' : '')); c.type = 'button'; c.append(el('b', '', n), el('span', '', d));
      c.onclick = () => { mode = k; renderChallenges(); }; mb.append(c);
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
    if (mode === 'duo') { c.shared = { host: myName(), members: [myName()] }; if (window.Cloud) window.Cloud.shareChallenge(c); }
    state.challenges.push(c); save(); const wasDuo = mode === 'duo'; mode = 'solo'; pick = null; plan = 'mixed'; planSkill = null; ctxPick = ''; $('nfOwn').value = ''; $('nfCtx').value = ''; openDay(c.id); if (wasDuo) invite(c);
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
    step = s; if (s === 'sprint') $('spLinks').innerHTML = '';
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
    $('pFocus').textContent = 'Day ' + day + ' · ' + p.skill + ' · ' + p.piece + (p.context ? ' · for ' + p.context : '');
    $('pTitle').textContent = p.title; $('pBrief').textContent = p.brief;
    $('pConstraint').textContent = p.constraint;
    const duo = !!c.shared; $('duelBtn').hidden = duo; $('togetherBtn').hidden = !duo; $('inviteBtn').hidden = !duo;
    if (duo && window.Duel) window.Duel.presence(c.id, day, (who, waiting) => { const h = $('duoHere'); h.hidden = !who; h.textContent = !who ? '' : waiting ? who + ' is waiting. Press Start together.' : who + ' is here'; });
    else if (window.Duel) window.Duel.presence(null);
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
    { to: .50, name: 'Design', color: 'violet', note: ['Switch to Figma or Illustrator.', 'Design there. Make, don’t browse.'] },
    { to: .65, name: 'Check ' + focus.toLowerCase(), color: 'green', note: ['What does your eye see first?', 'Is ' + focus.toLowerCase() + ' doing the work?'] },
    { to: .75, name: 'Commit', color: 'red', note: ['Commit to what you have.', 'No new concept.'] },
    { to: .90, name: 'Refine', color: 'violet', note: ['Stop inventing. Start refining.', 'Remove. Resize. Reposition. Retype.'] },
    { to: .95, name: 'Wrap up', color: 'red', note: ['Wrap it up.', 'Fix the one thing that bugs you most.'] },
    { to: 1.0, name: 'Export', color: 'red', note: ['Export now.', 'PNG or JPG from your design tool.'] }
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
      stage: done ? 'Pens down' : s ? st.name : 'Ready', notes: done ? ['Pens down.', 'Export from your design tool, then paste it on the wall.'] : s ? st.note : ['Start when you are ready.', 'You will design in your own tool. This timer coaches you.'],
      color: done ? colorOf(c ? c.practice : 'poster') : s ? COLORS[st.color] : colorOf(c ? c.practice : 'poster')
    };
  };
  const widgetActions = {
    pause: () => togglePause(), next: () => nextStage(),
    back: () => { try { window.focus(); } catch (e) {} },
    float: () => Widget.open(widgetActions).then(() => { tick(true); renderSprintPane(); }),
    submit: () => { const s = state.sprint; Widget.close(); try { window.focus(); } catch (e) {} if (s) openDay(s.challengeId, 'submit'); },
    onClosed: () => { if (state.sprint && !sprintView().done) { Widget.showMini(widgetActions); Widget.update(sprintView()); } renderSprintPane(); }
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
  const stopSprint = () => { state.sprint = null; save(); Widget.close(); lastStage = -1; document.title = 'Show Up'; renderSprintPane(); renderRun(); };
  $('spStart').addEventListener('click', startSprint);
  $('spPop').addEventListener('click', () => Widget.open(widgetActions).then(() => { tick(true); renderSprintPane(); }));
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
    $('spPop').hidden = !mine || v.done || Widget.mode === 'pip' || !Widget.supported;
    $('spElseP').textContent = !mine ? 'Press Start and a small timer ' + (Widget.supported ? 'floats on top of your other apps' : 'appears in the corner') + '. Leave it open, switch to Figma, Illustrator, Pinterest, or paper, and make the piece there. The timer tells you when to move on.'
      : v.done ? 'Time. Export a PNG or JPG from your design tool, then paste it up here.'
      : Widget.mode === 'pip' ? 'The timer is floating on top of your other apps. Leave it open and go design in Figma, Illustrator, or on paper.'
      : Widget.supported ? 'The timer is in the corner of this tab. Press Float timer on top so it stays visible while you work in Figma or Illustrator.'
      : 'This browser cannot float the timer over other apps. Keep this tab visible next to your design tool, or use Chrome or Edge.';
    const lk = $('spLinks'); if (!lk.childElementCount) {
      const q = encodeURIComponent(((v.p && v.p.format) || 'poster') + ' ' + ((v.p && v.p.skill) || '') + ' design');
      [['Open Figma', 'https://www.figma.com/files/'], ['Pinterest refs', 'https://www.pinterest.com/search/pins/?q=' + q], ['Are.na refs', 'https://www.are.na/search/' + q]].forEach(([t, u]) => {
        const a = el('a', 'btn quiet', t + ' ↗'); a.href = u; a.target = '_blank'; a.rel = 'noopener'; lk.append(a);
      });
    }
    
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
  let fbDepth = 'quick';
  $('fbDepth').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; fbDepth = b.value; $('fbDepth').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); });
  const ask = (p, depth) => window.critique({ blob: p.blob, prompt: p.prompt, practice: p.practice, reflection: p.reflection, depth }).then(async (cr) => { p.critique = cr; await DB.put('pieces', p); return cr; });
  $('reflectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!upload) { $('saveMsg').textContent = 'Add your exported piece first.'; drop.classList.add('nudge'); setTimeout(() => drop.classList.remove('nudge'), 600); return; }
    const c = openC(); const day = currentDay(c); const fd = new FormData(e.target);
    const piece = { id: uid(), challengeId: c.id, challengeName: nameOf(c), practice: c.format || 'poster', format: c.format || 'poster', day, prompt: promptFor(c, day), blob: upload, mime: upload.type, reflection: { tried: fd.get('tried'), worked: '', change: fd.get('change') }, critique: null, date: dateKey(), createdAt: Date.now(), demo: false };
    if (piece.format !== 'poster') { try { piece.sheet = await makeSheet(upload, piece.format); piece.sheetV = SHEET_V; } catch (err) {} }
    await DB.put('pieces', piece); await loadPieces();
    if (state.sprint && state.sprint.challengeId === c.id) stopSprint();
    upload = null; e.target.reset(); drop.querySelectorAll('img').forEach((n) => n.remove()); drop.classList.remove('has'); $('dropHint').hidden = false;
    step = 'brief'; renderSide();
    const depth = fbDepth; piece.depth = depth;
    const crit = depth === 'skip' ? null : ask(piece, depth);
    if (crit) crit.catch(() => {});
    pasting = piece.id; go('wall');
    await new Promise((r) => setTimeout(r, 900)); // a beat to see the wall before the roller starts
    await wallPaste(piece.id); pasting = null;
    pastedCard(piece, crit, depth);
  });
  // After the paste-up, stay on the wall. Feedback waits until the person asks for it.
  const pastedCard = (piece, crit, depth) => {
    const box = $('pasted'); box.innerHTML = ''; box.hidden = false;
    const close = () => { box.hidden = true; box.innerHTML = ''; };
    const status = el('p', 'pasted-p', crit ? 'Feedback is on its way. Look around the wall, then open it when you are ready.' : 'You skipped feedback. Click your poster any time to ask for it.');
    box.append(el('p', 'pasted-h', 'Pasted up.'), status);
    const row = el('div', 'row');
    const see = el('button', 'btn hot', crit ? 'See feedback' : 'Get feedback now');
    see.onclick = () => { close(); Feedback.open(piece, blobUrl(piece.id, piece.blob), crit || ask(piece, 'quick'), { onWall: () => Feedback.close(), retry: () => ask(piece, depth === 'deep' ? 'deep' : 'quick') }); };
    const stay = el('button', 'btn quiet', 'Keep looking'); stay.onclick = close;
    row.append(see, stay); box.append(row);
    if (crit) crit.then(() => { if (box.contains(status)) status.textContent = 'Feedback is ready.'; }, () => { if (box.contains(status)) status.textContent = 'Feedback could not load. You can try again from your poster.'; });
  };

  // Non-poster work is pasted up as a die-cut print: app = iPhone mockup, web = browser window, brand = clean sheet.
  const SHEET_V = 2;
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const makeSheet = (blob, format) => new Promise((res, rej) => {
    const img = new Image(); img.onload = () => {
      const ar = img.width / img.height; const c = document.createElement('canvas'); const g = c.getContext('2d');
      const paper = (x, y, w, h, r) => { g.save(); g.shadowColor = 'rgba(0,0,0,.18)'; g.shadowBlur = 14; g.shadowOffsetY = 4; rr(g, x, y, w, h, r); g.fillStyle = '#fbf8f1'; g.fill(); g.restore(); };
      if (format === 'app') {
        const SW = 860, SH = Math.round(SW / Math.min(ar, .75)), bez = 26, cut = 46, side = 10;
        const BW = SW + bez * 2, BH = SH + bez * 2, R = 150;
        c.width = BW + (cut + side) * 2; c.height = BH + cut * 2;
        const bx = cut + side, by = cut;
        paper(side + 6, 6, BW + cut * 2 - 12, BH + cut * 2 - 12, R + cut - 8);
        // side buttons
        g.fillStyle = '#3a3a40';
        [[by + 230, 60], [by + 330, 120], [by + 470, 120]].forEach(([y, h]) => { rr(g, bx - side, y, side + 4, h, 4); g.fill(); });
        rr(g, bx + BW - 4, by + 380, side + 4, 190, 4); g.fill();
        // titanium rim + black bezel
        const gr = g.createLinearGradient(bx, by, bx + BW, by + BH); gr.addColorStop(0, '#8d8b88'); gr.addColorStop(.5, '#4a4946'); gr.addColorStop(1, '#a3a19d');
        rr(g, bx, by, BW, BH, R); g.fillStyle = gr; g.fill();
        rr(g, bx + 5, by + 5, BW - 10, BH - 10, R - 5); g.fillStyle = '#0b0b0d'; g.fill();
        // screen
        const sx = bx + bez, sy = by + bez, sr = R - bez;
        g.save(); rr(g, sx, sy, SW, SH, sr); g.clip(); g.fillStyle = '#fff'; g.fillRect(sx, sy, SW, SH);
        const dh = SW / ar; g.drawImage(img, sx, sy + Math.max(0, (SH - dh) / 2), SW, dh); g.restore();
        // dynamic island
        rr(g, bx + BW / 2 - 125, sy + 30, 250, 72, 36); g.fillStyle = '#000'; g.fill();
        g.beginPath(); g.arc(bx + BW / 2 + 82, sy + 66, 13, 0, 7); g.fillStyle = '#1a1c2a'; g.fill();
        // glass sheen
        const sh = g.createLinearGradient(sx, sy, sx + SW, sy + SH); sh.addColorStop(0, 'rgba(255,255,255,.10)'); sh.addColorStop(.35, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
        g.save(); rr(g, sx, sy, SW, SH, sr); g.clip(); g.fillStyle = sh; g.fillRect(sx, sy, SW, SH); g.restore();
      } else if (format === 'web') {
        const W = 1400, IH = Math.min(Math.round(W / ar), 1800), TB = 74, cut = 40, R = 22;
        c.width = W + cut * 2; c.height = IH + TB + cut * 2;
        paper(6, 6, c.width - 12, c.height - 12, R + 30);
        const x = cut, y = cut;
        g.save(); g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 24; g.shadowOffsetY = 8; rr(g, x, y, W, IH + TB, R); g.fillStyle = '#fff'; g.fill(); g.restore();
        g.save(); rr(g, x, y, W, IH + TB, R); g.clip();
        g.fillStyle = '#ecebe8'; g.fillRect(x, y, W, TB); g.fillStyle = '#d6d4cf'; g.fillRect(x, y + TB - 2, W, 2);
        g.drawImage(img, 0, 0, img.width, Math.min(img.height, img.width * IH / W), x, y + TB, W, IH); g.restore();
        ['#ff5f57', '#febc2e', '#28c840'].forEach((col, k) => { g.beginPath(); g.arc(x + 36 + k * 30, y + TB / 2, 10, 0, 7); g.fillStyle = col; g.fill(); });
        rr(g, x + W / 2 - 260, y + 18, 520, 38, 19); g.fillStyle = '#fff'; g.fill();
        g.font = '500 20px -apple-system, Helvetica, Arial, sans-serif'; g.fillStyle = '#77736c'; g.textAlign = 'center'; g.fillText('showup.site', x + W / 2, y + 44);
      } else {
        const W = 1200, pad = 70, iw = W - pad * 2, ih = Math.min(Math.round(iw / ar), 1700), w = Math.round(ih * ar);
        c.width = W; c.height = ih + pad * 2; g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, W, c.height);
        g.drawImage(img, (W - w) / 2, pad, w, ih);
      }
      c.toBlob((b) => b ? res(b) : rej(new Error('sheet')), 'image/png');
    }; img.onerror = rej; img.src = URL.createObjectURL(blob);
  });
  const refreshSheets = async () => {
    for (const p of pieces) if (p.blob && p.format && p.format !== 'poster' && p.sheetV !== SHEET_V) {
      try { p.sheet = await makeSheet(p.blob, p.format); p.sheetV = SHEET_V; urls.delete(p.id + ':s'); await DB.put('pieces', p); } catch (e) {}
    }
  };

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
    await refreshSheets();
    const list = visible();
    $('stats').textContent = list.length + (list.length === 1 ? ' piece' : ' pieces');
    $('demoBtn').hidden = !window.DEMO; $('demoBtn').textContent = state.settings.demo ? 'Hide example posters' : 'Show example posters';
    if (!pasting) $('pasted').hidden = true;
    const three = await has3d(); $('wallCtl').hidden = false;
    if (three) Wall3D.render($('wall3d'), list, srcOf, (id) => openPiece(id), pasting);
    else Wall.render($('wall'), list, mediaFor, (id) => openPiece(id));
  };
  const wallPaste = async (id) => { if (await has3d()) { await Wall3D.ready; await Wall3D.paste(id); } else await Wall.paste($('wall'), id); };
  // 2D fallback: native scroll on both axes, plus drag to pan.
  (() => {
    const sc = $('wallScroll'); let d = null;
    sc.addEventListener('pointerdown', (e) => { if (e.button === 0) d = { x: e.clientX, y: e.clientY, l: sc.scrollLeft, t: sc.scrollTop, moved: false }; });
    addEventListener('pointermove', (e) => { if (!d) return; const dx = e.clientX - d.x, dy = e.clientY - d.y; if (Math.hypot(dx, dy) > 6) d.moved = true; if (d.moved) { sc.scrollLeft = d.l - dx; sc.scrollTop = d.t - dy; } });
    addEventListener('pointerup', () => { if (d && d.moved) sc.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); }, { capture: true, once: true }); d = null; });
  })();
  let zoom2d = 1;
  const wallNav = (a) => {
    if (use3d) { Wall3D.nav(a); return; }
    const sc = $('wallScroll'); const px = 260;
    if (a === 'left') sc.scrollBy({ left: -px, behavior: 'smooth' }); else if (a === 'right') sc.scrollBy({ left: px, behavior: 'smooth' });
    else if (a === 'up') sc.scrollBy({ top: -px, behavior: 'smooth' }); else if (a === 'down') sc.scrollBy({ top: px, behavior: 'smooth' });
    else { zoom2d = a === 'fit' ? 1 : Math.max(.5, Math.min(2, zoom2d * (a === 'in' ? 1.2 : 1 / 1.2))); $('wall').style.zoom = zoom2d; }
  };
  const hintOff = () => { const h = document.querySelector('.wallhint'); if (h) h.hidden = true; };
  ['pointerdown', 'wheel'].forEach((t) => $('wallCtl').parentElement.addEventListener(t, hintOff, { passive: true }));
  $('wallCtl').addEventListener('click', (e) => { const b = e.target.closest('[data-w]'); if (b) wallNav(b.dataset.w); });
  const KEYS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', '+': 'in', '=': 'in', '-': 'out', '_': 'out', '0': 'fit' };
  document.addEventListener('keydown', (e) => {
    if (view !== 'wall' || !$('fb').hidden || !$('modal').hidden || e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    const a = KEYS[e.key]; if (a) { e.preventDefault(); hintOff(); wallNav(a); }
  });
  $('demoBtn').addEventListener('click', async () => { state.settings.demo = !state.settings.demo; save(); await setDemo(state.settings.demo); renderSide(); renderWall(); });

  const openPiece = (id) => {
    const p = pieces.find((x) => x.id === id); if (!p) return;
    const d = p.depth === 'deep' ? 'deep' : 'quick';
    const crit = p.critique ? Promise.resolve(p.critique) : p.svg ? Promise.reject(new Error('This is an example poster.')) : ask(p, d);
    crit.catch(() => {});
    $('pasted').hidden = true;
    Feedback.open(p, srcOf(p), crit, { onWall: () => Feedback.close(), retry: p.svg ? null : () => ask(p, d), deeper: p.svg || d === 'deep' ? null : () => { p.depth = 'deep'; return ask(p, 'deep'); }, remove: async () => { if (!confirm('Take this poster down?')) return; await DB.del('pieces', p.id); await loadPieces(); Feedback.close(); renderSide(); renderWall(); } });
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

  // ---- shared ('With a friend') challenges ----
  const myName = () => localStorage.getItem('showup.name') || '';
  const b64e = (o) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const b64d = (s) => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))));
  const FIELDS = ['id', 'format', 'practice', 'own', 'context', 'ctxText', 'plan', 'skill', 'days', 'sprintMin', 'createdAt'];
  const inviteLink = (c) => { const o = {}; FIELDS.forEach((k) => { o[k] = c[k]; }); o.by = (c.shared && c.shared.host) || myName(); return location.origin + location.pathname + '?join=' + b64e(o); };
  const modal = (build) => { const m = $('modal'), b = $('mBox'); b.innerHTML = ''; b.className = 'm-box setup'; b.style.padding = '34px'; build(b, () => { m.hidden = true; }); m.hidden = false; m.onclick = (e) => { if (e.target === m) m.hidden = true; }; };
  const nameInput = () => { const i = el('input', 'nm'); i.placeholder = 'Your name'; i.value = myName(); i.maxLength = 24; i.oninput = () => localStorage.setItem('showup.name', i.value.trim()); return i; };
  const invite = (c) => modal((b, close) => {
    b.append(el('h2', 'm-h', 'Invite a friend'), el('p', 'mid', 'Send this link. Your friend gets the same mission and the same brief each day. When you both have a day open at the same time, press Start together to sprint live.'));
    const nm = nameInput(); nm.oninput = () => { localStorage.setItem('showup.name', nm.value.trim()); c.shared.host = c.shared.host || nm.value.trim(); if (!c.shared.members[0]) c.shared.members[0] = nm.value.trim(); save(); inp.value = inviteLink(c); };
    const inp = el('input', 'lk'); inp.readOnly = true; inp.value = inviteLink(c); inp.id = 'inviteLink'; inp.onclick = () => inp.select();
    const cp = el('button', 'btn hot', 'Copy link'); cp.onclick = async () => { inp.value = inviteLink(c); try { await navigator.clipboard.writeText(inp.value); } catch (e) { inp.select(); document.execCommand('copy'); } cp.textContent = 'Copied'; };
    const done = el('button', 'btn quiet', 'Done'); done.onclick = close;
    const row = el('div', 'row'); row.append(cp, done); b.append(nm, inp, row);
  });
  $('inviteBtn').addEventListener('click', () => { const c = openC(); if (c) invite(c); });
  const notice = (title, text) => modal((b, close) => { b.append(el('h2', 'm-h', title), el('p', 'mid', text)); const ok = el('button', 'btn hot', 'OK'); ok.onclick = close; const row = el('div', 'row'); row.style.marginTop = '22px'; row.append(ok); b.append(row); });
  const noLive = () => notice('Live sessions are not available here', 'The connection library did not load. Check your internet, pause strict ad or script blockers, and reload. You can still run today\u2019s sprint solo with the same brief.');
  $('togetherBtn').addEventListener('click', () => { const c = openC(); const day = c && currentDay(c); if (!day) return; if (!window.Duel) { noLive(); return; } window.Duel.together(c.id, day); });
  const handleJoin = () => {
    const raw = params.get('join'); if (!raw) return false;
    let o; try { o = b64d(raw); } catch (e) { return false; }
    history.replaceState(null, '', location.pathname);
    if (byId(o.id)) { openDay(o.id); return true; }
    go('today');
    modal((b, close) => {
      b.append(el('h2', 'm-h', 'Join ' + (o.by || 'your friend') + '’s challenge'));
      const c0 = Object.assign({}, o); delete c0.by;
      b.append(el('p', 'mid', nameOf(c0) + ' · ' + c0.days + ' days'));
      const nm = nameInput(); const go = el('button', 'btn hot', 'Join'); go.id = 'joinBtn';
      go.onclick = () => { const c = Object.assign(c0, { shared: { host: o.by || '', members: [o.by || '', myName()] } }); state.challenges.push(c); save(); if (window.Cloud) window.Cloud.joinChallenge(c); close(); renderSide(); openDay(c.id); };
      b.append(nm, go);
    });
    return true;
  };

  // ---- hooks for the 1v1 duel (js/duel.js) ----
  window.App = {
    current: () => { const c = openC(); const day = c && currentDay(c); return day ? { challengeId: c.id, day, name: nameOf(c), format: c.format || 'poster', sprintMin: c.sprintMin || 20, color: colorOf(c.practice), prompt: promptFor(c, day) } : null; },
    savePiece: async ({ blob, prompt, format, challengeId, day, name, vs, mine, critique }) => {
      const piece = { id: uid(), challengeId: challengeId || 'duel', challengeName: name, practice: format || 'poster', format: format || 'poster', day: day || 1, prompt: Object.assign({}, prompt, { vs }), blob, mime: blob.type, reflection: { tried: '', worked: '', change: '' }, critique: critique || null, date: dateKey(), createdAt: Date.now(), demo: false, duel: { vs, mine } };
      if (piece.format !== 'poster') { try { piece.sheet = await makeSheet(blob, piece.format); piece.sheetV = SHEET_V; } catch (err) {} }
      await DB.put('pieces', piece); await loadPieces(); renderSide(); return piece;
    },
    setCritique: async (id, cr) => { const p = pieces.find((x) => x.id === id); if (p) { p.critique = cr; await DB.put('pieces', p); } },
    showWall: async (ids) => { pasting = ids[0]; go('wall'); for (const id of ids) await wallPaste(id); pasting = null; },
    openPiece: (id) => openPiece(id), notice,
    srcOf: (id) => { const p = pieces.find((x) => x.id === id); return p ? srcOf(p) : ''; }
  };

  // ---- boot ----
  (async () => {
    
    if (params.has('demo')) { state.settings.demo = true; save(); }
    await loadPieces();
    if (state.settings.demo && !pieces.some((p) => p.demo)) await setDemo(true);
    renderSide();
    const v = params.get('view');
    if (handleJoin()) { /* join modal */ } else if (v === 'day' && state.openId) openDay(state.openId, params.get('step') || undefined); else go(VIEWS.includes(v) ? v : 'today');
    if (state.sprint) { lastStage = state.sprint.stage; tick(true); Widget.showMini(widgetActions); Widget.update(sprintView()); }
  })();
})();
