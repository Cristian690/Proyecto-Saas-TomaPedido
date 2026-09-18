package com.tomapedido.backend.security;

import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import com.tomapedido.backend.entity.User;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private final SecretKey secretKey = Keys.hmacShaKeyFor(
            "TomaPedido-Secret-Key-Para-JWT-2026-Muy-Segura".getBytes()
    );

    private final long expiration = 86400000;

    public String generateToken(User user) {

        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("role", user.getRole())
                .claim("tenantId", user.getTenant().getId())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(secretKey)
                .compact();
    }

    public SecretKey getSecretKey() {
        return secretKey;
    }
}