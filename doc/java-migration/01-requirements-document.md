# Lumina 动态查询引擎 - 需求文档

## 1. 项目概述

### 1.1 项目背景
Lumina 是一个基于配置驱动的动态查询引擎，支持通过元数据配置实现灵活的数据查询、字段映射、权限控制和数据转换。

### 1.2 项目目标
将现有的 NestJS + Knex 实现迁移到 Java + Spring Boot + jOOQ 架构，保持功能完全一致。

### 1.3 核心价值
- **配置驱动**：通过元数据配置实现业务逻辑，无需编写代码
- **动态查询**：支持复杂的多表关联查询（1:1、N:1、1:N）
- **权限控制**：细粒度的字段级权限控制
- **数据转换**：支持数据库级和应用级的数据转换

## 2. 功能需求

### 2.1 核心功能模块

#### 2.1.1 模块管理
**功能描述**：管理业务模块的元数据配置

**核心实体**：
- **sys_module**：模块基本信息
  - `id`：模块唯一标识（如 MOD-STUDENT-FULL）
  - `module_name`：模块名称
  - `module_desc`：模块描述
  - `primary_entity`：主实体名称
  - `status`：模块状态

- **sys_module_entity**：模块关联实体配置
  - `module_id`：所属模块
  - `entity_name`：实体（表）名称
  - `relation_type`：关系类型（1:1、N:1、1:N）
  - `join_left_field`：关联左字段
  - `join_right_field`：关联右字段

- **sys_module_field**：模块字段配置
  - `module_id`：所属模块
  - `logical_field`：逻辑字段名
  - `display_name`：显示名称
  - `source_mapping`：物理字段映射（JSON）
  - `transformer`：转换表达式
  - `transformer_env`：转换环境（database/frontend/none）
  - `is_visible`：是否可见

**业务规则**：
1. 主实体必须能直接连接到其他实体（不能通过中间表）
2. 1:N 关系的子表只能访问自己的字段
3. 字段命名使用驼峰格式（如 studentNo）

#### 2.1.2 动态查询引擎
**功能描述**：根据模块配置动态生成并执行 SQL 查询

**查询类型**：
1. **主查询**：查询主实体及其 1:1/N:1 关联实体
2. **子查询**：查询 1:N 关联的子实体数据

**查询流程**：
```
1. 加载模块配置
2. 应用权限过滤
3. 分离关系类型（1:1/N:1 vs 1:N）
4. 执行主查询（包含 LEFT JOIN）
5. 执行子查询（针对每个 1:N 关系）
6. 应用数据转换
7. 组装最终结果
```

**字段选择规则**：

| 字段类型 | transformer_env | SQL 别名格式 | 示例 |
|---------|----------------|------------|------|
| 数据库转换 | `database` | `${logicalField}` | `strftime(...) AS birthDate` |
| 前端转换 | `frontend` | `${entity}_${field}` | `student.gender AS student_gender` |
| 简单映射 | `none` | `${entity}_${field}` | `score.semester AS score_semester` |

**数据转换处理**：
1. **数据库转换**：直接从 `row[logicalField]` 获取
2. **简单映射**：从 `row[${entity}_${field}]` 映射到 `logicalField`
3. **前端转换**：从 `row[${entity}_${field}]` 获取值，应用转换函数

#### 2.1.3 权限控制
**功能描述**：实现字段级的细粒度权限控制

**权限模型**：
- **权限节点格式**：`{entity}.{field}.{operation}`
  - 示例：`student.student_no.READ`
- **操作类型**：
  - `READ`：读取权限
  - `CREATE`：创建时写入权限
  - `UPDATE`：更新时写入权限

**权限实体**：
- **sys_permission_config**：权限配置表
  - `permission_node`：权限节点
  - `entity`：实体名称
  - `field_name`：字段名称
  - `operation_type`：操作类型
  - `module_id`：所属模块
  - `logical_field`：逻辑字段名
  - `enabled`：是否启用

**权限过滤规则**：
1. 主查询和子查询都需要应用权限过滤
2. 如果字段的所有物理字段都有 READ 权限，则保留该字段
3. 如果主查询没有任何可访问字段，返回空结果
4. 如果子查询没有任何可访问字段，跳过该子查询

#### 2.1.4 数据转换器
**功能描述**：支持多种数据转换函数

**转换器类型**：

