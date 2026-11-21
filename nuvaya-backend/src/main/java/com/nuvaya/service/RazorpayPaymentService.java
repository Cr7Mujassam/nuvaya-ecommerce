package com.nuvaya.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nuvaya.dto.response.OrderResponse;
import com.nuvaya.entity.Order;
import com.nuvaya.entity.enums.OrderStatus;
import com.nuvaya.entity.enums.PaymentMethod;
import com.nuvaya.entity.enums.PaymentStatus;
import com.nuvaya.exception.BusinessValidationException;
import com.nuvaya.exception.ResourceNotFoundException;
import com.nuvaya.mapper.OrderMapper;
import com.nuvaya.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RazorpayPaymentService {
    private final OrderRepository orderRepository;
    private final OrderMapper orderMapper;
    private final OrderEmailService orderEmailService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${razorpay.key.id:}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret:}")
    private String razorpayKeySecret;

    public boolean isConfigured() {
        return razorpayKeyId != null && !razorpayKeyId.isBlank()
                && razorpayKeySecret != null && !razorpayKeySecret.isBlank();
    }

    @Transactional
    public Map<String, Object> createGatewayOrder(String orderReference) {
        if (!isConfigured()) {
            throw new BusinessValidationException("Online payment gateway keys are not configured yet. Please choose Cash on Delivery (COD) or WhatsApp Order.");
        }
        Order order = orderRepository.findByOrderReferenceIgnoreCase(orderReference)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderReference));

        long amountInPaise = order.getFinalAmount().multiply(BigDecimal.valueOf(100)).longValue();
        try {
            String payload = objectMapper.writeValueAsString(Map.of(
                    "amount", amountInPaise,
                    "currency", "INR",
                    "receipt", order.getOrderReference(),
                    "notes", Map.of("customerName", order.getCustomerName(), "mobile", order.getCustomerMobile())
            ));

            String auth = Base64.getEncoder().encodeToString((razorpayKeyId + ":" + razorpayKeySecret).getBytes(StandardCharsets.UTF_8));
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.razorpay.com/v1/orders"))
                    .header("Authorization", "Basic " + auth)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<String> res = HttpClient.newHttpClient().send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() < 200 || res.statusCode() >= 300) {
                throw new BusinessValidationException("Unable to initiate Razorpay payment (" + res.statusCode() + "). Please try COD or WhatsApp checkout.");
            }
            JsonNode json = objectMapper.readTree(res.body());
            String rzpOrderId = json.get("id").asText();
            order.setRazorpayOrderId(rzpOrderId);
            order.setPaymentMethod(PaymentMethod.ONLINE);
            orderRepository.save(order);

            return Map.of(
                    "keyId", razorpayKeyId,
                    "razorpayOrderId", rzpOrderId,
                    "amount", amountInPaise,
                    "currency", "INR",
                    "orderReference", order.getOrderReference(),
                    "customerName", order.getCustomerName(),
                    "customerMobile", order.getCustomerMobile()
            );
        } catch (BusinessValidationException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessValidationException("Payment gateway connection failed: " + e.getMessage());
        }
    }

    @Transactional
    public OrderResponse verifyAndCapture(String orderReference, String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        if (!isConfigured()) {
            throw new BusinessValidationException("Payment gateway not configured");
        }
        Order order = orderRepository.findByOrderReferenceIgnoreCase(orderReference)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderReference));

        String expectedSig = hmacSha256(razorpayOrderId + "|" + razorpayPaymentId, razorpayKeySecret);
        if (!expectedSig.equals(razorpaySignature)) {
            order.setPaymentStatus(PaymentStatus.FAILED);
            orderRepository.save(order);
            throw new BusinessValidationException("Payment signature verification failed.");
        }

        order.setRazorpayOrderId(razorpayOrderId);
        order.setRazorpayPaymentId(razorpayPaymentId);
        order.setPaymentMethod(PaymentMethod.ONLINE);
        order.setPaymentStatus(PaymentStatus.PAID);
        if (order.getStatus() == OrderStatus.PENDING) {
            order.setStatus(OrderStatus.CONFIRMED);
        }
        Order saved = orderRepository.save(order);
        orderEmailService.sendOrderAlert(saved, "Online Payment Verified & Order Confirmed");
        return orderMapper.toResponse(saved);
    }

    private String hmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
