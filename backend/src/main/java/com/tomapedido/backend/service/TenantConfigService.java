package com.tomapedido.backend.service;

import org.springframework.stereotype.Service;

import com.tomapedido.backend.entity.Tenant;
import com.tomapedido.backend.entity.TenantConfig;
import com.tomapedido.backend.repository.TenantConfigRepository;
import com.tomapedido.backend.repository.TenantRepository;
import com.tomapedido.backend.security.SecurityUtils;
import com.tomapedido.backend.dto.BusinessStatusRequest;
import com.tomapedido.backend.dto.BusinessCustomizationRequest;

@Service
public class TenantConfigService {

    private final TenantConfigRepository tenantConfigRepository;
    private final TenantRepository tenantRepository;
    private final SecurityUtils securityUtils;

    public TenantConfigService(
            TenantConfigRepository tenantConfigRepository,
            TenantRepository tenantRepository,
            SecurityUtils securityUtils) {

        this.tenantConfigRepository = tenantConfigRepository;
        this.tenantRepository = tenantRepository;
        this.securityUtils = securityUtils;
    }

    public TenantConfig getTenantConfigBySlug(String slug) {

        Tenant tenant = tenantRepository.findBySlug(slug)
                .orElse(null);

        if (tenant == null) {
            return null;
        }

        return tenantConfigRepository.findByTenant(tenant)
                .orElse(null);
    }

    public TenantConfig saveTenantConfig(TenantConfig tenantConfig) {

        Tenant tenant = securityUtils.getAuthenticatedUser().getTenant();

        return tenantConfigRepository.findByTenant(tenant)
                .map(existingTenantConfig -> {

                    existingTenantConfig.setName(tenantConfig.getName());
                    existingTenantConfig.setWhatsapp(tenant.getPhone());
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

        TenantConfig config = tenantConfigRepository.findByTenant(tenant)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "El comercio todavía no tiene configuración"));

        if (request.getLogoUrl() != null) {
            config.setLogoUrl(request.getLogoUrl());
        }

        if (request.getBackgroundColor() != null) {
            config.setBackgroundColor(request.getBackgroundColor());
        }

        if (request.getPrimaryColor() != null) {
            config.setPrimaryColor(request.getPrimaryColor());
        }

        return tenantConfigRepository.save(config);
    }
}