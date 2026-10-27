package com.tomapedido.backend.dto;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

import jakarta.validation.Validation;
import jakarta.validation.Validator;

class CreateProductRequestValidationTest {

    private final Validator validator = Validation
            .buildDefaultValidatorFactory()
            .getValidator();

    @Test
    void manualProductCreationRequiresAPositivePrice() {
        assertFalse(priceViolations(null).isEmpty());
        assertFalse(priceViolations(BigDecimal.ZERO).isEmpty());
        assertFalse(priceViolations(new BigDecimal("-1")).isEmpty());
        assertTrue(priceViolations(new BigDecimal("1.50")).isEmpty());
    }

    private java.util.List<String> priceViolations(BigDecimal price) {
        CreateProductRequest request = new CreateProductRequest();
        request.setName("Producto");
        request.setDescription("");
        request.setPrice(price);
        request.setStock(0);
        request.setCategoryName("Otros");

        return validator.validate(request)
                .stream()
                .filter(violation -> violation.getPropertyPath().toString().equals("price"))
                .map(violation -> violation.getMessage())
                .toList();
    }
}
