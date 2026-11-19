package com.nuvaya.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data @Builder
public class ReviewSummaryResponse {
    private double averageRating;
    private long totalReviews;
    private Map<Integer, Long> ratingBreakdown;
    private List<ReviewItemDto> reviews;
    private int currentPage;
    private int totalPages;
    private boolean hasMore;

    @Data @Builder
    public static class ReviewItemDto {
        private Long id;
        private Long productId;
        private String productName;
        private String customerName;
        private Integer rating;
        private String comment;
        private String imageUrl;
        private boolean verifiedPurchase;
        private String status;
        private String adminReply;
        private LocalDateTime adminRepliedAt;
        private LocalDateTime createdAt;
    }
}
