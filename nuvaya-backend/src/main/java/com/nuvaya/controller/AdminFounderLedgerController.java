package com.nuvaya.controller;

import com.nuvaya.entity.FounderLedgerEntry;
import com.nuvaya.exception.BusinessValidationException;
import com.nuvaya.exception.ResourceNotFoundException;
import com.nuvaya.repository.FounderLedgerRepository;
import com.nuvaya.security.InputSanitizer;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/ledger")
@RequiredArgsConstructor
public class AdminFounderLedgerController {

    private final FounderLedgerRepository ledgerRepository;

    @GetMapping
    public ResponseEntity<List<FounderLedgerEntry>> listAll() {
        return ResponseEntity.ok(ledgerRepository.findAllByOrderByEntryDateDescIdDesc());
    }

    @PostMapping
    public ResponseEntity<FounderLedgerEntry> create(@RequestBody Map<String, Object> body) {
        String rawType = body.get("entryType") != null ? InputSanitizer.sanitizeBounded(String.valueOf(body.get("entryType")), 24).toUpperCase(Locale.ROOT) : "EXPENSE";
        if (!"INVESTMENT".equals(rawType) && !"EXPENSE".equals(rawType)) {
            throw new BusinessValidationException("Entry type must be INVESTMENT or EXPENSE");
        }

        String founder = body.get("founderName") != null ? InputSanitizer.sanitizeBounded(String.valueOf(body.get("founderName")), 40) : "";
        if (founder.isEmpty()) {
            throw new BusinessValidationException("Founder name is required");
        }

        String title = body.get("title") != null ? InputSanitizer.sanitizeBounded(String.valueOf(body.get("title")), 200) : "";
        if (title.isEmpty()) {
            throw new BusinessValidationException("Title / description is required");
        }

        String category = body.get("category") != null ? InputSanitizer.sanitizeBounded(String.valueOf(body.get("category")), 80) : "General";
        String notes = body.get("notes") != null ? InputSanitizer.sanitizeBounded(String.valueOf(body.get("notes")), 500) : "";

        LocalDate entryDate;
        try {
            String rawDate = body.get("entryDate") != null ? String.valueOf(body.get("entryDate")).trim() : "";
            entryDate = rawDate.isEmpty() ? LocalDate.now() : LocalDate.parse(rawDate);
        } catch (Exception ex) {
            throw new BusinessValidationException("Invalid date format (expected YYYY-MM-DD)");
        }

        BigDecimal amount;
        try {
            amount = new BigDecimal(String.valueOf(body.get("amount")).trim());
            if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessValidationException("Amount must be greater than 0");
            }
        } catch (BusinessValidationException bve) {
            throw bve;
        } catch (Exception ex) {
            throw new BusinessValidationException("Valid positive amount is required");
        }

        FounderLedgerEntry saved = ledgerRepository.save(FounderLedgerEntry.builder()
                .entryDate(entryDate)
                .entryType(rawType)
                .founderName(founder)
                .category(category.isEmpty() ? "General" : category)
                .title(title)
                .amount(amount)
                .notes(notes)
                .build());

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity> delete(@PathVariable Long id) {
        FounderLedgerEntry existing = ledgerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ledger entry not found"));
        ledgerRepository.delete(existing);
        return ResponseEntity.ok(Map.of("status", "deleted"));
    }
}
