# 多模块系统设计规划

## 概述
设计 5 个模块，分别对应不同的数据关系类型，每个模块都包含前端和数据库层面的转换函数。

---

## 模块规划

### 模块 1: MOD-COURSE-BASIC（只有主实体）
**场景**: 课程基本信息 - 无关联实体

**业务表**:
- `course` (主表)
  - id, course_code, course_name, credits, description, status

**字段配置** (4 个字段):
1. `courseCode` - 课程编号 (course.course_code)
2. `courseName` - 课程名称 (course.course_name)
3. `credits` - 学分 (course.credits)
4. `courseStatus` - 课程状态 (course.status) - 需要转换函数

**转换函数**:
- Frontend: `DICT_MAP("COURSE_STATUS", ${status})` - 状态字典映射
- Database: 无需数据库层转换

**权限节点**: 
- course.course_code.READ/CREATE/UPDATE
- course.course_name.READ/CREATE/UPDATE
- course.credits.READ/CREATE/UPDATE
- course.status.READ/CREATE/UPDATE

---

### 模块 2: MOD-TEACHER-PROFILE（1:1 关联实体）
**场景**: 教师档案 - 教师与部门一对一关系

**业务表**:
- `teacher` (主表)
  - id, teacher_code, first_name, last_name, email, phone, hire_date, department_id
- `department` (1:1 关联)
  - id, department_code, department_name, location

**关联配置**:
- 关系: teacher.department_id = department.id
- 类型: N:1 (多个教师对应一个部门)

**字段配置** (8 个字段):
1. `teacherCode` - 工号 (teacher.teacher_code)
2. `fullName` - 姓名 (teacher.last_name + teacher.first_name) - 需要转换
3. `email` - 邮箱 (teacher.email)
4. `phone` - 电话 (teacher.phone)
5. `hireDate` - 入职日期 (teacher.hire_date) - 需要日期格式转换
6. `departmentCode` - 部门编号 (department.department_code)
7. `departmentName` - 部门名称 (department.department_name)
8. `location` - 部门位置 (department.location)

**转换函数**:
- Frontend: 
  - `CONCAT(${last_name}, ${first_name})` - 姓名拼接
  - `DATE_FORMAT(${hire_date}, "YYYY-MM-DD")` - 日期格式化
- Database:
  - `CONCAT(last_name, first_name)` - SQL 层姓名拼接

**权限节点**: 
- teacher.* (6 个字段)
- department.* (2 个字段)

---

### 模块 3: MOD-CLASS-STUDENTS（1:N 关联实体）
**场景**: 班级学生列表 - 班级与学生一对多关系

**业务表**:
- `class` (主表)
  - id, class_code, class_name, grade_level, head_teacher_id, capacity
- `student` (1:N 关联)
  - id, student_no, first_name, last_name, gender, birth_date, status, class_id

**关联配置**:
- 关系: class.id = student.class_id
- 类型: 1:N (一个班级对应多个学生)
- 查询方式: 嵌套数组结构

**字段配置** (主表 4 个 + 子表 5 个):

**主表字段**:
1. `classCode` - 班级编号 (class.class_code)
2. `className` - 班级名称 (class.class_name)
3. `gradeLevel` - 年级 (class.grade_level)
4. `capacity` - 班级容量 (class.capacity)

**子表字段** (students 数组):
5. `studentNo` - 学号 (student.student_no)
6. `studentName` - 学生姓名 (student.last_name + student.first_name) - 需要转换
7. `gender` - 性别 (student.gender) - 需要转换
8. `birthDate` - 出生日期 (student.birth_date) - 需要日期转换
9. `studentStatus` - 学生状态 (student.status) - 需要转换

**转换函数**:
- Frontend:
  - `CONCAT(${last_name}, ${first_name})` - 学生姓名拼接
  - `DICT_MAP("GENDER", ${gender})` - 性别字典映射
  - `DICT_MAP("STUDENT_STATUS", ${status})` - 学生状态映射
  - `DATE_FORMAT(${birth_date}, "YYYY-MM-DD")` - 出生日期格式化
