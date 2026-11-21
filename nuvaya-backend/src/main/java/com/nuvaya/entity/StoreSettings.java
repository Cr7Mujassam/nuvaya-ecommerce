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

    // Payment & COD Configuration (wrapper types prevent Hibernate NULL-to-primitive crashes)
    @Column(name = "cod_enabled") @Builder.Default
    private Boolean codEnabled = true;
    @Column(name = "cod_handling_fee", precision = 10, scale = 2) @Builder.Default
    private BigDecimal codHandlingFee = BigDecimal.ZERO;
    @Column(name = "online_payment_enabled") @Builder.Default
    private Boolean onlinePaymentEnabled = true;

    public boolean isCodEnabled() {
        return codEnabled == null || codEnabled;
    }

    public boolean isOnlinePaymentEnabled() {
        return onlinePaymentEnabled == null || onlinePaymentEnabled;
    }

    // Live Sale & Offer Campaign Fields
    @Column(nullable = false) @Builder.Default
    private boolean saleActive = false;
    @Column(length = 80)
    private String saleType;
    @Column(length = 80)
    private String saleBadgeText;
    @Column(length = 180)
    private String saleTitle;
    @Column(length = 400)
    private String saleSubtitle;
    @Column(length = 500)
    private String saleBannerImageUrl;
    @Column(length = 80)
    private String saleCtaText;
    @Column(length = 200)
    private String saleCtaLink;
}
