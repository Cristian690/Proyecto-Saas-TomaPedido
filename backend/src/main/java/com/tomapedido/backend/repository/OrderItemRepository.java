package com.tomapedido.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tomapedido.backend.entity.Order;
import com.tomapedido.backend.entity.OrderItem;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrderIn(List<Order> orders);
}
