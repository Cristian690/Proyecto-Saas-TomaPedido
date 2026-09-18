package com.tomapedido.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {

    private String businessName;
    private String phone;
    private String password;
    private String email;
}