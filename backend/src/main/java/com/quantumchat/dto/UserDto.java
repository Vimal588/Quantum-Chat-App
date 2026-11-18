package com.quantumchat.dto;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {
    private UUID id;
    private String email;
    private String fullName;
    private String status;
    private String avatarUrl;
    private String bio;
    private Instant lastSeen;
    private String mlKemFingerprint;
    private String mlDsaFingerprint;
    private Integer keyVersion;
}
