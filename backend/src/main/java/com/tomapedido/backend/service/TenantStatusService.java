package com.tomapedido.backend.service;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.tomapedido.backend.entity.Tenant;
import com.tomapedido.backend.entity.TenantStatus;
import com.tomapedido.backend.repository.TenantRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TenantStatusService {

    private final TenantRepository tenantRepository;

    @Transactional
    public TenantStatus getCurrentStatus(Tenant tenant) {

        if (tenant.getStatus() == TenantStatus.ACTIVE) {
            return TenantStatus.ACTIVE;
        }

        TenantStatus currentStatus = tenant.getTrialEndsAt()
                .isAfter(LocalDateTime.now())
                        ? TenantStatus.TRIAL
                        : TenantStatus.EXPIRED;

        if (tenant.getStatus() != currentStatus) {
            tenant.setStatus(currentStatus);
            tenantRepository.save(tenant);
        }

        return currentStatus;
    }

    public boolean isPublicStoreAvailable(Tenant tenant) {
        TenantStatus status = getCurrentStatus(tenant);

        return status == TenantStatus.TRIAL || status == TenantStatus.ACTIVE;
    }

    public void requireAdministrationAllowed(Tenant tenant) {
        if (getCurrentStatus(tenant) == TenantStatus.EXPIRED) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "El período de prueba finalizó");
        }
    }
}
