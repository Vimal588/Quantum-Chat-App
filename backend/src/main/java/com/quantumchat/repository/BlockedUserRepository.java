package com.quantumchat.repository;

import com.quantumchat.entity.BlockedUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BlockedUserRepository extends JpaRepository<BlockedUser, UUID> {
    List<BlockedUser> findByUserId(UUID userId);
    boolean existsByUserIdAndBlockedUserId(UUID userId, UUID blockedUserId);
    Optional<BlockedUser> findByUserIdAndBlockedUserId(UUID userId, UUID blockedUserId);
}
