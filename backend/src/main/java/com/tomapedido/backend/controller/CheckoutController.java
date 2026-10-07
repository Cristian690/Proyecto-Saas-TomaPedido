package com.tomapedido.backend.controller;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tomapedido.backend.dto.CheckoutConfirmRequest;
import com.tomapedido.backend.dto.CheckoutConfirmResponse;
import com.tomapedido.backend.service.CheckoutService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
public class CheckoutController {

    private final CheckoutService checkoutService;

    @PostMapping("/{slug}/checkout/confirm")
    public CheckoutConfirmResponse confirmCheckout(
            @PathVariable String slug,
            @Valid @RequestBody CheckoutConfirmRequest request) {

        return checkoutService.confirmCheckout(slug, request);
    }
}
