package com.quantumchat.crypto;

import com.quantumchat.dto.BenchmarkRequest;
import com.quantumchat.dto.BenchmarkResponse;
import com.quantumchat.dto.BenchmarkSummaryDto;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.security.Security;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev-h2")
@Transactional
public class CryptoBenchmarkServiceTest {

    @Autowired
    private CryptoBenchmarkService benchmarkService;

    @BeforeAll
    public static void init() {
        if (Security.getProvider("BC") == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    @Test
    @DisplayName("Compare 'Hii' across RSA, ECC, and PQC with Real Cryptographic Operations")
    public void testCompareHiiMessage() {
        BenchmarkRequest req = BenchmarkRequest.builder()
                .message("Hii")
                .iterations(1)
                .warmup(true)
                .keyReuse(false)
                .build();

        BenchmarkResponse res = benchmarkService.runBenchmark(req, UUID.randomUUID());

        assertNotNull(res);
        assertEquals("Hii", res.getMessage());
        assertEquals(3, res.getMessageSizeBytes()); // "Hii" is 3 bytes

        // RSA Verification
        assertNotNull(res.getRsa());
        assertEquals("RSA-OAEP-2048 (Hybrid)", res.getRsa().getAlgorithmName());
        assertFalse(res.getRsa().isQuantumResistant());
        assertTrue(res.getRsa().isIntegrityVerified(), "RSA decrypted text must equal original 'Hii'");
        assertTrue(res.getRsa().isAuthenticationVerified());
        assertTrue(res.getRsa().getEncryptionTimeUs() > 0, "RSA encryption time must be measured");
        assertTrue(res.getRsa().getDecryptionTimeUs() > 0, "RSA decryption time must be measured");
        assertTrue(res.getRsa().getPublicKeySizeBytes() > 250);
        assertTrue(res.getRsa().getCiphertextSizeBytes() > 256); // 256-byte RSA wrapped key + 12 IV + 19 ciphertext

        // ECC Verification
        assertNotNull(res.getEcc());
        assertEquals("ECC-P256 (ECDH + HKDF Hybrid)", res.getEcc().getAlgorithmName());
        assertFalse(res.getEcc().isQuantumResistant());
        assertTrue(res.getEcc().isIntegrityVerified(), "ECC decrypted text must equal original 'Hii'");
        assertTrue(res.getEcc().isAuthenticationVerified());
        assertTrue(res.getEcc().getEncryptionTimeUs() > 0);
        assertTrue(res.getEcc().getDecryptionTimeUs() > 0);
        assertEquals(91, res.getEcc().getPublicKeySizeBytes(), "NIST P-256 public key is 91 bytes");
        assertTrue(res.getEcc().getCiphertextSizeBytes() > 100);

        // PQC Verification (ML-KEM-768 FIPS 203)
        assertNotNull(res.getPqc());
        assertEquals("ML-KEM-768 (Post-Quantum Hybrid)", res.getPqc().getAlgorithmName());
        assertTrue(res.getPqc().isQuantumResistant(), "ML-KEM-768 must be marked quantum resistant");
        assertTrue(res.getPqc().isIntegrityVerified(), "PQC decrypted text must equal original 'Hii'");
        assertTrue(res.getPqc().isAuthenticationVerified());
        assertTrue(res.getPqc().getEncryptionTimeUs() > 0);
        assertTrue(res.getPqc().getDecryptionTimeUs() > 0);
        assertEquals(1184, res.getPqc().getPublicKeySizeBytes(), "ML-KEM-768 public key must be exactly 1184 bytes per FIPS 203");
        assertEquals(1088, res.getPqc().getEncapsulatedKeySizeBytes(), "ML-KEM-768 ciphertext must be exactly 1088 bytes per FIPS 203");
        assertTrue(res.getPqc().getCiphertextSizeBytes() > 1088);

        // Verify summary
        BenchmarkSummaryDto summary = benchmarkService.getSummary();
        assertNotNull(summary);
        assertTrue(summary.getTotalBenchmarksRun() >= 1);
    }
}
