package com.tomapedido.backend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
import com.tomapedido.backend.dto.PurgeBereyaImportedProductsRequest;
import com.tomapedido.backend.dto.UpdateProductCategoryRequest;
import com.tomapedido.backend.repository.UserRepository;
import com.tomapedido.backend.service.BereyaImportedProductsPurgeService;
import com.tomapedido.backend.service.ProductPermanentDeletionService;
import com.tomapedido.backend.security.JwtAuthenticationFilter;
import com.tomapedido.backend.security.JwtService;
import com.tomapedido.backend.security.SecurityConfig;
import com.tomapedido.backend.service.ProductService;

@WebMvcTest(ProductController.class)
@Import({ SecurityConfig.class, JwtAuthenticationFilter.class })
class ProductImportedControllerSecurityTest {

    private static final String CATEGORY_BODY = """
            { "categoryName": "Didácticos" }
            """;

    private static final String PURGE_BODY = """
            { "confirmation": "ELIMINAR 57 PRODUCTOS DE PRUEBA DE BEREYA (bereya-juegos-didacticos)" }
            """;

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
    private BereyaImportedProductsPurgeService bereyaImportedProductsPurgeService;

    @MockitoBean
    private ProductPermanentDeletionService productPermanentDeletionService;

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

    @Test
    void rejectsUnauthenticatedCategoryUpdateRequests() throws Exception {
        mockMvc.perform(patch("/products/10/category")
                        .contentType("application/json")
                        .content(CATEGORY_BODY))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(productService);
    }

    @Test
    void rejectsCategoryUpdateRequestsFromNonAdminUsers() throws Exception {
        mockMvc.perform(patch("/products/10/category")
                        .with(user("customer").roles("USER"))
                        .contentType("application/json")
                        .content(CATEGORY_BODY))
                .andExpect(status().isForbidden());

        verifyNoInteractions(productService);
    }

    @Test
    void acceptsAdminCategoryUpdateRequests() throws Exception {
        ProductResponse response = ProductResponse.builder()
                .id(10L)
                .name("Producto importado")
                .description("Descripción")
                .price(null)
                .stock(0)
                .active(false)
                .categoryId(4L)
                .build();
        when(productService.updateProductCategory(eq(10L), any(UpdateProductCategoryRequest.class)))
                .thenReturn(response);

        mockMvc.perform(patch("/products/10/category")
                        .with(user("admin").roles("ADMIN"))
                        .contentType("application/json")
                        .content(CATEGORY_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.price").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.stock").value(0))
                .andExpect(jsonPath("$.active").value(false));

        ArgumentCaptor<UpdateProductCategoryRequest> requestCaptor =
                ArgumentCaptor.forClass(UpdateProductCategoryRequest.class);
        verify(productService).updateProductCategory(eq(10L), requestCaptor.capture());
        assertEquals("Didácticos", requestCaptor.getValue().getCategoryName());
    }

    @Test
    void rejectsUnauthenticatedPermanentProductDeletionRequests() throws Exception {
        mockMvc.perform(delete("/products/10/permanent"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(productPermanentDeletionService);
    }

    @Test
    void rejectsPermanentProductDeletionRequestsFromNonAdminUsers() throws Exception {
        mockMvc.perform(delete("/products/10/permanent")
                        .with(user("customer").roles("USER")))
                .andExpect(status().isForbidden());

        verifyNoInteractions(productPermanentDeletionService);
    }

    @Test
    void acceptsAdminPermanentProductDeletionRequests() throws Exception {
        mockMvc.perform(delete("/products/10/permanent")
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk());

        verify(productPermanentDeletionService).permanentlyDeleteProduct(10L);
    }

    @Test
    void rejectsUnauthenticatedBereyaPurgeRequests() throws Exception {
        mockMvc.perform(post("/products/imported/bereya-test/purge")
                        .contentType("application/json")
                        .content(PURGE_BODY))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(bereyaImportedProductsPurgeService);
    }

    @Test
    void rejectsBereyaPurgeRequestsFromNonAdminUsers() throws Exception {
        mockMvc.perform(post("/products/imported/bereya-test/purge")
                        .with(user("customer").roles("USER"))
                        .contentType("application/json")
                        .content(PURGE_BODY))
                .andExpect(status().isForbidden());

        verifyNoInteractions(bereyaImportedProductsPurgeService);
    }

    @Test
    void acceptsAdminBereyaPurgeRequestsWithOnlyTheConfirmation() throws Exception {
        when(bereyaImportedProductsPurgeService.purge(any(PurgeBereyaImportedProductsRequest.class)))
                .thenReturn(new com.tomapedido.backend.dto.PurgeBereyaImportedProductsResponse(
                        "bereya-juegos-didacticos", 57));

        mockMvc.perform(post("/products/imported/bereya-test/purge")
                        .with(user("admin").roles("ADMIN"))
                        .contentType("application/json")
                        .content(PURGE_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tenantSlug").value("bereya-juegos-didacticos"))
                .andExpect(jsonPath("$.deletedCount").value(57));

        ArgumentCaptor<PurgeBereyaImportedProductsRequest> requestCaptor =
                ArgumentCaptor.forClass(PurgeBereyaImportedProductsRequest.class);
        verify(bereyaImportedProductsPurgeService).purge(requestCaptor.capture());
        assertEquals(
                "ELIMINAR 57 PRODUCTOS DE PRUEBA DE BEREYA (bereya-juegos-didacticos)",
                requestCaptor.getValue().getConfirmation());
    }
}
