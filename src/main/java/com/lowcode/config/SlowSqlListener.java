package com.lowcode.config;

import lombok.extern.slf4j.Slf4j;
import org.jooq.ExecuteContext;
import org.jooq.ExecuteListener;

/**
 * 慢 SQL 监控，超过 500ms 打警告日志
 */
@Slf4j
public class SlowSqlListener implements ExecuteListener {

    private static final long SLOW_THRESHOLD_MS = 500;
    private final ThreadLocal<Long> start = new ThreadLocal<>();

    @Override
    public void executeStart(ExecuteContext ctx) {
        start.set(System.currentTimeMillis());
    }

    @Override
    public void executeEnd(ExecuteContext ctx) {
        try {
            Long startTime = start.get();
            if (startTime != null) {
                long cost = System.currentTimeMillis() - startTime;
                if (cost > SLOW_THRESHOLD_MS) {
                    log.warn("慢 SQL [{}ms]: {}", cost, ctx.sql());
                }
            }
        } finally {
            start.remove();
        }
    }

    @Override
    public void exception(ExecuteContext ctx) {
        // 异常时也确保清理 ThreadLocal
        start.remove();
    }
}
