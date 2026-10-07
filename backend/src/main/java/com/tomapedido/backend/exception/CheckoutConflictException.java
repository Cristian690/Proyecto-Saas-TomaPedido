package com.tomapedido.backend.exception;

import com.tomapedido.backend.dto.CheckoutConflictResponse;

import lombok.Getter;

@Getter
public class CheckoutConflictException extends RuntimeException {

    private final CheckoutConflictResponse response;

    public CheckoutConflictException(CheckoutConflictResponse response) {
        this.response = response;
    }
}
