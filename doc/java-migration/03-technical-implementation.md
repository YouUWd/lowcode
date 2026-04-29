# Lumina 动态查询引擎 - 技术实现文档

## 1. 核心类设计

### 1.1 查询引擎核心类

#### QueryEngineService - 查询引擎服务

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class QueryEngineService {

    private final DSLContext configDsl;
    private final DSLContext businessDsl;
    private final PermissionService permissionService;
    private final TransformerService transformerService;
    private final ModuleService moduleService;

    /**
     * 执行动态查询
     */
    public QueryResult executeDynamicQuery(
            String moduleId,
            QueryOptions options) {
        
        log.info("开始执行查询: moduleId={}, options={}", moduleId, options);
        
        long startTime = System.currentTimeMillis();
        
        try {
            // 1. 加载模块配置
            ModuleConfig config = moduleService.loadModuleConfig(moduleId);
            
            // 2. 应用权限过滤
            List<FieldMapping> filteredMappings = 
                permissionService.filterMappingsByPermissions(
                    config.getMappings(), 
                    moduleId
                );
            
            if (filteredMappings.isEmpty()) {
                log.warn("模块 {} 没有可访问的字段", moduleId);
                return QueryResult.empty();
            }
            
            // 3. 分离关系类型
            List<EntityRelation> oneToOneEntities = config.getEntities().stream()
                .filter(e -> "1:1".equals(e.getRelationType()) || 
                           "N:1".equals(e.getRelationType()))
                .collect(Collectors.toList());
            
            List<EntityRelation> oneToManyEntities = config.getEntities().stream()
                .filter(e -> "1:N".equals(e.getRelationType()))
                .collect(Collectors.toList());
            
            // 4. 执行主查询
            List<Map<String, Object>> mainData = 
                executeMainQuery(config, oneToOneEntities, filteredMappings, options);
            
            log.info("主查询完成: 返回 {} 条记录", mainData.size());
            
            // 5. 执行子查询并附加结果
            if (!oneToManyEntities.isEmpty() && !mainData.isEmpty()) {
                attachOneToManyRelations(
                    mainData,
                    oneToManyEntities,
                    config.getPrimaryEntity(),
                    moduleId
                );
            }
            
            long duration = System.currentTimeMillis() - startTime;
            log.info("查询完成: 耗时 {}ms", duration);
            
            return QueryResult.success(mainData, duration);
            
        } catch (Exception e) {
            log.error("查询失败: moduleId={}, error={}", moduleId, e.getMessage(), e);
            throw new QueryException("查询失败: " + e.getMessage(), e);
        }
    }

    /**
     * 执行主查询（包含 1:1/N:1 关系）
     */
    private List<Map<String, Object>> executeMainQuery(
            ModuleConfig config,
            List<EntityRelation> oneToOneEntities,
            List<FieldMapping> mappings,
            QueryOptions options) {
        
        String primaryTable = config.getPrimaryEntity().getName();
        Table<?> mainTable = DSL.table(DSL.name(primaryTable));
        
        // 识别使用的表
        Set<String> usedEntities = new HashSet<>();
        usedEntities.add(primaryTable);
        oneToOneEntities.forEach(e -> usedEntities.add(e.getName()));
        
        // 构建 SELECT 字段
        SelectSelectStep<Record> select = buildSelectFields(
            mappings,
            usedEntities
        );
        
        // 构建 FROM + JOIN
        SelectJoinStep<Record> from = select.from(mainTable);
        
        for (EntityRelation entity : oneToOneEntities) {
            JoinCondition jc = entity.getJoinCondition();
            from = from.leftJoin(DSL.table(DSL.name(entity.getName())))
                .on(DSL.field(DSL.name(entity.getName(), jc.getLeft()))
                    .eq(DSL.field(DSL.name(primaryTable, jc.getRight()))));
        }
        
        // 应用分页
        SelectLimitStep<Record> query = from;
        if (options.getPage() != null && options.getPageSize() != null) {
            int offset = (options.getPage() - 1) * options.getPageSize();
            query = from.limit(options.getPageSize()).offset(offset);
        }
        
        // 执行查询
        Result<Record> result = query.fetch();
        
        // 转换为 Map 列表
        List<Map<String, Object>> rows = result.stream()
            .map(Record::intoMap)
            .collect(Collectors.toList());
        
        // 应用前端转换
        return transformerService.applyFrontendTransformers(rows, mappings);
    }

    /**
     * 构建 SELECT 字段列表
     */
    private SelectSelectStep<Record> buildSelectFields(
            List<FieldMapping> mappings,
            Set<String> usedEntities) {
        
        SelectSelectStep<Record> select = DSL.select();
        
        for (FieldMapping mapping : mappings) {
            // 检查字段是否属于使用的实体
            boolean belongsToUsedEntity = mapping.getPhysicalFields().stream()
                .allMatch(pf -> usedEntities.contains(pf.getEntity()));
            
            if (!belongsToUsedEntity) {
                continue;
            }
            
            if ("database".equals(mapping.getTransformerEnv()) && 
                mapping.getTransformer() != null) {
                // 数据库转换
                Field<?> field = transformerService.parseDatabaseTransformer(mapping);
                select.select(field.as(mapping.getLogicalField()));
            } else {
                // 简单映射和前端转换：选择物理字段
                for (PhysicalField pf : mapping.getPhysicalFields()) {
                    String fieldAlias = pf.getEntity() + "_" + pf.getName();
                    select.select(
                        DSL.field(DSL.name(pf.getEntity(), pf.getName()))
                            .as(fieldAlias)
                    );
                }
            }
        }
        
        return select;
    }

    /**
     * 附加 1:N 关系数据
     */
    private void attachOneToManyRelations(
            List<Map<String, Object>> mainData,
            List<EntityRelation> entities,
            PrimaryEntity primaryEntity,
            String moduleId) {
        
        for (EntityRelation entity : entities) {
            log.info("查询 1:N 关系: {}", entity.getName());
            
            // 获取父记录 ID
            List<Long> parentIds = mainData.stream()
                .map(row -> ((Number) row.get("id")).longValue())
                .collect(Collectors.toList());
            
            if (parentIds.isEmpty()) {
                continue;
            }
            
            // 查询子记录
            List<Map<String, Object>> childRecords = 
                queryChildRecords(entity, parentIds, moduleId, primaryEntity.getName());
            
            // 附加到主记录
            mainData.forEach(row -> {
                Long parentId = ((Number) row.get("id")).longValue();
                
                List<Map<String, Object>> children = childRecords.stream()
                    .filter(child -> {
                        Long childParentId = ((Number) child.get(
                            entity.getJoinCondition().getLeft()
                        )).longValue();
                        return childParentId.equals(parentId);
                    })
                    .map(child -> {
                        Map<String, Object> cleaned = new HashMap<>(child);
                        cleaned.remove(entity.getJoinCondition().getLeft());
                        return cleaned;
                    })
                    .collect(Collectors.toList());
                
                if (!children.isEmpty()) {
                    row.put(entity.getName() + "s", children);
                }
            });
        }
    }

    /**
     * 查询子记录
     */
    private List<Map<String, Object>> queryChildRecords(
            EntityRelation entity,
            List<Long> parentIds,
            String moduleId,
            String primaryEntityName) {
        
        // 获取子表字段映射
        List<FieldMapping> childMappings = 
            getChildMappings(entity, moduleId, primaryEntityName);
        
        if (childMappings.isEmpty()) {
            log.warn("子表 {} 没有可访问的字段", entity.getName());
            return Collections.emptyList();
        }
        
        // 构建子查询
        SelectSelectStep<Record> select = DSL.select();
        
        for (FieldMapping mapping : childMappings) {
            if ("database".equals(mapping.getTransformerEnv()) && 
                mapping.getTransformer() != null) {
                Field<?> field = transformerService.parseDatabaseTransformer(mapping);
                select.select(field.as(mapping.getLogicalField()));
            } else {
                for (PhysicalField pf : mapping.getPhysicalFields()) {
                    String fieldAlias = pf.getEntity() + "_" + pf.getName();
                    select.select(
                        DSL.field(DSL.name(pf.getEntity(), pf.getName()))
                            .as(fieldAlias)
                    );
                }
            }
        }
        
        // 添加关联键
        select.select(
            DSL.field(DSL.name(entity.getName(), 
                entity.getJoinCondition().getLeft()))
        );
        
        // 执行查询
        Result<Record> result = select
            .from(DSL.table(DSL.name(entity.getName())))
            .where(DSL.field(DSL.name(entity.getName(), 
                entity.getJoinCondition().getLeft()))
                .in(parentIds))
            .fetch();
        
        // 转换为 Map 列表
        List<Map<String, Object>> rows = result.stream()
            .map(Record::intoMap)
            .collect(Collectors.toList());
        
        // 应用前端转换
        return transformerService.applyFrontendTransformers(rows, childMappings);
    }

    /**
     * 获取子表字段映射
     */
    private List<FieldMapping> getChildMappings(
            EntityRelation entity,
            String moduleId,
            String primaryEntityName) {
        
        // 1:N 子查询只访问子表本身的字段
        Set<String> accessibleEntities = new HashSet<>();
        accessibleEntities.add(entity.getName());
        
        // 查询字段配置
        List<FieldMapping> mappings = moduleService.getFieldMappings(moduleId);
        
        // 过滤只属于子表的字段
        List<FieldMapping> childMappings = mappings.stream()
            .filter(mapping -> mapping.getPhysicalFields().stream()
                .allMatch(pf -> accessibleEntities.contains(pf.getEntity())))
            .collect(Collectors.toList());
        
        // 应用权限过滤
        return permissionService.filterMappingsByPermissions(
            childMappings,
            moduleId
        );
    }
}
```

### 1.2 权限服务

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionService {

    private final DSLContext configDsl;
    private final RedisTemplate<String, Object> redisTemplate;

    /**
     * 获取模块权限
     */
    public Set<String> getModulePermissions(String moduleId) {
        String cacheKey = "permission:module:" + moduleId;
        
        // 尝试从缓存获取
        @SuppressWarnings("unchecked")
        Set<String> cached = (Set<String>) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }
        
        // 从数据库查询
        Set<String> permissions = configDsl
            .select(DSL.field("permission_node"))
            .from(DSL.table("sys_permission_config"))
            .where(DSL.field("module_id").eq(moduleId)
                .and(DSL.field("enabled").eq(true)))
            .fetch()
            .stream()
            .map(r -> r.get("permission_node", String.class))
            .collect(Collectors.toSet());
        
        // 缓存结果（1小时过期）
        redisTemplate.opsForValue().set(cacheKey, permissions, 
            Duration.ofHours(1));
        
        return permissions;
    }

    /**
     * 过滤字段映射（移除无权限字段）
     */
    public List<FieldMapping> filterMappingsByPermissions(
            List<FieldMapping> mappings,
            String moduleId) {
        
        Set<String> permissions = getModulePermissions(moduleId);
        
        if (permissions.isEmpty()) {
            log.warn("模块 {} 没有权限配置", moduleId);
            return Collections.emptyList();
        }
        
        return mappings.stream()
            .filter(mapping -> {
                // 检查所有物理字段是否有 READ 权限
                boolean hasPermission = mapping.getPhysicalFields().stream()
                    .allMatch(pf -> {
                        String permissionNode = pf.getEntity() + "." + 
                                              pf.getName() + ".READ";
                        return permissions.contains(permissionNode);
                    });
                
                if (!hasPermission) {
                    log.debug("字段 {} 无权限", mapping.getLogicalField());
                }
                
                return hasPermission;
            })
            .collect(Collectors.toList());
    }

    /**
     * 检查字段权限
     */
    public boolean hasFieldPermission(
            String entity,
            String field,
            String operation,
            String moduleId) {
        
        Set<String> permissions = getModulePermissions(moduleId);
        String permissionNode = entity + "." + field + "." + operation;
        return permissions.contains(permissionNode);
    }
}
```

