package com.quantumchat.repository;

import com.quantumchat.entity.PublicKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PublicKeyRepository extends JpaRepository<PublicKey, UUID> {
    Optional<PublicKey> findByUserIdAndKeyTypeAndActiveTrue(UUID userId, String keyType);
    List<PublicKey> findByUserIdAndActiveTrue(UUID userId);
    List<PublicKey> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
