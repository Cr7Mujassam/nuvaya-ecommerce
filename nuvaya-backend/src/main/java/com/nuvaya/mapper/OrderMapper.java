package com.nuvaya.mapper;

import com.nuvaya.dto.response.OrderResponse;
import com.nuvaya.entity.Order;
import org.springframework.stereotype.Component;

@Component
public class OrderMapper {
    public OrderResponse toResponse(Order o) {
        return OrderResponse.builder()
                .id(o.getId())
                .orderReference(o.getOrderReference())
                .customerName(o.getCustomerName())
                .customerMobile(o.getCustomerMobile())
                .deliveryAddress(o.getDeliveryAddress())
                .city(o.getCity())
                .state(o.getState())
                .pinCode(o.getPinCode())
                .orderNotes(o.getOrderNotes())
                .subtotal(o.getSubtotal())
                .deliveryCharges(o.getDeliveryCharges())
                .discountAmount(o.getDiscountAmount())
                .finalAmount(o.getFinalAmount())
                .status(o.getStatus())
                .createdAt(o.getCreatedAt())
                .items(o.getItems().stream().map(i -> OrderResponse.OrderItemView.builder()
                        .productId(i.getProductId()).productName(i.getProductName())
                        .selectedColor(i.getSelectedColor()).mixedColorsSummary(i.getMixedColorsSummary())
                        .selectedSize(i.getSelectedSize()).packName(i.getPackName())
                        .pieceCount(i.getPieceCount()).quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice()).lineTotal(i.getLineTotal()).build()).toList())
                .build();
    }
}
