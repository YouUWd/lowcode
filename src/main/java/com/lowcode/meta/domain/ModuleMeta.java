package com.lowcode.meta.domain;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * 模块元数据 — 聚合根，包含模块下所有表和关联的完整配置
 */
@Data
public class ModuleMeta {

    private String id;
    private String name;
    private String description;

    /** 主表（queryType=MAIN） */
    private TableMeta mainTable;
    /** 从表列表（queryType=SUB），保存时跟随主表 upsert */
    private List<TableMeta> subTables = new ArrayList<>();
    /** 列表查询表（queryType=LIST），返回分页数据 */
    private List<TableMeta> listTables = new ArrayList<>();
    /** JOIN 关联表（queryType=JOIN），详情查询时 LEFT/INNER JOIN */
    private List<TableMeta> joinTables = new ArrayList<>();
    /** N:M 多对多关联配置 */
    private List<RelationMeta> relations = new ArrayList<>();
    /** RELATION 关联右表（不在主表查询中 JOIN，仅作元数据解析与权限过滤） */
    private List<TableMeta> relationTables = new ArrayList<>();

    public TableMeta getTableByName(String tableName) {
        if (mainTable != null && tableName.equals(mainTable.getTableName())) {
            return mainTable;
        }
        for (TableMeta t : listTables) {
            if (tableName.equals(t.getTableName())) return t;
        }
        for (TableMeta t : subTables) {
            if (tableName.equals(t.getTableName())) return t;
        }
        for (TableMeta t : joinTables) {
            if (tableName.equals(t.getTableName())) return t;
        }
        for (TableMeta t : relationTables) {
            if (tableName.equals(t.getTableName())) return t;
        }
        return null;
    }
}
