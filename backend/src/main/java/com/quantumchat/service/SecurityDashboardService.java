package com.quantumchat.service;

import com.quantumchat.dto.SecurityDashboardDto;
import com.quantumchat.entity.Contact;
import com.quantumchat.entity.PublicKey;
import com.quantumchat.entity.SecurityEvent;
import com.quantumchat.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SecurityDashboardService {

    private final PublicKeyRepository publicKeyRepository;
    private final DeviceRepository deviceRepository;
    private final ContactRepository contactRepository;
    private final SecurityEventRepository securityEventRepository;

    @Value("${app.crypto.kem-algorithm:ML-KEM-768}")
    private String kemAlgorithm;

    @Value("${app.crypto.dsa-algorithm:ML-DSA-65}")
    private String dsaAlgorithm;

    @Value("${app.crypto.symmetric-algorithm:AES-256-GCM}")
    private String symmetricAlgorithm;

    @Value("${app.crypto.kdf-algorithm:HKDF-SHA-256}")
    private String kdfAlgorithm;

    @Transactional(readOnly = true)
    public SecurityDashboardDto getDashboard(UUID userId) {
        Optional<PublicKey> kemKey = publicKeyRepository.findByUserIdAndKeyTypeAndActiveTrue(userId, "ML_KEM_768");
        Optional<PublicKey> dsaKey = publicKeyRepository.findByUserIdAndKeyTypeAndActiveTrue(userId, "ML_DSA_65");

        int activeDevices = deviceRepository.findByUserId(userId).size();
        List<Contact> contacts = contactRepository.findByUserId(userId);
        long verifiedContacts = contacts.stream().filter(c -> Boolean.TRUE.equals(c.getVerified())).count();

        List<SecurityEvent> events = securityEventRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<SecurityDashboardDto.SecurityEventDto> eventDtos = events.stream()
                .limit(10)
                .map(e -> SecurityDashboardDto.SecurityEventDto.builder()
                        .id(e.getId())
                        .eventType(e.getEventType())
                        .details(e.getDetails())
                        .timestamp(e.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return SecurityDashboardDto.builder()
                .kemAlgorithm(kemAlgorithm)
                .dsaAlgorithm(dsaAlgorithm)
                .symmetricAlgorithm(symmetricAlgorithm)
                .kdfAlgorithm(kdfAlgorithm)
                .userMlKemFingerprint(kemKey.map(PublicKey::getFingerprint).orElse(null))
                .userMlDsaFingerprint(dsaKey.map(PublicKey::getFingerprint).orElse(null))
                .keyVersion(kemKey.map(PublicKey::getVersion).orElse(1))
                .keyCreatedAt(kemKey.map(PublicKey::getCreatedAt).orElse(null))
                .activeDevicesCount(Math.max(activeDevices, 1))
                .verifiedContactsCount((int) verifiedContacts)
                .totalContactsCount(contacts.size())
                .recentSecurityEvents(eventDtos)
                .build();
    }
}
