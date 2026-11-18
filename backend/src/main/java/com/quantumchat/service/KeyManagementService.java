package com.quantumchat.service;

import com.quantumchat.crypto.PqcCryptoService;
import com.quantumchat.dto.KeyHistoryResponse;
import com.quantumchat.dto.KeyRegistrationRequest;
import com.quantumchat.dto.PublicKeyResponse;
import com.quantumchat.entity.*;
import com.quantumchat.exception.BadRequestException;
import com.quantumchat.exception.ResourceNotFoundException;
import com.quantumchat.repository.*;
import com.quantumchat.util.CryptoUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KeyManagementService {

    private final PublicKeyRepository publicKeyRepository;
    private final KeyVersionRepository keyVersionRepository;
    private final UserRepository userRepository;
    private final DeviceRepository deviceRepository;
    private final SecurityEventRepository securityEventRepository;
    private final PqcCryptoService pqcCryptoService;

    @Transactional
    public PublicKeyResponse registerOrRotateKeys(UUID userId, KeyRegistrationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Validate ML-KEM-768 public key
        byte[] kemBytes;
        try {
            kemBytes = Base64.getDecoder().decode(request.getMlKemPublicKey().trim());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid Base64 format for ML-KEM-768 public key");
        }

        if (!pqcCryptoService.validateMlKemPublicKey(kemBytes)) {
            throw new BadRequestException("Invalid ML-KEM-768 public key length. Expected 1184 bytes per FIPS 203, got: " + kemBytes.length);
        }

        // Validate optional ML-DSA-65 public key
        byte[] dsaBytes = null;
        if (StringUtils.hasText(request.getMlDsaPublicKey())) {
            try {
                dsaBytes = Base64.getDecoder().decode(request.getMlDsaPublicKey().trim());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid Base64 format for ML-DSA-65 public key");
            }
            if (!pqcCryptoService.validateMlDsaPublicKey(dsaBytes)) {
                throw new BadRequestException("Invalid ML-DSA-65 public key length. Expected 1952 bytes per FIPS 204, got: " + dsaBytes.length);
            }
        }

        String kemFingerprint = CryptoUtils.computeFingerprint(request.getMlKemPublicKey());
        int nextVersion = 1;

        // Check if user already has an active ML-KEM key (Rotation scenario)
        Optional<PublicKey> existingKem = publicKeyRepository.findByUserIdAndKeyTypeAndActiveTrue(userId, "ML_KEM_768");
        if (existingKem.isPresent()) {
            PublicKey oldKey = existingKem.get();
            oldKey.setActive(false);
            publicKeyRepository.save(oldKey);

            // Archive into KeyVersion history
            keyVersionRepository.save(KeyVersion.builder()
                    .user(user)
                    .version(oldKey.getVersion())
                    .keyType("ML_KEM_768")
                    .fingerprint(oldKey.getFingerprint())
                    .build());

            nextVersion = oldKey.getVersion() + 1;

            securityEventRepository.save(SecurityEvent.builder()
                    .user(user)
                    .eventType("KEY_ROTATION")
                    .details("ML-KEM-768 key rotated to version " + nextVersion + ". New fingerprint: " + kemFingerprint)
                    .build());
        }

        // Save new active ML-KEM key
        PublicKey newKemKey = PublicKey.builder()
                .user(user)
                .keyType("ML_KEM_768")
                .publicKey(request.getMlKemPublicKey().trim())
                .fingerprint(kemFingerprint)
                .version(nextVersion)
                .active(true)
                .build();
        publicKeyRepository.save(newKemKey);

        String dsaFingerprint = null;
        if (StringUtils.hasText(request.getMlDsaPublicKey())) {
            dsaFingerprint = CryptoUtils.computeFingerprint(request.getMlDsaPublicKey());
            Optional<PublicKey> existingDsa = publicKeyRepository.findByUserIdAndKeyTypeAndActiveTrue(userId, "ML_DSA_65");
            existingDsa.ifPresent(oldDsa -> {
                oldDsa.setActive(false);
                publicKeyRepository.save(oldDsa);
            });

            PublicKey newDsaKey = PublicKey.builder()
                    .user(user)
                    .keyType("ML_DSA_65")
                    .publicKey(request.getMlDsaPublicKey().trim())
                    .fingerprint(dsaFingerprint)
                    .version(nextVersion)
                    .active(true)
                    .build();
            publicKeyRepository.save(newDsaKey);
        }

        // Update or register Device
        String devName = StringUtils.hasText(request.getDeviceName()) ? request.getDeviceName() : "Web Client";
        Device device = Device.builder()
                .user(user)
                .deviceName(devName)
                .deviceType("BROWSER")
                .publicKeyFingerprint(kemFingerprint)
                .lastActive(Instant.now())
                .build();
        deviceRepository.save(device);

        return PublicKeyResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .mlKemPublicKey(newKemKey.getPublicKey())
                .mlKemFingerprint(newKemKey.getFingerprint())
                .mlDsaPublicKey(request.getMlDsaPublicKey())
                .mlDsaFingerprint(dsaFingerprint)
                .version(newKemKey.getVersion())
                .createdAt(newKemKey.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public PublicKeyResponse getActivePublicKeys(UUID targetUserId) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + targetUserId));

        PublicKey kemKey = publicKeyRepository.findByUserIdAndKeyTypeAndActiveTrue(targetUserId, "ML_KEM_768")
                .orElseThrow(() -> new ResourceNotFoundException("No active ML-KEM-768 public key found for user: " + targetUserId));

        Optional<PublicKey> dsaKey = publicKeyRepository.findByUserIdAndKeyTypeAndActiveTrue(targetUserId, "ML_DSA_65");

        return PublicKeyResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .mlKemPublicKey(kemKey.getPublicKey())
                .mlKemFingerprint(kemKey.getFingerprint())
                .mlDsaPublicKey(dsaKey.map(PublicKey::getPublicKey).orElse(null))
                .mlDsaFingerprint(dsaKey.map(PublicKey::getFingerprint).orElse(null))
                .version(kemKey.getVersion())
                .createdAt(kemKey.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<KeyHistoryResponse> getKeyRotationHistory(UUID userId) {
        return keyVersionRepository.findByUserIdOrderByVersionDesc(userId).stream()
                .map(kv -> KeyHistoryResponse.builder()
                        .id(kv.getId())
                        .version(kv.getVersion())
                        .keyType(kv.getKeyType())
                        .fingerprint(kv.getFingerprint())
                        .rotatedAt(kv.getRotatedAt())
                        .build())
                .collect(Collectors.toList());
    }
}
