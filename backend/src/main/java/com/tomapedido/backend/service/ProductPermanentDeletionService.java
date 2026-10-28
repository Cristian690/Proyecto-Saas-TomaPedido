package com.tomapedido.backend.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.tomapedido.backend.entity.Product;
import com.tomapedido.backend.entity.Tenant;
import com.tomapedido.backend.repository.OrderItemRepository;
import com.tomapedido.backend.repository.ProductRepository;
import com.tomapedido.backend.security.SecurityUtils;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductPermanentDeletionService {

    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;
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

        if (orderItemRepository.existsByProductIdIn(List.of(product.getId()))) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se puede eliminar un producto asociado a pedidos");
        }

        productRepository.delete(product);
        productRepository.flush();
    }
}
