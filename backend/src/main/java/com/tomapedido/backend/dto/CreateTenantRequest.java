package com.tomapedido.backend.dto;

import lombok.Getter;
import lombok.Setter;
import jakarta.validation.constraints.NotBlank;

@Getter
@Setter
public class CreateTenantRequest {

    @NotBlank(message = "El nombre del negocio es obligatorio")
    private String businessName;
    private String slug;
    private String email;
    private String phone;

}