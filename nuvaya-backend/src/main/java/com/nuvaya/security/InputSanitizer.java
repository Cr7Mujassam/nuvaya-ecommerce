package com.nuvaya.security;

import java.util.Locale;
import java.util.regex.Pattern;

public final class InputSanitizer {
    private static final Pattern SCRIPT_BLOCK = Pattern.compile("(?is)<script[^>]*>.*?</script>");
    private static final Pattern IFRAME_BLOCK = Pattern.compile("(?is)<(iframe|object|embed|link|meta|style)[^>]*>.*?</\\1>|(?is)<(iframe|object|embed|link|meta|style)[^>]*/?>");
    private static final Pattern HTML_TAG = Pattern.compile("<[^>]+>");
    private static final Pattern EVENT_HANDLER = Pattern.compile("(?i)\\son[a-z]+\\s*=\\s*(['\"]).*?\\1");
    private static final Pattern DANGEROUS_SCHEME = Pattern.compile("(?i)(javascript|vbscript|data:text/html)\\s*:");

    private InputSanitizer() {}

    public static String sanitizeText(String raw) {
        if (raw == null) return null;
        String cleaned = raw.replace("\0", "");
        cleaned = cleaned.replaceAll("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]", "");
        cleaned = SCRIPT_BLOCK.matcher(cleaned).replaceAll("");
        cleaned = IFRAME_BLOCK.matcher(cleaned).replaceAll("");
        cleaned = EVENT_HANDLER.matcher(cleaned).replaceAll("");
        cleaned = DANGEROUS_SCHEME.matcher(cleaned).replaceAll("");
        cleaned = HTML_TAG.matcher(cleaned).replaceAll("");
        return cleaned.trim();
    }

    public static String sanitizeBounded(String raw, int maxLen) {
        String s = sanitizeText(raw);
        if (s == null) return null;
        return s.length() > maxLen ? s.substring(0, maxLen) : s;
    }

    public static String sanitizeUrl(String raw) {
        String s = sanitizeText(raw);
        if (s == null || s.isEmpty()) return "";
        String lower = s.toLowerCase(Locale.ROOT);
        if (lower.startsWith("http://") || lower.startsWith("https://") || s.startsWith("/")) {
            return s;
        }
        return "";
    }
}
