package com.tomapedido.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CheckoutConflictItem {

    private Long productId;
    private String name;
    private int requestedQuantity;
    private Integer availableQuantity;
}
