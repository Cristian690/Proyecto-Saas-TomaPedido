package com.tomapedido.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.lang.reflect.Proxy;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.tomapedido.backend.dto.BusinessConfigRequest;
import com.tomapedido.backend.dto.BusinessConfigResponse;
import com.tomapedido.backend.entity.Tenant;
import com.tomapedido.backend.entity.TenantConfig;
import com.tomapedido.backend.entity.TenantStatus;
import com.tomapedido.backend.entity.User;
import com.tomapedido.backend.repository.TenantConfigRepository;
import com.tomapedido.backend.repository.TenantRepository;
import com.tomapedido.backend.security.SecurityUtils;

class TenantConfigServicePhoneTest {

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void storesWhatsAppCanonicallyAndReturnsItInLocalDisplayFormat() {
        Tenant tenant = Tenant.builder()
                .id(1L)
                .businessName("Comercio de prueba")
                .slug("comercio-de-prueba")
                .phone("5491164072860")
                .active(true)
                .status(TenantStatus.ACTIVE)
                .build();
        TenantConfig config = new TenantConfig();
        config.setTenant(tenant);
        config.setWhatsapp("5491164072860");
        TenantRepository tenantRepository = repository(TenantRepository.class);
        TenantConfigRepository configRepository = configRepository(config);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        User.builder().tenant(tenant).build(), null));

        TenantConfigService service = new TenantConfigService(
                configRepository,
                tenantRepository,
                new SecurityUtils(),
                new TenantStatusService(tenantRepository));
        BusinessConfigRequest request = new BusinessConfigRequest();
        request.setWhatsapp("11 6407-2860");

        BusinessConfigResponse response = service.saveTenantConfig(request);

        assertEquals("5491164072860", config.getWhatsapp());
        assertEquals("1164072860", response.getWhatsapp());
    }

    @Test
    void returnsLocalWhatsAppFormatForAuthenticatedBusinessPanel() {
        Tenant tenant = Tenant.builder()
                .id(1L)
                .businessName("Comercio de prueba")
                .slug("comercio-de-prueba")
                .phone("5491164072860")
                .active(true)
                .status(TenantStatus.ACTIVE)
                .build();
        TenantConfig config = new TenantConfig();
        config.setTenant(tenant);
        config.setWhatsapp("5491164072860");
        TenantRepository tenantRepository = repository(TenantRepository.class);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        User.builder().tenant(tenant).build(), null));

        TenantConfigService service = new TenantConfigService(
                configRepository(config),
                tenantRepository,
                new SecurityUtils(),
                new TenantStatusService(tenantRepository));

        BusinessConfigResponse response = service.getAuthenticatedTenantConfig();

        assertEquals("1164072860", response.getWhatsapp());
        assertEquals("5491164072860", config.getWhatsapp());
    }

    private TenantConfigRepository configRepository(TenantConfig config) {
        return (TenantConfigRepository) Proxy.newProxyInstance(
                TenantConfigRepository.class.getClassLoader(),
                new Class<?>[] { TenantConfigRepository.class },
                (proxy, method, args) -> {
                    if (method.getName().equals("findByTenant")) {
                        return Optional.of(config);
                    }

                    if (method.getName().equals("save")) {
                        return args[0];
                    }

                    return null;
                });
    }

    @SuppressWarnings("unchecked")
    private <T> T repository(Class<T> type) {
        return (T) Proxy.newProxyInstance(
                type.getClassLoader(),
                new Class<?>[] { type },
                (proxy, method, args) -> null);
    }
}
