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
        String[] statements = {
            "ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_id VARCHAR(80)",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_partner VARCHAR(80)",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(25) DEFAULT 'WHATSAPP'",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(25) DEFAULT 'PENDING'",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(80)",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(80)",
            "ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS cod_enabled BOOLEAN DEFAULT TRUE",
            "ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS online_payment_enabled BOOLEAN DEFAULT TRUE",
            "ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS cod_handling_fee NUMERIC(10,2) DEFAULT 0.00",
            "UPDATE store_settings SET cod_enabled = TRUE WHERE cod_enabled IS NULL",
            "UPDATE store_settings SET online_payment_enabled = TRUE WHERE online_payment_enabled IS NULL",
            "UPDATE store_settings SET cod_handling_fee = 0.00 WHERE cod_handling_fee IS NULL"
        };
        for (String sql : statements) {
            try {
                jdbcTemplate.execute(sql);
            } catch (Exception ignored) {
            }
        }
    }
}
