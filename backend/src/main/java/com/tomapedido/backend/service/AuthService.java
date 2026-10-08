package com.tomapedido.backend.service;

import java.time.LocalDateTime;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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

    public boolean phoneExists(String phone) {
        return tenantRepository.findByPhone(phone).isPresent();
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {

        if (request.getPhone() == null
                || !request.getPhone().matches("\\d{10}")) {
            throw new IllegalArgumentException(
                    "El teléfono debe tener exactamente 10 dígitos");
        }

        if (tenantRepository.findByPhone(request.getPhone()).isPresent()) {
            throw new IllegalArgumentException("El número ya está en uso");
        }

        String slug = generateUniqueSlug(request.getBusinessName());

        LocalDateTime trialStartedAt = LocalDateTime.now();

        Tenant tenant = Tenant.builder()
                .businessName(request.getBusinessName())
                .slug(slug)
                .email(request.getEmail())
                .phone(request.getPhone())
                .trialStartedAt(trialStartedAt)
                .trialEndsAt(trialStartedAt.plusDays(14))
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
        config.setOpen(true);
        config.setStockEnabled(true);
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

        if (!Boolean.TRUE.equals(user.getTenant().getActive())
                || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
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
