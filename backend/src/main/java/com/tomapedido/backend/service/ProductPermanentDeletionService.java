package com.tomapedido.backend.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.tomapedido.backend.entity.Product;
import com.tomapedido.backend.entity.Tenant;
import com.tomapedido.backend.repository.ProductRepository;
import com.tomapedido.backend.security.SecurityUtils;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductPermanentDeletionService {

    private final ProductRepository productRepository;
    private final SecurityUtils securityUtils;
    private final TenantStatusService tenantStatusService;

    @Transactional
    public void permanentlyDeleteProduct(Long productId) {
        Tenant tenant = securityUtils.getAuthenticatedUser().getTenant();
        tenantStatusService.requireAdministrationAllowed(tenant);

        Product product = productRepository
                .findByIdAndTenantIdForUpdate(productId, tenant.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "El producto no pertenece al comercio"));

        productRepository.delete(product);
        productRepository.flush();
    }
}
