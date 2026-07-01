package com.lowcode.engine.handler;

import com.lowcode.meta.domain.FieldMeta;
import com.lowcode.meta.domain.TableMeta;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 从表（SubTable）查询处理器
 */
@Component
@RequiredArgsConstructor
public class SubTableHandler {

    private final DSLContext dsl;

    /**
     * 查询单条记录的从表数据（用于详情查询）
     */
    /**
     * 查询单条记录的从表数据（用于详情查询）
     */
    public List<Map<String, Object>> querySubTable(TableMeta sub, Long mainId, List<String> fieldsSelect,
                                                   Map<Long, com.lowcode.meta.domain.FieldPerm> perms) {
        validateFieldsSelect(sub, fieldsSelect);
        List<Field<?>> selectFields = buildSelectFields(sub, fieldsSelect, perms);
        if (selectFields.isEmpty()) {
            return java.util.Collections.emptyList();
        }

        return dsl.select(selectFields)
                .from(DSL.table(DSL.name(sub.getTableName())))
                .where(DSL.field(DSL.name(sub.getForeignKey())).eq(mainId))
                .fetchMaps();
    }

    /**
     * 批量查询从表数据（用于列表查询，解决 N+1）。
     * 使用 IN 条件一次查出所有主表 ID 对应的从表记录。
     */
    public List<Map<String, Object>> querySubTableBatch(TableMeta sub, List<Long> mainIds,
                                                         List<String> fieldsSelect,
                                                         Map<Long, com.lowcode.meta.domain.FieldPerm> perms) {
        validateFieldsSelect(sub, fieldsSelect);

        List<Field<?>> selectFields = buildSelectFields(sub, fieldsSelect, perms);
        String fk = sub.getForeignKey();
        if (selectFields.isEmpty()) {
            // 如果无任何可读字段，也必须选出 FK 进行后续的分组编排
            selectFields.add(DSL.field(DSL.name(fk)).as("__group_fk__"));
        } else {
            // 确保 foreignKey 在选择列中
            boolean fkIncluded = selectFields.stream()
                    .anyMatch(f -> f.getName().equals(fk));
            if (!fkIncluded) {
                selectFields.add(DSL.field(DSL.name(fk)).as("__group_fk__"));
            }
        }

        return dsl.select(selectFields)
                .from(DSL.table(DSL.name(sub.getTableName())))
                .where(DSL.field(DSL.name(fk)).in(mainIds))
                .fetchMaps();
    }

    /**
     * 校验 with 中请求的字段是否存在于表的字段白名单中
     */
    private void validateFieldsSelect(TableMeta table, List<String> fieldsSelect) {
        if (fieldsSelect == null || fieldsSelect.isEmpty() || fieldsSelect.contains("*")) return;
        for (String reqField : fieldsSelect) {
            if (table.getFieldByName(reqField) == null) {
                throw new IllegalArgumentException(
                        "Unknown field in 'with': " + reqField + " for table: " + table.getTableName());
            }
        }
    }

    /**
     * 根据字段选择构建 SELECT 字段列表
     */
    private List<Field<?>> buildSelectFields(TableMeta table, List<String> fieldsSelect,
                                             Map<Long, com.lowcode.meta.domain.FieldPerm> perms) {
        List<Field<?>> selectFields = new ArrayList<>();
        for (FieldMeta f : table.getFields()) {
            boolean matched = fieldsSelect == null || fieldsSelect.isEmpty()
                    || fieldsSelect.contains("*") || fieldsSelect.contains(f.getColumnName());
            if (matched && perms.getOrDefault(f.getId(), com.lowcode.meta.domain.FieldPerm.NONE).canRead()) {
                selectFields.add(DSL.field(DSL.name(f.getColumnName())).as(f.getColumnName()));
            }
        }
        return selectFields;
    }
}
