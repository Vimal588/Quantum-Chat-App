package com.quantumchat.dto;

import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityDashboardDto {
    private String kemAlgorithm;
    private String dsaAlgorithm;
    private String symmetricAlgorithm;
    private String kdfAlgorithm;
    private String userMlKemFingerprint;
    private String userMlDsaFingerprint;
    private Integer keyVersion;
    private Instant keyCreatedAt;
    private int activeDevicesCount;
    private int verifiedContactsCount;
    private int totalContactsCount;
    private List<SecurityEventDto> recentSecurityEvents;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SecurityEventDto {
        private UUID id;
        private String eventType;
        private String details;
        private Instant timestamp;
    }
}
