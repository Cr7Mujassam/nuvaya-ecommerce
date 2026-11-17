package com.nuvaya.dto.response;

import com.nuvaya.entity.enums.DeliveryChargeType;
import com.nuvaya.entity.enums.ProductStatus;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data @Builder
public class ProductResponse {
    private Long id;
    private String name;
    private String slug;
    private String sku;
    private String description;
    private String specifications;
    private String fabric;
    private List<String> availableSizes;
    private Long categoryId;
    private String categoryName;
    private String categorySlug;
    private BigDecimal basePrice;
    private BigDecimal discountPrice;
    private Integer stockQuantity;
    private ProductStatus status;
    private boolean featured;
    private boolean newArrival;
    private boolean bestSeller;
    private DeliveryChargeType deliveryChargeType;
    private BigDecimal deliveryChargeAmount;
    private List<ColorView> colors;
    private List<ImageView> images;
    private List<PackView> packs;

    @Data @Builder
    public static class ColorView {
        private Long id;
        private String name;
        private String hexCode;
        private boolean inStock;
    }

    @Data @Builder
    public static class ImageView {
        private Long id;
        private String imageUrl;
        private String colorName;
        private boolean primaryImage;
    }

    @Data @Builder
    public static class PackView {
        private Long id;
        private String packName;
        private Integer pieceCount;
        private BigDecimal packPrice;
        private BigDecimal discountPrice;
        private BigDecimal packDeliveryCharge;
        private boolean allowMixedColors;
        private Integer stockQuantity;
    }
}
