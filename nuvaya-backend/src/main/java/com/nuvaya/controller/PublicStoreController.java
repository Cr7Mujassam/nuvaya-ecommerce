package com.nuvaya.controller;

import com.nuvaya.entity.StoreSettings;
import com.nuvaya.service.StoreSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/store") @RequiredArgsConstructor
public class PublicStoreController {
    private final StoreSettingsService storeSettingsService;
    @GetMapping("/settings")
    public ResponseEntity<StoreSettings> getSettings() {
        return ResponseEntity.ok(storeSettingsService.getEntity());
    }
}
