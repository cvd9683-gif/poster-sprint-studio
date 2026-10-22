/* Optional AI critique. Uses the user's own key from Settings; nothing is hardcoded. */
(() => {
  const blobToB64 = (blob) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });

  const instructions = (p) =>
    `You are a concise, encouraging design critic for a student's daily practice piece.\n` +
    `Prompt: "${p.title}". Brief: ${p.brief}\nConstraint: ${p.constraint}\nFocus skill: ${p.focus}\n` +
    `Judge ONLY the focus skill. Reply with strict JSON and nothing else: ` +
    `{"works":"one sentence on one thing that works","push":"one sentence on one thing to push next time","score":1-5 integer for the focus skill only}`;

  const parse = (text) => {
    const m = String(text).match(/\{[\s\S]*\}/);
    if (!m) throw new Error('The model did not return JSON.');
    const j = JSON.parse(m[0]);
    const score = Math.max(1, Math.min(5, Math.round(Number(j.score) || 0)));
    return { works: String(j.works || ''), push: String(j.push || ''), score };
  };

  window.critique = async ({ blob, mime, prompt, settings }) => {
    if (!settings.key) throw new Error('No API key. Add one in Settings to get AI feedback.');
    if (!blob || !/^image\/(png|jpeg|gif|webp)$/.test(mime)) throw new Error('AI feedback works on PNG, JPG, GIF, or WebP images. For video, upload a still frame.');
    const data = await blobToB64(blob);
    const text = instructions(prompt);
    if (settings.provider === 'anthropic') {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': settings.key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: settings.model || 'claude-sonnet-4-5',
          max_tokens: 400,
          messages: [{ role: 'user', content: [
            { type: 'image', source: { type: 'base64', media_type: mime, data } },
            { type: 'text', text }
          ] }]
        })
      });
      const j = await r.json();
      if (!r.ok) throw new Error((j.error && j.error.message) || 'Request failed (' + r.status + ')');
      return parse(j.content.map((c) => c.text || '').join(''));
    }
    const model = settings.model || 'gemini-2.5-flash';
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': settings.key },
      body: JSON.stringify({ contents: [{ parts: [{ inline_data: { mime_type: mime, data } }, { text }] }] })
    });
    const j = await r.json();
    if (!r.ok) throw new Error((j.error && j.error.message) || 'Request failed (' + r.status + ')');
    return parse(((j.candidates || [])[0]?.content?.parts || []).map((p) => p.text || '').join(''));
  };
})();
