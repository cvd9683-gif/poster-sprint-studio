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

  window.STUDIO_DATA = { PRACTICES, EXTRA_LESSONS, TOPICS, FOCI };
})();
