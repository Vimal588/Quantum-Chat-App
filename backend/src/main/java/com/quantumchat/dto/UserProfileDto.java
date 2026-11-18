package com.quantumchat.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileDto {
    private String fullName;
    private String avatarUrl;
    private String bio;
}
