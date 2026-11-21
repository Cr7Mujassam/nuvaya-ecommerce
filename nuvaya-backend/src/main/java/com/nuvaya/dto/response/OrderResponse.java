package com.nuvaya.dto.response;

import com.nuvaya.entity.enums.OrderStatus;
import com.nuvaya.entity.enums.PaymentMethod;
import com.nuvaya.entity.enums.PaymentStatus;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder
public class OrderResponse {
    private Long id;
    private String orderReference;
    private String customerName;
    private String customerMobile;
    private String deliveryAddress;
    private String city;
    private String state;
    private String pinCode;
    private String orderNotes;
    private String trackingId;
    private String courierPartner;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private BigDecimal subtotal;
    private BigDecimal deliveryCharges;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private OrderStatus status;
    private LocalDateTime createdAt;
    private List<OrderItemView> items;

    @Data @Builder
    public static class OrderItemView {
        private Long productId;
        private String productName;
        private String selectedColor;
        private String mixedColorsSummary;
        private String selectedSize;
        private String packName;
        private Integer pieceCount;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal lineTotal;
    }
}
