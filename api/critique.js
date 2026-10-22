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
  'Never rewrite the piece for them. Plain words, no jargon, each field one or two sentences.';

const userText = (b) => {
  const p = b.prompt || {}; const r = b.reflection || {};
  return `Practice: ${b.practice || 'poster'}\nPrompt: "${p.title || ''}"\nBrief: ${p.brief || ''}\n` +
    `Constraint: ${p.constraint || ''}\nFocus skill: ${p.focus || ''}\n\n` +
    `Designer's reflection:\n- What I tried: ${r.tried || '-'}\n- What worked: ${r.worked || '-'}\n- What I'd change: ${r.change || '-'}\n\n` +
    'Reply with strict JSON only: {"works":"one thing that works, tied to the focus skill",' +
    '"push":"one thing to push next time","constraint":"did they follow the constraint? one short sentence",' +
    '"reply":"one sentence responding to their reflection","score":integer 1-5 for the focus skill only}';
};

const parse = (text) => {
  const m = String(text || '').match(/\{[\s\S]*\}/);
  if (!m) throw new Error('Model did not return JSON');
  const j = JSON.parse(m[0]);
  return {
    works: String(j.works || ''), push: String(j.push || ''), constraint: String(j.constraint || ''),
    reply: String(j.reply || ''), score: Math.max(1, Math.min(5, Math.round(Number(j.score) || 3)))
  };
};

async function gemini(key, model, mime, data, text) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts: [{ inline_data: { mime_type: mime, data } }, { text }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.4, maxOutputTokens: 800 }
    })
  });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && j.error.message) || 'Gemini error ' + r.status);
  return ((j.candidates || [])[0]?.content?.parts || []).map((p) => p.text || '').join('');
}

async function anthropic(key, model, mime, data, text) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, max_tokens: 600, system: SYSTEM, messages: [{ role: 'user', content: [
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
    const text = await prov.call(prov.key, prov.model, m[1], m[3], userText(b));
    return res.status(200).json(Object.assign(parse(text), { provider: prov.name, model: prov.model }));
  } catch (err) {
    return res.status(502).json({ error: 'provider_error', message: String(err.message || err).slice(0, 300) });
  }
};
