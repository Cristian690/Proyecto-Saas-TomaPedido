package com.tomapedido.backend.repository;

import com.tomapedido.backend.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantRepository extends JpaRepository<Tenant, Long> {

}