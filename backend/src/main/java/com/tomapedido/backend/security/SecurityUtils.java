package com.tomapedido.backend.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.tomapedido.backend.entity.User;

@Component
public class SecurityUtils {

    public User getAuthenticatedUser() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        return (User) authentication.getPrincipal();
    }

    public Long getAuthenticatedTenantId() {
        return getAuthenticatedUser()
                .getTenant()
                .getId();
    }
}