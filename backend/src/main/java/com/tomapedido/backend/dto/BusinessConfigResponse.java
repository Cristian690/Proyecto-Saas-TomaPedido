package com.tomapedido.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class BusinessConfigResponse {

    private Long id;
    private String name;
    private String whatsapp;
    private String logoUrl;
    private String coverUrl;
    private String primaryColor;
    private String backgroundColor;
    private String welcomeMessage;
    private String address;
    private boolean open;
    private boolean stockEnabled;
}
