# Lumina 动态查询引擎 - 测试计划文档

## 1. 测试概述

### 1.1 测试目标

1. **功能测试**：验证所有功能需求的正确实现
2. **性能测试**：验证系统性能指标
3. **安全测试**：验证安全机制的有效性
4. **集成测试**：验证各模块间的协作
5. **回归测试**：验证修改不会破坏现有功能

### 1.2 测试范围

| 模块 | 测试类型 | 优先级 |
|------|---------|--------|
| 查询引擎 | 单元测试、集成测试 | P0 |
| 权限控制 | 单元测试、集成测试 | P0 |
| 数据转换 | 单元测试 | P1 |
| 模块管理 | 单元测试、集成测试 | P1 |
| 缓存机制 | 单元测试、集成测试 | P2 |
| 审计日志 | 集成测试 | P2 |

### 1.3 测试工具

| 工具 | 用途 | 版本 |
|------|------|------|
| JUnit 5 | 单元测试框架 | 5.10.x |
| Mockito | Mock 框架 | 5.x |
| TestContainers | 容器化测试 | 1.19.x |
| Spring Test | Spring 集成测试 | 6.x |
| JMeter | 性能测试 | 5.6.x |
| Postman | API 测试 | 最新版 |

## 2. 单元测试

### 2.1 查询引擎单元测试

```java
@ExtendWith(MockitoExtension.class)
class QueryEngineServiceTest {

    @Mock
    private DSLContext businessDsl;
    
    @Mock
    private PermissionService permissionService;
    
    @Mock
    private TransformerService transformerService;
    
    @Mock
    private ModuleService moduleService;
    
    @InjectMocks
    private QueryEngineService queryEngineService;

    @Test
    @DisplayName("应该成功执行简单查询")
    void testExecuteSimpleQuery() {
        // 准备测试数据
        ModuleConfig config = createTestModuleConfig();
        List<FieldMapping> mappings = createTestMappings();
        
        when(moduleService.loadModuleConfig("MOD-TEST"))
            .thenReturn(config);
        when(permissionService.filterMappingsByPermissions(
            any(), eq("MOD-TEST")))
            .thenReturn(mappings);
        
        // 执行测试
        QueryResult result = queryEngineService.executeDynamicQuery(
            "MOD-TEST",
            new QueryOptions()
        );
        
        // 验证结果
        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertFalse(result.getData().isEmpty());
    }

    @Test
    @DisplayName("应该处理权限过滤")
    void testPermissionFiltering() {
        ModuleConfig config = createTestModuleConfig();
        List<FieldMapping> allMappings = createTestMappings();
        List<FieldMapping> filteredMappings = 
            allMappings.stream()
                .limit(1)
                .collect(Collectors.toList());
        
        when(moduleService.loadModuleConfig("MOD-TEST"))
            .thenReturn(config);
        when(permissionService.filterMappingsByPermissions(
            eq(allMappings), eq("MOD-TEST")))
            .thenReturn(filteredMappings);
        
        QueryResult result = queryEngineService.executeDynamicQuery(
            "MOD-TEST",
            new QueryOptions()
        );
        
        // 验证权限过滤被应用
        verify(permissionService).filterMappingsByPermissions(
            any(), eq("MOD-TEST"));
    }

    @Test
    @DisplayName("应该处理 1:N 关系查询")
    void testOneToManyRelationship() {
        // 测试 1:N 关系的查询
        ModuleConfig config = createTestModuleConfigWithOneToMany();
        
        when(moduleService.loadModuleConfig("MOD-STUDENT-FULL"))
            .thenReturn(config);
        
        QueryResult result = queryEngineService.executeDynamicQuery(
            "MOD-STUDENT-FULL",
            new QueryOptions()
        );
        
        // 验证子记录被正确附加
        assertNotNull(result.getData());
        result.getData().forEach(record -> {
            assertTrue(record.containsKey("scores"));
        });
    }

    @Test
    @DisplayName("应该处理查询异常")
    void testQueryException() {
        when(moduleService.loadModuleConfig("MOD-INVALID"))
            .thenThrow(new RuntimeException("模块不存在"));
        
        assertThrows(QueryException.class, () -> {
            queryEngineService.executeDynamicQuery(
                "MOD-INVALID",
                new QueryOptions()
            );
        });
    }

    // 辅助方法
    private ModuleConfig createTestModuleConfig() {
        // 创建测试模块配置
        return new ModuleConfig();
    }

    private List<FieldMapping> createTestMappings() {
        // 创建测试字段映射
        return new ArrayList<>();
    }

    private ModuleConfig createTestModuleConfigWithOneToMany() {
        // 创建包含 1:N 关系的测试配置
        return new ModuleConfig();
    }
}
```

