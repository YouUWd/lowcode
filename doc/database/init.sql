-- ============================================================
--  创建低代码元数据库 low_code 初始化脚本
-- ============================================================

USE `low_code`;

-- 彻底清理所有旧对象以保证重装数据幂等
DROP ALL OBJECTS;
CREATE SCHEMA IF NOT EXISTS `low_code`;
USE `low_code`;

-- ============================================================
-- 清理旧表（顺序：从表及关联表 -> 主表及元数据表）
-- ============================================================
DROP TABLE IF EXISTS `module_field_config`;
DROP TABLE IF EXISTS `field_permission`;
DROP TABLE IF EXISTS `sys_role`;
DROP TABLE IF EXISTS `order_tags`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `tags`;
DROP TABLE IF EXISTS `customer_profiles`;
DROP TABLE IF EXISTS `relation_meta`;
DROP TABLE IF EXISTS `field_meta`;
DROP TABLE IF EXISTS `module_table_ref`;
DROP TABLE IF EXISTS `table_meta`;
DROP TABLE IF EXISTS `datasource_meta`;
DROP TABLE IF EXISTS `module_meta`;

-- ============================================================
-- 元数据表结构
-- ============================================================

-- 模块元数据表
CREATE TABLE IF NOT EXISTS `module_meta` (
    `id`          VARCHAR(64)  PRIMARY KEY COMMENT '模块唯一标识',
    `name`        VARCHAR(128) NOT NULL COMMENT '模块名称',
    `description` VARCHAR(512) COMMENT '模块描述',
    `created_at`  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='模块元数据';

-- 数据源配置表
CREATE TABLE IF NOT EXISTS `datasource_meta` (
    `id`           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    `name`         VARCHAR(64)  NOT NULL COMMENT '数据源名称',
    `db_type`      VARCHAR(16)  NOT NULL DEFAULT 'MYSQL',
    `host`         VARCHAR(128) NOT NULL,
    `port`         INT          NOT NULL,
    `schema_name`  VARCHAR(64)  NOT NULL,
    `username`     VARCHAR(64)  NOT NULL,
    `password_enc` VARCHAR(512) NOT NULL COMMENT 'AES加密密文',
    `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB COMMENT='数据源连接配置';

-- 全局物理表定义
CREATE TABLE IF NOT EXISTS `table_meta` (
    `id`             BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    `datasource_id`  BIGINT UNSIGNED NOT NULL,
    `table_name`     VARCHAR(64)  NOT NULL COMMENT '物理表名',
    `display_name`   VARCHAR(128) COMMENT '展示名，人工补充',
    `primary_column` VARCHAR(64)  COMMENT '主键列名，逻辑关联field_meta.column_name，不建外键',
    `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_ds_table` (`datasource_id`, `table_name`),
    CONSTRAINT `fk_table_datasource` FOREIGN KEY (`datasource_id`) REFERENCES `datasource_meta` (`id`)
) ENGINE=InnoDB COMMENT='全局物理表定义';

-- 模块表绑定关系
CREATE TABLE IF NOT EXISTS `module_table_ref` (
    `id`             BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    `module_id`      VARCHAR(64)  NOT NULL COMMENT '模块ID',
    `table_meta_id`  BIGINT UNSIGNED NOT NULL COMMENT '物理表元数据ID',
    `sort_order`     INT          NOT NULL DEFAULT 0 COMMENT '排序权重',
    UNIQUE KEY `uk_module_table` (`module_id`, `table_meta_id`),
    CONSTRAINT `fk_ref_module` FOREIGN KEY (`module_id`) REFERENCES `module_meta` (`id`),
    CONSTRAINT `fk_ref_table` FOREIGN KEY (`table_meta_id`) REFERENCES `table_meta` (`id`)
) ENGINE=InnoDB COMMENT='模块表绑定关系';

-- 全局字段定义
CREATE TABLE IF NOT EXISTS `field_meta` (
    `id`            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    `table_meta_id` BIGINT UNSIGNED NOT NULL,
    `column_name`   VARCHAR(64)  NOT NULL COMMENT '物理列名',
    `label`         VARCHAR(64)  COMMENT '展示名，为空时前端回退显示column_name',
    `data_type`     VARCHAR(32)  NOT NULL COMMENT '平台标准类型：STRING/NUMBER/DECIMAL/DATE/DATETIME/BOOLEAN/TEXT',
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_table_col` (`table_meta_id`, `column_name`),
    KEY `idx_table` (`table_meta_id`),
    CONSTRAINT `fk_field_table` FOREIGN KEY (`table_meta_id`) REFERENCES `table_meta` (`id`)
) ENGINE=InnoDB COMMENT='全局字段定义';

-- 全局关系定义
CREATE TABLE IF NOT EXISTS `relation_meta` (
    `id`              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    `name`            VARCHAR(64)  NOT NULL COMMENT '关系名称，如"订单关联客户档案"',
    `source_field_id` BIGINT UNSIGNED NOT NULL COMMENT '关系表达式左侧字段',
    `target_field_id` BIGINT UNSIGNED NOT NULL COMMENT '关系表达式右侧字段',
    `relation_type`   VARCHAR(4)   NOT NULL COMMENT '>多对一 <一对多 -一对一，创建时人工指定或由反向工程预填',
    `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_relation` (`source_field_id`, `target_field_id`),
    CONSTRAINT `fk_rel_source_field` FOREIGN KEY (`source_field_id`) REFERENCES `field_meta` (`id`),
    CONSTRAINT `fk_rel_target_field` FOREIGN KEY (`target_field_id`) REFERENCES `field_meta` (`id`)
) ENGINE=InnoDB COMMENT='全局字段级关系定义';

-- ============================================================
-- 权限管理表结构
-- ============================================================

-- 系统角色表
CREATE TABLE IF NOT EXISTS `sys_role` (
    `id`   BIGINT       PRIMARY KEY AUTO_INCREMENT,
    `code` VARCHAR(64)  UNIQUE NOT NULL COMMENT '角色编码',
    `name` VARCHAR(128) COMMENT '角色名称'
) ENGINE=InnoDB COMMENT='系统角色表';

-- 模块字段配置及权限表
CREATE TABLE IF NOT EXISTS `module_field_config` (
    `id`            BIGINT       PRIMARY KEY AUTO_INCREMENT,
    `module_id`     VARCHAR(64)  NOT NULL COMMENT '模块ID',
    `field_meta_id` BIGINT       NOT NULL COMMENT '字段元数据ID',
    `role_code`     VARCHAR(64)  NOT NULL COMMENT '角色编码',
    `perm_value`    TINYINT(1)   NOT NULL COMMENT '权限值(0-7)',
    UNIQUE KEY `uk_field_role` (`field_meta_id`, `role_code`),
    INDEX `idx_module_role` (`module_id`, `role_code`)
) ENGINE=InnoDB COMMENT='模块字段配置及权限表';

-- ============================================================
-- 业务数据表结构
-- ============================================================

-- 客户档案扩展表
CREATE TABLE IF NOT EXISTS `customer_profiles` (
    `id`             BIGINT       PRIMARY KEY AUTO_INCREMENT,
    `name`           VARCHAR(128) NOT NULL COMMENT '客户姓名',
    `level`          VARCHAR(32)  DEFAULT 'REGULAR' COMMENT '级别: REGULAR/VIP/GOLD',
    `contact_phone`  VARCHAR(32)  COMMENT '联系电话'
) ENGINE=InnoDB COMMENT='客户档案扩展表';

-- 订单主表
CREATE TABLE IF NOT EXISTS `orders` (
    `id`          BIGINT       PRIMARY KEY AUTO_INCREMENT,
    `order_no`    VARCHAR(64)  NOT NULL COMMENT '订单号',
    `customer`    VARCHAR(128) COMMENT '客户名',
    `amount`      DECIMAL(12,2) DEFAULT 0 COMMENT '订单金额',
    `status`      VARCHAR(32)  DEFAULT 'PENDING' COMMENT '状态: PENDING/PAID/SHIPPED/COMPLETED',
    `remark`      VARCHAR(512) COMMENT '备注',
    `created_at`  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='订单主表';

-- 订单明细从表
CREATE TABLE IF NOT EXISTS `order_items` (
    `id`           BIGINT       PRIMARY KEY AUTO_INCREMENT,
    `order_id`     BIGINT       NOT NULL COMMENT '订单ID',
    `product_name` VARCHAR(128) NOT NULL COMMENT '商品名称',
    `qty`          INT          DEFAULT 1 COMMENT '数量',
    `price`        DECIMAL(10,2) DEFAULT 0 COMMENT '单价',
    `created_at`   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_order_items_order` (`order_id`)
) ENGINE=InnoDB COMMENT='订单明细从表';

-- 标签表 (多对多关联右表)
CREATE TABLE IF NOT EXISTS `tags` (
    `id`   BIGINT       PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(64)  NOT NULL COMMENT '标签名称'
) ENGINE=InnoDB COMMENT='标签表';

-- 订单-标签中间表
CREATE TABLE IF NOT EXISTS `order_tags` (
    `id`       BIGINT PRIMARY KEY AUTO_INCREMENT,
    `order_id` BIGINT NOT NULL,
    `tag_id`   BIGINT NOT NULL,
    INDEX `idx_order_tags_order` (`order_id`),
    INDEX `idx_tag` (`tag_id`)
) ENGINE=InnoDB COMMENT='订单-标签关联表';

-- ============================================================
-- 元数据及初始化业务数据导入
-- ============================================================

-- 导入模块元数据
INSERT INTO `module_meta` (`id`, `name`, `description`) VALUES
('order', '订单模块', '包含订单主表、订单明细从表及标签多对多关联的演示模块');

-- 导入默认数据源
INSERT INTO `datasource_meta` (`id`, `name`, `db_type`, `host`, `port`, `schema_name`, `username`, `password_enc`) VALUES
(1, 'local_h2', 'H2', 'localhost', 3306, 'low_code', 'sa', '');

-- 导入表元数据
INSERT INTO `table_meta` (`id`, `datasource_id`, `table_name`, `display_name`, `primary_column`) VALUES
(1, 1, 'orders',            '订单主表',   'id'),
(2, 1, 'order_items',       '订单明细表', 'id'),
(3, 1, 'customer_profiles', '客户扩展表', 'id'),
(4, 1, 'tags',              '标签表',     'id'),
(5, 1, 'order_tags',        '订单标签表', 'id');

-- 绑定模块表
INSERT INTO `module_table_ref` (`module_id`, `table_meta_id`, `sort_order`) VALUES
('order', 1, 1),
('order', 2, 2),
('order', 3, 3),
('order', 4, 4),
('order', 5, 5);

-- 导入字段元数据
-- orders
INSERT INTO `field_meta` (`id`, `table_meta_id`, `column_name`, `label`, `data_type`) VALUES
(1, 1, 'id',         '编号',     'NUMBER'),
(2, 1, 'order_no',   '订单号',   'STRING'),
(3, 1, 'customer',   '客户名',   'STRING'),
(4, 1, 'amount',     '金额',     'DECIMAL'),
(5, 1, 'status',     '状态',     'STRING'),
(6, 1, 'remark',     '备注',     'STRING'),
(7, 1, 'created_at', '创建时间', 'DATETIME'),
(8, 1, 'updated_at', '更新时间', 'DATETIME');

-- order_items
INSERT INTO `field_meta` (`id`, `table_meta_id`, `column_name`, `label`, `data_type`) VALUES
(9,  2, 'id',           '编号',     'NUMBER'),
(10, 2, 'order_id',     '订单ID',   'NUMBER'),
(11, 2, 'product_name', '商品名称', 'STRING'),
(12, 2, 'qty',          '数量',     'NUMBER'),
(13, 2, 'price',        '单价',     'DECIMAL'),
(14, 2, 'created_at',   '创建时间', 'DATETIME');

-- customer_profiles
INSERT INTO `field_meta` (`id`, `table_meta_id`, `column_name`, `label`, `data_type`) VALUES
(15, 3, 'id',            '档案ID',   'NUMBER'),
(16, 3, 'name',          '客户姓名', 'STRING'),
(17, 3, 'level',         '客户级别', 'STRING'),
(18, 3, 'contact_phone', '联系电话', 'STRING');

-- tags
INSERT INTO `field_meta` (`id`, `table_meta_id`, `column_name`, `label`, `data_type`) VALUES
(19, 4, 'id',   '标签ID',   'NUMBER'),
(20, 4, 'name', '标签名称', 'STRING');

-- order_tags
INSERT INTO `field_meta` (`id`, `table_meta_id`, `column_name`, `label`, `data_type`) VALUES
(21, 5, 'id',       '主键ID',   'NUMBER'),
(22, 5, 'order_id', '订单ID',   'NUMBER'),
(23, 5, 'tag_id',   '标签ID',   'NUMBER');

-- 导入关系元数据
INSERT INTO `relation_meta` (`id`, `name`, `source_field_id`, `target_field_id`, `relation_type`) VALUES
(1, 'orders->order_items',       1,  10, '<'), -- orders.id < order_items.order_id
(2, 'orders->customer_profiles', 3,  16, '>'), -- orders.customer > customer_profiles.name
(3, 'orders->order_tags',        1,  22, '<'), -- orders.id < order_tags.order_id
(4, 'tags->order_tags',          19, 23, '<'); -- tags.id < order_tags.tag_id

-- ============================================================
-- 权限初始化数据导入 (白名单)
-- ============================================================

INSERT INTO `sys_role` (`code`, `name`) VALUES
('admin',  '管理员'),
('editor', '编辑员'),
('viewer', '查看员');

-- 1. admin 角色配置所有字段 7 (rwu) 权限
INSERT INTO `module_field_config` (`module_id`, `field_meta_id`, `role_code`, `perm_value`)
SELECT 'order', `id`, 'admin', 7 FROM `field_meta`;

-- 2. editor 角色配置权限
-- orders 表、order_items 表与 tags 表配置可写列 7 (rwu)
INSERT INTO `module_field_config` (`module_id`, `field_meta_id`, `role_code`, `perm_value`)
SELECT 'order', `id`, 'editor', 7 FROM `field_meta` 
WHERE `table_meta_id` IN (1, 2, 4)
  AND `column_name` NOT IN ('id', 'order_id', 'amount', 'status', 'created_at', 'updated_at');

-- 特殊字段权限
INSERT INTO `module_field_config` (`module_id`, `field_meta_id`, `role_code`, `perm_value`) VALUES
('order', 1, 'editor', 4),
('order', 4, 'editor', 6),
('order', 5, 'editor', 5),
('order', 7, 'editor', 4),
('order', 8, 'editor', 4),
('order', 9, 'editor', 4),
('order', 10, 'editor', 4),
('order', 14, 'editor', 4),
('order', 19, 'editor', 4);

-- customer_profiles (JOIN 表) 全只读 (4)
INSERT INTO `module_field_config` (`module_id`, `field_meta_id`, `role_code`, `perm_value`)
SELECT 'order', `id`, 'editor', 4 FROM `field_meta` WHERE `table_meta_id` = 3;

-- 3. viewer 角色配置权限 (所有字段只读 4，除 remark 字段不做配置，使其默认无权限)
INSERT INTO `module_field_config` (`module_id`, `field_meta_id`, `role_code`, `perm_value`)
SELECT 'order', `id`, 'viewer', 4 FROM `field_meta`
WHERE `column_name` != 'remark';

-- ============================================================
-- 业务初始化数据导入
-- ============================================================

-- 导入客户档案扩展信息
INSERT INTO `customer_profiles` (`name`, `level`, `contact_phone`) VALUES
('张三', 'VIP',     '13800138000'),
('李四', 'GOLD',    '13900139000'),
('王五', 'REGULAR', '13700137000');

-- 导入标签
INSERT INTO `tags` (`name`) VALUES ('VIP'), ('加急'), ('退货'), ('特价'), ('赠品');

-- 导入订单主表
INSERT INTO `orders` (`order_no`, `customer`, `amount`, `status`, `remark`) VALUES
('ORD-20240101-001', '张三', 1500.00, 'PAID',    '首单客户'),
('ORD-20240101-002', '李四', 3200.50, 'SHIPPED', '加急'),
('ORD-20240102-003', '王五', 800.00,  'PENDING', NULL);

-- 导入订单从表
INSERT INTO `order_items` (`order_id`, `product_name`, `qty`, `price`) VALUES
(1, '鼠标', 1, 500.00),
(1, '键盘', 1, 1000.00),
(2, '笔记本', 1, 3200.50),
(3, '鼠标', 2, 150.00),
(3, '鼠标垫', 1, 50.00);

-- 导入多对多关联
INSERT INTO `order_tags` (`order_id`, `tag_id`) VALUES
(1, 1), (1, 4),   -- 订单1: VIP, 特价
(2, 2),            -- 订单2: 加急
(3, 3), (3, 5);   -- 订单3: 退货, 赠品