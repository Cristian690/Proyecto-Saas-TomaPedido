package com.tomapedido.backend.dto;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CheckoutConfirmRequest {

    @NotBlank(message = "El nombre es obligatorio")
    private String customerName;

    @NotBlank(message = "El método de entrega es obligatorio")
    @Pattern(regexp = "delivery|pickup", message = "El método de entrega no es válido")
    private String deliveryMethod;

    private String address;

    private String deliveryNotes;

    @NotBlank(message = "La forma de pago es obligatoria")
    @Pattern(regexp = "Transferencia|Efectivo", message = "La forma de pago no es válida")
    private String paymentMethod;

    @Positive(message = "El monto en efectivo debe ser mayor que cero")
    private BigDecimal cashAmount;

    @Valid
    @NotEmpty(message = "El pedido debe contener al menos un producto")
    private List<CheckoutItemRequest> items;

    @AssertTrue(message = "La dirección es obligatoria para envíos a domicilio")
    public boolean isAddressValidForDelivery() {
        return !"delivery".equals(deliveryMethod)
                || (address != null && !address.isBlank());
    }

    @AssertTrue(message = "El monto en efectivo solo aplica a pagos en efectivo")
    public boolean isCashAmountValidForPaymentMethod() {
        return "Efectivo".equals(paymentMethod) || cashAmount == null;
    }
}
