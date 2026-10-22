# Poster Sprint Studio

A daily design-practice coach for creative web tools. Plain HTML/CSS/JS with no build step, plus one Vercel function.

- **Today**: cards for each challenge in progress (progress bar, continue), a "start new" card, and practice filters.
- **Challenges**: browse the five programs (poster, type, motion, color, layout) or make your own.
- **Day flow**: brief → lesson in the app → **Start sprint** pops out a floating coach widget (Document Picture-in-Picture in Chrome 116+, otherwise a mini widget in the corner of the page). The widget shows the stage, instruction, time left, pause/next and chimes, and asks you to submit when time is up.
- **Paste up**: drop, browse, or paste (⌘V) your PNG/JPG export, then reflect. It gets wheatpasted onto **The Wall**, and the AI critic answers your reflection.
- **The Wall**: a sideways-scrolling NYC street wall (CSS/SVG brick and plywood). Click a poster to see its brief, your reflection, and the critique. JSON export/import and a demo-poster toggle are included.

## AI critique
`api/critique.js` reads `GEMINI_API_KEY` (recommended model is `gemini-3.8-flash`), or `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`. `CRITIQUE_MODEL` overrides the model. With no key, the app says feedback is not configured and everything else works. See `AI_RESEARCH.md`.

## Dev
`python3 -m http.server`, then open `/?speed=60` (faster timer), `?reset` (clear state), `?demo` (demo posters), or `?nopip` (force the mini widget). The `/api` function only runs on Vercel (or `vercel dev`).
