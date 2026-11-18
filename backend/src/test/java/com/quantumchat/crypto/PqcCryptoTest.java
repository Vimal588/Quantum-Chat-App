package com.quantumchat.crypto;

import org.bouncycastle.crypto.AsymmetricCipherKeyPair;
import org.bouncycastle.crypto.SecretWithEncapsulation;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.pqc.crypto.mlkem.*;
import org.bouncycastle.pqc.crypto.mldsa.*;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.security.SecureRandom;
import java.security.Security;
import java.util.Arrays;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

public class PqcCryptoTest {

    @BeforeAll
    public static void setup() {
        if (Security.getProvider("BC") == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    @Test
    @DisplayName("ML-KEM-768 Key Generation, Encapsulation, and Decapsulation Test (FIPS 203)")
    public void testMlkem768KeyEncapsulation() {
        SecureRandom random = new SecureRandom();

        // 1. Generate ML-KEM-768 Key Pair
        MLKEMKeyPairGenerator keyGen = new MLKEMKeyPairGenerator();
        keyGen.init(new MLKEMKeyGenerationParameters(random, MLKEMParameters.ml_kem_768));
        AsymmetricCipherKeyPair keyPair = keyGen.generateKeyPair();

        MLKEMPublicKeyParameters publicKey = (MLKEMPublicKeyParameters) keyPair.getPublic();
        MLKEMPrivateKeyParameters privateKey = (MLKEMPrivateKeyParameters) keyPair.getPrivate();

        byte[] pkEncoded = publicKey.getEncoded();
        byte[] skEncoded = privateKey.getEncoded();

        assertNotNull(pkEncoded);
        assertEquals(1184, pkEncoded.length, "ML-KEM-768 public key must be exactly 1184 bytes per FIPS 203");

        // 2. Sender encapsulates to generate shared secret and KEM ciphertext
        MLKEMGenerator generator = new MLKEMGenerator(random);
        SecretWithEncapsulation senderSecretWithEncaps = generator.generateEncapsulated(publicKey);

        byte[] senderSharedSecret = senderSecretWithEncaps.getSecret();
        byte[] kemCiphertext = senderSecretWithEncaps.getEncapsulation();

        assertNotNull(senderSharedSecret);
        assertEquals(32, senderSharedSecret.length, "Shared secret must be 32 bytes (256 bits)");
        assertEquals(1088, kemCiphertext.length, "ML-KEM-768 ciphertext must be exactly 1088 bytes per FIPS 203");

        // 3. Recipient decapsulates using private key to recover shared secret
        MLKEMExtractor extractor = new MLKEMExtractor(privateKey);
        byte[] recipientSharedSecret = extractor.extractSecret(kemCiphertext);

        assertArrayEquals(senderSharedSecret, recipientSharedSecret,
                "Recipient decapsulated secret must match Sender encapsulated secret exactly");
    }

    @Test
    @DisplayName("ML-DSA-65 Key Generation, Signing, and Verification Test (FIPS 204)")
    public void testMldsa65SignAndVerify() throws Exception {
        SecureRandom random = new SecureRandom();

        // 1. Generate ML-DSA-65 Key Pair
        MLDSAKeyPairGenerator keyGen = new MLDSAKeyPairGenerator();
        keyGen.init(new MLDSAKeyGenerationParameters(random, MLDSAParameters.ml_dsa_65));
        AsymmetricCipherKeyPair keyPair = keyGen.generateKeyPair();

        MLDSAPublicKeyParameters publicKey = (MLDSAPublicKeyParameters) keyPair.getPublic();
        MLDSAPrivateKeyParameters privateKey = (MLDSAPrivateKeyParameters) keyPair.getPrivate();

        byte[] message = "QuantumResistantMessagePayload2026".getBytes();

        // 2. Sign message using private key
        MLDSASigner signer = new MLDSASigner();
        signer.init(true, privateKey);
        signer.update(message, 0, message.length);
        byte[] signature = signer.generateSignature();

        assertNotNull(signature);
        assertEquals(3309, signature.length, "ML-DSA-65 signature must be 3309 bytes per FIPS 204");

        // 3. Verify signature using public key
        MLDSASigner verifier = new MLDSASigner();
        verifier.init(false, publicKey);
        verifier.update(message, 0, message.length);
        boolean isValid = verifier.verifySignature(signature);

        assertTrue(isValid, "ML-DSA-65 signature verification must succeed for untampered message");

        // 4. Verify tampering fails
        byte[] tamperedMessage = "TamperedQuantumResistantMessagePayload2026".getBytes();
        verifier.init(false, publicKey);
        verifier.update(tamperedMessage, 0, tamperedMessage.length);
        boolean isTamperedValid = verifier.verifySignature(signature);

        assertFalse(isTamperedValid, "ML-DSA-65 signature verification must fail for tampered message");
    }
}
