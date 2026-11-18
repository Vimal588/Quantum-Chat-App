package com.quantumchat.dto;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationDto {
    private UUID id;
    private String type;
    private String title;
    private UUID otherParticipantId;
    private String otherParticipantName;
    private String otherParticipantEmail;
    private String otherParticipantAvatar;
    private String otherParticipantKemFingerprint;
    private boolean otherParticipantVerified;
    private boolean isOnline;
    private String lastMessageSnippet;
    private Instant lastMessageTimestamp;
    private int unreadCount;
    private Instant createdAt;
    private Instant updatedAt;
}
