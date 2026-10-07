package com.tomapedido.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.tomapedido.backend.dto.CheckoutConfirmRequest;
import com.tomapedido.backend.dto.CheckoutConfirmResponse;
import com.tomapedido.backend.dto.CheckoutItemRequest;
import com.tomapedido.backend.entity.Order;
import com.tomapedido.backend.entity.OrderItem;
import com.tomapedido.backend.entity.Product;
import com.tomapedido.backend.entity.Tenant;
import com.tomapedido.backend.entity.TenantConfig;
import com.tomapedido.backend.exception.CheckoutConflictException;
import com.tomapedido.backend.repository.OrderItemRepository;
import com.tomapedido.backend.repository.OrderRepository;
import com.tomapedido.backend.repository.ProductRepository;
import com.tomapedido.backend.repository.TenantConfigRepository;
import com.tomapedido.backend.repository.TenantRepository;

@ExtendWith(MockitoExtension.class)
class CheckoutServiceTest {

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private TenantConfigRepository tenantConfigRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private TenantStatusService tenantStatusService;

    @InjectMocks
    private CheckoutService checkoutService;

    private Tenant tenant;
    private Product product;

    @BeforeEach
    void setUp() {
        tenant = new Tenant();
        tenant.setId(1L);

        TenantConfig config = new TenantConfig();
        config.setOpen(true);

        product = product(10L, "Pizza Muzzarella", "5000.00", 5, true);

        when(tenantRepository.findBySlug("pizzeria"))
                .thenReturn(Optional.of(tenant));
        when(tenantRepository.findById(1L)).thenReturn(Optional.of(tenant));
        when(tenantStatusService.isPublicStoreAvailable(tenant)).thenReturn(true);
        when(tenantConfigRepository.findByTenant(tenant)).thenReturn(Optional.of(config));
        when(productRepository.findByIdAndTenantId(10L, 1L))
                .thenReturn(Optional.of(product));
        when(productRepository.decrementStockIfAvailable(10L, 1L, 2)).thenReturn(1);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            order.setId(25L);
            return order;
        });
    }

    @Test
    @SuppressWarnings("unchecked")
    void confirmsCheckoutAndStoresCurrentProductSnapshots() {
        CheckoutConfirmResponse response = checkoutService.confirmCheckout(
                "pizzeria", request(item(10L, 2)));

        assertEquals(25L, response.getOrderId());
        assertEquals(new BigDecimal("10000.00"), response.getTotal());

        ArgumentCaptor<List<OrderItem>> itemsCaptor = ArgumentCaptor.forClass(List.class);
        verify(orderItemRepository).saveAll(itemsCaptor.capture());

        OrderItem savedItem = itemsCaptor.getValue().getFirst();
        assertEquals("Pizza Muzzarella", savedItem.getProductName());
        assertEquals(new BigDecimal("5000.00"), savedItem.getUnitPrice());
        assertEquals(2, savedItem.getQuantity());
        verify(productRepository).decrementStockIfAvailable(10L, 1L, 2);
    }

    @Test
    void rejectsInsufficientStockWithoutCreatingAnOrder() {
        product.setStock(1);
        when(productRepository.decrementStockIfAvailable(10L, 1L, 2)).thenReturn(0);

        CheckoutConflictException exception = assertThrows(
                CheckoutConflictException.class,
                () -> checkoutService.confirmCheckout("pizzeria", request(item(10L, 2))));

        assertEquals("INSUFFICIENT_STOCK", exception.getResponse().getCode());
        assertEquals(1, exception.getResponse().getItems().getFirst().getAvailableQuantity());
        verify(orderRepository, never()).save(any(Order.class));
        verify(orderItemRepository, never()).saveAll(any());
    }

    @Test
    void acceptsStockExactlyEqualToRequestedQuantity() {
        product.setStock(2);

        CheckoutConfirmResponse response = checkoutService.confirmCheckout(
                "pizzeria", request(item(10L, 2)));

        assertEquals(25L, response.getOrderId());
        verify(productRepository).decrementStockIfAvailable(10L, 1L, 2);
    }

    @Test
    void rejectsInactiveProduct() {
        product.setActive(false);

        CheckoutConflictException exception = assertThrows(
                CheckoutConflictException.class,
                () -> checkoutService.confirmCheckout("pizzeria", request(item(10L, 2))));

        assertEquals("PRODUCT_UNAVAILABLE", exception.getResponse().getCode());
        verify(productRepository, never()).decrementStockIfAvailable(anyLong(), anyLong(), anyInt());
    }

    @Test
    void rejectsProductThatDoesNotBelongToTheStore() {
        when(productRepository.findByIdAndTenantId(10L, 1L)).thenReturn(Optional.empty());

        CheckoutConflictException exception = assertThrows(
                CheckoutConflictException.class,
                () -> checkoutService.confirmCheckout("pizzeria", request(item(10L, 2))));

        assertEquals("PRODUCT_UNAVAILABLE", exception.getResponse().getCode());
        verify(productRepository, never()).decrementStockIfAvailable(anyLong(), anyLong(), anyInt());
    }

    @Test
    void doesNotCreateAnOrderWhenTheSecondStockUpdateFails() {
        Product secondProduct = product(20L, "Empanada", "1000.00", 0, true);

        when(productRepository.findByIdAndTenantId(20L, 1L))
                .thenReturn(Optional.of(secondProduct));
        when(productRepository.decrementStockIfAvailable(20L, 1L, 1)).thenReturn(0);

        assertThrows(
                CheckoutConflictException.class,
                () -> checkoutService.confirmCheckout(
                        "pizzeria",
                        request(item(10L, 2), item(20L, 1))));

        verify(orderRepository, never()).save(any(Order.class));
        verify(orderItemRepository, never()).saveAll(any());
    }

    private CheckoutConfirmRequest request(CheckoutItemRequest... items) {
        CheckoutConfirmRequest request = new CheckoutConfirmRequest();
        request.setCustomerName("Cristian");
        request.setDeliveryMethod("delivery");
        request.setAddress("Calle 123");
        request.setDeliveryNotes("Portón negro");
        request.setPaymentMethod("Efectivo");
        request.setCashAmount(new BigDecimal("12000.00"));
        request.setItems(List.of(items));
        return request;
    }

    private CheckoutItemRequest item(Long productId, int quantity) {
        CheckoutItemRequest item = new CheckoutItemRequest();
        item.setProductId(productId);
        item.setQuantity(quantity);
        return item;
    }

    private Product product(
            Long id,
            String name,
            String price,
            int stock,
            boolean active) {

        Product product = new Product();
        product.setId(id);
        product.setName(name);
        product.setPrice(new BigDecimal(price));
        product.setStock(stock);
        product.setActive(active);
        product.setTenant(tenant);
        return product;
    }
}
