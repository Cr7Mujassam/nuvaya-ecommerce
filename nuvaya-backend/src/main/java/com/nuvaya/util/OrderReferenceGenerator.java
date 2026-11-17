package com.nuvaya.util;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public final class OrderReferenceGenerator {
    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();
    private OrderReferenceGenerator() {}

    public static String generate() {
        String datePart = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        StringBuilder suffix = new StringBuilder(5);
        for (int i = 0; i < 5; i++) suffix.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
        return "NVY-" + datePart + "-" + suffix;
    }
}
