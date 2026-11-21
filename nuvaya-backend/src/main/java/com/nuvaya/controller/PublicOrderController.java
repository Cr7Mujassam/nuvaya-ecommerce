package com.nuvaya.controller;

import com.nuvaya.dto.request.OrderRequest;
import com.nuvaya.dto.response.OrderResponse;
import com.nuvaya.dto.response.OrderTrackingResponse;
import com.nuvaya.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/orders") @RequiredArgsConstructor
public class PublicOrderController {
    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody OrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createOrder(request));
    }

    @GetMapping("/track/{orderReference}")
    public ResponseEntity<OrderTrackingResponse> trackOrder(@PathVariable String orderReference) {
        return ResponseEntity.ok(orderService.trackOrder(orderReference));
    }
}
