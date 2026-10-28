package com.tomapedido.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.tomapedido.backend.entity.Product;
import com.tomapedido.backend.entity.Tenant;
import com.tomapedido.backend.entity.User;
import com.tomapedido.backend.repository.OrderItemRepository;
import com.tomapedido.backend.repository.ProductRepository;
import com.tomapedido.backend.security.SecurityUtils;

class ProductPermanentDeletionServiceTest {

    @Test
    void permanentlyDeletesOnlyTheAuthenticatedTenantsProductWithoutOrders() {
        Fixture fixture = fixture();
        Product product = Product.builder().id(10L).tenant(fixture.tenant()).build();
        when(fixture.productRepository().findByIdAndTenantIdForUpdate(10L, 7L))
                .thenReturn(Optional.of(product));
        when(fixture.orderItemRepository().existsByProductIdIn(List.of(10L)))
                .thenReturn(false);

        fixture.service().permanentlyDeleteProduct(10L);

        verify(fixture.productRepository()).findByIdAndTenantIdForUpdate(10L, 7L);
        verify(fixture.orderItemRepository()).existsByProductIdIn(List.of(10L));
        verify(fixture.productRepository()).delete(product);
        verify(fixture.productRepository()).flush();
    }

    @Test
    void rejectsAProductOutsideTheAuthenticatedTenant() {
        Fixture fixture = fixture();
        when(fixture.productRepository().findByIdAndTenantIdForUpdate(10L, 7L))
                .thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> fixture.service().permanentlyDeleteProduct(10L));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        verifyNoInteractions(fixture.orderItemRepository());
        verify(fixture.productRepository(), never()).delete(org.mockito.ArgumentMatchers.any());
        verify(fixture.productRepository(), never()).flush();
    }

    @Test
    void rejectsProductsAssociatedWithOrdersWithoutDeletingThem() {
        Fixture fixture = fixture();
        Product product = Product.builder().id(10L).tenant(fixture.tenant()).build();
        when(fixture.productRepository().findByIdAndTenantIdForUpdate(10L, 7L))
                .thenReturn(Optional.of(product));
        when(fixture.orderItemRepository().existsByProductIdIn(List.of(10L)))
                .thenReturn(true);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> fixture.service().permanentlyDeleteProduct(10L));

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        verify(fixture.productRepository(), never()).delete(product);
        verify(fixture.productRepository(), never()).flush();
    }

    @Test
    void propagatesForeignKeyFailuresForTheTransactionalBoundaryToRollBack() throws Exception {
        Fixture fixture = fixture();
        Product product = Product.builder().id(10L).tenant(fixture.tenant()).build();
        when(fixture.productRepository().findByIdAndTenantIdForUpdate(10L, 7L))
                .thenReturn(Optional.of(product));
        when(fixture.orderItemRepository().existsByProductIdIn(List.of(10L)))
                .thenReturn(false);
        DataIntegrityViolationException failure = new DataIntegrityViolationException("foreign key");
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
        OrderItemRepository orderItemRepository = mock(OrderItemRepository.class);
        SecurityUtils securityUtils = mock(SecurityUtils.class);
        TenantStatusService tenantStatusService = mock(TenantStatusService.class);
        when(securityUtils.getAuthenticatedUser()).thenReturn(User.builder().tenant(tenant).build());

        return new Fixture(
                new ProductPermanentDeletionService(
                        productRepository,
                        orderItemRepository,
                        securityUtils,
                        tenantStatusService),
                productRepository,
                orderItemRepository,
                tenant);
    }

    private record Fixture(
            ProductPermanentDeletionService service,
            ProductRepository productRepository,
            OrderItemRepository orderItemRepository,
            Tenant tenant) {
    }
}
