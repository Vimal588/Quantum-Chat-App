package com.quantumchat.dto;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EncryptedMessageDto {
    private UUID id;
    private UUID conversationId;
    private UUID senderId;
    private String senderName;
    private String ciphertext;
    private String nonce;
    private String kemCiphertext;
    private String algorithmVersion;
    private Integer keyVersion;
    private String messageType;
    private String deliveryStatus;
    private Instant expiresAt;
    private boolean isExpired;
    private Long remainingSeconds;
    private Instant createdAt;
}