1. **数据库级转换**（`transformer_env: database`）
   - `DATE_FORMAT(field, format)`：日期格式化
   - `TIMESTAMPDIFF(unit, field, NOW())`：时间差计算
   - 在 SQL 查询中直接计算

2. **前端级转换**（`transformer_env: frontend`）
   - `DICT_MAP(dictCode, value)`：字典映射
   - `CONCAT(str1, str2, ...)`：字符串拼接
   - `MASK_SENSITIVE(value, mode)`：敏感数据脱敏
   - `ASSEMBLE_FRACTION(current, max)`：分数格式化
   - `ASSEMBLE_PERF_SUMMARY(score, grade)`：性能总结
   - 在应用层计算

**转换器语法**：
- 使用 `${fieldName}` 引用物理字段
- 示例：`CONCAT(${last_name}, ${first_name})`
- 示例：`DICT_MAP("GENDER", ${gender})`

### 2.2 API 接口需求

#### 2.2.1 查询接口
```
GET /api/query/{moduleId}
```

**请求参数**：
- `page`（可选）：页码
- `pageSize`（可选）：每页大小

**响应格式**：
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "studentNo": "2024001",
      "fullName": "张伟",
      "genderText": "男",
      "birthDate": "2008年05月15日",
      "age": 16,
      "className": "高一(1)班",
      "scores": [
        {
          "semester": "2024-1",
          "scoreValue": 85,
          "scoreDisplay": "85分 (A)",
          "examDate": "2024-01-15"
        }
      ]
    }
  ],
  "count": 10
}
```

#### 2.2.2 权限管理接口
```
GET /api/permissions/{moduleId}
POST /api/permissions/{moduleId}
```

#### 2.2.3 模块管理接口
```
GET /api/modules
GET /api/modules/{moduleId}
POST /api/modules
PUT /api/modules/{moduleId}
```

## 3. 非功能需求

### 3.1 性能要求
- 单次查询响应时间 < 500ms（1000 条记录）
- 支持分页查询
- 数据库连接池管理

### 3.2 可扩展性
- 支持添加新的转换器函数
- 支持多种数据库（SQLite、MySQL、PostgreSQL）
- 支持自定义权限策略

### 3.3 可维护性
- 清晰的代码结构
- 完善的日志记录
- 单元测试覆盖率 > 80%

### 3.4 安全性
- SQL 注入防护
- 权限验证
- 敏感数据脱敏

## 4. 技术约束

### 4.1 开发环境
- Java 17+
- Spring Boot 3.x
- jOOQ 3.x
- Maven/Gradle

### 4.2 数据库
- 主要支持：SQLite（开发）、MySQL（生产）
- 使用 jOOQ 进行类型安全的 SQL 构建

### 4.3 依赖库
- Spring Boot Starter Web
- Spring Boot Starter Data JPA（可选）
- jOOQ
- Jackson（JSON 处理）
- Lombok（简化代码）

## 5. 数据模型

### 5.1 配置数据库（config.db）

#### sys_module
```sql
CREATE TABLE sys_module (
    id VARCHAR(50) PRIMARY KEY,
    module_name VARCHAR(100) NOT NULL,
    module_desc TEXT,
    primary_entity VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    sort_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### sys_module_entity
```sql
CREATE TABLE sys_module_entity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    entity_name VARCHAR(50) NOT NULL,
    entity_desc TEXT,
    join_left_field VARCHAR(50),
    join_right_field VARCHAR(50),
    entity_status VARCHAR(20),
    relation_type VARCHAR(10),
    sort_order INTEGER,
    FOREIGN KEY (module_id) REFERENCES sys_module(id)
);
```

#### sys_module_field
```sql
CREATE TABLE sys_module_field (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id VARCHAR(50) NOT NULL,
    field_id VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    logical_field VARCHAR(50) NOT NULL,
    source_mapping TEXT,
    transformer TEXT,
    transformer_env VARCHAR(20),
    render_icon VARCHAR(50),
    render_type VARCHAR(20),
    sort_order INTEGER,
    is_visible INTEGER DEFAULT 1,
    FOREIGN KEY (module_id) REFERENCES sys_module(id)
);
```

#### sys_permission_config
```sql
CREATE TABLE sys_permission_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    permission_node VARCHAR(200) NOT NULL UNIQUE,
    entity VARCHAR(50) NOT NULL,
    field_name VARCHAR(50) NOT NULL,
    operation_type VARCHAR(20) NOT NULL,
    enabled INTEGER DEFAULT 1,
    module_id VARCHAR(50),
    logical_field VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5.2 业务数据库（business.db）

根据实际业务需求定义，示例：

```sql
CREATE TABLE student (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_no VARCHAR(20) UNIQUE NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    gender INTEGER,
    birth_date DATE,
    class_id INTEGER
);

CREATE TABLE class (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_code VARCHAR(20) UNIQUE NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    grade_level VARCHAR(20),
    student_count INTEGER DEFAULT 0
);

CREATE TABLE score (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    semester VARCHAR(20),
    score DECIMAL(5,2),
    grade_level VARCHAR(2),
    exam_date DATE,
    FOREIGN KEY (student_id) REFERENCES student(id)
);
```

## 6. 示例场景

### 6.1 学生完整信息查询（MOD-STUDENT-FULL）

**模块配置**：
- 主实体：`student`
- N:1 关系：`class`（通过 student.class_id）
- 1:N 关系：`score`（通过 score.student_id）

**字段配置**：
- `studentNo`：简单映射（student.student_no）
- `fullName`：前端转换（CONCAT(last_name, first_name)）
- `genderText`：前端转换（DICT_MAP("GENDER", gender)）
- `birthDate`：数据库转换（DATE_FORMAT）
- `age`：数据库转换（TIMESTAMPDIFF）
- `className`：简单映射（class.class_name）
- `scores`：1:N 关系数组
  - `semester`：简单映射（score.semester）
  - `scoreValue`：简单映射（score.score）
  - `scoreDisplay`：前端转换（CONCAT）

**生成的 SQL**：
```sql
-- 主查询
SELECT 
  student.id,
  student.student_no AS student_student_no,
  student.last_name AS student_last_name,
  student.first_name AS student_first_name,
  student.gender AS student_gender,
  strftime('%Y年%m月%d日', student.birth_date) AS birthDate,
  CAST((julianday('now') - julianday(student.birth_date)) / 365.25 AS INTEGER) AS age,
  class.class_name AS class_class_name,
  class.grade_level AS class_grade_level
FROM student
LEFT JOIN class ON class.id = student.class_id;

-- 子查询
SELECT 
  score.semester AS score_semester,
  score.score AS score_score,
  score.grade_level AS score_grade_level,
  score.exam_date AS score_exam_date,
  score.student_id
FROM score
WHERE score.student_id IN (1, 2, 3, ...);
```

## 7. 验收标准

### 7.1 功能验收
- [ ] 支持配置驱动的动态查询
- [ ] 支持 1:1、N:1、1:N 关系查询
- [ ] 支持字段级权限控制
- [ ] 支持数据库级和应用级转换
- [ ] 支持分页查询

### 7.2 性能验收
- [ ] 单次查询响应时间 < 500ms
- [ ] 支持 1000+ 条记录查询
- [ ] 内存使用合理

### 7.3 代码质量
- [ ] 单元测试覆盖率 > 80%
- [ ] 代码符合 Java 规范
- [ ] 完善的错误处理
- [ ] 清晰的日志输出

## 8. 项目里程碑

### Phase 1：基础架构（2周）
- 搭建 Spring Boot 项目
- 配置 jOOQ 代码生成
- 实现数据库连接管理
- 实现基础的模块加载

### Phase 2：查询引擎（3周）
- 实现主查询逻辑
- 实现子查询逻辑
- 实现字段映射
- 实现 SQL 构建

### Phase 3：权限控制（1周）
- 实现权限模型
- 实现权限过滤
- 实现权限管理接口

### Phase 4：数据转换（2周）
- 实现数据库级转换
- 实现前端级转换
- 实现转换器扩展机制

### Phase 5：测试与优化（2周）
- 单元测试
- 集成测试
- 性能优化
- 文档完善

## 9. 风险与挑战

### 9.1 技术风险
- jOOQ 动态 SQL 构建的复杂性
- 多数据库兼容性问题
- 性能优化挑战

### 9.2 业务风险
- 配置复杂度高
- 权限模型理解成本
- 数据转换逻辑迁移

### 9.3 应对措施
- 充分的技术预研
- 完善的文档和示例
- 分阶段迭代开发
- 持续的代码审查
