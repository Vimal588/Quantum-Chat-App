package com.quantumchat.controller;

import com.quantumchat.dto.EncryptedMessageDto;
import com.quantumchat.dto.MessageStatusDto;
import com.quantumchat.dto.SendMessageRequest;
import com.quantumchat.security.UserPrincipal;
import com.quantumchat.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping
    public ResponseEntity<EncryptedMessageDto> sendMessage(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SendMessageRequest request) {
        EncryptedMessageDto dto = messageService.sendEncryptedMessage(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @GetMapping("/{id}/status")
    public ResponseEntity<MessageStatusDto> getMessageStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        MessageStatusDto status = messageService.getMessageStatus(id, principal.getId());
        return ResponseEntity.ok(status);
    }
}
