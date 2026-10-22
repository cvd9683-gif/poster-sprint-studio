# Which AI should critique the posters? (research, Oct 22 2026)

## What the feedback has to do
One short critique per sprint, written after the designer's own reflection: one thing that works, one thing to push, whether the
constraint was followed, a 1–5 score on the day's focus skill. One image in, ~150 tokens out. It must feel fast (a few seconds)
and cost close to nothing, because it runs on the app owner's key (no user keys).

## What the research says about design critique
- **No model is a reliable design critic yet.** Lica's Graphic-Design-Bench (Apr 2026) tested GPT-5.4, Gemini 3.1 Pro and Claude
  Opus 4.6 on 49 design tasks: 2 mostly solved, 25 partially, 22 unsolved. Fine perception is weak (font recognition ≤ 23.7%,
  component detection 6.4% mAP), and *no single model dominates*; strengths barely overlap.
  https://lica.world/blog/gdb-real-world-benchmark-for-graphic-design · https://arxiv.org/html/2604.04192v2
- **Holistic judgement is the strongest skill.** Microsoft Research's design-understanding benchmark (IEEE TMM 2026, 1,600
  annotated examples, 19 models) found GPT-4.1 best at 65.5% alignment with human judges, with closed models only slightly ahead
  of the best open model, and prompt refinement / few-shot examples helping.
  https://www.microsoft.com/en-us/research/publication/can-multimodal-large-language-models-understand-graphic-design-a-comparative-study/
- Takeaway for this tool: ask about **one focus skill** and the **constraint**, which is the high-level judgement models are
  decent at, instead of pixel-level detail they get wrong. Show the student's reflection first so AI adds to their judgement
  rather than replacing it. Frontier-vs-fast differences matter less here than cost, speed, and a good prompt.

## Options (list prices, Oct 2026, USD per 1M tokens)
| Model | Input / Output | Notes | Rough cost per critique* |
|---|---|---|---|
| **Gemini 3.8 Flash** (`gemini-3.8-flash`) | $0.75 / $3.75 (doubles Jan 1 2027) | Stable, current Flash, strong multimodal; **free tier in Google AI Studio** | ~$0.001–0.002 (free tier: $0) |
| Gemini 3.5 Flash-Lite | $0.30 / $2.50 | Cheapest Gemini, weaker reasoning | <$0.001 |
| Claude Sonnet 5.5 (`claude-sonnet-5-5`) | $2 / $10 | Very good at structured, kind, specific written critique; slower | ~$0.004 |
| Claude Haiku 5.5 (`claude-haiku-5-5`) | $0.10 / $0.50 | Released Oct 7 2026, fastest Claude; aimed at classification/routing | <$0.001 |
| GPT-5.4 mini (`gpt-5.4-mini`) | $0.75 / $4.50 | GPT family led layout tasks in GDB | ~$0.002 |
| GPT-5.4 / Gemini 3.1 Pro / Opus | $2–5 / $10–25 | Frontier; overkill for a 1-paragraph sketch critique | $0.005–0.02 |
*≈1,000–1,500 image+prompt tokens in, ~200 out.

Sources: https://ai.google.dev/gemini-api/docs/pricing · https://ai.google.dev/gemini-api/docs/models ·
https://platform.claude.com/docs/en/about-claude/pricing · https://www.anthropic.com/claude-haiku-5-5 ·
https://developers.openai.com/api/docs/pricing

## Recommendation
**Gemini 3.8 Flash** via the Gemini API.
- Free tier means a student project can run with $0 and a key from https://aistudio.google.com/apikey.
- Fast "Flash" latency (a few seconds), native JSON output mode, strong image understanding.
- Quality is good enough for focus-skill-level feedback; the benchmarks show no frontier model is clearly better at design critique.
- Caveat: the free tier may use prompts to improve Google products; fine for class work, switch to paid for private client work.

**Runner-up:** Claude Sonnet 5.5 if the written tone/specificity of critiques matters more than cost (≈$4 per 1,000 critiques).

## How it's wired
`/api/critique` (Vercel function) uses whichever env var is set, in this order:
`GEMINI_API_KEY` → Gemini 3.8 Flash · `ANTHROPIC_API_KEY` → Claude Sonnet 5.5 · `OPENAI_API_KEY` → GPT-5.4 mini.
Optional `CRITIQUE_MODEL` overrides the model id. With no key set, the endpoint returns 503 `not_configured` and the app says
"AI critic isn't switched on yet" without breaking the flow. `GET /api/critique` reports whether it's configured.
