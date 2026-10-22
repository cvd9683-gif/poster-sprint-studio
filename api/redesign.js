// POST /api/redesign: optional AI image edit of the poster (Gemini image model).
// Returns {available:false} when the model/quota isn't available, so the app shows its own overlay mockup.
module.exports = async (req, res) => {
  res.setHeader('cache-control', 'no-store');
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.REDESIGN_MODEL || 'gemini-3.1-flash-image';
  if (req.method !== 'POST' || !key) return res.status(200).json({ available: false, reason: 'not_configured' });
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const m = /^data:(image\/(png|jpeg|webp));base64,(.+)$/.exec(b.image || '');
    if (!m) return res.status(400).json({ available: false, reason: 'bad_image' });
    const moves = (b.moves || []).map((x) => '- ' + x.action).join('\n');
    const prompt = 'Edit this design. Keep the same words, layout idea, style, and palette, but apply these changes:\n' + moves + '\n' + (b.summary || '') + '\nReturn only the edited image at the same aspect ratio.';
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ contents: [{ parts: [{ inline_data: { mime_type: m[1], data: m[3] } }, { text: prompt }] }], generationConfig: { responseModalities: ['IMAGE', 'TEXT'] } })
    });
    const j = await r.json();
    if (!r.ok) return res.status(200).json({ available: false, reason: r.status === 429 ? 'quota' : 'error', message: String((j.error && j.error.message) || '').slice(0, 200) });
    const part = ((j.candidates || [])[0]?.content?.parts || []).find((p) => p.inlineData || p.inline_data);
    if (!part) return res.status(200).json({ available: false, reason: 'no_image' });
    const d = part.inlineData || part.inline_data;
    return res.status(200).json({ available: true, image: `data:${d.mimeType || d.mime_type};base64,${d.data}`, model });
  } catch (e) { return res.status(200).json({ available: false, reason: 'error', message: String(e.message).slice(0, 200) }); }
};
