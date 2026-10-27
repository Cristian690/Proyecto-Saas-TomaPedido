package com.tomapedido.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;

import com.tomapedido.backend.entity.Category;
import com.tomapedido.backend.entity.Tenant;
import com.tomapedido.backend.repository.CategoryRepository;

class CategoryResolutionServiceTest {

    @Test
    void reusesAnEquivalentCategoryWithoutCreatingADuplicate() {
        CategoryRepository categoryRepository = mock(CategoryRepository.class);
        Tenant tenant = Tenant.builder().id(7L).build();
        Category existingCategory = Category.builder()
                .id(3L)
                .name("  OTROS  ")
                .tenant(tenant)
                .build();
        when(categoryRepository.findByTenant(tenant)).thenReturn(List.of(existingCategory));

        CategoryResolutionService service = new CategoryResolutionService(categoryRepository);

        Category result = service.resolveForImportedProduct(tenant, "otros");

        assertEquals(existingCategory, result);
        verify(categoryRepository, never()).save(any(Category.class));
    }

    @Test
    void usesACanonicalOtrosCategoryWhenTheRequestedCategoryDoesNotExist() {
        CategoryRepository categoryRepository = mock(CategoryRepository.class);
        Tenant tenant = Tenant.builder().id(7L).build();
        when(categoryRepository.findByTenant(tenant)).thenReturn(List.of());
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CategoryResolutionService service = new CategoryResolutionService(categoryRepository);

        Category result = service.resolveForImportedProduct(tenant, "Categoría nueva");

        assertEquals("Otros", result.getName());
        assertEquals(tenant, result.getTenant());
    }

    @Test
    void retriesLookupAfterConcurrentNormalizedCategoryCreation() {
        CategoryRepository categoryRepository = mock(CategoryRepository.class);
        Tenant tenant = Tenant.builder().id(7L).build();
        Category concurrentCategory = Category.builder()
                .id(4L)
                .name("otros")
                .tenant(tenant)
                .build();
        when(categoryRepository.findByTenant(tenant))
                .thenReturn(List.of())
                .thenReturn(List.of(concurrentCategory));
        when(categoryRepository.save(any(Category.class)))
                .thenThrow(new DataIntegrityViolationException("normalized name already exists"));

        CategoryResolutionService service = new CategoryResolutionService(categoryRepository);

        Category result = service.resolveForImportedProduct(tenant, "Bebidas");

        assertEquals(concurrentCategory, result);
    }

    @Test
    void neverReusesACategoryFromAnotherTenant() {
        CategoryRepository categoryRepository = mock(CategoryRepository.class);
        Tenant tenant = Tenant.builder().id(7L).build();
        Tenant otherTenant = Tenant.builder().id(8L).build();
        Category otherTenantCategory = Category.builder()
                .id(5L)
                .name("Otros")
                .tenant(otherTenant)
                .build();
        when(categoryRepository.findByTenant(tenant)).thenReturn(List.of(otherTenantCategory));
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CategoryResolutionService service = new CategoryResolutionService(categoryRepository);

        Category result = service.resolveForImportedProduct(tenant, "Bebidas");

        assertEquals("Otros", result.getName());
        assertEquals(tenant, result.getTenant());
        assertNotEquals(otherTenantCategory, result);
    }
}
