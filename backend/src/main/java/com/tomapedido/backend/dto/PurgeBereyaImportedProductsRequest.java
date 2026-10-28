package com.tomapedido.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PurgeBereyaImportedProductsRequest {

    @NotBlank(message = "La confirmación es obligatoria")
    @Size(max = 120, message = "La confirmación no puede superar los 120 caracteres")
    private String confirmation;
}
