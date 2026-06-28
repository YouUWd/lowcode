package com.lowcode.meta.cache;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.lowcode.meta.domain.ModuleMeta;
import com.lowcode.meta.repository.MetaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

/**
 * 模块元数据缓存 — Caffeine 本地缓存，1 小时 TTL
 */
@Component
@RequiredArgsConstructor
public class MetaCache {

    private final MetaRepository metaRepo;

    private final Cache<String, ModuleMeta> cache = Caffeine.newBuilder()
        .maximumSize(500)
        .expireAfterWrite(1, TimeUnit.HOURS)
        .recordStats()
        .build();

    public ModuleMeta get(String moduleId) {
        return cache.get(moduleId, metaRepo::loadModuleMeta);
    }

    public void invalidate(String moduleId) {
        cache.invalidate(moduleId);
    }

    public void invalidateAll() {
        cache.invalidateAll();
    }
}
