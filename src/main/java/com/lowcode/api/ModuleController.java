package com.lowcode.api;

import com.lowcode.api.dto.QueryRequest;
import com.lowcode.api.dto.Result;
import com.lowcode.api.dto.SaveRequest;
import com.lowcode.engine.ModuleEngine;
import com.lowcode.meta.cache.MetaCache;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 模块通用 REST API
 */
@RestController
@RequestMapping("/api/module")
@RequiredArgsConstructor
public class ModuleController {

    private final ModuleEngine moduleEngine;
    private final MetaCache metaCache;

    /**
     * 模块查询（列表 + 详情 + 关联）
     */
    @PostMapping("/{moduleId}/query")
    public Result<Map<String, Object>> query(
            @PathVariable String moduleId,
            @RequestBody QueryRequest req) {
        return Result.ok(moduleEngine.query(moduleId, req));
    }

    /**
     * 模块整体保存（主表 + 从表 + 关联）
     */
    @PostMapping("/{moduleId}/save")
    public Result<Long> save(
            @PathVariable String moduleId,
            @RequestBody SaveRequest req) {
        return Result.ok(moduleEngine.save(moduleId, req));
    }

    /**
     * 删除主表记录（级联删除从表和关联）
     */
    @DeleteMapping("/{moduleId}/{id}")
    public Result<Void> delete(
            @PathVariable String moduleId,
            @PathVariable Long id) {
        moduleEngine.delete(moduleId, id);
        return Result.ok();
    }

    /**
     * 刷新模块元数据缓存
     */
    @PostMapping("/{moduleId}/refresh-cache")
    public Result<Void> refreshCache(@PathVariable String moduleId) {
        metaCache.invalidate(moduleId);
        return Result.ok();
    }
}
