package com.tomapedido.backend.dto;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TenantResponse {
    
    private Long id;
    private String businessName;
    private String slug;
    private String email;
    private String phone;
    private Boolean active;

    

}