package com.quantumchat.controller;

import com.quantumchat.dto.SecurityDashboardDto;
import com.quantumchat.security.UserPrincipal;
import com.quantumchat.service.SecurityDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/security")
@RequiredArgsConstructor
public class SecurityDashboardController {

    private final SecurityDashboardService securityDashboardService;

    @GetMapping("/status")
    public ResponseEntity<SecurityDashboardDto> getSecurityStatus(@AuthenticationPrincipal UserPrincipal principal) {
        SecurityDashboardDto dashboard = securityDashboardService.getDashboard(principal.getId());
        return ResponseEntity.ok(dashboard);
    }
}