- Database:
  - `CONCAT(last_name, first_name)` - SQL 层学生姓名拼接
  - `CASE WHEN gender = 1 THEN '男' ELSE '女' END` - 性别转换

**权限节点**: 
- class.* (4 个字段)
- student.* (5 个字段)

---

### 模块 4: MOD-STUDENT-COURSES（N:1 关联实体）
**场景**: 学生课程列表 - 学生与课程多对一关系

**业务表**:
- `student` (主表)
  - id, student_no, first_name, last_name, class_id, status
- `course` (N:1 关联)
  - id, course_code, course_name, credits
- `enrollment` (中间表)
  - id, student_id, course_id, enrollment_date, status

**关联配置**:
- 关系: student.id = enrollment.student_id, enrollment.course_id = course.id
- 类型: N:1 (多个学生选修一门课程)
- 查询方式: 平铺列表（每行一个学生-课程组合）

**字段配置** (主表 3 个 + 关联表 5 个):

**主表字段**:
1. `studentNo` - 学号 (student.student_no)
2. `studentName` - 学生姓名 (student.last_name + student.first_name) - 需要转换
3. `studentStatus` - 学生状态 (student.status) - 需要转换

**关联表字段**:
4. `courseCode` - 课程编号 (course.course_code)
5. `courseName` - 课程名称 (course.course_name)
6. `credits` - 学分 (course.credits)
7. `enrollmentDate` - 选课日期 (enrollment.enrollment_date) - 需要日期转换
8. `enrollmentStatus` - 选课状态 (enrollment.status) - 需要转换

**转换函数**:
- Frontend:
  - `CONCAT(${last_name}, ${first_name})` - 学生姓名拼接
  - `DICT_MAP("STUDENT_STATUS", ${student_status})` - 学生状态映射
  - `DICT_MAP("ENROLLMENT_STATUS", ${enrollment_status})` - 选课状态映射
  - `DATE_FORMAT(${enrollment_date}, "YYYY-MM-DD")` - 选课日期格式化
- Database:
  - `CONCAT(s.last_name, s.first_name)` - SQL 层学生姓名拼接
  - `CASE WHEN e.status = 1 THEN '已选' ELSE '已退' END` - 选课状态转换

**权限节点**: 
- student.* (3 个字段)
- course.* (3 个字段)
- enrollment.* (2 个字段)

---

### 模块 5: MOD-STUDENT-SCORE-FULL（混合 1:1、1:N、N:1）
**场景**: 学生成绩完整视图 - 包含班级(N:1)、成绩(1:N)、课程(N:1)

**业务表**:
- `student` (主表)
  - id, student_no, first_name, last_name, class_id, status
- `class` (N:1 关联)
  - id, class_code, class_name, grade_level
- `score` (1:N 关联)
  - id, student_id, course_id, semester, score, grade_level, exam_date
- `course` (N:1 关联，通过 score)
  - id, course_code, course_name, credits

**关联配置**:
- 主表: student
- N:1 关联: student.class_id = class.id
- 1:N 关联: student.id = score.student_id
- N:1 关联: score.course_id = course.id

**字段配置** (主表 3 个 + N:1 关联 2 个 + 1:N 子表 6 个):

**主表字段**:
1. `studentNo` - 学号 (student.student_no)
2. `studentName` - 学生姓名 (student.last_name + student.first_name) - 需要转换
3. `studentStatus` - 学生状态 (student.status) - 需要转换

**N:1 关联字段** (班级信息):
4. `classCode` - 班级编号 (class.class_code)
5. `className` - 班级名称 (class.class_name)

**1:N 子表字段** (scores 数组):
6. `semester` - 学期 (score.semester)
7. `courseCode` - 课程编号 (course.course_code)
8. `courseName` - 课程名称 (course.course_name)
9. `scoreValue` - 分数 (score.score)
10. `scoreGrade` - 成绩等级 (score.grade_level) - 需要转换
11. `examDate` - 考试日期 (score.exam_date) - 需要日期转换

