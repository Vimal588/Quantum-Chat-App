package com.quantumchat.controller;

import com.quantumchat.dto.ContactDto;
import com.quantumchat.security.UserPrincipal;
import com.quantumchat.service.ContactService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;

    @GetMapping
    public ResponseEntity<List<ContactDto>> getContacts(@AuthenticationPrincipal UserPrincipal principal) {
        List<ContactDto> contacts = contactService.getContacts(principal.getId());
        return ResponseEntity.ok(contacts);
    }

    @PostMapping("/add/{contactUserId}")
    public ResponseEntity<ContactDto> addContact(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID contactUserId) {
        ContactDto contact = contactService.addContact(principal.getId(), contactUserId);
        return ResponseEntity.ok(contact);
    }

    @PostMapping("/verify/{contactUserId}")
    public ResponseEntity<ContactDto> verifyContact(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID contactUserId,
            @RequestBody VerifyRequest request) {
        ContactDto contact = contactService.verifyContact(principal.getId(), contactUserId, request.getFingerprint());
        return ResponseEntity.ok(contact);
    }

    @PostMapping("/block/{targetUserId}")
    public ResponseEntity<Void> blockUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID targetUserId) {
        contactService.blockUser(principal.getId(), targetUserId);
        return ResponseEntity.ok().build();
    }

    @Data
    public static class VerifyRequest {
        private String fingerprint;
    }
}
