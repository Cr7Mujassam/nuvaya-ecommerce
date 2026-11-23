package com.nuvaya.controller;

import com.nuvaya.entity.StoreSettings;
import com.nuvaya.service.StoreSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/store")
@RequiredArgsConstructor
public class PublicStoreController {
    private final StoreSettingsService storeSettingsService;

    @GetMapping("/settings")
    public ResponseEntity<StoreSettings> getSettings() {
        return ResponseEntity.ok(storeSettingsService.getEntity());
    }

    @PostMapping("/track")
    public ResponseEntity<?> trackPageView(@RequestBody(required = false) Map<String, Object> payload) {
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}
