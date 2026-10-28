package com.tomapedido.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PatchMapping;

import com.tomapedido.backend.dto.CreateProductRequest;
import com.tomapedido.backend.dto.CreateImportedProductRequest;
import com.tomapedido.backend.dto.ProductResponse;
import com.tomapedido.backend.dto.PurgeBereyaImportedProductsRequest;
import com.tomapedido.backend.dto.PurgeBereyaImportedProductsResponse;
import com.tomapedido.backend.dto.UpdateProductCategoryRequest;
import com.tomapedido.backend.service.BereyaImportedProductsPurgeService;
import com.tomapedido.backend.service.ProductPermanentDeletionService;
import com.tomapedido.backend.service.ProductService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final BereyaImportedProductsPurgeService bereyaImportedProductsPurgeService;
    private final ProductPermanentDeletionService productPermanentDeletionService;

    @PostMapping
    public ProductResponse createProduct(@Valid @RequestBody CreateProductRequest request) {
        return productService.createProduct(request);
    }

    @PostMapping("/imported")
    public ProductResponse createImportedProduct(
            @Valid @RequestBody CreateImportedProductRequest request) {
        return productService.createImportedProduct(request);
    }

    @PostMapping("/imported/bereya-test/purge")
    public PurgeBereyaImportedProductsResponse purgeBereyaImportedProducts(
            @Valid @RequestBody PurgeBereyaImportedProductsRequest request) {
        return bereyaImportedProductsPurgeService.purge(request);
    }

    @GetMapping("/{id}")
    public ProductResponse getProductById(@PathVariable Long id) {
        return productService.getProductById(id);
    }

    @GetMapping
    public List<ProductResponse> getAllProducts() {
        return productService.getAllProducts();
    }

    @PutMapping("/{id}")
    public ProductResponse updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody CreateProductRequest request) {
        return productService.updateProduct(id, request);
    }

    @PatchMapping("/{id}/category")
    public ProductResponse updateProductCategory(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProductCategoryRequest request) {
        return productService.updateProductCategory(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
    }

    @DeleteMapping("/{id}/permanent")
    public void permanentlyDeleteProduct(@PathVariable Long id) {
        productPermanentDeletionService.permanentlyDeleteProduct(id);
    }

    @PatchMapping("/{id}/activate")
    public void activateProduct(@PathVariable Long id) {
        productService.activateProduct(id);
    }
}
