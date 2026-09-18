package com.tomapedido.backend.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.tomapedido.backend.dto.CreateProductRequest;
import com.tomapedido.backend.dto.ProductResponse;
import com.tomapedido.backend.entity.Category;
import com.tomapedido.backend.entity.Product;
import com.tomapedido.backend.entity.Tenant;
import com.tomapedido.backend.repository.CategoryRepository;
import com.tomapedido.backend.repository.ProductRepository;
import com.tomapedido.backend.security.SecurityUtils;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SecurityUtils securityUtils;

    private ProductResponse toResponse(Product product) {

        ProductResponse response = new ProductResponse();

        response.setId(product.getId());
        response.setName(product.getName());
        response.setDescription(product.getDescription());
        response.setPrice(product.getPrice());
        response.setImageUrl(product.getImageUrl());    
        response.setActive(product.isActive());
        response.setCategoryId(product.getCategory().getId());

        return response;
    }

    public ProductResponse createProduct(CreateProductRequest request) {

        Tenant tenant = securityUtils.getAuthenticatedUser().getTenant();

        Category category = categoryRepository
                .findByNameAndTenant(request.getCategoryName(), tenant)
                .orElseGet(() -> {

                    Category newCategory = new Category();

                    newCategory.setName(request.getCategoryName());
                    newCategory.setDescription("");
                    newCategory.setActive(true);
                    newCategory.setTenant(tenant);

                    return categoryRepository.save(newCategory);
                });

        Product newProduct = new Product();

        newProduct.setName(request.getName());
        newProduct.setDescription(request.getDescription());
        newProduct.setPrice(request.getPrice());
        newProduct.setImageUrl(request.getImageUrl());
        newProduct.setActive(true);
        newProduct.setCategory(category);
        newProduct.setTenant(tenant);

        Product savedProduct = productRepository.save(newProduct);

        return toResponse(savedProduct);
    }

    public ProductResponse getProductById(Long id) {

        Long tenantId = securityUtils.getAuthenticatedTenantId();

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

        Product product = productRepository.findById(id)
                .orElseThrow();

        if (!product.getTenant().getId().equals(tenantId)) {
            throw new IllegalArgumentException(
                    "El producto no pertenece al comercio");
        }

        Category category = categoryRepository
        .findByNameAndTenant(request.getCategoryName(), product.getTenant())
        .orElseGet(() -> {

            Category newCategory = new Category();

            newCategory.setName(request.getCategoryName());
            newCategory.setDescription("");
            newCategory.setActive(true);
            newCategory.setTenant(product.getTenant());

            return categoryRepository.save(newCategory);
        });

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setImageUrl(request.getImageUrl());
        product.setCategory(category);

        productRepository.save(product);

        return toResponse(product);
    }

    public void deleteProduct(Long id) {

        Long tenantId = securityUtils.getAuthenticatedTenantId();

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

        Product product = productRepository.findById(id)
                .orElseThrow();

        if (!product.getTenant().getId().equals(tenantId)) {
            throw new IllegalArgumentException(
                    "El producto no pertenece al comercio");
        }

        product.setActive(true);

        productRepository.save(product);
    }
}