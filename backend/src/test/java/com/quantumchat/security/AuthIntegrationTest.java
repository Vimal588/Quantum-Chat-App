package com.quantumchat.security;

import com.quantumchat.dto.AuthResponse;
import com.quantumchat.dto.RegisterRequest;
import com.quantumchat.dto.UserDto;
import com.quantumchat.service.AuthService;
import com.quantumchat.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev-h2")
@Transactional
public class AuthIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    @DisplayName("User Registration, Password Hashing, and JWT Generation Integration Test")
    public void testUserRegistrationAndAuth() {
        String email = "alice.test@quantum.io";
        RegisterRequest req = RegisterRequest.builder()
                .fullName("Alice Researcher")
                .email(email)
                .password("QuantumSecurePassword2026!")
                .build();

        AuthResponse authResponse = authService.register(req);

        assertNotNull(authResponse);
        assertNotNull(authResponse.getToken());
        assertNotNull(authResponse.getRefreshToken());
        assertEquals(email, authResponse.getEmail());
        assertEquals("Alice Researcher", authResponse.getFullName());

        // Validate JWT token
        assertTrue(jwtTokenProvider.validateToken(authResponse.getToken()));
        assertEquals(email, jwtTokenProvider.getEmailFromToken(authResponse.getToken()));
        assertEquals(authResponse.getUserId(), jwtTokenProvider.getUserIdFromToken(authResponse.getToken()));

        // Validate user profile retrieval
        UserDto userDto = userService.getUserDto(authResponse.getUserId());
        assertNotNull(userDto);
        assertEquals("Alice Researcher", userDto.getFullName());
        assertEquals(email, userDto.getEmail());
    }
}
