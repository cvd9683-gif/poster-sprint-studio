// Vercel serverless function: POST /api/critique
// Picks a provider from whichever key is set in the project's environment variables:
//   GEMINI_API_KEY (recommended) -> Gemini 3.8 Flash
//   ANTHROPIC_API_KEY            -> Claude Sonnet 5.5
//   OPENAI_API_KEY               -> GPT-5.4 mini
// Optional: CRITIQUE_MODEL overrides the model id. No key is stored in this repo.

const SYSTEM = 'You are a warm but honest design critic for a student doing a short daily practice sprint. ' +
  'You are looking at a finished piece made in 10 to 20 minutes, so judge it as a sketch, not a portfolio piece. ' +
  'The designer has already written their own reflection. Respond to it: agree, or gently point out what they missed. ' +
  'Judge ONLY the focus skill and whether the constraint was followed. Be specific about what you can see (positions, sizes, colors, words). ' +
  'Plain words, no jargon, each field one or two sentences.';

const userText = (b) => {
  const p = b.prompt || {}; const r = b.reflection || {};
  return `Practice: ${b.practice || 'poster'}\nTopic: "${p.title || ''}"\nBrief: ${p.brief || ''}\n` +
    `Constraint: ${p.constraint || ''}\nFocus skill: ${p.skill || p.focus || ''}\nScenario (client/context): ${p.scenario || ''}${p.context ? ' — ' + p.context : ''}\nTeach this skill as it applies to this scenario: notes, fixes and redesign should target the focus skill for this kind of client.\n\n` +
    `Designer's reflection:\n- What I tried: ${r.tried || '-'}\n- What I'd change: ${r.change || '-'}\n\n` +
    'Teach, do not just grade. Point at 2 to 4 specific regions of the image. Reply with strict JSON only:\n' +
    '{"reply":"one sentence responding to their reflection",' +
    '"notes":[{"box":[ymin,xmin,ymax,xmax] integers 0-1000 tightly around the region,"kind":"strength" or "fix","title":"2-5 words","note":"what is happening there, one sentence","fix":"one concrete move, e.g. sizes, colors, positions (empty for strengths)"}],' +
    '"redesign":{"summary":"one sentence describing the improved version","moves":[{"box":[ymin,xmin,ymax,xmax] 0-1000 region to change,"action":"short imperative, e.g. Scale date to 2x","color":"#hex suggested color or empty"}]},' +
    '"works":"one sentence","push":"one sentence","constraint":"one short sentence","score":integer 1-5 for the focus skill only}';
};

const clamp01 = (n) => Math.max(0, Math.min(1, Number(n) / 1000 || 0));
const box = (b) => { if (!Array.isArray(b) || b.length < 4) return null; const [y0, x0, y1, x1] = b.map(clamp01); const x = Math.min(x0, x1), y = Math.min(y0, y1); return { x, y, w: Math.max(.04, Math.abs(x1 - x0)), h: Math.max(.04, Math.abs(y1 - y0)) }; };
const parse = (text) => {
  const m = String(text || '').match(/\{[\s\S]*\}/);
  if (!m) throw new Error('Model did not return JSON');
  const j = JSON.parse(m[0]);
  const notes = (Array.isArray(j.notes) ? j.notes : []).map((n) => ({ box: box(n.box), kind: n.kind === 'strength' ? 'strength' : 'fix', title: String(n.title || ''), note: String(n.note || ''), fix: String(n.fix || '') })).filter((n) => n.box).slice(0, 4);
  const rd = j.redesign || {};
  const moves = (Array.isArray(rd.moves) ? rd.moves : []).map((mv) => ({ box: box(mv.box), action: String(mv.action || ''), color: /^#[0-9a-f]{3,8}$/i.test(mv.color || '') ? mv.color : '' })).filter((mv) => mv.box).slice(0, 5);
  return {
    works: String(j.works || ''), push: String(j.push || ''), constraint: String(j.constraint || ''),
    reply: String(j.reply || ''), score: Math.max(1, Math.min(5, Math.round(Number(j.score) || 3))),
    notes, redesign: { summary: String(rd.summary || ''), moves }
  };
};

async function gemini(key, model, mime, data, text) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key }, signal: AbortSignal.timeout(20000),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts: [{ inline_data: { mime_type: mime, data } }, { text }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.4, maxOutputTokens: 8192, thinkingConfig: { thinkingLevel: 'low' } }
    })
  });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && j.error.message) || 'Gemini error ' + r.status);
  return ((j.candidates || [])[0]?.content?.parts || []).map((p) => p.text || '').join('');
}

async function anthropic(key, model, mime, data, text) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, max_tokens: 1500, system: SYSTEM, messages: [{ role: 'user', content: [
      { type: 'image', source: { type: 'base64', media_type: mime, data } }, { type: 'text', text }] }] })
  });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && j.error.message) || 'Anthropic error ' + r.status);
  return (j.content || []).map((c) => c.text || '').join('');
}

async function openai(key, model, mime, data, text) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
    body: JSON.stringify({ model, response_format: { type: 'json_object' }, messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: [{ type: 'text', text }, { type: 'image_url', image_url: { url: `data:${mime};base64,${data}` } }] }] })
  });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && j.error.message) || 'OpenAI error ' + r.status);
  return j.choices?.[0]?.message?.content || '';
}

const pickProvider = () => {
  const e = process.env; const m = e.CRITIQUE_MODEL;
  if (e.GEMINI_API_KEY) return { name: 'gemini', key: e.GEMINI_API_KEY, model: m || 'gemini-3.8-flash', call: gemini };
  if (e.ANTHROPIC_API_KEY) return { name: 'anthropic', key: e.ANTHROPIC_API_KEY, model: m || 'claude-sonnet-5-5', call: anthropic };
  if (e.OPENAI_API_KEY) return { name: 'openai', key: e.OPENAI_API_KEY, model: m || 'gpt-5.4-mini', call: openai };
  return null;
};

module.exports = async (req, res) => {
  res.setHeader('cache-control', 'no-store');
  const prov = pickProvider();
  if (req.method === 'GET') return res.status(200).json({ configured: !!prov, provider: prov ? prov.name : null, model: prov ? prov.model : null });
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  if (!prov) return res.status(503).json({ error: 'not_configured', message: 'AI feedback is not switched on yet. Add GEMINI_API_KEY in Vercel project settings.' });
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const m = /^data:(image\/(png|jpeg|webp|gif));base64,(.+)$/.exec(b.image || '');
    if (!m) return res.status(400).json({ error: 'bad_image', message: 'Send a PNG, JPG, WebP, or GIF image.' });
    if (m[3].length > 4_000_000) return res.status(413).json({ error: 'too_large', message: 'Image is too large.' });
    // Gemini: fall back through other Flash models when one is overloaded.
    const models = prov.name === 'gemini' ? [prov.model, 'gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.5-flash'] : [prov.model];
    let lastErr;
    for (const model of models) {
      try {
        const text = await prov.call(prov.key, model, m[1], m[3], userText(b));
        return res.status(200).json(Object.assign(parse(text), { provider: prov.name, model }));
      } catch (e) { lastErr = e; console.error(model, e.message); }
    }
    throw lastErr;
  } catch (err) {
    return res.status(502).json({ error: 'provider_error', message: String(err.message || err).slice(0, 300) });
  }
};
