package com.quantumchat.service;

import com.quantumchat.dto.ContactDto;
import com.quantumchat.entity.*;
import com.quantumchat.exception.BadRequestException;
import com.quantumchat.exception.ResourceNotFoundException;
import com.quantumchat.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContactService {

    private final ContactRepository contactRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PublicKeyRepository publicKeyRepository;
    private final BlockedUserRepository blockedUserRepository;
    private final SecurityEventRepository securityEventRepository;

    @Transactional
    public ContactDto addContact(UUID currentUserId, UUID contactUserId) {
        if (currentUserId.equals(contactUserId)) {
            throw new BadRequestException("You cannot add yourself as a contact.");
        }

        if (blockedUserRepository.existsByUserIdAndBlockedUserId(currentUserId, contactUserId)) {
            throw new BadRequestException("This user is blocked. Unblock them first.");
        }

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        User contactUser = userRepository.findById(contactUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Contact user not found"));

        Contact contact = contactRepository.findByUserIdAndContactUserId(currentUserId, contactUserId)
                .orElseGet(() -> Contact.builder()
                        .user(currentUser)
                        .contactUser(contactUser)
                        .status("ACCEPTED")
                        .verified(false)
                        .build());

        contact = contactRepository.save(contact);

        // Also create reverse contact relationship for reciprocity
        if (!contactRepository.existsByUserIdAndContactUserId(contactUserId, currentUserId)) {
            contactRepository.save(Contact.builder()
                    .user(contactUser)
                    .contactUser(currentUser)
                    .status("ACCEPTED")
                    .verified(false)
                    .build());
        }

        return mapToDto(contact);
    }

    @Transactional(readOnly = true)
    public List<ContactDto> getContacts(UUID currentUserId) {
        return contactRepository.findByUserId(currentUserId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ContactDto verifyContact(UUID currentUserId, UUID contactUserId, String verifiedFingerprint) {
        Contact contact = contactRepository.findByUserIdAndContactUserId(currentUserId, contactUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Contact relationship not found"));

        contact.setVerified(true);
        contact.setSafetyNumberFingerprint(verifiedFingerprint);
        contact = contactRepository.save(contact);

        securityEventRepository.save(SecurityEvent.builder()
                .user(contact.getUser())
                .eventType("CONTACT_VERIFIED")
                .details("Verified cryptographic safety fingerprint for user: " + contact.getContactUser().getEmail())
                .build());

        return mapToDto(contact);
    }

    @Transactional
    public void blockUser(UUID currentUserId, UUID targetUserId) {
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Target user not found"));

        if (!blockedUserRepository.existsByUserIdAndBlockedUserId(currentUserId, targetUserId)) {
            blockedUserRepository.save(BlockedUser.builder()
                    .user(user)
                    .blockedUser(target)
                    .build());
        }

        // Update contact status if exists
        contactRepository.findByUserIdAndContactUserId(currentUserId, targetUserId).ifPresent(c -> {
            c.setStatus("BLOCKED");
            contactRepository.save(c);
        });

        securityEventRepository.save(SecurityEvent.builder()
                .user(user)
                .eventType("USER_BLOCKED")
                .details("Blocked communication with user: " + target.getEmail())
                .build());
    }

    private ContactDto mapToDto(Contact contact) {
        User cu = contact.getContactUser();
        UserProfile profile = userProfileRepository.findByUserId(cu.getId()).orElse(null);
        Optional<PublicKey> kemKey = publicKeyRepository.findByUserIdAndKeyTypeAndActiveTrue(cu.getId(), "ML_KEM_768");
        Optional<PublicKey> dsaKey = publicKeyRepository.findByUserIdAndKeyTypeAndActiveTrue(cu.getId(), "ML_DSA_65");

        boolean isOnline = false;
        if (profile != null && profile.getLastSeen() != null) {
            // Online if active in the last 2 minutes
            isOnline = Duration.between(profile.getLastSeen(), Instant.now()).getSeconds() < 120;
        }

        return ContactDto.builder()
                .contactId(contact.getId())
                .userId(cu.getId())
                .email(cu.getEmail())
                .fullName(cu.getFullName())
                .avatarUrl(profile != null ? profile.getAvatarUrl() : null)
                .status(contact.getStatus())
                .verified(contact.getVerified())
                .safetyNumberFingerprint(contact.getSafetyNumberFingerprint())
                .mlKemPublicKey(kemKey.map(PublicKey::getPublicKey).orElse(null))
                .mlDsaPublicKey(dsaKey.map(PublicKey::getPublicKey).orElse(null))
                .keyVersion(kemKey.map(PublicKey::getVersion).orElse(1))
                .lastSeen(profile != null ? profile.getLastSeen() : null)
                .isOnline(isOnline)
                .build();
    }
}
