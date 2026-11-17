package com.nuvaya.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "product_images")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductImage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    @Column(nullable = false, length = 500)
    private String imageUrl;
    @Column(length = 60)
    private String colorName;
    @Column(nullable = false) @Builder.Default
    private boolean primaryImage = false;
    @Column(nullable = false) @Builder.Default
    private int displayOrder = 0;
}
