package com.tomapedido.backend.entity;

import java.math.BigDecimal;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {    
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 100)
    private String description;

    @Column(nullable = false, length = 100)
    private BigDecimal price;

    @Column(length = 200)
    private String imageUrl;

    @Column(nullable = false, length = 100)
    private int stock;

    @Column
    @Builder.Default
    private boolean active = true;

    @ManyToOne
    private Category category;

    @ManyToOne
    private Tenant tenant;
}
