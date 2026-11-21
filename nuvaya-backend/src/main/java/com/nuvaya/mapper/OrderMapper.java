package com.nuvaya.mapper;

import com.nuvaya.dto.response.OrderResponse;
import com.nuvaya.dto.response.OrderTrackingResponse;
import com.nuvaya.entity.Order;
import org.springframework.stereotype.Component;
import java.util.List;

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
                .trackingId(o.getTrackingId())
                .courierPartner(o.getCourierPartner())
                .subtotal(o.getSubtotal())
                .deliveryCharges(o.getDeliveryCharges())
                .discountAmount(o.getDiscountAmount())
                .finalAmount(o.getFinalAmount())
                .status(o.getStatus())
                .createdAt(o.getCreatedAt())
                .items(mapItems(o))
                .build();
    }

    public OrderTrackingResponse toTrackingResponse(Order o) {
        return OrderTrackingResponse.builder()
                .orderReference(o.getOrderReference())
                .customerName(o.getCustomerName())
                .city(o.getCity())
                .state(o.getState())
                .pinCode(o.getPinCode())
                .status(o.getStatus())
                .trackingId(o.getTrackingId())
                .courierPartner(o.getCourierPartner())
                .finalAmount(o.getFinalAmount())
                .createdAt(o.getCreatedAt())
                .items(mapItems(o))
                .build();
    }

    private List<OrderResponse.OrderItemView> mapItems(Order o) {
        return o.getItems().stream().map(i -> OrderResponse.OrderItemView.builder()
                .productId(i.getProductId()).productName(i.getProductName())
                .selectedColor(i.getSelectedColor()).mixedColorsSummary(i.getMixedColorsSummary())
                .selectedSize(i.getSelectedSize()).packName(i.getPackName())
                .pieceCount(i.getPieceCount()).quantity(i.getQuantity())
                .unitPrice(i.getUnitPrice()).lineTotal(i.getLineTotal()).build()).toList();
    }
}
