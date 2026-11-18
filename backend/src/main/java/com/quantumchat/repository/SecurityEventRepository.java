package com.quantumchat.repository;

import com.quantumchat.entity.SecurityEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SecurityEventRepository extends JpaRepository<SecurityEvent, UUID> {
    List<SecurityEvent> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Page<SecurityEvent> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
    List<SecurityEvent> findTop20ByOrderByCreatedAtDesc();
}
