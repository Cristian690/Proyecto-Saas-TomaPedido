package com.tomapedido.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

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

    public List<PublicCategoryResponse> getCategoriesBySlug(String slug) {

        Tenant tenant = tenantRepository.findBySlug(slug)
                .orElseThrow(() ->
                        new IllegalArgumentException("Comercio no encontrado"));

        return categoryRepository.findByTenant(tenant)
                .stream()
                .filter(category -> category.isActive())
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

        return productRepository.findByTenant(tenant)
                .stream()
                .filter(product -> product.isActive())
                .map(product -> new PublicProductResponse(
                        product.getId(),
                        product.getName(),
                        product.getDescription(),
                        product.getPrice(),
                        product.getImageUrl(),
                        product.getCategory().getId()
                ))
                .toList();
    }
}