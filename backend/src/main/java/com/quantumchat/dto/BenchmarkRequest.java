package com.quantumchat.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BenchmarkRequest {

    @NotBlank(message = "Message text cannot be blank")
    @Builder.Default
    private String message = "Hii";

    @Min(value = 1, message = "Iterations must be at least 1")
    @Max(value = 25, message = "Iterations cannot exceed 25")
    @Builder.Default
    private int iterations = 1;

    @Builder.Default
    private boolean warmup = true;

    // When true, simulates an established session (uses pre-generated keys, measuring steady-state hybrid messaging)
    @Builder.Default
    private boolean keyReuse = false;
}
