package com.nuvaya.repository;

import com.nuvaya.entity.SiteVisit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface SiteVisitRepository extends JpaRepository<SiteVisit, Long> {
    long countByVisitedAtAfter(LocalDateTime after);

    @Query("SELECT COUNT(DISTINCT v.visitorId) FROM SiteVisit v WHERE v.visitedAt >= :after AND v.visitorId IS NOT NULL")
    long countDistinctVisitorsSince(@Param("after") LocalDateTime after);

    @Query("SELECT v.path, COUNT(v) FROM SiteVisit v WHERE v.visitedAt >= :after GROUP BY v.path ORDER BY COUNT(v) DESC")
    List<Object[]> findTopPathsSince(@Param("after") LocalDateTime after);

    List<SiteVisit> findTop15ByOrderByVisitedAtDesc();
}
