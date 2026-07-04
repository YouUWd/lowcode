package com.lowcode.api.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class FieldPermissionResponse {
    private Long tableMetaId;
    private String tableName;
    private List<FieldPermResponseItem> fields;

    @Data
    @Builder
    public static class FieldPermResponseItem {
        private Long fieldMetaId;
        private String columnName;
        private String label;
        private int perm; // Linux style octal permission: read=4, write=2, update=1 (0-7)
    }
}
