package com.nuvaya.entity;

import com.nuvaya.entity.enums.OrderStatus;
import com.nuvaya.entity.enums.PaymentMethod;
import com.nuvaya.entity.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity @Table(name = "orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Order {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 40)
    private String orderReference;
    @Column(nullable = false, length = 120)
    private String customerName;
    @Column(nullable = false, length = 20)
    private String customerMobile;
    @Column(nullable = false, length = 500)
    private String deliveryAddress;
    @Column(nullable = false, length = 80)
    private String city;
    @Column(nullable = false, length = 80)
    private String state;
    @Column(nullable = false, length = 12)
    private String pinCode;
    @Column(length = 500)
    private String orderNotes;
    @Column(length = 80)
    private String trackingId;
    @Column(length = 80)
    private String courierPartner;
    @Enumerated(EnumType.STRING) @Column(length = 25) @Builder.Default
    private PaymentMethod paymentMethod = PaymentMethod.WHATSAPP;
    @Enumerated(EnumType.STRING) @Column(length = 25) @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;
    @Column(length = 80)
    private String razorpayOrderId;
    @Column(length = 80)
    private String razorpayPaymentId;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal deliveryCharges;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal discountAmount;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal finalAmount;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 25) @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true) @Builder.Default
    private List<OrderItem> items = new ArrayList<>();
    private LocalDateTime createdAt;
    @PrePersist void onCreate() { this.createdAt = LocalDateTime.now(); }
}
