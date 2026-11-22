package com.nuvaya.controller;

import com.nuvaya.entity.SiteVisit;
import com.nuvaya.repository.SiteVisitRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class AnalyticsController {
    private final SiteVisitRepository siteVisitRepository;
    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    @PostMapping("/store/track")
    public ResponseEntity> trackVisit(@RequestBody(required = false) Map<String, String> body,
                                                          HttpServletRequest request) {
        String path = body != null ? body.getOrDefault("path", "/") : "/";
        if (path.length() > 250) path = path.substring(0, 250);
        if (path.startsWith("/admin")) {
            return ResponseEntity.ok(Map.of("status", "ignored"));
        }

        String visitorId = body != null ? body.get("visitorId") : null;
        if (visitorId != null && visitorId.length() > 80) visitorId = visitorId.substring(0, 80);

        String referrer = body != null ? body.get("referrer") : request.getHeader("Referer");
        if (referrer != null && referrer.length() > 290) referrer = referrer.substring(0, 290);

        String ua = request.getHeader("User-Agent");
        if (ua != null && ua.length() > 290) ua = ua.substring(0, 290);

        siteVisitRepository.save(SiteVisit.builder()
                .path(path)
                .visitorId(visitorId)
                .referrer(referrer)
                .userAgent(ua)
                .visitedAt(LocalDateTime.now(IST))
                .build());

        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @GetMapping("/admin/analytics")
    public ResponseEntity> getAnalytics() {
        LocalDateTime startOfToday = LocalDate.now(IST).atStartOfDay();
        LocalDateTime sevenDaysAgo = startOfToday.minusDays(6);

        long todayRequests = siteVisitRepository.countByVisitedAtAfter(startOfToday);
        long uniqueVisitorsToday = siteVisitRepository.countDistinctVisitorsSince(startOfToday);
        long last7DaysRequests = siteVisitRepository.countByVisitedAtAfter(sevenDaysAgo);
        long totalRequests = siteVisitRepository.count();

        List> topPages = new ArrayList<>();
        for (Object[] row : siteVisitRepository.findTopPathsSince(sevenDaysAgo)) {
            if (topPages.size() >= 6) break;
            topPages.add(Map.of("path", String.valueOf(row[0]), "views", ((Number) row[1]).longValue()));
        }

        List> recent = new ArrayList<>();
        for (SiteVisit v : siteVisitRepository.findTop15ByOrderByVisitedAtDesc()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", v.getId());
            item.put("path", v.getPath());
            item.put("visitorId", v.getVisitorId() != null ? v.getVisitorId() : "guest");
            item.put("visitedAt", String.valueOf(v.getVisitedAt()));
            recent.add(item);
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("todayRequests", todayRequests);
        payload.put("uniqueVisitorsToday", uniqueVisitorsToday);
        payload.put("last7DaysRequests", last7DaysRequests);
        payload.put("totalRequests", totalRequests);
        payload.put("topPages", topPages);
        payload.put("recentRequests", recent);
        return ResponseEntity.ok(payload);
    }
}
