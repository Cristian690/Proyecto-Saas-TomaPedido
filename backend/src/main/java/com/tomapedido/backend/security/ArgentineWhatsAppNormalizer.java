package com.tomapedido.backend.security;

public final class ArgentineWhatsAppNormalizer {

    private static final String ARGENTINE_MOBILE_PREFIX = "549";

    private ArgentineWhatsAppNormalizer() {
    }

    public static String normalize(String phone) {
        if (phone == null) {
            throw new IllegalArgumentException("El número de WhatsApp es obligatorio");
        }

        String value = phone.trim();

        if (!value.matches("^\\+?[0-9() -]+$")) {
            throw invalidPhone();
        }

        String digits = value
                .replaceAll("[()\\s-]", "")
                .replaceFirst("^\\+", "");

        if (digits.matches("^549\\d{10}$")) {
            return digits;
        }

        if (digits.matches("^\\d{10}$")) {
            return ARGENTINE_MOBILE_PREFIX + digits;
        }

        throw invalidPhone();
    }

    public static String toLegacyLocalNumber(String normalizedPhone) {
        if (!normalizedPhone.matches("^549\\d{10}$")) {
            throw invalidPhone();
        }

        return normalizedPhone.substring(ARGENTINE_MOBILE_PREFIX.length());
    }

    private static IllegalArgumentException invalidPhone() {
        return new IllegalArgumentException(
                "Ingresá un número de WhatsApp argentino válido");
    }
}
