package com.tomapedido.backend.dto;

import java.math.BigDecimal;

import com.tomapedido.backend.entity.OrderStatus;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CheckoutConfirmResponse {

    private Long orderId;
    private OrderStatus status;
    private BigDecimal total;
}
