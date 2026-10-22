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

  const PRACTICES = {
    poster: { name: 'Poster', unit: 'poster', prompts: POSTER_PROMPTS, lessons: () => window.LESSONS },
    type: { name: 'Typography', unit: 'type study', prompts: [
      { title: 'One Word, Five Moods', brief: 'Set the word “NOW” five times so each version carries a different emotion: urgent, tender, bored, euphoric, suspicious.', focus: 'Type as image', constraint: 'One typeface only. Change size, weight, spacing, and placement.' },
      { title: 'Corner Store Sign', brief: 'Design a typographic sign for a neighborhood store that has been open for 40 years and just got new owners.', focus: 'Hierarchy', constraint: 'Maximum two typefaces. No images.' },
      { title: 'Lyric Sheet', brief: 'Set four lines of a song you love so the type moves the way the music does.', focus: 'Rhythm', constraint: 'Black on white only.' },
      { title: 'Specimen of the Street', brief: 'Make a type specimen for a fictional font inspired by your block.', focus: 'Grid and alignment', constraint: 'Show the full alphabet plus one sentence.' },
      { title: 'Whisper / Shout', brief: 'Put a whispered sentence and a shouted sentence on the same page.', focus: 'Scale and negative space', constraint: 'The whisper must be read first.' }
    ] },
    motion: { name: 'Motion', unit: 'loop', prompts: [
      { title: 'Doorbell', brief: 'Animate a 3-second loop of the moment before someone opens the door.', focus: 'Timing', constraint: 'Only squares. No more than 3 shapes.' },
      { title: 'Title Card', brief: 'Make an animated title card for a fictional late-night radio show.', focus: 'Easing', constraint: 'Type must enter and exit. 5 seconds max.' },
      { title: 'Heartbeat UI', brief: 'Design a loading animation that feels alive instead of mechanical.', focus: 'Rhythm', constraint: 'One color. Loop seamlessly.' },
      { title: 'Transit', brief: 'Show the feeling of a crowded train arriving using only lines.', focus: 'Anticipation', constraint: 'Black and white. 4 seconds.' }
    ] },
    color: { name: 'Color', unit: 'color study', prompts: [
      { title: 'Grandmother’s Kitchen', brief: 'Build a palette and a simple composition from the memory of a kitchen.', focus: 'Color', constraint: 'Five colors, one dominant.' },
      { title: '3 a.m.', brief: 'Make a flat composition that feels like the city at 3 a.m.', focus: 'Value contrast', constraint: 'No pure black or pure white.' },
      { title: 'Same Shape, Two Seasons', brief: 'One shape layout, recolored as summer and as winter.', focus: 'Temperature', constraint: 'Layout must stay identical.' },
      { title: 'Festival Flag', brief: 'Design a flag for a festival that does not exist yet.', focus: 'Color', constraint: 'Maximum 3 colors.' }
    ] },
    layout: { name: 'Layout', unit: 'spread', prompts: [
      { title: 'Zine Spread', brief: 'Design a two-page spread for a zine about a place you used to live.', focus: 'Grid and alignment', constraint: 'Use a 6-column grid.' },
      { title: 'Menu Redesign', brief: 'Redesign the menu of your favorite cheap restaurant.', focus: 'Hierarchy', constraint: 'Everything must fit on one page.' },
      { title: 'Event Program', brief: 'Lay out a one-page program for a community talent show.', focus: 'Rhythm', constraint: 'One image, many names.' },
      { title: 'Interview Page', brief: 'Lay out a magazine interview with a musician you admire.', focus: 'Composition', constraint: 'The pull quote must dominate.' }
    ] }
  };

  // Short lessons for focus skills not covered by the poster program.
  const EXTRA_LESSONS = {
    'Rhythm': simpleLesson('Rhythm', ['Rhythm is repetition with variation.', 'The eye moves in beats. Decide where it rests and where it speeds up.'], ['Repeated intervals', 'A break in the pattern', 'Accents', 'Pauses (space)'], ['Set up a pattern, then break it once.', 'Make the break land on what matters most.']),
    'Timing': simpleLesson('Timing', ['Timing is how long things take, and how long they wait.', 'The pause is often more expressive than the move.'], ['Holds', 'Speed changes', 'Overlap', 'Silence'], ['Add a hold before the main action.', 'Cut one motion entirely.']),
    'Easing': simpleLesson('Easing', ['Easing gives motion weight.', 'Nothing in the real world starts or stops instantly.'], ['Ease in', 'Ease out', 'Overshoot', 'Settle'], ['Try the same move with linear vs. eased timing.', 'Keep the one that feels like it has mass.']),
    'Anticipation': simpleLesson('Anticipation', ['Anticipation is the small move before the big move.', 'It tells the viewer something is about to happen.'], ['Wind-up', 'Squash before stretch', 'Direction cues'], ['Add a wind-up to your main action.', 'Make it shorter than feels right.']),
    'Value contrast': simpleLesson('Value contrast', ['Value is lightness and darkness, separate from hue.', 'If it fails in grayscale, it fails.'], ['Darkest dark', 'Lightest light', 'Mid-tone groups'], ['Check your piece in grayscale.', 'Push the key element to the extreme value.']),
    'Temperature': simpleLesson('Temperature', ['Colors feel warm or cool, and that shifts mood fast.', 'Temperature contrast can replace value contrast.'], ['Warm vs. cool', 'Neutral anchors', 'Accent temperature'], ['Pick one temperature to dominate.', 'Use the opposite only as an accent.'])
  };

  window.STUDIO_DATA = { PRACTICES, EXTRA_LESSONS };
})();
