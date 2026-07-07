package com.lowcode.meta.domain;

import lombok.Data;

/**
 * 关联元数据 — 全局字段级关系定义
 */
@Data
public class RelationMeta {

    private Long id;
    /** 关系名称，如 "order_items" */
    private String name;
    /** 关系表达式左侧字段 ID */
    private Long sourceFieldId;
    /** 关系表达式右侧字段 ID */
    private Long targetFieldId;
    /** 关系类型：>多对一 <一对多 -一对一 */
    private String relationType;

    // --- 以下为引擎拓扑装配后动态注入的业务关联属性 ---
    /** 左表（主表）表名 */
    private String leftTable;
    /** 右表表名 */
    private String rightTable;
    /** 中间表表名 */
    private String junctionTable;
    /** 中间表中指向左表的外键列名 */
    private String leftFk;
    /** 中间表中指向右表的外键列名 */
    private String rightFk;
    /** 左表的被关联列名（通常为 id，但不一定） */
    private String leftJoinColumn;
    /** 右表的被关联列名（通常为 id，但不一定） */
    private String rightJoinColumn;
}
