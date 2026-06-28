package com.lowcode.api.dto;

import lombok.Data;

import java.util.Map;

/**
 * 模块整体保存请求
 */
@Data
public class SaveRequest {

    /** 
     * 整体提交的嵌套数据，格式与 Query 接口返回的每行数据一致
     * 例如：{"order": {...}, "orderItem": [{...}], "tags": [{"id": 1}]}
     */
    private Map<String, Object> data;
}
