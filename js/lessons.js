/*
  Poster Sprint — daily lessons.

  Each lesson has a `format`:
    'visual'  — a short sequence of screens (what it is, look for this, examples, try this today).
    'video'   — set `video` to a URL: a file (.mp4 / .webm) or an embed URL
                such as https://www.youtube.com/embed/VIDEO_ID or https://player.vimeo.com/video/ID.
                The video appears after "What it is"; the rest of the screens still follow.
    'article' — set `article` to an array of paragraphs (under ~800 words).
                The reading appears after "What it is"; the rest of the screens still follow.

  If `video` or `article` is empty, the visual lesson is shown instead.

  Diagrams are schematic posters drawn at 240 × 320 (an 18 × 24 in. sheet at 3:4).
*/
(() => {
  // ---- diagram helpers ----
  const svg = (label, body, defs = '') =>
    `<svg class="dg" viewBox="0 0 240 320" role="img" aria-label="${label}">` +
    (defs ? `<defs>${defs}</defs>` : '') +
    `<rect class="pf" x="0" y="0" width="240" height="320"/>${body}` +
    `<rect class="fr" x="0.5" y="0.5" width="239" height="319"/></svg>`;

  const rect = (x, y, w, h, cls = 'k', extra = '') =>
    `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}"${extra}/>`;
  const paint = (x, y, w, h, color) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" style="fill:${color}"/>`;
  const circ = (cx, cy, r, cls = 'k') => `<circle class="${cls}" cx="${cx}" cy="${cy}" r="${r}"/>`;
  const dot = (cx, cy, r, color) => `<circle cx="${cx}" cy="${cy}" r="${r}" style="fill:${color}"/>`;
  const text = (x, y, size, str, o = {}) =>
    `<text x="${x}" y="${y}" font-size="${size}" font-weight="${o.w || 700}" class="${o.c || 'k'}"` +
    (o.fill ? ` style="fill:${o.fill}"` : '') +
    (o.a ? ` text-anchor="${o.a}"` : '') +
    (o.ls != null ? ` letter-spacing="${o.ls}"` : '') +
    (o.tr ? ` transform="${o.tr}"` : '') +
    `>${str}</text>`;
  const bars = (x, y, widths, h = 3, gap = 7, cls = 'k', color) =>
    widths.map((w, i) => color
      ? paint(x, y + i * (h + gap), w, h, color)
      : rect(x, y + i * (h + gap), w, h, cls)).join('');
  const marker = (cx, cy, n) => circ(cx, cy, 10) + text(cx, cy + 4, 11, n, { c: 'w', a: 'middle' });

  // A single "found image": a bowl with steam and chopsticks, drawn in a 200 × 200 box.
  const dish = (x, y, s, o = {}) => {
    const fg = o.inv ? 'w' : (o.fg || 'k');
    const stroke = { k: 'sk', w: 'sw', m: 'sm', l: 'sl' }[fg];
    const bg = o.bg === false ? '' : rect(0, 0, 200, 200, o.inv ? 'k' : 'l');
    return `<g transform="translate(${x} ${y}) scale(${s})">${bg}` +
      `<path class="${fg}" d="M24 104 H176 A76 76 0 0 1 24 104 Z"/>` +
      rect(16, 96, 168, 10, fg) +
      `<path class="${stroke}" d="M70 84 C58 70 82 58 70 40 M100 84 C88 70 112 58 100 40 M130 84 C118 70 142 58 130 40"/>` +
      `<path class="${stroke}" d="M112 90 L182 26 M126 92 L190 40"/></g>`;
  };

  const COLS = [16, 70, 124, 178];
  const colGuides = COLS.map((x) => rect(x, 16, 46, 288, 'gd')).join('');
  const ROWS = [20, 68, 116, 164, 212, 260];
  const cellGuides = ROWS.map((y) => COLS.map((x) => rect(x, y, 46, 40, 'gd')).join('')).join('');

  // ---- Day 1 · Hierarchy ----
  const d1a = svg('Title, circle, and subtitle at similar weight',
    text(16, 64, 24, 'NIGHT MARKET', { ls: -0.5 }) + circ(120, 150, 42) +
    text(16, 244, 24, 'AFTER DARK', { ls: -0.5 }) + bars(16, 268, [208, 180, 150], 8, 6));
  const d1b = svg('One large circle dominates; small title and details',
    circ(150, 128, 104) + text(16, 270, 18, 'NIGHT MARKET', { ls: -0.3 }) + bars(16, 284, [92, 64], 3, 6));
  const d1c = svg('Three numbered levels of reading order',
    text(16, 76, 44, 'NIGHT', { ls: -1.5 }) + text(16, 120, 44, 'MARKET', { ls: -1.5 }) +
    text(16, 196, 15, 'FRIDAY 23:00') + text(16, 215, 15, 'CANAL STREET LOT') +
    bars(16, 272, [112, 96, 104]) +
    marker(222, 98, '1') + marker(222, 206, '2') + marker(222, 282, '3'));
  const d1d = svg('Same-size words; one promoted by a black box',
    text(16, 60, 18, 'FOOD') + text(16, 88, 18, 'SOUND') + rect(10, 98, 84, 26) +
    text(16, 117, 18, 'STREET', { c: 'w' }) + text(16, 144, 18, 'LATE') + bars(16, 272, [140, 110]));
  const d1e = svg('Same-size words; one promoted by space around it',
    text(16, 60, 18, 'FOOD') + text(16, 88, 18, 'SOUND') + text(16, 116, 18, 'LATE') +
    text(16, 214, 18, 'STREET') + bars(16, 272, [140, 110]));

  // ---- Day 2 · Typography ----
  const d2a = svg('Four type sizes that are too close together',
    text(16, 64, 30, 'DIASPORA', { ls: -0.5 }) + text(16, 98, 26, 'RADIO', { ls: -0.5 }) +
    text(16, 128, 22, '99.1 FM') + text(16, 156, 20, 'LATE NIGHT') + bars(16, 272, [150, 120]));
  const d2b = svg('Type sizes with large jumps between them',
    text(16, 40, 14, 'DIASPORA') + text(12, 236, 64, 'RADIO', { ls: -2.5 }) +
    text(16, 290, 11, '99.1 FM — LATE NIGHT', { w: 400 }));
  const d2c = svg('Title set as a sentence above a paragraph',
    text(16, 60, 20, 'DIASPORA RADIO') + bars(16, 80, [208, 196, 208, 150], 4, 8));
  const d2d = svg('The word Diaspora broken into three stacked lines',
    text(12, 100, 96, 'DIA', { ls: -3 }) + text(10, 184, 96, 'SPO', { ls: -3 }) +
    text(12, 268, 96, 'RA', { ls: -3 }) + text(16, 302, 12, 'RADIO — 99.1 FM'));
  const d2e = svg('Tight, heavy type',
    text(16, 150, 44, 'LATE', { ls: -2.5 }) + text(16, 192, 44, 'NIGHT', { ls: -2.5 }));
  const d2f = svg('Wide, light type',
    text(16, 170, 15, 'LATE NIGHT', { w: 300, ls: 7 }));

  // ---- Day 3 · Color ----
  const d3a = svg('Three colors in equal stripes',
    paint(0, 0, 240, 107, '#d7342a') + paint(0, 107, 240, 106, '#2748a8') + paint(0, 213, 240, 107, '#f2c230') +
    text(16, 60, 18, 'WEDDING SEASON', { fill: '#ffffff' }));
  const d3b = svg('Deep red field with a pink accent',
    paint(0, 0, 240, 320, '#7a1416') + dot(160, 120, 46, '#f2a7b8') +
    text(16, 270, 18, 'WEDDING SEASON', { fill: '#f2a7b8' }) + bars(16, 284, [110, 80], 3, 7, 'k', '#f2a7b8'));
  const d3c = svg('Red type on green of similar value',
    paint(0, 0, 240, 320, '#3f8a52') +
    text(16, 150, 40, 'WEDDING', { fill: '#d7342a', ls: -1 }) + text(16, 192, 40, 'SEASON', { fill: '#d7342a', ls: -1 }));
  const d3d = svg('Dark red type on pale pink',
    paint(0, 0, 240, 320, '#f6dcd6') +
    text(16, 150, 40, 'WEDDING', { fill: '#7a1416', ls: -1 }) + text(16, 192, 40, 'SEASON', { fill: '#7a1416', ls: -1 }));
  const d3e = svg('Orange field with red and yellow circles, all warm',
    paint(0, 0, 240, 320, '#e8742a') + dot(90, 120, 58, '#c62f24') + dot(176, 214, 26, '#f2c230') +
    text(16, 292, 18, 'WEDDING SEASON', { fill: '#5a1210' }));
  const d3f = svg('Orange field with one small blue circle',
    paint(0, 0, 240, 320, '#e8742a') + dot(90, 120, 58, '#c62f24') + dot(176, 214, 26, '#2748a8') +
    text(16, 292, 18, 'WEDDING SEASON', { fill: '#5a1210' }));

  // ---- Day 4 · Composition ----
  const d4a = svg('Centered circle and centered text',
    circ(120, 126, 62) + text(120, 248, 18, 'THIRD CULTURE', { a: 'middle' }) +
    rect(75, 266, 90, 3) + rect(90, 276, 60, 3));
  const d4b = svg('Large circle cropped off the top right; text bottom left',
    circ(196, 64, 112) + text(16, 262, 18, 'THIRD CULTURE') + bars(16, 280, [90, 60]));
  const d4c = svg('Elements slightly off-center, not aligned',
    circ(131, 126, 52) + text(28, 246, 18, 'THIRD CULTURE') + bars(38, 266, [90, 60]));
  const d4d = svg('Square and text sharing one left edge',
    rect(16, 16, 132, 132) + text(16, 246, 18, 'THIRD CULTURE') + bars(16, 264, [90, 60]) +
    '<line class="gl" x1="16" y1="0" x2="16" y2="320"/>');
  const d4e = svg('Black block on the left, right side empty',
    rect(0, 0, 132, 320) + text(16, 40, 18, 'THIRD', { c: 'w' }) + text(16, 62, 18, 'CULTURE', { c: 'w' }));
  const d4f = svg('Black block on the left, small dense block bottom right',
    rect(0, 0, 132, 320) + text(16, 40, 18, 'THIRD', { c: 'w' }) + text(16, 62, 18, 'CULTURE', { c: 'w' }) +
    rect(186, 238, 38, 38) + rect(150, 286, 74, 3) + rect(168, 296, 56, 3));

  // ---- Day 5 · Image treatment ----
  const tiles = (inv) => [0, 1, 2, 3].map((r) => [0, 1, 2].map((c) =>
    dish(16 + c * 72, 16 + r * 72, 0.32, { inv: inv && r === 1 && c === 2 })).join('')).join('');
  const d5a = svg('The whole image placed in the middle',
    dish(40, 48, 0.8) + text(16, 252, 16, 'STREET FOOD STORIES') + bars(16, 268, [150, 120]));
  const d5b = svg('The image cropped tightly until it becomes a shape',
    dish(-100, -150, 2.2) + rect(0, 262, 240, 58, 'w') + text(16, 290, 16, 'STREET FOOD STORIES') + bars(16, 302, [120]));
  const d5c = svg('The image repeated in a grid', tiles(false));
  const d5d = svg('The image repeated in a grid with one tile inverted', tiles(true));
  const d5e = svg('The image masked inside the word EAT',
    text(16, 40, 14, 'STREET FOOD STORIES') +
    `<g clip-path="url(#lz-eat)">${dish(-20, 40, 1.4, { inv: true })}</g>` + bars(16, 262, [150, 120]),
    '<clipPath id="lz-eat"><text x="10" y="236" font-size="112" font-weight="700" letter-spacing="-5" font-family="Helvetica Neue, Helvetica, Arial, sans-serif">EAT</text></clipPath>');
  const d5f = svg('The image layered at two scales',
    dish(-60, -10, 1.9, { bg: false, fg: 'l' }) + dish(60, 120, 0.8, { bg: false }) +
    text(16, 300, 16, 'STREET FOOD STORIES'));

  // ---- Day 6 · Type as image ----
  const sayRows = (inv) => Array.from({ length: 10 }, (_, i) => {
    const y = 38 + i * 30;
    if (inv && i === 4) return rect(0, 133, 240, 31) + text(16, y, 30, 'SAY SAY SAY', { c: 'w' });
    return text(16, y, 30, 'SAY SAY SAY');
  }).join('');
  const letters = (cls) =>
    text(-10, 170, 150, 'S', { c: cls, tr: 'rotate(-12 60 120)' }) +
    text(120, 130, 130, 'N', { c: cls === 'k' ? 'm' : cls, tr: 'rotate(-20 170 80)' }) +
    text(84, 250, 160, 'L', { c: cls, tr: 'rotate(14 130 170)' }) +
    text(10, 300, 120, 'A', { c: cls === 'k' ? 'm' : cls, tr: 'rotate(8 70 250)' }) +
    text(140, 330, 110, 'G', { c: cls });
  const d6a = svg('Language set plainly as information',
    text(16, 60, 20, 'NO TRANSLATION') + text(16, 86, 20, 'NEEDED') + bars(16, 106, [150, 120]));
  const d6b = svg('The word NO so large it is cropped by the page',
    text(-26, 304, 300, 'NO', { ls: -14 }) + text(16, 32, 12, 'NO TRANSLATION NEEDED'));
  const d6c = svg('The word SAY repeated into a texture, one row inverted', sayRows(true));
  const d6d = svg('The word SAY repeated in rotated columns',
    [0, 1, 2, 3, 4, 5].map((j) => {
      const x = 44 + j * 36;
      return text(x, 330, 30, 'SAY SAY SAY SAY SAY', { c: j % 2 ? 'l' : 'k', tr: `rotate(-90 ${x} 330)` });
    }).join(''));
  const d6e = svg('Overlapping rotated letters with no readable information', letters('k'));
  const d6f = svg('The same letters in light gray with one clear line of information',
    letters('l') + rect(0, 250, 240, 70) + text(16, 282, 22, 'SLANG NIGHT', { c: 'w' }) +
    text(16, 302, 11, 'FRIDAY 21:00', { c: 'w', w: 400 }));

  // ---- Day 7 · Grid + alignment ----
  const squares = (third) =>
    rect(16, 68, 46, 40) + rect(70, 68, 46, 40, 'l') + (third || rect(124, 68, 46, 40)) + rect(178, 68, 46, 40, 'l');
  const ritual = (third) =>
    text(16, 56, 36, 'RITUAL', { ls: -1 }) + squares(third) + rect(16, 116, 154, 88) +
    bars(16, 262, [100, 80, 92]) + bars(124, 262, [100, 70]);
  const d7a = svg('Elements placed by eye at unrelated positions',
    text(26, 70, 36, 'RITUAL', { ls: -1 }) + rect(58, 108, 128, 88) +
    bars(34, 232, [92, 70, 84]) + bars(118, 262, [80, 64]));
  const d7b = svg('Elements aligned to four columns, shown as dashed guides',
    colGuides + text(16, 70, 36, 'RITUAL', { ls: -1 }) + rect(70, 108, 154, 88) +
    bars(16, 232, [100, 80, 92]) + bars(124, 232, [100, 76]));
  const d7c = svg('A modular grid of four columns and six rows with content placed in it', cellGuides + ritual());
  const d7d = svg('The same layout without the guides', ritual());
  const d7e = svg('Every element rotated and misaligned',
    text(24, 70, 36, 'RITUAL', { ls: -1, tr: 'rotate(-7 80 60)' }) +
    rect(30, 86, 46, 40, 'k', ' transform="rotate(12 53 106)"') +
    rect(96, 96, 46, 40, 'l', ' transform="rotate(-9 119 116)"') +
    rect(160, 80, 46, 40, 'k', ' transform="rotate(20 183 100)"') +
    rect(40, 140, 150, 88, 'k', ' transform="rotate(6 115 184)"') +
    bars(40, 258, [100, 80]) + bars(110, 286, [90, 60]));
  const d7f = svg('A strict grid layout with one square rotated out of place',
    ritual(rect(132, 68, 46, 40, 'k', ' transform="rotate(10 155 88)"')));

  // ---- Day 8 · Scale + negative space ----
  const d8a = svg('Circle and word at similar scale',
    circ(120, 126, 52) + text(16, 250, 40, 'HOME', { ls: -1 }) + bars(16, 272, [120, 90]));
  const d8b = svg('A huge circle and a tiny word',
    circ(172, 110, 190) + text(16, 300, 10, 'HOME'));
  const d8c = svg('A page filled edge to edge',
    rect(16, 16, 100, 70) + rect(124, 16, 100, 40) + text(124, 80, 16, 'HOME') + rect(16, 96, 208, 50, 'l') +
    bars(16, 158, [208, 190, 208, 170, 200], 4, 7) + rect(16, 222, 64, 82) + rect(88, 222, 136, 38, 'l') +
    bars(88, 270, [136, 120, 130], 4, 7));
  const d8d = svg('One small square low on an empty page',
    rect(16, 280, 24, 24) + text(48, 300, 11, 'HOME'));
  const d8e = svg('HOME and AWAY at the same size',
    text(16, 150, 40, 'HOME', { ls: -1 }) + text(16, 196, 40, 'AWAY', { ls: -1 }));
  const d8f = svg('HOME enormous and cropped, AWAY tiny in the corner',
    text(-12, 252, 118, 'HOME', { ls: -6 }) + text(224, 34, 11, 'AWAY', { a: 'end' }));

  // ---- Day 9 · Breaking systems ----
  const dots = (breakOne) => [0, 1, 2, 3, 4].map((r) => [0, 1, 2, 3].map((c) => {
    const cx = 42 + c * 52, cy = 50 + r * 55;
    return breakOne && r === 2 && c === 2 ? rect(cx - 18, cy - 18, 36, 36) : circ(cx, cy, 18);
  }).join('')).join('');
  const d9a = svg('Twenty identical circles in a grid', dots(false));
  const d9b = svg('Twenty circles with one replaced by a square', dots(true));
  const d9c = svg('Unrelated shapes of different sizes and tones',
    circ(60, 70, 34) + rect(130, 40, 70, 50) + '<polygon class="k" points="40,210 90,130 120,220"/>' +
    circ(180, 170, 16) + rect(150, 230, 60, 20) + circ(70, 270, 22, 'm') + rect(20, 120, 30, 30, 'm') +
    '<polygon class="m" points="160,300 210,260 220,310"/>');
  const d9d = svg('The word FUTURE repeated in rows, one row tilted',
    [0, 1, 2, 3, 4, 5, 6].map((i) => {
      const y = 56 + i * 40;
      return text(16, y, 26, 'FUTURE', i === 3 ? { ls: -0.5, tr: `rotate(-8 68 ${y - 9})` } : { ls: -0.5 });
    }).join(''));
  const d9e = svg('Title mirrored and upside down',
    text(20, 150, 36, 'FUTURE', { tr: 'translate(240 0) scale(-1 1)' }) +
    text(20, 196, 36, 'FOLKLORE', { tr: 'rotate(180 120 180)' }));
  const d9f = svg('Title set vertically along the left edge, still readable',
    text(56, 306, 54, 'FOLKLORE', { ls: -2, tr: 'rotate(-90 56 306)' }) +
    text(80, 40, 16, 'FUTURE') + bars(80, 56, [140, 120, 130]) +
    text(80, 300, 11, 'EXHIBITION 2126', { w: 400 }));

  window.LESSONS = [
    {
      focus: 'Hierarchy',
      format: 'visual', video: '', article: [],
      what: [
        'Visual hierarchy controls the order in which someone notices information.',
        'A poster gets a glance before it gets a read. Decide what that glance lands on.'
      ],
      look: ['Differences in scale', 'Contrast', 'Spacing', 'Placement', 'Typographic weight'],
      examples: [
        { figs: [[d1a, 'Equal weight. Nothing is read first.'], [d1b, 'One dominant element. The order is obvious.']],
          note: 'Squint at both. Whatever survives the blur is the first read.' },
        { figs: [[d1c, '1 — seen from across the street. 2 — understood up close. 3 — read by someone already interested.']],
          note: 'Two or three levels are usually enough. More than that and they blur together.' },
        { figs: [[d1d, 'Contrast promotes it.'], [d1e, 'Space promotes it.']],
          note: 'Same size, different read. Scale is not the only lever.' }
      ],
      try: [
        'Make one element unmistakably dominant.',
        'Make the difference between the first and second read more extreme than feels comfortable.'
      ]
    },
    {
      focus: 'Typography',
      format: 'visual', video: '', article: [],
      what: [
        'Typography is the voice the words are spoken in.',
        'Size, weight, spacing, and line breaks can carry the concept of a poster on their own.'
      ],
      look: ['Scale jumps between sizes', 'Heavy against light', 'Letter and line spacing', 'Line length and where lines break'],
      examples: [
        { figs: [[d2a, 'Sizes too close. It looks unresolved.'], [d2b, 'Big jumps between sizes. It looks decided.']],
          note: 'If two sizes are close, make them the same or make them very different.' },
        { figs: [[d2c, 'Set as a sentence.'], [d2d, 'Set as a shape. Still readable.']],
          note: 'Where a line breaks is a design decision, not something the text box decides for you.' },
        { figs: [[d2e, 'Tight and heavy: loud, close.'], [d2f, 'Wide and light: quiet, far away.']],
          note: 'Same words, different voice. Both stay legible.' }
      ],
      try: [
        'Make the typography carry the concept.',
        'Before adding any shape or texture, get the type alone to feel like the event.'
      ]
    },
    {
      focus: 'Color',
      format: 'visual', video: '', article: [],
      what: [
        'Color works in relationships, not one swatch at a time.',
        'A color only looks bright, dark, warm, or loud next to something else.'
      ],
      look: ['Value: light against dark', 'Saturation: intense against muted', 'Temperature: warm against cool', 'One dominant color, others supporting'],
      examples: [
        { figs: [[d3a, 'Equal amounts. The colors compete.'], [d3b, 'One color dominates, one supports.']],
          note: 'Decide which color owns the page before choosing the others.' },
        { figs: [[d3c, 'Different hues, similar value. It vibrates and blurs.'], [d3d, 'Strong value contrast. It reads instantly.']],
          note: 'Imagine the poster in grayscale. If the words disappear, the value contrast is too low.' },
        { figs: [[d3e, 'All warm. Nothing stands apart.'], [d3f, 'One cool note in a warm field reads first.']],
          note: 'Temperature can create a focal point without changing size.' }
      ],
      try: [
        'Use one dominant color relationship on purpose.',
        'Choose the dominant color, the supporting color, and where the contrast lives before choosing anything else.'
      ]
    },
    {
      focus: 'Composition',
      format: 'visual', video: '', article: [],
      what: [
        'Composition is how visual weight is distributed across the page.',
        'Centered layouts feel settled. Asymmetric ones create tension that moves the eye.'
      ],
      look: ['Where the heaviest element sits', 'Tension against the edges', 'Alignments that connect separate parts', 'Empty areas balancing heavy ones'],
      examples: [
        { figs: [[d4a, 'Centered. Stable and still.'], [d4b, 'Off-center and cropped. Tension and movement.']],
          note: 'Pushing an element toward or past the edge charges the space around it.' },
        { figs: [[d4c, 'Slightly off. It looks like a mistake.'], [d4d, 'Clearly off, sharing an edge. It looks intended.']],
          note: 'Alignment is what makes asymmetry read as a choice. The dashed line is the shared edge.' },
        { figs: [[d4e, 'All the weight on one side. It tips over.'], [d4f, 'A small, dense counterweight holds it.']],
          note: 'Dark, dense, or detailed areas weigh more than their size suggests.' }
      ],
      try: [
        'Create intentional imbalance without making it feel accidental.',
        'Move the dominant element away from center, then use one alignment and one counterweight to hold it.'
      ]
    },
    {
      focus: 'Image treatment',
      format: 'visual', video: '', article: [],
      what: [
        'Image treatment is what you do to an image after you find it.',
        'One image pushed hard usually says more than several images placed side by side.'
      ],
      look: ['How tight the crop is', 'Repetition, and what changes in it', 'The shape that holds the image', 'Layers, offsets, and distortion'],
      examples: [
        { figs: [[d5a, 'The whole image, placed politely.'], [d5b, 'Cropped until it becomes a shape.']],
          note: 'The crop decides what the image is about.' },
        { figs: [[d5c, 'Repeated. The image becomes a pattern.'], [d5d, 'One tile changed. A pattern with a focal point.']],
          note: 'Repetition turns an image into rhythm. A single change gives the rhythm a point.' },
        { figs: [[d5e, 'Masked into type.'], [d5f, 'Layered at two scales.']],
          note: 'Every example here uses the same image. The treatment is the idea.' }
      ],
      try: [
        'Take one image further instead of adding more images.',
        'Try at least two treatments on the same image — crop, repeat, mask, distort, or layer — before choosing one.'
      ]
    },
    {
      focus: 'Type as image',
      format: 'visual', video: '', article: [],
      what: [
        'Letters are shapes before they are words.',
        'Cropped, repeated, rotated, or packed together, type can become the image of the poster.'
      ],
      look: ['Letterforms as silhouettes', 'Repetition that turns words into texture', 'Crops at the edge of the page', 'Density: packed against sparse'],
      examples: [
        { figs: [[d6a, 'Language as information.'], [d6b, 'Language as form.']],
          note: 'A cropped letter is still recognizable. That recognition is part of the image.' },
        { figs: [[d6c, 'Repeated until it becomes texture.'], [d6d, 'Rotated into rhythm.']],
          note: 'Repetition changes how a word is read: first as pattern, then as meaning.' },
        { figs: [[d6e, 'Only form. Nobody knows what it is.'], [d6f, 'Form, plus one line anyone can read.']],
          note: 'Let the expressive type be expressive. Keep the event information plain.' }
      ],
      try: [
        'Use language as visual material, not only as readable information.',
        'Choose one word and crop, repeat, rotate, or stack it. Keep the essential information legible elsewhere.'
      ]
    },
    {
      focus: 'Grid + alignment',
      format: 'visual', video: '', article: [],
      what: [
        'A grid is a set of decisions made before layout: margins, columns, and the lines things align to.',
        'It makes a poster feel built, and it makes breaking it meaningful.'
      ],
      look: ['Consistent margins', 'Columns that elements snap to', 'Repeated spacing that creates rhythm', 'The one element that breaks it, if any'],
      examples: [
        { figs: [[d7a, 'Placed by eye.'], [d7b, 'Placed on four columns.']],
          note: 'The dashed columns show the structure. Every edge lines up with one.' },
        { figs: [[d7c, 'The structure: margins, four columns, six rows.'], [d7d, 'What the viewer sees: order, not lines.']],
          note: 'Nobody sees the grid. They feel that things belong together.' },
        { figs: [[d7e, 'Everything breaks. There is no grid to feel.'], [d7f, 'One break against a clear grid.']],
          note: 'A break only reads if the structure around it is strict.' }
      ],
      try: [
        'Build a clear structure first, then decide whether anything should break it.',
        'Set your margins and columns before placing a single element.'
      ]
    },
    {
      focus: 'Scale + negative space',
      format: 'visual', video: '', article: [],
      what: [
        'Scale is relative: something is only big next to something small.',
        'Negative space is room left empty on purpose. It gives the big thing somewhere to be.'
      ],
      look: ['The ratio between largest and smallest', 'How much of the page is empty', 'Where density collects', 'The proportion of empty to full'],
      examples: [
        { figs: [[d8a, 'About 2× apart. Polite.'], [d8b, 'Many times apart. Dramatic.']],
          note: 'Small differences read as hesitation. Extreme ones read as intent.' },
        { figs: [[d8c, 'Filled. Nothing has room.'], [d8d, 'Empty. The small thing gets loud.']],
          note: 'Empty space is not unused. It is what makes the one element visible.' },
        { figs: [[d8e, 'Same size. A label.'], [d8f, 'Extreme scale. A statement.']],
          note: 'The difference in scale can carry the idea by itself.' }
      ],
      try: [
        'Push one element much larger or smaller than you normally would.',
        'Then remove something to give it room.'
      ]
    },
    {
      focus: 'Breaking systems',
      format: 'visual', video: '', article: [],
      what: [
        'A visual rule only exists once it repeats.',
        'When the viewer has learned the pattern, a single break becomes the loudest thing on the page.'
      ],
      look: ['The rule: what repeats', 'The expectation it creates', 'The single break', 'What stays legible'],
      examples: [
        { figs: [[d9a, 'A rule: repetition.'], [d9b, 'One break. The eye goes straight to it.']],
          note: 'The break is visible only because nineteen shapes follow the rule.' },
        { figs: [[d9c, 'No rule. Nothing to break.'], [d9d, 'A clear rule, broken once.']],
          note: 'Many small variations read as noise, not as a break.' },
        { figs: [[d9e, 'Broken past reading.'], [d9f, 'A broken convention that stays readable.']],
          note: 'Break an expectation, not the reader’s ability to understand the poster.' }
      ],
      try: [
        'Establish a rule, then intentionally break it once.',
        'Repeat a size, angle, color, or alignment. Break it exactly where you want attention.'
      ]
    },
    {
      focus: 'Synthesis',
      recap: true,
      recapNames: ['Hierarchy', 'Typography', 'Color', 'Composition', 'Image treatment', 'Type as image', 'Grid', 'Scale', 'Controlled rule-breaking'],
      questions: ['Which of these now feels most natural to you?', 'Which do you still avoid?'],
      try: [
        'Begin the final redesign.',
        'Same brief as Day 1. Start completely from scratch.'
      ]
    }
  ];

  // After-sprint check, one list per day. Answered yes / partly / no —
  // first by you, then (in the published page) by Claude from a poster image.
  const CHECKS = [
    [
      'Is one element unmistakably dominant?',
      'Is the reading order clear — first, second, third?',
      'Is the gap between the first and second read extreme?'
    ],
    [
      'Does the typography carry the concept, not just label it?',
      'Are the jumps between type sizes clear and decided?',
      'Is it free of photography?',
      'Is the essential information still legible?'
    ],
    [
      'Does one color clearly dominate?',
      'Is there enough value contrast to read the key information?',
      'Does it stay within three main colors?'
    ],
    [
      'Is the composition off-center?',
      'Does the imbalance look intentional, not accidental?',
      'Do alignments or a counterweight hold it together?'
    ],
    [
      'Does it start from one main image?',
      'Is that image transformed — cropped, repeated, masked, or distorted — not just placed?',
      'Does the treatment support the idea of the event?'
    ],
    [
      'Does at least one piece of language work mainly as visual form?',
      'Is the essential information still readable?',
      'Does the type treatment connect to meaning beyond translation?'
    ],
    [
      'Is there a clear underlying grid?',
      'Are margins and alignments consistent?',
      'If anything breaks the grid, does the break look deliberate?'
    ],
    [
      'Is there an extreme difference in scale?',
      'Does negative space give the key element room?',
      'Does the scale contrast support the idea of home and away?'
    ],
    [
      'Is there a clear visual rule?',
      'Is one convention broken on purpose?',
      'Is it still legible?'
    ],
    [
      'Is there a clear first read?',
      'Do the type, image, and color decisions work as one system?',
      'Does it carry the late-night energy of the brief?'
    ]
  ];
  window.LESSONS.forEach((lesson, i) => { lesson.check = CHECKS[i]; });
})();
