package com.quantumchat.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(name = "ciphertext", nullable = false, columnDefinition = "TEXT")
    private String ciphertext;

    @Column(name = "nonce", nullable = false, length = 64)
    private String nonce;

    @Column(name = "kem_ciphertext", columnDefinition = "TEXT")
    private String kemCiphertext;

    @Column(name = "algorithm_version", nullable = false, length = 50)
    @Builder.Default
    private String algorithmVersion = "MLKEM768-AES256GCM";

    @Column(name = "key_version", nullable = false)
    @Builder.Default
    private Integer keyVersion = 1;

    @Column(name = "message_type", length = 50)
    @Builder.Default
    private String messageType = "TEXT"; // TEXT, FILE, SYSTEM

    @Column(name = "delivery_status", length = 50)
    @Builder.Default
    private String deliveryStatus = "SENT"; // SENT, DELIVERED, READ

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "is_expired")
    @Builder.Default
    private Boolean isExpired = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
