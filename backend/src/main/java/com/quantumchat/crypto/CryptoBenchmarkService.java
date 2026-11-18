package com.quantumchat.crypto;

import com.quantumchat.dto.AlgorithmBenchmarkResult;
import com.quantumchat.dto.BenchmarkRequest;
import com.quantumchat.dto.BenchmarkResponse;
import com.quantumchat.dto.BenchmarkSummaryDto;
import com.quantumchat.entity.BenchmarkRun;
import com.quantumchat.repository.BenchmarkRunRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bouncycastle.crypto.AsymmetricCipherKeyPair;
import org.bouncycastle.crypto.SecretWithEncapsulation;
import org.bouncycastle.crypto.digests.SHA256Digest;
import org.bouncycastle.crypto.generators.HKDFBytesGenerator;
import org.bouncycastle.crypto.params.HKDFParameters;
import org.bouncycastle.pqc.crypto.mlkem.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Cipher;
import javax.crypto.KeyAgreement;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.OAEPParameterSpec;
import javax.crypto.spec.PSource;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.MGF1ParameterSpec;
import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class CryptoBenchmarkService {

    private final BenchmarkRunRepository benchmarkRunRepository;

    private static final byte[] HKDF_SALT = "QuantumChat-Benchmark-Salt".getBytes(StandardCharsets.UTF_8);
    private static final byte[] HKDF_INFO = "QuantumChat-AES256GCM-HybridKey".getBytes(StandardCharsets.UTF_8);
    private static final int AES_KEY_BYTES = 32;
    private static final int GCM_IV_BYTES = 12;
    private static final int GCM_TAG_BITS = 128;

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Executes real, un-mocked cryptographic operations for RSA, ECC, and PQC
     * and returns precise high-resolution performance comparisons.
     */
    @Transactional
    public BenchmarkResponse runBenchmark(BenchmarkRequest request, UUID userId) {
        String plaintext = (request.getMessage() != null && !request.getMessage().trim().isEmpty())
                ? request.getMessage().trim()
                : "Hii";

        int iterations = Math.max(1, Math.min(request.getIterations(), 25));

        // Optional Warm-Up to eliminate JIT compilation skew
        if (request.isWarmup()) {
            executeWarmup(plaintext);
        }

        // Execute iterations
        AlgorithmBenchmarkResult rsaResult = benchmarkRsa(plaintext, iterations, request.isKeyReuse());
        AlgorithmBenchmarkResult eccResult = benchmarkEcc(plaintext, iterations, request.isKeyReuse());
        AlgorithmBenchmarkResult pqcResult = benchmarkPqc(plaintext, iterations, request.isKeyReuse());

        // Persist record for historical analytics
        BenchmarkRun run = BenchmarkRun.builder()
                .userId(userId)
                .messageSnippet(plaintext.length() > 60 ? plaintext.substring(0, 60) + "..." : plaintext)
                .messageSizeBytes(plaintext.getBytes(StandardCharsets.UTF_8).length)
                .iterations(iterations)
                .rsaKeygenUs(rsaResult.getKeygenTimeUs())
                .rsaEncryptUs(rsaResult.getEncryptionTimeUs())
                .rsaDecryptUs(rsaResult.getDecryptionTimeUs())
                .rsaKeySizeBytes(rsaResult.getPublicKeySizeBytes())
                .rsaCiphertextSizeBytes(rsaResult.getCiphertextSizeBytes())
                .eccKeygenUs(eccResult.getKeygenTimeUs())
                .eccEncryptUs(eccResult.getEncryptionTimeUs())
                .eccDecryptUs(eccResult.getDecryptionTimeUs())
                .eccKeySizeBytes(eccResult.getPublicKeySizeBytes())
                .eccCiphertextSizeBytes(eccResult.getCiphertextSizeBytes())
                .pqcKeygenUs(pqcResult.getKeygenTimeUs())
                .pqcEncryptUs(pqcResult.getEncryptionTimeUs())
                .pqcDecryptUs(pqcResult.getDecryptionTimeUs())
                .pqcKeySizeBytes(pqcResult.getPublicKeySizeBytes())
                .pqcCiphertextSizeBytes(pqcResult.getCiphertextSizeBytes())
                .build();
        benchmarkRunRepository.save(run);

        Map<String, String> env = new LinkedHashMap<>();
        env.put("javaVersion", System.getProperty("java.version"));
        env.put("osName", System.getProperty("os.name"));
        env.put("bouncyCastleVersion", "1.79");
        env.put("pqcStandard", "NIST FIPS 203 (Final - August 2024)");
        env.put("cryptoProvider", "Bouncy Castle / SunJCE");
        env.put("monotonicTimer", "System.nanoTime()");

        return BenchmarkResponse.builder()
                .benchmarkId(run.getId())
                .message(plaintext)
                .messageSizeBytes(plaintext.getBytes(StandardCharsets.UTF_8).length)
                .iterations(iterations)
                .warmupPerformed(request.isWarmup())
                .keyReuseMode(request.isKeyReuse())
                .timestamp(Instant.now())
                .rsa(rsaResult)
                .ecc(eccResult)
                .pqc(pqcResult)
                .environment(env)
                .build();
    }

    /**
     * 1. RSA-OAEP 2048 + AES-256-GCM Hybrid Benchmark
     */
    private AlgorithmBenchmarkResult benchmarkRsa(String plaintext, int iterations, boolean keyReuse) {
        byte[] plaintextBytes = plaintext.getBytes(StandardCharsets.UTF_8);

        double totalKeygenNs = 0;
        double totalAsymNs = 0;
        double totalSymNs = 0;
        double totalEncryptNs = 0;
        double totalDecryptNs = 0;

        int pubKeySize = 0;
        int privKeySize = 0;
        int ciphertextSize = 0;
        int encapsulatedKeySize = 0;
        boolean integrityVerified = true;
        boolean authVerified = true;

        KeyPair reusableKp = null;
        if (keyReuse) {
            try {
                KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
                kpg.initialize(2048);
                reusableKp = kpg.generateKeyPair();
            } catch (Exception e) {
                log.error("RSA init error", e);
            }
        }

        for (int i = 0; i < iterations; i++) {
            try {
                // Key Generation
                long tKey0 = System.nanoTime();
                KeyPair kp = (keyReuse && reusableKp != null) ? reusableKp : null;
                if (kp == null) {
                    KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
                    kpg.initialize(2048);
                    kp = kpg.generateKeyPair();
                }
                long tKey1 = System.nanoTime();
                if (!keyReuse || i == 0) {
                    totalKeygenNs += (tKey1 - tKey0);
                }

                pubKeySize = kp.getPublic().getEncoded().length;
                privKeySize = kp.getPrivate().getEncoded().length;

                // Encryption
                long tEnc0 = System.nanoTime();

                // Step A: Generate AES-256 key and encrypt with RSA-OAEP (SHA-256)
                long tAsym0 = System.nanoTime();
                KeyGenerator keyGen = KeyGenerator.getInstance("AES");
                keyGen.init(256);
                SecretKey aesKey = keyGen.generateKey();

                Cipher rsaCipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
                OAEPParameterSpec oaepSpec = new OAEPParameterSpec(
                        "SHA-256", "MGF1", MGF1ParameterSpec.SHA256, PSource.PSpecified.DEFAULT);
                rsaCipher.init(Cipher.ENCRYPT_MODE, kp.getPublic(), oaepSpec);
                byte[] wrappedKey = rsaCipher.doFinal(aesKey.getEncoded());
                long tAsym1 = System.nanoTime();

                encapsulatedKeySize = wrappedKey.length;

                // Step B: Encrypt payload with AES-256-GCM
                long tSym0 = System.nanoTime();
                byte[] iv = new byte[GCM_IV_BYTES];
                secureRandom.nextBytes(iv);
                Cipher gcmCipher = Cipher.getInstance("AES/GCM/NoPadding");
                gcmCipher.init(Cipher.ENCRYPT_MODE, aesKey, new GCMParameterSpec(GCM_TAG_BITS, iv));
                byte[] gcmCiphertext = gcmCipher.doFinal(plaintextBytes);
                long tSym1 = System.nanoTime();

                long tEnc1 = System.nanoTime();

                totalAsymNs += (tAsym1 - tAsym0);
                totalSymNs += (tSym1 - tSym0);
                totalEncryptNs += (tEnc1 - tEnc0);

                ciphertextSize = wrappedKey.length + iv.length + gcmCiphertext.length;

                // Decryption
                long tDec0 = System.nanoTime();
                rsaCipher.init(Cipher.DECRYPT_MODE, kp.getPrivate(), oaepSpec);
                byte[] unwrappedKeyBytes = rsaCipher.doFinal(wrappedKey);
                SecretKey decryptedAesKey = new SecretKeySpec(unwrappedKeyBytes, "AES");

                gcmCipher.init(Cipher.DECRYPT_MODE, decryptedAesKey, new GCMParameterSpec(GCM_TAG_BITS, iv));
                byte[] decryptedBytes = gcmCipher.doFinal(gcmCiphertext);
                long tDec1 = System.nanoTime();

                totalDecryptNs += (tDec1 - tDec0);

                String decryptedText = new String(decryptedBytes, StandardCharsets.UTF_8);
                if (!decryptedText.equals(plaintext)) {
                    integrityVerified = false;
                }
            } catch (Exception ex) {
                log.error("RSA benchmark iteration failed", ex);
                integrityVerified = false;
                authVerified = false;
            }
        }

        double div = keyReuse ? 1.0 : iterations;
        double avgKeygenUs = (totalKeygenNs / div) / 1000.0;
        double avgEncryptUs = (totalEncryptNs / iterations) / 1000.0;
        double avgDecryptUs = (totalDecryptNs / iterations) / 1000.0;
        double avgAsymUs = (totalAsymNs / iterations) / 1000.0;
        double avgSymUs = (totalSymNs / iterations) / 1000.0;
        double avgTotalUs = avgKeygenUs + avgEncryptUs + avgDecryptUs;

        return AlgorithmBenchmarkResult.builder()
                .algorithmName("RSA-OAEP-2048 (Hybrid)")
                .category("Classical Asymmetric")
                .standardReference("PKCS #1 v2.2 / RFC 8017")
                .securityStatus("Vulnerable to Shor's Algorithm")
                .quantumResistant(false)
                .keygenTimeUs(round(avgKeygenUs))
                .keygenTimeMs(round(avgKeygenUs / 1000.0))
                .encryptionTimeUs(round(avgEncryptUs))
                .encryptionTimeMs(round(avgEncryptUs / 1000.0))
                .decryptionTimeUs(round(avgDecryptUs))
                .decryptionTimeMs(round(avgDecryptUs / 1000.0))
                .asymmetricOpTimeUs(round(avgAsymUs))
                .symmetricOpTimeUs(round(avgSymUs))
                .totalProcessingTimeUs(round(avgTotalUs))
                .totalProcessingTimeMs(round(avgTotalUs / 1000.0))
                .publicKeySizeBytes(pubKeySize)
                .privateKeySizeBytes(privKeySize)
                .ciphertextSizeBytes(ciphertextSize)
                .encapsulatedKeySizeBytes(encapsulatedKeySize)
                .plaintextSizeBytes(plaintextBytes.length)
                .integrityVerified(integrityVerified)
                .authenticationVerified(authVerified)
                .success(integrityVerified && authVerified)
                .deliveryStatus("DELIVERED")
                .mathematicalBasis("Integer Factorization Problem (Broken by Shor's Quantum Algorithm)")
                .libraryUsed("Standard SunJCE Provider (Java 21/23)")
                .build();
    }

    /**
     * 2. ECC (ECDH P-256) + HKDF-SHA-256 + AES-256-GCM Hybrid Benchmark
     */
    private AlgorithmBenchmarkResult benchmarkEcc(String plaintext, int iterations, boolean keyReuse) {
        byte[] plaintextBytes = plaintext.getBytes(StandardCharsets.UTF_8);

        double totalKeygenNs = 0;
        double totalAsymNs = 0;
        double totalSymNs = 0;
        double totalEncryptNs = 0;
        double totalDecryptNs = 0;

        int pubKeySize = 0;
        int privKeySize = 0;
        int ciphertextSize = 0;
        int encapsulatedKeySize = 0;
        boolean integrityVerified = true;
        boolean authVerified = true;

        KeyPair reusableRecipientKp = null;
        if (keyReuse) {
            try {
                KeyPairGenerator kpg = KeyPairGenerator.getInstance("EC");
                kpg.initialize(new ECGenParameterSpec("secp256r1"));
                reusableRecipientKp = kpg.generateKeyPair();
            } catch (Exception e) {
                log.error("ECC init error", e);
            }
        }

        for (int i = 0; i < iterations; i++) {
            try {
                // Key Generation (Recipient)
                long tKey0 = System.nanoTime();
                KeyPair recipientKp = (keyReuse && reusableRecipientKp != null) ? reusableRecipientKp : null;
                if (recipientKp == null) {
                    KeyPairGenerator kpg = KeyPairGenerator.getInstance("EC");
                    kpg.initialize(new ECGenParameterSpec("secp256r1"));
                    recipientKp = kpg.generateKeyPair();
                }
                long tKey1 = System.nanoTime();
                if (!keyReuse || i == 0) {
                    totalKeygenNs += (tKey1 - tKey0);
                }

                pubKeySize = recipientKp.getPublic().getEncoded().length;
                privKeySize = recipientKp.getPrivate().getEncoded().length;

                // Encryption (Sender)
                long tEnc0 = System.nanoTime();

                // Step A: Ephemeral key generation + ECDH agreement
                long tAsym0 = System.nanoTime();
                KeyPairGenerator ephKpg = KeyPairGenerator.getInstance("EC");
                ephKpg.initialize(new ECGenParameterSpec("secp256r1"));
                KeyPair ephemeralKp = ephKpg.generateKeyPair();

                KeyAgreement senderKa = KeyAgreement.getInstance("ECDH");
                senderKa.init(ephemeralKp.getPrivate());
                senderKa.doPhase(recipientKp.getPublic(), true);
                byte[] sharedSecret = senderKa.generateSecret();

                // Derive AES key via HKDF-SHA-256
                byte[] derivedAesKeyBytes = deriveKeyHkdf(sharedSecret);
                SecretKey aesKey = new SecretKeySpec(derivedAesKeyBytes, "AES");
                long tAsym1 = System.nanoTime();

                byte[] ephPubKeyBytes = ephemeralKp.getPublic().getEncoded();
                encapsulatedKeySize = ephPubKeyBytes.length;

                // Step B: Encrypt payload with AES-256-GCM
                long tSym0 = System.nanoTime();
                byte[] iv = new byte[GCM_IV_BYTES];
                secureRandom.nextBytes(iv);
                Cipher gcmCipher = Cipher.getInstance("AES/GCM/NoPadding");
                gcmCipher.init(Cipher.ENCRYPT_MODE, aesKey, new GCMParameterSpec(GCM_TAG_BITS, iv));
                byte[] gcmCiphertext = gcmCipher.doFinal(plaintextBytes);
                long tSym1 = System.nanoTime();

                long tEnc1 = System.nanoTime();

                totalAsymNs += (tAsym1 - tAsym0);
                totalSymNs += (tSym1 - tSym0);
                totalEncryptNs += (tEnc1 - tEnc0);

                ciphertextSize = ephPubKeyBytes.length + iv.length + gcmCiphertext.length;

                // Decryption (Recipient)
                long tDec0 = System.nanoTime();
                KeyAgreement recKa = KeyAgreement.getInstance("ECDH");
                recKa.init(recipientKp.getPrivate());
                recKa.doPhase(ephemeralKp.getPublic(), true);
                byte[] recSharedSecret = recKa.generateSecret();

                byte[] recAesKeyBytes = deriveKeyHkdf(recSharedSecret);
                SecretKey recAesKey = new SecretKeySpec(recAesKeyBytes, "AES");

                gcmCipher.init(Cipher.DECRYPT_MODE, recAesKey, new GCMParameterSpec(GCM_TAG_BITS, iv));
                byte[] decryptedBytes = gcmCipher.doFinal(gcmCiphertext);
                long tDec1 = System.nanoTime();

                totalDecryptNs += (tDec1 - tDec0);

                String decryptedText = new String(decryptedBytes, StandardCharsets.UTF_8);
                if (!decryptedText.equals(plaintext)) {
                    integrityVerified = false;
                }
            } catch (Exception ex) {
                log.error("ECC benchmark iteration failed", ex);
                integrityVerified = false;
                authVerified = false;
            }
        }

        double div = keyReuse ? 1.0 : iterations;
        double avgKeygenUs = (totalKeygenNs / div) / 1000.0;
        double avgEncryptUs = (totalEncryptNs / iterations) / 1000.0;
        double avgDecryptUs = (totalDecryptNs / iterations) / 1000.0;
        double avgAsymUs = (totalAsymNs / iterations) / 1000.0;
        double avgSymUs = (totalSymNs / iterations) / 1000.0;
        double avgTotalUs = avgKeygenUs + avgEncryptUs + avgDecryptUs;

        return AlgorithmBenchmarkResult.builder()
                .algorithmName("ECC-P256 (ECDH + HKDF Hybrid)")
                .category("Classical Elliptic Curve")
                .standardReference("NIST SP 800-56A / ANSI X9.63")
                .securityStatus("Vulnerable to Shor's Algorithm")
                .quantumResistant(false)
                .keygenTimeUs(round(avgKeygenUs))
                .keygenTimeMs(round(avgKeygenUs / 1000.0))
                .encryptionTimeUs(round(avgEncryptUs))
                .encryptionTimeMs(round(avgEncryptUs / 1000.0))
                .decryptionTimeUs(round(avgDecryptUs))
                .decryptionTimeMs(round(avgDecryptUs / 1000.0))
                .asymmetricOpTimeUs(round(avgAsymUs))
                .symmetricOpTimeUs(round(avgSymUs))
                .totalProcessingTimeUs(round(avgTotalUs))
                .totalProcessingTimeMs(round(avgTotalUs / 1000.0))
                .publicKeySizeBytes(pubKeySize)
                .privateKeySizeBytes(privKeySize)
                .ciphertextSizeBytes(ciphertextSize)
                .encapsulatedKeySizeBytes(encapsulatedKeySize)
                .plaintextSizeBytes(plaintextBytes.length)
                .integrityVerified(integrityVerified)
                .authenticationVerified(authVerified)
                .success(integrityVerified && authVerified)
                .deliveryStatus("DELIVERED")
                .mathematicalBasis("Elliptic Curve Discrete Logarithm Problem (ECDLP - Broken by Shor's Algorithm)")
                .libraryUsed("Standard SunEC / SunJCE Provider (Java 21/23)")
                .build();
    }

    /**
     * 3. PQC (ML-KEM-768 / FIPS 203) + HKDF-SHA-256 + AES-256-GCM Hybrid Benchmark
     */
    private AlgorithmBenchmarkResult benchmarkPqc(String plaintext, int iterations, boolean keyReuse) {
        byte[] plaintextBytes = plaintext.getBytes(StandardCharsets.UTF_8);

        double totalKeygenNs = 0;
        double totalAsymNs = 0;
        double totalSymNs = 0;
        double totalEncryptNs = 0;
        double totalDecryptNs = 0;

        int pubKeySize = 0;
        int privKeySize = 0;
        int ciphertextSize = 0;
        int encapsulatedKeySize = 0;
        boolean integrityVerified = true;
        boolean authVerified = true;

        AsymmetricCipherKeyPair reusablePqcKp = null;
        if (keyReuse) {
            try {
                MLKEMKeyPairGenerator keyGen = new MLKEMKeyPairGenerator();
                keyGen.init(new MLKEMKeyGenerationParameters(secureRandom, MLKEMParameters.ml_kem_768));
                reusablePqcKp = keyGen.generateKeyPair();
            } catch (Exception e) {
                log.error("PQC init error", e);
            }
        }

        for (int i = 0; i < iterations; i++) {
            try {
                // Key Generation (Recipient)
                long tKey0 = System.nanoTime();
                AsymmetricCipherKeyPair kp = (keyReuse && reusablePqcKp != null) ? reusablePqcKp : null;
                if (kp == null) {
                    MLKEMKeyPairGenerator keyGen = new MLKEMKeyPairGenerator();
                    keyGen.init(new MLKEMKeyGenerationParameters(secureRandom, MLKEMParameters.ml_kem_768));
                    kp = keyGen.generateKeyPair();
                }
                long tKey1 = System.nanoTime();
                if (!keyReuse || i == 0) {
                    totalKeygenNs += (tKey1 - tKey0);
                }

                MLKEMPublicKeyParameters publicKey = (MLKEMPublicKeyParameters) kp.getPublic();
                MLKEMPrivateKeyParameters privateKey = (MLKEMPrivateKeyParameters) kp.getPrivate();

                pubKeySize = publicKey.getEncoded().length; // 1184 bytes per FIPS 203
                privKeySize = privateKey.getEncoded().length; // 2400 bytes per FIPS 203

                // Encryption (Sender)
                long tEnc0 = System.nanoTime();

                // Step A: Encapsulate shared secret with ML-KEM-768
                long tAsym0 = System.nanoTime();
                MLKEMGenerator generator = new MLKEMGenerator(secureRandom);
                SecretWithEncapsulation enc = generator.generateEncapsulated(publicKey);
                byte[] sharedSecret = enc.getSecret();
                byte[] kemCiphertext = enc.getEncapsulation(); // 1088 bytes per FIPS 203

                byte[] derivedAesKeyBytes = deriveKeyHkdf(sharedSecret);
                SecretKey aesKey = new SecretKeySpec(derivedAesKeyBytes, "AES");
                long tAsym1 = System.nanoTime();

                encapsulatedKeySize = kemCiphertext.length;

                // Step B: Encrypt payload with AES-256-GCM
                long tSym0 = System.nanoTime();
                byte[] iv = new byte[GCM_IV_BYTES];
                secureRandom.nextBytes(iv);
                Cipher gcmCipher = Cipher.getInstance("AES/GCM/NoPadding");
                gcmCipher.init(Cipher.ENCRYPT_MODE, aesKey, new GCMParameterSpec(GCM_TAG_BITS, iv));
                byte[] gcmCiphertext = gcmCipher.doFinal(plaintextBytes);
                long tSym1 = System.nanoTime();

                long tEnc1 = System.nanoTime();

                totalAsymNs += (tAsym1 - tAsym0);
                totalSymNs += (tSym1 - tSym0);
                totalEncryptNs += (tEnc1 - tEnc0);

                ciphertextSize = kemCiphertext.length + iv.length + gcmCiphertext.length;

                // Decryption (Recipient)
                long tDec0 = System.nanoTime();
                MLKEMExtractor extractor = new MLKEMExtractor(privateKey);
                byte[] recSharedSecret = extractor.extractSecret(kemCiphertext);

                byte[] recAesKeyBytes = deriveKeyHkdf(recSharedSecret);
                SecretKey recAesKey = new SecretKeySpec(recAesKeyBytes, "AES");

                gcmCipher.init(Cipher.DECRYPT_MODE, recAesKey, new GCMParameterSpec(GCM_TAG_BITS, iv));
                byte[] decryptedBytes = gcmCipher.doFinal(gcmCiphertext);
                long tDec1 = System.nanoTime();

                totalDecryptNs += (tDec1 - tDec0);

                String decryptedText = new String(decryptedBytes, StandardCharsets.UTF_8);
                if (!decryptedText.equals(plaintext)) {
                    integrityVerified = false;
                }
            } catch (Exception ex) {
                log.error("PQC benchmark iteration failed", ex);
                integrityVerified = false;
                authVerified = false;
            }
        }

        double div = keyReuse ? 1.0 : iterations;
        double avgKeygenUs = (totalKeygenNs / div) / 1000.0;
        double avgEncryptUs = (totalEncryptNs / iterations) / 1000.0;
        double avgDecryptUs = (totalDecryptNs / iterations) / 1000.0;
        double avgAsymUs = (totalAsymNs / iterations) / 1000.0;
        double avgSymUs = (totalSymNs / iterations) / 1000.0;
        double avgTotalUs = avgKeygenUs + avgEncryptUs + avgDecryptUs;

        return AlgorithmBenchmarkResult.builder()
                .algorithmName("ML-KEM-768 (Post-Quantum Hybrid)")
                .category("Post-Quantum Cryptography")
                .standardReference("NIST FIPS 203 (Final Standard)")
                .securityStatus("Designed to Resist Known Quantum Attacks")
                .quantumResistant(true)
                .keygenTimeUs(round(avgKeygenUs))
                .keygenTimeMs(round(avgKeygenUs / 1000.0))
                .encryptionTimeUs(round(avgEncryptUs))
                .encryptionTimeMs(round(avgEncryptUs / 1000.0))
                .decryptionTimeUs(round(avgDecryptUs))
                .decryptionTimeMs(round(avgDecryptUs / 1000.0))
                .asymmetricOpTimeUs(round(avgAsymUs))
                .symmetricOpTimeUs(round(avgSymUs))
                .totalProcessingTimeUs(round(avgTotalUs))
                .totalProcessingTimeMs(round(avgTotalUs / 1000.0))
                .publicKeySizeBytes(pubKeySize)
                .privateKeySizeBytes(privKeySize)
                .ciphertextSizeBytes(ciphertextSize)
                .encapsulatedKeySizeBytes(encapsulatedKeySize)
                .plaintextSizeBytes(plaintextBytes.length)
                .integrityVerified(integrityVerified)
                .authenticationVerified(authVerified)
                .success(integrityVerified && authVerified)
                .deliveryStatus("DELIVERED")
                .mathematicalBasis("Module Learning with Errors (M-LWE) over Polynomial Rings")
                .libraryUsed("Bouncy Castle 1.79 (FIPS 203)")
                .build();
    }

    /**
     * HKDF-SHA-256 Extract-and-Expand implementation
     */
    private byte[] deriveKeyHkdf(byte[] sharedSecret) {
        HKDFBytesGenerator hkdf = new HKDFBytesGenerator(new SHA256Digest());
        hkdf.init(new HKDFParameters(sharedSecret, HKDF_SALT, HKDF_INFO));
        byte[] derivedKey = new byte[AES_KEY_BYTES];
        hkdf.generateBytes(derivedKey, 0, derivedKey.length);
        return derivedKey;
    }

    /**
     * Warm-up executions to prime JVM classes & JIT optimization
     */
    private void executeWarmup(String sampleText) {
        try {
            // RSA warm-up
            KeyPairGenerator rsaKpg = KeyPairGenerator.getInstance("RSA");
            rsaKpg.initialize(2048);
            KeyPair rsaKp = rsaKpg.generateKeyPair();
            Cipher rsaCipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
            rsaCipher.init(Cipher.ENCRYPT_MODE, rsaKp.getPublic(),
                    new OAEPParameterSpec("SHA-256", "MGF1", MGF1ParameterSpec.SHA256, PSource.PSpecified.DEFAULT));
            byte[] dummy = rsaCipher.doFinal(new byte[32]);
            rsaCipher.init(Cipher.DECRYPT_MODE, rsaKp.getPrivate(),
                    new OAEPParameterSpec("SHA-256", "MGF1", MGF1ParameterSpec.SHA256, PSource.PSpecified.DEFAULT));
            rsaCipher.doFinal(dummy);

            // ECC warm-up
            KeyPairGenerator ecKpg = KeyPairGenerator.getInstance("EC");
            ecKpg.initialize(new ECGenParameterSpec("secp256r1"));
            KeyPair ecKp1 = ecKpg.generateKeyPair();
            KeyPair ecKp2 = ecKpg.generateKeyPair();
            KeyAgreement ka = KeyAgreement.getInstance("ECDH");
            ka.init(ecKp1.getPrivate());
            ka.doPhase(ecKp2.getPublic(), true);
            ka.generateSecret();

            // PQC warm-up
            MLKEMKeyPairGenerator pqcKpg = new MLKEMKeyPairGenerator();
            pqcKpg.init(new MLKEMKeyGenerationParameters(secureRandom, MLKEMParameters.ml_kem_768));
            AsymmetricCipherKeyPair pqcKp = pqcKpg.generateKeyPair();
            MLKEMGenerator gen = new MLKEMGenerator(secureRandom);
            SecretWithEncapsulation enc = gen.generateEncapsulated((MLKEMPublicKeyParameters) pqcKp.getPublic());
            MLKEMExtractor ext = new MLKEMExtractor((MLKEMPrivateKeyParameters) pqcKp.getPrivate());
            ext.extractSecret(enc.getEncapsulation());
        } catch (Exception ignored) {
        }
    }

    /**
     * Retrieve benchmark aggregate overview and recent history
     */
    @Transactional(readOnly = true)
    public BenchmarkSummaryDto getSummary() {
        List<BenchmarkRun> runs = benchmarkRunRepository.findTop30ByOrderByCreatedAtDesc();
        long totalRuns = benchmarkRunRepository.count();

        double avgRsaEncrypt = runs.stream().mapToDouble(BenchmarkRun::getRsaEncryptUs).average().orElse(0.0);
        double avgEccEncrypt = runs.stream().mapToDouble(BenchmarkRun::getEccEncryptUs).average().orElse(0.0);
        double avgPqcEncrypt = runs.stream().mapToDouble(BenchmarkRun::getPqcEncryptUs).average().orElse(0.0);

        double avgRsaDecrypt = runs.stream().mapToDouble(BenchmarkRun::getRsaDecryptUs).average().orElse(0.0);
        double avgEccDecrypt = runs.stream().mapToDouble(BenchmarkRun::getEccDecryptUs).average().orElse(0.0);
        double avgPqcDecrypt = runs.stream().mapToDouble(BenchmarkRun::getPqcDecryptUs).average().orElse(0.0);

        double avgRsaKeygen = runs.stream().mapToDouble(BenchmarkRun::getRsaKeygenUs).average().orElse(0.0);
        double avgEccKeygen = runs.stream().mapToDouble(BenchmarkRun::getEccKeygenUs).average().orElse(0.0);
        double avgPqcKeygen = runs.stream().mapToDouble(BenchmarkRun::getPqcKeygenUs).average().orElse(0.0);

        List<BenchmarkSummaryDto.BenchmarkHistoryItem> history = runs.stream().map(r ->
                BenchmarkSummaryDto.BenchmarkHistoryItem.builder()
                        .id(r.getId().toString())
                        .messageSnippet(r.getMessageSnippet())
                        .messageSizeBytes(r.getMessageSizeBytes() != null ? r.getMessageSizeBytes() : 0)
                        .rsaEncryptUs(round(r.getRsaEncryptUs()))
                        .eccEncryptUs(round(r.getEccEncryptUs()))
                        .pqcEncryptUs(round(r.getPqcEncryptUs()))
                        .rsaDecryptUs(round(r.getRsaDecryptUs()))
                        .eccDecryptUs(round(r.getEccDecryptUs()))
                        .pqcDecryptUs(round(r.getPqcDecryptUs()))
                        .rsaKeygenUs(round(r.getRsaKeygenUs()))
                        .eccKeygenUs(round(r.getEccKeygenUs()))
                        .pqcKeygenUs(round(r.getPqcKeygenUs()))
                        .rsaCiphertextSize(r.getRsaCiphertextSizeBytes() != null ? r.getRsaCiphertextSizeBytes() : 0)
                        .eccCiphertextSize(r.getEccCiphertextSizeBytes() != null ? r.getEccCiphertextSizeBytes() : 0)
                        .pqcCiphertextSize(r.getPqcCiphertextSizeBytes() != null ? r.getPqcCiphertextSizeBytes() : 0)
                        .timestamp(r.getCreatedAt() != null ? r.getCreatedAt().toString() : Instant.now().toString())
                        .build()
        ).toList();

        return BenchmarkSummaryDto.builder()
                .totalBenchmarksRun(totalRuns)
                .totalEncryptionOperations(totalRuns * 3)
                .avgRsaEncryptUs(round(avgRsaEncrypt))
                .avgEccEncryptUs(round(avgEccEncrypt))
                .avgPqcEncryptUs(round(avgPqcEncrypt))
                .avgRsaDecryptUs(round(avgRsaDecrypt))
                .avgEccDecryptUs(round(avgEccDecrypt))
                .avgPqcDecryptUs(round(avgPqcDecrypt))
                .avgRsaKeygenUs(round(avgRsaKeygen))
                .avgEccKeygenUs(round(avgEccKeygen))
                .avgPqcKeygenUs(round(avgPqcKeygen))
                .activeCryptographicAlgorithm("ML-KEM-768 (FIPS 203)")
                .quantumResistantAlgorithmStatus("ACTIVE & ENFORCED")
                .recentRuns(history)
                .build();
    }

    @Transactional(readOnly = true)
    public List<BenchmarkRun> getHistory(UUID userId) {
        if (userId != null) {
            return benchmarkRunRepository.findByUserIdOrderByCreatedAtDesc(userId);
        }
        return benchmarkRunRepository.findTop30ByOrderByCreatedAtDesc();
    }

    private double round(Double value) {
        if (value == null || Double.isNaN(value) || Double.isInfinite(value)) return 0.0;
        return Math.round(value * 10.0) / 10.0;
    }
}
