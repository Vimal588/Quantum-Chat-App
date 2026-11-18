package com.quantumchat.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KeyRegistrationRequest {

    @NotBlank(message = "ML-KEM-768 public key is required")
    private String mlKemPublicKey;

    private String mlDsaPublicKey;

    private String deviceName;
}
