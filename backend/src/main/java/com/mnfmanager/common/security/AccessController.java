package com.mnfmanager.common.security;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/access")
@RequiredArgsConstructor
@Slf4j
public class AccessController {

    private static final BCryptPasswordEncoder ENCODER = new BCryptPasswordEncoder();

    private final JwtUtil jwtUtil;
    private final AccessRateLimiter rateLimiter;

    @Value("${mnf.access-code-hash:}")
    private String accessCodeHash;

    @Value("${mnf.member-token-expiration}")
    private long memberTokenExpiration;

    @PostMapping
    public ResponseEntity<Map<String, Object>> enter(
            @RequestBody Map<String, String> body, HttpServletRequest request) {

        // Fail closed: if no code is configured, nobody gets in
        if (accessCodeHash == null || accessCodeHash.isBlank()) {
            log.error("Access code hash not configured");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "Access is not configured"));
        }

        if (!rateLimiter.tryAcquire(clientIp(request))) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Too many attempts. Try again later."));
        }

        String code = body.get("code");
        if (code == null || !ENCODER.matches(code.trim(), accessCodeHash)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Incorrect access code"));
        }

        String token = jwtUtil.generateToken("mnf-member", "MEMBER", memberTokenExpiration);
        return ResponseEntity.ok(Map.of("token", token, "role", "MEMBER"));
    }

    private String clientIp(HttpServletRequest request) {
        // Azure ingress sits in front of the app, so the real IP is in X-Forwarded-For
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}