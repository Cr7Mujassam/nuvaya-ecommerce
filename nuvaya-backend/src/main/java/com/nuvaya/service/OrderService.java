package com.nuvaya.service;

import com.nuvaya.dto.request.OrderRequest;
import com.nuvaya.dto.response.OrderResponse;
import com.nuvaya.dto.response.OrderTrackingResponse;
import com.nuvaya.entity.*;
import com.nuvaya.entity.enums.*;
import com.nuvaya.exception.*;
import com.nuvaya.mapper.OrderMapper;
import com.nuvaya.repository.*;
import com.nuvaya.util.OrderReferenceGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service @RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final StoreSettingsService storeSettingsService;
    private final OrderMapper orderMapper;
    private final OrderEmailService orderEmailService;

    @Transactional
    public OrderResponse createOrder(OrderRequest request) {
        StoreSettings settings = storeSettingsService.getEntity();
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal deliveryTotal = BigDecimal.ZERO;

        PaymentMethod pm = request.getPaymentMethod() != null ? request.getPaymentMethod() : PaymentMethod.WHATSAPP;
        if (pm == PaymentMethod.COD && !settings.isCodEnabled()) {
            throw new BusinessValidationException("Cash on Delivery is currently disabled.");
        }
        if (pm == PaymentMethod.ONLINE && !settings.isOnlinePaymentEnabled()) {
            throw new BusinessValidationException("Online payment is currently disabled.");
        }
        PaymentStatus initialPayStatus = (pm == PaymentMethod.COD) ? PaymentStatus.COD_PENDING : PaymentStatus.PENDING;

        Order order = Order.builder()
                .orderReference(OrderReferenceGenerator.generate())
                .customerName(request.getCustomerName().trim())
                .customerMobile(request.getCustomerMobile().trim())
                .customerEmail(request.getCustomerEmail() != null && !request.getCustomerEmail().isBlank() ? request.getCustomerEmail().trim() : null)
                .deliveryAddress(request.getDeliveryAddress().trim())
                .city(request.getCity().trim())
                .state(request.getState().trim())
                .pinCode(request.getPinCode().trim())
                .orderNotes(request.getOrderNotes())
                .paymentMethod(pm)
                .paymentStatus(initialPayStatus)
                .status(OrderStatus.PENDING)
                .items(new ArrayList<>())
                .build();

        for (OrderRequest.OrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + itemReq.getProductId()));
            if (product.getStatus() != ProductStatus.ACTIVE)
                throw new BusinessValidationException(product.getName() + " is currently unavailable");

            int qty = itemReq.getQuantity();
            BigDecimal origPrice;
            BigDecimal effPrice;
            String packName = "Single Piece";
            int pieceCount = 1;
            BigDecimal packShipping = BigDecimal.ZERO;

            if (itemReq.getPackId() != null) {
                ProductPack pack = product.getPacks().stream()
                        .filter(p -> p.getId().equals(itemReq.getPackId()) && p.isActive())
                        .findFirst().orElseThrow(() -> new BusinessValidationException("Pack unavailable"));
                if (pack.getStockQuantity() < qty)
                    throw new BusinessValidationException("Insufficient stock for " + product.getName());
                pack.setStockQuantity(pack.getStockQuantity() - qty);
                origPrice = pack.getPackPrice();
                effPrice = (pack.getDiscountPrice() != null && pack.getDiscountPrice().compareTo(BigDecimal.ZERO) > 0)
                        ? pack.getDiscountPrice() : pack.getPackPrice();
                packName = pack.getPackName();
                pieceCount = pack.getPieceCount();
                packShipping = pack.getPackDeliveryCharge() != null ? pack.getPackDeliveryCharge() : BigDecimal.ZERO;
            } else {
                if (product.getStockQuantity() < qty)
                    throw new BusinessValidationException("Insufficient stock for " + product.getName());
                product.setStockQuantity(product.getStockQuantity() - qty);
                if (product.getStockQuantity() == 0) product.setStatus(ProductStatus.OUT_OF_STOCK);
                origPrice = product.getBasePrice();
                effPrice = (product.getDiscountPrice() != null && product.getDiscountPrice().compareTo(BigDecimal.ZERO) > 0)
                        ? product.getDiscountPrice() : product.getBasePrice();
            }

            BigDecimal lineOrig = origPrice.multiply(BigDecimal.valueOf(qty));
            BigDecimal lineEff = effPrice.multiply(BigDecimal.valueOf(qty));
            subtotal = subtotal.add(lineOrig);
            totalDiscount = totalDiscount.add(lineOrig.subtract(lineEff).max(BigDecimal.ZERO));

            BigDecimal fee = product.getDeliveryChargeAmount() != null ? product.getDeliveryChargeAmount() : BigDecimal.ZERO;
            deliveryTotal = deliveryTotal.add(switch (product.getDeliveryChargeType()) {
                case FREE -> BigDecimal.ZERO;
                case FIXED_PER_PRODUCT -> fee;
                case PER_PACK_OPTION -> packShipping;
                case PER_QUANTITY -> fee.multiply(BigDecimal.valueOf(qty));
            });

            String mixed = (itemReq.getMixedColors() != null && !itemReq.getMixedColors().isEmpty())
                    ? String.join(", ", itemReq.getMixedColors()) : null;

            order.getItems().add(OrderItem.builder()
                    .order(order).productId(product.getId()).productName(product.getName())
                    .selectedColor(itemReq.getSelectedColor()).mixedColorsSummary(mixed)
                    .selectedSize(itemReq.getSelectedSize()).packName(packName)
                    .pieceCount(pieceCount).quantity(qty).unitPrice(effPrice).lineTotal(lineEff).build());
        }

        BigDecimal net = subtotal.subtract(totalDiscount);
        if (settings.isFreeDeliveryThresholdEnabled() && net.compareTo(settings.getFreeDeliveryThreshold()) >= 0) {
            deliveryTotal = BigDecimal.ZERO;
        }
        boolean fastDelivery = "EXPRESS".equalsIgnoreCase(request.getDeliveryType()) || "FAST".equalsIgnoreCase(request.getDeliveryType());
        BigDecimal fastDeliveryFee = BigDecimal.valueOf(40);
        if (fastDelivery) {
            deliveryTotal = deliveryTotal.add(fastDeliveryFee);
            String existingNotes = order.getOrderNotes() != null ? order.getOrderNotes().trim() : "";
            if (!existingNotes.contains("Fast Delivery")) {
                order.setOrderNotes(existingNotes.isEmpty() ? "Delivery Option: Fast Delivery (+₹40)" : existingNotes + " | Delivery Option: Fast Delivery (+₹40)");
            }
        }
        BigDecimal orderBeforeCodFee = net.add(deliveryTotal);
        if (pm == PaymentMethod.COD && orderBeforeCodFee.compareTo(BigDecimal.valueOf(300)) >= 0) {
            throw new BusinessValidationException("Cash on Delivery is available only for orders below ₹300. Please choose Online Payment (Razorpay) or WhatsApp.");
        }
        BigDecimal codNominalFee = BigDecimal.valueOf(35);
        if (pm == PaymentMethod.COD) {
            deliveryTotal = deliveryTotal.add(codNominalFee);
            if (settings.getCodHandlingFee() != null && settings.getCodHandlingFee().compareTo(BigDecimal.ZERO) > 0) {
                deliveryTotal = deliveryTotal.add(settings.getCodHandlingFee());
            }
        }
        order.setSubtotal(subtotal);
        order.setDiscountAmount(totalDiscount);
        order.setDeliveryCharges(deliveryTotal);
        order.setFinalAmount(net.add(deliveryTotal));

        Order savedOrder = orderRepository.save(order);
        if (pm != PaymentMethod.ONLINE) {
            orderEmailService.sendOrderAlert(savedOrder, "New " + pm + " Order Received");
        }
        return orderMapper.toResponse(savedOrder);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getAllOrders(OrderStatus status, Pageable pageable) {
        return (status != null ? orderRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                : orderRepository.findAllByOrderByCreatedAtDesc(pageable)).map(orderMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        return orderMapper.toResponse(orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found")));
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long id, OrderStatus status, String trackingId, String courierPartner) {
        Order o = orderRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (status != null) {
            o.setStatus(status);
            if (status == OrderStatus.DELIVERED && o.getPaymentMethod() == PaymentMethod.COD) {
                o.setPaymentStatus(PaymentStatus.PAID);
            }
        }
        if (trackingId != null) {
            o.setTrackingId(trackingId.trim().isEmpty() ? null : trackingId.trim());
        }
        if (courierPartner != null) {
            o.setCourierPartner(courierPartner.trim().isEmpty() ? null : courierPartner.trim());
        }
        Order updated = orderRepository.save(o);
        if (status == OrderStatus.CONFIRMED || status == OrderStatus.PACKED || status == OrderStatus.SHIPPED || status == OrderStatus.DELIVERED) {
            orderEmailService.sendOrderAlert(updated, "Order Status Updated: " + status);
        }
        return orderMapper.toResponse(updated);
    }

    @Transactional(readOnly = true)
    public OrderTrackingResponse trackOrder(String orderReference) {
        String cleanRef = orderReference == null ? "" : orderReference.trim();
        Order o = orderRepository.findByOrderReferenceIgnoreCase(cleanRef)
                .orElseThrow(() -> new ResourceNotFoundException("No order found with reference: " + cleanRef));
        return orderMapper.toTrackingResponse(o);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getRecentOrders() {
        return orderRepository.findTop8ByOrderByCreatedAtDesc().stream().map(orderMapper::toResponse).toList();
    }

    @Transactional
    public void deleteOrder(Long id) {
        Order o = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id));
        orderRepository.delete(o);
    }
}
