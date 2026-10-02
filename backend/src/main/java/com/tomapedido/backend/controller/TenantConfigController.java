package com.tomapedido.backend.controller;

import org.springframework.web.bind.annotation.*;

import com.tomapedido.backend.entity.TenantConfig;
import com.tomapedido.backend.service.TenantConfigService;
import com.tomapedido.backend.dto.BusinessCustomizationRequest;
import com.tomapedido.backend.dto.BusinessStatusRequest;
import com.tomapedido.backend.dto.BusinessConfigRequest;
import com.tomapedido.backend.dto.PublicTenantConfigResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/business")
public class TenantConfigController {

    private final TenantConfigService tenantConfigService;

    public TenantConfigController(TenantConfigService tenantConfigService) {
        this.tenantConfigService = tenantConfigService;
    }

    @PostMapping
    public TenantConfig saveTenantConfig(
            @Valid @RequestBody BusinessConfigRequest request) {
        return tenantConfigService.saveTenantConfig(request);
    }

    @GetMapping("/{slug}")
    public PublicTenantConfigResponse getTenantConfig(@PathVariable String slug) {
        return tenantConfigService.getTenantConfigBySlug(slug);
    }

    @PatchMapping("/status")
    public TenantConfig updateBusinessStatus(
            @Valid @RequestBody BusinessStatusRequest request) {

        return tenantConfigService.updateBusinessStatus(request);
    }

    @PatchMapping("/customization")
    public TenantConfig updateCustomization(
            @Valid @RequestBody BusinessCustomizationRequest request) {

        return tenantConfigService.updateCustomization(request);
    }
}
