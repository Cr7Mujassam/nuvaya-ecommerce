package com.nuvaya.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity @Table(name = "store_settings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StoreSettings {
    @Id
    private Long id;
    @Column(nullable = false, length = 25)
    private String whatsappNumber;
    @Column(length = 120)
    private String storeEmail;
    @Column(length = 25)
    private String storePhone;
    @Column(length = 300)
    private String storeAddress;
    @Column(length = 255)
    private String instagramUrl;
    @Column(length = 255)
    private String facebookUrl;
    @Column(length = 300)
    private String announcementText;
    @Column(nullable = false, precision = 10, scale = 2) @Builder.Default
    private BigDecimal defaultDeliveryCharge = new BigDecimal("60.00");
    @Column(nullable = false) @Builder.Default
    private boolean freeDeliveryThresholdEnabled = true;
    @Column(nullable = false, precision = 10, scale = 2) @Builder.Default
    private BigDecimal freeDeliveryThreshold = new BigDecimal("1499.00");
}
