package com.tomapedido.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class RegisterResponse {

    private Long userId;
    private String businessName;
    private String slug;
    private String phone;
    private String role;
}