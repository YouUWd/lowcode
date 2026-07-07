package com.lowcode.meta.repository;

import com.lowcode.api.dto.SchemaDTO;
import com.lowcode.meta.domain.FieldMeta;
import com.lowcode.meta.domain.ModuleMeta;
import com.lowcode.meta.domain.RelationMeta;
import com.lowcode.meta.domain.TableMeta;
import com.lowcode.engine.TopologyHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * 元数据仓库 — 从元数据表加载并组装 ModuleMeta 及全局 Schema 拓扑
 */
@Slf4j
@Repository
@RequiredArgsConstructor
public class MetaRepository {

    private final DSLContext dsl;
    private final TopologyHelper topologyHelper;

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

        // 2. 根据 module_table_ref 加载绑定的全局表元数据
        List<TableMeta> tables = dsl.select(
                DSL.field("t.id").as("id"),
                DSL.field("t.table_name").as("table_name"),
                DSL.field("t.display_name").as("display_name"),
                DSL.field("t.primary_column").as("primary_column")
            )
            .from(DSL.table("module_table_ref").as("ref"))
            .join(DSL.table("table_meta").as("t")).on(DSL.field("ref.table_meta_id").eq(DSL.field("t.id")))
            .where(DSL.field("ref.module_id").eq(moduleId))
            .orderBy(DSL.field("ref.sort_order").asc())
            .fetch(r -> {
                TableMeta t = new TableMeta();
                t.setId(r.get("id", Long.class));
                t.setTableName(r.get("table_name", String.class));
                t.setDisplayName(r.get("display_name", String.class));
                t.setPrimaryColumn(r.get("primary_column", String.class));
                return t;
            });
        
        meta.setTables(tables);

        // 3. 为每张表加载全局字段配置
        List<Long> fieldIds = new ArrayList<>();
        for (TableMeta table : tables) {
            List<FieldMeta> fields = dsl.select(
                    DSL.field("id", Long.class),
                    DSL.field("table_meta_id", Long.class),
                    DSL.field("column_name", String.class),
                    DSL.field("label", String.class),
                    DSL.field("data_type", String.class)
                )
                .from(DSL.table("field_meta"))
                .where(DSL.field("table_meta_id").eq(table.getId()))
                .orderBy(DSL.field("id").asc())
                .fetch(r -> {
                    FieldMeta f = new FieldMeta();
                    f.setId(r.get("id", Long.class));
                    f.setTableMetaId(r.get("table_meta_id", Long.class));
                    f.setColumnName(r.get("column_name", String.class));
                    f.setLabel(r.get("label", String.class));
                    f.setDataType(r.get("data_type", String.class));
                    return f;
                });
            table.setFields(fields);
            for (FieldMeta f : fields) {
                fieldIds.add(f.getId());
            }
        }

        // 4. 查询该模块字段所关联的所有全局关系
        List<RelationMeta> relations = new ArrayList<>();
        if (!fieldIds.isEmpty()) {
            relations = dsl.select(
                    DSL.field("id", Long.class),
                    DSL.field("name", String.class),
                    DSL.field("source_field_id", Long.class),
                    DSL.field("target_field_id", Long.class),
                    DSL.field("relation_type", String.class)
                )
                .from(DSL.table("relation_meta"))
                .where(DSL.field("source_field_id").in(fieldIds))
                .and(DSL.field("target_field_id").in(fieldIds))
                .fetch(r -> {
                    RelationMeta rel = new RelationMeta();
                    rel.setId(r.get("id", Long.class));
                    rel.setName(r.get("name", String.class));
                    rel.setSourceFieldId(r.get("source_field_id", Long.class));
                    rel.setTargetFieldId(r.get("target_field_id", Long.class));
                    rel.setRelationType(r.get("relation_type", String.class));
                    return rel;
                });
        }
        meta.setRelations(relations);

        // 5. 调用拓扑装配引擎动态推导主从表、JOIN表等架构
        topologyHelper.inferAndAssemble(meta);

        log.info("加载并装配模块元数据: {} ({}), 表数={}, 关联数={}",
            meta.getName(), meta.getId(), tables.size(), relations.size());

