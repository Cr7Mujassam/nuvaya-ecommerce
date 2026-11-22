package com.nuvaya.entity;

import com.nuvaya.entity.enums.DeliveryChargeType;
import com.nuvaya.entity.enums.ProductStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity @Table(name = "products")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 180)
    private String name;
    @Column(nullable = false, unique = true, length = 200)
    private String slug;
    @Column(nullable = false, unique = true, length = 60)
    private String sku;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Column(columnDefinition = "TEXT")
    private String specifications;
    @Column(length = 100)
    private String fabric;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_sizes", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "size_value", length = 30)
    @Builder.Default
    private List<String> availableSizes = new ArrayList<>();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    private ProductCategory category;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal basePrice;
    @Column(precision = 10, scale = 2)
    private BigDecimal discountPrice;
    @Column(nullable = false) @Builder.Default
    private Integer stockQuantity = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25) @Builder.Default
    private ProductStatus status = ProductStatus.ACTIVE;

    @Column(nullable = false) @Builder.Default private boolean featured = false;
    @Column(nullable = false) @Builder.Default private boolean newArrival = false;
    @Column(nullable = false) @Builder.Default private boolean bestSeller = false;
    @Column(nullable = false) @Builder.Default private boolean premiumHijab = false;
    @Column(nullable = false) @Builder.Default private boolean everydayHijab = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30) @Builder.Default
    private DeliveryChargeType deliveryChargeType = DeliveryChargeType.FREE;

    @Column(nullable = false, precision = 10, scale = 2) @Builder.Default
    private BigDecimal deliveryChargeAmount = BigDecimal.ZERO;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC") @Builder.Default
    private List<ProductColor> colors = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC") @Builder.Default
    private List<ProductImage> images = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("pieceCount ASC") @Builder.Default
    private List<ProductPack> packs = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @PrePersist void onCreate() { this.createdAt = LocalDateTime.now(); this.updatedAt = LocalDateTime.now(); }
    @PreUpdate void onUpdate() { this.updatedAt = LocalDateTime.now(); }
}
