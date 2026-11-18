package com.quantumchat.dto;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactDto {
    private UUID contactId;
    private UUID userId;
    private String email;
    private String fullName;
    private String avatarUrl;
    private String status;
    private boolean verified;
    private String safetyNumberFingerprint;
    private String mlKemPublicKey;
    private String mlDsaPublicKey;
    private Integer keyVersion;
    private Instant lastSeen;
    private boolean isOnline;
}
