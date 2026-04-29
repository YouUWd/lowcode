# Lumina 动态查询引擎 - 架构设计文档

## 1. 架构概述

### 1.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端层 (Vue 3)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ 模块配置界面  │  │ 权限管理界面  │  │ 数据查询界面  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/JSON
┌────────────────────────────┴────────────────────────────────────┐
│                      API 网关层 (Spring Cloud Gateway)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  JWT 认证    │  │  限流控制    │  │  日志记录    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                    应用服务层 (Spring Boot)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Controller 层                          │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │ 查询控制器    │  │ 模块控制器    │  │ 权限控制器    │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │                                     │
│  ┌────────────────────────┴─────────────────────────────────┐  │
│  │                    Service 层                             │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │ 查询引擎服务  │  │ 权限过滤服务  │  │ 转换器服务    │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │ 模块配置服务  │  │ 字典缓存服务  │  │ 审计日志服务  │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │                                     │
│  ┌────────────────────────┴─────────────────────────────────┐  │
│  │                  数据访问层 (jOOQ)                         │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │ SQL 构建器    │  │ 查询执行器    │  │ 事务管理器    │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  └────────────────────────┬─────────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                        数据存储层                                 │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │  配置数据库       │              │  业务数据库       │         │
│  │  (lumina_config) │              │ (lumina_business)│         │
│  │  - 模块配置       │              │  - 学生信息       │         │
│  │  - 字段映射       │              │  - 班级信息       │         │
│  │  - 权限配置       │              │  - 成绩记录       │         │
│  └──────────────────┘              └──────────────────┘         │
│                                                                  │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │  Redis 缓存      │              │  文件存储         │         │
│  │  - 字典数据       │              │  - 审计日志       │         │
│  │  - 权限缓存       │              │  - 导出文件       │         │
│  └──────────────────┘              └──────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈选型

| 层次 | 技术选型 | 版本 | 说明 |
|------|---------|------|------|
| **开发语言** | Java | 17+ | LTS 版本，企业级支持 |
| **应用框架** | Spring Boot | 3.2.x | 主流企业级框架 |
| **数据库访问** | jOOQ | 3.19.x | 类型安全的 SQL 构建 |
| **数据库** | MySQL | 8.0+ | 生产环境主数据库 |
| **缓存** | Redis | 7.0+ | 字典和权限缓存 |
| **构建工具** | Maven | 3.9+ | 依赖管理和构建 |
| **API 文档** | SpringDoc OpenAPI | 2.3.x | 自动生成 API 文档 |
| **日志框架** | Logback | 1.4.x | Spring Boot 默认日志 |
| **JSON 处理** | Jackson | 2.15.x | JSON 序列化/反序列化 |
| **代码简化** | Lombok | 1.18.x | 减少样板代码 |
| **单元测试** | JUnit 5 + Mockito | 5.10.x | 测试框架 |

### 1.3 设计原则

1. **分层架构**：Controller → Service → Repository，职责清晰
2. **依赖注入**：使用 Spring IoC 容器管理对象生命周期
3. **接口隔离**：面向接口编程，降低耦合度
4. **单一职责**：每个类只负责一个功能模块
5. **开闭原则**：对扩展开放，对修改关闭
6. **类型安全**：使用 jOOQ 确保 SQL 类型安全

## 2. 核心模块设计

### 2.1 查询引擎模块 (Query Engine)

**职责**：根据模块配置动态生成并执行 SQL 查询

**核心类**：

```java
// 查询引擎服务
@Service
public class QueryEngineService {
    
    // 执行动态查询
    public QueryResult executeDynamicQuery(
        String moduleId, 
        QueryOptions options
    );
    
    // 构建主查询（1:1/N:1 关系）
    private SelectQuery buildMainQuery(
        ModuleConfig config,
        List<FieldMapping> mappings
    );
    
    // 执行子查询（1:N 关系）
    private Map<Long, List<Map<String, Object>>> executeChildQueries(
        EntityRelation entity,
        List<Long> parentIds,
        String moduleId
    );
    
    // 附加子查询结果到主记录
    private void attachChildRecords(
        List<Map<String, Object>> mainRecords,
        Map<Long, List<Map<String, Object>>> childRecords,
        EntityRelation entity
    );
}
```

