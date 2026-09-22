package com.mnfmanager.common.security;

import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple in-memory limiter for access-code attempts: at most MAX_ATTEMPTS
 * per IP within WINDOW_MS. Good enough for a single backend replica.
 */
@Component
public class AccessRateLimiter {

    private static final int MAX_ATTEMPTS = 5;
    private static final long WINDOW_MS = 15 * 60 * 1000L;

    private final Map<String, Deque<Long>> attempts = new ConcurrentHashMap<>();

    public boolean tryAcquire(String key) {
        long now = System.currentTimeMillis();
        Deque<Long> times = attempts.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (times) {
            while (!times.isEmpty() && now - times.peekFirst() > WINDOW_MS) {
                times.pollFirst();
            }
            if (times.size() >= MAX_ATTEMPTS) {
                return false;
            }
            times.addLast(now);
            return true;
        }
    }
}