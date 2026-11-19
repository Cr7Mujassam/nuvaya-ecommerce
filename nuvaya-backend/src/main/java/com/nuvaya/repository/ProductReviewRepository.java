package com.nuvaya.repository;

import com.nuvaya.entity.ProductReview;
import com.nuvaya.entity.enums.ReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {
    Page<ProductReview> findByProductIdAndStatus(Long productId, ReviewStatus status, Pageable pageable);
    List<ProductReview> findByProductIdAndStatus(Long productId, ReviewStatus status);
    Page<ProductReview> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<ProductReview> findByStatusOrderByCreatedAtDesc(ReviewStatus status, Pageable pageable);
    boolean existsByProductIdAndOrderReferenceIgnoreCase(Long productId, String orderReference);
}
