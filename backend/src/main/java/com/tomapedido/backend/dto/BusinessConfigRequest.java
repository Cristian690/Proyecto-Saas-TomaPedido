package com.tomapedido.backend.dto;

import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BusinessConfigRequest {

    private String name;
    private String whatsapp;

    @Pattern(regexp = "^(?:https?://\\S+)?$", message = "La URL del logo debe usar HTTP o HTTPS")
    private String logoUrl;

    @Pattern(regexp = "^(?:https?://\\S+)?$", message = "La URL de portada debe usar HTTP o HTTPS")
    private String coverUrl;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "El color principal debe tener formato hexadecimal #RRGGBB")
    private String primaryColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "El color de fondo debe tener formato hexadecimal #RRGGBB")
    private String backgroundColor;

    private String welcomeMessage;
    private String address;

    private boolean open;
    private Boolean stockEnabled;
}
