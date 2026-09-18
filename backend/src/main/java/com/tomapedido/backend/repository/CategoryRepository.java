package com.tomapedido.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tomapedido.backend.entity.Category;
import com.tomapedido.backend.entity.Tenant;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByTenant(Tenant tenant);

    Optional<Category> findByNameAndTenant(String name, Tenant tenant);

}