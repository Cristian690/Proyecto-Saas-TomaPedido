package com.tomapedido.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class TenantConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
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

    @OneToOne
    @JoinColumn(name = "tenant_id", nullable = false, unique = true)
    private Tenant tenant;
    
}