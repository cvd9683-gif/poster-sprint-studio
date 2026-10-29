/* The Wall in 3D: a lit brick wall where each submission is wheatpasted as a deformable sheet of paper. */
import * as THREE from 'three';

const canGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
if (!canGL) { window.Wall3DFailed = true; }

const PAL = ['#f2b705', '#ff3e9a', '#5b3fd1', '#12a150', '#e5322d', '#efe9dc', '#111111'];
const seeded = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; };
const ease = { out: (t) => 1 - Math.pow(1 - t, 3), in: (t) => t * t * t, io: (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));

// ---- procedural brick (color + bump) ----
const brickTextures = () => {
  const S = 1024, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
  const b = document.createElement('canvas'); b.width = b.height = S; const bg = b.getContext('2d');
  const r = seeded('brick');
  g.fillStyle = '#9d9184'; g.fillRect(0, 0, S, S); bg.fillStyle = '#202020'; bg.fillRect(0, 0, S, S);
  const bw = 128, bh = 52, m = 7;
  for (let row = 0; row * bh < S; row++) {
    const off = row % 2 ? bw / 2 : 0;
    for (let x = -bw; x < S + bw; x += bw) {
      const hue = 8 + r() * 10, l = 30 + r() * 12, s = 45 + r() * 15;
      g.fillStyle = `hsl(${hue},${s}%,${l}%)`; g.fillRect(x + off + m / 2, row * bh + m / 2, bw - m, bh - m);
      const sh = 170 + r() * 50; bg.fillStyle = `rgb(${sh},${sh},${sh})`; bg.fillRect(x + off + m / 2, row * bh + m / 2, bw - m, bh - m);
      for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(${r() < .5 ? '0,0,0' : '255,230,210'},${r() * .12})`; g.fillRect(x + off + r() * bw, row * bh + r() * bh, 2 + r() * 6, 2 + r() * 4); }
    }
  }
  // soot + old paste stains
  for (let k = 0; k < 30; k++) { const gr = g.createRadialGradient(r() * S, r() * S, 0, r() * S, r() * S, 60 + r() * 160); gr.addColorStop(0, `rgba(20,15,10,${r() * .25})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, S, S); }
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping; map.anisotropy = 8;
  const bump = new THREE.CanvasTexture(b); bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  return { map, bump };
};

