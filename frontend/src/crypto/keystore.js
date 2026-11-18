/**
 * Client-Side Keystore using Browser IndexedDB.
 * Securely persists private cryptographic keys locally on the user's device.
 * Private decryption keys NEVER leave the device and are NEVER transmitted to the server.
 */

const DB_NAME = 'QuantumChatKeystore';
const DB_VERSION = 1;
const STORE_NAME = 'postQuantumKeys';

function openKeystoreDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

export async function saveIdentityKeys(userId, keyData) {
  const db = await openKeystoreDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const record = {
      id: userId,
      ...keyData,
      updatedAt: new Date().toISOString()
    };
    const req = store.put(record);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function getIdentityKeys(userId) {
  const db = await openKeystoreDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(userId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function clearIdentityKeys(userId) {
  const db = await openKeystoreDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(userId);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}
