package com.tomapedido.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {

    @NotBlank(message = "El nombre del negocio es obligatorio")
    @Size(max = 100, message = "El nombre del negocio no puede superar los 100 caracteres")
    private String businessName;

    @NotBlank(message = "El teléfono es obligatorio")
    @Size(max = 20, message = "El teléfono no puede superar los 20 caracteres")
    @Pattern(regexp = "^\\+?[0-9() -]+$", message = "Ingresá un número de WhatsApp válido")
    private String phone;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres")
    private String password;

    @Email(message = "El email debe tener un formato válido")
    @Size(max = 150, message = "El email no puede superar los 150 caracteres")
    private String email;

    @NotBlank(message = "El rubro del comercio es obligatorio")
    @Pattern(
            regexp = "GASTRONOMY|TOY_STORE|CLOTHING_AND_FOOTWEAR|GIFTS_AND_DECOR|PET_SHOP|FLORIST_AND_NURSERY|BAKERY_AND_PASTRY|CAFE_AND_TEA|HEALTH_FOOD|GROCERY|BEAUTY_AND_COSMETICS|TECHNOLOGY|HARDWARE|STATIONERY|HOME_AND_KITCHEN|BABY_AND_MATERNITY|OTHER",
            message = "El rubro del comercio no es válido")
    private String businessType;
}
