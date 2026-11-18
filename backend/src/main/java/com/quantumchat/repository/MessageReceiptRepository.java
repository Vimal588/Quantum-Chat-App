package com.quantumchat.repository;

import com.quantumchat.entity.MessageReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MessageReceiptRepository extends JpaRepository<MessageReceipt, UUID> {
    List<MessageReceipt> findByMessageId(UUID messageId);
    Optional<MessageReceipt> findByMessageIdAndUserId(UUID messageId, UUID userId);
}
