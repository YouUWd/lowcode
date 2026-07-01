package com.lowcode.api.dto;

import lombok.Data;

import java.util.List;

/**
 * 模块查询请求
 */
@Data
public class QueryRequest {

    /** 主表记录 ID，传了走详情查询 + 关联查询，不传走列表查询 */
    private Long id;
    /** 当前页（从 1 开始） */
    private int page = 1;
    /** 每页大小 */
    private int size = 20;
    /** 筛选条件 */
    private List<Filter> filters;
    /** 排序规则 */
    private List<SortItem> sorts;
    /** 需要按需拉取的关联数据（及其字段列表）。 */
    private List<With> with;

    @Data
    public static class Filter {
        private String tableName;
        private String field;
        private String op;
        private Object value;
    }

    @Data
    public static class With {
        private String tableName;
        private List<String> fields;
    }

    @Data
    public static class SortItem {
        /** 字段别名 */
        private String field;
        /** 排序方向：ASC / DESC */
        private String dir;
    }
}
