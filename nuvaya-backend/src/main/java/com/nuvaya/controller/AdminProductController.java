package com.nuvaya.controller;

import com.nuvaya.dto.request.ProductRequest;
import com.nuvaya.dto.response.ProductResponse;
import com.nuvaya.entity.ProductCategory;
import com.nuvaya.entity.enums.OrderStatus;
import com.nuvaya.entity.enums.ProductStatus;
import com.nuvaya.repository.*;
import com.nuvaya.service.OrderService;
import com.nuvaya.service.ProductService;
import com.nuvaya.service.storage.ImageStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminProductController {
    private final ProductService productService;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final ProductCategoryRepository categoryRepository;
    private final ImageStorageService storageService;

    @GetMapping("/dashboard")
    public ResponseEntity<Object> dashboard() {
        return ResponseEntity.ok(Map.of(
                "totalProducts", productRepository.count(),
                "activeProducts", productRepository.countByStatus(ProductStatus.ACTIVE),
                "outOfStockProducts", productRepository.countByStockQuantityLessThanEqual(0),
                "totalOrders", orderRepository.count(),
                "pendingOrders", orderRepository.countByStatus(OrderStatus.PENDING),
                "recentOrders", orderService.getRecentOrders(),
                "recentProducts", productService.getAllAdminProducts(0, 5).getContent()
        ));
    }

    @GetMapping("/products")
    public ResponseEntity<Page<ProductResponse>> listAll(@RequestParam(defaultValue = "0") int page,
                                                         @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(productService.getAllAdminProducts(page, size));
    }

    @PostMapping("/products")
    public ResponseEntity<ProductResponse> create(@Valid @RequestBody ProductRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(req));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<ProductResponse> update(@PathVariable Long id, @Valid @RequestBody ProductRequest req) {
        return ResponseEntity.ok(productService.updateProduct(id, req));
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }


    @PostMapping("/uploads/image")
    public ResponseEntity<Object> uploadImage(@RequestParam("file") MultipartFile file) {
        String url = storageService.store(file, "products");
        return ResponseEntity.ok(Map.of("imageUrl", url));
    }
}
