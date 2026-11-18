package com.quantumchat.service;

import com.quantumchat.dto.UserDto;
import com.quantumchat.dto.UserProfileDto;
import com.quantumchat.entity.PublicKey;
import com.quantumchat.entity.User;
import com.quantumchat.entity.UserProfile;
import com.quantumchat.exception.ResourceNotFoundException;
import com.quantumchat.repository.PublicKeyRepository;
import com.quantumchat.repository.UserProfileRepository;
import com.quantumchat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PublicKeyRepository publicKeyRepository;

    @Transactional(readOnly = true)
    public UserDto getUserDto(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        Optional<PublicKey> kemKey = publicKeyRepository.findByUserIdAndKeyTypeAndActiveTrue(userId, "ML_KEM_768");
        Optional<PublicKey> dsaKey = publicKeyRepository.findByUserIdAndKeyTypeAndActiveTrue(userId, "ML_DSA_65");

        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .status(user.getStatus())
                .avatarUrl(profile != null ? profile.getAvatarUrl() : null)
                .bio(profile != null ? profile.getBio() : null)
                .lastSeen(profile != null ? profile.getLastSeen() : null)
                .mlKemFingerprint(kemKey.map(PublicKey::getFingerprint).orElse(null))
                .mlDsaFingerprint(dsaKey.map(PublicKey::getFingerprint).orElse(null))
                .keyVersion(kemKey.map(PublicKey::getVersion).orElse(null))
                .build();
    }

    @Transactional
    public UserDto updateProfile(UUID userId, UserProfileDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (dto.getFullName() != null && !dto.getFullName().trim().isEmpty()) {
            user.setFullName(dto.getFullName().trim());
            userRepository.save(user);
        }

        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseGet(() -> UserProfile.builder().user(user).build());

        if (dto.getAvatarUrl() != null) {
            profile.setAvatarUrl(dto.getAvatarUrl());
        }
        if (dto.getBio() != null) {
            profile.setBio(dto.getBio());
        }
        userProfileRepository.save(profile);

        return getUserDto(userId);
    }

    @Transactional(readOnly = true)
    public List<UserDto> searchUsers(String query, UUID currentUserId) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        return userRepository.searchUsers(query.trim()).stream()
                .filter(u -> !u.getId().equals(currentUserId))
                .map(u -> getUserDto(u.getId()))
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateLastSeen(UUID userId) {
        userProfileRepository.findByUserId(userId).ifPresent(p -> {
            p.setLastSeen(Instant.now());
            userProfileRepository.save(p);
        });
    }
}
