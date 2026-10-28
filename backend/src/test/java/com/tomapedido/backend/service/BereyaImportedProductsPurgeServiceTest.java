package com.tomapedido.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.tomapedido.backend.dto.PurgeBereyaImportedProductsRequest;
import com.tomapedido.backend.entity.Product;
import com.tomapedido.backend.entity.Tenant;
import com.tomapedido.backend.entity.User;
import com.tomapedido.backend.repository.OrderItemRepository;
import com.tomapedido.backend.repository.ProductRepository;
import com.tomapedido.backend.security.SecurityUtils;

class BereyaImportedProductsPurgeServiceTest {

    @Test
    void deletesOnlyTheExactManifestForTheAuthenticatedBereyaTenant() {
        Fixture fixture = fixture();
        List<Product> products = manifestProducts(fixture.tenant());
        when(fixture.productRepository().findAllByIdInAndTenantIdForUpdate(
                eq(targetIds()), eq(fixture.tenant().getId())))
                .thenReturn(products);
        when(fixture.orderItemRepository().existsByProductIdIn(targetIds())).thenReturn(false);

        var response = fixture.service().purge(confirmedRequest());

        assertEquals(BereyaImportedProductsPurgeService.BEREYA_SLUG, response.tenantSlug());
        assertEquals(57, response.deletedCount());
        verify(fixture.productRepository()).deleteAll(products);
        verify(fixture.productRepository()).flush();
        verify(fixture.orderItemRepository()).existsByProductIdIn(targetIds());
    }

    @Test
    void rejectsAnotherTenantBeforeLookingUpAnyProduct() {
        Fixture fixture = fixture(Tenant.builder().id(8L).slug("otro-comercio").build());

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> fixture.service().purge(confirmedRequest()));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
        verifyNoInteractions(fixture.productRepository(), fixture.orderItemRepository());
    }

    @Test
    void rejectsAConfirmationThatDoesNotIdentifyTheFixedOperation() {
        Fixture fixture = fixture();
        PurgeBereyaImportedProductsRequest request = new PurgeBereyaImportedProductsRequest();
        request.setConfirmation("eliminar productos");

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> fixture.service().purge(request));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        verifyNoInteractions(fixture.productRepository(), fixture.orderItemRepository());
    }

    @Test
    void rejectsTheEntireOperationWhenOneManifestNameDoesNotMatch() {
        Fixture fixture = fixture();
        List<Product> products = manifestProducts(fixture.tenant());
        products.get(0).setName("Producto distinto");
        when(fixture.productRepository().findAllByIdInAndTenantIdForUpdate(
                eq(targetIds()), eq(fixture.tenant().getId())))
                .thenReturn(products);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> fixture.service().purge(confirmedRequest()));

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        verify(fixture.productRepository(), never()).deleteAll(anyList());
        verifyNoInteractions(fixture.orderItemRepository());
    }

    @Test
    void rejectsTheEntireOperationWhenAnyTargetHasOrderItems() {
        Fixture fixture = fixture();
        List<Product> products = manifestProducts(fixture.tenant());
        when(fixture.productRepository().findAllByIdInAndTenantIdForUpdate(
                eq(targetIds()), eq(fixture.tenant().getId())))
                .thenReturn(products);
        when(fixture.orderItemRepository().existsByProductIdIn(targetIds())).thenReturn(true);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> fixture.service().purge(confirmedRequest()));

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        verify(fixture.productRepository(), never()).deleteAll(anyList());
        verify(fixture.productRepository(), never()).flush();
    }

    @Test
    void propagatesFlushFailuresSoTheTransactionalBoundaryRollsBack() throws Exception {
        Fixture fixture = fixture();
        List<Product> products = manifestProducts(fixture.tenant());
        when(fixture.productRepository().findAllByIdInAndTenantIdForUpdate(
                eq(targetIds()), eq(fixture.tenant().getId())))
                .thenReturn(products);
        when(fixture.orderItemRepository().existsByProductIdIn(targetIds())).thenReturn(false);
        DataIntegrityViolationException failure = new DataIntegrityViolationException("foreign key");
        org.mockito.Mockito.doThrow(failure).when(fixture.productRepository()).flush();

        assertThrows(DataIntegrityViolationException.class,
                () -> fixture.service().purge(confirmedRequest()));

        assertNotNull(BereyaImportedProductsPurgeService.class
                .getMethod("purge", PurgeBereyaImportedProductsRequest.class)
                .getAnnotation(Transactional.class));
        verify(fixture.productRepository()).deleteAll(products);
        verify(fixture.productRepository()).flush();
    }

    @Test
    void manifestContainsExactlyTheImportRangeAndExcludesOriginalProducts() {
        assertEquals(57, BereyaImportedProductsPurgeService.EXPECTED_PRODUCTS.size());
        for (long id = 98; id <= 154; id += 1) {
            assertNotNull(BereyaImportedProductsPurgeService.EXPECTED_PRODUCTS.get(id));
        }
        for (long id = 18; id <= 24; id += 1) {
            assertFalse(BereyaImportedProductsPurgeService.EXPECTED_PRODUCTS.containsKey(id));
        }
    }

    private Fixture fixture() {
        return fixture(Tenant.builder()
                .id(7L)
                .slug(BereyaImportedProductsPurgeService.BEREYA_SLUG)
                .build());
    }

    private Fixture fixture(Tenant tenant) {
        ProductRepository productRepository = mock(ProductRepository.class);
        OrderItemRepository orderItemRepository = mock(OrderItemRepository.class);
        SecurityUtils securityUtils = mock(SecurityUtils.class);
        TenantStatusService tenantStatusService = mock(TenantStatusService.class);
        when(securityUtils.getAuthenticatedUser()).thenReturn(User.builder().tenant(tenant).build());

        return new Fixture(
                new BereyaImportedProductsPurgeService(
                        productRepository,
                        orderItemRepository,
                        securityUtils,
                        tenantStatusService),
                productRepository,
                orderItemRepository,
                tenant);
    }

    private List<Product> manifestProducts(Tenant tenant) {
        return BereyaImportedProductsPurgeService.EXPECTED_PRODUCTS.entrySet().stream()
                .map(entry -> Product.builder()
                        .id(entry.getKey())
                        .name(entry.getValue())
                        .tenant(tenant)
                        .build())
                .toList();
    }

    private List<Long> targetIds() {
        return BereyaImportedProductsPurgeService.EXPECTED_PRODUCTS.keySet().stream()
                .sorted()
                .toList();
    }

    private PurgeBereyaImportedProductsRequest confirmedRequest() {
        PurgeBereyaImportedProductsRequest request = new PurgeBereyaImportedProductsRequest();
        request.setConfirmation(BereyaImportedProductsPurgeService.REQUIRED_CONFIRMATION);
        return request;
    }

    private record Fixture(
            BereyaImportedProductsPurgeService service,
            ProductRepository productRepository,
            OrderItemRepository orderItemRepository,
            Tenant tenant) {
    }
}
