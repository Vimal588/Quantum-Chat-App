package com.quantumchat.dto;

import lombok.*;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BenchmarkResponse {

    private UUID benchmarkId;
    private String message;
    private int messageSizeBytes;
    private int iterations;
    private boolean warmupPerformed;
    private boolean keyReuseMode;
    @Builder.Default
    private Instant timestamp = Instant.now();

    private AlgorithmBenchmarkResult rsa;
    private AlgorithmBenchmarkResult ecc;
    private AlgorithmBenchmarkResult pqc;

    private Map<String, String> environment;

    public Map<String, AlgorithmBenchmarkResult> getResults() {
        Map<String, AlgorithmBenchmarkResult> map = new LinkedHashMap<>();
        if (rsa != null) map.put("RSA", rsa);
        if (ecc != null) map.put("ECC", ecc);
        if (pqc != null) map.put("PQC", pqc);
        return map;
    }

    public UUID getId() {
        return benchmarkId;
    }
}
