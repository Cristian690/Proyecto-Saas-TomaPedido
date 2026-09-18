package com.tomapedido.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tomapedido.backend.entity.Product;
import com.tomapedido.backend.entity.Tenant;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByTenant(Tenant tenant);

}