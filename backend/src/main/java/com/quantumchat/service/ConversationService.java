package com.quantumchat.service;

import com.quantumchat.dto.ConversationDto;
import com.quantumchat.entity.*;
import com.quantumchat.exception.BadRequestException;
import com.quantumchat.exception.ResourceNotFoundException;
import com.quantumchat.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PublicKeyRepository publicKeyRepository;
    private final ContactRepository contactRepository;
    private final MessageRepository messageRepository;

    @Transactional
    public ConversationDto getOrCreateDirectConversation(UUID currentUserId, UUID targetUserId) {
        if (currentUserId.equals(targetUserId)) {
            throw new BadRequestException("Cannot create conversation with yourself");
        }

        // Check if direct conversation already exists
        Optional<Conversation> existing = conversationRepository.findDirectConversationBetween(currentUserId, targetUserId);
        if (existing.isPresent()) {
            return mapToDto(existing.get(), currentUserId);
        }

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Target user not found"));

        Conversation conversation = Conversation.builder()
                .type("DIRECT")
                .title(targetUser.getFullName())
                .build();
        conversation = conversationRepository.save(conversation);

        ConversationParticipant p1 = ConversationParticipant.builder()
                .conversation(conversation)
                .user(currentUser)
                .isAdmin(true)
                .build();
        participantRepository.save(p1);

        ConversationParticipant p2 = ConversationParticipant.builder()
                .conversation(conversation)
                .user(targetUser)
                .isAdmin(false)
                .build();
        participantRepository.save(p2);

        return mapToDto(conversation, currentUserId);
    }

    @Transactional(readOnly = true)
    public List<ConversationDto> getUserConversations(UUID currentUserId) {
        List<Conversation> conversations = conversationRepository.findConversationsByUserId(currentUserId);
        return conversations.stream()
                .map(c -> mapToDto(c, currentUserId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ConversationDto getConversationById(UUID conversationId, UUID currentUserId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        boolean isMember = participantRepository.existsByConversationIdAndUserId(conversationId, currentUserId);
        if (!isMember) {
            throw new BadRequestException("You are not a participant in this conversation");
        }

        return mapToDto(conversation, currentUserId);
    }

    private ConversationDto mapToDto(Conversation conversation, UUID currentUserId) {
        List<ConversationParticipant> participants = participantRepository.findByConversationId(conversation.getId());

        User otherUser = null;
        for (ConversationParticipant cp : participants) {
            if (!cp.getUser().getId().equals(currentUserId)) {
                otherUser = cp.getUser();
                break;
            }
        }

        String avatarUrl = null;
        Instant lastSeen = null;
        boolean isOnline = false;
        String kemFingerprint = null;
        boolean verified = false;

        if (otherUser != null) {
            UserProfile profile = userProfileRepository.findByUserId(otherUser.getId()).orElse(null);
            if (profile != null) {
                avatarUrl = profile.getAvatarUrl();
                lastSeen = profile.getLastSeen();
                if (lastSeen != null) {
                    isOnline = Duration.between(lastSeen, Instant.now()).getSeconds() < 120;
                }
            }
            Optional<PublicKey> kemKey = publicKeyRepository.findByUserIdAndKeyTypeAndActiveTrue(otherUser.getId(), "ML_KEM_768");
            kemFingerprint = kemKey.map(PublicKey::getFingerprint).orElse(null);

            Optional<Contact> contact = contactRepository.findByUserIdAndContactUserId(currentUserId, otherUser.getId());
            verified = contact.map(Contact::getVerified).orElse(false);
        }

        // Get last message snippet
        List<Message> latest = messageRepository.findTop50ByConversationIdOrderByCreatedAtAsc(conversation.getId());
        String snippet = "End-to-End Encrypted Message";
        Instant lastTimestamp = conversation.getCreatedAt();
        if (!latest.isEmpty()) {
            Message lastMsg = latest.get(latest.size() - 1);
            lastTimestamp = lastMsg.getCreatedAt();
            snippet = "Encrypted [ML-KEM-768/AES-GCM]";
        }

        return ConversationDto.builder()
                .id(conversation.getId())
                .type(conversation.getType())
                .title(otherUser != null ? otherUser.getFullName() : conversation.getTitle())
                .otherParticipantId(otherUser != null ? otherUser.getId() : null)
                .otherParticipantName(otherUser != null ? otherUser.getFullName() : "Unknown")
                .otherParticipantEmail(otherUser != null ? otherUser.getEmail() : "")
                .otherParticipantAvatar(avatarUrl)
                .otherParticipantKemFingerprint(kemFingerprint)
                .otherParticipantVerified(verified)
                .isOnline(isOnline)
                .lastMessageSnippet(snippet)
                .lastMessageTimestamp(lastTimestamp)
                .unreadCount(0)
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .build();
    }
}
