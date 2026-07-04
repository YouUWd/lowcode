package com.lowcode.api.dto;

import lombok.Data;
import java.util.List;

@Data
public class FieldPermissionBatchRequest {
    private String roleCode;
    private String moduleId;
    private List<TablePermItem> tables;

    @Data
    public static class TablePermItem {
        private Long tableMetaId;
        private List<FieldPermItem> fields;
    }

    @Data
    public static class FieldPermItem {
        private Long fieldMetaId;
        private int perm; // Linux style octal permission: read=4, write=2, update=1 (0-7)
    }
}
