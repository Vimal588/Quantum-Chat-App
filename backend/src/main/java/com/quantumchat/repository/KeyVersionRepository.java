package com.quantumchat.repository;

import com.quantumchat.entity.KeyVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KeyVersionRepository extends JpaRepository<KeyVersion, UUID> {
    List<KeyVersion> findByUserIdOrderByVersionDesc(UUID userId);
}
