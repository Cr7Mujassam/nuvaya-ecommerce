package com.nuvaya.service;

import com.nuvaya.entity.Order;
import com.nuvaya.entity.OrderItem;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OrderEmailService {
    private final AsyncEmailDispatcher asyncEmailDispatcher;

    @Value("${nuvaya.admin.notification-email:modest.fashion@nuvaya.co.in}")
    private String adminNotificationEmail;

    public Map<String, Object> sendTestEmail(String toAddress) {
        String target = (toAddress != null && !toAddress.isBlank()) ? toAddress.trim() : adminNotificationEmail;
        return asyncEmailDispatcher.sendViaBrevo(
            target, "NuVaya Admin",
            "[NuVaya Email Test] Brevo HTTPS API Working",
            "Assalamu Alaikum,\n\nYour NUVAYA backend email integration over HTTPS (api.brevo.com:443) is working properly.\n",
            adminNotificationEmail
        );
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
