package com.quantumchat.dto;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KeyHistoryResponse {
    private UUID id;
    private Integer version;
    private String keyType;
    private String fingerprint;
    private Instant rotatedAt;
}
