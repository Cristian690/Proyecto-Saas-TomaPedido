package com.tomapedido.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tenants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String businessName;

    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    

}