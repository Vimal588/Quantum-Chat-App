package com.quantumchat.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlgorithmBenchmarkResult {

    private String algorithmName;              // e.g. "RSA-OAEP-2048", "ECC-P256", "ML-KEM-768"
    private String category;                   // "Classical Asymmetric", "Classical Elliptic Curve", "Post-Quantum Cryptography"
    private String standardReference;          // "PKCS #1 / RFC 8017", "NIST SP 800-56A", "NIST FIPS 203"
    private String securityStatus;              // "Vulnerable to Shor's Algorithm", "Quantum-Resistant"
    private boolean quantumResistant;

    // Measured Timings in Microseconds (µs)
    private double keygenTimeUs;
    private double encryptionTimeUs;
    private double decryptionTimeUs;
    private double asymmetricOpTimeUs;         // RSA-OAEP encrypt vs ECDH compute vs ML-KEM encapsulate
    private double symmetricOpTimeUs;          // AES-256-GCM symmetric encrypt/decrypt
    private double totalProcessingTimeUs;

    // Derived Timings in Milliseconds (ms) for convenient chart visualization
    private double keygenTimeMs;
    private double encryptionTimeMs;
    private double decryptionTimeMs;
    private double totalProcessingTimeMs;

    // Measured Sizes in Bytes
    private int publicKeySizeBytes;
    private int privateKeySizeBytes;
    private int ciphertextSizeBytes;           // Total wire payload size
    private int encapsulatedKeySizeBytes;      // Wrapped AES key / KEM ciphertext size
    private int plaintextSizeBytes;

    // Verification Flags
    private boolean integrityVerified;         // Plaintext matches original after decryption
    private boolean authenticationVerified;    // AES-GCM 128-bit tag verified successfully
    private boolean success;
    private String deliveryStatus;             // "DELIVERED"
    private String mathematicalBasis;
    private String libraryUsed;

    public double getKeyGenTimeMicros() { return keygenTimeUs; }
    public double getEncryptionTimeMicros() { return encryptionTimeUs; }
    public double getDecryptionTimeMicros() { return decryptionTimeUs; }
    public double getKeyGenTimeMillis() { return keygenTimeMs; }
    public double getEncryptionTimeMillis() { return encryptionTimeMs; }
    public double getDecryptionTimeMillis() { return decryptionTimeMs; }
    public String getMessageDeliveryStatus() { return deliveryStatus; }
    public int getOverheadBytes() { return encapsulatedKeySizeBytes; }
}