### 1.3 转换器服务

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class TransformerService {

    private final DictCacheService dictCacheService;

    /**
     * 应用前端转换
     */
    public List<Map<String, Object>> applyFrontendTransformers(
            List<Map<String, Object>> records,
            List<FieldMapping> mappings) {
        
        List<FieldMapping> bffMappings = mappings.stream()
            .filter(m -> "frontend".equals(m.getTransformerEnv()))
            .collect(Collectors.toList());
        
        if (bffMappings.isEmpty()) {
            return records;
        }
        
        return records.stream()
            .map(row -> applyTransformersToRow(row, bffMappings))
            .collect(Collectors.toList());
    }

    /**
     * 对单行应用转换
     */
    private Map<String, Object> applyTransformersToRow(
            Map<String, Object> row,
            List<FieldMapping> bffMappings) {
        
        Map<String, Object> result = new LinkedHashMap<>(row);
        
        for (FieldMapping mapping : bffMappings) {
            try {
                Object transformed = evaluateTransformer(
                    mapping.getTransformer(),
                    row,
                    mapping.getPhysicalFields()
                );
                result.put(mapping.getLogicalField(), transformed);
            } catch (Exception e) {
                log.error("转换失败: {}", mapping.getLogicalField(), e);
                result.put(mapping.getLogicalField(), null);
            }
        }
        
        return result;
    }

    /**
     * 解析数据库转换表达式
     */
    public Field<?> parseDatabaseTransformer(FieldMapping mapping) {
        String expr = mapping.getTransformer();
        
        // 将 ${field} 替换为表.字段
        for (PhysicalField pf : mapping.getPhysicalFields()) {
            expr = expr.replace(
                "${" + pf.getName() + "}",
                pf.getEntity() + "." + pf.getName()
            );
        }
        
        // MySQL 到 SQLite 转换
        expr = convertMySqlToSqlite(expr);
        
        return DSL.field(DSL.sql(expr));
    }

    /**
     * 执行转换表达式
     */
    private Object evaluateTransformer(
            String transformer,
            Map<String, Object> row,
            List<PhysicalField> physicalFields) {
        
        String expression = transformer;
        
        // 替换占位符
        for (PhysicalField pf : physicalFields) {
            String fieldAlias = pf.getEntity() + "_" + pf.getName();
            Object value = row.get(fieldAlias);
            
            if (value == null) {
                value = row.get(pf.getName());
            }
            
            if (value == null) {
                value = "";
            }
            
            String escapedValue = value instanceof String ? 
                "'" + value + "'" : String.valueOf(value);
            
            expression = expression.replace(
                "${" + pf.getName() + "}",
                escapedValue
            );
        }
        
        // 路由到相应的转换函数
        if (expression.contains("DICT_MAP")) {
            return evalDictMap(expression);
        } else if (expression.contains("CONCAT")) {
            return evalConcat(expression);
        } else if (expression.contains("MASK_SENSITIVE")) {
            return evalMaskSensitive(expression);
        }
        
        return expression;
    }

    /**
     * 字典映射转换
     */
    private String evalDictMap(String expression) {
        Pattern pattern = Pattern.compile(
            "DICT_MAP\\([\"']([^\"']+)[\"'],\\s*[\"']?([^\"',)]*)[\"']?\\)"
        );
        Matcher matcher = pattern.matcher(expression);
        
        if (matcher.find()) {
            String dictCode = matcher.group(1);
            String value = matcher.group(2);
            return dictCacheService.translate(dictCode, value);
        }
        
        return expression;
    }

    /**
     * 字符串拼接转换
     */
    private String evalConcat(String expression) {
        Pattern pattern = Pattern.compile("CONCAT\\((.*)\\)");
        Matcher matcher = pattern.matcher(expression);
        
        if (matcher.find()) {
            String argsStr = matcher.group(1);
            List<String> args = parseConcatArgs(argsStr);
            return String.join("", args);
        }
        
        return expression;
    }

    /**
     * 敏感数据脱敏转换
     */
    private String evalMaskSensitive(String expression) {
        Pattern pattern = Pattern.compile(
            "MASK_SENSITIVE\\('([^']+)',\\s*'([^']+)'\\)"
        );
        Matcher matcher = pattern.matcher(expression);
        
        if (matcher.find()) {
            String value = matcher.group(1);
            if (value.length() >= 7) {
                return value.substring(0, 3) + "****" + 
                       value.substring(value.length() - 4);
            }
        }
        
        return expression;
    }

    /**
     * 解析 CONCAT 参数
     */
    private List<String> parseConcatArgs(String argsStr) {
        List<String> args = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuote = false;
        char quoteChar = 0;
        
        for (int i = 0; i < argsStr.length(); i++) {
            char c = argsStr.charAt(i);
            
            if ((c == '"' || c == '\'') && !inQuote) {
                inQuote = true;
                quoteChar = c;
            } else if (c == quoteChar && inQuote) {
                inQuote = false;
            } else if (c == ',' && !inQuote) {
                args.add(current.toString().trim());
                current = new StringBuilder();
                continue;
            }
            
            current.append(c);
        }
        
        if (current.length() > 0) {
            args.add(current.toString().trim());
        }
        
        return args;
    }

    /**
     * MySQL 到 SQLite 转换
     */
    private String convertMySqlToSqlite(String expr) {
        // DATE_FORMAT 转换
        expr = expr.replaceAll(
            "DATE_FORMAT\\(([^,]+),\\s*[\"']([^\"']+)[\"']\\)",
            "strftime('$2', $1)"
        );
        
        // TIMESTAMPDIFF 转换
        expr = expr.replaceAll(
            "TIMESTAMPDIFF\\(YEAR,\\s*([^,]+),\\s*NOW\\(\\)\\)",
            "CAST((julianday('now') - julianday($1)) / 365.25 AS INTEGER)"
        );
        
        return expr;
    }
}
```

## 2. 数据模型

### 2.1 DTO 类

```java
@Data
@Builder
public class QueryResult {
    private boolean success;
    private List<Map<String, Object>> data;
    private int count;
    private long duration;
    private String message;
    
