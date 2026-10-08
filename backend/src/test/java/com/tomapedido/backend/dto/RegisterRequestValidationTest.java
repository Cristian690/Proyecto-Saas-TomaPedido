package com.tomapedido.backend.dto;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.Test;

import jakarta.validation.Validation;
import jakarta.validation.Validator;

class RegisterRequestValidationTest {

    private final Validator validator = Validation
            .buildDefaultValidatorFactory()
            .getValidator();

    @Test
    void acceptsReasonableArgentinePhonePresentation() {
        assertTrue(phoneViolations("+54 9 11 7777-6666").isEmpty());
    }

    @Test
    void rejectsInvalidPhoneFormats() {
        List<String> invalidPhones = List.of(
                "abc",
                "11@7777",
                "54911abc",
                "11/7777/6666");

        for (String phone : invalidPhones) {
            assertFalse(phoneViolations(phone).isEmpty(), phone);
        }
    }

    private List<String> phoneViolations(String phone) {
        RegisterRequest request = new RegisterRequest();
        request.setBusinessName("Pizzería");
        request.setPassword("contrasena-segura");
        request.setPhone(phone);

        return validator.validate(request)
                .stream()
                .filter(violation -> violation.getPropertyPath().toString().equals("phone"))
                .map(violation -> violation.getMessage())
                .toList();
    }
}
