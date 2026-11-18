import { bytesToBase64, base64ToBytes } from './pqc';

const HKDF_SALT = new TextEncoder().encode('QuantumChat-Salt-v1');
const HKDF_INFO = new TextEncoder().encode('QuantumChat-AES256GCM-SessionKey');

// In-memory session key cache keyed by conversationId / recipientId
const sessionKeyCache = new Map();

/**
 * Derives a 256-bit AES-GCM CryptoKey from the ML-KEM shared secret using HKDF-SHA-256
 */
export async function deriveAesKeyFromSecret(sharedSecretBytes) {
  // 1. Import raw shared secret into WebCrypto HKDF key
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    sharedSecretBytes,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  // 2. Derive 256-bit AES-GCM key
  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: HKDF_SALT,
      info: HKDF_INFO,
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return derivedKey;
}

/**
 * Encrypts plaintext string using AES-256-GCM with a 96-bit CSPRNG Nonce (IV)
 */
export async function encryptMessage(plaintext, aesCryptoKey, aadString = '') {
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);

  // 96-bit (12-byte) initialization vector per NIST SP 800-38D
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const aad = encoder.encode(aadString);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      additionalData: aad,
      tagLength: 128, // 128-bit authentication tag
    },
    aesCryptoKey,
    plaintextBytes
  );

  return {
    ciphertext: bytesToBase64(new Uint8Array(encryptedBuffer)),
    nonce: bytesToBase64(iv),
  };
}

/**
 * Decrypts AES-256-GCM ciphertext using the derived CryptoKey and Nonce
 * Verifies the 128-bit authentication tag before returning plaintext.
 */
export async function decryptMessage(ciphertextBase64, nonceBase64, aesCryptoKey, aadString = '') {
  const ciphertextBytes = base64ToBytes(ciphertextBase64);
  const ivBytes = base64ToBytes(nonceBase64);
  const aad = new TextEncoder().encode(aadString);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes,
        additionalData: aad,
        tagLength: 128,
      },
      aesCryptoKey,
      ciphertextBytes
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption failed / Tag authentication error:', error);
    throw new Error('Integrity verification failed: Message has been tampered with or key is invalid.');
  }
}

/**
 * Session Key Cache Management
 */
export function cacheSessionKey(conversationId, cryptoKey) {
  sessionKeyCache.set(conversationId, cryptoKey);
}

export function getCachedSessionKey(conversationId) {
  return sessionKeyCache.get(conversationId);
}

export function clearSessionKey(conversationId) {
  sessionKeyCache.delete(conversationId);
}
