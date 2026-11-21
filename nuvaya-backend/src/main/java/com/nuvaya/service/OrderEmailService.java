package com.nuvaya.service;

import com.nuvaya.entity.Order;
import com.nuvaya.entity.OrderItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderEmailService {
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.port:587}")
    private int mailPort;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${nuvaya.admin.notification-email:modest.fashion@nuvaya.co.in}")
    private String adminNotificationEmail;

    public Map<String, Object> sendTestEmail(String toAddress) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null || mailUsername == null || mailUsername.isBlank()) {
            return Map.of(
                    "sent", false,
                    "error", "MAIL_USERNAME is empty in Render Environment Variables.",
                    "host", mailHost,
                    "port", mailPort
            );
        }
        String target = (toAddress != null && !toAddress.isBlank()) ? toAddress.trim() : adminNotificationEmail;
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(mailUsername);
            msg.setTo(target);
            msg.setSubject("[NuVaya SMTP Test] Email Configuration Working");
            msg.setText("Assalamu Alaikum,\n\nYour NUVAYA backend SMTP integration (" + mailHost + ":" + mailPort + ") is working properly.\n");
            mailSender.send(msg);
            return Map.of("sent", true, "from", mailUsername, "to", target, "host", mailHost, "port", mailPort);
        } catch (Exception e) {
            log.error("SMTP Test Email failed: {}", e.getMessage(), e);
            return Map.of(
                    "sent", false,
                    "from", mailUsername,
                    "to", target,
                    "host", mailHost,
                    "port", mailPort,
                    "error", e.getClass().getSimpleName() + ": " + e.getMessage()
            );
        }
    }

    public void sendOrderAlert(Order order, String eventTitle) {
        String ref = order.getOrderReference();
        String status = String.valueOf(order.getStatus());
        String payMethod = String.valueOf(order.getPaymentMethod());
        String payStatus = String.valueOf(order.getPaymentStatus());
        String rzpPayId = order.getRazorpayPaymentId();
        String trackingId = order.getTrackingId();
        String courierPartner = order.getCourierPartner();
        String custName = order.getCustomerName();
        String custMobile = order.getCustomerMobile();
        String custEmail = order.getCustomerEmail();
        String address = order.getDeliveryAddress() + ", " + order.getCity() + ", " + order.getState() + " - " + order.getPinCode();
        String notes = order.getOrderNotes();
        String total = String.valueOf(order.getFinalAmount());

        List<String> itemLines = new ArrayList<>();
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                String line = "• " + item.getProductName() + " [" + item.getPackName() + "]"
                        + (item.getSelectedColor() != null && !item.getSelectedColor().isBlank() ? " (" + item.getSelectedColor() + ")" : "")
                        + " x " + item.getQuantity() + " = Rs. " + item.getLineTotal();
                itemLines.add(line);
            }
        }

        dispatchEmails(ref, status, payMethod, payStatus, rzpPayId, trackingId, courierPartner,
                custName, custMobile, custEmail, address, notes, total, itemLines, eventTitle);
    }

    private void dispatchEmails(String ref, String status, String payMethod, String payStatus,
                                String rzpPayId, String trackingId, String courierPartner,
                                String custName, String custMobile, String custEmail,
                                String address, String notes, String total,
                                List<String> itemLines, String eventTitle) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null || mailUsername == null || mailUsername.isBlank()) {
            log.warn("SMTP credentials missing (MAIL_USERNAME is empty); order emails skipped for {}", ref);
            return;
        }

        // 1. Admin Email to NuVaya (modest.fashion@nuvaya.co.in)
        try {
            StringBuilder adminBody = new StringBuilder();
            adminBody.append("Assalamu Alaikum NuVaya Team,\n\n")
                .append(eventTitle).append("\n\n")
                .append("Order Reference: ").append(ref).append("\n")
                .append("Order Status: ").append(status).append("\n")
                .append("Payment Method: ").append(payMethod).append("\n")
                .append("Payment Status: ").append(payStatus).append("\n");

            if (rzpPayId != null && !rzpPayId.isBlank()) {
                adminBody.append("Razorpay Payment ID: ").append(rzpPayId).append("\n");
            }
            if (trackingId != null && !trackingId.isBlank()) {
                adminBody.append("NimbusPost AWB: ").append(trackingId)
                    .append(courierPartner != null ? " (" + courierPartner + ")" : "").append("\n");
            }

            adminBody.append("\n--- Customer & Delivery Details ---\n")
                .append("Name: ").append(custName).append("\n")
                .append("Mobile: ").append(custMobile).append("\n");
            if (custEmail != null && !custEmail.isBlank()) {
                adminBody.append("Email: ").append(custEmail).append("\n");
            }
            adminBody.append("Address: ").append(address).append("\n");

            if (notes != null && !notes.isBlank()) {
                adminBody.append("Notes: ").append(notes).append("\n");
            }

            adminBody.append("\n--- Ordered Items ---\n");
            for (String line : itemLines) {
                adminBody.append(line).append("\n");
            }

            adminBody.append("\nTotal Amount: Rs. ").append(total).append("\n")
                .append("Admin Panel: https://nuvaya.co.in/admin\n");

            SimpleMailMessage adminMsg = new SimpleMailMessage();
            adminMsg.setFrom(mailUsername);
            adminMsg.setTo(adminNotificationEmail);
            adminMsg.setSubject("[NuVaya Order] " + ref + " — " + eventTitle);
            adminMsg.setText(adminBody.toString());
            mailSender.send(adminMsg);
            log.info("Admin order email sent to {} for {}", adminNotificationEmail, ref);
        } catch (Exception e) {
            log.error("Failed to send admin order email for {}: {}", ref, e.getMessage(), e);
        }

        // 2. Customer Order Confirmation & Status Email
        if (custEmail != null && !custEmail.isBlank()) {
            try {
                StringBuilder custBody = new StringBuilder();
                custBody.append("Assalamu Alaikum ").append(custName).append(",\n\n")
                    .append("Thank you for shopping with NUVAYA Modest Luxury! Here is an update on your order:\n\n")
                    .append("Order ID: ").append(ref).append("\n")
                    .append("Current Status: ").append(status).append("\n")
                    .append("Payment Method: ").append(payMethod).append(" (").append(payStatus).append(")\n");

                if (trackingId != null && !trackingId.isBlank()) {
                    custBody.append("Shipment Tracking ID (AWB): ").append(trackingId);
                    if (courierPartner != null && !courierPartner.isBlank()) {
                        custBody.append(" via ").append(courierPartner);
                    }
                    custBody.append("\nLive Courier Tracking: https://ship.nimbuspost.com/shipping/tracking/")
                        .append(trackingId).append("\n");
                }

                custBody.append("\n--- Your Order Summary ---\n");
                for (String line : itemLines) {
                    custBody.append(line).append("\n");
                }
                custBody.append("\nTotal Payable: Rs. ").append(total).append("\n")
                    .append("Delivery Address: ").append(address).append("\n\n")
                    .append("Track your NuVaya order anytime here:\n")
                    .append("https://nuvaya.co.in/track-order?ref=").append(ref).append("\n\n")
                    .append("Warm regards,\nNUVAYA Modest Luxury Team\nhttps://nuvaya.co.in\n");

                SimpleMailMessage custMsg = new SimpleMailMessage();
                custMsg.setFrom(mailUsername);
                custMsg.setTo(custEmail);
                custMsg.setReplyTo(adminNotificationEmail);
                custMsg.setSubject("NUVAYA Order " + ref + " — " + status);
                custMsg.setText(custBody.toString());
                mailSender.send(custMsg);
                log.info("Customer order email sent to {} for {}", custEmail, ref);
            } catch (Exception e) {
                log.error("Failed to send customer email to {} for {}: {}", custEmail, ref, e.getMessage(), e);
            }
        }
    }
}
