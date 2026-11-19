package com.nuvaya.controller;

import com.nuvaya.dto.request.ReviewRequest;
import com.nuvaya.dto.response.ReviewSummaryResponse;
import com.nuvaya.entity.enums.ReviewStatus;
import com.nuvaya.service.ProductReviewService;
import com.nuvaya.service.storage.ImageStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ProductReviewController {
    private final ProductReviewService reviewService;
    private final ImageStorageService storageService;

    @GetMapping("/products/{productId}/reviews")
    public ResponseEntity<ReviewSummaryResponse> getProductReviews(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "recent") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return ResponseEntity.ok(reviewService.getPublicReviews(productId, sortBy, page, size));
    }

    @PostMapping("/products/{productId}/reviews")
    public ResponseEntity<ReviewSummaryResponse.ReviewItemDto> submitReview(
            @PathVariable Long productId,
            @Valid @RequestBody ReviewRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reviewService.submitReview(productId, req));
    }

    @PostMapping("/products/reviews/upload-image")
    public ResponseEntity> uploadReviewImage(@RequestParam("file") MultipartFile file) {
        String url = storageService.store(file, "reviews");
        return ResponseEntity.ok(Map.of("imageUrl", url));
    }

    @GetMapping("/admin/reviews")
    public ResponseEntity<Page<ReviewSummaryResponse.ReviewItemDto>> listAdminReviews(
            @RequestParam(defaultValue = "ALL") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(reviewService.getAdminReviews(status, page, size));
    }

    @PutMapping("/admin/reviews/{id}/status")
    public ResponseEntity<ReviewSummaryResponse.ReviewItemDto> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        ReviewStatus status = ReviewStatus.valueOf(body.get("status").toUpperCase());
        return ResponseEntity.ok(reviewService.updateReviewStatus(id, status));
    }

    @PutMapping("/admin/reviews/{id}/reply")
    public ResponseEntity<ReviewSummaryResponse.ReviewItemDto> reply(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(reviewService.replyToReview(id, body.get("reply")));
    }

    @DeleteMapping("/admin/reviews/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        reviewService.deleteReview(id);
        return ResponseEntity.noContent().build();
    }
}
