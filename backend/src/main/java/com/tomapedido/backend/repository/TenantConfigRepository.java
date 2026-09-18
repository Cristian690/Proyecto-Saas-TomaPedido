package com.tomapedido.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tomapedido.backend.entity.Tenant;
import com.tomapedido.backend.entity.TenantConfig;

public interface TenantConfigRepository extends JpaRepository<TenantConfig, Long> {

    Optional<TenantConfig> findByTenant(Tenant tenant);

}