package com.tomapedido.backend.service;

import com.tomapedido.backend.repository.TenantRepository;
import org.springframework.stereotype.Service;
import com.tomapedido.backend.dto.CreateTenantRequest;
import com.tomapedido.backend.dto.TenantResponse;
import com.tomapedido.backend.entity.Tenant;
import java.util.List;
import java.util.ArrayList;

@Service
public class TenantService {
    
    private final TenantRepository tenantRepository;

    public TenantService(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
        
    }    

    public long countTenants() {
        return tenantRepository.count();
    }

    public TenantResponse createTenant(CreateTenantRequest request) {

        Tenant tenant = new Tenant();

        tenant.setBusinessName(request.getBusinessName());
        tenant.setSlug(request.getSlug());
        tenant.setEmail(request.getEmail());
        tenant.setPhone(request.getPhone());
        tenant.setActive(true);

        Tenant savedTenant = tenantRepository.save(tenant);

        return toResponse(savedTenant);

    }

    public TenantResponse getTenantById(Long id) {
        Tenant tenant = tenantRepository.findById(id).orElseThrow();

        return toResponse(tenant);
    }

    private TenantResponse toResponse(Tenant tenant) {

        TenantResponse response = new TenantResponse();

        response.setId(tenant.getId());
        response.setBusinessName(tenant.getBusinessName());
        response.setSlug(tenant.getSlug());
        response.setEmail(tenant.getEmail());
        response.setPhone(tenant.getPhone());
        response.setActive(tenant.getActive());

        return response;
    }

    public List<TenantResponse> getAllTenants(){


        List<Tenant> tenants = tenantRepository.findAll();

        List<TenantResponse> response = new ArrayList<>();

        for (Tenant tenant : tenants) {
            response.add(toResponse(tenant));
        }

        return response;
    }

    public TenantResponse updateTenant(Long id, CreateTenantRequest request) {

        Tenant tenant = tenantRepository.findById(id).orElseThrow();

        tenant.setBusinessName(request.getBusinessName());
        tenant.setSlug(request.getSlug());
        tenant.setEmail(request.getEmail());
        tenant.setPhone(request.getPhone());

        Tenant updatedTenant = tenantRepository.save(tenant);

        return toResponse(updatedTenant);
    }

    public TenantResponse deleteTenant(Long id) {


        Tenant tenant = tenantRepository.findById(id).orElseThrow();

        tenant.setActive(false);

        Tenant updatedTenant = tenantRepository.save(tenant);

        return toResponse(updatedTenant);
    }
    
}