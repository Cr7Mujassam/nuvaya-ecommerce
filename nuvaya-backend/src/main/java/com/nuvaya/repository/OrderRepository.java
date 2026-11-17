package com.nuvaya.repository;
import com.nuvaya.entity.Order;
import com.nuvaya.entity.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface OrderRepository extends JpaRepository<Order, Long> {
    Page<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status, Pageable pageable);
    List<Order> findTop8ByOrderByCreatedAtDesc();
    long countByStatus(OrderStatus status);
}
