package com.tomapedido.backend.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;

import org.junit.jupiter.api.Test;

class ArgentineWhatsAppNormalizerTest {

    @Test
    void normalizesSupportedArgentineFormatsToTheSameValue() {
        String expected = "5491177776666";

        assertEquals(expected, ArgentineWhatsAppNormalizer.normalize("1177776666"));
        assertEquals(expected, ArgentineWhatsAppNormalizer.normalize("+54 9 11 7777-6666"));
        assertEquals(expected, ArgentineWhatsAppNormalizer.normalize("5491177776666"));
    }

    @Test
    void rejectsClearlyInvalidNumbers() {
        for (String phone : List.of(
                "abc",
                "123",
                "117777666",
                "11777766661",
                "+541177776666",
                "11 7777 666",
                "11-7777-666")) {
            assertThrows(IllegalArgumentException.class,
                    () -> ArgentineWhatsAppNormalizer.normalize(phone), phone);
        }
    }
}
