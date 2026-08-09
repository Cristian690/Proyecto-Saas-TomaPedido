package com.tomapedido.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import lombok.Setter;
import lombok.Getter;

@Getter
@Setter
public class CreateCategoryRequest {
    
    @NotBlank(message = "El nombre de la categoría no puede estar vacío")
    private String name;

    @NotBlank(message = "La descripción no puede estar vacía")
    private String description;
    private String imageUrl;
    
    @NotNull(message = "El tenant es obligatorio")
    private Long tenantId;

}
