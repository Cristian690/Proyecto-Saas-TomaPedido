package com.tomapedido.backend.dto;

public record PurgeBereyaImportedProductsResponse(
        String tenantSlug,
        int deletedCount) {
}
