package com.lowcode.meta.repository;

import com.lowcode.meta.domain.FieldMeta;
import com.lowcode.meta.domain.ModuleMeta;
import com.lowcode.meta.domain.RelationMeta;
import com.lowcode.meta.domain.TableMeta;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 元数据仓库 — 从元数据表加载并组装 ModuleMeta 聚合对象
 */
@Slf4j
@Repository
@RequiredArgsConstructor
public class MetaRepository {

    private final DSLContext dsl;

    /**
     * 加载完整的模块元数据
     */
    public ModuleMeta loadModuleMeta(String moduleId) {
        // 1. 查询模块基本信息
        Record moduleRecord = dsl.select()
            .from(DSL.table("module_meta"))
            .where(DSL.field("id").eq(moduleId))
            .fetchOne();

        if (moduleRecord == null) {
            throw new IllegalArgumentException("模块不存在: " + moduleId);
        }

        ModuleMeta meta = new ModuleMeta();
        meta.setId(moduleRecord.get(DSL.field("id", String.class)));
        meta.setName(moduleRecord.get(DSL.field("name", String.class)));
        meta.setDescription(moduleRecord.get(DSL.field("description", String.class)));

        // 2. 查询该模块下所有表配置
        List<TableMeta> tables = dsl.select()
            .from(DSL.table("table_meta"))
            .where(DSL.field("module_id").eq(moduleId))
            .orderBy(DSL.field("sort_order").asc())
            .fetch(this::mapToTableMeta);

        // 3. 为每张表加载字段白名单
        for (TableMeta table : tables) {
            List<FieldMeta> fields = dsl.select()
                .from(DSL.table("field_meta"))
                .where(DSL.field("table_meta_id").eq(table.getId()))
                .orderBy(DSL.field("sort_order").asc())
                .fetch(this::mapToFieldMeta);
            table.setFields(fields);
        }

        // 4. 按 queryType 分组填充
        for (TableMeta table : tables) {
            switch (table.getQueryType()) {
                case "MAIN" -> meta.setMainTable(table);
                case "LIST" -> meta.getListTables().add(table);
                case "SUB"  -> meta.getSubTables().add(table);
                case "JOIN" -> meta.getJoinTables().add(table);
                case "RELATION" -> meta.getRelationTables().add(table);
            }
        }

        // 如果没有单独的 LIST 类型表，主表同时作为 LIST 表
        if (meta.getListTables().isEmpty() && meta.getMainTable() != null) {
            meta.getListTables().add(meta.getMainTable());
        }

        // 5. 查询 N:M 关联配置
        List<RelationMeta> relations = dsl.select()
            .from(DSL.table("relation_meta"))
            .where(DSL.field("module_id").eq(moduleId))
            .fetch(this::mapToRelationMeta);
        meta.setRelations(relations);

        log.info("加载模块元数据: {} ({}), 表数={}, 关联数={}",
            meta.getName(), meta.getId(), tables.size(), relations.size());

        return meta;
    }

    private TableMeta mapToTableMeta(Record r) {
        TableMeta t = new TableMeta();
        t.setId(r.get(DSL.field("id", Long.class)));
        t.setTableName(r.get(DSL.field("table_name", String.class)));
        t.setQueryType(r.get(DSL.field("query_type", String.class)));
        t.setJoinType(r.get(DSL.field("join_type", String.class)));
        t.setJoinOn(r.get(DSL.field("join_on", String.class)));
        t.setForeignKey(r.get(DSL.field("foreign_key", String.class)));
        return t;
    }

    private FieldMeta mapToFieldMeta(Record r) {
        FieldMeta f = new FieldMeta();
        f.setId(r.get(DSL.field("id", Long.class)));
        f.setColumnName(r.get(DSL.field("column_name", String.class)));
        f.setLabel(r.get(DSL.field("label", String.class)));
        f.setDataType(r.get(DSL.field("data_type", String.class)));
        f.setQueryable(toBoolean(r.get(DSL.field("queryable"))));
        f.setSortable(toBoolean(r.get(DSL.field("sortable"))));
        f.setWritable(toBoolean(r.get(DSL.field("writable"))));
        f.setQueryOp(r.get(DSL.field("query_op", String.class)));
        return f;
    }

    private RelationMeta mapToRelationMeta(Record r) {
        RelationMeta rel = new RelationMeta();
        rel.setId(r.get(DSL.field("id", Long.class)));
        rel.setName(r.get(DSL.field("name", String.class)));
        rel.setLeftTable(r.get(DSL.field("left_table", String.class)));
        rel.setRightTable(r.get(DSL.field("right_table", String.class)));
        rel.setJunctionTable(r.get(DSL.field("junction_table", String.class)));
        rel.setLeftFk(r.get(DSL.field("left_fk", String.class)));
        rel.setRightFk(r.get(DSL.field("right_fk", String.class)));
        rel.setLeftJoinColumn(r.get(DSL.field("left_join_column", String.class)));
        rel.setRightJoinColumn(r.get(DSL.field("right_join_column", String.class)));
        return rel;
    }

    private boolean toBoolean(Object val) {
        if (val == null) return false;
        if (val instanceof Boolean b) return b;
        if (val instanceof Number n) return n.intValue() == 1;
        return "1".equals(val.toString()) || "true".equalsIgnoreCase(val.toString());
    }
}
