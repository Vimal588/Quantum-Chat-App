package com.quantumchat.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "key_versions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KeyVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Integer version;

    @Column(name = "key_type", nullable = false, length = 50)
    private String keyType;

    @Column(nullable = false, length = 128)
    private String fingerprint;

    @CreationTimestamp
    @Column(name = "rotated_at", updatable = false)
    private Instant rotatedAt;
}
