package com.nuvaya.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.util.List;

@Slf4j @Service @RequiredArgsConstructor
public class AsyncEmailDispatcher {
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${nuvaya.admin.notification-email:modest.fashion@nuvaya.co.in}")
    private String adminNotificationEmail;

    @Async
    public void sendBothEmails(String ref, String status, String payMethod, String payStatus,
                               String rzpPayId, String trackingId, String courierPartner,
                               String custName, String custMobile, String custEmail,
                               String address, String notes, String total,
                               List<String> itemLines, String eventTitle) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null || mailUsername == null || mailUsername.isBlank()) {
            log.warn("SMTP credentials missing; order emails skipped for {}", ref);
            return;
        }
        try {
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
            adminBody.append("\n--- Items ---\n");
            for (String line : itemLines) adminBody.append(line).append("\n");
            adminBody.append("\nTotal Amount: Rs. ").append(total).append("\nAdmin Panel: https://nuvaya.co.in/admin\n");

            SimpleMailMessage adminMsg = new SimpleMailMessage();
            adminMsg.setFrom(mailUsername);
            adminMsg.setTo(adminNotificationEmail);
            adminMsg.setSubject("[NuVaya Order] " + ref + " — " + eventTitle);
            adminMsg.setText(adminBody.toString());
            mailSender.send(adminMsg);
            log.info("Admin order email sent to {} for {}", adminNotificationEmail, ref);
        } catch (Exception e) {
            log.error("Failed to send admin order email for {}: {}", ref, e.getMessage());
        }

        if (custEmail != null && !custEmail.isBlank()) {
            try {
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

                SimpleMailMessage custMsg = new SimpleMailMessage();
                custMsg.setFrom(mailUsername);
                custMsg.setTo(custEmail);
                custMsg.setReplyTo(adminNotificationEmail);
                custMsg.setSubject("NUVAYA Order " + ref + " — " + status);
                custMsg.setText(custBody.toString());
                mailSender.send(custMsg);
                log.info("Customer order email sent to {} for {}", custEmail, ref);
            } catch (Exception e) {
                log.error("Failed to send customer email to {} for {}: {}", custEmail, ref, e.getMessage());
            }
        }
    }
}
