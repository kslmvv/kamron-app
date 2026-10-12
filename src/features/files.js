/** Вложения семинаров в IndexedDB этого браузера. */
import { toast } from '../core/toast.js';
import { uid } from '../core/utils.js';

export function openFileDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('no-indexeddb'));
      return;
    }
    const request = indexedDB.open('kamron-app-files', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('materials');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function fileTransaction(mode, callback) {
  const db = await openFileDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('materials', mode),
        store = tx.objectStore('materials');
      let result;
      try {
        result = callback(store);
      } catch (error) {
        reject(error);
        return;
      }
      tx.oncomplete = () => resolve(result?.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export const putPrepFile = (id, file) => fileTransaction('readwrite', store => store.put(file, id));

export const getPrepFile = id => fileTransaction('readonly', store => store.get(id));

export const deletePrepFile = id => fileTransaction('readwrite', store => store.delete(id));

export async function attachPrepFiles(prep, files) {
  const selected = files.filter(f => f && f.size > 0);
  if (!selected.length) return true;
  if ((prep.attachments || []).length + selected.length > 10) {
    toast('Максимум 10 файлов в одной теме');
    return false;
  }
  if (selected.some(f => f.size > 15 * 1024 * 1024)) {
    toast('Один из файлов больше 15 МБ');
    return false;
  }
  const added = [];
  try {
    for (const file of selected) {
      const id = uid();
      await putPrepFile(id, file);
      added.push({ id, name: file.name.slice(0, 160), type: file.type || '', size: file.size });
    }
    prep.attachments = [...(prep.attachments || []), ...added];
    return true;
  } catch (error) {
    for (const entry of added) await deletePrepFile(entry.id).catch(() => {});
    toast('Не удалось сохранить файл. Проверьте память браузера.');
    return false;
  }
}
