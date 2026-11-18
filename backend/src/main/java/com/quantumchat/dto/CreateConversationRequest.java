package com.quantumchat.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateConversationRequest {
    @NotNull(message = "Recipient user ID is required")
    private UUID recipientId;
}
