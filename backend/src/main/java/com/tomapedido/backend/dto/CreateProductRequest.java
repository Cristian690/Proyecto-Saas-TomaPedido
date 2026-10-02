package com.tomapedido.backend.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateProductRequest {

    @NotBlank(message = "El nombre del producto no puede estar vacío")
    @Size(max = 100, message = "El nombre del producto no puede superar los 100 caracteres")
    private String name;

    @NotNull(message = "La descripción no puede ser nula")
    @Size(max = 100, message = "La descripción no puede superar los 100 caracteres")
    private String description;

    @NotNull(message = "El precio no puede estar vacío")
    @Positive(message = "El precio debe ser mayor que cero")
    private BigDecimal price;

    @Size(max = 200, message = "La URL de imagen no puede superar los 200 caracteres")
    @Pattern(regexp = "^(?:https?://\\S+)?$", message = "La URL de imagen debe usar HTTP o HTTPS")
    private String imageUrl;

    @NotBlank(message = "La categoría es obligatoria")
    @Size(max = 60, message = "La categoría no puede superar los 60 caracteres")
    private String categoryName;
}
