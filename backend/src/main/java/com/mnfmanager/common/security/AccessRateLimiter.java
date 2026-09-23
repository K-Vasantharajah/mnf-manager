package com.mnfmanager.common.security;

import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory limiter for access-code attempts. Counts are per-replica, so this
 * only holds while the backend runs a single replica; scaling out would
 * multiply the effective limit.
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