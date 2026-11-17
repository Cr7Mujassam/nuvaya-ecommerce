package com.nuvaya.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {
    @Value("${nuvaya.jwt.secret}") private String secret;
    @Value("${nuvaya.jwt.expiration-ms}") private long expirationMs;

    private SecretKey getSigningKey() { return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)); }

    public String generateToken(String username, String role) {
        Date now = new Date();
        return Jwts.builder().subject(username).claim("role", role).issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs)).signWith(getSigningKey()).compact();
    }

    public String extractUsername(String token) { return extractClaim(token, Claims::getSubject); }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        return extractUsername(token).equals(userDetails.getUsername())
                && extractClaim(token, Claims::getExpiration).after(new Date());
    }

    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        Claims claims = Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token).getPayload();
        return resolver.apply(claims);
    }
}