**查询流程**：

```
1. 加载模块配置
   ↓
2. 应用权限过滤
   ↓
3. 分离关系类型
   ├─ 1:1/N:1 → 主查询
   └─ 1:N → 子查询
   ↓
4. 构建 SQL（jOOQ DSL）
   ├─ SELECT 字段列表
   ├─ FROM 主表
   ├─ LEFT JOIN 关联表
   └─ WHERE 条件
   ↓
5. 执行查询
   ↓
6. 应用数据转换
   ├─ 数据库转换（已完成）
   └─ 前端转换（应用层）
   ↓
7. 组装最终结果
```

### 2.2 权限控制模块 (Permission)

**职责**：实现字段级和行级权限控制

**核心类**：

```java
// 权限服务
@Service
public class PermissionService {
    
    // 获取模块权限
    public Set<String> getModulePermissions(String moduleId);
    
    // 过滤字段映射（移除无权限字段）
    public List<FieldMapping> filterMappingsByPermissions(
        List<FieldMapping> mappings,
        String moduleId
    );
    
    // 检查字段权限
    public boolean hasFieldPermission(
        String entity,
        String field,
        OperationType operation,
        String moduleId
    );
    
    // 应用行级权限（数据范围）
    public Condition applyDataScope(
        String primaryEntity,
        UserDetails user
    );
}
```

**权限模型**：

```
权限节点: {entity}.{field}.{operation}
示例: student.student_no.READ

操作类型:
- READ: 读取权限
- CREATE: 创建权限
- UPDATE: 更新权限

权限策略:
1. 硬拦截: 无权限字段直接移除
2. 软打码: 无权限字段应用脱敏转换
3. 行级过滤: 根据用户数据范围过滤记录
```

### 2.3 数据转换模块 (Transformer)

**职责**：实现数据库级和应用级的数据转换

**核心类**：

```java
// 转换器服务
@Service
public class TransformerService {
    
    // 应用前端转换
    public List<Map<String, Object>> applyFrontendTransformers(
        List<Map<String, Object>> records,
        List<FieldMapping> mappings
    );
    
    // 解析数据库转换表达式
    public Field<?> parseDatabaseTransformer(
        FieldMapping mapping
    );
    
    // 执行转换表达式
    private Object evaluateExpression(
        String expression,
        Map<String, Object> context
    );
}
```

**转换器类型**：

| 转换器 | 环境 | 说明 | 示例 |
|--------|------|------|------|
| `DATE_FORMAT` | database | 日期格式化 | `DATE_FORMAT(birth_date, '%Y年%m月%d日')` |
| `TIMESTAMPDIFF` | database | 时间差计算 | `TIMESTAMPDIFF(YEAR, birth_date, NOW())` |
| `CONCAT` | frontend | 字符串拼接 | `CONCAT(${last_name}, ${first_name})` |
| `DICT_MAP` | frontend | 字典映射 | `DICT_MAP("GENDER", ${gender})` |
| `MASK_SENSITIVE` | frontend | 敏感数据脱敏 | `MASK_SENSITIVE(${id_card}, "ALL")` |

### 2.4 模块配置模块 (Module Config)

**职责**：管理模块元数据配置

**核心类**：

```java
// 模块服务
@Service
public class ModuleService {
    
    // 加载模块配置
    public ModuleConfig loadModuleConfig(String moduleId);
    
    // 获取模块列表
    public List<ModuleInfo> getModuleList();
    
    // 创建模块
    public void createModule(ModuleConfig config);
    
    // 更新模块
    public void updateModule(String moduleId, ModuleConfig config);
    
    // 删除模块
    public void deleteModule(String moduleId);
}
```

**配置结构**：

