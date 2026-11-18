package com.quantumchat.service;

import com.quantumchat.dto.EncryptedMessageDto;
import com.quantumchat.dto.MessageStatusDto;
import com.quantumchat.dto.SendMessageRequest;
import com.quantumchat.entity.*;
import com.quantumchat.exception.BadRequestException;
import com.quantumchat.exception.ResourceNotFoundException;
import com.quantumchat.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final BlockedUserRepository blockedUserRepository;
    private final MessageReceiptRepository receiptRepository;
    private final ConversationService conversationService;

    @Transactional
    public EncryptedMessageDto sendEncryptedMessage(UUID senderId, SendMessageRequest request) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));

        // Ensure recipient is not blocking sender
        if (blockedUserRepository.existsByUserIdAndBlockedUserId(request.getRecipientId(), senderId)) {
            throw new BadRequestException("Cannot deliver message: user has blocked you.");
        }

        Conversation conversation;
        if (request.getConversationId() != null) {
            conversation = conversationRepository.findById(request.getConversationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        } else {
            // Find or create direct conversation
            var convDto = conversationService.getOrCreateDirectConversation(senderId, request.getRecipientId());
            conversation = conversationRepository.findById(convDto.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Conversation resolution failed"));
        }

        // Validate membership
        boolean isMember = participantRepository.existsByConversationIdAndUserId(conversation.getId(), senderId);
        if (!isMember) {
            throw new BadRequestException("You are not a participant in this conversation");
        }

        Instant expiresAt = null;
        if (request.getExpirySeconds() != null && request.getExpirySeconds() > 0) {
            expiresAt = Instant.now().plusSeconds(request.getExpirySeconds());
        }

        Message message = Message.builder()
                .conversation(conversation)
                .sender(sender)
                .ciphertext(request.getCiphertext())
                .nonce(request.getNonce())
                .kemCiphertext(request.getKemCiphertext())
                .algorithmVersion(request.getAlgorithmVersion() != null ? request.getAlgorithmVersion() : "MLKEM768-AES256GCM")
                .keyVersion(request.getKeyVersion() != null ? request.getKeyVersion() : 1)
                .messageType(request.getMessageType() != null ? request.getMessageType() : "TEXT")
                .deliveryStatus("SENT")
                .expiresAt(expiresAt)
                .isExpired(false)
                .build();

        message = messageRepository.save(message);

        // Update conversation timestamp
        conversation.setUpdatedAt(Instant.now());
        conversationRepository.save(conversation);

        // Create initial receipt for recipient
        User recipient = userRepository.findById(request.getRecipientId()).orElse(null);
        if (recipient != null) {
            MessageReceipt receipt = MessageReceipt.builder()
                    .message(message)
                    .user(recipient)
                    .status("SENT")
                    .build();
            receiptRepository.save(receipt);
        }

        return mapToDto(message);
    }

    @Transactional(readOnly = true)
    public List<EncryptedMessageDto> getConversationMessages(UUID conversationId, UUID currentUserId, int page, int size) {
        boolean isMember = participantRepository.existsByConversationIdAndUserId(conversationId, currentUserId);
        if (!isMember) {
            throw new BadRequestException("You are not authorized to view messages in this conversation");
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<Message> messagePage = messageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId, pageable);

        List<EncryptedMessageDto> messages = messagePage.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        // Reverse so that messages are returned in chronological order
        Collections.reverse(messages);
        return messages;
    }

    @Transactional
    public void markMessageReceipt(UUID messageId, UUID userId, String status) {
        Message message = messageRepository.findById(messageId).orElse(null);
        if (message == null) return;

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        MessageReceipt receipt = receiptRepository.findByMessageIdAndUserId(messageId, userId)
                .orElseGet(() -> MessageReceipt.builder().message(message).user(user).build());

        receipt.setStatus(status);
        if ("DELIVERED".equalsIgnoreCase(status)) {
            receipt.setDeliveredAt(Instant.now());
            message.setDeliveryStatus("DELIVERED");
        } else if ("READ".equalsIgnoreCase(status)) {
            receipt.setReadAt(Instant.now());
            message.setDeliveryStatus("READ");
        }
        receiptRepository.save(receipt);
        messageRepository.save(message);
    }

    @Transactional(readOnly = true)
    public MessageStatusDto getMessageStatus(UUID messageId, UUID currentUserId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + messageId));

        boolean isMember = participantRepository.existsByConversationIdAndUserId(message.getConversation().getId(), currentUserId);
        if (!isMember) {
            throw new BadRequestException("You are not authorized to view this message status");
        }

        boolean isExpired = message.getExpiresAt() != null && Instant.now().isAfter(message.getExpiresAt());
        Long remainingSeconds = null;
        if (message.getExpiresAt() != null) {
            remainingSeconds = Math.max(0, Duration.between(Instant.now(), message.getExpiresAt()).getSeconds());
        }

        return MessageStatusDto.builder()
                .messageId(message.getId())
                .createdAt(message.getCreatedAt())
                .expiresAt(message.getExpiresAt())
                .isExpired(isExpired)
                .remainingSeconds(remainingSeconds)
                .deliveryStatus(message.getDeliveryStatus())
                .canDecrypt(!isExpired)
                .disclaimer("Message expiry is an application-level policy. It cannot guarantee deletion of previously cached data, backups, or screenshots by recipient.")
                .build();
    }

    private EncryptedMessageDto mapToDto(Message msg) {
        boolean isExpired = msg.getExpiresAt() != null && Instant.now().isAfter(msg.getExpiresAt());
        Long remaining = null;
        if (msg.getExpiresAt() != null) {
            remaining = Math.max(0, Duration.between(Instant.now(), msg.getExpiresAt()).getSeconds());
        }

        return EncryptedMessageDto.builder()
                .id(msg.getId())
                .conversationId(msg.getConversation().getId())
                .senderId(msg.getSender().getId())
                .senderName(msg.getSender().getFullName())
                .ciphertext(isExpired ? "" : msg.getCiphertext())
                .nonce(isExpired ? "" : msg.getNonce())
                .kemCiphertext(isExpired ? "" : msg.getKemCiphertext())
                .algorithmVersion(msg.getAlgorithmVersion())
                .keyVersion(msg.getKeyVersion())
                .messageType(msg.getMessageType())
                .deliveryStatus(msg.getDeliveryStatus())
                .expiresAt(msg.getExpiresAt())
                .isExpired(isExpired)
                .remainingSeconds(remaining)
                .createdAt(msg.getCreatedAt())
                .build();
    }
}
