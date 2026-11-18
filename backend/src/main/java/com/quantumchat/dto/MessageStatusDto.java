package com.quantumchat.dto;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageStatusDto {

    private UUID messageId;
    private Instant createdAt;
    private Instant expiresAt;
    private boolean isExpired;
    private Long remainingSeconds;
    private String deliveryStatus;
    private boolean canDecrypt;
    private String disclaimer;
}
