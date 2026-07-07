package com.lowcode.api;

import com.lowcode.api.dto.Result;
import com.lowcode.api.dto.SchemaDTO;
import com.lowcode.meta.repository.MetaRepository;
import com.lowcode.meta.cache.MetaCache;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

/**
 * 全局元数据管理 API 控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/meta")
@RequiredArgsConstructor
public class MetadataAdminController {

    private final MetaRepository metaRepository;
    private final MetaCache metaCache;

    /**
     * 一次性获取全量数据源、物理表、字段配置及全局连线拓扑
     */
    @GetMapping("/schema")
    public Result<SchemaDTO> loadGlobalSchema() {
        return Result.ok(metaRepository.loadGlobalSchema());
    }

    /**
     * 一次性声明式保存/更新全量物理表、字段以及连线差异
     */
    @PostMapping("/schema")
    public Result<Void> saveGlobalSchema(@RequestBody SchemaDTO schema) {
        metaRepository.saveGlobalSchema(schema);
        
        // 元数据发生改变，为了保障安全，直接使全部模块的本地元数据缓存失效
        metaCache.invalidateAll();
        
        log.info("全局拓扑元数据更新成功，全量清除本地元数据缓存");
        return Result.ok();
    }
}