### 2.2 权限服务单元测试

```java
@ExtendWith(MockitoExtension.class)
class PermissionServiceTest {

    @Mock
    private DSLContext configDsl;
    
    @Mock
    private RedisTemplate<String, Object> redisTemplate;
    
    @InjectMocks
    private PermissionService permissionService;

    @Test
    @DisplayName("应该从缓存获取权限")
    void testGetPermissionsFromCache() {
        Set<String> cachedPermissions = new HashSet<>();
        cachedPermissions.add("student.student_no.READ");
        
        when(redisTemplate.opsForValue().get("permission:module:MOD-TEST"))
            .thenReturn(cachedPermissions);
        
        Set<String> result = permissionService.getModulePermissions("MOD-TEST");
        
        assertEquals(cachedPermissions, result);
        verify(redisTemplate.opsForValue()).get("permission:module:MOD-TEST");
    }

    @Test
    @DisplayName("应该过滤无权限字段")
    void testFilterMappingsByPermissions() {
        List<FieldMapping> mappings = createTestMappings();
        Set<String> permissions = new HashSet<>();
        permissions.add("student.student_no.READ");
        
        when(redisTemplate.opsForValue().get(any()))
            .thenReturn(permissions);
        
        List<FieldMapping> filtered = 
            permissionService.filterMappingsByPermissions(mappings, "MOD-TEST");
        
        // 验证只有有权限的字段被保留
        assertTrue(filtered.size() <= mappings.size());
    }

    @Test
    @DisplayName("应该检查字段权限")
    void testHasFieldPermission() {
        Set<String> permissions = new HashSet<>();
        permissions.add("student.student_no.READ");
        
        when(redisTemplate.opsForValue().get(any()))
            .thenReturn(permissions);
        
        boolean hasPermission = permissionService.hasFieldPermission(
            "student", "student_no", "READ", "MOD-TEST");
        
        assertTrue(hasPermission);
    }

    private List<FieldMapping> createTestMappings() {
        // 创建测试字段映射
        return new ArrayList<>();
    }
}
```

### 2.3 转换器服务单元测试

```java
@ExtendWith(MockitoExtension.class)
class TransformerServiceTest {

    @Mock
    private DictCacheService dictCacheService;
    
    @InjectMocks
    private TransformerService transformerService;

    @Test
    @DisplayName("应该执行 CONCAT 转换")
    void testConcatTransformer() {
        Map<String, Object> row = new HashMap<>();
        row.put("student_last_name", "张");
        row.put("student_first_name", "伟");
        
        FieldMapping mapping = new FieldMapping();
        mapping.setLogicalField("fullName");
        mapping.setTransformer("CONCAT(${last_name}, ${first_name})");
        mapping.setTransformerEnv("frontend");
        
        List<FieldMapping> mappings = Collections.singletonList(mapping);
        List<Map<String, Object>> records = Collections.singletonList(row);
        
        List<Map<String, Object>> result = 
            transformerService.applyFrontendTransformers(records, mappings);
        
        assertEquals("张伟", result.get(0).get("fullName"));
    }

    @Test
    @DisplayName("应该执行 DICT_MAP 转换")
    void testDictMapTransformer() {
        Map<String, Object> row = new HashMap<>();
        row.put("student_gender", "1");
        
        when(dictCacheService.translate("GENDER", "1"))
            .thenReturn("男");
        
        FieldMapping mapping = new FieldMapping();
        mapping.setLogicalField("genderText");
        mapping.setTransformer("DICT_MAP(\"GENDER\", ${gender})");
        mapping.setTransformerEnv("frontend");
        
        List<FieldMapping> mappings = Collections.singletonList(mapping);
        List<Map<String, Object>> records = Collections.singletonList(row);
        
        List<Map<String, Object>> result = 
            transformerService.applyFrontendTransformers(records, mappings);
        
        assertEquals("男", result.get(0).get("genderText"));
    }

    @Test
    @DisplayName("应该执行 MASK_SENSITIVE 转换")
    void testMaskSensitiveTransformer() {
        Map<String, Object> row = new HashMap<>();
        row.put("id_card", "110101199001011234");
        
        FieldMapping mapping = new FieldMapping();
        mapping.setLogicalField("maskedIdCard");
        mapping.setTransformer("MASK_SENSITIVE(${id_card}, 'ALL')");
        mapping.setTransformerEnv("frontend");
        
        List<FieldMapping> mappings = Collections.singletonList(mapping);
        List<Map<String, Object>> records = Collections.singletonList(row);
        
        List<Map<String, Object>> result = 
            transformerService.applyFrontendTransformers(records, mappings);
        
        String masked = (String) result.get(0).get("maskedIdCard");
        assertTrue(masked.contains("****"));
    }
}
```

