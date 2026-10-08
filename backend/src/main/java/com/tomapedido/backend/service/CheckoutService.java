package com.tomapedido.backend.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.tomapedido.backend.dto.CheckoutConfirmRequest;
import com.tomapedido.backend.dto.CheckoutConfirmResponse;
import com.tomapedido.backend.dto.CheckoutConflictItem;
import com.tomapedido.backend.dto.CheckoutConflictResponse;
import com.tomapedido.backend.dto.CheckoutItemRequest;
import com.tomapedido.backend.entity.Order;
import com.tomapedido.backend.entity.OrderItem;
import com.tomapedido.backend.entity.OrderStatus;
import com.tomapedido.backend.entity.Product;
import com.tomapedido.backend.entity.Tenant;
import com.tomapedido.backend.entity.TenantConfig;
import com.tomapedido.backend.exception.CheckoutConflictException;
import com.tomapedido.backend.repository.OrderItemRepository;
import com.tomapedido.backend.repository.OrderRepository;
import com.tomapedido.backend.repository.ProductRepository;
import com.tomapedido.backend.repository.TenantConfigRepository;
import com.tomapedido.backend.repository.TenantRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CheckoutService {

    private final TenantRepository tenantRepository;
    private final TenantConfigRepository tenantConfigRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final TenantStatusService tenantStatusService;

    @Transactional
    public CheckoutConfirmResponse confirmCheckout(
            String slug,
            CheckoutConfirmRequest request) {

        Tenant tenant = tenantRepository.findBySlug(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (!tenantStatusService.isPublicStoreAvailable(tenant)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        TenantConfig config = tenantConfigRepository.findByTenant(tenant)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (!config.isOpen()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "El comercio no se encuentra disponible");
        }

        List<CheckoutItemRequest> requestedItems = request.getItems().stream()
                .sorted(Comparator.comparing(CheckoutItemRequest::getProductId))
                .toList();

        ensureNoDuplicateProducts(requestedItems);

        List<ResolvedItem> resolvedItems = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (CheckoutItemRequest requestedItem : requestedItems) {
            Product product = productRepository
                    .findByIdAndTenantId(requestedItem.getProductId(), tenant.getId())
                    .orElseThrow(() -> unavailableProduct(requestedItem));

            if (!product.isActive()) {
                throw unavailableProduct(requestedItem, product.getName());
            }

            ResolvedItem resolvedItem = new ResolvedItem(
                    product.getId(),
                    product.getName(),
                    product.getPrice(),
                    requestedItem.getQuantity());

            resolvedItems.add(resolvedItem);
            total = total.add(resolvedItem.unitPrice()
                    .multiply(BigDecimal.valueOf(requestedItem.getQuantity())));
        }

        if (request.getCashAmount() != null
                && request.getCashAmount().compareTo(total) < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El monto en efectivo es menor al total del pedido");
        }

        if (config.isStockEnabled()) {
            for (ResolvedItem item : resolvedItems) {
                int updatedProducts = productRepository.decrementStockIfAvailable(
                        item.productId(),
                        tenant.getId(),
                        item.quantity());

                if (updatedProducts != 1) {
                    Product currentProduct = productRepository
                            .findByIdAndTenantId(item.productId(), tenant.getId())
                            .orElse(null);

                    if (currentProduct == null || !currentProduct.isActive()) {
                        throw unavailableProduct(item.productId(), item.quantity());
                    }

                    throw insufficientStock(item.productId(),
                            currentProduct.getName(),
                            item.quantity(),
                            currentProduct.getStock());
                }
            }
        }

        Tenant managedTenant = tenantRepository.findById(tenant.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        Order order = new Order();
        order.setTenant(managedTenant);
        order.setCustomerName(request.getCustomerName());
        order.setDeliveryMethod(request.getDeliveryMethod());
        order.setAddress("delivery".equals(request.getDeliveryMethod())
                ? request.getAddress()
                : null);
        order.setDeliveryNotes("delivery".equals(request.getDeliveryMethod())
                ? request.getDeliveryNotes()
                : null);
        order.setPaymentMethod(request.getPaymentMethod());
        order.setCashAmount(request.getCashAmount());
        order.setTotal(total);
        order.setStatus(OrderStatus.PENDING);

        Order savedOrder = orderRepository.save(order);

        List<OrderItem> orderItems = resolvedItems.stream()
                .map(item -> toOrderItem(savedOrder, managedTenant.getId(), item))
                .toList();

        orderItemRepository.saveAll(orderItems);

        return new CheckoutConfirmResponse(
                savedOrder.getId(),
                savedOrder.getStatus(),
                savedOrder.getTotal());
    }

    private void ensureNoDuplicateProducts(List<CheckoutItemRequest> items) {
        Set<Long> productIds = new HashSet<>();

        for (CheckoutItemRequest item : items) {
            if (!productIds.add(item.getProductId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Un producto no puede repetirse en el pedido");
            }
        }
    }

    private OrderItem toOrderItem(
            Order order,
            Long tenantId,
            ResolvedItem resolvedItem) {

        Product product = productRepository
                .findByIdAndTenantId(resolvedItem.productId(), tenantId)
                .orElseThrow(() -> unavailableProduct(
                        resolvedItem.productId(),
                        resolvedItem.quantity()));

        OrderItem orderItem = new OrderItem();
        orderItem.setOrder(order);
        orderItem.setProduct(product);
        orderItem.setProductName(resolvedItem.productName());
        orderItem.setUnitPrice(resolvedItem.unitPrice());
        orderItem.setQuantity(resolvedItem.quantity());

        return orderItem;
    }

    private CheckoutConflictException unavailableProduct(CheckoutItemRequest item) {
        return unavailableProduct(item.getProductId(), item.getQuantity());
    }

    private CheckoutConflictException unavailableProduct(
            CheckoutItemRequest item,
            String productName) {
        return unavailableProduct(item.getProductId(), item.getQuantity(), productName);
    }

    private CheckoutConflictException unavailableProduct(Long productId, int quantity) {
        return unavailableProduct(productId, quantity, null);
    }

    private CheckoutConflictException unavailableProduct(
            Long productId,
            int quantity,
            String productName) {
        return new CheckoutConflictException(new CheckoutConflictResponse(
                "PRODUCT_UNAVAILABLE",
                List.of(new CheckoutConflictItem(
                        productId,
                        productName,
                        quantity,
                        null))));
    }

    private CheckoutConflictException insufficientStock(
            Long productId,
            String productName,
            int requestedQuantity,
            int availableQuantity) {
        return new CheckoutConflictException(new CheckoutConflictResponse(
                "INSUFFICIENT_STOCK",
                List.of(new CheckoutConflictItem(
                        productId,
                        productName,
                        requestedQuantity,
                        availableQuantity))));
    }

    private record ResolvedItem(
            Long productId,
            String productName,
            BigDecimal unitPrice,
            int quantity) {
    }
}
