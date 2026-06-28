-- ============================================================
--  创建低代码元数据库 low_code 初始化脚本
-- ============================================================

USE `low_code`;

-- ============================================================
-- 清理旧表（顺序：从表及关联表 -> 主表及元数据表）
-- ============================================================
DROP TABLE IF EXISTS `order_tags`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `tags`;
DROP TABLE IF EXISTS `customer_profiles`;
DROP TABLE IF EXISTS `field_meta`;
DROP TABLE IF EXISTS `relation_meta`;
DROP TABLE IF EXISTS `table_meta`;
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

-- 表元数据表
CREATE TABLE IF NOT EXISTS `table_meta` (
    `id`          BIGINT       PRIMARY KEY AUTO_INCREMENT,
    `module_id`   VARCHAR(64)  NOT NULL COMMENT '模块ID',
    `table_name`  VARCHAR(128) NOT NULL COMMENT '数据库表名',
    `query_type`  VARCHAR(16)  NOT NULL COMMENT '查询类型: MAIN(主表)/SUB(一对多从表)/JOIN(一对一或多对一关联表)',
    `join_type`   VARCHAR(16)  COMMENT 'JOIN类型: LEFT/INNER/RIGHT JOIN',
    `join_on`     VARCHAR(256) COMMENT 'JOIN连接条件',
    `foreign_key` VARCHAR(64)  COMMENT '从表外键列名',
    `sort_order`  INT          DEFAULT 0 COMMENT '排序权重',
    INDEX `idx_table_meta_module` (`module_id`)
) ENGINE=InnoDB COMMENT='表元数据';

-- 字段元数据表
CREATE TABLE IF NOT EXISTS `field_meta` (
    `id`            BIGINT       PRIMARY KEY AUTO_INCREMENT,
    `table_meta_id` BIGINT       NOT NULL COMMENT '表元数据ID',
    `column_name`   VARCHAR(128) NOT NULL COMMENT '数据库列名',
    `label`         VARCHAR(128) COMMENT '前端显示标签',
    `data_type`     VARCHAR(32)  NOT NULL DEFAULT 'VARCHAR' COMMENT '数据类型',
    `queryable`     TINYINT(1)   DEFAULT 0 COMMENT '是否允许作为查询条件',
    `query_op`      VARCHAR(16)  DEFAULT 'EQ' COMMENT '查询操作符: EQ/LIKE/GT/LT/GTE/LTE/IN/BETWEEN',
    `sortable`      TINYINT(1)   DEFAULT 0 COMMENT '是否允许排序',
    `sort_order`    INT          DEFAULT 0 COMMENT '排序权重',
    `writable`      TINYINT(1)   DEFAULT 0 COMMENT '是否允许写入',
    INDEX `idx_table` (`table_meta_id`)
) ENGINE=InnoDB COMMENT='字段元数据';

-- N:M 关联元数据表
CREATE TABLE IF NOT EXISTS `relation_meta` (
    `id`             BIGINT       PRIMARY KEY AUTO_INCREMENT,
    `module_id`      VARCHAR(64)  NOT NULL COMMENT '模块ID',
    `name`           VARCHAR(64)  NOT NULL COMMENT '关联别名（API请求/响应的Key）',
    `left_table`     VARCHAR(128) NOT NULL COMMENT '左表名',
    `left_join_column` VARCHAR(64)  COMMENT '左表被关联列名',
    `left_fk`        VARCHAR(64)  NOT NULL COMMENT '中间表关联左表外键',
    `junction_table` VARCHAR(128) NOT NULL COMMENT '关系中间表名',
    `right_fk`       VARCHAR(64)  NOT NULL COMMENT '中间表关联右表外键',
    `right_table`    VARCHAR(128) NOT NULL COMMENT '右表名',
    `right_join_column` VARCHAR(64) COMMENT '右表被关联列名',
    INDEX `idx_relation_meta_module` (`module_id`)
) ENGINE=InnoDB COMMENT='N:M多对多关联元数据';

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

