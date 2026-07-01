package com.lowcode.engine.handler;

import lombok.RequiredArgsConstructor;
import com.lowcode.meta.domain.RelationMeta;
import com.lowcode.meta.domain.TableMeta;
import com.lowcode.meta.domain.FieldMeta;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.Record;
import org.jooq.Table;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * N:M 关联处理器 — 中间表的查询与保存
 */
@Component
@RequiredArgsConstructor
public class RelationHandler {

    private final DSLContext dsl;

    /**
     * 查询关联的右表数据（通过中间表 JOIN），支持字段选择与权限校验
     */
    public List<Map<String, Object>> queryRight(RelationMeta rel, Long leftId, List<String> fieldsSelect,
                                                TableMeta rightTableMeta, Map<Long, com.lowcode.meta.domain.FieldPerm> perms) {
        Table<Record> junction = DSL.table(DSL.name(rel.getJunctionTable()));
        String rightTableName = rel.getRightTable();
        Table<Record> right = DSL.table(DSL.name(rightTableName));

        String rightPk = defaultIfBlank(rel.getRightJoinColumn(), "id");

        List<org.jooq.SelectFieldOrAsterisk> selectFields = buildRelationSelectFields(rightTableName, right, fieldsSelect, rightTableMeta, perms);
        if (selectFields.isEmpty()) {
            return Collections.emptyList();
        }

        return dsl
                .select(selectFields)
                .from(right)
                .innerJoin(junction)
                .on(DSL.field(DSL.name(rel.getJunctionTable(), rel.getRightFk()))
                        .eq(DSL.field(DSL.name(rightTableName, rightPk))))
                .where(DSL.field(DSL.name(rel.getJunctionTable(), rel.getLeftFk()))
                        .eq(leftId))
                .fetchMaps();
    }

    /**
     * 批量查询关联的右表数据（解决 N+1 问题），支持权限校验。
     */
    public Map<Long, List<Map<String, Object>>> queryRightBatch(
            RelationMeta rel, List<Long> leftIds, List<String> fieldsSelect,
            TableMeta rightTableMeta, Map<Long, com.lowcode.meta.domain.FieldPerm> perms) {
        if (leftIds == null || leftIds.isEmpty()) {
            return Collections.emptyMap();
        }

        Table<Record> junction = DSL.table(DSL.name(rel.getJunctionTable()));
        String rightTableName = rel.getRightTable();
        Table<Record> right = DSL.table(DSL.name(rightTableName));

        String rightPk = defaultIfBlank(rel.getRightJoinColumn(), "id");
        String leftFk = rel.getLeftFk();

        // 选择字段 + 中间表的 leftFk（用于分组）
        List<org.jooq.SelectFieldOrAsterisk> selectFields = buildRelationSelectFields(rightTableName, right, fieldsSelect, rightTableMeta, perms);
        if (selectFields.isEmpty()) {
            return Collections.emptyMap();
        }
        
        Field<Object> leftFkField = DSL.field(DSL.name(rel.getJunctionTable(), leftFk));
        selectFields.add(leftFkField.as("__left_fk__"));

        List<Map<String, Object>> allRows = dsl
                .select(selectFields)
                .from(right)
                .innerJoin(junction)
                .on(DSL.field(DSL.name(rel.getJunctionTable(), rel.getRightFk()))
                        .eq(DSL.field(DSL.name(rightTableName, rightPk))))
                .where(leftFkField.in(leftIds))
                .fetchMaps();

        // 按 leftFk 分组，并移除临时的 __left_fk__ 字段
        Map<Long, List<Map<String, Object>>> grouped = new HashMap<>();
        for (Map<String, Object> row : allRows) {
            Long leftId = ((Number) row.remove("__left_fk__")).longValue();
            grouped.computeIfAbsent(leftId, k -> new ArrayList<>()).add(row);
        }
        return grouped;
    }

    /**
     * 保存 N:M 关联（先删后批量插入）
     */
    @Transactional
    public void saveRelations(RelationMeta rel, Long leftId, List<Long> rightIds) {
        Table<Record> junction = DSL.table(DSL.name(rel.getJunctionTable()));
        Field<Long> leftFkField = DSL.field(DSL.name(rel.getLeftFk()), Long.class);
        Field<Long> rightFkField = DSL.field(DSL.name(rel.getRightFk()), Long.class);

        // 先删除旧关联
        dsl.deleteFrom(junction)
                .where(leftFkField.eq(leftId))
                .execute();

        // 批量插入新关联
        if (rightIds != null && !rightIds.isEmpty()) {
            var inserts = rightIds.stream()
                    .map(rid -> dsl.insertInto(junction)
                            .set(leftFkField, leftId)
                            .set(rightFkField, rid))
                    .toList();
            dsl.batch(inserts).execute();
        }
    }

    // ==================== 私有方法 ====================

    private List<org.jooq.SelectFieldOrAsterisk> buildRelationSelectFields(
            String rightTableName, Table<Record> right, List<String> fieldsSelect,
            TableMeta rightTableMeta, Map<Long, com.lowcode.meta.domain.FieldPerm> perms) {
        List<org.jooq.SelectFieldOrAsterisk> selectFields = new ArrayList<>();
        if (rightTableMeta != null) {
            List<String> toSelect = new ArrayList<>();
            if (fieldsSelect == null || fieldsSelect.isEmpty() || fieldsSelect.contains("*")) {
                rightTableMeta.getFields().forEach(f -> toSelect.add(f.getColumnName()));
            } else {
                toSelect.addAll(fieldsSelect);
            }
            for (String col : toSelect) {
                com.lowcode.meta.domain.FieldMeta fm = rightTableMeta.getFieldByName(col);
                if (fm != null) {
                    com.lowcode.meta.domain.FieldPerm perm = perms.getOrDefault(fm.getId(), com.lowcode.meta.domain.FieldPerm.NONE);
                    if (perm.canRead()) {
                        selectFields.add(DSL.field(DSL.name(rightTableName, col)).as(col));
                    }
                }
            }
        } else {
            if (fieldsSelect == null || fieldsSelect.isEmpty() || fieldsSelect.contains("*")) {
                selectFields.add(right.asterisk());
            } else {
                for (String f : fieldsSelect) {
                    selectFields.add(DSL.field(DSL.name(rightTableName, f)).as(f));
                }
            }
        }
        return selectFields;
    }

    private static String defaultIfBlank(String value, String defaultValue) {
        return (value != null && !value.isBlank()) ? value : defaultValue;
    }
}
