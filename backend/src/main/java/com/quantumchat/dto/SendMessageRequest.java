package com.quantumchat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendMessageRequest {

    private UUID conversationId;

    @NotNull(message = "Recipient ID is required")
    private UUID recipientId;

    @NotBlank(message = "Ciphertext is required")
    private String ciphertext;

    @NotBlank(message = "Nonce is required")
    private String nonce;

    // Encapsulated shared secret from ML-KEM-768
    private String kemCiphertext;

    @Builder.Default
    private String algorithmVersion = "MLKEM768-AES256GCM";

    @Builder.Default
    private Integer keyVersion = 1;

    @Builder.Default
    private String messageType = "TEXT";

    // Optional expiration policy in seconds (e.g. 30, 60, 300)
    private Integer expirySeconds;
}
