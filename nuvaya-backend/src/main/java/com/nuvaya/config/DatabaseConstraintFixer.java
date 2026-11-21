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
    public void repairLegacySchemaValues() {
        try {
            jdbcTemplate.execute("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check");
        } catch (Exception ignored) {
        }
        try {
            jdbcTemplate.execute("UPDATE store_settings SET cod_enabled = TRUE WHERE cod_enabled IS NULL");
            jdbcTemplate.execute("UPDATE store_settings SET online_payment_enabled = TRUE WHERE online_payment_enabled IS NULL");
            jdbcTemplate.execute("UPDATE store_settings SET cod_handling_fee = 0.00 WHERE cod_handling_fee IS NULL");
        } catch (Exception ignored) {
        }
    }
}
