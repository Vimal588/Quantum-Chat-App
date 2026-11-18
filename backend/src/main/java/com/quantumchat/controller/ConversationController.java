package com.quantumchat.controller;

import com.quantumchat.dto.ConversationDto;
import com.quantumchat.dto.CreateConversationRequest;
import com.quantumchat.dto.EncryptedMessageDto;
import com.quantumchat.dto.SendMessageRequest;
import com.quantumchat.security.UserPrincipal;
import com.quantumchat.service.ConversationService;
import com.quantumchat.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;
    private final MessageService messageService;

    @GetMapping
    public ResponseEntity<List<ConversationDto>> getConversations(@AuthenticationPrincipal UserPrincipal principal) {
        List<ConversationDto> list = conversationService.getUserConversations(principal.getId());
        return ResponseEntity.ok(list);
    }

    @PostMapping
    public ResponseEntity<ConversationDto> createOrGetConversation(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateConversationRequest request) {
        ConversationDto dto = conversationService.getOrCreateDirectConversation(principal.getId(), request.getRecipientId());
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConversationDto> getConversationById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        ConversationDto dto = conversationService.getConversationById(id, principal.getId());
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<EncryptedMessageDto>> getMessages(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        List<EncryptedMessageDto> messages = messageService.getConversationMessages(id, principal.getId(), page, size);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/send")
    public ResponseEntity<EncryptedMessageDto> sendEncryptedMessage(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SendMessageRequest request) {
        EncryptedMessageDto message = messageService.sendEncryptedMessage(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(message);
    }
}
