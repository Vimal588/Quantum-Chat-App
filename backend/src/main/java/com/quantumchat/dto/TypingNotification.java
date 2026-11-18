package com.quantumchat.dto;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TypingNotification {
    private UUID conversationId;
    private UUID senderId;
    private String senderName;
    private boolean typing;
}
