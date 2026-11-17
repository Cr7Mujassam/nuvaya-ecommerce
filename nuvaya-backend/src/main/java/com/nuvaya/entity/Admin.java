package com.nuvaya.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "admins")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Admin {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 80)
    private String username;
    @Column(nullable = false)
    private String passwordHash;
    @Column(nullable = false, length = 30) @Builder.Default
    private String role = "ROLE_ADMIN";
    @Column(nullable = false) @Builder.Default
    private boolean active = true;
    private LocalDateTime createdAt;
    @PrePersist void onCreate() { this.createdAt = LocalDateTime.now(); }
}
