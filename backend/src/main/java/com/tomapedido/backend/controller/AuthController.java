package com.tomapedido.backend.controller;

import org.springframework.web.bind.annotation.*;

import com.tomapedido.backend.dto.RegisterRequest;
import com.tomapedido.backend.dto.RegisterResponse;
import com.tomapedido.backend.service.AuthService;
import com.tomapedido.backend.dto.LoginRequest;
import com.tomapedido.backend.dto.LoginResponse;
import com.tomapedido.backend.dto.ChangePasswordRequest;
import com.tomapedido.backend.entity.User;

import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public RegisterResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/change-password")
    public LoginResponse changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal User authenticatedUser) {

        return authService.changePassword(authenticatedUser, request);
    }

    @GetMapping("/check-phone/{phone}")
    public boolean checkPhone(@PathVariable String phone) {
        return authService.phoneExists(phone);
    }
}
