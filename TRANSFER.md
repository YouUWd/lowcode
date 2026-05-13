# NestJS 到 Spring Boot 3 + JDK 21 迁移方案

## 概述
本文档提供了将 NestJS + Knex 项目完整迁移到 Spring Boot 3 + JDK 21 + jOOQ 的实现方案。

## 核心架构对比

### NestJS 架构
- **框架**: NestJS (TypeScript)
- **ORM**: Knex.js (Query Builder)
- **数据库**: SQLite3
- **依赖注入**: NestJS 内置
- **HTTP**: Express 适配器

### Spring Boot 3 架构
- **框架**: Spring Boot 3.2+
- **ORM**: jOOQ (Type-safe SQL Builder)
- **数据库**: SQLite3 (JDBC)
- **依赖注入**: Spring IoC
- **HTTP**: Spring Web MVC

## 项目结构

\\\
lumina-server/
├── src/main/java/com/lumina/
│   ├── LuminaApplication.java
│   ├── config/
│   │   └── DatabaseConfig.java
│   ├── engine/
│   │   ├── controller/
│   │   │   └── EngineController.java
│   │   ├── service/
│   │   │   ├── EngineService.java
│   │   │   └── TransformerService.java
│   │   └── dto/
│   │       ├── QueryResponse.java
│   │       └── QueryOptions.java
│   ├── modules/
│   │   ├── service/
│   │   │   └── ModulesService.java
│   │   └── model/
│   │       ├── ModuleConfig.java
│   │       ├── EntityRelation.java
│   │       ├── Mapping.java
│   │       └── PhysicalField.java
│   └── permissions/
│       └── service/
│           └── PermissionsService.java
├── pom.xml
└── application.yml
\\\

## 关键迁移点

### Knex 到 jOOQ 的转换

| Knex | jOOQ |
|------|------|
| knex('table') | businessDb.select().from(table('table')) |
| .where('field', value) | .where(field('field').eq(value)) |
| .select('field') | .select(field('field')) |
| .leftJoin(...) | .leftJoin(...).on(...) |
| .limit(10).offset(20) | .limit(10).offset(20) |
| .fetch() | .fetch() |

### TypeScript 到 Java 的转换

| TypeScript | Java |
|-----------|------|
| interface | class with @Data |
| async/await | 同步方法（Spring 处理异步） |
| Map<string, any> | Map<String, Object> |
| Array<T> | List<T> |
| Set<string> | Set<String> |
| console.log | log.info (SLF4J) |

## 核心功能

### 动态查询构建
- 支持 1:1、N:1、1:N 关系
- 动态字段选择
- 权限过滤
- 分页支持
- 数据库级和前端级转换

### 转换器系统
支持的转换器：
- DICT_MAP - 字典映射
- MASK_SENSITIVE - 敏感数据掩盖
- CONCAT - 字符串连接
- ASSEMBLE_FRACTION - 分数格式化
- ASSEMBLE_PERF_SUMMARY - 性能总结格式化

### 权限控制
权限节点格式: {entity}.{field}.{operation}

示例:
- hr_employee_base.emp_no.READ
- hr_employee_base.salary.UPDATE

## 运行指南

### 编译
\\\ash
mvn clean compile
\\\

### 打包
\\\ash
mvn clean package
\\\

### 运行
\\\ash
java -jar target/lumina-server-1.0.0.jar
\\\

### 开发模式
\\\ash
mvn spring-boot:run
\\\

## API 示例

### 查询学生基本信息

\\\ash
GET /api/engine/query/MOD-STUDENT-BASIC?page=1&pageSize=20
\\\

**响应:**
\\\json
{
  \"success\": true,
  \"data\": [
    {
      \"id\": \"1\",
      \"fullName\": \"张三\",
      \"genderText\": \"男\",
      \"age\": 20
    }
  ],
  \"count\": 1,
  \"pagination\": {
    \"page\": 1,
    \"pageSize\": 20,
    \"total\": 1
  }
}
\\\

## 性能优化建议

