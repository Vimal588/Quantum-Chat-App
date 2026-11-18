package com.quantumchat.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "benchmark_runs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BenchmarkRun {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "message_snippet", length = 100)
    private String messageSnippet;

    @Column(name = "message_size_bytes")
    private Integer messageSizeBytes;

    @Column(name = "iterations")
    private Integer iterations;

    // RSA metrics (in microseconds)
    @Column(name = "rsa_keygen_us")
    private Double rsaKeygenUs;

    @Column(name = "rsa_encrypt_us")
    private Double rsaEncryptUs;

    @Column(name = "rsa_decrypt_us")
    private Double rsaDecryptUs;

    @Column(name = "rsa_key_size_bytes")
    private Integer rsaKeySizeBytes;

    @Column(name = "rsa_ciphertext_size_bytes")
    private Integer rsaCiphertextSizeBytes;

    // ECC metrics (in microseconds)
    @Column(name = "ecc_keygen_us")
    private Double eccKeygenUs;

    @Column(name = "ecc_encrypt_us")
    private Double eccEncryptUs;

    @Column(name = "ecc_decrypt_us")
    private Double eccDecryptUs;

    @Column(name = "ecc_key_size_bytes")
    private Integer eccKeySizeBytes;

    @Column(name = "ecc_ciphertext_size_bytes")
    private Integer eccCiphertextSizeBytes;

    // PQC metrics (in microseconds)
    @Column(name = "pqc_keygen_us")
    private Double pqcKeygenUs;

    @Column(name = "pqc_encrypt_us")
    private Double pqcEncryptUs;

    @Column(name = "pqc_decrypt_us")
    private Double pqcDecryptUs;

    @Column(name = "pqc_key_size_bytes")
    private Integer pqcKeySizeBytes;

    @Column(name = "pqc_ciphertext_size_bytes")
    private Integer pqcCiphertextSizeBytes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
