package com.tomapedido.backend.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateProductRequest {

    @NotBlank(message = "El nombre del producto no puede estar vacío")
    private String name;

    private String description;

    @NotNull(message = "El precio no puede estar vacío")
    @Positive(message = "El precio debe ser mayor que cero")
    private BigDecimal price;

    private String imageUrl;

    @NotBlank(message = "La categoría es obligatoria")
    private String categoryName;
}