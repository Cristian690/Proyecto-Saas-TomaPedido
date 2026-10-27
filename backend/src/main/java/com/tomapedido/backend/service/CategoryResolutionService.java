package com.tomapedido.backend.service;

import java.util.List;
import java.util.Objects;

import org.springframework.http.HttpStatus;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.tomapedido.backend.entity.Category;
import com.tomapedido.backend.entity.Tenant;
import com.tomapedido.backend.repository.CategoryRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CategoryResolutionService {

    private static final String FALLBACK_CATEGORY_NAME = "Otros";

    private final CategoryRepository categoryRepository;

    public Category resolveForProduct(Tenant tenant, String requestedName) {
        String canonicalName = canonicalizeName(requestedName);

        return findEquivalent(tenant, canonicalName)
                .orElseGet(() -> createOrResolveConcurrentCategory(
                        tenant, canonicalName, "", null));
    }

    public Category resolveForImportedProduct(Tenant tenant, String requestedName) {
        String canonicalName = canonicalizeName(requestedName);

        return findEquivalent(tenant, canonicalName)
                .orElseGet(() -> resolveFallbackCategory(tenant));
    }

    public Category resolveExistingForProduct(Tenant tenant, String requestedName) {
        String canonicalName = canonicalizeName(requestedName);

        return findEquivalent(tenant, canonicalName)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNPROCESSABLE_ENTITY,
                        "La categoría no existe en este comercio"));
    }

    public Category resolveForCategoryCreation(
            Tenant tenant,
            String requestedName,
            String description,
            String imageUrl) {
        String canonicalName = canonicalizeName(requestedName);

        return findEquivalent(tenant, canonicalName)
                .orElseGet(() -> createOrResolveConcurrentCategory(
                        tenant,
                        canonicalName,
                        description,
                        imageUrl));
    }

    public String canonicalizeName(String name) {
        return name.trim().replaceAll("\\s+", " ");
    }

    public void ensureNameIsAvailable(Tenant tenant, String requestedName, Long currentCategoryId) {
        findEquivalent(tenant, canonicalizeName(requestedName))
                .filter(category -> !category.getId().equals(currentCategoryId))
                .ifPresent(category -> {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "Ya existe una categoría equivalente en este comercio");
                });
    }

    private Category resolveFallbackCategory(Tenant tenant) {
        return findEquivalent(tenant, FALLBACK_CATEGORY_NAME)
                .orElseGet(() -> createOrResolveConcurrentCategory(
                        tenant,
                        FALLBACK_CATEGORY_NAME,
                        "",
                        null));
    }

    private java.util.Optional<Category> findEquivalent(Tenant tenant, String canonicalName) {
        List<Category> matches = categoryRepository.findByTenant(tenant)
                .stream()
                .filter(category -> belongsToTenant(category, tenant))
                .filter(category -> normalizeName(category.getName())
                        .equals(normalizeName(canonicalName)))
                .toList();

        if (matches.size() > 1) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Hay categorías equivalentes duplicadas en este comercio");
        }

        return matches.stream().findFirst();
    }

    private Category createOrResolveConcurrentCategory(
            Tenant tenant,
            String name,
            String description,
            String imageUrl) {
        try {
            return createCategory(tenant, name, description, imageUrl);
        } catch (DataIntegrityViolationException exception) {
            return findEquivalent(tenant, name).orElseThrow(() -> exception);
        }
    }

    private Category createCategory(
            Tenant tenant,
            String name,
            String description,
            String imageUrl) {
        Category category = new Category();
        category.setName(name);
        category.setDescription(description);
        category.setImageUrl(imageUrl);
        category.setActive(true);
        category.setTenant(tenant);

        return categoryRepository.save(category);
    }

    private String normalizeName(String name) {
        return canonicalizeName(name).toLowerCase(java.util.Locale.ROOT);
    }

    private boolean belongsToTenant(Category category, Tenant tenant) {
        return category.getTenant() != null
                && Objects.equals(category.getTenant().getId(), tenant.getId());
    }
}
