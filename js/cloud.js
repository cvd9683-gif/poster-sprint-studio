// Show Up — optional Firebase accounts + sync. Does nothing unless window.FIREBASE_CONFIG is set.
const cfg = window.FIREBASE_CONFIG;
if (cfg && cfg.apiKey) boot().catch((e) => console.warn('cloud off:', e));

async function boot() {
  const V = 'https://www.gstatic.com/firebasejs/10.12.2/';
  const [{ initializeApp }, A, F] = await Promise.all(['firebase-app', 'firebase-auth', 'firebase-firestore'].map((m) => import(V + m + '.js')));
  const app = initializeApp(cfg), auth = A.getAuth(app), db = F.getFirestore(app);
  // images: downscale to JPEG, upload via /api/upload (Vercel Blob)
  const shrink = async (blob) => {
    const bm = await createImageBitmap(blob); const k = Math.min(1, 1600 / Math.max(bm.width, bm.height));
    const c = document.createElement('canvas'); c.width = Math.round(bm.width * k); c.height = Math.round(bm.height * k);
    c.getContext('2d').drawImage(bm, 0, 0, c.width, c.height);
    for (const q of [0.86, 0.75, 0.6, 0.45]) { const b = await new Promise((r) => c.toBlob(r, 'image/jpeg', q)); if (b.size < 2.4e6 || q === 0.45) return b; }
  };
  const b64 = (b) => new Promise((r) => { const f = new FileReader(); f.onload = () => r(String(f.result).split(',')[1]); f.readAsDataURL(b); });
  const upload = async (id, blob) => {
    const j = await shrink(blob);
    const r = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (await user.getIdToken()) }, body: JSON.stringify({ id, type: 'image/jpeg', data: await b64(j) }) });
    if (!r.ok) throw new Error('upload ' + r.status); return (await r.json()).url;
  };
  const KEY = 'posterSprintStudio.v3';
  const local = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  let user = null, pulling = false;
  const u = (...p) => F.doc(db, 'users', user.uid, ...p);
  const col = (n) => F.collection(db, 'users', user.uid, n);
  const clean = (o) => JSON.parse(JSON.stringify(o, (k, v) => (v instanceof Blob ? undefined : v)));

  // ---- writes ----
  const pushPiece = async (p) => {
    if (!user || !p || !p.id) return;
    const meta = clean(p); delete meta.blob;
    if (p.blob instanceof Blob && !p.url) meta.url = await upload(String(p.id), p.blob);
    await F.setDoc(F.doc(col('pieces'), String(p.id)), meta, { merge: true });
  };
  const pushChallenges = async () => {
    if (!user || pulling) return; const s = local();
    await Promise.all((s.challenges || []).map((c) => F.setDoc(F.doc(col('challenges'), String(c.id)), clean(c), { merge: true })));
  };
  const put0 = DB.put.bind(DB), del0 = DB.del.bind(DB);
  DB.put = async (store, v) => { const r = await put0(store, v); if (store === 'pieces' && !pulling) pushPiece(v).catch(console.warn); return r; };
  DB.del = async (store, id) => { const r = await del0(store, id); if (store === 'pieces' && user) F.deleteDoc(F.doc(col('pieces'), String(id))).catch(console.warn); return r; };
  let t; window.addEventListener('showup-save', () => { clearTimeout(t); t = setTimeout(() => pushChallenges().catch(console.warn), 800); });

  // ---- shared challenges ----
  const shareDoc = (id) => F.doc(db, 'sharedChallenges', String(id));
  window.Cloud = {
    user: () => user, auth, F, db,
    shareChallenge: (c) => user && F.setDoc(shareDoc(c.id), { ...clean(c), owner: user.uid, members: [user.uid] }).catch(console.warn),
    joinChallenge: (c) => user && F.updateDoc(shareDoc(c.id), { members: F.arrayUnion(user.uid) }).catch(() => {}),
  };

  // ---- migrate once, then pull ----
  const migrate = async () => {
    const flag = 'showup.migrated.' + user.uid; if (localStorage.getItem(flag)) return;
    await pushChallenges(); for (const p of await DB.all('pieces')) await pushPiece(p);
    await F.setDoc(u(), { name: localStorage.getItem('showup.name') || user.displayName || '', email: user.email || '' }, { merge: true });
    localStorage.setItem(flag, '1');
  };
  const pull = async () => {
    pulling = true; let changed = false;
    try {
      const s = local(); s.challenges = s.challenges || [];
      const have = new Set(s.challenges.map((c) => c.id));
      (await F.getDocs(col('challenges'))).forEach((d) => { if (!have.has(d.id)) { s.challenges.push(d.data()); changed = true; } });
      if (changed) localStorage.setItem(KEY, JSON.stringify(s));
      const mine = new Set((await DB.all('pieces')).map((p) => String(p.id)));
      for (const d of (await F.getDocs(col('pieces'))).docs) {
        if (mine.has(d.id)) continue; const m = d.data();
        try { if (m.url) m.blob = await (await fetch(m.url)).blob(); } catch (e) {}
        await put0('pieces', m); changed = true;
      }
      const prof = await F.getDoc(u()); if (prof.exists() && prof.data().name && !localStorage.getItem('showup.name')) localStorage.setItem('showup.name', prof.data().name);
    } finally { pulling = false; }
    if (changed && !sessionStorage.getItem('showup.pulled')) { sessionStorage.setItem('showup.pulled', '1'); location.reload(); }
  };

  // ---- UI: one small link in the sidebar ----
  const slot = document.createElement('div'); slot.className = 'acct';
  (document.getElementById('sideStreak') || document.body).after(slot);
  const form = () => {
    const m = document.getElementById('modal'), b = document.getElementById('mBox');
    b.className = 'm-box setup'; b.style.padding = '34px';
    b.innerHTML = '<h2 class="m-h">Sign in</h2><button class="btn hot" id="gIn">Continue with Google</button><p class="mid" style="margin:18px 0 8px">or</p><input class="lk" id="eM" type="email" placeholder="Email"><input class="lk" id="eP" type="password" placeholder="Password"><div class="row"><button class="btn" id="eIn">Sign in</button><button class="btn quiet" id="eUp">Create account</button></div><p class="mid" id="eErr"></p>';
    m.hidden = false; m.onclick = (e) => { if (e.target === m) m.hidden = true; };
    const err = (e) => { b.querySelector('#eErr').textContent = (e.code || e.message || '').replace('auth/', '').replace(/-/g, ' '); };
    const ok = () => { m.hidden = true; };
    b.querySelector('#gIn').onclick = () => A.signInWithPopup(auth, new A.GoogleAuthProvider()).then(ok, err);
    const em = () => [b.querySelector('#eM').value.trim(), b.querySelector('#eP').value];
    b.querySelector('#eIn').onclick = () => A.signInWithEmailAndPassword(auth, ...em()).then(ok, err);
    b.querySelector('#eUp').onclick = () => A.createUserWithEmailAndPassword(auth, ...em()).then(ok, err);
  };
  const draw = () => {
    slot.innerHTML = ''; const a = document.createElement('button'); a.className = 'navb';
    if (user) { a.textContent = 'Sign out'; a.title = user.email || ''; a.onclick = () => A.signOut(auth); }
    else { a.textContent = 'Sign in'; a.onclick = form; }
    slot.append(a);
  };
  A.onAuthStateChanged(auth, async (x) => { user = x; draw(); if (user) { await migrate().catch(console.warn); await pull().catch(console.warn); } });
}
