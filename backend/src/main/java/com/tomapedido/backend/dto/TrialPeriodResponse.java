package com.tomapedido.backend.dto;

import java.time.LocalDateTime;

import com.tomapedido.backend.entity.TenantStatus;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TrialPeriodResponse {

    private LocalDateTime trialStartedAt;
    private LocalDateTime trialEndsAt;
    private TenantStatus status;
}
