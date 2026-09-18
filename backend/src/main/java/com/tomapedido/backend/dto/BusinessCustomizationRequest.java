package com.tomapedido.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BusinessCustomizationRequest {

    private String logoUrl;
    private String backgroundColor;
    private String primaryColor;
}