package com.quantumchat.service;

import com.quantumchat.dto.AuthResponse;
import com.quantumchat.dto.LoginRequest;
import com.quantumchat.dto.RefreshTokenRequest;
import com.quantumchat.dto.RegisterRequest;
import com.quantumchat.entity.PublicKey;
import com.quantumchat.entity.SecurityEvent;
import com.quantumchat.entity.User;
import com.quantumchat.entity.UserProfile;
import com.quantumchat.exception.BadRequestException;
import com.quantumchat.repository.PublicKeyRepository;
import com.quantumchat.repository.SecurityEventRepository;
import com.quantumchat.repository.UserProfileRepository;
import com.quantumchat.repository.UserRepository;
import com.quantumchat.security.JwtTokenProvider;
import com.quantumchat.util.CryptoUtils;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PublicKeyRepository publicKeyRepository;
    private final SecurityEventRepository securityEventRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("An account with email " + email + " already exists.");
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .status("ACTIVE")
                .build();
        user = userRepository.save(user);

        UserProfile profile = UserProfile.builder()
                .user(user)
                .bio("Secured with Quantum Cryptography")
                .lastSeen(Instant.now())
                .build();
        userProfileRepository.save(profile);

        boolean hasKeys = false;

        // Register initial ML-KEM-768 public key if provided
        if (StringUtils.hasText(request.getMlKemPublicKey())) {
            String fp = CryptoUtils.computeFingerprint(request.getMlKemPublicKey());
            PublicKey kemKey = PublicKey.builder()
                    .user(user)
                    .keyType("ML_KEM_768")
                    .publicKey(request.getMlKemPublicKey().trim())
                    .fingerprint(fp)
                    .version(1)
                    .active(true)
                    .build();
            publicKeyRepository.save(kemKey);
            hasKeys = true;
        }

        // Register initial ML-DSA-65 public key if provided
        if (StringUtils.hasText(request.getMlDsaPublicKey())) {
            String fp = CryptoUtils.computeFingerprint(request.getMlDsaPublicKey());
            PublicKey dsaKey = PublicKey.builder()
                    .user(user)
                    .keyType("ML_DSA_65")
                    .publicKey(request.getMlDsaPublicKey().trim())
                    .fingerprint(fp)
                    .version(1)
                    .active(true)
                    .build();
            publicKeyRepository.save(dsaKey);
        }

        securityEventRepository.save(SecurityEvent.builder()
                .user(user)
                .eventType("USER_REGISTRATION")
                .details("User successfully registered with post-quantum identity.")
                .build());

        String accessToken = tokenProvider.generateToken(user.getId(), user.getEmail());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId(), user.getEmail());

        return AuthResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .hasKeysConfigured(hasKeys)
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));

        // Update last seen
        userProfileRepository.findByUserId(user.getId()).ifPresent(p -> {
            p.setLastSeen(Instant.now());
            userProfileRepository.save(p);
        });

        boolean hasKeys = publicKeyRepository.findByUserIdAndKeyTypeAndActiveTrue(user.getId(), "ML_KEM_768").isPresent();

        securityEventRepository.save(SecurityEvent.builder()
                .user(user)
                .eventType("LOGIN_SUCCESS")
                .details("User successfully authenticated via password & issued JWT session.")
                .build());

        String accessToken = tokenProvider.generateToken(user.getId(), user.getEmail());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId(), user.getEmail());

        return AuthResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .hasKeysConfigured(hasKeys)
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new BadRequestException("Invalid or expired refresh token");
        }

        String email = tokenProvider.getEmailFromToken(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found for token"));

        String newAccessToken = tokenProvider.generateToken(user.getId(), user.getEmail());
        String newRefreshToken = tokenProvider.generateRefreshToken(user.getId(), user.getEmail());
        boolean hasKeys = publicKeyRepository.findByUserIdAndKeyTypeAndActiveTrue(user.getId(), "ML_KEM_768").isPresent();

        return AuthResponse.builder()
                .token(newAccessToken)
                .refreshToken(newRefreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .hasKeysConfigured(hasKeys)
                .build();
    }
}
