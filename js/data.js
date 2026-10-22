/* Poster Sprint Studio — challenge data.
   POSTER_PROMPTS is copied verbatim from the original Poster Sprint (10-day program);
   its lessons live in lessons.js (unchanged). Other practices are a smaller new set. */
(() => {
  const POSTER_PROMPTS = [
    {
      title: 'Night Market After Dark',
      brief: 'Design a poster for a fictional late-night gathering centered around food, sound, street culture, and the energy of being outside after everyone else has gone home.',
      focus: 'Hierarchy',
      constraint: 'Use one dominant visual element.'
    },
    {
      title: 'Diaspora Radio',
      brief: 'Design a poster for a fictional late-night radio program connecting music, places, languages, and generations across diasporas.',
      focus: 'Typography',
      constraint: 'No photography. Let typography carry the poster.'
    },
    {
      title: 'Wedding Season',
      brief: 'Create a poster for a fictional exhibition exploring celebration, family, spectacle, tradition, and reinvention. Do not simply create a wedding invitation.',
      focus: 'Color',
      constraint: 'Maximum 3 main colors.'
    },
    {
      title: 'Third Culture',
      brief: 'Design a poster for an exhibition about belonging to multiple places at once.',
      focus: 'Composition',
      constraint: 'Do not use a centered composition.'
    },
    {
      title: 'Street Food Stories',
      brief: 'Create a poster for a food event where each dish connects to someone’s memory, neighborhood, family, or migration.',
      focus: 'Image treatment',
      constraint: 'Begin with only one main image. Crop, repeat, distort, mask, or transform it instead of collecting multiple images.'
    },
    {
      title: 'No Translation Needed',
      brief: 'Create a poster for an event about language, slang, gestures, symbols, phrases, and meaning beyond literal translation.',
      focus: 'Type as image',
      constraint: 'At least one piece of language should function primarily as visual form.'
    },
    {
      title: 'Ritual',
      brief: 'Take an ordinary repeated personal or cultural ritual and turn it into the subject of an exhibition.',
      focus: 'Grid and alignment',
      constraint: 'Use a deliberate underlying grid.'
    },
    {
      title: 'Home / Away',
      brief: 'Create a poster for a publication about what makes somewhere feel like home and what happens when home exists in multiple places.',
      focus: 'Scale and negative space',
      constraint: 'Use an intentionally extreme difference in scale.'
    },
    {
      title: 'Future Folklore',
      brief: 'Create a poster for an exhibition exploring the stories, myths, superstitions, symbols, internet rituals, and cultural artifacts people might inherit 100 years from now.',
      focus: 'Breaking systems',
      constraint: 'Break one visual convention intentionally while preserving legibility.'
    },
    {
      title: 'Night Market After Dark',
      brief: 'Design a poster for a fictional late-night gathering centered around food, sound, street culture, and the energy of being outside after everyone else has gone home.',
      focus: 'Synthesis',
      constraint: 'Start completely from scratch. Don’t look at your Day 1 poster.'
    }
  ];

  const simpleLesson = (focus, what, look, tryLines) => ({ focus, format: 'visual', video: '', article: [], what, look, examples: [], try: tryLines, simple: true });

  // Practice types. Topics are chosen by the user; briefs are formats that take any topic.
  const PRACTICES = {
    poster: { name: 'Poster', color: 'red', does: 'Hierarchy, image and type in one hit.', focus: 'Hierarchy',
      briefs: ['A poster for an event about {t}.', 'A gig poster where {t} is the headliner.', 'A protest-style poster about {t}. Readable from across the street.', 'An exhibition poster on {t}.', 'A poster about {t} using only one image.'],
      constraints: ['One dominant element.', 'Type does all the work. No photos.', 'Three colors max.', 'No centered layout.', 'Extreme scale contrast.'] },
    type: { name: 'Typography', color: 'violet', does: 'Letters as the whole picture.', focus: 'Typography',
      briefs: ['Set one word about {t} five ways.', 'A type-only cover about {t}.', 'A sign for something about {t}.', 'Set a sentence about {t} so it sounds the way it feels.', 'A specimen inspired by {t}.'],
      constraints: ['One typeface.', 'Two typefaces max. No images.', 'Black and white only.', 'Use a strict grid.', 'The quietest line reads first.'] },
    motion: { name: 'Motion', color: 'pink', does: 'Timing, easing, and the pause before.', focus: 'Timing',
      briefs: ['A 3-second loop about {t}.', 'An animated title card for {t}.', 'A loader that feels like {t}.', 'Show {t} using only lines.'],
      constraints: ['Squares only.', 'Type enters and exits.', 'One color. Seamless loop.', '4 seconds max.'] },
    layout: { name: 'Layout', color: 'green', does: 'Grids that carry the reading.', focus: 'Grid and alignment',
      briefs: ['A zine spread about {t}.', 'A one-page menu for {t}.', 'A program for an evening of {t}.', 'An interview page about {t}.'],
      constraints: ['6-column grid.', 'Fits on one page.', 'One image, lots of names.', 'The pull quote dominates.'] },
    color: { name: 'Color', color: 'mustard', does: 'Palettes, value, and mood.', focus: 'Color',
      briefs: ['A palette and composition from {t}.', 'A flat piece that feels like {t} at 3 a.m.', 'One layout, recolored twice for {t}.', 'A flag for {t}.'],
      constraints: ['Five colors, one dominant.', 'No pure black or white.', 'Layout stays identical.', 'Three colors max.'] },
    own: { name: 'Make your own', color: 'ink', does: 'Your format, your rules.', focus: 'Visual design',
      briefs: ['Make something about {t}.', 'Push yesterday’s piece about {t} further.', 'Make it about {t} again, from scratch.'],
      constraints: ['Set your own.', 'Change one thing on purpose.', 'Half the time you think you need.'] }
  };
  const TOPICS = ['Culture', 'Music', 'Protest', 'Food', 'Your block', 'Memory', 'Type only'];
  const FOCI = ['Typography', 'Hierarchy', 'Color', 'Composition', 'Visual design'];

  // Short lessons for focus skills not covered by the poster program.
  const EXTRA_LESSONS = {
    'Rhythm': simpleLesson('Rhythm', ['Rhythm is repetition with variation.', 'The eye moves in beats. Decide where it rests and where it speeds up.'], ['Repeated intervals', 'A break in the pattern', 'Accents', 'Pauses (space)'], ['Set up a pattern, then break it once.', 'Make the break land on what matters most.']),
    'Timing': simpleLesson('Timing', ['Timing is how long things take, and how long they wait.', 'The pause is often more expressive than the move.'], ['Holds', 'Speed changes', 'Overlap', 'Silence'], ['Add a hold before the main action.', 'Cut one motion entirely.']),
    'Easing': simpleLesson('Easing', ['Easing gives motion weight.', 'Nothing in the real world starts or stops instantly.'], ['Ease in', 'Ease out', 'Overshoot', 'Settle'], ['Try the same move with linear vs. eased timing.', 'Keep the one that feels like it has mass.']),
    'Anticipation': simpleLesson('Anticipation', ['Anticipation is the small move before the big move.', 'It tells the viewer something is about to happen.'], ['Wind-up', 'Squash before stretch', 'Direction cues'], ['Add a wind-up to your main action.', 'Make it shorter than feels right.']),
    'Value contrast': simpleLesson('Value contrast', ['Value is lightness and darkness, separate from hue.', 'If it fails in grayscale, it fails.'], ['Darkest dark', 'Lightest light', 'Mid-tone groups'], ['Check your piece in grayscale.', 'Push the key element to the extreme value.']),
    'Temperature': simpleLesson('Temperature', ['Colors feel warm or cool, and that shifts mood fast.', 'Temperature contrast can replace value contrast.'], ['Warm vs. cool', 'Neutral anchors', 'Accent temperature'], ['Pick one temperature to dominate.', 'Use the opposite only as an accent.'])
  };


  // ===== v4: scenario x skill. The output is always a poster; the skill rotates. =====
  const SCENARIOS = {
    corporate: { name: 'Corporate brand', color: 'violet', line: 'Calm, credible, on-brand. Every word earns its place.',
      jobs: [
        { title: 'Halvorsen Freight — Annual Report 2026', for: 'a corporate annual report', copy: 'Annual Report 2026 · Moving 4.2M tons, on time · halvorsen.com' },
        { title: 'Northwell Bank — We moved downtown', for: 'a bank’s office-move announcement', copy: 'New HQ · 200 Water St · Opening May 4' },
        { title: 'Atlas Health — Values poster', for: 'an internal values poster', copy: 'Listen first · Say it plainly · Own the outcome' } ] },
    gig: { name: 'Music gig flyer', color: 'pink', line: 'Loud, fast to read, made for a lamppost.',
      jobs: [
        { title: 'Pale Static live at Baby’s All Right', for: 'a gig flyer', copy: 'Pale Static · w/ Moth Choir · Fri Nov 13 · Doors 8pm · $18' },
        { title: 'Basement Dub Night', for: 'a club night flyer', copy: 'Basement Dub · every Thursday · 10pm–late · free before 11' },
        { title: 'Brass on the Pier', for: 'a free outdoor concert', copy: 'Brass on the Pier · Pier 45 · Sat 6pm · free, all ages' } ] },
    protest: { name: 'Protest / PSA', color: 'red', line: 'One message, readable from across the street.',
      jobs: [
        { title: 'Rent is too damn high', for: 'a tenants’ rally', copy: 'Rally for rent relief · City Hall · Sat 12pm' },
        { title: 'Wash your hands', for: 'a public health PSA', copy: '20 seconds. Soap. Every time.' },
        { title: 'Save the 7th St Library', for: 'a neighborhood petition', copy: 'Sign by Dec 1 · savethe7th.org' } ] },
    gallery: { name: 'Gallery show', color: 'ink', line: 'Quiet confidence. Space, restraint, one idea.',
      jobs: [
        { title: 'Ines Okafor — Salt Rooms', for: 'a solo gallery show', copy: 'Ines Okafor · Salt Rooms · Oct 30–Dec 12 · Opening Thu 6–9' },
        { title: 'Small Monuments (group show)', for: 'a group exhibition', copy: 'Small Monuments · 9 artists · Ground Floor Gallery' },
        { title: 'Print Fair 2026', for: 'an art book fair', copy: 'Print Fair · 120 publishers · Nov 7–8 · free' } ] },
    product: { name: 'Product launch', color: 'mustard', line: 'One product, one benefit, make people want it.',
      jobs: [
        { title: 'Loop — the 4-minute kettle', for: 'a product launch', copy: 'Loop Kettle · boils in 4 min · $89 · out now' },
        { title: 'Field Notes running shoe', for: 'a sneaker drop', copy: 'Field 2 · lighter by 40g · drops Fri' },
        { title: 'Quiet — noise-cancelling app', for: 'an app launch', copy: 'Quiet · silence in one tap · free on iOS' } ] },
    own: { name: 'Make your own', color: 'green', line: 'Your client, your context.', jobs: [] }
  };
  const SKILLS = {
    type: { name: 'Type', lesson: 'Typography', does: 'Choosing and setting type.' },
    color: { name: 'Color', lesson: 'Color', does: 'Palettes, value, mood.' },
    layout: { name: 'Layout', lesson: 'Composition', does: 'Where things sit and why.' },
    grid: { name: 'Grid', lesson: 'Grid + alignment', does: 'Structure you can feel.' },
    image: { name: 'Image', lesson: 'Image treatment', does: 'Crop, treat, transform one image.' },
    hierarchy: { name: 'Hierarchy', lesson: 'Hierarchy', does: 'What we read first, second, third.' }
  };
  const SKILL_ORDER = ['type', 'color', 'layout', 'grid', 'image', 'hierarchy'];
  // BRIEFS[skill][scenario] = [[brief, constraint], ...]. {job} = the day's job, {copy} = its text.
  const BRIEFS = {
    type: {
      corporate: [['Set the cover for {job}. The type alone has to say “we are trustworthy.”', 'One typeface, two weights max.'], ['Make {job} feel premium using only typesetting: spacing, case, size.', 'No color but black on one paper tone.']],
      gig: [['Make {job} where the band name IS the image.', 'Type only. No photos, no shapes.'], ['A flyer for {job} that you can read at a jog.', 'Max 3 sizes of type.']],
      protest: [['Make {job} shout without shouting: the type does all the work.', 'One typeface. All caps or none, not both.'], ['Hand-set or hand-lettered {job}.', 'Draw or modify at least one word by hand.']],
      gallery: [['Set {job} so the typography feels like part of the art.', 'Text no bigger than 1/10 of the poster height.'], ['A type-only poster for {job}.', 'Use a serif. Tracking is your main tool.']],
      product: [['Name {job} in type that feels like the product.', 'The product name in a typeface you’ve never used.'], ['Make the benefit line the hero for {job}.', 'The benefit is bigger than the product name.']],
      own: [['Make a type-only poster for {job}.', 'One typeface, three sizes.'], ['Let one word carry {job}.', 'One word is 5x bigger than everything else.']] },
    color: {
      corporate: [['Make {job} in the brand colors, but make it feel alive.', 'Two brand colors + one neutral.'], ['A cover for {job} where color carries the data story.', 'One accent color, used once.']],
      gig: [['A flyer for {job} that feels like the sound, through color only.', 'Three colors, one fluorescent.'], ['Make {job} vibrate.', 'Two complementary colors at equal value.']],
      protest: [['Make {job} visible from a block away.', 'Max 2 colors. Maximum contrast.'], ['Make {job} using color as the emotion.', 'One color, many values (tints/shades).']],
      gallery: [['A palette for {job} pulled from a single imagined artwork.', 'Five colors, one dominant at 60%.'], ['Make {job} in an unusual quiet palette.', 'No pure black, no pure white.']],
      product: [['Make {job} with color that says what the product does.', 'The background is the product color.'], ['Two colorways of {job}: same layout, different mood.', 'Layout stays identical.']],
      own: [['Make {job} with a palette from a photo you took today.', 'Pick exactly 4 colors from it.'], ['Make {job} in one hue.', 'Monochrome. Value does the work.']] },
    layout: {
      corporate: [['Lay out {job} so it reads in 3 seconds in a lobby.', 'Generous margins: 10% on every side.'], ['An asymmetric layout for {job}.', 'Nothing centered.']],
      gig: [['Lay out {job} like the stage: one thing in the spotlight.', 'One element takes 70% of the space.'], ['Make {job} feel crowded on purpose, and still read.', 'Everything touches an edge.']],
      protest: [['Lay out {job} for a phone photo and a lamppost.', 'The message sits in the top third.'], ['A layout for {job} built on a single diagonal.', 'Everything aligns to one diagonal.']],
      gallery: [['Lay out {job} with more empty space than content.', 'At least 60% empty.'], ['Place {job} text like objects in a room.', 'Three text blocks, three corners.']],
      product: [['Lay out {job} so the product feels huge.', 'The product breaks the frame.'], ['A layout for {job} with a clear path: product → benefit → buy.', 'Exactly three elements.']],
      own: [['Make {job} with a layout you’d normally avoid.', 'Bottom-heavy composition.'], ['Lay out {job} with one huge thing and one tiny thing.', 'Nothing medium-sized.']] },
    grid: {
      corporate: [['Build {job} on a strict grid.', '12-column grid, everything snaps.'], ['Make {job} using the grid as a visible element.', 'Show at least one grid line.']],
      gig: [['Put {job} on a grid, then break it once.', 'One element ignores the grid.'], ['Make {job} as a modular grid of tiles.', 'A 4x4 grid; fill at least 10 cells.']],
      protest: [['Make {job} with the grid as order against chaos.', '3-column grid, text hangs from one top line.'], ['Repeat the message of {job} on a grid.', 'Repetition in a grid, one cell different.']],
      gallery: [['A Swiss-style poster for {job}.', 'Flush left, ragged right, strict baseline.'], ['Make {job} on an unusual grid.', 'Use a 5- or 7-column grid.']],
      product: [['A spec-sheet poster for {job}.', 'Grid of 4 facts + 1 hero.'], ['Make {job} with the product repeated on a grid.', 'Same image, 6+ times, one changed.']],
      own: [['Build {job} on a grid you draw first.', 'Sketch the grid before anything else.'], ['Make {job} using a baseline grid.', 'All type sits on one baseline grid.']] },
    image: {
      corporate: [['Make {job} from one ordinary photo of the business.', 'One photo. Crop it hard.'], ['Treat the image for {job} so it feels on-brand.', 'Duotone in brand colors.']],
      gig: [['Make {job} from one photo you distort.', 'One image: stretch, slice or repeat it.'], ['A photocopy-style flyer for {job}.', 'Black and white, high contrast, grain.']],
      protest: [['Make {job} with a single powerful image.', 'The image is cropped to its most urgent part.'], ['Make {job} with a symbol instead of a photo.', 'One drawn symbol, no photos.']],
      gallery: [['Make {job} with one detail of an imagined artwork.', 'Crop to under 10% of the original.'], ['Make {job} where the image is barely there.', 'The image is at 20% opacity or smaller than the text.']],
      product: [['A hero shot for {job}.', 'The product image is cut out, no background.'], ['Make {job} with the product in a surprising crop.', 'Show less than half the product.']],
      own: [['Make {job} from one image you took today.', 'One image, three treatments tried.'], ['Make {job} with an image made of type.', 'No photos.']] },
    hierarchy: {
      corporate: [['Make {job} where the reader knows instantly what matters.', 'Exactly three levels of text.'], ['Reorder {job}: lead with the number.', 'A number is the biggest thing.']],
      gig: [['Make {job}: who, when, where in that order.', 'Readable in 3 seconds from 3 meters.'], ['Make {job} where the date wins.', 'The date is bigger than the band name.']],
      protest: [['Make {job} with one message and nothing else competing.', 'One line dominates; everything else is under 1/4 its size.'], ['Make {job} that works if people only read 3 words.', 'Highlight 3 words.']],
      gallery: [['Make {job} where the artist name leads, quietly.', 'Hierarchy through position, not size.'], ['Make {job} with hierarchy built from weight only.', 'Same size for all text.']],
      product: [['Make {job}: product, benefit, price.', 'Three levels, clear steps between them.'], ['Make {job} where the call to action is impossible to miss.', 'The CTA uses the only accent color.']],
      own: [['Make {job} with a clear first, second, third read.', 'Three levels of text.'], ['Make {job} where the smallest text is the most important.', 'Pull the eye with color or space.']] }
  };
  const SKILL_LESSONS = {};
  window.STUDIO_DATA = { PRACTICES, EXTRA_LESSONS, TOPICS, FOCI, SCENARIOS, SKILLS, SKILL_ORDER, BRIEFS };
})();
