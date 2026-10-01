package com.tomapedido.backend.service;

import org.springframework.stereotype.Service;

import com.tomapedido.backend.dto.TrialPeriodResponse;
import com.tomapedido.backend.entity.Tenant;
import com.tomapedido.backend.security.SecurityUtils;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TrialPeriodService {

    private final SecurityUtils securityUtils;
    private final TenantStatusService tenantStatusService;

    public TrialPeriodResponse getTrialPeriod() {

        Tenant tenant = securityUtils.getAuthenticatedUser().getTenant();

        return new TrialPeriodResponse(
                tenant.getTrialStartedAt(),
                tenant.getTrialEndsAt(),
                tenantStatusService.getCurrentStatus(tenant));
    }
}
