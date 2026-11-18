package com.quantumchat.websocket;

import com.quantumchat.dto.EncryptedMessageDto;
import com.quantumchat.dto.ReceiptDto;
import com.quantumchat.dto.SendMessageRequest;
import com.quantumchat.dto.TypingNotification;
import com.quantumchat.security.UserPrincipal;
import com.quantumchat.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private static final Logger log = LoggerFactory.getLogger(ChatWebSocketController.class);

    private final MessageService messageService;
    private final SimpMessageSendingOperations messagingTemplate;

    @MessageMapping("/chat.send")
    public void handleSendMessage(@Payload SendMessageRequest request, Principal principal) {
        if (principal == null) {
            log.warn("Unauthenticated WebSocket message rejected");
            return;
        }

        UserPrincipal userPrincipal = (UserPrincipal) ((Authentication) principal).getPrincipal();
        UUID senderId = userPrincipal.getId();

        log.info("Processing incoming encrypted message from user: {}", senderId);
        EncryptedMessageDto messageDto = messageService.sendEncryptedMessage(senderId, request);

        // Broadcast to conversation topic
        messagingTemplate.convertAndSend(
                "/topic/conversation." + messageDto.getConversationId(),
                messageDto
        );

        // Also notify recipient directly
        messagingTemplate.convertAndSend(
                "/topic/user." + request.getRecipientId(),
                messageDto
        );
    }

    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload TypingNotification notification, Principal principal) {
        if (principal == null) return;
        UserPrincipal userPrincipal = (UserPrincipal) ((Authentication) principal).getPrincipal();
        notification.setSenderId(userPrincipal.getId());
        notification.setSenderName(userPrincipal.getFullName());

        messagingTemplate.convertAndSend(
                "/topic/conversation." + notification.getConversationId() + ".typing",
                notification
        );
    }

    @MessageMapping("/chat.receipt")
    public void handleReceipt(@Payload ReceiptDto receipt, Principal principal) {
        if (principal == null) return;
        UserPrincipal userPrincipal = (UserPrincipal) ((Authentication) principal).getPrincipal();

        messageService.markMessageReceipt(receipt.getMessageId(), userPrincipal.getId(), receipt.getStatus());

        messagingTemplate.convertAndSend(
                "/topic/conversation." + receipt.getConversationId() + ".receipt",
                receipt
        );
    }
}