**转换函数**:
- Frontend:
  - `CONCAT(${last_name}, ${first_name})` - 学生姓名拼接
  - `DICT_MAP("STUDENT_STATUS", ${student_status})` - 学生状态映射
  - `DICT_MAP("GRADE_LEVEL", ${score_grade})` - 成绩等级映射
  - `DATE_FORMAT(${exam_date}, "YYYY-MM-DD")` - 考试日期格式化
  - `CONCAT(${score}, " (", ${scoreGrade}, ")")` - 成绩显示组合
- Database:
  - `CONCAT(s.last_name, s.first_name)` - SQL 层学生姓名拼接
  - `CASE WHEN sc.score >= 90 THEN 'A' WHEN sc.score >= 80 THEN 'B' ELSE 'C' END` - 成绩等级计算

**权限节点**: 
- student.* (3 个字段)
- class.* (2 个字段)
- score.* (4 个字段)
- course.* (3 个字段)

---

## 数据库表设计

### 新增业务表

```sql
-- 部门表（用于模块 2）
CREATE TABLE department (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  department_code VARCHAR(20) UNIQUE NOT NULL,
  department_name VARCHAR(100) NOT NULL,
  location VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 选课表（用于模块 4）
CREATE TABLE enrollment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  enrollment_date DATE,
  status INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 修改 teacher 表（添加 department_id）
ALTER TABLE teacher ADD COLUMN department_id INTEGER;

-- 修改 class 表（添加 capacity）
ALTER TABLE class ADD COLUMN capacity INTEGER DEFAULT 50;
```

---

## 配置数据库表结构

### sys_module 表 (5 条记录)

| id | module_id | module_name | primary_entity | relation_type |
|----|-----------|-------------|-----------------|---------------|
| 1 | MOD-COURSE-BASIC | 课程基本信息 | course | 无关联 |
| 2 | MOD-TEACHER-PROFILE | 教师档案 | teacher | N:1 |
| 3 | MOD-CLASS-STUDENTS | 班级学生列表 | class | 1:N |
| 4 | MOD-STUDENT-COURSES | 学生课程列表 | student | N:1 |
| 5 | MOD-STUDENT-SCORE-FULL | 学生成绩完整视图 | student | 混合 |

### sys_module_entity 表 (8 条记录)

| id | module_id | entity_name | relation_type |
|----|-----------|-------------|----------------|
| 1 | MOD-TEACHER-PROFILE | department | N:1 |
| 2 | MOD-CLASS-STUDENTS | student | 1:N |
| 3 | MOD-STUDENT-COURSES | course | N:1 |
| 4 | MOD-STUDENT-COURSES | enrollment | N:1 |
| 5 | MOD-STUDENT-SCORE-FULL | class | N:1 |
| 6 | MOD-STUDENT-SCORE-FULL | score | 1:N |
| 7 | MOD-STUDENT-SCORE-FULL | course | N:1 |

### sys_module_field 表 (25 条记录)

每个字段包含:
- source_mapping: JSON 数组，包含 entity、field、sort_order
- transformer: 转换函数表达式
- transformer_env: 'frontend' 或 'backend' 或 'none'

---

## 转换函数规范

### Frontend 转换函数

```javascript
// 字典映射
DICT_MAP("DICT_NAME", ${field_name})

// 日期格式化
DATE_FORMAT(${field_name}, "YYYY-MM-DD")

// 字符串拼接
CONCAT(${field1}, ${field2})

// 条件判断
IF(${field} > 90, "优秀", "良好")

// 组合转换
CONCAT(${score}, " (", ${grade_level}, ")")
```

### Database 转换函数

```sql
-- 字符串拼接
CONCAT(field1, field2)

-- 条件判断
CASE WHEN condition THEN value1 ELSE value2 END

-- 日期格式化
DATE_FORMAT(field, '%Y-%m-%d')

-- 类型转换
CAST(field AS TYPE)
```

---

## 权限配置策略

每个模块的权限节点遵循以下规则:
- 格式: `{entity}.{field}.{operation}`
- 操作类型: READ, CREATE, UPDATE
- 自动去重: 相同的权限节点只生成一次

---

## 实现步骤

1. 创建新业务表 (department, enrollment)
2. 修改现有表 (teacher, class)
3. 插入模块配置数据
4. 插入字段映射数据
5. 自动生成权限配置
6. 测试各模块的查询和转换
