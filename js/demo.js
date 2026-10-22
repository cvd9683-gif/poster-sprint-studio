/* Demo posters for presentations: generated SVG graphics in the wheatpaste palette. */
(() => {
  const C = { mustard: '#f2b705', pink: '#ff3e9a', violet: '#5b3fd1', green: '#12a150', red: '#e5322d', ink: '#111', paper: '#f4f1ea', white: '#fff' };
  const F = `font-family="Helvetica Neue,Helvetica,Arial,sans-serif" font-weight="900"`;
  // textLength squeezes the word into a fixed width: instant condensed poster type.
  const T = (x, y, size, str, fill, w, extra = '') => `<text x="${x}" y="${y}" font-size="${size}" ${F} fill="${fill}" textLength="${w}" lengthAdjust="spacingAndGlyphs" ${extra}>${str}</text>`;
  const small = (x, y, str, fill, a = 'start') => `<text x="${x}" y="${y}" font-size="9" font-family="Helvetica Neue,Helvetica,Arial,sans-serif" font-weight="700" letter-spacing="1" fill="${fill}" text-anchor="${a}">${str}</text>`;
  const wrap = (bg, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" class="demo-poster"><rect width="300" height="400" fill="${bg}"/>${body}</svg>`;
  const P = [
    wrap(C.mustard, T(18, 112, 112, 'NIGHT', C.ink, 264) + T(18, 206, 112, 'MARKET', C.ink, 264) + `<rect x="18" y="226" width="264" height="6" fill="${C.ink}"/>` + T(18, 300, 64, 'AFTER DARK', C.ink, 264) + small(18, 376, 'FRI 11PM–4AM · CANAL ST', C.ink) + small(282, 376, 'FOOD / SOUND / STREET', C.ink, 'end')),
    wrap(C.pink, [0, 1, 2, 3, 4, 5, 6].map((i) => T(14, 62 + i * 46, 50, i === 3 ? 'DIASPORA RADIO' : 'DIASPORA RADIO', i === 3 ? C.white : C.ink, 272, i === 3 ? '' : 'opacity="' + (0.15 + i * 0.08) + '"')).join('') + small(14, 388, '88.3 FM · LATE NIGHT · EVERY LANGUAGE', C.white)),
    wrap(C.violet, `<circle cx="150" cy="150" r="104" fill="${C.green}"/><circle cx="150" cy="150" r="58" fill="${C.pink}"/>` + T(20, 320, 70, 'WEDDING', C.white, 260) + T(20, 368, 40, 'SEASON', C.mustard, 150) + small(280, 368, 'EXHIBITION', C.white, 'end')),
    wrap(C.ink, `<rect x="0" y="0" width="22" height="400" fill="${C.red}"/>` + T(40, 120, 96, 'THIRD', C.white, 150) + T(40, 210, 96, 'CULTURE', C.white, 230) + `<rect x="40" y="236" width="230" height="2" fill="${C.white}"/>` + small(40, 262, 'BELONGING TO MORE THAN ONE PLACE', C.white) + small(40, 380, 'GALLERY 3 · NOV', C.mustard)),
    wrap(C.green, [0, 1, 2].map((i) => `<g transform="translate(${26 + i * 88} 40)"><path d="M0 60 H72 A36 36 0 0 1 0 60 Z" fill="${C.ink}"/><rect x="-4" y="54" width="80" height="6" fill="${C.ink}"/><path d="M24 48 C18 38 30 30 24 16 M44 48 C38 38 50 30 44 16" stroke="${C.ink}" stroke-width="4" fill="none"/></g>`).join('') + T(22, 220, 84, 'STREET', C.paper, 256) + T(22, 300, 84, 'FOOD', C.mustard, 170) + T(22, 352, 40, 'STORIES', C.paper, 256) + small(22, 384, 'EVERY DISH IS SOMEONE’S MEMORY', C.ink)),
    wrap(C.paper, `<g transform="rotate(-90 150 200)">` + T(-30, 175, 120, 'NO TRANS', C.ink, 360) + T(-30, 280, 120, 'LATION', C.red, 360) + `</g>` + small(286, 388, 'NEEDED', C.ink, 'end') + small(14, 388, 'SLANG · GESTURE · SYMBOL', C.ink)),
    wrap(C.red, [0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => `<rect x="${20 + c * 90}" y="${20 + r * 62}" width="80" height="52" fill="${(r + c) % 3 === 0 ? C.ink : C.paper}"/>`).join('')).join('') + T(20, 340, 80, 'RITUAL', C.paper, 260) + small(20, 380, 'THE SAME THING, EVERY DAY', C.ink)),
    wrap(C.white, T(16, 330, 330, 'H', C.ink, 190) + T(214, 120, 40, 'HOME', C.ink, 70) + `<rect x="214" y="130" width="70" height="3" fill="${C.pink}"/>` + T(214, 170, 40, 'AWAY', C.pink, 70) + small(16, 386, 'A PUBLICATION ABOUT MANY HOMES', C.ink)),
    wrap(C.ink, T(18, 90, 80, 'FUTURE', C.mustard, 264) + T(18, 170, 80, 'FOLK', C.white, 160) + T(184, 170, 80, 'LORE', C.pink, 98, 'transform="rotate(8 230 140)"') + `<circle cx="210" cy="290" r="64" fill="none" stroke="${C.green}" stroke-width="10"/>` + small(18, 384, 'MYTHS FOR 2126', C.white)),
    wrap(C.violet, T(16, 150, 150, 'NOW', C.mustard, 268) + T(16, 260, 150, 'NOW', C.white, 268, 'opacity=".25"') + T(16, 370, 150, 'NOW', C.pink, 268, 'opacity=".6"'))
  ];
  const META = [
    ['poster', 0], ['poster', 1], ['poster', 2], ['poster', 3], ['poster', 4], ['poster', 5], ['poster', 6], ['poster', 7], ['poster', 8], ['type', 0]
  ];
  const REFLECT = [
    ['Made the title huge and pushed everything else small.', 'The first read is obvious from across the room.', 'The date gets lost. Give it one more step of contrast.'],
    ['Built the whole poster out of type, no images.', 'The stacked lines feel like radio static.', 'Too many repeats. Cut to five.'],
    ['Limited myself to three colors.', 'The green circle really dominates.', 'Value contrast on the small text is weak.'],
    ['Pushed everything off-center with a red edge.', 'The imbalance feels intentional.', 'Needs one counterweight on the right.'],
    ['One image of a bowl, repeated three times.', 'The repetition reads like a menu board.', 'The crop is a bit timid.'],
    ['Turned the words sideways so they read as shapes.', 'People see it before they read it.', 'Info hierarchy at the bottom is muddy.'],
    ['Built everything on a 3×4 grid.', 'The blocks feel like a calendar.', 'Break the grid once on purpose.'],
    ['One giant letter, everything else tiny.', 'The scale jump is dramatic.', 'The small text could sit tighter to the edge.'],
    ['Broke the baseline on LORE only.', 'Still readable, but it feels off in a good way.', 'The circle feels unrelated.'],
    ['Same word, three opacities.', 'It reads like getting louder.', 'Try one version in a different weight.']
  ];
  window.DEMO = { posters: P, meta: META, reflect: REFLECT, colors: C };
})();
