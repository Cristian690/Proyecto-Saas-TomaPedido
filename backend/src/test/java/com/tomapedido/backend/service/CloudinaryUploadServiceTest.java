package com.tomapedido.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.tomapedido.backend.config.CloudinaryUploadProperties;
import com.tomapedido.backend.dto.CloudinaryUploadSignatureResponse;
import com.tomapedido.backend.entity.Tenant;
import com.tomapedido.backend.entity.User;
import com.tomapedido.backend.security.SecurityUtils;

class CloudinaryUploadServiceTest {

    @Test
    void createsASignatureForTheAuthenticatedTenantOnly() {
        CloudinaryUploadProperties properties = configuredProperties();
        SecurityUtils securityUtils = mock(SecurityUtils.class);
        TenantStatusService tenantStatusService = mock(TenantStatusService.class);
        Tenant tenant = Tenant.builder().id(42L).build();
        User user = User.builder().tenant(tenant).build();
        when(securityUtils.getAuthenticatedUser()).thenReturn(user);

        CloudinaryUploadService service = new CloudinaryUploadService(
                properties, securityUtils, tenantStatusService);
        long before = Instant.now().getEpochSecond();

        CloudinaryUploadSignatureResponse response = service.createUploadSignature();

        assertEquals("test-cloud", response.cloudName());
        assertEquals("test-key", response.apiKey());
        assertEquals("ordenflash/tenants/42/products", response.folder());
        assertTrue(response.publicId().startsWith("product-"));
        assertEquals(false, response.overwrite());
        assertTrue(response.timestamp() >= before);
        assertEquals(
                service.sign(Map.of(
                        "folder", response.folder(),
                        "overwrite", "false",
                        "public_id", response.publicId(),
                        "timestamp", Long.toString(response.timestamp()))),
                response.signature());
        verify(tenantStatusService).requireAdministrationAllowed(tenant);
    }

    @Test
    void signsCloudinaryParametersUsingTheExpectedCanonicalFormat() {
        CloudinaryUploadService service = new CloudinaryUploadService(
                configuredProperties(), mock(SecurityUtils.class), mock(TenantStatusService.class));

        String signature = service.sign(Map.of(
                "timestamp", "1700000000",
                "public_id", "product-abc",
                "overwrite", "false",
                "folder", "ordenflash/tenants/42/products"));

        assertEquals("9b8ea289fdaedc08146d0ac747cd473217df497c", signature);
    }

    @Test
    void rejectsSignatureRequestsWhenCloudinaryIsNotConfigured() {
        CloudinaryUploadProperties properties = new CloudinaryUploadProperties();
        CloudinaryUploadService service = new CloudinaryUploadService(
                properties, mock(SecurityUtils.class), mock(TenantStatusService.class));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                service::createUploadSignature);

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exception.getStatusCode());
        assertEquals(
                "La carga segura de imágenes no está configurada",
                exception.getReason());
    }

    private CloudinaryUploadProperties configuredProperties() {
        CloudinaryUploadProperties properties = new CloudinaryUploadProperties();
        properties.setCloudName("test-cloud");
        properties.setApiKey("test-key");
        properties.setApiSecret("test-secret");
        return properties;
    }
}
