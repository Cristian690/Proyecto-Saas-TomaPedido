package com.tomapedido.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tomapedido.backend.entity.OrderItem;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
}
