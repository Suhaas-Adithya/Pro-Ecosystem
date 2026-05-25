const DB_NAME = 'ProMailCryptoDB';
const DB_VERSION = 1;
const STORE_NAME = 'keys';

// IndexedDB Wrapper
function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME);
    };
  });
}

export async function storePrivateKey(uid, privateKey) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(privateKey, `privateKey_${uid}`);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getPrivateKey(uid) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(`privateKey_${uid}`);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// WebCrypto Generation
export async function generateKeyPair(uid) {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  await storePrivateKey(uid, keyPair.privateKey);
  const jwkPublic = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
  return JSON.stringify(jwkPublic);
}

// Encrypt string with Public Key
export async function encryptPayload(text, recipientPublicKeyJwkStr, senderPublicKeyJwkStr = null) {
  // 1. Generate AES-GCM Key
  const aesKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // 2. Encrypt Text
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedBuf = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    aesKey,
    enc.encode(text)
  );

  // 3. Export AES Key
  const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);

  // 4. Encrypt AES Key with Recipient RSA Public Key
  const recipientJwk = JSON.parse(recipientPublicKeyJwkStr);
  const recipientPubKey = await window.crypto.subtle.importKey(
    "jwk",
    recipientJwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
  const encKeyForRecipient = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    recipientPubKey,
    rawAesKey
  );

  // 5. Encrypt AES Key with Sender RSA Public Key (if provided)
  let encKeyForSender = null;
  if (senderPublicKeyJwkStr) {
    const senderJwk = JSON.parse(senderPublicKeyJwkStr);
    const senderPubKey = await window.crypto.subtle.importKey(
      "jwk",
      senderJwk,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["encrypt"]
    );
    encKeyForSender = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      senderPubKey,
      rawAesKey
    );
  }

  return {
    iv: Array.from(iv),
    payload: Array.from(new Uint8Array(encryptedBuf)),
    encKeyForRecipient: Array.from(new Uint8Array(encKeyForRecipient)),
    encKeyForSender: encKeyForSender ? Array.from(new Uint8Array(encKeyForSender)) : null
  };
}

export async function decryptPayload(uid, encryptedData, isSender = false) {
  const privateKey = await getPrivateKey(uid);
  if (!privateKey) throw new Error("Private key not found on this device.");

  const encryptedAesKeyArray = isSender ? encryptedData.encKeyForSender : encryptedData.encKeyForRecipient;
  if (!encryptedAesKeyArray) throw new Error("Missing encrypted AES key for this role.");

  const encryptedAesKey = new Uint8Array(encryptedAesKeyArray);

  // 1. Decrypt AES Key using RSA Private Key
  const rawAesKey = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedAesKey
  );

  const aesKey = await window.crypto.subtle.importKey(
    "raw",
    rawAesKey,
    { name: "AES-GCM" },
    true,
    ["decrypt"]
  );

  // 2. Decrypt Payload using AES Key
  const iv = new Uint8Array(encryptedData.iv);
  const payloadBuf = new Uint8Array(encryptedData.payload);

  const decryptedBuf = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    aesKey,
    payloadBuf
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuf);
}
