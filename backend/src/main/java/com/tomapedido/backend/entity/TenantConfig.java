package com.tomapedido.backend.entity;

import jakarta.persistence.Column;
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

    private String mercadoPagoAlias;

    private String mercadoPagoAccountHolder;

    @Column(nullable = false)
    private boolean open;

    @Column(nullable = false)
    private boolean stockEnabled = true;

    @Column(nullable = false, length = 20)
    private String deliveryMode = "BOTH";

    @Column(nullable = false, length = 20)
    private String whatsappMode = "ORDERS";

    @OneToOne
    @JoinColumn(name = "tenant_id", nullable = false, unique = true)
    private Tenant tenant;
    
}