        return meta;
    }

    @Transactional(rollbackFor = Exception.class)
    public void saveModuleMeta(ModuleMeta meta) {
        // 保存/更新 module_meta 基本信息
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
    }

    /**
     * 获取全局元数据拓扑 Schema
     */
    public SchemaDTO loadGlobalSchema() {
        SchemaDTO schema = new SchemaDTO();

        // 1. 加载所有数据源
        List<SchemaDTO.DatasourceDTO> datasources = dsl.select(
                DSL.field("id", Long.class),
                DSL.field("name", String.class),
                DSL.field("db_type", String.class)
            )
            .from(DSL.table("datasource_meta"))
            .fetch(r -> {
                SchemaDTO.DatasourceDTO ds = new SchemaDTO.DatasourceDTO();
                ds.setId(r.get("id", Long.class));
                ds.setName(r.get("name", String.class));
                ds.setDbType(r.get("db_type", String.class));
                ds.setTables(new ArrayList<>());
                return ds;
            });
        schema.setDatasources(datasources);

        // 2. 加载物理表，并按数据源分组
        Map<Long, SchemaDTO.DatasourceDTO> dsMap = new HashMap<>();
        for (var ds : datasources) {
            dsMap.put(ds.getId(), ds);
        }

        List<SchemaDTO.TableDTO> tables = dsl.select(
                DSL.field("id", Long.class),
                DSL.field("datasource_id", Long.class),
                DSL.field("table_name", String.class),
                DSL.field("display_name", String.class),
                DSL.field("primary_column", String.class)
            )
            .from(DSL.table("table_meta"))
            .fetch(r -> {
                SchemaDTO.TableDTO t = new SchemaDTO.TableDTO();
                t.setId(r.get("id", Long.class));
                t.setTableName(r.get("table_name", String.class));
                t.setDisplayName(r.get("display_name", String.class));
                t.setPrimaryColumn(r.get("primary_column", String.class));
                t.setFields(new ArrayList<>());

                Long dsId = r.get("datasource_id", Long.class);
                if (dsMap.containsKey(dsId)) {
                    dsMap.get(dsId).getTables().add(t);
                }
                return t;
            });

        // 3. 加载所有字段，并按表分组
        Map<Long, SchemaDTO.TableDTO> tableMap = new HashMap<>();
        for (var t : tables) {
            tableMap.put(t.getId(), t);
        }

        dsl.select(
                DSL.field("id", Long.class),
                DSL.field("table_meta_id", Long.class),
                DSL.field("column_name", String.class),
                DSL.field("label", String.class),
                DSL.field("data_type", String.class)
            )
            .from(DSL.table("field_meta"))
            .fetch(r -> {
                SchemaDTO.FieldDTO f = new SchemaDTO.FieldDTO();
                f.setId(r.get("id", Long.class));
                f.setColumnName(r.get("column_name", String.class));
                f.setLabel(r.get("label", String.class));
                f.setDataType(r.get("data_type", String.class));

                Long tId = r.get("table_meta_id", Long.class);
                if (tableMap.containsKey(tId)) {
                    tableMap.get(tId).getFields().add(f);
                }
                return f;
            });

        // 4. 加载所有全局字段级连线，并补充表名和列名
        List<SchemaDTO.RelationDTO> relations = dsl.select(
                DSL.field("r.id").as("id"),
                DSL.field("r.name").as("name"),
                DSL.field("r.source_field_id").as("source_field_id"),
                DSL.field("ts.table_name").as("source_table"),
                DSL.field("fs.column_name").as("source_column"),
                DSL.field("r.target_field_id").as("target_field_id"),
                DSL.field("tt.table_name").as("target_table"),
                DSL.field("ft.column_name").as("target_column"),
                DSL.field("r.relation_type").as("relation_type")
            )
            .from(DSL.table("relation_meta").as("r"))
            .join(DSL.table("field_meta").as("fs")).on(DSL.field("r.source_field_id").eq(DSL.field("fs.id")))
            .join(DSL.table("table_meta").as("ts")).on(DSL.field("fs.table_meta_id").eq(DSL.field("ts.id")))
            .join(DSL.table("field_meta").as("ft")).on(DSL.field("r.target_field_id").eq(DSL.field("ft.id")))
            .join(DSL.table("table_meta").as("tt")).on(DSL.field("ft.table_meta_id").eq(DSL.field("tt.id")))
            .fetch(r -> {
                SchemaDTO.RelationDTO rel = new SchemaDTO.RelationDTO();
                rel.setId(r.get("id", Long.class));
                rel.setName(r.get("name", String.class));
                rel.setSourceFieldId(r.get("source_field_id", Long.class));
                rel.setSourceTable(r.get("source_table", String.class));
                rel.setSourceColumn(r.get("source_column", String.class));
                rel.setTargetFieldId(r.get("target_field_id", Long.class));
                rel.setTargetTable(r.get("target_table", String.class));
                rel.setTargetColumn(r.get("target_column", String.class));
                rel.setRelationType(r.get("relation_type", String.class));
                return rel;
            });
        schema.setRelations(relations);

        return schema;
    }

    /**
     * 声明式保存/更新全局元数据拓扑 Schema (事务保护)
     */
    @Transactional(rollbackFor = Exception.class)
    public void saveGlobalSchema(SchemaDTO schema) {
        if (schema == null) return;

        // 1. 保存/更新数据源及下属物理表与字段
        if (schema.getDatasources() != null) {
            for (var ds : schema.getDatasources()) {
                // 保存数据源基本信息
                boolean dsExists = dsl.fetchExists(
                    dsl.selectFrom(DSL.table("datasource_meta")).where(DSL.field("id").eq(ds.getId()))
                );
                if (!dsExists && ds.getId() != null) {
                    dsl.insertInto(DSL.table("datasource_meta"))
                        .columns(DSL.field("id"), DSL.field("name"), DSL.field("db_type"), DSL.field("host"), DSL.field("port"), DSL.field("schema_name"), DSL.field("username"), DSL.field("password_enc"))
                        .values(ds.getId(), ds.getName(), ds.getDbType() != null ? ds.getDbType() : "MYSQL", "localhost", 3306, "low_code", "sa", "")
                        .execute();
                }

                if (ds.getTables() != null) {
                    for (var t : ds.getTables()) {
                        Long tableId = t.getId();
                        if (tableId == null) {
                            // 查重
                            Record tr = dsl.select(DSL.field("id"))
                                .from(DSL.table("table_meta"))
                                .where(DSL.field("datasource_id").eq(ds.getId())
                                    .and(DSL.field("table_name").eq(t.getTableName())))
                                .fetchOne();
                            if (tr != null) {
                                tableId = tr.get(DSL.field("id", Long.class));
                            }
                        }

                        if (tableId != null) {
                            dsl.update(DSL.table("table_meta"))
                                .set(DSL.field("display_name"), t.getDisplayName())
                                .set(DSL.field("primary_column"), t.getPrimaryColumn())
                                .where(DSL.field("id").eq(tableId))
                                .execute();
                        } else {
                            // 插入新表
                            Record insertRec = dsl.insertInto(DSL.table("table_meta"))
                                .columns(DSL.field("datasource_id"), DSL.field("table_name"), DSL.field("display_name"), DSL.field("primary_column"))
                                .values(ds.getId(), t.getTableName(), t.getDisplayName(), t.getPrimaryColumn() != null ? t.getPrimaryColumn() : "id")
                                .returning(DSL.field("id"))
                                .fetchOne();
                            tableId = insertRec != null ? insertRec.get(DSL.field("id", Long.class)) : null;
                        }
                        t.setId(tableId);

                        // 遍历物理字段
                        if (t.getFields() != null && tableId != null) {
                            for (var f : t.getFields()) {
                                Long fieldId = f.getId();
                                if (fieldId == null) {
                                    Record fr = dsl.select(DSL.field("id"))
                                        .from(DSL.table("field_meta"))
                                        .where(DSL.field("table_meta_id").eq(t.getId())
                                            .and(DSL.field("column_name").eq(f.getColumnName())))
                                        .fetchOne();
                                    if (fr != null) {
                                        fieldId = fr.get(DSL.field("id", Long.class));
                                    }
                                }

                                if (fieldId != null) {
                                    dsl.update(DSL.table("field_meta"))
                                        .set(DSL.field("label"), f.getLabel())
                                        .set(DSL.field("data_type"), f.getDataType())
                                        .where(DSL.field("id").eq(fieldId))
                                        .execute();
                                } else {
                                    Record insertField = dsl.insertInto(DSL.table("field_meta"))
                                        .columns(DSL.field("table_meta_id"), DSL.field("column_name"), DSL.field("label"), DSL.field("data_type"))
                                        .values(t.getId(), f.getColumnName(), f.getLabel(), f.getDataType() != null ? f.getDataType() : "STRING")
                                        .returning(DSL.field("id"))
                                        .fetchOne();
                                    fieldId = insertField != null ? insertField.get(DSL.field("id", Long.class)) : null;
                                }
                                f.setId(fieldId);
                            }
                        }
                    }
                }
            }
        }

        // 2. 差异同步物理连线关系
        if (schema.getRelations() != null) {
            // 获取数据库中现有的连线关系
            List<Long> existingIds = dsl.select(DSL.field("id", Long.class))
                .from(DSL.table("relation_meta"))
                .fetchInto(Long.class);

            Set<Long> keepIds = new HashSet<>();
            for (var rel : schema.getRelations()) {
                // 如果前端连线因为物理表/字段刚刚新建，导致其 sourceFieldId/targetFieldId 为空，
                // 我们通过表名与列名动态检索它们最新的真实全局字段 ID。
                if (rel.getSourceFieldId() == null && rel.getSourceTable() != null && rel.getSourceColumn() != null) {
                    Record fr = dsl.select(DSL.field("f.id"))
                        .from(DSL.table("field_meta").as("f"))
                        .join(DSL.table("table_meta").as("t")).on(DSL.field("f.table_meta_id").eq(DSL.field("t.id")))
                        .where(DSL.field("t.table_name").eq(rel.getSourceTable())
                            .and(DSL.field("f.column_name").eq(rel.getSourceColumn())))
                        .fetchOne();
                    if (fr != null) rel.setSourceFieldId(fr.get(DSL.field("id", Long.class)));
                }

                if (rel.getTargetFieldId() == null && rel.getTargetTable() != null && rel.getTargetColumn() != null) {
                    Record fr = dsl.select(DSL.field("f.id"))
                        .from(DSL.table("field_meta").as("f"))
                        .join(DSL.table("table_meta").as("t")).on(DSL.field("f.table_meta_id").eq(DSL.field("t.id")))
                        .where(DSL.field("t.table_name").eq(rel.getTargetTable())
                            .and(DSL.field("f.column_name").eq(rel.getTargetColumn())))
                        .fetchOne();
                    if (fr != null) rel.setTargetFieldId(fr.get(DSL.field("id", Long.class)));
                }

                if (rel.getSourceFieldId() == null || rel.getTargetFieldId() == null) {
                    log.warn("跳过不完整的连线保存: {}", rel.getName());
                    continue;
                }

                boolean relExists = false;
                if (rel.getId() != null && existingIds.contains(rel.getId())) {
                    relExists = true;
                    keepIds.add(rel.getId());
                } else {
                    // 通过字段对查重
                    Record rr = dsl.select(DSL.field("id"))
                        .from(DSL.table("relation_meta"))
                        .where(DSL.field("source_field_id").eq(rel.getSourceFieldId())
                            .and(DSL.field("target_field_id").eq(rel.getTargetFieldId())))
                        .fetchOne();
                    if (rr != null) {
                        relExists = true;
                        rel.setId(rr.get(DSL.field("id", Long.class)));
                        keepIds.add(rel.getId());
                    }
                }

                if (relExists) {
                    dsl.update(DSL.table("relation_meta"))
                        .set(DSL.field("name"), rel.getName())
                        .set(DSL.field("relation_type"), rel.getRelationType())
                        .where(DSL.field("id").eq(rel.getId()))
                        .execute();
                } else {
                    Record insertRel = dsl.insertInto(DSL.table("relation_meta"))
                        .columns(DSL.field("name"), DSL.field("source_field_id"), DSL.field("target_field_id"), DSL.field("relation_type"))
                        .values(rel.getName(), rel.getSourceFieldId(), rel.getTargetFieldId(), rel.getRelationType() != null ? rel.getRelationType() : "<")
                        .returning(DSL.field("id"))
                        .fetchOne();
                    if (insertRel != null) {
                        Long newId = insertRel.get(DSL.field("id", Long.class));
                        rel.setId(newId);
                        keepIds.add(newId);
                    }
                }
            }

            // 物理删除所有已在画布中被去掉的连线
            for (Long exId : existingIds) {
                if (!keepIds.contains(exId)) {
                    dsl.deleteFrom(DSL.table("relation_meta"))
                        .where(DSL.field("id").eq(exId))
                        .execute();
                }
            }
        }
    }
}
