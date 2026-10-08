package com.tomapedido.backend.tool;

import java.io.Console;
import java.util.Arrays;
import java.util.Optional;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.tomapedido.backend.entity.User;
import com.tomapedido.backend.repository.UserRepository;
import com.tomapedido.backend.security.ArgentineWhatsAppNormalizer;

@Component
@ConditionalOnProperty(
        name = "ordenflash.password-reset.enabled",
        havingValue = "true")
public class ManualPasswordResetCommand implements CommandLineRunner {

    private static final int MIN_PASSWORD_LENGTH = 8;
    private static final int MAX_PASSWORD_LENGTH = 72;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ManualPasswordResetCommand(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        Console console = System.console();

        if (console == null) {
            throw new IllegalStateException(
                    "La herramienta debe ejecutarse desde una terminal interactiva");
        }

        console.printf("%nRestablecimiento manual de contraseña de OrdenFlash%n%n");

        String phoneInput = console.readLine("WhatsApp del comercio: ");
        String normalizedPhone;

        try {
            normalizedPhone = ArgentineWhatsAppNormalizer.normalize(phoneInput);
        } catch (IllegalArgumentException exception) {
            console.printf("Número de WhatsApp inválido.%n");
            return;
        }

        Optional<User> userOptional = findUserByNormalizedPhone(normalizedPhone);

        if (userOptional.isEmpty()) {
            console.printf("No se encontró un comercio con ese número.%n");
            return;
        }

        User user = userOptional.get();

        console.printf("%nComercio encontrado: %s%n", user.getTenant().getBusinessName());
        console.printf("WhatsApp normalizado: %s%n%n", normalizedPhone);

        char[] password = console.readPassword(
                "Nueva contraseña temporal (8 a 72 caracteres): ");
        char[] passwordConfirmation = console.readPassword("Confirmá la nueva contraseña: ");

        try {
            if (password == null || passwordConfirmation == null
                    || !Arrays.equals(password, passwordConfirmation)) {
                console.printf("Las contraseñas no coinciden. No se realizaron cambios.%n");
                return;
            }

            if (password.length < MIN_PASSWORD_LENGTH
                    || password.length > MAX_PASSWORD_LENGTH) {
                console.printf(
                        "La contraseña debe tener entre 8 y 72 caracteres. No se realizaron cambios.%n");
                return;
            }

            String confirmation = console.readLine(
                    "Vas a restablecer la contraseña de %s. ¿Continuar? (s/N): ",
                    user.getTenant().getBusinessName());

            if (confirmation == null || !confirmation.trim().equalsIgnoreCase("s")) {
                console.printf("Operación cancelada. No se realizaron cambios.%n");
                return;
            }

            user.setPassword(passwordEncoder.encode(new String(password)));
            userRepository.save(user);

            console.printf("Contraseña restablecida correctamente.%n");
        } finally {
            if (password != null) {
                Arrays.fill(password, '\0');
            }

            if (passwordConfirmation != null) {
                Arrays.fill(passwordConfirmation, '\0');
            }
        }
    }

    private Optional<User> findUserByNormalizedPhone(String normalizedPhone) {
        return userRepository.findByTenantPhone(normalizedPhone)
                .or(() -> userRepository.findByTenantPhone(
                        ArgentineWhatsAppNormalizer.toLegacyLocalNumber(normalizedPhone)));
    }
}
