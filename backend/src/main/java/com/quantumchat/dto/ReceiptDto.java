package com.quantumchat.dto;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceiptDto {
    private UUID messageId;
    private UUID conversationId;
    private UUID userId;
    private String status; // DELIVERED, READ
}
