package com.tomapedido.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.tomapedido.backend.entity.Tenant;
import com.tomapedido.backend.entity.TenantConfig;
import com.tomapedido.backend.repository.TenantConfigRepository;
import com.tomapedido.backend.repository.TenantRepository;
import com.tomapedido.backend.security.SecurityUtils;
import com.tomapedido.backend.dto.BusinessStatusRequest;
import com.tomapedido.backend.dto.BusinessCustomizationRequest;
import com.tomapedido.backend.dto.PublicTenantConfigResponse;

@Service
public class TenantConfigService {

    private final TenantConfigRepository tenantConfigRepository;
    private final TenantRepository tenantRepository;
    private final SecurityUtils securityUtils;
    private final TenantStatusService tenantStatusService;

    public TenantConfigService(
            TenantConfigRepository tenantConfigRepository,
            TenantRepository tenantRepository,
            SecurityUtils securityUtils,
            TenantStatusService tenantStatusService) {

        this.tenantConfigRepository = tenantConfigRepository;
        this.tenantRepository = tenantRepository;
        this.securityUtils = securityUtils;
        this.tenantStatusService = tenantStatusService;
    }

    public PublicTenantConfigResponse getTenantConfigBySlug(String slug) {

        Tenant tenant = tenantRepository.findBySlug(slug)
                .orElse(null);

        if (tenant == null) {
            return null;
        }

        if (!tenantStatusService.isPublicStoreAvailable(tenant)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        return tenantConfigRepository.findByTenant(tenant)
                .map(this::toPublicResponse)
                .orElse(null);
    }

    private PublicTenantConfigResponse toPublicResponse(TenantConfig config) {
        return new PublicTenantConfigResponse(
                config.getId(),
                config.getName(),
                config.getWhatsapp(),
                config.getLogoUrl(),
                config.getCoverUrl(),
                config.getPrimaryColor(),
                config.getBackgroundColor(),
                config.getWelcomeMessage(),
                config.getAddress(),
                config.isOpen());
    }

    public TenantConfig saveTenantConfig(TenantConfig tenantConfig) {

        Tenant tenant = securityUtils.getAuthenticatedUser().getTenant();
        tenantStatusService.requireAdministrationAllowed(tenant);

        return tenantConfigRepository.findByTenant(tenant)
                .map(existingTenantConfig -> {

                    existingTenantConfig.setName(tenantConfig.getName());
                    existingTenantConfig.setWhatsapp(tenantConfig.getWhatsapp());
                    existingTenantConfig.setLogoUrl(tenantConfig.getLogoUrl());
                    existingTenantConfig.setCoverUrl(tenantConfig.getCoverUrl());
                    existingTenantConfig.setPrimaryColor(tenantConfig.getPrimaryColor());
                    existingTenantConfig.setBackgroundColor(tenantConfig.getBackgroundColor());
                    existingTenantConfig.setWelcomeMessage(tenantConfig.getWelcomeMessage());
                    existingTenantConfig.setAddress(tenantConfig.getAddress());                    

                    return tenantConfigRepository.save(existingTenantConfig);
                })
                .orElseGet(() -> {

                    tenantConfig.setTenant(tenant);

                    return tenantConfigRepository.save(tenantConfig);
                });
    }

    public TenantConfig updateBusinessStatus(BusinessStatusRequest request) {

        Tenant tenant = securityUtils.getAuthenticatedUser().getTenant();
        tenantStatusService.requireAdministrationAllowed(tenant);

        TenantConfig config = tenantConfigRepository.findByTenant(tenant)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "El comercio todavía no tiene configuración"));

        config.setOpen(request.isOpen());

        return tenantConfigRepository.save(config);
    }

    public TenantConfig updateCustomization(
            BusinessCustomizationRequest request) {

        Tenant tenant = securityUtils.getAuthenticatedUser().getTenant();
        tenantStatusService.requireAdministrationAllowed(tenant);

        TenantConfig config = tenantConfigRepository.findByTenant(tenant)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "El comercio todavía no tiene configuración"));

        if (request.getLogoUrl() != null) {
            config.setLogoUrl(request.getLogoUrl());
        }

        if (request.getCoverUrl() != null) {
            config.setCoverUrl(request.getCoverUrl());
        }

        if (request.getBackgroundColor() != null) {
            config.setBackgroundColor(request.getBackgroundColor());
        }

        if (request.getPrimaryColor() != null) {
            config.setPrimaryColor(request.getPrimaryColor());
        }

        if (request.getWelcomeMessage() != null) {
            config.setWelcomeMessage(request.getWelcomeMessage());
        }

        return tenantConfigRepository.save(config);
    }
}
