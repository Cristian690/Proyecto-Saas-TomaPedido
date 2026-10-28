package com.tomapedido.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.tomapedido.backend.dto.OrderResponse;
import com.tomapedido.backend.entity.Order;
import com.tomapedido.backend.entity.OrderItem;
import com.tomapedido.backend.entity.OrderStatus;
import com.tomapedido.backend.entity.Tenant;
import com.tomapedido.backend.entity.User;
import com.tomapedido.backend.repository.OrderItemRepository;
import com.tomapedido.backend.repository.OrderRepository;
import com.tomapedido.backend.security.SecurityUtils;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private SecurityUtils securityUtils;

    @Mock
    private TenantStatusService tenantStatusService;

    @InjectMocks
    private OrderService orderService;

    private Tenant authenticatedTenant;
    private Order newestOrder;
    private Order oldestOrder;

    @BeforeEach
    void setUp() {
        authenticatedTenant = new Tenant();
        authenticatedTenant.setId(1L);

        User user = new User();
        user.setTenant(authenticatedTenant);

        newestOrder = order(20L, LocalDateTime.of(2026, 10, 7, 11, 35));
        oldestOrder = order(10L, LocalDateTime.of(2026, 10, 6, 18, 20));

        when(securityUtils.getAuthenticatedUser()).thenReturn(user);
        when(orderRepository.findByTenantOrderByCreatedAtDesc(authenticatedTenant))
                .thenReturn(List.of(newestOrder, oldestOrder));
    }

    @Test
    void returnsOnlyOrdersForTheAuthenticatedTenantInRepositoryOrder() {
        when(orderItemRepository.findByOrderIn(List.of(newestOrder, oldestOrder)))
                .thenReturn(List.of());

        List<OrderResponse> orders = orderService.getOrdersForAuthenticatedTenant();

        verify(orderRepository).findByTenantOrderByCreatedAtDesc(authenticatedTenant);
        assertEquals(List.of(20L, 10L), orders.stream().map(OrderResponse::getId).toList());
    }

    @Test
    void calculatesItemSubtotalFromStoredUnitPriceAndQuantity() {
        OrderItem item = new OrderItem();
        item.setOrder(newestOrder);
        item.setProductId(5L);
        item.setProductName("Hamburguesa Simple");
        item.setUnitPrice(new BigDecimal("8000.00"));
        item.setQuantity(2);

        when(orderItemRepository.findByOrderIn(List.of(newestOrder, oldestOrder)))
                .thenReturn(List.of(item));

        OrderResponse response = orderService
                .getOrdersForAuthenticatedTenant()
                .getFirst();

        assertEquals(new BigDecimal("16000.00"),
                response.getItems().getFirst().getSubtotal());
        assertEquals(5L, response.getItems().getFirst().getProductId());
        assertEquals("Hamburguesa Simple", response.getItems().getFirst().getProductName());
        assertEquals(new BigDecimal("8000.00"), response.getItems().getFirst().getUnitPrice());
        assertEquals(2, response.getItems().getFirst().getQuantity());
    }

    private Order order(Long id, LocalDateTime createdAt) {
        Order order = new Order();
        order.setId(id);
        order.setTenant(authenticatedTenant);
        order.setCustomerName("Juan Pérez");
        order.setDeliveryMethod("delivery");
        order.setPaymentMethod("Efectivo");
        order.setTotal(new BigDecimal("16000.00"));
        order.setStatus(OrderStatus.PENDING);
        order.setCreatedAt(createdAt);
        return order;
    }
}
