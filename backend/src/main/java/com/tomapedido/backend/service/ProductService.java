package com.tomapedido.backend.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.tomapedido.backend.dto.CreateImportedProductRequest;
import com.tomapedido.backend.dto.CreateProductRequest;
import com.tomapedido.backend.dto.ProductResponse;
import com.tomapedido.backend.entity.Category;
import com.tomapedido.backend.entity.Product;
import com.tomapedido.backend.entity.Tenant;
import com.tomapedido.backend.repository.ProductRepository;
import com.tomapedido.backend.security.SecurityUtils;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryResolutionService categoryResolutionService;
    private final SecurityUtils securityUtils;
    private final TenantStatusService tenantStatusService;

    private ProductResponse toResponse(Product product) {

        ProductResponse response = new ProductResponse();

        response.setId(product.getId());
        response.setName(product.getName());
        response.setDescription(product.getDescription());
        response.setPrice(product.getPrice());
        response.setStock(product.getStock());
        response.setImageUrl(product.getImageUrl());
        response.setActive(product.isActive());
        response.setCategoryId(product.getCategory().getId());

        return response;
    }

    public ProductResponse createProduct(CreateProductRequest request) {

        Tenant tenant = securityUtils.getAuthenticatedUser().getTenant();
        tenantStatusService.requireAdministrationAllowed(tenant);

        Category category = categoryResolutionService
                .resolveForProduct(tenant, request.getCategoryName());

        Product newProduct = new Product();

        newProduct.setName(request.getName());
        newProduct.setDescription(request.getDescription());
        newProduct.setPrice(request.getPrice());
        newProduct.setStock(request.getStock());
        newProduct.setImageUrl(request.getImageUrl());
        newProduct.setActive(true);
        newProduct.setCategory(category);
        newProduct.setTenant(tenant);

        Product savedProduct = productRepository.save(newProduct);

        return toResponse(savedProduct);
    }

    public ProductResponse createImportedProduct(CreateImportedProductRequest request) {
        Tenant tenant = securityUtils.getAuthenticatedUser().getTenant();
        tenantStatusService.requireAdministrationAllowed(tenant);

        Category category = categoryResolutionService
                .resolveForImportedProduct(tenant, request.getCategoryName());

        Product importedProduct = new Product();
        importedProduct.setName(request.getName());
        importedProduct.setDescription(request.getDescription());
        importedProduct.setPrice(null);
        importedProduct.setStock(0);
        importedProduct.setImageUrl(request.getImageUrl());
        importedProduct.setActive(false);
        importedProduct.setCategory(category);
        importedProduct.setTenant(tenant);

        return toResponse(productRepository.save(importedProduct));
    }

    public ProductResponse getProductById(Long id) {

        Long tenantId = securityUtils.getAuthenticatedTenantId();
        tenantStatusService.requireAdministrationAllowed(
                securityUtils.getAuthenticatedUser().getTenant());

        Product product = productRepository.findById(id)
                .orElseThrow();

        if (!product.getTenant().getId().equals(tenantId)) {
            throw new IllegalArgumentException(
                    "El producto no pertenece al comercio");
        }

        return toResponse(product);
    }

    public List<ProductResponse> getAllProducts() {

        Tenant tenant = securityUtils.getAuthenticatedUser().getTenant();
        tenantStatusService.requireAdministrationAllowed(tenant);

        List<Product> products = productRepository.findByTenant(tenant);

        List<ProductResponse> responses = new ArrayList<>();

        for (Product product : products) {
            responses.add(toResponse(product));
        }

        return responses;
    }

    public ProductResponse updateProduct(
            Long id,
            CreateProductRequest request) {

        Long tenantId = securityUtils.getAuthenticatedTenantId();
        tenantStatusService.requireAdministrationAllowed(
                securityUtils.getAuthenticatedUser().getTenant());

        Product product = productRepository.findById(id)
                .orElseThrow();

        if (!product.getTenant().getId().equals(tenantId)) {
            throw new IllegalArgumentException(
                    "El producto no pertenece al comercio");
        }

        Category category = categoryResolutionService
                .resolveForProduct(product.getTenant(), request.getCategoryName());

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock());
        product.setImageUrl(request.getImageUrl());
        product.setCategory(category);

        productRepository.save(product);

        return toResponse(product);
    }

    public void deleteProduct(Long id) {

        Long tenantId = securityUtils.getAuthenticatedTenantId();
        tenantStatusService.requireAdministrationAllowed(
                securityUtils.getAuthenticatedUser().getTenant());

        Product product = productRepository.findById(id)
                .orElseThrow();

        if (!product.getTenant().getId().equals(tenantId)) {
            throw new IllegalArgumentException(
                    "El producto no pertenece al comercio");
        }

        product.setActive(false);

        productRepository.save(product);
    }

    public void activateProduct(Long id) {

        Long tenantId = securityUtils.getAuthenticatedTenantId();
        tenantStatusService.requireAdministrationAllowed(
                securityUtils.getAuthenticatedUser().getTenant());

        Product product = productRepository.findById(id)
                .orElseThrow();

        if (!product.getTenant().getId().equals(tenantId)) {
            throw new IllegalArgumentException(
                    "El producto no pertenece al comercio");
        }

        if (!hasValidPrice(product)) {
            throw new ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "No se puede activar un producto sin un precio mayor que cero");
        }

        product.setActive(true);

        productRepository.save(product);
    }

    private boolean hasValidPrice(Product product) {
        return product.getPrice() != null
                && product.getPrice().signum() > 0;
    }
}