    public static QueryResult success(
            List<Map<String, Object>> data,
            long duration) {
        return QueryResult.builder()
            .success(true)
            .data(data)
            .count(data.size())
            .duration(duration)
            .build();
    }
    
    public static QueryResult empty() {
        return QueryResult.builder()
            .success(true)
            .data(Collections.emptyList())
            .count(0)
            .duration(0)
            .build();
    }
}

@Data
public class QueryOptions {
    private Integer page;
    private Integer pageSize;
    private String sortBy;
    private String sortOrder;
}

@Data
public class ModuleConfig {
    private String id;
    private String moduleName;
    private String moduleDesc;
    private PrimaryEntity primaryEntity;
    private List<EntityRelation> entities;
    private List<FieldMapping> mappings;
}

@Data
public class PrimaryEntity {
    private String name;
    private String desc;
}

@Data
public class EntityRelation {
    private String id;
    private String name;
    private String relationType;
    private JoinCondition joinCondition;
}

@Data
public class JoinCondition {
    private String left;
    private String right;
}

@Data
public class FieldMapping {
    private String displayName;
    private String logicalField;
    private List<PhysicalField> physicalFields;
    private String transformer;
    private String transformerEnv;
}

@Data
public class PhysicalField {
    private String entity;
    private String name;
}
```

## 3. 异常处理

```java
@Getter
public class QueryException extends RuntimeException {
    private final String errorCode;
    private final String errorMessage;
    
