package com.tomapedido.backend.service;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import com.tomapedido.backend.entity.Product;
import com.tomapedido.backend.entity.Tenant;
import com.tomapedido.backend.entity.User;
import com.tomapedido.backend.repository.ProductRepository;
import com.tomapedido.backend.security.SecurityUtils;

class ProductPermanentDeletionServiceTest {

    @Test
    void permanentlyDeletesTheAuthenticatedTenantsProduct() {
        Fixture fixture = fixture();
        Product product = Product.builder().id(10L).tenant(fixture.tenant()).build();
        when(fixture.productRepository().findByIdAndTenantIdForUpdate(10L, 7L))
                .thenReturn(Optional.of(product));

        fixture.service().permanentlyDeleteProduct(10L);

        verify(fixture.productRepository()).findByIdAndTenantIdForUpdate(10L, 7L);
        verify(fixture.productRepository()).delete(product);
        verify(fixture.productRepository()).flush();
    }

    @Test
    void rejectsAProductOutsideTheAuthenticatedTenant() {
        Fixture fixture = fixture();
        when(fixture.productRepository().findByIdAndTenantIdForUpdate(10L, 7L))
                .thenReturn(Optional.empty());

        org.springframework.web.server.ResponseStatusException exception = assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> fixture.service().permanentlyDeleteProduct(10L));

        org.junit.jupiter.api.Assertions.assertEquals(
                org.springframework.http.HttpStatus.NOT_FOUND, exception.getStatusCode());
        verify(fixture.productRepository(), never()).delete(org.mockito.ArgumentMatchers.any());
        verify(fixture.productRepository(), never()).flush();
    }

    @Test
    void deletesWithoutLoadingOrderItems() {
        Fixture fixture = fixture();
        Product product = Product.builder().id(10L).tenant(fixture.tenant()).build();
        when(fixture.productRepository().findByIdAndTenantIdForUpdate(10L, 7L))
                .thenReturn(Optional.of(product));

        fixture.service().permanentlyDeleteProduct(10L);

        verify(fixture.productRepository()).delete(product);
        verify(fixture.productRepository()).flush();
    }

    @Test
    void propagatesUnexpectedIntegrityFailuresForTheTransactionalBoundaryToRollBack() throws Exception {
        Fixture fixture = fixture();
        Product product = Product.builder().id(10L).tenant(fixture.tenant()).build();
        when(fixture.productRepository().findByIdAndTenantIdForUpdate(10L, 7L))
                .thenReturn(Optional.of(product));
        DataIntegrityViolationException failure = new DataIntegrityViolationException("integrity failure");
        org.mockito.Mockito.doThrow(failure).when(fixture.productRepository()).flush();

        assertThrows(DataIntegrityViolationException.class,
                () -> fixture.service().permanentlyDeleteProduct(10L));

        assertNotNull(ProductPermanentDeletionService.class
                .getMethod("permanentlyDeleteProduct", Long.class)
                .getAnnotation(Transactional.class));
        verify(fixture.productRepository()).delete(product);
        verify(fixture.productRepository()).flush();
    }

    private Fixture fixture() {
        Tenant tenant = Tenant.builder().id(7L).build();
        ProductRepository productRepository = mock(ProductRepository.class);
        SecurityUtils securityUtils = mock(SecurityUtils.class);
        TenantStatusService tenantStatusService = mock(TenantStatusService.class);
        when(securityUtils.getAuthenticatedUser()).thenReturn(User.builder().tenant(tenant).build());

        return new Fixture(
                new ProductPermanentDeletionService(
                        productRepository,
                        securityUtils,
                        tenantStatusService),
                productRepository,
                tenant);
    }

    private record Fixture(
            ProductPermanentDeletionService service,
            ProductRepository productRepository,
            Tenant tenant) {
    }
}
