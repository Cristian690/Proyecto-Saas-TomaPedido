package com.tomapedido.backend.dto;

import java.math.BigDecimal;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;


public class CreateProductRequest {    

    @NotBlank(message = "El nombre del producto no puede estar vacío")
    private String name;
    
    private String description;

    @PositiveOrZero(message = "El stock no puede ser negativo")
    private int stock;

    @NotNull(message = "El precio no puede estar vacío")
    @Positive(message = "El precio debe ser mayor que cero")
    private BigDecimal price;

    private String imageUrl;

    @NotNull(message = "El tenant es obligatorio")
    private Long tenantId;
    
    @NotNull(message = "La categoría es obligatoria")
    private Long categoryId;
    
}
