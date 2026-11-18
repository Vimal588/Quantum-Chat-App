import { ml_kem768 } from '@noble/post-quantum/ml-kem.js';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';

// Convert Uint8Array to Base64 string
export function bytesToBase64(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 string to Uint8Array
export function base64ToBytes(base64) {
  const binary = window.atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Convert Uint8Array to Hex string
export function bytesToHex(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/**
 * Computes a standard 64-character SHA-256 hex fingerprint of a key
 */
export async function computeFingerprint(keyBase64) {
  if (!keyBase64) return '';
  const keyBytes = base64ToBytes(keyBase64.trim());
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', keyBytes);
  return bytesToHex(new Uint8Array(hashBuffer));
}

/**
 * Formats fingerprint into user-friendly safety blocks
 * e.g., "A1B2 C3D4 E5F6 ..."
 */
export function formatSafetyNumber(fingerprint) {
  if (!fingerprint) return '';
  return fingerprint.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * Generates both ML-KEM-768 and ML-DSA-65 post-quantum key pairs
 */
export function generatePostQuantumKeyPairs() {
  // ML-KEM-768 (FIPS 203)
  const kemKeys = ml_kem768.keygen();
  // ML-DSA-65 (FIPS 204)
  const dsaKeys = ml_dsa65.keygen();

  return {
    kem: {
      publicKey: bytesToBase64(kemKeys.publicKey),
      privateKey: kemKeys.secretKey, // Uint8Array stored locally in IndexedDB
      rawPublicKey: kemKeys.publicKey,
    },
    dsa: {
      publicKey: bytesToBase64(dsaKeys.publicKey),
      privateKey: dsaKeys.secretKey, // Uint8Array stored locally in IndexedDB
      rawPublicKey: dsaKeys.publicKey,
    }
  };
}

/**
 * ML-KEM-768 Encapsulation
 * Takes recipient's base64 public key (1184 bytes),
 * generates a 32-byte shared secret and 1088-byte ciphertext.
 */
export function encapsulateSharedSecret(recipientKemPublicKeyBase64) {
  const pkBytes = base64ToBytes(recipientKemPublicKeyBase64);
  const result = ml_kem768.encapsulate(pkBytes);
  return {
    sharedSecret: result.sharedSecret, // Uint8Array (32 bytes)
    kemCiphertext: bytesToBase64(result.cipherText) // Base64 (1088 bytes)
  };
}

/**
 * ML-KEM-768 Decapsulation
 * Takes KEM ciphertext base64 and our private key (Uint8Array),
 * recovers the identical 32-byte shared secret.
 */
export function decapsulateSharedSecret(kemCiphertextBase64, myKemPrivateKey) {
  const ctBytes = base64ToBytes(kemCiphertextBase64);
  let skBytes = myKemPrivateKey;
  if (!(skBytes instanceof Uint8Array)) {
    if (typeof skBytes === 'string') {
      skBytes = base64ToBytes(skBytes);
    } else if (skBytes && typeof skBytes === 'object') {
      skBytes = new Uint8Array(Object.values(skBytes));
    }
  }
  return ml_kem768.decapsulate(ctBytes, skBytes); // Uint8Array (32 bytes)
}

/**
 * ML-DSA-65 Sign
 */
export function signData(messageBytes, privateKey) {
  let skBytes = privateKey;
  if (!(skBytes instanceof Uint8Array)) {
    if (typeof skBytes === 'string') {
      skBytes = base64ToBytes(skBytes);
    } else if (skBytes && typeof skBytes === 'object') {
      skBytes = new Uint8Array(Object.values(skBytes));
    }
  }
  const sig = ml_dsa65.sign(messageBytes, skBytes);
  return bytesToBase64(sig);
}

/**
 * ML-DSA-65 Verify
 */
export function verifyDataSignature(signatureBase64, messageBytes, publicKeyBase64) {
  try {
    const sigBytes = base64ToBytes(signatureBase64);
    const pkBytes = base64ToBytes(publicKeyBase64);
    return ml_dsa65.verify(sigBytes, messageBytes, pkBytes);
  } catch (e) {
    console.error('Signature verification failed:', e);
    return false;
  }
}
