package com.tomapedido.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.tomapedido.backend.dto.CreateImportedProductRequest;
import com.tomapedido.backend.entity.Category;
import com.tomapedido.backend.entity.Product;
import com.tomapedido.backend.entity.Tenant;
import com.tomapedido.backend.entity.User;
import com.tomapedido.backend.repository.ProductRepository;
import com.tomapedido.backend.security.SecurityUtils;

class ProductServiceImportTest {

    @Test
    void createsImportedProductsWithPendingPriceZeroStockAndInactive() {
        ProductRepository productRepository = mock(ProductRepository.class);
        CategoryResolutionService categoryResolutionService = mock(CategoryResolutionService.class);
        SecurityUtils securityUtils = mock(SecurityUtils.class);
        TenantStatusService tenantStatusService = mock(TenantStatusService.class);
        Tenant tenant = Tenant.builder().id(7L).build();
        Category category = Category.builder().id(11L).tenant(tenant).build();
        when(securityUtils.getAuthenticatedUser())
                .thenReturn(User.builder().tenant(tenant).build());
        when(categoryResolutionService.resolveForImportedProduct(tenant, "Bebidas"))
                .thenReturn(category);
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product product = invocation.getArgument(0);
            product.setId(99L);
            return product;
        });

        ProductService service = new ProductService(
                productRepository,
                categoryResolutionService,
                securityUtils,
                tenantStatusService);
        CreateImportedProductRequest request = importedRequest();
        request.setCategoryName("Bebidas");

        var response = service.createImportedProduct(request);

        ArgumentCaptor<Product> productCaptor = ArgumentCaptor.forClass(Product.class);
        verify(productRepository).save(productCaptor.capture());
        Product product = productCaptor.getValue();
        assertNull(product.getPrice());
        assertEquals(0, product.getStock());
        assertFalse(product.isActive());
        assertEquals(tenant, product.getTenant());
        assertEquals(category, product.getCategory());
        assertFalse(response.isActive());
        assertNull(response.getPrice());
        verify(tenantStatusService).requireAdministrationAllowed(tenant);
    }

    @Test
    void doesNotActivateAProductWithoutAPositivePrice() {
        ProductRepository productRepository = mock(ProductRepository.class);
        SecurityUtils securityUtils = mock(SecurityUtils.class);
        TenantStatusService tenantStatusService = mock(TenantStatusService.class);
        Tenant tenant = Tenant.builder().id(7L).build();
        Product product = Product.builder().tenant(tenant).price(null).active(false).build();
        when(securityUtils.getAuthenticatedTenantId()).thenReturn(7L);
        when(securityUtils.getAuthenticatedUser())
                .thenReturn(User.builder().tenant(tenant).build());
        when(productRepository.findById(15L)).thenReturn(Optional.of(product));

        ProductService service = new ProductService(
                productRepository,
                mock(CategoryResolutionService.class),
                securityUtils,
                tenantStatusService);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.activateProduct(15L));

        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, exception.getStatusCode());
        assertFalse(product.isActive());
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void doesNotActivateAProductWithZeroPrice() {
        ProductRepository productRepository = mock(ProductRepository.class);
        SecurityUtils securityUtils = mock(SecurityUtils.class);
        TenantStatusService tenantStatusService = mock(TenantStatusService.class);
        Tenant tenant = Tenant.builder().id(7L).build();
        Product product = Product.builder()
                .tenant(tenant)
                .price(BigDecimal.ZERO)
                .active(false)
                .build();
        when(securityUtils.getAuthenticatedTenantId()).thenReturn(7L);
        when(securityUtils.getAuthenticatedUser())
                .thenReturn(User.builder().tenant(tenant).build());
        when(productRepository.findById(15L)).thenReturn(Optional.of(product));

        ProductService service = new ProductService(
                productRepository,
                mock(CategoryResolutionService.class),
                securityUtils,
                tenantStatusService);

        assertThrows(ResponseStatusException.class, () -> service.activateProduct(15L));
        assertFalse(product.isActive());
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void doesNotActivateAProductWithNegativePrice() {
        ProductRepository productRepository = mock(ProductRepository.class);
        SecurityUtils securityUtils = mock(SecurityUtils.class);
        TenantStatusService tenantStatusService = mock(TenantStatusService.class);
        Tenant tenant = Tenant.builder().id(7L).build();
        Product product = Product.builder()
                .tenant(tenant)
                .price(new BigDecimal("-0.01"))
                .active(false)
                .build();
        when(securityUtils.getAuthenticatedTenantId()).thenReturn(7L);
        when(securityUtils.getAuthenticatedUser())
                .thenReturn(User.builder().tenant(tenant).build());
        when(productRepository.findById(15L)).thenReturn(Optional.of(product));

        ProductService service = new ProductService(
                productRepository,
                mock(CategoryResolutionService.class),
                securityUtils,
                tenantStatusService);

        assertThrows(ResponseStatusException.class, () -> service.activateProduct(15L));
        assertFalse(product.isActive());
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void activatesAnOwnedProductWithAPositivePrice() {
        ProductRepository productRepository = mock(ProductRepository.class);
        SecurityUtils securityUtils = mock(SecurityUtils.class);
        TenantStatusService tenantStatusService = mock(TenantStatusService.class);
        Tenant tenant = Tenant.builder().id(7L).build();
        Product product = Product.builder()
                .tenant(tenant)
                .price(new BigDecimal("15.00"))
                .active(false)
                .build();
        when(securityUtils.getAuthenticatedTenantId()).thenReturn(7L);
        when(securityUtils.getAuthenticatedUser())
                .thenReturn(User.builder().tenant(tenant).build());
        when(productRepository.findById(15L)).thenReturn(Optional.of(product));

        ProductService service = new ProductService(
                productRepository,
                mock(CategoryResolutionService.class),
                securityUtils,
                tenantStatusService);

        service.activateProduct(15L);

        assertTrue(product.isActive());
        verify(productRepository).save(product);
    }

    @Test
    void doesNotActivateAProductFromAnotherTenant() {
        ProductRepository productRepository = mock(ProductRepository.class);
        SecurityUtils securityUtils = mock(SecurityUtils.class);
        TenantStatusService tenantStatusService = mock(TenantStatusService.class);
        Tenant authenticatedTenant = Tenant.builder().id(7L).build();
        Tenant otherTenant = Tenant.builder().id(8L).build();
        Product product = Product.builder()
                .tenant(otherTenant)
                .price(BigDecimal.ONE)
                .active(false)
                .build();
        when(securityUtils.getAuthenticatedTenantId()).thenReturn(7L);
        when(securityUtils.getAuthenticatedUser())
                .thenReturn(User.builder().tenant(authenticatedTenant).build());
        when(productRepository.findById(15L)).thenReturn(Optional.of(product));

        ProductService service = new ProductService(
                productRepository,
                mock(CategoryResolutionService.class),
                securityUtils,
                tenantStatusService);

        assertThrows(IllegalArgumentException.class, () -> service.activateProduct(15L));
        verify(productRepository, never()).save(any(Product.class));
    }

    private CreateImportedProductRequest importedRequest() {
        CreateImportedProductRequest request = new CreateImportedProductRequest();
        request.setName("Producto importado");
        request.setDescription("Pendiente de precio");
        request.setImageUrl("https://res.cloudinary.com/demo/image/upload/producto.jpg");
        request.setCategoryName("Otros");
        return request;
    }
}
