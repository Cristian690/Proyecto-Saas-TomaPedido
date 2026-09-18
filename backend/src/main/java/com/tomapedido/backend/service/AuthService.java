package com.tomapedido.backend.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.tomapedido.backend.security.JwtService;

import com.tomapedido.backend.dto.RegisterRequest;
import com.tomapedido.backend.dto.RegisterResponse;
import com.tomapedido.backend.dto.LoginRequest;
import com.tomapedido.backend.dto.LoginResponse;
import com.tomapedido.backend.entity.Tenant;
import com.tomapedido.backend.entity.User;
import com.tomapedido.backend.repository.TenantRepository;
import com.tomapedido.backend.repository.UserRepository;

import com.tomapedido.backend.entity.TenantConfig;
import com.tomapedido.backend.repository.TenantConfigRepository;

import java.text.Normalizer;
import java.util.Locale;

@Service
public class AuthService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final TenantConfigRepository tenantConfigRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            TenantRepository tenantRepository,
            UserRepository userRepository,
            TenantConfigRepository tenantConfigRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {

        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.tenantConfigRepository = tenantConfigRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public RegisterResponse register(RegisterRequest request) {

        if (tenantRepository.findByPhone(request.getPhone()).isPresent()) {
            throw new IllegalArgumentException("El número de teléfono ya está registrado");
        }

        String slug = generateUniqueSlug(request.getBusinessName());

        Tenant tenant = Tenant.builder()
                .businessName(request.getBusinessName())
                .slug(slug)
                .email(request.getEmail())
                .phone(request.getPhone())
                .active(true)
                .build();

        tenantRepository.save(tenant);

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("ADMIN")
                .tenant(tenant)
                .build();

        userRepository.save(user);

        TenantConfig config = new TenantConfig();

        config.setName(tenant.getBusinessName());
        config.setWhatsapp(tenant.getPhone());
        config.setLogoUrl("");
        config.setCoverUrl("");
        config.setPrimaryColor("#e63946");
        config.setBackgroundColor("#ffffff");
        config.setWelcomeMessage("");
        config.setAddress("");
        config.setOpen(false);
        config.setTenant(tenant);
        
        tenantConfigRepository.save(config);

        return new RegisterResponse(
                user.getId(),
                tenant.getBusinessName(),
                tenant.getSlug(),
                tenant.getPhone(),
                user.getRole()
        );
    }

    private String generateUniqueSlug(String businessName) {

        String slug = Normalizer
                .normalize(businessName, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");

        String baseSlug = slug;
        int counter = 2;

        while (tenantRepository.findBySlug(slug).isPresent()) {
            slug = baseSlug + "-" + counter;
            counter++;
        }

        return slug;
    }


    public LoginResponse login(LoginRequest request) {

        User user = userRepository.findByTenantPhone(request.getPhone())
                .orElseThrow(() ->
                        new IllegalArgumentException("Teléfono o contraseña incorrectos"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Teléfono o contraseña incorrectos");
        }

        Tenant tenant = user.getTenant();

        String token = jwtService.generateToken(user);

        return new LoginResponse(
                user.getId(),
                tenant.getBusinessName(),
                tenant.getSlug(),
                tenant.getPhone(),
                user.getRole(),
                token
        );
    }
}