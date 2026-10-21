package com.tomapedido.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.lang.reflect.Proxy;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import com.tomapedido.backend.dto.ChangePasswordRequest;
import com.tomapedido.backend.dto.LoginRequest;
import com.tomapedido.backend.dto.LoginResponse;
import com.tomapedido.backend.entity.Tenant;
import com.tomapedido.backend.entity.User;
import com.tomapedido.backend.repository.TenantConfigRepository;
import com.tomapedido.backend.repository.TenantRepository;
import com.tomapedido.backend.repository.UserRepository;
import com.tomapedido.backend.security.JwtService;

class AuthServicePasswordTest {

    @Test
    void changesTheAuthenticatedUsersPasswordWithTheConfiguredEncoder() {
        AtomicReference<User> savedUser = new AtomicReference<>();
        AuthService authService = authService(savedUser);
        User user = User.builder()
                .id(1L)
                .tenant(tenant())
                .password("encoded-current-password")
                .build();

        authService.changePassword(user, request("current-password", "new-password"));

        assertEquals("encoded-new-password", user.getPassword());
        assertEquals(user, savedUser.get());
    }

    @Test
    void rejectsAnIncorrectCurrentPassword() {
        AtomicReference<User> savedUser = new AtomicReference<>();
        AuthService authService = authService(savedUser);
        User user = User.builder().password("encoded-current-password").build();

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> authService.changePassword(
                        user, request("incorrect-password", "new-password")));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        assertEquals("encoded-current-password", user.getPassword());
        assertEquals(null, savedUser.get());
    }

    @Test
    void rejectsReusingTheCurrentPassword() {
        AtomicReference<User> savedUser = new AtomicReference<>();
        AuthService authService = authService(savedUser);
        User user = User.builder().password("encoded-current-password").build();

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> authService.changePassword(
                        user, request("current-password", "current-password")));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        assertEquals(null, savedUser.get());
    }

    @Test
    void logsInWithTheNewBcryptPasswordAfterChangingIt() {
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        Tenant tenant = Tenant.builder()
                .id(1L)
                .businessName("Comercio de prueba")
                .slug("comercio-de-prueba")
                .phone("5491155555555")
                .active(true)
                .build();
        User user = User.builder()
                .id(1L)
                .role("ADMIN")
                .tenant(tenant)
                .mustChangePassword(true)
                .password(passwordEncoder.encode("current-password"))
                .build();
        AtomicReference<User> savedUser = new AtomicReference<>();
        AuthService authService = authServiceForLogin(user, savedUser, passwordEncoder);

        LoginResponse passwordChangeResponse = authService.changePassword(
                user, request("current-password", "new-password"));

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setPhone("11 5555-5555");
        loginRequest.setPassword("new-password");
        LoginResponse response = authService.login(loginRequest);

        assertEquals(user, savedUser.get());
        assertEquals(true, passwordChangeResponse.getToken() != null);
        assertEquals(false, passwordChangeResponse.isMustChangePassword());
        assertEquals(1L, response.getUserId());
        assertEquals("comercio-de-prueba", response.getSlug());
        assertEquals(false, response.isMustChangePassword());
        assertEquals(true, passwordEncoder.matches("new-password", user.getPassword()));
    }

    private AuthService authService(AtomicReference<User> savedUser) {
        UserRepository userRepository = (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(),
                new Class<?>[] { UserRepository.class },
                (proxy, method, args) -> {
                    if (method.getName().equals("save")) {
                        savedUser.set((User) args[0]);
                        return args[0];
                    }

                    return null;
                });

        return new AuthService(
                repositoryProxy(TenantRepository.class),
                userRepository,
                repositoryProxy(TenantConfigRepository.class),
                passwordEncoder(),
                new JwtService("01234567890123456789012345678901"));
    }

    private Tenant tenant() {
        return Tenant.builder()
                .id(1L)
                .businessName("Comercio de prueba")
                .slug("comercio-de-prueba")
                .phone("5491155555555")
                .active(true)
                .build();
    }

    private AuthService authServiceForLogin(
            User user,
            AtomicReference<User> savedUser,
            PasswordEncoder passwordEncoder) {

        UserRepository userRepository = (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(),
                new Class<?>[] { UserRepository.class },
                (proxy, method, args) -> {
                    if (method.getName().equals("save")) {
                        savedUser.set((User) args[0]);
                        return args[0];
                    }

                    if (method.getName().equals("findByTenantPhone")) {
                        return Optional.of(user);
                    }

                    return null;
                });

        return new AuthService(
                repositoryProxy(TenantRepository.class),
                userRepository,
                repositoryProxy(TenantConfigRepository.class),
                passwordEncoder,
                new JwtService("01234567890123456789012345678901"));
    }

    @SuppressWarnings("unchecked")
    private <T> T repositoryProxy(Class<T> type) {
        return (T) Proxy.newProxyInstance(
                type.getClassLoader(),
                new Class<?>[] { type },
                (proxy, method, args) -> null);
    }

    private PasswordEncoder passwordEncoder() {
        return new PasswordEncoder() {
            @Override
            public String encode(CharSequence rawPassword) {
                return "encoded-" + rawPassword;
            }

            @Override
            public boolean matches(CharSequence rawPassword, String encodedPassword) {
                return encodedPassword.equals("encoded-" + rawPassword);
            }
        };
    }

    private ChangePasswordRequest request(
            String currentPassword,
            String newPassword) {

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword(currentPassword);
        request.setNewPassword(newPassword);
        return request;
    }
}
