package com.lowcode.engine;

import com.lowcode.api.dto.PageResult;
import com.lowcode.api.dto.QueryRequest;
import com.lowcode.api.dto.SaveRequest;
import com.lowcode.engine.handler.DetailHandler;
import com.lowcode.engine.handler.ListHandler;
import com.lowcode.engine.handler.RelationHandler;
import com.lowcode.engine.handler.SubTableHandler;
import com.lowcode.engine.handler.SaveHandler;
import com.lowcode.meta.cache.MetaCache;
import com.lowcode.meta.domain.ModuleMeta;
import com.lowcode.meta.domain.TableMeta;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 模块引擎 — 通用查询 / 保存 / 删除的核心编排器
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ModuleEngine {

    private final MetaCache metaCache;
    private final ListHandler listHandler;
    private final DetailHandler detailHandler;
    private final RelationHandler relationHandler;
    private final SubTableHandler subTableHandler;
    private final SaveHandler saveHandler;
    private final DSLContext dsl;

    // ==================== 查询 ====================

    public Map<String, Object> query(String moduleId, QueryRequest req) {
        ModuleMeta meta = metaCache.get(moduleId);
        Map<String, Object> result = new LinkedHashMap<>();

        // 1. 构建 withMap 并校验表名合法性
        Map<String, List<String>> withMap = buildAndValidateWithMap(req, meta);
        boolean fetchAllRelations = (req.getId() != null && withMap.isEmpty());

        // 2. 遍历 LIST 表执行查询
        meta.getListTables().forEach(t -> {
            List<TableMeta> requiredJoins = meta.getJoinTables().stream()
                    .filter(jt -> fetchAllRelations || withMap.containsKey(jt.getTableName()))
                    .toList();

            if (req.getId() != null) {
                // 详情查询
                result.put("detail", detailHandler.query(t, requiredJoins, req.getId(), withMap));
            } else {
                // 列表查询
                PageResult pr = listHandler.query(t, requiredJoins, req, withMap);

                // 批量加载从表和关联数据（解决 N+1）
                if (!pr.getRows().isEmpty() && !withMap.isEmpty()) {
                    batchLoadSubAndRelation(pr.getRows(), t, meta, withMap);
                }

                result.put("rows", pr.getRows());
                result.put("total", pr.getTotal());
                result.put("page", pr.getPage());
                result.put("size", pr.getSize());
            }
        });

        // 3. 详情模式：展开 detail 并追加 sub/relation
        if (req.getId() != null) {
            @SuppressWarnings("unchecked")
            Map<String, Object> detailData = (Map<String, Object>) result.remove("detail");
            if (detailData != null) {
                result.putAll(detailData);
            }

            for (TableMeta sub : meta.getSubTables()) {
                if (fetchAllRelations || withMap.containsKey(sub.getTableName())) {
                    result.put(sub.getTableName(),
                            subTableHandler.querySubTable(sub, req.getId(), withMap.get(sub.getTableName())));
                }
            }
            meta.getRelations().forEach(rel -> {
                if (fetchAllRelations || withMap.containsKey(rel.getName())) {
                    result.put(rel.getName(),
                            relationHandler.queryRight(rel, req.getId(), withMap.get(rel.getName())));
                }
            });
        }

        return result;
    }

    // ==================== 保存 ====================

    @Transactional(rollbackFor = Exception.class)
    public Long save(String moduleId, SaveRequest req) {
        ModuleMeta meta = metaCache.get(moduleId);

        Map<String, Object> reqData = req.getData();
        if (reqData == null) {
            throw new IllegalArgumentException("保存请求的 data 不能为空");
        }

        TableMeta mainTable = meta.getMainTable();
        if (mainTable == null) {
            throw new IllegalArgumentException("模块 [" + moduleId + "] 未配置主表");
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> mainData = (Map<String, Object>) reqData.get(mainTable.getTableName());
        if (mainData == null || mainData.isEmpty()) {
            throw new IllegalArgumentException("主表 [" + mainTable.getTableName() + "] 数据不能为空");
        }

        Long mainId = mainData.get("id") != null ? ((Number) mainData.get("id")).longValue() : null;
        mainId = saveHandler.upsertTable(mainTable, mainData, mainId);

        if (mainId == null) {
            throw new IllegalArgumentException("保存主表失败，未能获取自增 ID");
        }

        // 保存从表
        final Long finalMainId = mainId;
        for (TableMeta sub : meta.getSubTables()) {
            if (reqData.containsKey(sub.getTableName())) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> subDataList = (List<Map<String, Object>>) reqData.get(sub.getTableName());
                if (subDataList == null) subDataList = Collections.emptyList();

                List<Long> keepIds = subDataList.stream()
                        .map(d -> d.get("id"))
                        .filter(Objects::nonNull)
                        .map(idObj -> ((Number) idObj).longValue())
                        .toList();

                // 删除不在提交列表中的旧记录
                if (keepIds.isEmpty()) {
                    dsl.deleteFrom(DSL.table(DSL.name(sub.getTableName())))
                            .where(DSL.field(DSL.name(sub.getForeignKey())).eq(finalMainId))
                            .execute();
                } else {
                    dsl.deleteFrom(DSL.table(DSL.name(sub.getTableName())))
                            .where(DSL.field(DSL.name(sub.getForeignKey())).eq(finalMainId))
                            .and(DSL.field("id").notIn(keepIds))
                            .execute();
                }

                saveHandler.saveSubTableBatch(sub, finalMainId, subDataList);
            }
        }

        // 保存 N:M 关联
        meta.getRelations().forEach(rel -> {
            if (reqData.containsKey(rel.getName())) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> rightDataList = (List<Map<String, Object>>) reqData.get(rel.getName());
                if (rightDataList == null) rightDataList = Collections.emptyList();

                List<Long> rightIds = rightDataList.stream()
                        .map(d -> d.get("id"))
                        .filter(Objects::nonNull)
                        .map(idObj -> ((Number) idObj).longValue())
                        .toList();

                relationHandler.saveRelations(rel, finalMainId, rightIds);
            }
        });

        log.info("模块 [{}] 保存完成, mainId={}", moduleId, mainId);
        return mainId;
    }

    // ==================== 删除 ====================

    @Transactional(rollbackFor = Exception.class)
    public void delete(String moduleId, Long id) {
        ModuleMeta meta = metaCache.get(moduleId);

        // 1. 清除 N:M 关联
        meta.getRelations().forEach(rel ->
                relationHandler.saveRelations(rel, id, List.of()));

        // 2. 删除从表
        for (TableMeta sub : meta.getSubTables()) {
            if (sub.getForeignKey() != null) {
                dsl.deleteFrom(DSL.table(DSL.name(sub.getTableName())))
                        .where(DSL.field(DSL.name(sub.getForeignKey())).eq(id))
                        .execute();
            }
        }

        // 3. 删除主表
        if (meta.getMainTable() != null) {
            dsl.deleteFrom(DSL.table(DSL.name(meta.getMainTable().getTableName())))
                    .where(DSL.field("id").eq(id))
                    .execute();
        }

        log.info("模块 [{}] 删除完成, id={}", moduleId, id);
    }

    // ==================== 私有方法 ====================

    /**
     * 构建并校验 withMap
     */
    private Map<String, List<String>> buildAndValidateWithMap(QueryRequest req, ModuleMeta meta) {
        Map<String, List<String>> withMap = new HashMap<>();
        if (req.getWith() == null) {
            return withMap;
        }

        // 构建合法表名集合，用于快速校验
        Set<String> validNames = new HashSet<>();
        meta.getJoinTables().forEach(jt -> validNames.add(jt.getTableName()));
        meta.getSubTables().forEach(st -> validNames.add(st.getTableName()));
        meta.getRelations().forEach(rel -> validNames.add(rel.getName()));

        for (QueryRequest.With w : req.getWith()) {
            String tName = w.getTableName();
            if (!validNames.contains(tName)) {
                throw new IllegalArgumentException("Unknown table or relation in 'with': " + tName);
            }
            withMap.put(tName, w.getFields());
        }
        return withMap;
    }

    /**
     * 批量加载从表和关联数据，解决 N+1 问题。
     * 收集所有主表 ID，每个从表/关联只执行一次 SQL，然后按 ID 分组回填到各行。
     */
    @SuppressWarnings("unchecked")
    private void batchLoadSubAndRelation(List<Map<String, Object>> rows, TableMeta listTable,
                                         ModuleMeta meta, Map<String, List<String>> withMap) {
        // 收集所有主表 ID
        List<Long> mainIds = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            Map<String, Object> mainData = (Map<String, Object>) row.get(listTable.getTableName());
            if (mainData != null && mainData.get("id") != null) {
                mainIds.add(((Number) mainData.get("id")).longValue());
            }
        }
        if (mainIds.isEmpty()) return;

        // 批量查询从表
        for (TableMeta sub : meta.getSubTables()) {
            if (!withMap.containsKey(sub.getTableName())) continue;

            List<Map<String, Object>> allSubData = subTableHandler.querySubTableBatch(sub, mainIds, withMap.get(sub.getTableName()));
            // 按 foreignKey 分组
            Map<Long, List<Map<String, Object>>> grouped = allSubData.stream()
                    .collect(Collectors.groupingBy(
                            m -> ((Number) m.get(sub.getForeignKey())).longValue()));

            // 回填到各行
            for (Map<String, Object> row : rows) {
                Map<String, Object> mainData = (Map<String, Object>) row.get(listTable.getTableName());
                if (mainData == null || mainData.get("id") == null) continue;
                Long rowId = ((Number) mainData.get("id")).longValue();
                row.put(sub.getTableName(), grouped.getOrDefault(rowId, Collections.emptyList()));
            }
        }

        // 批量查询 N:M 关联
        for (var rel : meta.getRelations()) {
            if (!withMap.containsKey(rel.getName())) continue;

            Map<Long, List<Map<String, Object>>> grouped =
                    relationHandler.queryRightBatch(rel, mainIds, withMap.get(rel.getName()));

            for (Map<String, Object> row : rows) {
                Map<String, Object> mainData = (Map<String, Object>) row.get(listTable.getTableName());
                if (mainData == null || mainData.get("id") == null) continue;
                Long rowId = ((Number) mainData.get("id")).longValue();
                row.put(rel.getName(), grouped.getOrDefault(rowId, Collections.emptyList()));
            }
        }
    }
}
