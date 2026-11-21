package com.nuvaya.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AsyncEmailDispatcher {
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    @Value("${BREVO_API_KEY:}")
    private String brevoApiKey;

    @Value("${nuvaya.admin.notification-email:modest.fashion@nuvaya.co.in}")
    private String adminNotificationEmail;

    public Map<String, Object> sendViaBrevo(String toEmail, String toName, String subject, String textBody, String replyTo) {
        if (brevoApiKey == null || brevoApiKey.isBlank()) {
            return Map.of("sent", false, "host", "api.brevo.com", "port", 443, "error", "BREVO_API_KEY is missing in Render Environment Variables.");
        }
        try {
            Map<String, Object> payload = Map.of(
                "sender", Map.of("name", "NUVAYA Modest Luxury", "email", adminNotificationEmail),
                "to", List.of(Map.of("email", toEmail, "name", toName != null && !toName.isBlank() ? toName : toEmail)),
                "replyTo", Map.of("email", replyTo != null && !replyTo.isBlank() ? replyTo : adminNotificationEmail),
                "subject", subject,
                "textContent", textBody
            );
            HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                .timeout(Duration.ofSeconds(12))
                .header("accept", "application/json")
                .header("content-type", "application/json")
                .header("api-key", brevoApiKey.trim())
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                .build();
            HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() >= 200 && res.statusCode() < 300) {
                return Map.of("sent", true, "from", adminNotificationEmail, "to", toEmail, "host", "api.brevo.com", "port", 443);
            }
            return Map.of("sent", false, "host", "api.brevo.com", "port", 443, "error", "HTTP " + res.statusCode() + ": " + res.body());
        } catch (Exception e) {
            return Map.of("sent", false, "host", "api.brevo.com", "port", 443, "error", e.getClass().getSimpleName() + ": " + e.getMessage());
        }
    }

    @Async
    public void sendBothEmails(String ref, String status, String payMethod, String payStatus,
                               String rzpPayId, String trackingId, String courierPartner,
                               String custName, String custMobile, String custEmail,
                               String address, String notes, String total,
                               List<String> itemLines, String eventTitle) {
        StringBuilder adminBody = new StringBuilder();
        adminBody.append("Assalamu Alaikum NuVaya Team,\n\n").append(eventTitle).append("\n\n")
            .append("Order Reference: ").append(ref).append("\n")
            .append("Order Status: ").append(status).append("\n")
            .append("Payment Method: ").append(payMethod).append("\n")
            .append("Payment Status: ").append(payStatus).append("\n");
        if (rzpPayId != null && !rzpPayId.isBlank()) adminBody.append("Razorpay Payment ID: ").append(rzpPayId).append("\n");
        if (trackingId != null && !trackingId.isBlank()) adminBody.append("NimbusPost AWB: ").append(trackingId).append("\n");
        adminBody.append("\n--- Customer Details ---\nName: ").append(custName).append("\nMobile: ").append(custMobile).append("\n");
        if (custEmail != null && !custEmail.isBlank()) adminBody.append("Email: ").append(custEmail).append("\n");
        adminBody.append("Address: ").append(address).append("\n");
        if (notes != null && !notes.isBlank()) adminBody.append("Notes: ").append(notes).append("\n");
        adminBody.append("\n--- Ordered Items ---\n");
        for (String line : itemLines) adminBody.append(line).append("\n");
        adminBody.append("\nTotal Amount: Rs. ").append(total).append("\nAdmin Panel: https://nuvaya.co.in/admin\n");

        Map<String, Object> adminRes = sendViaBrevo(adminNotificationEmail, "NuVaya Team", "[NuVaya Order] " + ref + " — " + eventTitle, adminBody.toString(), custEmail);
        log.info("Admin email result for {}: {}", ref, adminRes);

        if (custEmail != null && !custEmail.isBlank()) {
            StringBuilder custBody = new StringBuilder();
            custBody.append("Assalamu Alaikum ").append(custName).append(",\n\n")
                .append("Thank you for shopping with NUVAYA Modest Luxury! Here is an update on your order:\n\n")
                .append("Order ID: ").append(ref).append("\n")
                .append("Current Status: ").append(status).append("\n")
                .append("Payment: ").append(payMethod).append(" (").append(payStatus).append(")\n");
            if (trackingId != null && !trackingId.isBlank()) {
                custBody.append("Tracking ID (AWB): ").append(trackingId)
                    .append(courierPartner != null && !courierPartner.isBlank() ? " via " + courierPartner : "")
                    .append("\nLive Tracking: https://ship.nimbuspost.com/shipping/tracking/").append(trackingId).append("\n");
            }
            custBody.append("\n--- Your Order Summary ---\n");
            for (String line : itemLines) custBody.append(line).append("\n");
            custBody.append("\nTotal Payable: Rs. ").append(total).append("\nDelivery Address: ").append(address)
                .append("\n\nTrack your order anytime: https://nuvaya.co.in/track-order?ref=").append(ref)
                .append("\n\nWarm regards,\nNUVAYA Modest Luxury Team\nhttps://nuvaya.co.in\n");

            Map<String, Object> custRes = sendViaBrevo(custEmail, custName, "NUVAYA Order " + ref + " — " + status, custBody.toString(), adminNotificationEmail);
            log.info("Customer email result for {}: {}", ref, custRes);
        }
    }
}
