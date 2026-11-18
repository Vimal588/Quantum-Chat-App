package com.quantumchat.controller;

import com.quantumchat.dto.UserDto;
import com.quantumchat.dto.UserProfileDto;
import com.quantumchat.security.UserPrincipal;
import com.quantumchat.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        UserDto userDto = userService.getUserDto(principal.getId());
        return ResponseEntity.ok(userDto);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable UUID id) {
        UserDto userDto = userService.getUserDto(id);
        return ResponseEntity.ok(userDto);
    }

    @PutMapping("/profile")
    public ResponseEntity<UserDto> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody UserProfileDto dto) {
        UserDto updated = userService.updateProfile(principal.getId(), dto);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserDto>> searchUsers(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam String query) {
        List<UserDto> results = userService.searchUsers(query, principal.getId());
        return ResponseEntity.ok(results);
    }
}
