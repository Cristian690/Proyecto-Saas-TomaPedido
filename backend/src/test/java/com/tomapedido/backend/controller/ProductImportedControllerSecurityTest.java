package com.tomapedido.backend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.tomapedido.backend.dto.CreateImportedProductRequest;
import com.tomapedido.backend.dto.ProductResponse;
import com.tomapedido.backend.repository.UserRepository;
import com.tomapedido.backend.security.JwtAuthenticationFilter;
import com.tomapedido.backend.security.JwtService;
import com.tomapedido.backend.security.SecurityConfig;
import com.tomapedido.backend.service.ProductService;

@WebMvcTest(ProductController.class)
@Import({ SecurityConfig.class, JwtAuthenticationFilter.class })
class ProductImportedControllerSecurityTest {

    private static final String IMPORT_BODY = """
            {
              "name":"Producto importado",
              "description":"Descripción",
              "imageUrl":"https://example.com/producto.png",
              "categoryName":"Bebidas",
              "tenantId":999,
              "price":999.99,
              "stock":999,
              "active":true
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProductService productService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    void rejectsUnauthenticatedImportedProductRequests() throws Exception {
        mockMvc.perform(post("/products/imported")
                        .contentType("application/json")
                        .content(IMPORT_BODY))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(productService);
    }

    @Test
    void rejectsImportedProductRequestsFromNonAdminUsers() throws Exception {
        mockMvc.perform(post("/products/imported")
                        .with(user("customer").roles("USER"))
                        .contentType("application/json")
                        .content(IMPORT_BODY))
                .andExpect(status().isForbidden());

        verifyNoInteractions(productService);
    }

    @Test
    void acceptsAdminRequestsAndDoesNotBindClientControlledImportFields() throws Exception {
        ProductResponse response = ProductResponse.builder()
                .id(1L)
                .name("Producto importado")
                .description("Descripción")
                .price(null)
                .stock(0)
                .active(false)
                .categoryId(2L)
                .build();
        when(productService.createImportedProduct(any(CreateImportedProductRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/products/imported")
                        .with(user("admin").roles("ADMIN"))
                        .contentType("application/json")
                        .content(IMPORT_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.price").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.stock").value(0))
                .andExpect(jsonPath("$.active").value(false));

        ArgumentCaptor<CreateImportedProductRequest> requestCaptor =
                ArgumentCaptor.forClass(CreateImportedProductRequest.class);
        verify(productService).createImportedProduct(requestCaptor.capture());
        CreateImportedProductRequest request = requestCaptor.getValue();
        assertEquals("Producto importado", request.getName());
        assertEquals("Bebidas", request.getCategoryName());
    }
}