-- 导入表元数据
INSERT INTO `table_meta` (`module_id`, `table_name`, `query_type`, `join_type`, `join_on`, `foreign_key`, `sort_order`) VALUES
('order', 'orders',            'MAIN', NULL,   NULL,                                       NULL,       1),
('order', 'order_items',       'SUB',  NULL,   NULL,                                       'order_id', 2),
('order', 'customer_profiles', 'JOIN', 'LEFT', 'customer_profiles.name = orders.customer', NULL,       3);

-- 导入字段元数据
SET @main_table_id = (SELECT id FROM table_meta WHERE module_id='order' AND table_name='orders');
INSERT INTO `field_meta` (`table_meta_id`, `column_name`, `label`, `data_type`, `queryable`, `query_op`, `sortable`, `sort_order`, `writable`) VALUES
(@main_table_id, 'id',         '编号',     'BIGINT',   0, 'EQ',      0, 1, 0),
(@main_table_id, 'order_no',   '订单号',   'VARCHAR',  1, 'LIKE',    1, 2, 1),
(@main_table_id, 'customer',   '客户名',   'VARCHAR',  1, 'LIKE',    1, 3, 1),
(@main_table_id, 'amount',     '金额',     'DECIMAL',  1, 'GTE',     1, 4, 1),
(@main_table_id, 'status',     '状态',     'VARCHAR',  1, 'EQ',      1, 5, 1),
(@main_table_id, 'remark',     '备注',     'VARCHAR',  0, 'EQ',      0, 6, 1),
(@main_table_id, 'created_at', '创建时间', 'DATETIME', 1, 'BETWEEN', 1, 7, 0),
(@main_table_id, 'updated_at', '更新时间', 'DATETIME', 0, 'EQ',      1, 8, 0);

SET @sub_table_id = (SELECT id FROM table_meta WHERE module_id='order' AND table_name='order_items');
INSERT INTO `field_meta` (`table_meta_id`, `column_name`, `label`, `data_type`, `queryable`, `query_op`, `sortable`, `sort_order`, `writable`) VALUES
(@sub_table_id, 'id',           '编号',     'BIGINT',   0, 'EQ',   0, 1, 0),
(@sub_table_id, 'order_id',     '订单ID',   'BIGINT',   0, 'EQ',   0, 2, 0),
(@sub_table_id, 'product_name', '商品名称', 'VARCHAR',  1, 'LIKE', 0, 3, 1),
(@sub_table_id, 'qty',          '数量',     'INT',      0, 'EQ',   0, 4, 1),
(@sub_table_id, 'price',        '单价',     'DECIMAL',  0, 'EQ',   0, 5, 1),
(@sub_table_id, 'created_at',   '创建时间', 'DATETIME', 0, 'EQ',   1, 6, 0);

SET @join_table_id = (SELECT id FROM table_meta WHERE module_id='order' AND table_name='customer_profiles');
INSERT INTO `field_meta` (`table_meta_id`, `column_name`, `label`, `data_type`, `queryable`, `query_op`, `sortable`, `sort_order`, `writable`) VALUES
(@join_table_id, 'id',            '档案ID',   'BIGINT',   0, 'EQ',   0, 1, 0),
(@join_table_id, 'name',          '客户姓名', 'VARCHAR',  0, 'EQ',   0, 2, 0),
(@join_table_id, 'level',         '客户级别', 'VARCHAR',  1, 'EQ',   1, 3, 0),
(@join_table_id, 'contact_phone', '联系电话', 'VARCHAR',  0, 'EQ',   0, 4, 0);

-- 导入关联元数据
INSERT INTO `relation_meta` (`module_id`, `name`, `left_table`, `left_join_column`, `left_fk`, `junction_table`, `right_fk`, `right_table`, `right_join_column`) VALUES
('order', 'tags', 'orders', 'id', 'order_id', 'order_tags', 'tag_id', 'tags', 'id');

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
