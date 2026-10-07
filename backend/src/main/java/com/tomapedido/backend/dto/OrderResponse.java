package com.tomapedido.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.tomapedido.backend.entity.OrderStatus;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class OrderResponse {

    private Long id;
    private String customerName;
    private String deliveryMethod;
    private String address;
    private String deliveryNotes;
    private String paymentMethod;
    private BigDecimal cashAmount;
    private BigDecimal total;
    private OrderStatus status;
    private LocalDateTime createdAt;
    private List<OrderItemResponse> items;
}
