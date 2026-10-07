package com.tomapedido.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tomapedido.backend.entity.Order;
import com.tomapedido.backend.entity.Tenant;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByTenantOrderByCreatedAtDesc(Tenant tenant);
}
