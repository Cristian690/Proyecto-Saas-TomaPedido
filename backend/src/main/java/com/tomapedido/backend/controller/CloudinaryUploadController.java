package com.tomapedido.backend.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tomapedido.backend.dto.CloudinaryUploadSignatureResponse;
import com.tomapedido.backend.service.CloudinaryUploadService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/uploads/cloudinary")
@RequiredArgsConstructor
public class CloudinaryUploadController {

    private final CloudinaryUploadService cloudinaryUploadService;

    @PostMapping("/signatures")
    public CloudinaryUploadSignatureResponse createUploadSignature() {
        return cloudinaryUploadService.createUploadSignature();
    }
}
