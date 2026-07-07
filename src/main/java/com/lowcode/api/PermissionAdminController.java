package com.lowcode.api;

import com.lowcode.api.dto.FieldPermissionBatchRequest;
import com.lowcode.api.dto.FieldPermissionResponse;
import com.lowcode.api.dto.Result;
import com.lowcode.engine.PermissionResolver;
import com.lowcode.meta.cache.MetaCache;
import com.lowcode.meta.domain.FieldPerm;
import com.lowcode.meta.domain.ModuleMeta;
import com.lowcode.meta.domain.TableMeta;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.Query;
import org.jooq.impl.DSL;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/permission")
@RequiredArgsConstructor
public class PermissionAdminController {

    private final DSLContext dsl;
    private final MetaCache metaCache;
    private final PermissionResolver permissionResolver;

    /**
     * 获取指定角色在指定模块下的字段权限配置列表
     */
    @GetMapping("/{moduleId}/{roleCode}")
    public Result<List<FieldPermissionResponse>> getPermissions(
            @PathVariable String moduleId,
            @PathVariable String roleCode) {

        ModuleMeta meta = metaCache.get(moduleId);
        if (meta == null) {
            return Result.fail(404, "Module not found");
        }

        // 使用现有的 permissionResolver 解析出每个 fieldId -> FieldPerm
        Map<Long, FieldPerm> perms = permissionResolver.resolveAll(meta, moduleId, roleCode);

        List<FieldPermissionResponse> responseList = new ArrayList<>();
        
        // 收集所有表及其字段
        List<TableMeta> allTables = new ArrayList<>();
        if (meta.getMainTable() != null) allTables.add(meta.getMainTable());
        if (meta.getListTables() != null) allTables.addAll(meta.getListTables());
        if (meta.getSubTables() != null) allTables.addAll(meta.getSubTables());
        if (meta.getJoinTables() != null) allTables.addAll(meta.getJoinTables());
        if (meta.getRelationTables() != null) allTables.addAll(meta.getRelationTables());

        // 避免重复处理同一张表（主表和列表表可能是同一个对象）
        List<TableMeta> uniqueTables = new ArrayList<>();
        for (TableMeta table : allTables) {
            if (table != null && !uniqueTables.contains(table)) {
                uniqueTables.add(table);
            }
        }

        for (TableMeta table : uniqueTables) {
            List<FieldPermissionResponse.FieldPermResponseItem> fieldItems = new ArrayList<>();
            if (table.getFields() != null) {
                for (var field : table.getFields()) {
                    FieldPerm perm = perms.getOrDefault(field.getId(), FieldPerm.NONE);
                    fieldItems.add(FieldPermissionResponse.FieldPermResponseItem.builder()
                            .fieldMetaId(field.getId())
                            .columnName(field.getColumnName())
                            .label(field.getLabel())
                            .perm(perm.getValue())
                            .build());
                }
            }
            responseList.add(FieldPermissionResponse.builder()
                    .tableMetaId(table.getId())
                    .tableName(table.getTableName())
                    .fields(fieldItems)
                    .build());
        }

        return Result.ok(responseList);
    }

    /**
     * 批量设置字段权限配置
     */
    @PostMapping("/field/batch")
    @Transactional(rollbackFor = Exception.class)
    public Result<Void> setFieldPermissions(
            @RequestBody FieldPermissionBatchRequest req) {

        var table = DSL.table(DSL.name("module_field_config"));

        // 1. 先物理清除该角色在此模块的所有老权限配置
        dsl.deleteFrom(table)
                .where(DSL.field("role_code").eq(req.getRoleCode())
                        .and(DSL.field("module_id").eq(req.getModuleId())))
                .execute();

        // 2. 批量构建并执行插入
        List<Query> insertQueries = new ArrayList<>();
        if (req.getTables() != null) {
            for (var t : req.getTables()) {
                if (t.getFields() == null) continue;
                for (var p : t.getFields()) {
                    insertQueries.add(dsl.insertInto(table)
                            .set(DSL.field("role_code"), req.getRoleCode())
                            .set(DSL.field("module_id"), req.getModuleId())
                            .set(DSL.field("field_meta_id"), p.getFieldMetaId())
                            .set(DSL.field("perm_value"), p.getPerm()));
                }
            }
        }

        if (!insertQueries.isEmpty()) {
            dsl.batch(insertQueries).execute();
        }

        // 3. 强制失效元数据缓存，促使下次引擎调用时重构模块权限
        metaCache.invalidate(req.getModuleId());

        return Result.ok();
    }
}
