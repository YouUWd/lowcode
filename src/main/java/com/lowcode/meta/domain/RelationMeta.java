package com.lowcode.meta.domain;

import lombok.Data;

/**
 * 关联元数据 — 定义 N:M 多对多关联配置
 */
@Data
public class RelationMeta {

    private Long id;
    /** 关联名称（用于请求/响应中的 key） */
    private String name;
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
