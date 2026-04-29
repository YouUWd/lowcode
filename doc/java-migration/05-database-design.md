# Lumina 动态查询引擎 - MySQL 数据库设计文档

## 1. 数据库概述

### 1.1 数据库架构
本系统采用**双数据库架构**，分离配置数据和业务数据：

| 数据库名 | 用途 | 说明 |
|---------|------|------|
| `lumina_config` | 配置数据库 | 存储模块配置、字段映射、权限配置等元数据 |
| `lumina_business` | 业务数据库 | 存储实际业务数据（学生、班级、成绩等） |

### 1.2 技术规范
- **数据库版本**: MySQL 8.0+
- **字符集**: utf8mb4
- **排序规则**: utf8mb4_unicode_ci
- **存储引擎**: InnoDB
- **事务支持**: 完全支持 ACID
- **外键约束**: 启用

### 1.3 命名规范
- **表名**: 小写字母 + 下划线，如 `sys_module`
- **字段名**: 小写字母 + 下划线，如 `student_no`
- **索引名**: `idx_` + 字段名，如 `idx_module_id`
- **唯一索引**: `uk_` + 字段名，如 `uk_student_no`
- **外键名**: `fk_` + 表名 + 关联表名，如 `fk_student_class`

## 2. 配置数据库 (lumina_config)

### 2.1 sys_module - 模块基本信息表

**表说明**: 定义业务模块的元数据，每个模块代表一个查询视图。

**字段设计**:

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | VARCHAR(50) | PK | 模块唯一标识，如 MOD-STUDENT-FULL |
| module_name | VARCHAR(100) | NOT NULL | 模块名称 |
| module_desc | TEXT | | 模块描述 |
| primary_entity | VARCHAR(50) | NOT NULL | 主实体（主表）名称 |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'active' | 模块状态: active/inactive/archived |
| sort_order | INT | NOT NULL, DEFAULT 0 | 排序顺序 |
| created_by | VARCHAR(50) | | 创建人 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_by | VARCHAR(50) | | 更新人 |
| updated_at | DATETIME | NOT NULL, ON UPDATE | 更新时间 |
| version | INT | NOT NULL, DEFAULT 1 | 版本号（乐观锁） |

**索引设计**:
- PRIMARY KEY: `id`
- INDEX: `idx_status` (status)
- INDEX: `idx_sort_order` (sort_order)
- INDEX: `idx_created_at` (created_at)

**示例数据**:
```sql
INSERT INTO sys_module VALUES
('MOD-STUDENT-FULL', '学生完整信息', '学生完整信息 - 混合 1:1、1:N、N:1 关联', 
 'student', 'active', 1, 'admin', NOW(), 'admin', NOW(), 1);
```

### 2.2 sys_module_entity - 模块关联实体表

**表说明**: 定义模块中涉及的所有实体（表）及其关系类型。

**字段设计**:

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键ID |
| module_id | VARCHAR(50) | NOT NULL, FK | 所属模块ID |
| entity_id | VARCHAR(50) | NOT NULL | 实体唯一标识 |
| entity_name | VARCHAR(50) | NOT NULL | 实体（表）名称 |
| entity_desc | TEXT | | 实体描述 |
| join_left_field | VARCHAR(50) | | 关联左字段（关联表中的字段） |
| join_right_field | VARCHAR(50) | | 关联右字段（主表中的字段） |
| entity_status | VARCHAR(20) | NOT NULL, DEFAULT '正常' | 实体状态 |
| relation_type | VARCHAR(10) | | 关系类型: 1:1, N:1, 1:N |
| sort_order | INT | NOT NULL, DEFAULT 0 | 排序顺序 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | NOT NULL, ON UPDATE | 更新时间 |

**索引设计**:
- PRIMARY KEY: `id`
- UNIQUE KEY: `uk_module_entity` (module_id, entity_id)
- INDEX: `idx_module_id` (module_id)
- INDEX: `idx_entity_name` (entity_name)
- INDEX: `idx_relation_type` (relation_type)
- FOREIGN KEY: `fk_module_entity_module` (module_id) → sys_module(id)

**关系类型说明**:
- **1:1**: 一对一关系
- **N:1**: 多对一关系（主表通过外键关联到关联表）
- **1:N**: 一对多关系（关联表通过外键关联到主表）

**JOIN 字段语义**:
- `join_left_field`: 关联表中的字段
- `join_right_field`: 主表中的字段
- 示例: `class.id = student.class_id`
  - join_left_field = "id" (class 表的字段)
  - join_right_field = "class_id" (student 表的字段)

