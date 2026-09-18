package com.tomapedido.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tomapedido.backend.dto.PublicCategoryResponse;
import com.tomapedido.backend.dto.PublicProductResponse;
import com.tomapedido.backend.service.PublicStoreService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/public")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PublicStoreController {

    private final PublicStoreService publicStoreService;

    @GetMapping("/{slug}/categories")
    public List<PublicCategoryResponse> getCategories(
            @PathVariable String slug) {

        return publicStoreService.getCategoriesBySlug(slug);
    }

    @GetMapping("/{slug}/products")
    public List<PublicProductResponse> getProducts(
            @PathVariable String slug) {

        return publicStoreService.getProductsBySlug(slug);
    }
}