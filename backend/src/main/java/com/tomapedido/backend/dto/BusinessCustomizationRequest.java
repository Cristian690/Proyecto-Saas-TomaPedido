package com.tomapedido.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BusinessCustomizationRequest {

    private String logoUrl;
    private String coverUrl;
    private String backgroundColor;
    private String primaryColor;
    private String welcomeMessage;
}