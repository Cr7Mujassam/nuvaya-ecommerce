package com.nuvaya.controller;

import com.nuvaya.dto.request.OrderRequest;
import com.nuvaya.dto.response.OrderResponse;
import com.nuvaya.dto.response.OrderTrackingResponse;
import com.nuvaya.service.OrderService;
import com.nuvaya.service.RazorpayPaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController @RequestMapping("/api/v1/orders") @RequiredArgsConstructor
public class PublicOrderController {
    private final OrderService orderService;
    private final RazorpayPaymentService razorpayPaymentService;

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody OrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createOrder(request));
    }

    @GetMapping("/track/{orderReference}")
    public ResponseEntity<OrderTrackingResponse> trackOrder(@PathVariable String orderReference) {
        return ResponseEntity.ok(orderService.trackOrder(orderReference));
    }

    @PostMapping("/{orderReference}/payment/razorpay/initiate")
    public ResponseEntity> initiateRazorpay(@PathVariable String orderReference) {
        return ResponseEntity.ok(razorpayPaymentService.createGatewayOrder(orderReference));
    }

    @PostMapping("/{orderReference}/payment/razorpay/verify")
    public ResponseEntity<OrderResponse> verifyRazorpay(@PathVariable String orderReference,
                                                        @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(razorpayPaymentService.verifyAndCapture(
                orderReference,
                body.get("razorpay_order_id"),
                body.get("razorpay_payment_id"),
                body.get("razorpay_signature")
        ));
    }
}
