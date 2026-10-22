/* AI critique via our own serverless function (/api/critique). No user keys. */
(() => {
  // Downscale to a JPEG data URL so uploads stay small and fast.
  const toSmallDataURL = (blob, max = 1280) => new Promise((res, rej) => {
    const img = new Image(); const url = URL.createObjectURL(blob);
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.86));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Could not read the image.')); };
    img.src = url;
  });

  class NotConfigured extends Error {}
  window.CritiqueNotConfigured = NotConfigured;

  window.critique = async ({ blob, prompt, practice, reflection }) => {
    if (location.protocol === 'file:') throw new NotConfigured('The AI critic runs on the hosted site.');
    const image = await toSmallDataURL(blob);
    let r;
    try {
      r = await fetch('/api/critique', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ image, prompt, practice, reflection }) });
    } catch (e) { throw new NotConfigured('The AI critic is offline right now.'); }
    let j = {}; try { j = await r.json(); } catch (e) {}
    if (r.status === 503 || r.status === 404 || j.error === 'not_configured') throw new NotConfigured('The AI critic isn’t switched on yet.');
    if (!r.ok) throw new Error(j.message || 'Feedback failed (' + r.status + ').');
    return { works: j.works, push: j.push, constraint: j.constraint, reply: j.reply, score: j.score, model: j.model };
  };
})();
