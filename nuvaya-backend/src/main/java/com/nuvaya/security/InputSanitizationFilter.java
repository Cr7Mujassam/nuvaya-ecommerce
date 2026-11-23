package com.nuvaya.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class InputSanitizationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

        String contentType = request.getContentType();
        boolean isMultipart = contentType != null && contentType.toLowerCase().startsWith(MediaType.MULTIPART_FORM_DATA_VALUE);
        if (isMultipart) {
            filterChain.doFilter(request, response);
            return;
        }

        byte[] cleanBody = null;
        if (request.getInputStream() != null) {
            byte[] rawBytes = readAllBytes(request.getInputStream());
            if (rawBytes.length > 0) {
                String rawText = new String(rawBytes, StandardCharsets.UTF_8);
                String sanitizedText = sanitizePayload(rawText);
                cleanBody = sanitizedText.getBytes(StandardCharsets.UTF_8);
            }
        }

        final byte[] bodyToUse = cleanBody;
        HttpServletRequest wrapped = new HttpServletRequestWrapper(request) {
            @Override
            public String getParameter(String name) {
                String val = super.getParameter(name);
                return val != null ? InputSanitizer.sanitizeBounded(val, 500) : null;
            }

            @Override
            public String[] getParameterValues(String name) {
                String[] vals = super.getParameterValues(name);
                if (vals == null) return null;
                String[] out = new String[vals.length];
                for (int i = 0; i < vals.length; i++) {
                    out[i] = InputSanitizer.sanitizeBounded(vals[i], 500);
                }
                return out;
            }

            @Override
            public Map<String, String[]> getParameterMap() {
                Map<String, String[]> orig = super.getParameterMap();
                Map<String, String[]> copy = new LinkedHashMap<>();
                for (Map.Entry<String, String[]> e : orig.entrySet()) {
                    String[] v = e.getValue();
                    if (v == null) {
                        copy.put(e.getKey(), null);
                    } else {
                        String[] cleanV = new String[v.length];
                        for (int i = 0; i < v.length; i++) {
                            cleanV[i] = InputSanitizer.sanitizeBounded(v[i], 500);
                        }
                        copy.put(e.getKey(), cleanV);
                    }
                }
                return Collections.unmodifiableMap(copy);
            }

            @Override
            public ServletInputStream getInputStream() throws IOException {
                if (bodyToUse == null) {
                    return super.getInputStream();
                }
                ByteArrayInputStream bais = new ByteArrayInputStream(bodyToUse);
                return new ServletInputStream() {
                    @Override
                    public int read() {
                        return bais.read();
                    }

                    @Override
                    public boolean isFinished() {
                        return bais.available() == 0;
                    }

                    @Override
                    public boolean isReady() {
                        return true;
                    }

                    @Override
                    public void setReadListener(ReadListener readListener) {
                    }
                };
            }
        };

        filterChain.doFilter(wrapped, response);
    }

    private String sanitizePayload(String text) {
        String s = text.replace("\0", "");
        s = s.replaceAll("(?is)<script[^>]*>.*?</script>", "");
        s = s.replaceAll("(?is)<(iframe|object|embed|link|meta|style)[^>]*>.*?</\\1>|(?is)<(iframe|object|embed|link|meta|style)[^>]*/?>", "");
        s = s.replaceAll("(?i)\\son[a-z]+\\s*=\\s*(['\"]).*?\\1", "");
        s = s.replaceAll("(?i)(javascript|vbscript|data:text/html)\\s*:", "");
        return s;
    }

    private byte[] readAllBytes(InputStream in) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[4096];
        int n;
        while ((n = in.read(buf)) != -1) {
            out.write(buf, 0, n);
        }
        return out.toByteArray();
    }
}