**示例数据**:
```sql
-- MOD-STUDENT-FULL 的 N:1 关系: student → class
INSERT INTO sys_module_entity VALUES
(1, 'MOD-STUDENT-FULL', 'E001', 'class', '班级信息', 
 'id', 'class_id', '正常', 'N:1', 1, NOW(), NOW());

-- MOD-STUDENT-FULL 的 1:N 关系: student ← score
INSERT INTO sys_module_entity VALUES
(2, 'MOD-STUDENT-FULL', 'E002', 'score', '成绩记录', 
 'student_id', 'id', '正常', '1:N', 2, NOW(), NOW());
```

### 2.3 sys_module_field - 模块字段配置表

**表说明**: 定义模块中的逻辑字段及其与物理字段的映射关系。

**字段设计**:

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键ID |
| module_id | VARCHAR(50) | NOT NULL, FK | 所属模块ID |
| field_id | VARCHAR(50) | NOT NULL | 字段唯一标识 |
| display_name | VARCHAR(100) | NOT NULL | 字段显示名称 |
| logical_field | VARCHAR(50) | NOT NULL | 逻辑字段名（驼峰格式） |
| source_mapping | JSON | NOT NULL | 物理字段映射（JSON数组） |
| transformer | TEXT | | 转换表达式 |
| transformer_env | VARCHAR(20) | NOT NULL, DEFAULT 'none' | 转换环境 |
| render_icon | VARCHAR(50) | | 渲染图标 |
| render_type | VARCHAR(20) | | 渲染类型 |
| sort_order | INT | NOT NULL, DEFAULT 0 | 排序顺序 |
| is_visible | TINYINT(1) | NOT NULL, DEFAULT 1 | 是否可见 |
| is_required | TINYINT(1) | NOT NULL, DEFAULT 0 | 是否必填 |
| default_value | VARCHAR(255) | | 默认值 |
| validation_rule | TEXT | | 验证规则 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | NOT NULL, ON UPDATE | 更新时间 |

**索引设计**:
- PRIMARY KEY: `id`
- UNIQUE KEY: `uk_module_field` (module_id, field_id)
- INDEX: `idx_module_id` (module_id)
- INDEX: `idx_logical_field` (logical_field)
- INDEX: `idx_transformer_env` (transformer_env)
- INDEX: `idx_is_visible` (is_visible)
- FOREIGN KEY: `fk_module_field_module` (module_id) → sys_module(id)
- CHECK: `transformer_env` IN ('database', 'frontend', 'none')

**source_mapping JSON 格式**:
```json
[
  {
    "entity": "student",
    "field": "student_no",
    "sort_order": 1
  }
]
```

**transformer_env 说明**:
- **database**: 数据库级转换，在 SQL 中计算
- **frontend**: 前端级转换，在应用层计算
- **none**: 无转换，直接映射

**示例数据**:
```sql
-- 简单映射字段
INSERT INTO sys_module_field VALUES
(1, 'MOD-STUDENT-FULL', 'F001', '学号', 'studentNo',
 '[{"entity":"student","field":"student_no","sort_order":1}]',
 NULL, 'none', 'icon-id', 'text', 1, 1, 0, NULL, NULL, NOW(), NOW());

-- 前端转换字段
INSERT INTO sys_module_field VALUES
(2, 'MOD-STUDENT-FULL', 'F002', '姓名', 'fullName',
 '[{"entity":"student","field":"last_name","sort_order":1},{"entity":"student","field":"first_name","sort_order":2}]',
 'CONCAT(${last_name}, ${first_name})', 'frontend', 'icon-user', 'text', 2, 1, 0, NULL, NULL, NOW(), NOW());

-- 数据库转换字段
INSERT INTO sys_module_field VALUES
(3, 'MOD-STUDENT-FULL', 'F003', '出生日期', 'birthDate',
 '[{"entity":"student","field":"birth_date","sort_order":1}]',
 'DATE_FORMAT(birth_date, "%Y年%m月%d日")', 'database', 'icon-calendar', 'date', 3, 1, 0, NULL, NULL, NOW(), NOW());
```

### 2.4 sys_permission_config - 权限配置表

**表说明**: 定义字段级的细粒度权限控制。

**字段设计**:

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键ID |
| permission_node | VARCHAR(200) | NOT NULL, UNIQUE | 权限节点 |
| entity | VARCHAR(50) | NOT NULL | 实体（表）名称 |
| field_name | VARCHAR(50) | NOT NULL | 物理字段名称 |
| operation_type | VARCHAR(20) | NOT NULL | 操作类型 |
| enabled | TINYINT(1) | NOT NULL, DEFAULT 1 | 是否启用 |
| module_id | VARCHAR(50) | | 所属模块ID |
| logical_field | VARCHAR(50) | | 逻辑字段名 |
| description | TEXT | | 权限描述 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | NOT NULL, ON UPDATE | 更新时间 |

