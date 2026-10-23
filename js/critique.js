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
    const status = (t) => window.dispatchEvent(new CustomEvent('critique-status', { detail: t }));
    let r, j = {};
    for (let a = 0; a < 4; a++) { // first try + up to 3 retries on busy/timeout
      if (a) { status('Busy — retrying…'); await new Promise((ok) => setTimeout(ok, 2500 * a)); }
      try { r = await fetch('/api/critique', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ image, prompt, practice, reflection }) }); }
      catch (e) { r = null; j = {}; continue; }
      j = {}; try { j = await r.json(); } catch (e) {}
      if (r.status === 404 || j.error === 'not_configured') throw new NotConfigured('The AI critic isn’t switched on yet.');
      if (r.ok || ![429, 500, 502, 503, 504].includes(r.status)) break;
    }
    status('');
    if (!r) throw new Error('Can’t reach the critic.');
    if (!r.ok) throw new Error([429, 500, 502, 503, 504].includes(r.status) ? 'The critic is busy.' : (j.message || 'Feedback failed.'));
    return { works: j.works, push: j.push, constraint: j.constraint, reply: j.reply, score: j.score, model: j.model, notes: j.notes || [], redesign: j.redesign || null };
  };
})();
