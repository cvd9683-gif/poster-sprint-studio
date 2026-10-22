/* IndexedDB wrapper: stores 'pieces' and 'refs'. */
(() => {
  let dbp = null;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('posterSprintStudio', 1);
    r.onupgradeneeded = () => {
      const db = r.result;
      db.createObjectStore('pieces', { keyPath: 'id' });
      db.createObjectStore('refs', { keyPath: 'id' });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
  const tx = async (store, mode, fn) => {
    const db = await open();
    return new Promise((res, rej) => {
      const t = db.transaction(store, mode);
      const req = fn(t.objectStore(store));
      t.oncomplete = () => res(req && req.result);
      t.onerror = () => rej(t.error);
    });
  };
  window.DB = {
    all: (s) => tx(s, 'readonly', (o) => o.getAll()),
    put: (s, v) => tx(s, 'readwrite', (o) => o.put(v)),
    del: (s, id) => tx(s, 'readwrite', (o) => o.delete(id)),
    clear: (s) => tx(s, 'readwrite', (o) => o.clear())
  };
})();
