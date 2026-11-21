package com.nuvaya.dto.request;

import com.nuvaya.entity.enums.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.List;

@Data
public class OrderRequest {
    @NotBlank private String customerName;
    @NotBlank @Pattern(regexp = "^[0-9+\\-\\s]{10,15}$", message = "Enter a valid mobile number")
    private String customerMobile;
    @Email(message = "Enter a valid email address")
    private String customerEmail;
    @NotBlank private String deliveryAddress;
    @NotBlank private String city;
    @NotBlank private String state;
    @NotBlank @Pattern(regexp = "^[1-9][0-9]{5}$", message = "Enter a valid 6-digit PIN code")
    private String pinCode;
    private String orderNotes;
    private PaymentMethod paymentMethod = PaymentMethod.WHATSAPP;
    @NotEmpty @Valid private List<OrderItemRequest> items;

    @Data
    public static class OrderItemRequest {
        @NotNull private Long productId;
        private Long packId;
        private String selectedColor;
        private List<String> mixedColors;
        private String selectedSize;
        @Min(1) private int quantity;
    }
}
