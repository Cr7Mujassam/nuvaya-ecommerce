package com.nuvaya.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity @Table(name = "order_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "order_id", nullable = false)
    private Order order;
    @Column(nullable = false)
    private Long productId;
    @Column(length = 80)
    private String sku;
    @Column(nullable = false, length = 180)
    private String productName;
    @Column(length = 60)
    private String selectedColor;
    @Column(length = 300)
    private String mixedColorsSummary;
    @Column(length = 30)
    private String selectedSize;
    @Column(length = 100)
    private String packName;
    @Column(nullable = false) @Builder.Default
    private Integer pieceCount = 1;
    @Column(nullable = false)
    private Integer quantity;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal lineTotal;
}
