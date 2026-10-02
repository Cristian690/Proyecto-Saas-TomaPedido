package com.tomapedido.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateCategoryRequest {

    @NotBlank(message = "El nombre de la categoría no puede estar vacío")
    @Size(max = 60, message = "El nombre de la categoría no puede superar los 60 caracteres")
    private String name;

    @NotBlank(message = "La descripción no puede estar vacía")
    @Size(max = 120, message = "La descripción no puede superar los 120 caracteres")
    private String description;

    @Size(max = 200, message = "La URL de imagen no puede superar los 200 caracteres")
    @Pattern(regexp = "^(?:https?://\\S+)?$", message = "La URL de imagen debe usar HTTP o HTTPS")
    private String imageUrl;
}
