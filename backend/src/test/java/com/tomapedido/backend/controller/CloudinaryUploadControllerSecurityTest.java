package com.tomapedido.backend.controller;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.tomapedido.backend.repository.UserRepository;
import com.tomapedido.backend.security.JwtAuthenticationFilter;
import com.tomapedido.backend.security.JwtService;
import com.tomapedido.backend.security.SecurityConfig;
import com.tomapedido.backend.service.CloudinaryUploadService;

@WebMvcTest(CloudinaryUploadController.class)
@Import({ SecurityConfig.class, JwtAuthenticationFilter.class })
class CloudinaryUploadControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CloudinaryUploadService cloudinaryUploadService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    void rejectsUnauthenticatedSignatureRequests() throws Exception {
        mockMvc.perform(post("/uploads/cloudinary/signatures"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(cloudinaryUploadService);
    }
}
