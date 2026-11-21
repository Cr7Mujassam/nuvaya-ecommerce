package com.nuvaya.controller;

import com.nuvaya.dto.response.OrderResponse;
import com.nuvaya.entity.StoreSettings;
import com.nuvaya.entity.enums.OrderStatus;
import com.nuvaya.service.OrderService;
import com.nuvaya.service.StoreSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController @RequestMapping("/api/v1/admin") @RequiredArgsConstructor
public class AdminOrderController {
    private final OrderService orderService;
    private final StoreSettingsService storeSettingsService;

    @GetMapping("/orders")
    public ResponseEntity<Page<OrderResponse>> list(@RequestParam(required = false) OrderStatus status,
                                                    @RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(orderService.getAllOrders(status, PageRequest.of(page, size)));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<OrderResponse> detail(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<OrderResponse> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        OrderStatus st = body.get("status") != null && !body.get("status").isBlank()
                ? OrderStatus.valueOf(body.get("status").toUpperCase()) : null;
        return ResponseEntity.ok(orderService.updateOrderStatus(
                id, st, body.get("trackingId"), body.get("courierPartner")));
    }

    @PutMapping("/store/settings")
    public ResponseEntity<StoreSettings> updateSettings(@RequestBody StoreSettings settings) {
        return ResponseEntity.ok(storeSettingsService.update(settings));
    }
}
