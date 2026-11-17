package com.nuvaya.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "product_categories")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductCategory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 100)
    private String name;
    @Column(nullable = false, unique = true, length = 120)
    private String slug;
    @Column(length = 500)
    private String description;
    @Column(length = 500)
    private String bannerImageUrl;
    @Column(nullable = false) @Builder.Default
    private boolean active = true;
    @Column(nullable = false) @Builder.Default
    private int displayOrder = 0;
}
