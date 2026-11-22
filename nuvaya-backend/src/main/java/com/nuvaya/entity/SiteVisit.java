package com.nuvaya.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "site_visits", indexes = {
    @Index(name = "idx_site_visits_visited_at", columnList = "visitedAt"),
    @Index(name = "idx_site_visits_visitor_id", columnList = "visitorId")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SiteVisit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String path;

    @Column(length = 80)
    private String visitorId;

    @Column(length = 300)
    private String referrer;

    @Column(length = 300)
    private String userAgent;

    @Column(nullable = false)
    private LocalDateTime visitedAt;

    @PrePersist
    public void prePersist() {
        if (this.visitedAt == null) {
            this.visitedAt = LocalDateTime.now();
        }
    }
}
