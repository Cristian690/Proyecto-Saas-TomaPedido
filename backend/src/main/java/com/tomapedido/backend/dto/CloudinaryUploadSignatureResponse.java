package com.tomapedido.backend.dto;

public record CloudinaryUploadSignatureResponse(
        String cloudName,
        String apiKey,
        long timestamp,
        String folder,
        String publicId,
        boolean overwrite,
        String signature) {
}
