package com.tomapedido.backend.security;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.tomapedido.backend.entity.User;
import com.tomapedido.backend.repository.UserRepository;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log =
            LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private static final String CLOUDINARY_SIGNATURE_PATH =
            "/uploads/cloudinary/signatures";

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            UserRepository userRepository) {

        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        boolean isCloudinarySignatureRequest =
                "POST".equals(request.getMethod())
                && CLOUDINARY_SIGNATURE_PATH.equals(request.getRequestURI());
        boolean hasBearerScheme = authHeader != null
                && authHeader.startsWith("Bearer ");

        if (isCloudinarySignatureRequest) {
            log.info(
                    "JWT signature probe: method={}, path={}, authorizationPresent={}, bearerScheme={}",
                    request.getMethod(),
                    request.getRequestURI(),
                    authHeader != null,
                    hasBearerScheme);
        }

        if (!hasBearerScheme) {
            filterChain.doFilter(request, response);

            if (isCloudinarySignatureRequest) {
                log.info(
                        "JWT signature probe result: jwtValidation={}, responseStatus={}",
                        "missing_or_invalid_bearer_scheme",
                        response.getStatus());
            }

            return;
        }

        String token = authHeader.substring(7);
        String validationResult = "valid_but_user_or_active_tenant_unavailable";

        try {
            Claims claims = Jwts.parser()
                    .verifyWith(jwtService.getSecretKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            Long userId = Long.valueOf(claims.getSubject());

            User user = userRepository.findById(userId)
                    .orElse(null);

            if (user != null && Boolean.TRUE.equals(user.getTenant().getActive())) {

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                user,
                                null,
                                user.isMustChangePassword()
                                        ? java.util.List.of(
                                                new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                                        "PASSWORD_CHANGE_REQUIRED"))
                                        : user.getRole() != null
                                        ? java.util.List.of(
                                                new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                                        "ROLE_" + user.getRole()))
                                        : java.util.List.of());

                SecurityContextHolder.getContext()
                        .setAuthentication(authentication);
                validationResult = "valid_authenticated";
            }

        } catch (Exception e) {
            SecurityContextHolder.clearContext();
            validationResult = "invalid";
        }

        filterChain.doFilter(request, response);

        if (isCloudinarySignatureRequest) {
            log.info(
                    "JWT signature probe result: jwtValidation={}, responseStatus={}",
                    validationResult,
                    response.getStatus());
        }
    }
}
