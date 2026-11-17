package com.nuvaya.controller;

import com.nuvaya.auth.JwtService;
import com.nuvaya.dto.request.LoginRequest;
import com.nuvaya.dto.response.AuthResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/auth")
@RequiredArgsConstructor
public class AdminAuthController {
    private final AuthenticationManager authManager;
    private final JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword()));
        return ResponseEntity.ok(new AuthResponse(jwtService.generateToken(auth.getName(), "ROLE_ADMIN"), auth.getName(), "ROLE_ADMIN"));
    }

    @PostMapping("/logout")
    public ResponseEntity<Object> logout() {
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }
}
