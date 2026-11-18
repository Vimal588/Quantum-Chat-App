package com.quantumchat.crypto;

import org.bouncycastle.crypto.digests.SHA256Digest;
import org.bouncycastle.crypto.generators.HKDFBytesGenerator;
import org.bouncycastle.crypto.params.HKDFParameters;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import javax.crypto.AEADBadTagException;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

public class SymmetricCryptoTest {

    private static final int GCM_TAG_LENGTH = 128; // bits
    private static final int GCM_IV_LENGTH = 12;   // 96 bits per NIST SP 800-38D
    private static final int AES_KEY_SIZE = 32;    // 256 bits

    @Test
    @DisplayName("HKDF-SHA-256 Key Derivation and AES-256-GCM Roundtrip")
    public void testHkdfAndAesGcmRoundtrip() throws Exception {
        SecureRandom random = new SecureRandom();

        // 1. Simulate 32-byte shared secret from ML-KEM-768
        byte[] sharedSecret = new byte[32];
        random.nextBytes(sharedSecret);

        // 2. Derive 256-bit AES encryption key using HKDF-SHA-256
        byte[] salt = "QuantumChat-Salt-v1".getBytes(StandardCharsets.UTF_8);
        byte[] info = "QuantumChat-AES256GCM-SessionKey".getBytes(StandardCharsets.UTF_8);

        HKDFBytesGenerator hkdf = new HKDFBytesGenerator(new SHA256Digest());
        hkdf.init(new HKDFParameters(sharedSecret, salt, info));
        byte[] derivedKey = new byte[AES_KEY_SIZE];
        hkdf.generateBytes(derivedKey, 0, derivedKey.length);

        assertEquals(32, derivedKey.length, "Derived key must be exactly 256 bits (32 bytes)");

        // 3. Encrypt Plaintext using AES-256-GCM
        String originalMessage = "Top Secret Post-Quantum Message 2026!";
        byte[] plaintextBytes = originalMessage.getBytes(StandardCharsets.UTF_8);

        byte[] iv = new byte[GCM_IV_LENGTH];
        random.nextBytes(iv);

        SecretKey secretKey = new SecretKeySpec(derivedKey, "AES");
        Cipher encryptCipher = Cipher.getInstance("AES/GCM/NoPadding");
        encryptCipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));

        byte[] aad = "sender=Alice;recipient=Bob;conv=123".getBytes(StandardCharsets.UTF_8);
        encryptCipher.updateAAD(aad);

        byte[] ciphertextWithTag = encryptCipher.doFinal(plaintextBytes);
        assertNotNull(ciphertextWithTag);
        assertEquals(plaintextBytes.length + 16, ciphertextWithTag.length, "Ciphertext includes 16-byte authentication tag");

        // 4. Decrypt Plaintext using Recipient's derived key
        Cipher decryptCipher = Cipher.getInstance("AES/GCM/NoPadding");
        decryptCipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
        decryptCipher.updateAAD(aad);

        byte[] decryptedBytes = decryptCipher.doFinal(ciphertextWithTag);
        String decryptedMessage = new String(decryptedBytes, StandardCharsets.UTF_8);

        assertEquals(originalMessage, decryptedMessage, "Decrypted message must match original plaintext exactly");
    }

    @Test
    @DisplayName("AES-256-GCM Tampering Test: Modified ciphertext MUST fail authentication")
    public void testAesGcmTamperingFails() throws Exception {
        SecureRandom random = new SecureRandom();
        byte[] keyBytes = new byte[AES_KEY_SIZE];
        byte[] iv = new byte[GCM_IV_LENGTH];
        random.nextBytes(keyBytes);
        random.nextBytes(iv);

        SecretKey key = new SecretKeySpec(keyBytes, "AES");
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH, iv));

        byte[] ciphertext = cipher.doFinal("Uncorrupted data".getBytes(StandardCharsets.UTF_8));

        // Intentionally tamper with 1 bit of ciphertext
        ciphertext[0] ^= 0x01;

        Cipher decryptCipher = Cipher.getInstance("AES/GCM/NoPadding");
        decryptCipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH, iv));

        assertThrows(AEADBadTagException.class, () -> {
            decryptCipher.doFinal(ciphertext);
        }, "Tampered ciphertext must throw AEADBadTagException");
    }
}
