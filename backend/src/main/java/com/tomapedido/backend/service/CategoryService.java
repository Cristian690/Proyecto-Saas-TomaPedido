package com.tomapedido.backend.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.tomapedido.backend.dto.CategoryResponse;
import com.tomapedido.backend.dto.CreateCategoryRequest;
import com.tomapedido.backend.entity.Category;
import com.tomapedido.backend.entity.Tenant;
import com.tomapedido.backend.repository.CategoryRepository;
import com.tomapedido.backend.security.SecurityUtils;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final SecurityUtils securityUtils;

    public CategoryResponse createCategory(CreateCategoryRequest request) {

        Tenant tenant = securityUtils.getAuthenticatedUser().getTenant();

        Category nuevaCategoria = new Category();

        nuevaCategoria.setName(request.getName());
        nuevaCategoria.setDescription(request.getDescription());
        nuevaCategoria.setImageUrl(request.getImageUrl());
        nuevaCategoria.setActive(true);
        nuevaCategoria.setTenant(tenant);

        Category savedCategory = categoryRepository.save(nuevaCategoria);

        return toResponse(savedCategory);
    }

    public CategoryResponse getCategoryById(Long id) {

        Long tenantId = securityUtils.getAuthenticatedTenantId();

        Category category = categoryRepository.findById(id)
                .orElseThrow();

        if (!category.getTenant().getId().equals(tenantId)) {
            throw new IllegalArgumentException("La categoría no pertenece al comercio");
        }

        return toResponse(category);
    }

    public List<CategoryResponse> getAllCategories() {

        Tenant tenant = securityUtils.getAuthenticatedUser().getTenant();

        List<Category> categories = categoryRepository.findByTenant(tenant);

        List<CategoryResponse> responses = new ArrayList<>();

        for (Category category : categories) {
            responses.add(toResponse(category));
        }

        return responses;
    }

    public CategoryResponse updateCategory(
            Long id,
            CreateCategoryRequest request) {

        Long tenantId = securityUtils.getAuthenticatedTenantId();

        Category category = categoryRepository.findById(id)
                .orElseThrow();

        if (!category.getTenant().getId().equals(tenantId)) {
            throw new IllegalArgumentException("La categoría no pertenece al comercio");
        }

        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setImageUrl(request.getImageUrl());

        categoryRepository.save(category);

        return toResponse(category);
    }

    public void deleteCategory(Long id) {

        Long tenantId = securityUtils.getAuthenticatedTenantId();

        Category category = categoryRepository.findById(id)
                .orElseThrow();

        if (!category.getTenant().getId().equals(tenantId)) {
            throw new IllegalArgumentException("La categoría no pertenece al comercio");
        }

        category.setActive(false);

        categoryRepository.save(category);
    }

    private CategoryResponse toResponse(Category category) {

        CategoryResponse categoryResponse = new CategoryResponse();

        categoryResponse.setId(category.getId());
        categoryResponse.setName(category.getName());
        categoryResponse.setDescription(category.getDescription());
        categoryResponse.setImageUrl(category.getImageUrl());
        categoryResponse.setActive(category.isActive());
        categoryResponse.setTenantId(category.getTenant().getId());

        return categoryResponse;
    }

    public void activateCategory(Long id) {

        Long tenantId = securityUtils.getAuthenticatedTenantId();

        Category category = categoryRepository.findById(id)
                .orElseThrow();

        if (!category.getTenant().getId().equals(tenantId)) {
            throw new IllegalArgumentException(
                    "La categoría no pertenece al comercio");
        }

        category.setActive(true);

        categoryRepository.save(category);
    }
}