## 3. 集成测试

### 3.1 查询引擎集成测试

```java
@SpringBootTest
@AutoConfigureMockMvc
class QueryEngineIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private QueryEngineService queryEngineService;
    
    @Autowired
    private ModuleService moduleService;

    @Test
    @DisplayName("应该成功执行完整的查询流程")
    void testCompleteQueryFlow() throws Exception {
        // 准备测试数据
        setupTestData();
        
        // 执行查询
        mockMvc.perform(post("/api/query/MOD-STUDENT-FULL")
            .header("Authorization", "Bearer " + getTestToken())
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "page": 1,
                  "pageSize": 20
                }
                """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.count").isNumber());
    }

    @Test
    @DisplayName("应该处理权限过滤")
    void testPermissionFilteringInQuery() throws Exception {
        setupTestData();
        
        // 使用权限受限的用户
        mockMvc.perform(post("/api/query/MOD-STUDENT-FULL")
            .header("Authorization", "Bearer " + getLimitedUserToken())
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "page": 1,
                  "pageSize": 20
                }
                """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }

    private void setupTestData() {
        // 设置测试数据
    }

    private String getTestToken() {
        // 获取测试 Token
        return "test-token";
    }

    private String getLimitedUserToken() {
        // 获取权限受限用户的 Token
        return "limited-user-token";
    }
}
```

