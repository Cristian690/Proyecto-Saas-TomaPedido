package com.tomapedido.backend.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.tomapedido.backend.config.CloudinaryUploadProperties;
import com.tomapedido.backend.dto.CloudinaryUploadSignatureResponse;
import com.tomapedido.backend.entity.Tenant;
import com.tomapedido.backend.security.SecurityUtils;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CloudinaryUploadService {

    private final CloudinaryUploadProperties properties;
    private final SecurityUtils securityUtils;
    private final TenantStatusService tenantStatusService;

    public CloudinaryUploadSignatureResponse createUploadSignature() {
        if (!properties.isComplete()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "La carga segura de imágenes no está configurada");
        }

        Tenant tenant = securityUtils.getAuthenticatedUser().getTenant();
        tenantStatusService.requireAdministrationAllowed(tenant);

        long timestamp = Instant.now().getEpochSecond();
        String folder = "ordenflash/tenants/" + tenant.getId() + "/products";
        String publicId = "product-" + UUID.randomUUID();
        boolean overwrite = false;

        Map<String, String> parameters = Map.of(
                "folder", folder,
                "overwrite", Boolean.toString(overwrite),
                "public_id", publicId,
                "timestamp", Long.toString(timestamp));

        return new CloudinaryUploadSignatureResponse(
                properties.getCloudName(),
                properties.getApiKey(),
                timestamp,
                folder,
                publicId,
                overwrite,
                sign(parameters));
    }

    String sign(Map<String, String> parameters) {
        String payload = parameters.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> entry.getKey() + "=" + entry.getValue())
                .collect(Collectors.joining("&")) + properties.getApiSecret();

        try {
            byte[] hash = MessageDigest.getInstance("SHA-1")
                    .digest(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder signature = new StringBuilder(hash.length * 2);

            for (byte value : hash) {
                signature.append(String.format("%02x", value));
            }

            return signature.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-1 no está disponible", exception);
        }
    }
}
