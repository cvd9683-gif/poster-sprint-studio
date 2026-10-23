// POST {id, type, data(base64)} with Authorization: Bearer <Firebase ID token>
// Verifies the token with Identity Toolkit, stores the image in Vercel Blob at users/{uid}/pieces/{id}, returns {url}.
const API_KEY = 'AIzaSyCYQnr-isHC3-hRoWDDy91btXiFPwTaV0Q'; // public Firebase web key

async function uidOf(idToken) {
  const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + API_KEY, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Referer: 'https://poster-sprint-studio.vercel.app/' }, body: JSON.stringify({ idToken })
  });
  if (!r.ok) return null;
  const j = await r.json(); return (j.users && j.users[0] && j.users[0].localId) || null;
}

async function blobPut(pathname, buf, type) {
  const h = { authorization: 'Bearer ' + process.env.BLOB_READ_WRITE_TOKEN, 'x-api-version': '11', 'x-content-type': type, 'x-add-random-suffix': '0', 'x-allow-overwrite': '1', 'x-cache-control-max-age': '31536000' };
  let r = await fetch('https://blob.vercel-storage.com/?pathname=' + encodeURIComponent(pathname), { method: 'PUT', headers: h, body: buf });
  if (!r.ok) r = await fetch('https://blob.vercel-storage.com/' + pathname, { method: 'PUT', headers: { ...h, 'x-api-version': '7' }, body: buf });
  if (!r.ok) throw new Error('blob ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return (await r.json()).url;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const tok = String(req.headers.authorization || '').replace(/^Bearer /, '');
    const uid = tok && (await uidOf(tok));
    if (!uid) return res.status(401).json({ error: 'auth' });
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const id = String(b.id || '').replace(/[^\w.-]/g, '').slice(0, 80);
    const type = /^image\/(png|jpeg|webp|gif)$/.test(b.type) ? b.type : 'image/jpeg';
    const buf = Buffer.from(String(b.data || ''), 'base64');
    if (!id || !buf.length) return res.status(400).json({ error: 'bad' });
    if (buf.length > 3.5 * 1024 * 1024) return res.status(413).json({ error: 'too big' });
    const url = await blobPut(`users/${uid}/pieces/${id}.${type.split('/')[1]}`, buf, type);
    res.status(200).json({ url });
  } catch (e) { res.status(500).json({ error: String(e.message || e).slice(0, 300) }); }
};
