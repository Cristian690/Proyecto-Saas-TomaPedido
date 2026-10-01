package com.tomapedido.backend.controller;

import org.springframework.web.bind.annotation.*;

import com.tomapedido.backend.entity.TenantConfig;
import com.tomapedido.backend.service.TenantConfigService;
import com.tomapedido.backend.dto.BusinessCustomizationRequest;
import com.tomapedido.backend.dto.BusinessStatusRequest;
import com.tomapedido.backend.dto.PublicTenantConfigResponse;
//import com.tomapedido.backend.dto.BusinessCustomizationRequest;

@RestController
@RequestMapping("/business")
public class TenantConfigController {

    private final TenantConfigService tenantConfigService;

    public TenantConfigController(TenantConfigService tenantConfigService) {
        this.tenantConfigService = tenantConfigService;
    }

    @PostMapping
    public TenantConfig saveTenantConfig(@RequestBody TenantConfig tenantConfig) {
        return tenantConfigService.saveTenantConfig(tenantConfig);
    }

    @GetMapping("/{slug}")
    public PublicTenantConfigResponse getTenantConfig(@PathVariable String slug) {
        return tenantConfigService.getTenantConfigBySlug(slug);
    }

    @PatchMapping("/status")
    public TenantConfig updateBusinessStatus(
            @RequestBody BusinessStatusRequest request) {

        return tenantConfigService.updateBusinessStatus(request);
    }

    @PatchMapping("/customization")
    public TenantConfig updateCustomization(
            @RequestBody BusinessCustomizationRequest request) {

        return tenantConfigService.updateCustomization(request);
    }
}
