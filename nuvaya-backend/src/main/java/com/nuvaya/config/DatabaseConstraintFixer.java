package com.nuvaya.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DatabaseConstraintFixer {
    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void dropLegacyOrderStatusCheck() {
        try {
            jdbcTemplate.execute("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check");
        } catch (Exception ignored) {
        }
    }
}