**索引设计**:
- PRIMARY KEY: `id`
- UNIQUE KEY: `uk_permission_node` (permission_node)
- INDEX: `idx_entity` (entity)
- INDEX: `idx_field_name` (field_name)
- INDEX: `idx_operation_type` (operation_type)
- INDEX: `idx_module_id` (module_id)
- INDEX: `idx_enabled` (enabled)
- CHECK: `operation_type` IN ('READ', 'CREATE', 'UPDATE')

**权限节点格式**: `{entity}.{field}.{operation}`

**示例数据**:
```sql
INSERT INTO sys_permission_config VALUES
(1, 'student.student_no.READ', 'student', 'student_no', 'READ', 
 1, 'MOD-STUDENT-FULL', 'studentNo', '学号读取权限', NOW(), NOW());
```

### 2.5 sys_dictionary - 数据字典表

**表说明**: 存储系统字典数据，用于 DICT_MAP 转换。

**字段设计**:

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键ID |
| dict_code | VARCHAR(50) | NOT NULL | 字典编码 |
| dict_name | VARCHAR(100) | NOT NULL | 字典名称 |
| dict_value | VARCHAR(50) | NOT NULL | 字典值 |
| dict_label | VARCHAR(100) | NOT NULL | 字典标签 |
| sort_order | INT | NOT NULL, DEFAULT 0 | 排序顺序 |
| is_default | TINYINT(1) | NOT NULL, DEFAULT 0 | 是否默认值 |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'active' | 状态 |
| remark | TEXT | | 备注 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | NOT NULL, ON UPDATE | 更新时间 |

**索引设计**:
- PRIMARY KEY: `id`
- UNIQUE KEY: `uk_dict_code_value` (dict_code, dict_value)
- INDEX: `idx_dict_code` (dict_code)
- INDEX: `idx_status` (status)

**示例数据**:
```sql
INSERT INTO sys_dictionary VALUES
(1, 'GENDER', '性别', '1', '男', 1, 0, 'active', NULL, NOW(), NOW()),
(2, 'GENDER', '性别', '2', '女', 2, 0, 'active', NULL, NOW(), NOW());
```

### 2.6 sys_audit_log - 审计日志表

**表说明**: 记录所有数据变更操作，满足审计合规要求。

**字段设计**:

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键ID |
| module_id | VARCHAR(50) | | 模块ID |
| operation_type | VARCHAR(20) | NOT NULL | 操作类型 |
| entity_name | VARCHAR(50) | | 实体（表）名称 |
| entity_id | VARCHAR(100) | | 实体记录ID |
| user_id | VARCHAR(50) | | 操作用户ID |
| user_name | VARCHAR(100) | | 操作用户名 |
| ip_address | VARCHAR(50) | | IP地址 |
| request_url | VARCHAR(500) | | 请求URL |
| request_method | VARCHAR(10) | | 请求方法 |
| request_params | JSON | | 请求参数 |
| old_value | JSON | | 变更前的值 |
| new_value | JSON | | 变更后的值 |
| execution_time | INT | | 执行时间（毫秒） |
| status | VARCHAR(20) | NOT NULL | 状态 |
| error_message | TEXT | | 错误信息 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**索引设计**:
- PRIMARY KEY: `id`
- INDEX: `idx_module_id` (module_id)
- INDEX: `idx_operation_type` (operation_type)
- INDEX: `idx_entity_name` (entity_name)
- INDEX: `idx_user_id` (user_id)
- INDEX: `idx_created_at` (created_at)
- INDEX: `idx_status` (status)

## 3. 业务数据库 (lumina_business)

### 3.1 student - 学生信息表

**字段设计**:

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键ID |
| student_no | VARCHAR(20) | NOT NULL, UNIQUE | 学号 |
| last_name | VARCHAR(50) | NOT NULL | 姓 |
| first_name | VARCHAR(50) | NOT NULL | 名 |
| gender | TINYINT | | 性别: 1-男, 2-女 |
| birth_date | DATE | | 出生日期 |
| class_id | BIGINT | FK | 班级ID |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'active' | 状态 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | NOT NULL, ON UPDATE | 更新时间 |

**索引设计**:
- PRIMARY KEY: `id`
- UNIQUE KEY: `uk_student_no` (student_no)
- INDEX: `idx_class_id` (class_id)
- INDEX: `idx_status` (status)
- FOREIGN KEY: `fk_student_class` (class_id) → class(id)

### 3.2 class - 班级信息表

**字段设计**:

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键ID |
| class_code | VARCHAR(20) | NOT NULL, UNIQUE | 班级编号 |
| class_name | VARCHAR(100) | NOT NULL | 班级名称 |
| grade_level | VARCHAR(20) | | 年级 |
| student_count | INT | NOT NULL, DEFAULT 0 | 学生人数 |
| head_teacher | VARCHAR(50) | | 班主任 |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'active' | 状态 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | NOT NULL, ON UPDATE | 更新时间 |

### 3.3 course - 课程信息表

