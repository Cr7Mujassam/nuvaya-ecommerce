package com.nuvaya.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ReviewRequest {
    @NotBlank(message = "Customer name is required")
    private String customerName;

    @NotNull(message = "Rating is required")
    @Min(1) @Max(5)
    private Integer rating;

    @NotBlank(message = "Review comment is required")
    @Size(min = 5, max = 2000, message = "Review must be between 5 and 2000 characters")
    private String comment;

    private String imageUrl;
    private String orderReference;
    private String customerMobile;
}
