package com.tomapedido.backend.controller;

import com.tomapedido.backend.service.TenantService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.tomapedido.backend.dto.TenantResponse;
import com.tomapedido.backend.dto.CreateTenantRequest;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class TenantController {

    private final TenantService tenantService;    

    @GetMapping("/tenants/count")
    public long countTenants() {
        return tenantService.countTenants();
    }

    @GetMapping("/tenants")
    public List<TenantResponse> getAllTenants() {
        return tenantService.getAllTenants();
    }

    @PostMapping("/tenants")
    public TenantResponse createTenant(@Valid @RequestBody CreateTenantRequest request) {
        return tenantService.createTenant(request);
    }

    @GetMapping("/tenants/{id}")
    public TenantResponse getTenantById(@PathVariable Long id) {

        return tenantService.getTenantById(id);

    }

    @PutMapping("/tenants/{id}")
    public TenantResponse updateTenant(
            @PathVariable Long id,
            @Valid @RequestBody CreateTenantRequest request) {

        return tenantService.updateTenant(id, request);

    }

    @DeleteMapping("/tenants/{id}")
    public TenantResponse deleteTenant(@PathVariable Long id) {

        return tenantService.deleteTenant(id);

    }
    
}