package com.tomapedido.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.tomapedido.backend.dto.PublicCategoryResponse;
import com.tomapedido.backend.dto.PublicProductResponse;
import com.tomapedido.backend.entity.Tenant;
import com.tomapedido.backend.repository.CategoryRepository;
import com.tomapedido.backend.repository.ProductRepository;
import com.tomapedido.backend.repository.TenantRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PublicStoreService {

    private final TenantRepository tenantRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final TenantStatusService tenantStatusService;

    public List<PublicCategoryResponse> getCategoriesBySlug(String slug) {

        Tenant tenant = tenantRepository.findBySlug(slug)
                .orElseThrow(() ->
                        new IllegalArgumentException("Comercio no encontrado"));

        ensurePublicStoreAvailable(tenant);

        return categoryRepository.findByTenant(tenant)
                .stream()
                .filter(category -> category.isActive())
                .filter(category ->
                        productRepository.findByTenant(tenant)
                                .stream()
                                .anyMatch(product ->
                                        product.isActive()
                                                && product.getCategory().getId()
                                                .equals(category.getId())
                                )
                )
                .map(category -> new PublicCategoryResponse(
                        category.getId(),
                        category.getName(),
                        category.getDescription(),
                        category.getImageUrl()
                ))
                .toList();
    }

    public List<PublicProductResponse> getProductsBySlug(String slug) {

        Tenant tenant = tenantRepository.findBySlug(slug)
                .orElseThrow(() ->
                        new IllegalArgumentException("Comercio no encontrado"));

        ensurePublicStoreAvailable(tenant);

        return productRepository.findByTenant(tenant)
                .stream()
                .filter(product -> product.isActive())
                .map(product -> new PublicProductResponse(
                        product.getId(),
                        product.getName(),
                        product.getDescription(),
                        product.getPrice(),
                        product.getStock(),
                        product.getImageUrl(),
                        product.getCategory().getId()
                ))
                .toList();
    }

    private void ensurePublicStoreAvailable(Tenant tenant) {
        if (!tenantStatusService.isPublicStoreAvailable(tenant)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
    }
}