```java
@Data
public class ModuleConfig {
    private String id;                      // 模块ID
    private String moduleName;              // 模块名称
    private String moduleDesc;              // 模块描述
    private PrimaryEntity primaryEntity;    // 主实体
    private List<EntityRelation> entities;  // 关联实体
    private List<FieldMapping> mappings;    // 字段映射
}

@Data
public class EntityRelation {
    private String id;                      // 实体ID
    private String name;                    // 实体名称
    private String relationType;            // 关系类型: 1:1, N:1, 1:N
    private JoinCondition joinCondition;    // 关联条件
}

@Data
public class FieldMapping {
    private String displayName;             // 显示名称
    private String logicalField;            // 逻辑字段名
    private List<PhysicalField> physicalFields; // 物理字段
    private String transformer;             // 转换表达式
    private String transformerEnv;          // 转换环境
}
```

## 3. 数据访问层设计

### 3.1 jOOQ 配置

```java
@Configuration
public class JooqConfig {
    
    @Bean
    public DataSourceConnectionProvider connectionProvider(
        @Qualifier("configDataSource") DataSource dataSource
    ) {
        return new DataSourceConnectionProvider(
            new TransactionAwareDataSourceProxy(dataSource)
        );
    }
    
    @Bean
    public DSLContext dslContext(
        ConnectionProvider connectionProvider,
        SQLDialect dialect
    ) {
        return DSL.using(
            connectionProvider,
            dialect,
            new Settings()
                .withRenderSchema(false)
                .withExecuteLogging(true)
        );
    }
}
```

### 3.2 动态 SQL 构建

**核心优势**：
- 类型安全：编译期检查 SQL 语法
- SQL 注入防护：参数自动绑定
- 多数据库支持：自动适配方言

**示例代码**：

```java
// 构建动态 SELECT
SelectSelectStep<Record> select = dsl.select();

// 添加字段
for (FieldMapping mapping : mappings) {
    if ("database".equals(mapping.getTransformerEnv())) {
        // 数据库转换
        Field<?> field = parseDatabaseTransformer(mapping);
        select.select(field.as(mapping.getLogicalField()));
    } else {
        // 简单映射
        PhysicalField pf = mapping.getPhysicalFields().get(0);
        select.select(
            field(name(pf.getEntity(), pf.getName()))
                .as(pf.getEntity() + "_" + pf.getName())
        );
    }
}

// 构建 FROM + JOIN
SelectJoinStep<Record> from = select.from(table(primaryEntity));

for (EntityRelation entity : entities) {
    from = from.leftJoin(table(entity.getName()))
        .on(field(name(entity.getName(), entity.getJoinCondition().getLeft()))
            .eq(field(name(primaryEntity, entity.getJoinCondition().getRight()))));
}

// 执行查询
Result<Record> result = from.fetch();
```

### 3.3 事务管理

```java
@Service
public class ModuleService {
    
    @Transactional(rollbackFor = Exception.class)
    public void createModule(ModuleConfig config) {
        // 1. 插入模块基本信息
        moduleRepository.insert(config);
        
        // 2. 插入关联实体
        entityRepository.batchInsert(config.getEntities());
        
        // 3. 插入字段映射
        fieldRepository.batchInsert(config.getMappings());
        
        // 4. 生成权限配置
        permissionService.generatePermissions(config);
    }
}
```

## 4. 缓存策略

### 4.1 Redis 缓存设计

**缓存内容**：
1. 模块配置缓存
2. 权限配置缓存
3. 字典数据缓存
4. 查询结果缓存（可选）

**缓存键设计**：

```
模块配置: module:config:{moduleId}
权限配置: permission:module:{moduleId}
字典数据: dict:{dictCode}:{dictValue}
查询结果: query:result:{moduleId}:{hash}
```

**缓存实现**：

