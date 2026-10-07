package com.tomapedido.backend.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tomapedido.backend.dto.OrderItemResponse;
import com.tomapedido.backend.dto.OrderResponse;
import com.tomapedido.backend.entity.Order;
import com.tomapedido.backend.entity.OrderItem;
import com.tomapedido.backend.entity.Tenant;
import com.tomapedido.backend.repository.OrderItemRepository;
import com.tomapedido.backend.repository.OrderRepository;
import com.tomapedido.backend.security.SecurityUtils;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final SecurityUtils securityUtils;
    private final TenantStatusService tenantStatusService;

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersForAuthenticatedTenant() {

        Tenant tenant = securityUtils.getAuthenticatedUser().getTenant();
        tenantStatusService.requireAdministrationAllowed(tenant);

        List<Order> orders = orderRepository.findByTenantOrderByCreatedAtDesc(tenant);

        if (orders.isEmpty()) {
            return List.of();
        }

        Map<Long, List<OrderItemResponse>> itemsByOrderId = orderItemRepository
                .findByOrderIn(orders)
                .stream()
                .collect(Collectors.groupingBy(
                        orderItem -> orderItem.getOrder().getId(),
                        Collectors.mapping(this::toOrderItemResponse, Collectors.toList())));

        return orders.stream()
                .map(order -> toOrderResponse(
                        order,
                        itemsByOrderId.getOrDefault(order.getId(), List.of())))
                .toList();
    }

    private OrderResponse toOrderResponse(
            Order order,
            List<OrderItemResponse> items) {

        return new OrderResponse(
                order.getId(),
                order.getCustomerName(),
                order.getDeliveryMethod(),
                order.getAddress(),
                order.getDeliveryNotes(),
                order.getPaymentMethod(),
                order.getCashAmount(),
                order.getTotal(),
                order.getStatus(),
                order.getCreatedAt(),
                items);
    }

    private OrderItemResponse toOrderItemResponse(OrderItem item) {
        BigDecimal subtotal = item.getUnitPrice()
                .multiply(BigDecimal.valueOf(item.getQuantity()));

        return new OrderItemResponse(
                item.getProduct().getId(),
                item.getProductName(),
                item.getUnitPrice(),
                item.getQuantity(),
                subtotal);
    }
}