**字段设计**:

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键ID |
| course_code | VARCHAR(20) | NOT NULL, UNIQUE | 课程编号 |
| course_name | VARCHAR(100) | NOT NULL | 课程名称 |
| credits | DECIMAL(3,1) | | 学分 |
| course_type | VARCHAR(20) | | 课程类型 |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'active' | 状态 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | NOT NULL, ON UPDATE | 更新时间 |

### 3.4 score - 成绩记录表

**字段设计**:

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键ID |
| student_id | BIGINT | NOT NULL, FK | 学生ID |
| course_id | BIGINT | NOT NULL, FK | 课程ID |
| semester | VARCHAR(20) | NOT NULL | 学期 |
| score | DECIMAL(5,2) | | 分数 |
| grade_level | VARCHAR(2) | | 等级 |
| exam_date | DATE | | 考试日期 |
| exam_type | VARCHAR(20) | | 考试类型 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | NOT NULL, ON UPDATE | 更新时间 |

**索引设计**:
- PRIMARY KEY: `id`
- INDEX: `idx_student_id` (student_id)
- INDEX: `idx_course_id` (course_id)
- INDEX: `idx_semester` (semester)
- INDEX: `idx_exam_date` (exam_date)
- FOREIGN KEY: `fk_score_student` (student_id) → student(id)
- FOREIGN KEY: `fk_score_course` (course_id) → course(id)

## 4. 数据库关系图

```
配置数据库 (lumina_config):
┌─────────────────┐
│  sys_module     │
│  (模块信息)      │
└────────┬────────┘
         │ 1:N
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌──────────────────┐
│ sys_module_     │  │ sys_module_field │
│ entity          │  │ (字段配置)        │
│ (实体关系)       │  └──────────────────┘
└─────────────────┘
         │
         │ 引用
         ▼
┌─────────────────┐
│ sys_permission_ │
│ config          │
│ (权限配置)       │
└─────────────────┘

业务数据库 (lumina_business):
┌─────────────┐
│   class     │
│  (班级)      │
└──────┬──────┘
       │ 1:N
       ▼
┌─────────────┐      ┌─────────────┐
│  student    │ N:1  │   course    │
│  (学生)      │◄─────┤  (课程)      │
└──────┬──────┘      └──────┬──────┘
       │ 1:N                │ 1:N
       └────────┬───────────┘
                ▼
         ┌─────────────┐
         │   score     │
         │  (成绩)      │
         └─────────────┘
```

## 5. 性能优化建议

### 5.1 索引优化
- 为所有外键字段创建索引
- 为常用查询条件字段创建索引
- 为排序字段创建索引
- 考虑创建复合索引

### 5.2 分区策略
对于大表（如 sys_audit_log），可以考虑按时间分区：
```sql
ALTER TABLE sys_audit_log
PARTITION BY RANGE (YEAR(created_at)) (
  PARTITION p2024 VALUES LESS THAN (2025),
  PARTITION p2025 VALUES LESS THAN (2026),
  PARTITION p2026 VALUES LESS THAN (2027)
);
```

### 5.3 查询优化
- 使用 EXPLAIN 分析查询计划
- 避免 SELECT *，只查询需要的字段
- 合理使用 JOIN，避免过多的表关联
- 使用缓存减少数据库访问

## 6. 备份与恢复

### 6.1 备份策略
```bash
# 全量备份
mysqldump -u root -p --databases lumina_config lumina_business > backup.sql

# 增量备份（启用二进制日志）
mysqlbinlog --start-datetime="2024-01-01 00:00:00" \
            --stop-datetime="2024-01-02 00:00:00" \
            mysql-bin.000001 > incremental.sql
```

### 6.2 恢复策略
```bash
# 恢复数据库
mysql -u root -p < backup.sql
```

## 7. 安全建议

### 7.1 用户权限
```sql
-- 创建应用用户（只读权限）
CREATE USER 'lumina_readonly'@'%' IDENTIFIED BY 'password';
GRANT SELECT ON lumina_config.* TO 'lumina_readonly'@'%';
GRANT SELECT ON lumina_business.* TO 'lumina_readonly'@'%';

-- 创建应用用户（读写权限）
CREATE USER 'lumina_app'@'%' IDENTIFIED BY 'password';
GRANT SELECT, INSERT, UPDATE, DELETE ON lumina_config.* TO 'lumina_app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON lumina_business.* TO 'lumina_app'@'%';
```

### 7.2 数据加密
- 启用 SSL 连接
- 敏感字段使用 AES 加密
- 定期更换密码

## 8. 监控指标

### 8.1 关键指标
- 查询响应时间
- 慢查询数量
- 连接数
- 缓存命中率
- 磁盘使用率

### 8.2 监控工具
- MySQL Enterprise Monitor
- Prometheus + Grafana
- Percona Monitoring and Management (PMM)
