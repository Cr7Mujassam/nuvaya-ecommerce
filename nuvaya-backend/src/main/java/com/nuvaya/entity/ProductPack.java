package com.nuvaya.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity @Table(name = "product_packs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductPack {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    @Column(nullable = false, length = 100)
    private String packName;
    @Column(nullable = false)
    private Integer pieceCount;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal packPrice;
    @Column(precision = 10, scale = 2)
    private BigDecimal discountPrice;
    @Column(precision = 10, scale = 2) @Builder.Default
    private BigDecimal packDeliveryCharge = BigDecimal.ZERO;
    @Column(nullable = false) @Builder.Default
    private boolean allowMixedColors = false;
    @Column(nullable = false) @Builder.Default
    private Integer stockQuantity = 50;
    @Column(nullable = false) @Builder.Default
    private boolean active = true;
}
