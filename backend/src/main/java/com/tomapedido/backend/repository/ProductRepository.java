package com.tomapedido.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.tomapedido.backend.entity.Product;
import com.tomapedido.backend.entity.Tenant;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByTenant(Tenant tenant);

    Optional<Product> findByIdAndTenantId(Long id, Long tenantId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            UPDATE Product product
            SET product.stock = product.stock - :quantity
            WHERE product.id = :productId
                AND product.tenant.id = :tenantId
                AND product.active = true
                AND product.stock >= :quantity
            """)
    int decrementStockIfAvailable(
            @Param("productId") Long productId,
            @Param("tenantId") Long tenantId,
            @Param("quantity") int quantity);

}