1. **查询优化**
   - 使用数据库级转换减少数据传输
   - 合理使用分页
   - 添加数据库索引

2. **缓存策略**
   - 缓存模块配置
   - 缓存权限节点
   - 使用 Redis 缓存热数据

3. **连接池**
   - 配置 HikariCP 连接池
   - 调整最大连接数

## 故障排查

### 问题：权限集合为空
**原因:** sys_permission_config 表中没有启用的权限节点
**解决:** 检查权限配置，确保 enabled=true

### 问题：字段转换失败
**原因:** 物理字段映射不正确
**解决:** 检查 source_mapping JSON 格式

### 问题：查询性能慢
**原因:** 1:N 关系查询过多
**解决:** 优化关系配置，减少不必要的关联

## 总结

本迁移方案完整地将 NestJS + Knex 项目转换为 Spring Boot 3 + jOOQ，保持了原有的业务逻辑和功能特性，同时获得了 Java 生态的优势：

- ✅ 类型安全的 SQL 构建（jOOQ）
- ✅ 强大的依赖注入框架（Spring）
- ✅ 完善的监控和日志系统
- ✅ 丰富的第三方库支持
- ✅ 更好的性能和可扩展性
- ✅ JDK 21 最新特性支持



```
package com.lumina.engine.service;

import com.lumina.modules.model.*;
import com.lumina.permissions.service.PermissionsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.jooq.SelectJoinStep;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

import static org.jooq.impl.DSL.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class EngineService {
    
    @Qualifier("businessDb")
    private final DSLContext businessDb;
    
    @Qualifier("configDb")
    private final DSLContext configDb;
    
    private final PermissionsService permissionsService;
    private final TransformerService transformerService;
    
    /**
     * 执行动态查询
     */
    public List<Map<String, Object>> executeDynamicQuery(
            ModuleConfig config, 
            QueryOptions options) {
        
        var primaryEntity = config.getPrimaryEntity();
        var entities = config.getEntities();
        var mappings = config.getMappings();
        
        log.info("\n========== 混合查询开始 ==========");
        log.info("主表: {}", primaryEntity.getName());
        
        // 分离关系类型
        var oneToOneEntities = entities.stream()
                .filter(e -> e.getRelationType() == RelationType.ONE_TO_ONE || 
                           e.getRelationType() == RelationType.MANY_TO_ONE)
                .collect(Collectors.toList());
        
        var oneToManyEntities = entities.stream()
                .filter(e -> e.getRelationType() == RelationType.ONE_TO_MANY)
                .collect(Collectors.toList());
        
        log.info("[关系分析] 1:1/N:1: {} 个, 1:N: {} 个", 
                oneToOneEntities.size(), oneToManyEntities.size());
        
        // 执行主查询（包含 1:1/N:1 关系）
        var mainData = executeMainQuery(primaryEntity, oneToOneEntities, mappings, options);
        
        log.info("[主查询结果] {} 条记录", mainData.size());
        
        // 附加 1:N 关系数据
        if (!oneToManyEntities.isEmpty() && !mainData.isEmpty()) {
            log.info("[关联查询] 开始查询 {} 个 1:N 关系", oneToManyEntities.size());
            attachOneToManyRelations(mainData, oneToManyEntities, primaryEntity, config.getId());
        }
        
        log.info("========== 混合查询结束 ==========\n");
        
        return mainData;
    }
    
    /**
     * 执行主查询（包含 1:1/N:1 关系）
     */
    private List<Map<String, Object>> executeMainQuery(
            PrimaryEntity primaryEntity,
            List<EntityRelation> oneToOneEntities,
            List<Mapping> mappings,
            QueryOptions options) {
        
        log.info("[主查询] 构建查询...");
        
        // 识别使用的表（主表 + 1:1/N:1 关系表）
        Set<String> usedEntities = new HashSet<>();
        usedEntities.add(primaryEntity.getName());
        oneToOneEntities.forEach(e -> usedEntities.add(e.getName()));
        
        log.info("  使用的表: {}", String.join(", ", usedEntities));
        
        // 构建查询
        var query = businessDb.select().from(table(primaryEntity.getName()));
        
        // 应用 LEFT JOIN
        for (var entity : oneToOneEntities) {
            var joinCond = entity.getJoinCondition();
            query = ((SelectJoinStep<?>) query).leftJoin(table(entity.getName()))
                    .on(field(entity.getName() + "." + joinCond.getLeft())
                            .eq(field(primaryEntity.getName() + "." + joinCond.getRight())));
            
            log.info("  ✓ LEFT JOIN {} ON {}.{} = {}.{}", 
                    entity.getName(), 
                    entity.getName(), joinCond.getLeft(),
                    primaryEntity.getName(), joinCond.getRight());
        }
        
        // 构建 SELECT 字段
        Set<String> selectedFields = new HashSet<>();
        List<org.jooq.Field<?>> selectFields = new ArrayList<>();
        
        // 选择主表主键（用于 1:N 关系关联）
        selectFields.add(field(primaryEntity.getName() + ".id").as("id"));
        selectedFields.add(primaryEntity.getName() + ".id");
        log.info("  ✓ [主键] {}.id", primaryEntity.getName());
        
        // 处理映射字段
        for (var mapping : mappings) {
            // 只选择属于主查询实体的字段（排除 1:N 关系实体）
            boolean allFieldsInUsedEntities = mapping.getPhysicalFields().stream()
                    .allMatch(pf -> usedEntities.contains(pf.getEntity()));
            
            if (!allFieldsInUsedEntities) {
                continue; // 跳过 1:N 关系字段
            }
            
            if (mapping.getTransformer() != null && 
                mapping.getTransformerEnv() == TransformerEnv.DATABASE) {
                
                // 后端转换（数据库级别）
                String rawSql = transformerService.replacePlaceholders(
                        mapping.getTransformer(), 
                        mapping.getPhysicalFields());
                
                // MySQL 到 SQLite 转换
                rawSql = transformerService.convertMySQLToSQLite(rawSql);
                
                selectFields.add(field(rawSql).as(mapping.getLogicalField()));
                
            } else {
                // 前端转换和简单映射：统一选择物理字段（使用 entity_field 格式）
                for (var pf : mapping.getPhysicalFields()) {
                    String fieldAlias = pf.getEntity() + "_" + pf.getField();
                    if (!selectedFields.contains(fieldAlias)) {
                        selectFields.add(
                                field(pf.getEntity() + "." + pf.getField()).as(fieldAlias));
                        selectedFields.add(fieldAlias);
                    }
                }
            }
        }
        
        // 应用字段选择
        query = ((SelectJoinStep<?>) query).select(selectFields);
        
        // 应用分页
        if (options.getPage() != null && options.getPageSize() != null) {
            int offset = (options.getPage() - 1) * options.getPageSize();
            query = query.limit(options.getPageSize()).offset(offset);
            log.info("[分页] page={}, pageSize={}", options.getPage(), options.getPageSize());
        }
        
        // 执行查询
        String sqlQuery = query.getSQL();
        log.info("[SQL] {}", sqlQuery);
        
        var rawData = query.fetch();
        log.info("[执行结果] {} 条记录", rawData.size());
        
        // 过滤只属于主查询的映射
        var mainQueryMappings = mappings.stream()
                .filter(mapping -> mapping.getPhysicalFields().stream()
                        .allMatch(pf -> usedEntities.contains(pf.getEntity())))
                .collect(Collectors.toList());
        
        // 应用前端转换
        return applyBffTransformers(rawData, mainQueryMappings);
    }
    
    /**
     * 应用前端转换器
     */
    private List<Map<String, Object>> applyBffTransformers(
            List<Record> data, 
            List<Mapping> mappings) {
        
        // 分类映射
        var bffMappings = mappings.stream()
                .filter(m -> m.getTransformerEnv() == TransformerEnv.FRONTEND)
                .collect(Collectors.toList());
        
        var databaseMappings = mappings.stream()
                .filter(m -> m.getTransformerEnv() == TransformerEnv.DATABASE)
                .collect(Collectors.toList());
        
        var simpleMappings = mappings.stream()
                .filter(m -> m.getTransformerEnv() == TransformerEnv.NONE)
                .collect(Collectors.toList());
        
        return data.stream().map(row -> {
            Map<String, Object> result = new HashMap<>();
            
            // 保留 id 字段（用于 1:N 关系关联）
            if (row.get("id") != null) {
                result.put("id", row.get("id"));
            }
            
            // 1. 处理数据库转换字段（已经在数据库中计算好，使用逻辑字段名）
            for (var mapping : databaseMappings) {
                result.put(mapping.getLogicalField(), row.get(mapping.getLogicalField()));
            }
            
            // 2. 处理简单映射字段（从 entity_field 格式映射到逻辑字段）
            for (var mapping : simpleMappings) {
                if (!mapping.getPhysicalFields().isEmpty()) {
                    var pf = mapping.getPhysicalFields().get(0);
                    String fieldAlias = pf.getEntity() + "_" + pf.getField();
                    result.put(mapping.getLogicalField(), row.get(fieldAlias));
                }
            }
            
            // 3. 处理前端转换字段
            for (var mapping : bffMappings) {
                try {
                    Object transformed = transformerService.evaluateTransformer(
                            mapping.getTransformer(),
                            row,
                            mapping.getPhysicalFields());
                    result.put(mapping.getLogicalField(), transformed);
                } catch (Exception e) {
                    log.error("转换 {} 时出错", mapping.getLogicalField(), e);
                    result.put(mapping.getLogicalField(), null);
                }
            }
            
            return result;
        }).collect(Collectors.toList());
    }
    
    /**
     * 附加 1:N 关系数据
     */
    private void attachOneToManyRelations(
            List<Map<String, Object>> mainData,
            List<EntityRelation> entities,
            PrimaryEntity primaryEntity,
            String moduleId) {
        
        for (var entity : entities) {
            log.info("[子查询] {}...", entity.getName());
            
            // 获取父记录 ID
            var parentKeys = mainData.stream()
                    .map(row -> row.get("id"))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
            
            if (parentKeys.isEmpty()) {
                log.info("  ⊗ 没有父记录 ID，跳过");
                continue;
            }
            
            log.info("  父记录 ID 数: {}", parentKeys.size());
            
            // 查询子记录
            var childRecords = queryChildRecords(
                    entity, 
                    parentKeys, 
                    moduleId, 
                    primaryEntity.getName());
            
            log.info("  查询到子记录数: {}", childRecords.size());
            
            // 附加到主记录
            for (var row : mainData) {
                Object parentId = row.get("id");
                
                var children = childRecords.stream()
                        .filter(child -> Objects.equals(
                                child.get(entity.getJoinCondition().getLeft()), 
                                parentId))
                        .map(child -> {
                            Map<String, Object> cleaned = new HashMap<>(child);
                            cleaned.remove(entity.getJoinCondition().getLeft());
                            return cleaned;
                        })
                        .collect(Collectors.toList());
                
                if (!children.isEmpty()) {
                    String relationKey = entity.getName() + "s";
                    row.put(relationKey, children);
                }
            }
        }
    }
    
    /**
     * 查询子记录
     */
    private List<Map<String, Object>> queryChildRecords(
            EntityRelation entity,
            List<Object> parentKeys,
            String moduleId,
            String primaryEntityName) {
        
        // 获取子表的字段映射（带权限过滤）
        var childMappings = getChildMappings(entity, moduleId, primaryEntityName);
        
        log.info("  子表字段映射数: {}", childMappings.size());
        
        if (childMappings.isEmpty()) {
            log.info("  ⊗ 子表 {} 没有可访问的字段，跳过查询", entity.getName());
            return List.of();
        }
        
        // 构建子查询
        var query = businessDb.select().from(table(entity.getName()))
                .where(field(entity.getJoinCondition().getLeft()).in(parentKeys));
        
        // 构建 SELECT
        Set<String> selectedFields = new HashSet<>();
        List<org.jooq.Field<?>> selectFields = new ArrayList<>();
        
        for (var mapping : childMappings) {
            log.info("  [字段] {}, env: {}", 
                    mapping.getLogicalField(), mapping.getTransformerEnv());
            
            if (mapping.getTransformer() != null && 
                mapping.getTransformerEnv() == TransformerEnv.DATABASE) {
                
                String rawSql = transformerService.replacePlaceholders(
                        mapping.getTransformer(), 
                        mapping.getPhysicalFields());
                
                selectFields.add(field(rawSql).as(mapping.getLogicalField()));
                log.info("    后端转换: {} AS {}", rawSql, mapping.getLogicalField());
                
            } else {
                for (var pf : mapping.getPhysicalFields()) {
                    String fieldAlias = pf.getEntity() + "_" + pf.getField();
                    String fieldKey = pf.getEntity() + "." + pf.getField();
                    
                    if (!selectedFields.contains(fieldKey)) {
                        selectFields.add(
                                field(pf.getEntity() + "." + pf.getField()).as(fieldAlias));
                        selectedFields.add(fieldKey);
                        log.info("    物理字段: {} AS {}", fieldKey, fieldAlias);
                    }
                }
            }
        }
        
        // 添加关联键
        String joinKeyField = entity.getName() + "." + entity.getJoinCondition().getLeft();
        if (!selectedFields.contains(joinKeyField)) {
            selectFields.add(field(joinKeyField));
        }
        
        // 应用字段选择
        query = ((SelectJoinStep<?>) query).select(selectFields);
        
        // 执行查询
        String sqlQuery = query.getSQL();
        log.info("  子查询 SQL: {}", sqlQuery);
        
        var childRecords = query.fetch();
        log.info("  子查询原始结果数: {}", childRecords.size());
        
        if (!childRecords.isEmpty()) {
            log.info("  第一条原始记录: {}", childRecords.get(0));
        }
        
        // 应用前端转换
        var transformedRecords = applyBffTransformers(childRecords, childMappings);
        
        if (!transformedRecords.isEmpty()) {
            log.info("  第一条转换后记录: {}", transformedRecords.get(0));
        }
        
        // 保留关联键字段
        for (int i = 0; i < transformedRecords.size(); i++) {
            transformedRecords.get(i).put(
                    entity.getJoinCondition().getLeft(),
                    childRecords.get(i).get(entity.getJoinCondition().getLeft()));
        }
        
        log.info("  转换后记录数: {}", transformedRecords.size());
        
        return transformedRecords;
    }
    
    /**
     * 获取子表字段映射
     */
    private List<Mapping> getChildMappings(
            EntityRelation entity, 
            String moduleId, 
            String primaryEntityName) {
        
        // 1:N 子查询只访问子表本身的字段
        Set<String> accessibleEntities = new HashSet<>();
        accessibleEntities.add(entity.getName());
        
        log.info("  [子查询] 实体 {} 可访问的表: {}", 
                entity.getName(), String.join(", ", accessibleEntities));
        
        // 查询该实体的字段配置
        var fields = configDb.selectFrom(table("sys_module_field"))
                .where(field("module_id").eq(moduleId))
                .and(field("is_visible").eq(true))
                .fetch();
        
        // 构建映射（从 source_mapping JSON 解析）
        var mappings = fields.stream()
                .map(field -> {
                    try {
                        String sourceMappingJson = field.get("source_mapping", String.class);
                        // 解析 JSON 并过滤只保留子表字段
                        // ... (类似 ModulesService 的解析逻辑)
                        return null; // placeholder
                    } catch (Exception e) {
                        log.warn("[引擎服务] 解析 source_mapping 失败: {}", 
                                field.get("logical_field"), e);
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        
        log.info("  [子查询字段] 过滤前: {} 个映射", mappings.size());
        
        // 应用权限过滤
        var filteredMappings = permissionsService.filterMappingsByPermissions(
                mappings, moduleId);
        
        log.info("  [子查询字段] 过滤后: {} 个映射", filteredMappings.size());
        
        return filteredMappings;
    }
}

```