    public QueryException(String message) {
        super(message);
        this.errorCode = "QUERY_ERROR";
        this.errorMessage = message;
    }
    
    public QueryException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = "QUERY_ERROR";
        this.errorMessage = message;
    }
}

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    
    @ExceptionHandler(QueryException.class)
    public ResponseEntity<ErrorResponse> handleQueryException(
            QueryException e) {
        log.error("查询异常: {}", e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse.builder()
                .errorCode(e.getErrorCode())
                .errorMessage(e.getErrorMessage())
                .timestamp(LocalDateTime.now())
                .build());
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception e) {
        log.error("系统异常: {}", e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ErrorResponse.builder()
                .errorCode("SYSTEM_ERROR")
                .errorMessage("系统内部错误")
                .timestamp(LocalDateTime.now())
                .build());
    }
}

@Data
@Builder
public class ErrorResponse {
    private String errorCode;
    private String errorMessage;
    private LocalDateTime timestamp;
}
```

## 4. 总结

本文档详细说明了 Java 版本的核心实现类，包括：

1. **查询引擎服务**：动态 SQL 构建和执行
2. **权限服务**：字段级权限控制和缓存
3. **转换器服务**：数据库级和应用级转换
4. **数据模型**：DTO 和实体类定义
5. **异常处理**：统一的异常处理机制

这些实现与 NestJS 版本功能完全一致，但利用了 Java 的类型安全和企业级特性。
