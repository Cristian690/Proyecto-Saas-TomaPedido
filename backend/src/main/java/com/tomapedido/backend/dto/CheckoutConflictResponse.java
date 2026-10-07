package com.tomapedido.backend.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CheckoutConflictResponse {

    private String code;
    private List<CheckoutConflictItem> items;
}
