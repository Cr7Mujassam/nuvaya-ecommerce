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

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderEmailService {
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${nuvaya.admin.notification-email:modest.fashion@nuvaya.co.in}")
    private String adminNotificationEmail;

    public void sendOrderAlert(Order order, String eventTitle) {
        // Snapshot order data synchronously while Hibernate session is active
        String ref = order.getOrderReference();
        String status = String.valueOf(order.getStatus());
        String payMethod = String.valueOf(order.getPaymentMethod());
        String payStatus = String.valueOf(order.getPaymentStatus());
        String rzpPayId = order.getRazorpayPaymentId();
        String custName = order.getCustomerName();
        String custMobile = order.getCustomerMobile();
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

        dispatchEmailAsync(ref, status, payMethod, payStatus, rzpPayId, custName, custMobile, address, notes, total, itemLines, eventTitle);
    }

    @Async
    protected void dispatchEmailAsync(String ref, String status, String payMethod, String payStatus,
                                      String rzpPayId, String custName, String custMobile,
                                      String address, String notes, String total,
                                      List<String> itemLines, String eventTitle) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null || mailUsername == null || mailUsername.isBlank()) {
            log.warn("SMTP credentials missing (MAIL_USERNAME is empty); order email skipped for {}", ref);
            return;
        }
        try {
            StringBuilder body = new StringBuilder();
            body.append("Assalamu Alaikum NuVaya Team,\n\n")
                .append(eventTitle).append("\n\n")
                .append("Order Reference: ").append(ref).append("\n")
                .append("Order Status: ").append(status).append("\n")
                .append("Payment Method: ").append(payMethod).append("\n")
                .append("Payment Status: ").append(payStatus).append("\n");

            if (rzpPayId != null && !rzpPayId.isBlank()) {
                body.append("Razorpay Payment ID: ").append(rzpPayId).append("\n");
            }

            body.append("\n--- Customer & Delivery Details ---\n")
                .append("Name: ").append(custName).append("\n")
                .append("Mobile: ").append(custMobile).append("\n")
                .append("Address: ").append(address).append("\n");

            if (notes != null && !notes.isBlank()) {
                body.append("Notes: ").append(notes).append("\n");
            }

            body.append("\n--- Ordered Items ---\n");
            for (String line : itemLines) {
                body.append(line).append("\n");
            }

            body.append("\nTotal Amount Payable: Rs. ").append(total).append("\n")
                .append("Track Link: https://nuvaya.co.in/track-order?ref=").append(ref).append("\n");

            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(mailUsername);
            msg.setTo(adminNotificationEmail);
            msg.setSubject("[NuVaya Order] " + ref + " — " + eventTitle);
            msg.setText(body.toString());

            mailSender.send(msg);
            log.info("Order notification email sent to {} for {}", adminNotificationEmail, ref);
        } catch (Exception e) {
            log.error("Failed to send order email for {}: {}", ref, e.getMessage(), e);
        }
    }
}
