-- ============================================================================
-- Lumina 动态查询引擎 - MySQL 数据库设计
-- 版本: 1.0
-- 数据库: MySQL 8.0+
-- 字符集: utf8mb4
-- 排序规则: utf8mb4_unicode_ci
-- ============================================================================

-- ============================================================================
-- 配置数据库 (lumina_config)
-- 用途: 存储模块配置、字段映射、权限配置等元数据
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `lumina_config` 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

USE `lumina_config`;

-- ----------------------------------------------------------------------------
-- 表: sys_module
-- 描述: 模块基本信息表，定义业务模块的元数据
-- ----------------------------------------------------------------------------
CREATE TABLE `sys_module` (
  `id` VARCHAR(50) NOT NULL COMMENT '模块唯一标识，如 MOD-STUDENT-FULL',
  `module_name` VARCHAR(100) NOT NULL COMMENT '模块名称',
  `module_desc` TEXT COMMENT '模块描述',
  `primary_entity` VARCHAR(50) NOT NULL COMMENT '主实体（主表）名称',
  `status` VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '模块状态: active-启用, inactive-禁用, archived-归档',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序顺序，数字越小越靠前',
  `created_by` VARCHAR(50) COMMENT '创建人',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` VARCHAR(50) COMMENT '更新人',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `version` INT NOT NULL DEFAULT 1 COMMENT '版本号，用于乐观锁',
  PRIMARY KEY (`id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_sort_order` (`sort_order`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='模块基本信息表';

-- ----------------------------------------------------------------------------
-- 表: sys_module_entity
-- 描述: 模块关联实体表，定义模块中涉及的所有实体及其关系
-- ----------------------------------------------------------------------------
CREATE TABLE `sys_module_entity` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `module_id` VARCHAR(50) NOT NULL COMMENT '所属模块ID',
  `entity_id` VARCHAR(50) NOT NULL COMMENT '实体唯一标识',
  `entity_name` VARCHAR(50) NOT NULL COMMENT '实体（表）名称',
  `entity_desc` TEXT COMMENT '实体描述',
  `join_left_field` VARCHAR(50) COMMENT '关联左字段（关联表中的字段）',
  `join_right_field` VARCHAR(50) COMMENT '关联右字段（主表中的字段）',
  `entity_status` VARCHAR(20) NOT NULL DEFAULT '正常' COMMENT '实体状态',
  `relation_type` VARCHAR(10) COMMENT '关系类型: 1:1, N:1, 1:N',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序顺序',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_module_entity` (`module_id`, `entity_id`),
  INDEX `idx_module_id` (`module_id`),
  INDEX `idx_entity_name` (`entity_name`),
  INDEX `idx_relation_type` (`relation_type`),
  CONSTRAINT `fk_module_entity_module` FOREIGN KEY (`module_id`) 
    REFERENCES `sys_module` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='模块关联实体表';

-- ----------------------------------------------------------------------------
-- 表: sys_module_field
-- 描述: 模块字段配置表，定义模块中的逻辑字段及其映射关系
-- ----------------------------------------------------------------------------
CREATE TABLE `sys_module_field` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `module_id` VARCHAR(50) NOT NULL COMMENT '所属模块ID',
  `field_id` VARCHAR(50) NOT NULL COMMENT '字段唯一标识',
  `display_name` VARCHAR(100) NOT NULL COMMENT '字段显示名称',
  `logical_field` VARCHAR(50) NOT NULL COMMENT '逻辑字段名（驼峰格式）',
  `source_mapping` JSON NOT NULL COMMENT '物理字段映射，JSON格式: [{"entity":"student","field":"student_no","sort_order":1}]',
  `transformer` TEXT COMMENT '转换表达式，如: CONCAT(${last_name}, ${first_name})',
  `transformer_env` VARCHAR(20) NOT NULL DEFAULT 'none' COMMENT '转换环境: database-数据库级, frontend-前端级, none-无转换',
  `render_icon` VARCHAR(50) COMMENT '渲染图标',
  `render_type` VARCHAR(20) COMMENT '渲染类型: text, number, date, select等',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序顺序',
  `is_visible` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否可见: 1-可见, 0-隐藏',
  `is_required` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否必填: 1-必填, 0-非必填',
  `default_value` VARCHAR(255) COMMENT '默认值',
  `validation_rule` TEXT COMMENT '验证规则（正则表达式或JSON配置）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_module_field` (`module_id`, `field_id`),
  INDEX `idx_module_id` (`module_id`),
  INDEX `idx_logical_field` (`logical_field`),
  INDEX `idx_transformer_env` (`transformer_env`),
  INDEX `idx_is_visible` (`is_visible`),
  CONSTRAINT `fk_module_field_module` FOREIGN KEY (`module_id`) 
    REFERENCES `sys_module` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_transformer_env` CHECK (`transformer_env` IN ('database', 'frontend', 'none'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='模块字段配置表';

-- ----------------------------------------------------------------------------
-- 表: sys_permission_config
-- 描述: 权限配置表，定义字段级的细粒度权限控制
-- ----------------------------------------------------------------------------
CREATE TABLE `sys_permission_config` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `permission_node` VARCHAR(200) NOT NULL COMMENT '权限节点，格式: {entity}.{field}.{operation}，如: student.student_no.READ',
  `entity` VARCHAR(50) NOT NULL COMMENT '实体（表）名称',
  `field_name` VARCHAR(50) NOT NULL COMMENT '物理字段名称',
  `operation_type` VARCHAR(20) NOT NULL COMMENT '操作类型: READ-读取, CREATE-创建, UPDATE-更新',
  `enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用: 1-启用, 0-禁用',
  `module_id` VARCHAR(50) COMMENT '所属模块ID（可选，用于模块级权限）',
  `logical_field` VARCHAR(50) COMMENT '逻辑字段名',
  `description` TEXT COMMENT '权限描述',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_permission_node` (`permission_node`),
  INDEX `idx_entity` (`entity`),
  INDEX `idx_field_name` (`field_name`),
  INDEX `idx_operation_type` (`operation_type`),
  INDEX `idx_module_id` (`module_id`),
  INDEX `idx_enabled` (`enabled`),
  CONSTRAINT `chk_operation_type` CHECK (`operation_type` IN ('READ', 'CREATE', 'UPDATE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限配置表';

-- ----------------------------------------------------------------------------
-- 表: sys_dictionary
-- 描述: 数据字典表，存储字典类型和字典项
-- ----------------------------------------------------------------------------
CREATE TABLE `sys_dictionary` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `dict_code` VARCHAR(50) NOT NULL COMMENT '字典编码，如: GENDER, EMP_STATUS',
  `dict_name` VARCHAR(100) NOT NULL COMMENT '字典名称',
  `dict_value` VARCHAR(50) NOT NULL COMMENT '字典值，如: 1, M',
  `dict_label` VARCHAR(100) NOT NULL COMMENT '字典标签，如: 男, 在职',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序顺序',
  `is_default` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否默认值: 1-是, 0-否',
  `status` VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态: active-启用, inactive-禁用',
  `remark` TEXT COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_dict_code_value` (`dict_code`, `dict_value`),
  INDEX `idx_dict_code` (`dict_code`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据字典表';

-- ----------------------------------------------------------------------------
-- 表: sys_audit_log
-- 描述: 审计日志表，记录所有数据变更操作
-- ----------------------------------------------------------------------------
CREATE TABLE `sys_audit_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `module_id` VARCHAR(50) COMMENT '模块ID',
  `operation_type` VARCHAR(20) NOT NULL COMMENT '操作类型: SELECT, INSERT, UPDATE, DELETE',
  `entity_name` VARCHAR(50) COMMENT '实体（表）名称',
  `entity_id` VARCHAR(100) COMMENT '实体记录ID',
  `user_id` VARCHAR(50) COMMENT '操作用户ID',
  `user_name` VARCHAR(100) COMMENT '操作用户名',
  `ip_address` VARCHAR(50) COMMENT 'IP地址',
  `request_url` VARCHAR(500) COMMENT '请求URL',
  `request_method` VARCHAR(10) COMMENT '请求方法: GET, POST, PUT, DELETE',
  `request_params` JSON COMMENT '请求参数（JSON格式）',
  `old_value` JSON COMMENT '变更前的值（JSON格式）',
  `new_value` JSON COMMENT '变更后的值（JSON格式）',
  `execution_time` INT COMMENT '执行时间（毫秒）',
  `status` VARCHAR(20) NOT NULL COMMENT '状态: success-成功, failure-失败',
  `error_message` TEXT COMMENT '错误信息',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_module_id` (`module_id`),
  INDEX `idx_operation_type` (`operation_type`),
  INDEX `idx_entity_name` (`entity_name`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审计日志表';

-- ============================================================================
-- 业务数据库 (lumina_business)
-- 用途: 存储实际业务数据
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `lumina_business` 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

USE `lumina_business`;

-- ----------------------------------------------------------------------------
-- 表: student
-- 描述: 学生信息表
-- ----------------------------------------------------------------------------
CREATE TABLE `student` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `student_no` VARCHAR(20) NOT NULL COMMENT '学号',
  `last_name` VARCHAR(50) NOT NULL COMMENT '姓',
  `first_name` VARCHAR(50) NOT NULL COMMENT '名',
  `gender` TINYINT COMMENT '性别: 1-男, 2-女',
  `birth_date` DATE COMMENT '出生日期',
  `class_id` BIGINT COMMENT '班级ID',
  `status` VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态: active-在读, graduated-毕业, suspended-休学',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_student_no` (`student_no`),
  INDEX `idx_class_id` (`class_id`),
  INDEX `idx_status` (`status`),
  CONSTRAINT `fk_student_class` FOREIGN KEY (`class_id`) 
    REFERENCES `class` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生信息表';

-- ----------------------------------------------------------------------------
-- 表: class
-- 描述: 班级信息表
-- ----------------------------------------------------------------------------
CREATE TABLE `class` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `class_code` VARCHAR(20) NOT NULL COMMENT '班级编号',
  `class_name` VARCHAR(100) NOT NULL COMMENT '班级名称',
  `grade_level` VARCHAR(20) COMMENT '年级',
  `student_count` INT NOT NULL DEFAULT 0 COMMENT '学生人数',
  `head_teacher` VARCHAR(50) COMMENT '班主任',
  `status` VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态: active-活跃, archived-归档',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_class_code` (`class_code`),
  INDEX `idx_grade_level` (`grade_level`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='班级信息表';

-- ----------------------------------------------------------------------------
-- 表: course
-- 描述: 课程信息表
-- ----------------------------------------------------------------------------
CREATE TABLE `course` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `course_code` VARCHAR(20) NOT NULL COMMENT '课程编号',
  `course_name` VARCHAR(100) NOT NULL COMMENT '课程名称',
  `credits` DECIMAL(3,1) COMMENT '学分',
  `course_type` VARCHAR(20) COMMENT '课程类型: required-必修, elective-选修',
  `status` VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态: active-开课, inactive-停课',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_course_code` (`course_code`),
  INDEX `idx_course_type` (`course_type`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程信息表';

-- ----------------------------------------------------------------------------
-- 表: score
-- 描述: 成绩记录表
-- ----------------------------------------------------------------------------
CREATE TABLE `score` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `student_id` BIGINT NOT NULL COMMENT '学生ID',
  `course_id` BIGINT NOT NULL COMMENT '课程ID',
  `semester` VARCHAR(20) NOT NULL COMMENT '学期，如: 2024-1',
  `score` DECIMAL(5,2) COMMENT '分数',
  `grade_level` VARCHAR(2) COMMENT '等级: A, B, C, D, F',
  `exam_date` DATE COMMENT '考试日期',
  `exam_type` VARCHAR(20) COMMENT '考试类型: midterm-期中, final-期末, quiz-测验',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_student_id` (`student_id`),
  INDEX `idx_course_id` (`course_id`),
  INDEX `idx_semester` (`semester`),
  INDEX `idx_exam_date` (`exam_date`),
  CONSTRAINT `fk_score_student` FOREIGN KEY (`student_id`) 
    REFERENCES `student` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_score_course` FOREIGN KEY (`course_id`) 
    REFERENCES `course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成绩记录表';

-- ============================================================================
-- 初始化数据
-- ============================================================================

USE `lumina_config`;

-- 插入字典数据
INSERT INTO `sys_dictionary` (`dict_code`, `dict_name`, `dict_value`, `dict_label`, `sort_order`) VALUES
('GENDER', '性别', '1', '男', 1),
('GENDER', '性别', '2', '女', 2),
('EMP_STATUS', '员工状态', '1', '在职', 1),
('EMP_STATUS', '员工状态', '0', '离职', 2),
('PAYMENT_STATUS', '发放状态', '1', '已发放', 1),
('PAYMENT_STATUS', '发放状态', '0', '未发放', 2);

-- ============================================================================
-- 视图定义（可选）
-- ============================================================================

-- 学生完整信息视图
CREATE OR REPLACE VIEW `v_student_full_info` AS
SELECT 
  s.id,
  s.student_no,
  CONCAT(s.last_name, s.first_name) AS full_name,
  CASE s.gender WHEN 1 THEN '男' WHEN 2 THEN '女' ELSE '未知' END AS gender_text,
  s.birth_date,
  TIMESTAMPDIFF(YEAR, s.birth_date, CURDATE()) AS age,
  c.class_code,
  c.class_name,
  c.grade_level,
  s.status,
  s.created_at,
  s.updated_at
FROM `student` s
LEFT JOIN `class` c ON s.class_id = c.id;

-- ============================================================================
-- 存储过程（可选）
-- ============================================================================

DELIMITER $$

-- 更新班级学生人数
CREATE PROCEDURE `sp_update_class_student_count`(IN p_class_id BIGINT)
BEGIN
  UPDATE `class` 
  SET `student_count` = (
    SELECT COUNT(*) FROM `student` 
    WHERE `class_id` = p_class_id AND `status` = 'active'
  )
  WHERE `id` = p_class_id;
END$$

DELIMITER ;

-- ============================================================================
-- 触发器（可选）
-- ============================================================================

DELIMITER $$

-- 学生插入后更新班级人数
CREATE TRIGGER `trg_student_after_insert`
AFTER INSERT ON `student`
FOR EACH ROW
BEGIN
  IF NEW.class_id IS NOT NULL THEN
    CALL sp_update_class_student_count(NEW.class_id);
  END IF;
END$$

-- 学生更新后更新班级人数
CREATE TRIGGER `trg_student_after_update`
AFTER UPDATE ON `student`
FOR EACH ROW
BEGIN
  IF OLD.class_id IS NOT NULL THEN
    CALL sp_update_class_student_count(OLD.class_id);
  END IF;
  IF NEW.class_id IS NOT NULL AND NEW.class_id != OLD.class_id THEN
    CALL sp_update_class_student_count(NEW.class_id);
  END IF;
END$$

-- 学生删除后更新班级人数
CREATE TRIGGER `trg_student_after_delete`
AFTER DELETE ON `student`
FOR EACH ROW
BEGIN
  IF OLD.class_id IS NOT NULL THEN
    CALL sp_update_class_student_count(OLD.class_id);
  END IF;
END$$

DELIMITER ;
