package com.nuvaya.dto.response;

import com.nuvaya.entity.enums.OrderStatus;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder
public class OrderTrackingResponse {
    private String orderReference;
    private String customerName;
    private String city;
    private String state;
    private String pinCode;
    private OrderStatus status;
    private String trackingId;
    private String courierPartner;
    private BigDecimal finalAmount;
    private LocalDateTime createdAt;
    private List<OrderResponse.OrderItemView> items;
}
