package com.tomapedido.backend.security;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.lang.reflect.Proxy;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import com.tomapedido.backend.entity.Tenant;
import com.tomapedido.backend.entity.User;
import com.tomapedido.backend.repository.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

class JwtAuthenticationFilterTest {

    private static final String JWT_SECRET = "01234567890123456789012345678901";

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void assignsOnlyThePasswordChangeAuthorityToAUserWithTemporaryPassword()
            throws Exception {

        User user = user(true);
        Authentication authentication = authenticate(user);

        assertEquals(
                List.of("PASSWORD_CHANGE_REQUIRED"),
                authentication.getAuthorities().stream()
                        .map(authority -> authority.getAuthority())
                        .toList());
    }

    @Test
    void assignsTheAdminAuthorityAfterThePasswordHasBeenChanged()
            throws Exception {

        User user = user(false);
        Authentication authentication = authenticate(user);

        assertEquals(
                List.of("ROLE_ADMIN"),
                authentication.getAuthorities().stream()
                        .map(authority -> authority.getAuthority())
                        .toList());
    }

    private Authentication authenticate(User user) throws Exception {
        JwtService jwtService = new JwtService(JWT_SECRET);
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(
                jwtService, userRepository(user));
        AtomicReference<Authentication> authentication = new AtomicReference<>();
        String token = jwtService.generateToken(user);

        filter.doFilterInternal(request(token), response(), filterChain(authentication));

        return authentication.get();
    }

    private UserRepository userRepository(User user) {
        return (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(),
                new Class<?>[] { UserRepository.class },
                (proxy, method, args) -> method.getName().equals("findById")
                        ? Optional.of(user)
                        : null);
    }

    private HttpServletRequest request(String token) {
        return (HttpServletRequest) Proxy.newProxyInstance(
                HttpServletRequest.class.getClassLoader(),
                new Class<?>[] { HttpServletRequest.class },
                (proxy, method, args) -> method.getName().equals("getHeader")
                        ? "Bearer " + token
                        : null);
    }

    private HttpServletResponse response() {
        return (HttpServletResponse) Proxy.newProxyInstance(
                HttpServletResponse.class.getClassLoader(),
                new Class<?>[] { HttpServletResponse.class },
                (proxy, method, args) -> null);
    }

    private FilterChain filterChain(AtomicReference<Authentication> authentication) {
        return (request, response) -> authentication.set(
                SecurityContextHolder.getContext().getAuthentication());
    }

    private User user(boolean mustChangePassword) {
        Tenant tenant = Tenant.builder()
                .id(1L)
                .businessName("Comercio de prueba")
                .slug("comercio-de-prueba")
                .phone("5491155555555")
                .active(true)
                .build();

        return User.builder()
                .id(1L)
                .role("ADMIN")
                .tenant(tenant)
                .mustChangePassword(mustChangePassword)
                .password("encoded-password")
                .build();
    }
}
