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

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderEmailService {
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${nuvaya.admin.notification-email:modest.fashion@nuvaya.co.in}")
    private String adminNotificationEmail;

    @Async
    public void sendOrderAlert(Order order, String eventTitle) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null || mailUsername == null || mailUsername.isBlank()) {
            log.info("SMTP credentials not configured yet; skipping email alert for order {}", order.getOrderReference());
            return;
        }
        try {
            StringBuilder body = new StringBuilder();
            body.append("Assalamu Alaikum NuVaya Team,\n\n")
                .append(eventTitle).append("\n\n")
                .append("Order Reference: ").append(order.getOrderReference()).append("\n")
                .append("Order Status: ").append(order.getStatus()).append("\n")
                .append("Payment Method: ").append(order.getPaymentMethod()).append("\n")
                .append("Payment Status: ").append(order.getPaymentStatus()).append("\n");

            if (order.getRazorpayPaymentId() != null && !order.getRazorpayPaymentId().isBlank()) {
                body.append("Razorpay Payment ID: ").append(order.getRazorpayPaymentId()).append("\n");
            }

            body.append("\n--- Customer & Delivery Details ---\n")
                .append("Name: ").append(order.getCustomerName()).append("\n")
                .append("Mobile: ").append(order.getCustomerMobile()).append("\n")
                .append("Address: ").append(order.getDeliveryAddress()).append(", ")
                .append(order.getCity()).append(", ").append(order.getState())
                .append(" - ").append(order.getPinCode()).append("\n");

            if (order.getOrderNotes() != null && !order.getOrderNotes().isBlank()) {
                body.append("Notes: ").append(order.getOrderNotes()).append("\n");
            }

            body.append("\n--- Ordered Items ---\n");
            for (OrderItem item : order.getItems()) {
                body.append("• ").append(item.getProductName())
                    .append(" [").append(item.getPackName()).append("]");
                if (item.getSelectedColor() != null && !item.getSelectedColor().isBlank()) {
                    body.append(" (").append(item.getSelectedColor()).append(")");
                }
                body.append(" x ").append(item.getQuantity())
                    .append(" = Rs. ").append(item.getLineTotal()).append("\n");
            }

            body.append("\nTotal Amount Payable: Rs. ").append(order.getFinalAmount()).append("\n")
                .append("Track Link: https://nuvaya.co.in/track-order?ref=").append(order.getOrderReference()).append("\n");

            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(mailUsername);
            msg.setTo(adminNotificationEmail);
            msg.setSubject("[NuVaya Order] " + order.getOrderReference() + " — " + eventTitle);
            msg.setText(body.toString());

            mailSender.send(msg);
            log.info("Order notification email sent to {} for {}", adminNotificationEmail, order.getOrderReference());
        } catch (Exception e) {
            log.error("Failed to send order email for {}: {}", order.getOrderReference(), e.getMessage());
        }
    }
}
