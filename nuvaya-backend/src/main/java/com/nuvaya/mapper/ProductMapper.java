package com.nuvaya.mapper;

import com.nuvaya.dto.response.ProductResponse;
import com.nuvaya.entity.*;
import com.nuvaya.entity.enums.ReviewStatus;
import com.nuvaya.repository.ProductReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ProductMapper {

    private final ProductReviewRepository reviewRepository;

    public ProductResponse toResponse(Product p) {
        List<ProductReview> approved = reviewRepository.findByProductIdAndStatus(p.getId(), ReviewStatus.APPROVED);
        long reviewCount = approved.size();
        double avgRating = reviewCount == 0
                ? 0.0
                : Math.round(approved.stream().mapToInt(ProductReview::getRating).average().orElse(0.0) * 10.0) / 10.0;

        return ProductResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .slug(p.getSlug())
                .sku(p.getSku())
                .description(p.getDescription())
                .specifications(p.getSpecifications())
                .fabric(p.getFabric())
                .availableSizes(p.getAvailableSizes())
                .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
                .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                .basePrice(p.getBasePrice())
                .discountPrice(p.getDiscountPrice())
                .stockQuantity(p.getStockQuantity())
                .status(p.getStatus() != null ? p.getStatus().name() : null)
                .featured(p.isFeatured())
                .newArrival(p.isNewArrival())
                .bestSeller(p.isBestSeller())
                .deliveryChargeType(p.getDeliveryChargeType() != null ? p.getDeliveryChargeType().name() : null)
                .deliveryChargeAmount(p.getDeliveryChargeAmount())
                .colors(p.getColors().stream()
                        .sorted(Comparator.comparingInt(ProductColor::getDisplayOrder))
                        .map(c -> ProductResponse.ColorResponse.builder()
                                .id(c.getId())
                                .name(c.getName())
                                .hexCode(c.getHexCode())
                                .inStock(c.isInStock())
                                .build())
                        .toList())
                .images(p.getImages().stream()
                        .sorted(Comparator.comparingInt(ProductImage::getDisplayOrder))
                        .map(im -> ProductResponse.ImageResponse.builder()
                                .id(im.getId())
                                .imageUrl(im.getImageUrl())
                                .colorName(im.getColorName())
                                .primaryImage(im.isPrimaryImage())
                                .build())
                        .toList())
                .packs(p.getPacks().stream()
                        .sorted(Comparator.comparingInt(ProductPack::getPieceCount))
                        .map(pk -> ProductResponse.PackResponse.builder()
                                .id(pk.getId())
                                .packName(pk.getPackName())
                                .pieceCount(pk.getPieceCount())
                                .packPrice(pk.getPackPrice())
                                .discountPrice(pk.getDiscountPrice())
                                .packDeliveryCharge(pk.getPackDeliveryCharge())
                                .allowMixedColors(pk.isAllowMixedColors())
                                .stockQuantity(pk.getStockQuantity())
                                .build())
                        .toList())
                .averageRating(avgRating)
                .reviewCount(reviewCount)
                .build();
    }
}
