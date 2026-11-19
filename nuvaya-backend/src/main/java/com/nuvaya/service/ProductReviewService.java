package com.nuvaya.service;

import com.nuvaya.dto.request.ReviewRequest;
import com.nuvaya.dto.response.ReviewSummaryResponse;
import com.nuvaya.entity.*;
import com.nuvaya.entity.enums.OrderStatus;
import com.nuvaya.entity.enums.ReviewStatus;
import com.nuvaya.exception.BusinessValidationException;
import com.nuvaya.exception.ResourceNotFoundException;
import com.nuvaya.repository.OrderRepository;
import com.nuvaya.repository.ProductRepository;
import com.nuvaya.repository.ProductReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service @RequiredArgsConstructor
public class ProductReviewService {
    private final ProductReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public ReviewSummaryResponse getPublicReviews(Long productId, String sortBy, int page, int size) {
        List<ProductReview> allApproved = reviewRepository.findByProductIdAndStatus(productId, ReviewStatus.APPROVED);

        long total = allApproved.size();
        double avg = total == 0 ? 0.0 : allApproved.stream().mapToInt(ProductReview::getRating).average().orElse(0.0);
        avg = Math.round(avg * 10.0) / 10.0;

        Map<Integer, Long> breakdown = new LinkedHashMap<>();
        for (int star = 5; star >= 1; star--) {
            final int s = star;
            breakdown.put(s, allApproved.stream().filter(r -> r.getRating() == s).count());
        }

        Sort sort = switch (sortBy != null ? sortBy : "recent") {
            case "highest" -> Sort.by(Sort.Direction.DESC, "rating").and(Sort.by(Sort.Direction.DESC, "createdAt"));
            case "lowest" -> Sort.by(Sort.Direction.ASC, "rating").and(Sort.by(Sort.Direction.DESC, "createdAt"));
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };

        Page<ProductReview> paged = reviewRepository.findByProductIdAndStatus(
                productId, ReviewStatus.APPROVED, PageRequest.of(page, size, sort)
        );

        return ReviewSummaryResponse.builder()
                .averageRating(avg)
                .totalReviews(total)
                .ratingBreakdown(breakdown)
                .reviews(paged.getContent().stream().map(this::toDto).toList())
                .currentPage(paged.getNumber())
                .totalPages(paged.getTotalPages())
                .hasMore(paged.hasNext())
                .build();
    }

    @Transactional
    public ReviewSummaryResponse.ReviewItemDto submitReview(Long productId, ReviewRequest req) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        String normalizedRef = (req.getOrderReference() != null && !req.getOrderReference().isBlank())
                ? req.getOrderReference().trim().toUpperCase()
                : null;
        String normalizedMobile = (req.getCustomerMobile() != null)
                ? req.getCustomerMobile().replaceAll("[^0-9]", "")
                : "";

        boolean verified = false;
        if (normalizedRef != null) {
            if (reviewRepository.existsByProductIdAndOrderReferenceIgnoreCase(productId, normalizedRef)) {
                throw new BusinessValidationException("A review has already been submitted for this order and product.");
            }
            Order order = orderRepository.findByOrderReferenceIgnoreCase(normalizedRef)
                    .orElseThrow(() -> new BusinessValidationException("Order Reference not found. Please check your WhatsApp order ID."));

            if (order.getStatus() == OrderStatus.CANCELLED) {
                throw new BusinessValidationException("Cancelled orders are not eligible for a Verified Purchase review.");
            }

            String orderPhone = order.getCustomerMobile() != null ? order.getCustomerMobile().replaceAll("[^0-9]", "") : "";
            String last10Input = normalizedMobile.length() >= 10 ? normalizedMobile.substring(normalizedMobile.length() - 10) : normalizedMobile;
            boolean mobileMatches = !last10Input.isEmpty() && orderPhone.endsWith(last10Input);
            boolean containsProduct = order.getItems().stream()
                    .anyMatch(it -> Objects.equals(it.getProductId(), productId));

            if (!mobileMatches || !containsProduct) {
                throw new BusinessValidationException("Order Reference and Mobile Number do not match a purchase of this item.");
            }
            verified = true;
        }

        ProductReview review = ProductReview.builder()
                .product(product)
                .customerName(req.getCustomerName().trim())
                .customerMobile(normalizedMobile)
                .orderReference(normalizedRef)
                .rating(req.getRating())
                .comment(req.getComment().trim())
                .imageUrl(req.getImageUrl() != null && !req.getImageUrl().isBlank() ? req.getImageUrl().trim() : null)
                .verifiedPurchase(verified)
                .status(ReviewStatus.PENDING)
                .build();

        return toDto(reviewRepository.save(review));
    }

    @Transactional(readOnly = true)
    public Page<ReviewSummaryResponse.ReviewItemDto> getAdminReviews(String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ProductReview> results = (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL"))
                ? reviewRepository.findByStatusOrderByCreatedAtDesc(ReviewStatus.valueOf(status.toUpperCase()), pageable)
                : reviewRepository.findAllByOrderByCreatedAtDesc(pageable);
        return results.map(this::toDto);
    }

    @Transactional
    public ReviewSummaryResponse.ReviewItemDto updateReviewStatus(Long reviewId, ReviewStatus status) {
        ProductReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        review.setStatus(status);
        return toDto(reviewRepository.save(review));
    }

    @Transactional
    public ReviewSummaryResponse.ReviewItemDto replyToReview(Long reviewId, String reply) {
        ProductReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        if (reply == null || reply.isBlank()) {
            review.setAdminReply(null);
            review.setAdminRepliedAt(null);
        } else {
            review.setAdminReply(reply.trim());
            review.setAdminRepliedAt(LocalDateTime.now());
        }
        return toDto(reviewRepository.save(review));
    }

    @Transactional
    public void deleteReview(Long reviewId) {
        if (!reviewRepository.existsById(reviewId)) throw new ResourceNotFoundException("Review not found");
        reviewRepository.deleteById(reviewId);
    }

    private ReviewSummaryResponse.ReviewItemDto toDto(ProductReview r) {
        return ReviewSummaryResponse.ReviewItemDto.builder()
                .id(r.getId())
                .productId(r.getProduct().getId())
                .productName(r.getProduct().getName())
                .customerName(r.getCustomerName())
                .rating(r.getRating())
                .comment(r.getComment())
                .imageUrl(r.getImageUrl())
                .verifiedPurchase(r.isVerifiedPurchase())
                .status(r.getStatus().name())
                .adminReply(r.getAdminReply())
                .adminRepliedAt(r.getAdminRepliedAt())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
