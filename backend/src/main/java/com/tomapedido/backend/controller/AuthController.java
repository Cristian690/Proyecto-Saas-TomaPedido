package com.tomapedido.backend.controller;

import org.springframework.web.bind.annotation.*;

import com.tomapedido.backend.dto.RegisterRequest;
import com.tomapedido.backend.dto.RegisterResponse;
import com.tomapedido.backend.service.AuthService;
import com.tomapedido.backend.dto.LoginRequest;
import com.tomapedido.backend.dto.LoginResponse;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public RegisterResponse register(@RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }
}