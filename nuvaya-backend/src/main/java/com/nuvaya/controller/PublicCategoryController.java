package com.nuvaya.controller;

import com.nuvaya.entity.ProductCategory;
import com.nuvaya.repository.ProductCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/v1/categories") @RequiredArgsConstructor
public class PublicCategoryController {
    private final ProductCategoryRepository categoryRepository;
    @GetMapping
    public ResponseEntity<List<ProductCategory>> getAllActive() {
        return ResponseEntity.ok(categoryRepository.findByActiveTrueOrderByDisplayOrderAscNameAsc());
    }
}
