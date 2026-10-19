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
    private String mercadoPagoAlias;
    private String mercadoPagoAccountHolder;

    @Pattern(regexp = "BOTH|DELIVERY_ONLY|PICKUP_ONLY", message = "La modalidad de entrega no es válida")
    private String deliveryMode;

    @Pattern(regexp = "ORDERS|INQUIRIES", message = "El modo de WhatsApp no es válido")
    private String whatsappMode;

    @Pattern(
            regexp = "GASTRONOMY|TOY_STORE|CLOTHING_AND_FOOTWEAR|GIFTS_AND_DECOR|PET_SHOP|FLORIST_AND_NURSERY|BAKERY_AND_PASTRY|CAFE_AND_TEA|HEALTH_FOOD|GROCERY|BEAUTY_AND_COSMETICS|TECHNOLOGY|HARDWARE|STATIONERY|HOME_AND_KITCHEN|BABY_AND_MATERNITY|OTHER",
            message = "El rubro del comercio no es válido")
    private String businessType;

    private boolean open;
    private Boolean stockEnabled;
}
