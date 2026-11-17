package com.nuvaya.dto.request;

import com.nuvaya.entity.enums.DeliveryChargeType;
import com.nuvaya.entity.enums.ProductStatus;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class ProductRequest {
    @NotBlank private String name;
    @NotBlank private String sku;
    private String description;
    private String specifications;
    private String fabric;
    private List<String> availableSizes = new ArrayList<>();
    @NotNull private Long categoryId;
    @NotNull @DecimalMin("0.01") private BigDecimal basePrice;
    private BigDecimal discountPrice;
    @NotNull @Min(0) private Integer stockQuantity;
    private ProductStatus status = ProductStatus.ACTIVE;
    private boolean featured;
    private boolean newArrival;
    private boolean bestSeller;
    private DeliveryChargeType deliveryChargeType = DeliveryChargeType.FREE;
    private BigDecimal deliveryChargeAmount = BigDecimal.ZERO;
    private List<ColorDto> colors = new ArrayList<>();
    private List<ImageDto> images = new ArrayList<>();
    private List<PackDto> packs = new ArrayList<>();

    @Data
    public static class ColorDto {
        private String name;
        private String hexCode;
        private boolean inStock = true;
    }

    @Data
    public static class ImageDto {
        private String imageUrl;
        private String colorName;
        private boolean primaryImage;
    }

    @Data
    public static class PackDto {
        private String packName;
        private Integer pieceCount;
        private BigDecimal packPrice;
        private BigDecimal discountPrice;
        private BigDecimal packDeliveryCharge = BigDecimal.ZERO;
        private boolean allowMixedColors;
        private Integer stockQuantity = 50;
    }
}