### 3.2 API 集成测试

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ApiIntegrationTest {

    @LocalServerPort
    private int port;
    
    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    @DisplayName("应该成功获取模块列表")
    void testGetModuleList() {
        ResponseEntity<String> response = restTemplate
            .withBasicAuth("admin", "password")
            .getForEntity("http://localhost:" + port + "/api/modules", String.class);
        
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().contains("MOD-STUDENT-FULL"));
    }

    @Test
    @DisplayName("应该成功执行查询")
    void testExecuteQuery() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + getTestToken());
        
        String body = """
            {
              "page": 1,
              "pageSize": 20
            }
            """;
        
        HttpEntity<String> request = new HttpEntity<>(body, headers);
        
        ResponseEntity<String> response = restTemplate.postForEntity(
            "http://localhost:" + port + "/api/query/MOD-STUDENT-FULL",
            request,
            String.class
        );
        
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    private String getTestToken() {
        // 获取测试 Token
        return "test-token";
    }
}
```

## 4. 性能测试

### 4.1 性能测试计划

| 测试场景 | 目标 | 工具 |
|---------|------|------|
| 单次查询响应时间 | < 500ms | JMeter |
| 并发查询 (100 并发) | < 1000ms | JMeter |
| 大数据集查询 (10000 条) | < 2000ms | JMeter |
| 缓存命中率 | > 80% | 自定义监控 |

### 4.2 JMeter 测试脚本

```
测试计划: Lumina 性能测试
├── 线程组 (100 并发, 10 分钟)
│   ├── HTTP 请求: POST /api/query/MOD-STUDENT-FULL
│   │   ├── 请求头: Authorization: Bearer ${token}
│   │   ├── 请求体: {"page": 1, "pageSize": 20}
│   │   └── 断言: 响应时间 < 500ms
│   └── 监听器
│       ├── 聚合报告
│       ├── 图表结果
│       └── 响应时间分布
```

### 4.3 性能基准

| 指标 | 目标值 | 实际值 | 状态 |
|------|--------|--------|------|
| 平均响应时间 | < 300ms | - | - |
| 95% 响应时间 | < 500ms | - | - |
| 99% 响应时间 | < 1000ms | - | - |
| 吞吐量 | > 100 req/s | - | - |
| 错误率 | < 0.1% | - | - |

## 5. 安全测试

### 5.1 SQL 注入测试

```java
@Test
@DisplayName("应该防止 SQL 注入")
void testSqlInjectionPrevention() {
    String maliciousInput = "'; DROP TABLE student; --";
    
    // 尝试注入
    assertDoesNotThrow(() -> {
        queryEngineService.executeDynamicQuery(
            maliciousInput,
            new QueryOptions()
        );
    });
}
```

### 5.2 权限绕过测试

```java
@Test
@DisplayName("应该防止权限绕过")
void testPermissionBypass() {
    // 尝试访问无权限的字段
    QueryResult result = queryEngineService.executeDynamicQuery(
        "MOD-STUDENT-FULL",
        new QueryOptions()
    );
    
    // 验证敏感字段被过滤
    result.getData().forEach(record -> {
        assertFalse(record.containsKey("sensitiveField"));
    });
}
```

### 5.3 认证测试

```java
@Test
@DisplayName("应该拒绝未认证请求")
void testUnauthenticatedRequest() throws Exception {
    mockMvc.perform(post("/api/query/MOD-STUDENT-FULL")
        .contentType(MediaType.APPLICATION_JSON)
        .content("{}"))
        .andExpect(status().isUnauthorized());
}
```

## 6. 测试覆盖率

### 6.1 覆盖率目标

| 模块 | 目标 | 实际 |
|------|------|------|
| 查询引擎 | > 85% | - |
| 权限服务 | > 90% | - |
| 转换器服务 | > 80% | - |
| 模块服务 | > 75% | - |
| 总体 | > 80% | - |

### 6.2 生成覆盖率报告

```bash
# 使用 JaCoCo 生成覆盖率报告
mvn clean test jacoco:report

# 查看报告
open target/site/jacoco/index.html
```

## 7. 测试执行计划

### 7.1 测试阶段

| 阶段 | 时间 | 活动 |
|------|------|------|
| 单元测试 | 第 1-2 周 | 编写和执行单元测试 |
| 集成测试 | 第 2-3 周 | 编写和执行集成测试 |
| 性能测试 | 第 3 周 | 性能基准测试 |
| 安全测试 | 第 3-4 周 | 安全漏洞扫描 |
| 回归测试 | 第 4 周 | 完整回归测试 |
| UAT | 第 5 周 | 用户验收测试 |

### 7.2 测试执行命令

```bash
# 执行所有测试
mvn clean test

# 执行特定测试类
mvn test -Dtest=QueryEngineServiceTest

# 执行特定测试方法
mvn test -Dtest=QueryEngineServiceTest#testExecuteSimpleQuery

# 生成测试报告
mvn surefire-report:report
```

## 8. 缺陷管理

### 8.1 缺陷分类

| 级别 | 说明 | 处理时间 |
|------|------|---------|
| P0 (Critical) | 系统崩溃、数据丢失 | 立即 |
| P1 (High) | 功能不可用、严重错误 | 24 小时 |
| P2 (Medium) | 功能异常、性能问题 | 3 天 |
| P3 (Low) | 界面问题、文档错误 | 1 周 |

### 8.2 缺陷跟踪

使用 Jira 或 GitHub Issues 跟踪缺陷，包括：
- 缺陷描述
- 重现步骤
- 预期结果
- 实际结果
- 附件（截图、日志）

## 9. 总结

本测试计划涵盖了单元测试、集成测试、性能测试和安全测试，确保系统的质量和可靠性。通过系统的测试执行，可以及时发现和修复问题，提高系统的稳定性和用户体验。
