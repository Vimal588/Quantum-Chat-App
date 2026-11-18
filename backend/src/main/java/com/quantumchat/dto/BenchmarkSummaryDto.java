package com.quantumchat.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BenchmarkSummaryDto {

    private long totalBenchmarksRun;
    private long totalEncryptionOperations; // benchmarks * 3 algorithms * iterations
    private double avgRsaEncryptUs;
    private double avgEccEncryptUs;
    private double avgPqcEncryptUs;
    private double avgRsaDecryptUs;
    private double avgEccDecryptUs;
    private double avgPqcDecryptUs;
    private double avgRsaKeygenUs;
    private double avgEccKeygenUs;
    private double avgPqcKeygenUs;

    private String activeCryptographicAlgorithm;
    private String quantumResistantAlgorithmStatus;

    private List<BenchmarkHistoryItem> recentRuns;

    public long getTotalMessagesSent() {
        return totalBenchmarksRun;
    }

    public double getAverageEncryptionTimeMicros() {
        return (avgRsaEncryptUs + avgEccEncryptUs + avgPqcEncryptUs) / 3.0;
    }

    public double getAverageDecryptionTimeMicros() {
        return (avgRsaDecryptUs + avgEccDecryptUs + avgPqcDecryptUs) / 3.0;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BenchmarkHistoryItem {
        private String id;
        private String messageSnippet;
        private int messageSizeBytes;
        private double rsaEncryptUs;
        private double eccEncryptUs;
        private double pqcEncryptUs;
        private double rsaDecryptUs;
        private double eccDecryptUs;
        private double pqcDecryptUs;
        private double rsaKeygenUs;
        private double eccKeygenUs;
        private double pqcKeygenUs;
        private int rsaCiphertextSize;
        private int eccCiphertextSize;
        private int pqcCiphertextSize;
        private String timestamp;
    }
}
