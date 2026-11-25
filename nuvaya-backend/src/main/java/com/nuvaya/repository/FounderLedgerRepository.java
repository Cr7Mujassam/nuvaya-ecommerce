package com.nuvaya.repository;

import com.nuvaya.entity.FounderLedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FounderLedgerRepository extends JpaRepository<FounderLedgerEntry, Long> {
    List<FounderLedgerEntry> findAllByOrderByEntryDateDescIdDesc();
}
