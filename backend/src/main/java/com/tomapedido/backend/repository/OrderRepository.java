package com.tomapedido.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tomapedido.backend.entity.Order;

public interface OrderRepository extends JpaRepository<Order, Long> {
}
