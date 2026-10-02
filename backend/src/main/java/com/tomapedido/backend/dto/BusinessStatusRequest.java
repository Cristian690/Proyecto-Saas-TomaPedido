package com.tomapedido.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BusinessStatusRequest {

    @NotNull(message = "El estado de apertura es obligatorio")
    private Boolean open;
}
