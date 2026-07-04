package com.lowcode.meta.domain;

import lombok.Data;

/**
 * 字段元数据 — 定义表中每个可操作字段的白名单配置
 */
@Data
public class FieldMeta {

    private Long id;
    /** 实际数据库列名 */
    private String columnName;
    /** 前端显示的标签名称 */
    private String label;
    /** 数据类型（VARCHAR, BIGINT, DECIMAL, DATETIME 等） */
    private String dataType;
    /** 查询操作符（EQ, LIKE, GT, LT, GTE, LTE, IN, BETWEEN） */
    private String queryOp;
}
