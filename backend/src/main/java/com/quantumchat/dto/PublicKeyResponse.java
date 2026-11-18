package com.quantumchat.dto;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicKeyResponse {
    private UUID userId;
    private String email;
    private String fullName;
    private String mlKemPublicKey;
    private String mlKemFingerprint;
    private String mlDsaPublicKey;
    private String mlDsaFingerprint;
    private Integer version;
    private Instant createdAt;
}
