package com.tomapedido.backend.service;

import java.time.LocalDateTime;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.tomapedido.backend.security.JwtService;
import com.tomapedido.backend.security.ArgentineWhatsAppNormalizer;

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
        String normalizedPhone = normalizePhone(phone);
        return findTenantByNormalizedPhone(normalizedPhone).isPresent();
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {

        String normalizedPhone = normalizePhone(request.getPhone());

        if (findTenantByNormalizedPhone(normalizedPhone).isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "El número ya está en uso");
        }

        String slug = generateUniqueSlug(request.getBusinessName());

        LocalDateTime trialStartedAt = LocalDateTime.now();

        Tenant tenant = Tenant.builder()
                .businessName(request.getBusinessName())
                .slug(slug)
                .email(request.getEmail())
                .phone(normalizedPhone)
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
        config.setWhatsapp(normalizedPhone);
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

        String normalizedPhone;

        try {
            normalizedPhone = ArgentineWhatsAppNormalizer.normalize(request.getPhone());
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Teléfono o contraseña incorrectos");
        }

        User user = findUserByNormalizedPhone(normalizedPhone)
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

    private String normalizePhone(String phone) {
        try {
            return ArgentineWhatsAppNormalizer.normalize(phone);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    exception.getMessage());
        }
    }

    private java.util.Optional<Tenant> findTenantByNormalizedPhone(
            String normalizedPhone) {

        return tenantRepository.findByPhone(normalizedPhone)
                .or(() -> tenantRepository.findByPhone(
                        ArgentineWhatsAppNormalizer.toLegacyLocalNumber(normalizedPhone)));
    }

    private java.util.Optional<User> findUserByNormalizedPhone(
            String normalizedPhone) {

        return userRepository.findByTenantPhone(normalizedPhone)
                .or(() -> userRepository.findByTenantPhone(
                        ArgentineWhatsAppNormalizer.toLegacyLocalNumber(normalizedPhone)));
    }
}
