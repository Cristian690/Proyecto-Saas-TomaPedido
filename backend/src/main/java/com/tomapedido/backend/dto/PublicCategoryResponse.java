package com.tomapedido.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PublicCategoryResponse {

    private Long id;
    private String name;
    private String description;
    private String imageUrl;
}