package com.lowcode.meta.domain;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * 表元数据 — 定义模块中每张表的配置
 */
@Data
public class TableMeta {

    private Long id;
    /** 实际数据库表名 */
    private String tableName;
    /** 展示名 */
    private String displayName;
    /** 主键列名 */
    private String primaryColumn;

    // --- 以下为引擎拓扑装配后动态注入的业务关联属性 ---
    /**
     * 查询类型：
     * MAIN   — 主表（详情查询的根）
     * LIST   — 列表查询（分页）
     * SUB    — 从表（跟随主表保存）
     * JOIN   — JOIN 关联表（详情查询时 JOIN）
     * RELATION — 多对多关联右表
     */
    private String queryType;
    /** JOIN 类型（LEFT, INNER, RIGHT） */
    private String joinType;
    /** JOIN 条件表达式，如 "customer_profiles.name = orders.customer" */
    private String joinOn;
    /** 从表关联主表的外键列名 */
    private String foreignKey;
    /** 对应的主表关联字段列名，默认为 id */
    private String parentKey;

    /** 该表的字段白名单 */
    private List<FieldMeta> fields = new ArrayList<>();

    /**
     * 根据字段名查找字段配置
     */
    public FieldMeta getFieldByName(String name) {
        return fields.stream()
            .filter(f -> f.getColumnName().equals(name))
            .findFirst()
            .orElse(null);
    }
}
