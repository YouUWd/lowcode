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
import java.util.ArrayList;
import java.util.Objects;

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
                .orderBy(DSL.field("id").asc())
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

    @org.springframework.transaction.annotation.Transactional
    public void saveModuleMeta(ModuleMeta meta) {
        // 1. 保存/更新 module_meta
        boolean exists = dsl.fetchExists(
            dsl.selectFrom(DSL.table("module_meta")).where(DSL.field("id").eq(meta.getId()))
        );
        if (exists) {
            dsl.update(DSL.table("module_meta"))
                .set(DSL.field("name"), meta.getName())
                .set(DSL.field("description"), meta.getDescription())
                .where(DSL.field("id").eq(meta.getId()))
                .execute();
        } else {
            dsl.insertInto(DSL.table("module_meta"))
                .columns(DSL.field("id"), DSL.field("name"), DSL.field("description"))
                .values(meta.getId(), meta.getName(), meta.getDescription())
                .execute();
        }

        // 收集本次传入的所有 TableMeta
        List<TableMeta> incomingTables = new ArrayList<>();
        if (meta.getMainTable() != null) {
            meta.getMainTable().setQueryType("MAIN");
            incomingTables.add(meta.getMainTable());
        }
        for (TableMeta t : meta.getSubTables()) {
            t.setQueryType("SUB");
            incomingTables.add(t);
        }
        for (TableMeta t : meta.getListTables()) {
            if (meta.getMainTable() != null && t.getTableName().equals(meta.getMainTable().getTableName())) {
                continue;
            }
            t.setQueryType("LIST");
            incomingTables.add(t);
        }
        for (TableMeta t : meta.getJoinTables()) {
            t.setQueryType("JOIN");
            incomingTables.add(t);
        }
        for (TableMeta t : meta.getRelationTables()) {
            t.setQueryType("RELATION");
            incomingTables.add(t);
        }

        // 2. 获取并删除库中存在但 incoming 里没有的 table_meta 及其 fields
        List<Long> existingTableIds = dsl.select(DSL.field("id", Long.class))
            .from(DSL.table("table_meta"))
            .where(DSL.field("module_id").eq(meta.getId()))
            .fetchInto(Long.class);

        List<Long> incomingTableIds = incomingTables.stream()
            .map(TableMeta::getId)
            .filter(Objects::nonNull)
            .toList();

        List<Long> tableIdsToDelete = existingTableIds.stream()
            .filter(id -> !incomingTableIds.contains(id))
            .toList();

        if (!tableIdsToDelete.isEmpty()) {
            // 删除这些表下的字段
            dsl.deleteFrom(DSL.table("field_meta"))
                .where(DSL.field("table_meta_id").in(tableIdsToDelete))
                .execute();
            // 删除这些表
            dsl.deleteFrom(DSL.table("table_meta"))
                .where(DSL.field("id").in(tableIdsToDelete))
                .execute();
        }

        // 3. 循环保存/更新 table_meta 和 field_meta
        int tableOrder = 0;
        for (TableMeta t : incomingTables) {
            Long tableId = t.getId();
            boolean tExists = tableId != null && dsl.fetchExists(
                dsl.selectFrom(DSL.table("table_meta")).where(DSL.field("id").eq(tableId))
            );

            if (tExists) {
                dsl.update(DSL.table("table_meta"))
                    .set(DSL.field("table_name"), t.getTableName())
                    .set(DSL.field("query_type"), t.getQueryType())
                    .set(DSL.field("join_type"), t.getJoinType())
                    .set(DSL.field("join_on"), t.getJoinOn())
                    .set(DSL.field("foreign_key"), t.getForeignKey())
                    .set(DSL.field("sort_order"), tableOrder++)
                    .where(DSL.field("id").eq(tableId))
                    .execute();
            } else {
                Record record = dsl.insertInto(DSL.table("table_meta"))
                    .columns(
                        DSL.field("module_id"), DSL.field("table_name"), DSL.field("query_type"),
                        DSL.field("join_type"), DSL.field("join_on"), DSL.field("foreign_key"),
                        DSL.field("sort_order")
                    )
                    .values(meta.getId(), t.getTableName(), t.getQueryType(), t.getJoinType(), t.getJoinOn(), t.getForeignKey(), tableOrder++)
                    .returning(DSL.field("id"))
                    .fetchOne();
                if (record != null) {
                    tableId = record.get(DSL.field("id", Long.class));
                    t.setId(tableId);
                }
            }

            // 处理该表下的字段 fields
            List<FieldMeta> incomingFields = t.getFields();
            List<Long> existingFieldIds = dsl.select(DSL.field("id", Long.class))
                .from(DSL.table("field_meta"))
                .where(DSL.field("table_meta_id").eq(tableId))
                .fetchInto(Long.class);

            List<Long> incomingFieldIds = incomingFields.stream()
                .map(FieldMeta::getId)
                .filter(Objects::nonNull)
                .toList();

            List<Long> fieldIdsToDelete = existingFieldIds.stream()
                .filter(id -> !incomingFieldIds.contains(id))
                .toList();

            if (!fieldIdsToDelete.isEmpty()) {
                dsl.deleteFrom(DSL.table("field_meta"))
                    .where(DSL.field("id").in(fieldIdsToDelete))
                    .execute();
                // 同时也删除对应的权限记录，防止脏数据
                dsl.deleteFrom(DSL.table("field_permission"))
                    .where(DSL.field("field_meta_id").in(fieldIdsToDelete))
                    .execute();
            }

            int fieldOrder = 0;
            for (FieldMeta f : incomingFields) {
                Long fieldId = f.getId();
                boolean fExists = fieldId != null && dsl.fetchExists(
                    dsl.selectFrom(DSL.table("field_meta")).where(DSL.field("id").eq(fieldId))
                );

                if (fExists) {
                    dsl.update(DSL.table("field_meta"))
                        .set(DSL.field("column_name"), f.getColumnName())
                        .set(DSL.field("label"), f.getLabel())
                        .set(DSL.field("data_type"), f.getDataType())
                        .set(DSL.field("query_op"), f.getQueryOp())
                        .where(DSL.field("id").eq(fieldId))
                        .execute();
                } else {
                    dsl.insertInto(DSL.table("field_meta"))
                        .columns(
                            DSL.field("table_meta_id"), DSL.field("column_name"), DSL.field("label"),
                            DSL.field("data_type"), DSL.field("query_op")
                        )
                        .values(
                            tableId, f.getColumnName(), f.getLabel(), f.getDataType(),
                            f.getQueryOp()
                        )
                        .execute();
                }
            }
        }

        // 4. 处理 relations
        List<RelationMeta> incomingRelations = meta.getRelations();
        List<Long> existingRelationIds = dsl.select(DSL.field("id", Long.class))
            .from(DSL.table("relation_meta"))
            .where(DSL.field("module_id").eq(meta.getId()))
            .fetchInto(Long.class);

        List<Long> incomingRelationIds = incomingRelations.stream()
            .map(RelationMeta::getId)
            .filter(Objects::nonNull)
            .toList();

        List<Long> relationIdsToDelete = existingRelationIds.stream()
            .filter(id -> !incomingRelationIds.contains(id))
            .toList();

        if (!relationIdsToDelete.isEmpty()) {
            dsl.deleteFrom(DSL.table("relation_meta"))
                .where(DSL.field("id").in(relationIdsToDelete))
                .execute();
        }

        for (RelationMeta rel : incomingRelations) {
            Long relId = rel.getId();
            boolean rExists = relId != null && dsl.fetchExists(
                dsl.selectFrom(DSL.table("relation_meta")).where(DSL.field("id").eq(relId))
            );

            if (rExists) {
                dsl.update(DSL.table("relation_meta"))
                    .set(DSL.field("name"), rel.getName())
                    .set(DSL.field("left_table"), rel.getLeftTable())
                    .set(DSL.field("right_table"), rel.getRightTable())
                    .set(DSL.field("junction_table"), rel.getJunctionTable())
                    .set(DSL.field("left_fk"), rel.getLeftFk())
                    .set(DSL.field("right_fk"), rel.getRightFk())
                    .set(DSL.field("left_join_column"), rel.getLeftJoinColumn())
                    .set(DSL.field("right_join_column"), rel.getRightJoinColumn())
                    .where(DSL.field("id").eq(relId))
                    .execute();
            } else {
                dsl.insertInto(DSL.table("relation_meta"))
                    .columns(
                        DSL.field("module_id"), DSL.field("name"), DSL.field("left_table"),
                        DSL.field("right_table"), DSL.field("junction_table"), DSL.field("left_fk"),
                        DSL.field("right_fk"), DSL.field("left_join_column"), DSL.field("right_join_column")
                    )
                    .values(
                        meta.getId(), rel.getName(), rel.getLeftTable(), rel.getRightTable(),
                        rel.getJunctionTable(), rel.getLeftFk(), rel.getRightFk(),
                        rel.getLeftJoinColumn(), rel.getRightJoinColumn()
                    )
                    .execute();
            }
        }
    }
}