// torn paper scrap texture (old layers of posters)
const scrapTex = (color, r) => {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
  g.beginPath(); const n = 18; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const rad = 100 + r() * 28; g.lineTo(128 + Math.cos(a) * rad * (1 + r() * .2), 128 + Math.sin(a) * rad * .8); } g.closePath();
  g.fillStyle = color; g.fill();
  g.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(0,0,0,${r() * .15})`; g.fillRect(r() * 256, r() * 256, 60 + r() * 120, 10 + r() * 40); }
  if (r() < .6) { g.fillStyle = color === '#111111' ? '#efe9dc' : '#111'; g.font = '900 70px Helvetica, Arial'; g.fillText(['NO', 'SAT', 'LIVE', 'FREE', 'NYC', '23'][Math.floor(r() * 6)], 40 + r() * 40, 140 + r() * 40); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};

let R = null; // runtime

const init = (container) => {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.append(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#15120f'); scene.fog = new THREE.Fog('#15120f', 6, 14);
  const camera = new THREE.PerspectiveCamera(36, 1, .05, 50); camera.position.set(0, .05, 4.4);
  scene.add(new THREE.HemisphereLight('#fff2dd', '#3a2a20', .9));
  const sun = new THREE.DirectionalLight('#ffe6c4', 2.6); sun.position.set(-2.5, 3.5, 4); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 3, bottom: -3, near: .5, far: 15 }); sun.shadow.bias = -.0004; sun.shadow.normalBias = .01;
  scene.add(sun, sun.target);
  const lamp = new THREE.PointLight('#ffb36b', 3, 5, 1.6); lamp.position.set(0, 1.9, 1.2); scene.add(lamp);
  const tex = brickTextures();
  const wallMat = new THREE.MeshStandardMaterial({ map: tex.map, bumpMap: tex.bump, bumpScale: 3.5, roughness: .92 });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(1, 3.6), wallMat); wall.receiveShadow = true; scene.add(wall);
  const walk = new THREE.Mesh(new THREE.BoxGeometry(1, .08, 1.6), new THREE.MeshStandardMaterial({ color: '#7d7a74', roughness: .95 })); walk.position.set(0, -1.66, .8); walk.receiveShadow = true; scene.add(walk);
  const group = new THREE.Group(); scene.add(group);
  // roller
  const roller = new THREE.Group();
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, 1.1, 24), new THREE.MeshStandardMaterial({ color: '#efe6c8', roughness: .55 })); drum.rotation.z = Math.PI / 2; drum.castShadow = true;
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .7, 8), new THREE.MeshStandardMaterial({ color: '#888', metalness: .8, roughness: .3 })); arm.position.set(0, -.25, .3); arm.rotation.x = 1.0; arm.castShadow = true;
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .9, 12), new THREE.MeshStandardMaterial({ color: '#c9a24a', roughness: .5 })); handle.position.set(0, -.62, .85); handle.rotation.x = 1.0; handle.castShadow = true;
  roller.add(drum, arm, handle); roller.visible = false; scene.add(roller);
  const glueMat = new THREE.MeshPhysicalMaterial({ color: '#fffbe8', transparent: true, opacity: .32, roughness: .08, clearcoat: 1, clearcoatRoughness: .05 });
  const glue = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), glueMat); glue.visible = false; scene.add(glue);

  R = { renderer, scene, camera, sun, lamp, wall, walk, group, roller, glue, posters: [], container, camX: 0, camTX: 0, camZ: 4.4, camTZ: 4.4, camY: .05, camTY: .05, mx: 0, my: 0, shake: 0, minX: 0, maxX: 0, anims: [], onOpen: null, busy: false, loader: new THREE.TextureLoader() };

  const resize = () => { const w = container.clientWidth, h = container.clientHeight || 600; renderer.setSize(w, h, false); renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px'; camera.aspect = w / h; camera.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(container); resize();
  const dom = renderer.domElement; dom.style.touchAction = 'none';
  // Pan on both axes and zoom. Figma-style: scroll = up/down, Shift + scroll = sideways, pinch or Ctrl/Cmd + scroll = zoom.
  const perPx = () => 2 * R.camZ * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / (dom.clientHeight || 600);
  const pts = new Map(); let drag = null, moved = false, pinch = null;
  dom.addEventListener('pointermove', (e) => {
    const b = dom.getBoundingClientRect(); R.mx = (e.clientX - b.left) / b.width * 2 - 1; R.my = (e.clientY - b.top) / b.height * 2 - 1;
    if (pts.has(e.pointerId)) pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pts.size === 2) { const [p, q] = [...pts.values()]; R.camTZ = pinch.z * pinch.d / Math.max(20, Math.hypot(p.x - q.x, p.y - q.y)); moved = true; return; }
    if (drag) {
      const dx = e.clientX - drag.cx, dy = e.clientY - drag.cy;
      if (Math.hypot(dx, dy) > 6) moved = true; // small jitter still counts as a click
      if (moved) { const k = perPx(); R.camTX = drag.x - dx * k; R.camTY = drag.y + dy * k; }
    }
    dom.style.cursor = drag && moved ? 'grabbing' : pickAt(e) ? 'pointer' : 'grab';
  });
  dom.addEventListener('pointerdown', (e) => {
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); try { dom.setPointerCapture(e.pointerId); } catch (x) {}
    if (pts.size === 2) { const [p, q] = [...pts.values()]; pinch = { d: Math.hypot(p.x - q.x, p.y - q.y), z: R.camTZ }; drag = null; return; }
    drag = { x: R.camTX, y: R.camTY, cx: e.clientX, cy: e.clientY }; moved = false;
  });
  const up = (e) => { if (drag && !moved && !pinch) { const p = pickAt(e); if (p && R.onOpen) R.onOpen(p.id); } pts.delete(e.pointerId); if (pts.size < 2) pinch = null; drag = null; };
  dom.addEventListener('pointerup', up);
  dom.addEventListener('pointercancel', (e) => { pts.delete(e.pointerId); pinch = null; drag = null; });
  dom.addEventListener('wheel', (e) => {
    e.preventDefault(); const k = e.deltaMode === 1 ? 16 : 1;
    if (e.ctrlKey || e.metaKey) { R.camTZ *= Math.exp(e.deltaY * k * .006); return; }
    const m = perPx() * k;
    if (e.shiftKey && !e.deltaX) R.camTX += e.deltaY * m; else { R.camTX += e.deltaX * m; R.camTY -= e.deltaY * m; }
  }, { passive: false });
  const ray = new THREE.Raycaster();
  const pickAt = (e) => { const b = dom.getBoundingClientRect(); ray.setFromCamera({ x: (e.clientX - b.left) / b.width * 2 - 1, y: -((e.clientY - b.top) / b.height * 2 - 1) }, camera); const hit = ray.intersectObjects(R.posters.filter((p) => p.mesh.visible).map((p) => p.mesh))[0]; return hit && R.posters.find((p) => p.mesh === hit.object); };

  const clock = new THREE.Clock();
  const loop = () => {
    const dt = Math.min(.05, clock.getDelta()); const t = clock.elapsedTime;
    if (!container.isConnected || container.offsetParent === null) { requestAnimationFrame(loop); return; }
    R.anims = R.anims.filter((a) => a(t, dt) !== false);
    if (!R.busy) bound();
    R.camX += (R.camTX - R.camX) * Math.min(1, dt * 4); R.camZ += (R.camTZ - R.camZ) * Math.min(1, dt * 3); R.camY += (R.camTY - R.camY) * Math.min(1, dt * 3);
    const sh = R.shake > 0 ? (Math.random() - .5) * R.shake : 0; R.shake *= .86;
    camera.position.set(R.camX + R.mx * .18 + sh, R.camY - R.my * .1 + sh * .6, R.camZ);
    camera.lookAt(R.camX, R.camY, 0);
    sun.position.set(R.camX - 2.5, 3.5, 4); sun.target.position.set(R.camX, 0, 0); lamp.position.x = R.camX + .4;
    R.posters.forEach((p) => p.dirty && deform(p, t));
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
};

// Keep the camera on the wall: x across all posters (a bit more when zoomed in), y within the wall's height.
const Z_MIN = 1.5, Z_MAX = 5.6, WALL_H = 3.6;
const bound = () => {
  R.camTZ = clamp(R.camTZ, Z_MIN, Z_MAX);
  const half = R.camTZ * Math.tan(THREE.MathUtils.degToRad(R.camera.fov / 2));
  const ySpan = Math.max(.15, WALL_H / 2 - half + .25);
  R.camTY = clamp(R.camTY, -ySpan, ySpan);
  const xPad = Math.max(.3, (4.4 - R.camTZ) * .5 + .6);
  R.camTX = clamp(R.camTX, R.minX - xPad, R.maxX + xPad);
};
const nav = (a) => {
  if (!R || R.busy) return;
  const k = R.camTZ / 4.4 * .6;
  if (a === 'left') R.camTX -= k; else if (a === 'right') R.camTX += k;
  else if (a === 'up') R.camTY += k * .7; else if (a === 'down') R.camTY -= k * .7;
  else if (a === 'in') R.camTZ /= 1.25; else if (a === 'out') R.camTZ *= 1.25;
  else if (a === 'fit') { R.camTZ = 4.4; R.camTY = .05; }
  bound();
};

// ---- poster sheets ----
const makePoster = (piece, src, i, r) => new Promise((resolve) => {
  R.loader.load(src, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const ar = tex.image.width / tex.image.height || .75;
    let h = 1.22, w = h * ar; if (w > 1.05) { w = 1.05; h = w / ar; }
    const geo = new THREE.PlaneGeometry(w, h, 24, 30); geo.translate(0, -h / 2, 0); // pivot at the top edge
    const mat = new THREE.MeshPhysicalMaterial({ map: tex, roughness: .82, clearcoat: 0, clearcoatRoughness: .2, side: THREE.DoubleSide, sheen: .3, sheenColor: new THREE.Color('#fff8e6') });
    if (piece.sheet) { mat.transparent = true; mat.alphaTest = .5; }
    const mesh = new THREE.Mesh(geo, mat); if (piece.sheet) mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: .5 }); mesh.castShadow = true; mesh.receiveShadow = true;
    const col = Math.floor(i / 2), row = i % 2;
    const x = col * 1.3 + (r() - .5) * .18 + (row ? .3 : 0), yTop = (row ? -.08 : 1.42) + (r() - .5) * .1;
    mesh.position.set(x, yTop, .006 + i * .0012); mesh.rotation.z = (r() - .5) * .05;
    const p = { id: piece.id, mesh, w, h, base: geo.attributes.position.array.slice(), x, yTop, z0: mesh.position.z, rz: mesh.rotation.z,
      wrinkle: Array.from({ length: 5 }, () => ({ a: r() * Math.PI, f: 6 + r() * 14, ph: r() * 6, k: .4 + r() })),
      corner: Math.floor(r() * 4), curl: .015 + r() * .03, bubbles: Array.from({ length: 4 }, () => ({ u: .15 + r() * .7, v: .15 + r() * .7, a: .01 + r() * .015 })),
      wAmp: .0035, bAmp: .25, adhere: 1, lift: 0, billow: 0, dirty: true };
    R.group.add(mesh); resolve(p);
  }, undefined, () => resolve(null));
});

const deform = (p, t) => {
  const pos = p.mesh.geometry.attributes.position; const a = pos.array, b = p.base;
  for (let k = 0; k < a.length; k += 3) {
    const u = b[k] / p.w + .5, v = -b[k + 1] / p.h; // v: 0 top -> 1 bottom
    let z = 0;
    for (const w of p.wrinkle) { const d = Math.cos(w.a) * u + Math.sin(w.a) * v; z += Math.pow(Math.abs(Math.sin(d * w.f + w.ph)), 6) * w.k; }
    z *= p.wAmp;
    for (const bb of p.bubbles) { const dd = (u - bb.u) ** 2 + (v - bb.v) ** 2; z += bb.a * p.bAmp * Math.exp(-dd / .006); }
    const cu = p.corner % 2 ? 1 - u : u, cv = p.corner > 1 ? 1 - v : v; const cd = Math.max(0, .22 - Math.hypot(cu, cv)) / .22; z += cd * cd * p.curl;
    if (p.adhere < 1 && v > p.adhere) { const d = (v - p.adhere); z += p.lift * d * d * .9 + p.billow * d * Math.sin(u * 7 + t * 9) * .05; }
    a[k + 2] = z;
  }
  pos.needsUpdate = true; p.mesh.geometry.computeVertexNormals();
  if (!p.animating) p.dirty = false;
};

const scraps = (n) => {
  const r = seeded('scraps' + n);
  for (let i = 0; i < n; i++) {
    const t = scrapTex(PAL[Math.floor(r() * PAL.length)], r);
    const s = .25 + r() * .55;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s * (.6 + r() * .6)), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: .9, alphaTest: .05 }));
    m.position.set(R.minX - 1.2 + r() * (R.maxX - R.minX + 2.4), -1.4 + r() * 3, .002 + r() * .002); m.rotation.z = (r() - .5) * .6; m.receiveShadow = true;
    R.group.add(m);
  }
};

let readyResolve; const ready = { p: Promise.resolve() };
const render = async (container, list, srcOf, onOpen, pendingId) => {
  if (!R) init(container);
  R.onOpen = onOpen;
  R.posters.forEach((p) => { p.mesh.geometry.dispose(); p.mesh.material.map && p.mesh.material.map.dispose(); p.mesh.material.dispose(); });
  R.group.clear(); R.posters = [];
  const cols = Math.max(4, Math.ceil(list.length / 2) + 1);
  R.minX = 0; R.maxX = Math.max(0, (cols - 3) * 1.3);
  const L = cols * 1.3 + 10; R.wall.geometry.dispose(); R.wall.geometry = new THREE.PlaneGeometry(L, 3.6); R.wall.position.set(L / 2 - 5, 0, 0);
  R.wall.material.map.repeat.set(L / 1.6, 3.6 / 1.6); R.wall.material.bumpMap.repeat.copy(R.wall.material.map.repeat);
  R.walk.scale.x = L; R.walk.position.x = R.wall.position.x;
  scraps(Math.round(cols * 3.5));
  ready.p = Promise.all(list.map((pc, i) => makePoster(pc, srcOf(pc), i, seeded(pc.id)))).then((ps) => {
    R.posters = ps.filter(Boolean);
    R.posters.forEach((p) => { if (p.id === pendingId) p.mesh.visible = false; });
    const last = R.posters[R.posters.length - 1];
    R.camTX = R.camX = clamp(last ? last.x - .65 : 0, R.minX, R.maxX);
  });
  return ready.p;
};

const wait = (s) => new Promise((r) => setTimeout(r, s * 1000));
const paste = async (id) => {
  await ready.p;
  const p = R.posters.find((x) => x.id === id); if (!p) return;
  const { roller, glue } = R; const m = p.mesh;
  // 1. walk to the spot
  R.busy = true;
  R.camTX = clamp(p.x, R.minX - 1, R.maxX + 1); R.camTZ = 3.0; R.camTY = p.yTop - p.h / 2 + .05;
  await wait(1.2);
  // 2. roller lays a coat of wet paste
  const gx = p.x, top = p.yTop + .04, bot = p.yTop - p.h - .04;
  glue.visible = true; glue.position.set(gx, top, p.z0 - .0005); glue.scale.set(p.w + .12, .001, 1); glue.material.opacity = .32;
  roller.visible = true; roller.position.set(gx, top + .3, .9); roller.rotation.z = m.rotation.z;
  await anim(1.1, (k) => {
    const s = seg(k, 0, .2), d = seg(k, .2, 1);
    roller.position.z = .9 - ease.out(s) * .82; const y = top - ease.io(d) * (top - bot);
    roller.position.y = s < 1 ? top + .3 * (1 - ease.out(s)) : y; roller.children[0].rotation.x = -y * 8;
    const len = Math.max(.001, top - Math.min(top, roller.position.y)); glue.scale.y = len; glue.position.y = top - len / 2;
  });
  await anim(.35, (k) => { roller.position.z = .08 + ease.in(k) * .9; roller.position.y = bot + ease.out(k) * .4; });
  // 3. the slap: sheet swings in from the viewer, top edge first
  m.visible = true; p.animating = true; p.dirty = true; p.adhere = 0; p.lift = 1.2; p.billow = 1; p.bAmp = 1.6; p.wAmp = .009;
  m.material.clearcoat = 1; m.material.roughness = .35;
  m.position.z = 1.4; m.position.y = p.yTop + .25; m.rotation.x = -1.1; m.rotation.z = p.rz + .18;
  await anim(.5, (k) => { const e = ease.in(k); m.position.z = 1.4 - (1.4 - p.z0) * e; m.position.y = p.yTop + .25 * (1 - e); m.rotation.x = -1.1 * (1 - e); m.rotation.z = p.rz + .18 * (1 - e); p.adhere = 0; });
  R.shake = .05; p.adhere = .06;
  await anim(.35, (k) => { p.lift = 1.2 - .7 * ease.out(k); p.billow = 1 - .5 * k; });
  // 4. second pass: roller presses the sheet down top to bottom, chasing the air out
  roller.position.set(gx, top + .3, .9);
  await anim(1.4, (k) => {
    const s = seg(k, 0, .15), d = seg(k, .15, 1);
    roller.position.z = .9 - ease.out(s) * .8; const y = top - ease.io(d) * (top - bot);
    if (s >= 1) roller.position.y = y; roller.children[0].rotation.x = -y * 8;
    p.adhere = Math.max(.06, clamp((top - y) / (p.h + .08))); p.lift = .5 * (1 - d * .6); p.billow = .5 * (1 - d);
    p.bAmp = 1.6 - d * 1.0; p.wAmp = .009 - d * .004;
  });
  p.adhere = 1;
  await anim(.4, (k) => { roller.position.z = .1 + ease.in(k) * 1.2; roller.position.y = bot + ease.out(k) * .6; });
  roller.visible = false;
  // 5. it dries: wet sheen fades, a few bubbles stay
  R.camTZ = 3.6;
  await anim(1.6, (k) => { m.material.clearcoat = 1 - k * .92; m.material.roughness = .35 + k * .47; glue.material.opacity = .32 * (1 - k); p.bAmp = .6 - k * .35; p.wAmp = .005 - k * .0015; });
  glue.visible = false; p.animating = false; p.dirty = true; R.busy = false;
};
const anim = (dur, fn) => new Promise((res) => { let t0 = null; R.anims.push((t) => { if (t0 === null) t0 = t; const k = clamp((t - t0) / dur); fn(k); R.posters.forEach((p) => { if (p.animating) p.dirty = true; }); if (k >= 1) { res(); return false; } }); });

window.Wall3D = { ok: () => canGL, render, paste, nav, get ready() { return ready.p; } };
