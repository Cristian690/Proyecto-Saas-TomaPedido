package com.tomapedido.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.lang.reflect.Proxy;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import com.tomapedido.backend.dto.RegisterRequest;
import com.tomapedido.backend.entity.Tenant;
import com.tomapedido.backend.repository.TenantConfigRepository;
import com.tomapedido.backend.repository.TenantRepository;
import com.tomapedido.backend.repository.UserRepository;

class AuthServicePhoneTest {

    @Test
    void preventsDuplicateRegistrationAgainstLegacyLocalPhone() {
        TenantRepository tenantRepository = tenantRepository(
                Optional.empty(),
                Optional.of(new Tenant()),
                new AtomicReference<>());

        AuthService authService = authService(tenantRepository);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> authService.register(request("+54 9 11 7777-6666")));

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
    }

    @Test
    void storesNewRegistrationInCanonicalWhatsAppFormat() {
        AtomicReference<Tenant> savedTenant = new AtomicReference<>();
        TenantRepository tenantRepository = tenantRepository(
                Optional.empty(),
                Optional.empty(),
                savedTenant);

        AuthService authService = authService(tenantRepository);

        authService.register(request("+54 9 11 7777-6666"));

        assertEquals("5491177776666", savedTenant.get().getPhone());
    }

    private AuthService authService(TenantRepository tenantRepository) {
        return new AuthService(
                tenantRepository,
                repositoryProxy(UserRepository.class),
                repositoryProxy(TenantConfigRepository.class),
                passwordEncoder(),
                null);
    }

    private TenantRepository tenantRepository(
            Optional<Tenant> canonicalPhone,
            Optional<Tenant> legacyPhone,
            AtomicReference<Tenant> savedTenant) {

        return (TenantRepository) Proxy.newProxyInstance(
                TenantRepository.class.getClassLoader(),
                new Class<?>[] { TenantRepository.class },
                (proxy, method, args) -> {
                    if (method.getName().equals("findByPhone")) {
                        return "5491177776666".equals(args[0])
                                ? canonicalPhone
                                : legacyPhone;
                    }

                    if (method.getName().equals("findBySlug")) {
                        return Optional.empty();
                    }

                    if (method.getName().equals("save")) {
                        Tenant tenant = (Tenant) args[0];
                        savedTenant.set(tenant);
                        return tenant;
                    }

                    return null;
                });
    }

    @SuppressWarnings("unchecked")
    private <T> T repositoryProxy(Class<T> type) {
        return (T) Proxy.newProxyInstance(
                type.getClassLoader(),
                new Class<?>[] { type },
                (proxy, method, args) -> method.getName().equals("save")
                        ? args[0]
                        : null);
    }

    private PasswordEncoder passwordEncoder() {
        return new PasswordEncoder() {
            @Override
            public String encode(CharSequence rawPassword) {
                return "encoded-password";
            }

            @Override
            public boolean matches(CharSequence rawPassword, String encodedPassword) {
                return false;
            }
        };
    }

    private RegisterRequest request(String phone) {
        RegisterRequest request = new RegisterRequest();
        request.setBusinessName("Pizzería La Nonna");
        request.setPhone(phone);
        request.setPassword("contrasena-segura");
        return request;
    }
}
