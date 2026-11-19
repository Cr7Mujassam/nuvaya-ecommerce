package com.nuvaya.mapper;

import com.nuvaya.entity.ProductReview;
import com.nuvaya.entity.enums.ReviewStatus;
import com.nuvaya.repository.ProductReviewRepository;
import lombok.RequiredArgsConstructor;
import java.util.List;

import com.nuvaya.dto.response.ProductResponse;
import com.nuvaya.entity.Product;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ProductMapper {
    private final ProductReviewRepository reviewRepository;
    public ProductResponse toResponse(Product p) {
        List<ProductReview> approved = reviewRepository.findByProductIdAndStatus(p.getId(), ReviewStatus.APPROVED);
        long reviewCount = approved.size();
        double avgRating = reviewCount == 0 ? 0.0 : Math.round(approved.stream().mapToInt(ProductReview::getRating).average().orElse(0.0) * 10.0) / 10.0;
        return ProductResponse.builder()
                .averageRating(avgRating)
                .reviewCount(reviewCount)
                .id(p.getId())
                .name(p.getName())
                .slug(p.getSlug())
                .sku(p.getSku())
                .description(p.getDescription())
                .specifications(p.getSpecifications())
                .fabric(p.getFabric())
                .availableSizes(p.getAvailableSizes())
                .categoryId(p.getCategory().getId())
                .categoryName(p.getCategory().getName())
                .categorySlug(p.getCategory().getSlug())
                .basePrice(p.getBasePrice())
                .discountPrice(p.getDiscountPrice())
                .stockQuantity(p.getStockQuantity())
                .status(p.getStatus())
                .featured(p.isFeatured())
                .newArrival(p.isNewArrival())
                .bestSeller(p.isBestSeller())
                .deliveryChargeType(p.getDeliveryChargeType())
                .deliveryChargeAmount(p.getDeliveryChargeAmount())
                .colors(p.getColors().stream().map(c -> ProductResponse.ColorView.builder()
                        .id(c.getId()).name(c.getName()).hexCode(c.getHexCode()).inStock(c.isInStock()).build()).toList())
                .images(p.getImages().stream().map(i -> ProductResponse.ImageView.builder()
                        .id(i.getId()).imageUrl(i.getImageUrl()).colorName(i.getColorName()).primaryImage(i.isPrimaryImage()).build()).toList())
                .packs(p.getPacks().stream().filter(pk -> pk.isActive()).map(pk -> ProductResponse.PackView.builder()
                        .id(pk.getId()).packName(pk.getPackName()).pieceCount(pk.getPieceCount())
                        .packPrice(pk.getPackPrice()).discountPrice(pk.getDiscountPrice())
                        .packDeliveryCharge(pk.getPackDeliveryCharge()).allowMixedColors(pk.isAllowMixedColors())
                        .stockQuantity(pk.getStockQuantity()).build()).toList())
                .build();
    }
}
