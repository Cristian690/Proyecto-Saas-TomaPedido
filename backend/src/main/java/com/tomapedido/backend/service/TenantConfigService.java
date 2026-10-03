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
import com.tomapedido.backend.dto.BusinessConfigRequest;
import com.tomapedido.backend.dto.BusinessConfigResponse;
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

    private BusinessConfigResponse toBusinessConfigResponse(TenantConfig config) {
        return new BusinessConfigResponse(
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

    public BusinessConfigResponse saveTenantConfig(BusinessConfigRequest request) {

        Tenant tenant = securityUtils.getAuthenticatedUser().getTenant();
        tenantStatusService.requireAdministrationAllowed(tenant);

        TenantConfig savedConfig = tenantConfigRepository.findByTenant(tenant)
                .map(existingTenantConfig -> {

                    existingTenantConfig.setName(request.getName());
                    existingTenantConfig.setWhatsapp(request.getWhatsapp());
                    existingTenantConfig.setLogoUrl(request.getLogoUrl());
                    existingTenantConfig.setCoverUrl(request.getCoverUrl());
                    existingTenantConfig.setPrimaryColor(request.getPrimaryColor());
                    existingTenantConfig.setBackgroundColor(request.getBackgroundColor());
                    existingTenantConfig.setWelcomeMessage(request.getWelcomeMessage());
                    existingTenantConfig.setAddress(request.getAddress());

                    return tenantConfigRepository.save(existingTenantConfig);
                })
                .orElseGet(() -> {

                    TenantConfig tenantConfig = new TenantConfig();

                    tenantConfig.setName(request.getName());
                    tenantConfig.setWhatsapp(request.getWhatsapp());
                    tenantConfig.setLogoUrl(request.getLogoUrl());
                    tenantConfig.setCoverUrl(request.getCoverUrl());
                    tenantConfig.setPrimaryColor(request.getPrimaryColor());
                    tenantConfig.setBackgroundColor(request.getBackgroundColor());
                    tenantConfig.setWelcomeMessage(request.getWelcomeMessage());
                    tenantConfig.setAddress(request.getAddress());
                    tenantConfig.setOpen(request.isOpen());
                    tenantConfig.setTenant(tenant);

                    return tenantConfigRepository.save(tenantConfig);
                });

        return toBusinessConfigResponse(savedConfig);
    }

    public BusinessConfigResponse updateBusinessStatus(BusinessStatusRequest request) {

        Tenant tenant = securityUtils.getAuthenticatedUser().getTenant();
        tenantStatusService.requireAdministrationAllowed(tenant);

        TenantConfig config = tenantConfigRepository.findByTenant(tenant)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "El comercio todavía no tiene configuración"));

        config.setOpen(request.getOpen());

        return toBusinessConfigResponse(tenantConfigRepository.save(config));
    }

    public BusinessConfigResponse updateCustomization(
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

        return toBusinessConfigResponse(tenantConfigRepository.save(config));
    }
}
