package com.quantumchat.controller;

import com.quantumchat.crypto.CryptoBenchmarkService;
import com.quantumchat.dto.BenchmarkRequest;
import com.quantumchat.dto.BenchmarkResponse;
import com.quantumchat.dto.BenchmarkSummaryDto;
import com.quantumchat.entity.BenchmarkRun;
import com.quantumchat.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/benchmark")
@RequiredArgsConstructor
public class BenchmarkController {

    private final CryptoBenchmarkService cryptoBenchmarkService;

    @PostMapping("/compare")
    public ResponseEntity<BenchmarkResponse> runComparison(
            @Valid @RequestBody(required = false) BenchmarkRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (request == null) {
            request = BenchmarkRequest.builder().message("Hii").iterations(1).warmup(true).build();
        }
        UUID userId = (principal != null) ? principal.getId() : null;
        BenchmarkResponse response = cryptoBenchmarkService.runBenchmark(request, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/summary")
    public ResponseEntity<BenchmarkSummaryDto> getSummary() {
        BenchmarkSummaryDto summary = cryptoBenchmarkService.getSummary();
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/history")
    public ResponseEntity<List<BenchmarkRun>> getHistory(
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = (principal != null) ? principal.getId() : null;
        List<BenchmarkRun> history = cryptoBenchmarkService.getHistory(userId);
        return ResponseEntity.ok(history);
    }
}