```java
@Service
public class CacheService {
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    // 获取模块配置（带缓存）
    @Cacheable(value = "module:config", key = "#moduleId")
    public ModuleConfig getModuleConfig(String moduleId) {
        return moduleRepository.findById(moduleId);
    }
    
    // 更新模块配置（清除缓存）
    @CacheEvict(value = "module:config", key = "#moduleId")
    public void updateModuleConfig(String moduleId, ModuleConfig config) {
        moduleRepository.update(config);
    }
    
    // 获取字典值
    @Cacheable(value = "dict", key = "#dictCode + ':' + #dictValue")
    public String getDictLabel(String dictCode, String dictValue) {
        return dictionaryRepository.findLabel(dictCode, dictValue);
    }
}
```

### 4.2 缓存更新策略

1. **主动更新**：配置变更时主动清除缓存
2. **定时刷新**：每小时刷新字典缓存
3. **懒加载**：首次访问时加载并缓存
4. **过期策略**：设置合理的 TTL

## 5. 安全设计

### 5.1 认证与授权

**JWT 认证流程**：

```
1. 用户登录
   ↓
2. 验证用户名密码
   ↓
3. 生成 JWT Token
   ├─ Header: 算法类型
   ├─ Payload: 用户信息、权限
   └─ Signature: 签名
   ↓
4. 返回 Token 给客户端
   ↓
5. 客户端请求携带 Token
   ↓
6. 服务端验证 Token
   ├─ 验证签名
   ├─ 检查过期时间
   └─ 提取用户信息
   ↓
7. 执行业务逻辑
```

**权限注解**：

```java
@RestController
@RequestMapping("/api/query")
public class QueryController {
    
    // 需要 QUERY 权限
    @PreAuthorize("hasAuthority('QUERY')")
    @PostMapping("/{moduleId}")
    public ResponseEntity<QueryResult> query(
        @PathVariable String moduleId,
        @RequestBody QueryOptions options
    ) {
        return ResponseEntity.ok(queryService.execute(moduleId, options));
    }
    
    // 需要 ADMIN 角色
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/modules")
    public ResponseEntity<Void> createModule(
        @RequestBody ModuleConfig config
    ) {
        moduleService.createModule(config);
        return ResponseEntity.ok().build();
    }
}
```

### 5.2 SQL 注入防护

**jOOQ 自动防护**：
- 所有参数自动绑定
- 不拼接 SQL 字符串
- 类型安全检查

**示例**：

```java
// ❌ 不安全的方式（字符串拼接）
String sql = "SELECT * FROM student WHERE id = " + userId;

// ✅ 安全的方式（jOOQ 参数绑定）
dsl.select()
   .from(STUDENT)
   .where(STUDENT.ID.eq(userId))
   .fetch();
```

### 5.3 敏感数据保护

**数据脱敏**：

```java
public class MaskTransformer {
    
    // 身份证号脱敏：保留前3位和后4位
    public static String maskIdCard(String idCard) {
        if (idCard == null || idCard.length() < 7) {
            return idCard;
        }
        return idCard.substring(0, 3) + "****" + 
               idCard.substring(idCard.length() - 4);
    }
    
    // 手机号脱敏：保留前3位和后4位
    public static String maskPhone(String phone) {
        if (phone == null || phone.length() < 7) {
            return phone;
        }
        return phone.substring(0, 3) + "****" + 
               phone.substring(phone.length() - 4);
    }
}
```

## 6. 性能优化

### 6.1 查询优化

1. **索引优化**：为常用查询字段创建索引
2. **分页查询**：避免一次性加载大量数据
3. **字段裁剪**：只查询需要的字段
4. **连接优化**：消除冗余的 JOIN

### 6.2 缓存优化

1. **多级缓存**：本地缓存 + Redis 缓存
2. **缓存预热**：系统启动时加载常用数据
3. **缓存穿透防护**：布隆过滤器
4. **缓存雪崩防护**：随机过期时间

### 6.3 连接池优化

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
```

## 7. 监控与日志

### 7.1 日志设计

**日志级别**：
- ERROR: 系统错误
- WARN: 警告信息
- INFO: 关键业务日志
- DEBUG: 调试信息

**日志内容**：

```java
@Slf4j
@Service
public class QueryEngineService {
    
