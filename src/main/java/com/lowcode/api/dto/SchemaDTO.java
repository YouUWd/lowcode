package com.lowcode.api.dto;

import lombok.Data;
import java.util.List;

@Data
public class SchemaDTO {
    private List<DatasourceDTO> datasources;
    private List<RelationDTO> relations;

    @Data
    public static class DatasourceDTO {
        private Long id;
        private String name;
        private String dbType;
        private List<TableDTO> tables;
    }

    @Data
    public static class TableDTO {
        private Long id;
        private String tableName;
        private String displayName;
        private String primaryColumn;
        private List<FieldDTO> fields;
    }

    @Data
    public static class FieldDTO {
        private Long id;
        private String columnName;
        private String label;
        private String dataType;
    }

    @Data
    public static class RelationDTO {
        private Long id;
        private String name;
        private Long sourceFieldId;
        private String sourceTable;
        private String sourceColumn;
        private Long targetFieldId;
        private String targetTable;
        private String targetColumn;
        private String relationType;
    }
}
