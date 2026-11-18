package com.quantumchat.controller;

import com.quantumchat.dto.KeyHistoryResponse;
import com.quantumchat.dto.KeyRegistrationRequest;
import com.quantumchat.dto.PublicKeyResponse;
import com.quantumchat.security.UserPrincipal;
import com.quantumchat.service.KeyManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/keys")
@RequiredArgsConstructor
public class KeyController {

    private final KeyManagementService keyManagementService;

    @PostMapping
    public ResponseEntity<PublicKeyResponse> registerOrRotateKeys(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody KeyRegistrationRequest request) {
        PublicKeyResponse response = keyManagementService.registerOrRotateKeys(principal.getId(), request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<PublicKeyResponse> getMyActiveKeys(@AuthenticationPrincipal UserPrincipal principal) {
        PublicKeyResponse response = keyManagementService.getActivePublicKeys(principal.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<PublicKeyResponse> getActivePublicKeys(@PathVariable UUID userId) {
        PublicKeyResponse response = keyManagementService.getActivePublicKeys(userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history/{userId}")
    public ResponseEntity<List<KeyHistoryResponse>> getKeyHistory(@PathVariable UUID userId) {
        List<KeyHistoryResponse> history = keyManagementService.getKeyRotationHistory(userId);
        return ResponseEntity.ok(history);
    }
}
