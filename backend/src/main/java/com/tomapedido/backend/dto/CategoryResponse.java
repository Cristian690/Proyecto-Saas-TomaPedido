package com.tomapedido.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryResponse {
    
    private Long id;
    private String name;
    private String description;
    private String imageUrl;
    private boolean active;
    private Long tenantId;

}
