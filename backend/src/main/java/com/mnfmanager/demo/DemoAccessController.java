package com.mnfmanager.demo;

import com.mnfmanager.common.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Signs visitors into the demo as admins, with no access code. Only exists under
 * the demo profile, and the demo runs with its own JWT secret, so these tokens
 * are worthless against the real backend.
 */
@RestController
@RequestMapping("/api/v1/demo")
@Profile("demo")
@RequiredArgsConstructor
public class DemoAccessController {

    private static final long DEMO_TOKEN_EXPIRATION = TimeUnit.HOURS.toMillis(12);

    private final JwtUtil jwtUtil;

    @PostMapping("/enter")
    public ResponseEntity<Map<String, Object>> enter() {
        String token = jwtUtil.generateToken("demo@mnfmanager.app", "ADMIN", DEMO_TOKEN_EXPIRATION);
        return ResponseEntity.ok(Map.of("token", token, "role", "ADMIN", "demo", true));
    }
}