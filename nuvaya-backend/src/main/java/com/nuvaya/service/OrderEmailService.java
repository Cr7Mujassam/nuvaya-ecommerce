package com.nuvaya.service;

import com.nuvaya.entity.Order;
import com.nuvaya.entity.OrderItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j @Service @RequiredArgsConstructor
public class OrderEmailService {
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final AsyncEmailDispatcher asyncEmailDispatcher;

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
            return Map.of("sent", false, "error", "MAIL_USERNAME is empty in Render Environment Variables.", "host", mailHost, "port", mailPort);
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
            log.error("SMTP Test Email failed: {}", e.getMessage());
            return Map.of("sent", false, "from", mailUsername, "to", target, "host", mailHost, "port", mailPort, "error", e.getClass().getSimpleName() + ": " + e.getMessage());
        }
    }

    public void sendOrderAlert(Order order, String eventTitle) {
        List<String> itemLines = new ArrayList<>();
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                itemLines.add("• " + item.getProductName() + " [" + item.getPackName() + "]"
                        + (item.getSelectedColor() != null && !item.getSelectedColor().isBlank() ? " (" + item.getSelectedColor() + ")" : "")
                        + " x " + item.getQuantity() + " = Rs. " + item.getLineTotal());
            }
        }
        String address = order.getDeliveryAddress() + ", " + order.getCity() + ", " + order.getState() + " - " + order.getPinCode();
        asyncEmailDispatcher.sendBothEmails(
                order.getOrderReference(), String.valueOf(order.getStatus()),
                String.valueOf(order.getPaymentMethod()), String.valueOf(order.getPaymentStatus()),
                order.getRazorpayPaymentId(), order.getTrackingId(), order.getCourierPartner(),
                order.getCustomerName(), order.getCustomerMobile(), order.getCustomerEmail(),
                address, order.getOrderNotes(), String.valueOf(order.getFinalAmount()),
                itemLines, eventTitle
        );
    }
}