    public QueryResult execute(String moduleId, QueryOptions options) {
        log.info("开始执行查询: moduleId={}, options={}", moduleId, options);
        
        try {
            // 执行查询
            QueryResult result = doExecute(moduleId, options);
            
            log.info("查询完成: moduleId={}, recordCount={}, duration={}ms",
                moduleId, result.getCount(), result.getDuration());
            
            return result;
        } catch (Exception e) {
            log.error("查询失败: moduleId={}, error={}", moduleId, e.getMessage(), e);
            throw new QueryException("查询失败", e);
        }
    }
}
```

### 7.2 性能监控

**监控指标**：
- 查询响应时间
- 查询成功率
- 数据库连接数
- 缓存命中率
- JVM 内存使用

**监控工具**：
- Spring Boot Actuator
- Prometheus + Grafana
- ELK Stack (日志分析)

## 8. 部署架构

### 8.1 单机部署

```
┌─────────────────────────────────────┐
│         应用服务器                    │
│  ┌─────────────────────────────┐   │
│  │   Spring Boot Application    │   │
│  │   (Port: 8080)               │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   MySQL Database             │   │
│  │   (Port: 3306)               │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Redis Cache                │   │
│  │   (Port: 6379)               │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 8.2 集群部署

```
                    ┌─────────────┐
                    │   Nginx     │
                    │ Load Balancer│
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │ App-1   │       │ App-2   │       │ App-3   │
   │ :8080   │       │ :8080   │       │ :8080   │
   └────┬────┘       └────┬────┘       └────┬────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │ MySQL   │       │ Redis   │       │  File   │
   │ Master  │       │ Cluster │       │ Storage │
   └────┬────┘       └─────────┘       └─────────┘
        │
   ┌────▼────┐
   │ MySQL   │
   │ Slave   │
   └─────────┘
```

## 9. 扩展性设计

### 9.1 转换器扩展

```java
// 转换器接口
public interface Transformer {
    String getName();
    Object transform(Map<String, Object> context);
}

// 自定义转换器
@Component
public class CustomTransformer implements Transformer {
    
    @Override
    public String getName() {
        return "CUSTOM_FUNC";
    }
    
    @Override
    public Object transform(Map<String, Object> context) {
        // 自定义转换逻辑
        return result;
    }
}

// 转换器注册
@Service
public class TransformerRegistry {
    
    private Map<String, Transformer> transformers = new HashMap<>();
    
    @Autowired
    public void registerTransformers(List<Transformer> transformerList) {
        transformerList.forEach(t -> 
            transformers.put(t.getName(), t)
        );
    }
}
```

### 9.2 数据库扩展

**支持多数据库**：

```java
@Configuration
public class MultiDataSourceConfig {
    
    @Bean
    @ConfigurationProperties("spring.datasource.config")
    public DataSource configDataSource() {
        return DataSourceBuilder.create().build();
    }
    
    @Bean
    @ConfigurationProperties("spring.datasource.business")
    public DataSource businessDataSource() {
        return DataSourceBuilder.create().build();
    }
    
    @Bean
    public DSLContext configDslContext(
        @Qualifier("configDataSource") DataSource dataSource
    ) {
        return DSL.using(dataSource, SQLDialect.MYSQL);
    }
    
    @Bean
    public DSLContext businessDslContext(
        @Qualifier("businessDataSource") DataSource dataSource
    ) {
        return DSL.using(dataSource, SQLDialect.MYSQL);
    }
}
```

## 10. 总结

本架构设计基于 Spring Boot + jOOQ 技术栈，实现了与 NestJS 版本功能完全一致的动态查询引擎。核心优势包括：

1. **类型安全**：jOOQ 提供编译期 SQL 检查
2. **企业级**：完善的安全、事务、审计机制
3. **高性能**：多级缓存、连接池优化
4. **可扩展**：插件化的转换器和数据源
5. **易维护**：清晰的分层架构和代码规范

该架构适用于大型企业、银行、政府等对安全性和合规性要求较高的场景。
