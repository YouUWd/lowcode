-- ============================================================
--  创建低代码系统配置数据库 config.db 初始化脚本 (SQLite)
-- ============================================================

-- ============================================================
-- 元数据表结构
-- ============================================================

-- 模块元数据表
CREATE TABLE IF NOT EXISTS module_meta (
    id          VARCHAR(64)  PRIMARY KEY,
    name        VARCHAR(128) NOT NULL,
    description VARCHAR(512),
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP
);

-- 数据源配置表
CREATE TABLE IF NOT EXISTS datasource_meta (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         VARCHAR(64)  NOT NULL UNIQUE,
    db_type      VARCHAR(16)  NOT NULL DEFAULT 'MYSQL',
    host         VARCHAR(128) NOT NULL,
    port         INTEGER      NOT NULL,
    schema_name  VARCHAR(64)  NOT NULL,
    username     VARCHAR(64)  NOT NULL,
    password_enc VARCHAR(512) NOT NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 全局物理表定义
CREATE TABLE IF NOT EXISTS table_meta (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    datasource_id  INTEGER      NOT NULL,
    table_name     VARCHAR(64)  NOT NULL,
    display_name   VARCHAR(128),
    primary_column VARCHAR(64),
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(datasource_id, table_name),
    FOREIGN KEY (datasource_id) REFERENCES datasource_meta (id)
);

-- 模块表绑定关系
CREATE TABLE IF NOT EXISTS module_table_meta (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id      VARCHAR(64)  NOT NULL,
    table_meta_id  INTEGER      NOT NULL,
    sort_order     INTEGER      NOT NULL DEFAULT 0,
    UNIQUE(module_id, table_meta_id),
    FOREIGN KEY (module_id) REFERENCES module_meta (id),
    FOREIGN KEY (table_meta_id) REFERENCES table_meta (id)
);

-- 全局字段定义
CREATE TABLE IF NOT EXISTS field_meta (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    table_meta_id INTEGER      NOT NULL,
    column_name   VARCHAR(64)  NOT NULL,
    label         VARCHAR(64),
    data_type     VARCHAR(32)  NOT NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(table_meta_id, column_name),
    FOREIGN KEY (table_meta_id) REFERENCES table_meta (id)
);

-- 全局关系定义 (关系主体)
CREATE TABLE IF NOT EXISTS relation (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    name              VARCHAR(64)  NOT NULL,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 全局关系字段映射 (拆分为单侧字段记录)
CREATE TABLE IF NOT EXISTS relation_field_meta (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    relation_id       INTEGER      NOT NULL,
    field_meta_id     INTEGER      NOT NULL,
    cardinality       VARCHAR(1)   NOT NULL, -- '1' 或 'N'
    UNIQUE(relation_id, field_meta_id),
    FOREIGN KEY (relation_id) REFERENCES relation (id),
    FOREIGN KEY (field_meta_id) REFERENCES field_meta (id)
);

-- ============================================================
-- 权限管理表结构
-- ============================================================

-- 系统角色表
CREATE TABLE IF NOT EXISTS role (
    id   INTEGER      PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(64)  UNIQUE NOT NULL,
    name VARCHAR(128)
);

-- 全局字段权限表
CREATE TABLE IF NOT EXISTS field_permission (
    id            INTEGER      PRIMARY KEY AUTOINCREMENT,
    field_meta_id INTEGER      NOT NULL,
    role_code     VARCHAR(64)  NOT NULL,
    perm_value    INTEGER      NOT NULL,
    UNIQUE(field_meta_id, role_code)
);

-- ============================================================
-- 元数据及初始化业务数据导入
-- ============================================================

-- 导入模块元数据
INSERT INTO module_meta (id, name, description) VALUES
('order', '订单模块', '包含订单主表、订单明细从表及标签多对多关联的演示模块');

-- 导入默认数据源 (指向 business.db)
INSERT INTO datasource_meta (id, name, db_type, host, port, schema_name, username, password_enc) VALUES
(1, 'local_sqlite_biz', 'SQLITE', 'localhost', 0, 'business.db', '', '');

-- 导入表元数据
INSERT INTO table_meta (id, datasource_id, table_name, display_name, primary_column) VALUES
(1, 1, 'orders',            '订单主表',   'id'),
(2, 1, 'order_items',       '订单明细表', 'id'),
(3, 1, 'customer_profiles', '客户扩展表', 'id'),
(4, 1, 'tags',              '标签表',     'id'),
(5, 1, 'order_tags',        '订单标签表', 'id');

-- 绑定模块表
INSERT INTO module_table_meta (module_id, table_meta_id, sort_order) VALUES
('order', 1, 1),
('order', 2, 2),
('order', 3, 3),
('order', 4, 4),
('order', 5, 5);

-- 导入字段元数据
-- orders
INSERT INTO field_meta (id, table_meta_id, column_name, label, data_type) VALUES
(1, 1, 'id',         '编号',     'NUMBER'),
(2, 1, 'order_no',   '订单号',   'STRING'),
(3, 1, 'customer_id','客户ID',   'NUMBER'),
(4, 1, 'amount',     '金额',     'DECIMAL'),
(5, 1, 'status',     '状态',     'STRING'),
(6, 1, 'remark',     '备注',     'STRING'),
(7, 1, 'created_at', '创建时间', 'DATETIME'),
(8, 1, 'updated_at', '更新时间', 'DATETIME');

-- order_items
INSERT INTO field_meta (id, table_meta_id, column_name, label, data_type) VALUES
(9,  2, 'id',           '编号',     'NUMBER'),
(10, 2, 'order_id',     '订单ID',   'NUMBER'),
(11, 2, 'product_name', '商品名称', 'STRING'),
(12, 2, 'qty',          '数量',     'NUMBER'),
(13, 2, 'price',        '单价',     'DECIMAL'),
(14, 2, 'created_at',   '创建时间', 'DATETIME');

-- customer_profiles
INSERT INTO field_meta (id, table_meta_id, column_name, label, data_type) VALUES
(15, 3, 'id',            '档案ID',   'NUMBER'),
(16, 3, 'name',          '客户姓名', 'STRING'),
(17, 3, 'level',         '客户级别', 'STRING'),
(18, 3, 'contact_phone', '联系电话', 'STRING');

-- tags
INSERT INTO field_meta (id, table_meta_id, column_name, label, data_type) VALUES
(19, 4, 'id',   '标签ID',   'NUMBER'),
(20, 4, 'name', '标签名称', 'STRING');

-- order_tags
INSERT INTO field_meta (id, table_meta_id, column_name, label, data_type) VALUES
(21, 5, 'id',       '主键ID',   'NUMBER'),
(22, 5, 'order_id', '订单ID',   'NUMBER'),
(23, 5, 'tag_id',   '标签ID',   'NUMBER');

-- 导入关系元数据
INSERT INTO relation (id, name) VALUES
(1, 'orders-order_items'),
(2, 'orders-customer_profiles'),
(3, 'orders-order_tags'),
(4, 'tags-order_tags');

-- 导入关系字段映射数据
INSERT INTO relation_field_meta (relation_id, field_meta_id, cardinality) VALUES
-- 1: orders-order_items (1:N)
(1, 1,  '1'), -- orders.id
(1, 10, 'N'), -- order_items.order_id
-- 2: orders-customer_profiles (N:1)
(2, 3,  'N'), -- orders.customer_id
(2, 15, '1'), -- customer_profiles.id
-- 3: orders-order_tags (1:N)
(3, 1,  '1'), -- orders.id
(3, 22, 'N'), -- order_tags.order_id
-- 4: tags-order_tags (1:N)
(4, 19, '1'), -- tags.id
(4, 23, 'N'); -- order_tags.tag_id

-- ============================================================
-- 权限初始化数据导入 (白名单)
-- ============================================================

INSERT INTO role (code, name) VALUES
('admin',  '管理员'),
('editor', '编辑员'),
('viewer', '查看员');

-- 1. admin 角色配置所有字段 7 (rwu) 权限
INSERT INTO field_permission (field_meta_id, role_code, perm_value)
SELECT id, 'admin', 7 FROM field_meta;

-- 2. editor 角色配置权限
-- orders 表、order_items 表与 tags 表配置可写列 7 (rwu)
INSERT INTO field_permission (field_meta_id, role_code, perm_value)
SELECT id, 'editor', 7 FROM field_meta 
WHERE table_meta_id IN (1, 2, 4)
  AND column_name NOT IN ('id', 'order_id', 'amount', 'status', 'created_at', 'updated_at');

-- 特殊字段权限
INSERT INTO field_permission (field_meta_id, role_code, perm_value) VALUES
(1, 'editor', 4),
(4, 'editor', 6),
(5, 'editor', 5),
(7, 'editor', 4),
(8, 'editor', 4),
(9, 'editor', 4),
(10, 'editor', 4),
(14, 'editor', 4),
(19, 'editor', 4);

-- customer_profiles (JOIN 表) 全只读 (4)
INSERT INTO field_permission (field_meta_id, role_code, perm_value)
SELECT id, 'editor', 4 FROM field_meta WHERE table_meta_id = 3;

-- 3. viewer 角色配置权限 (所有字段只读 4，除 remark 字段不做配置，使其默认无权限)
INSERT INTO field_permission (field_meta_id, role_code, perm_value)
SELECT id, 'viewer', 4 FROM field_meta
WHERE column_name != 'remark';


-- ============================================================
-- 审批流核心引擎表 (Workflow Engine)
-- ============================================================

-- 1. 审批流模板定义表
CREATE TABLE IF NOT EXISTS sys_approval_chain_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id VARCHAR(50) NOT NULL,
    up_id INTEGER DEFAULT 0,
    next_id INTEGER DEFAULT 0,
    node_name VARCHAR(100) NOT NULL,
    node_type VARCHAR(50) DEFAULT 'user_task',
    approval_rule VARCHAR(50) DEFAULT NULL,
    role_target VARCHAR(50) DEFAULT NULL,
    role_approval_percent INTEGER DEFAULT NULL,
    parallel_branches TEXT DEFAULT NULL,
    re_approval_strategy VARCHAR(50) DEFAULT 'strict_reset',
    condition VARCHAR(500) DEFAULT NULL,
    is_jump BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 统一流程实例表 (承载所有业务的草稿与宏观状态)
CREATE TABLE IF NOT EXISTS sys_approval_instance (
    business_no VARCHAR(50) PRIMARY KEY,
    module_id VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    target_entity VARCHAR(100) DEFAULT NULL,
    target_record_id VARCHAR(100) DEFAULT NULL,
    action_type VARCHAR(50) DEFAULT 'CUSTOM',
    reason VARCHAR(500) DEFAULT NULL,
    payload TEXT DEFAULT NULL,
    macro_status INTEGER DEFAULT 1,
    submitter_id VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. 审批流运行实例任务表 (微观流转追踪)
CREATE TABLE IF NOT EXISTS sys_approval_task (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_no VARCHAR(50) NOT NULL,
    node_id INTEGER NOT NULL,
    branch_id VARCHAR(50) DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    approvers_list VARCHAR(1000) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_no) REFERENCES sys_approval_instance(business_no) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sys_approval_task_business_node ON sys_approval_task(business_no, node_id);

-- 4. 审批流执行日志表 (持久化流转轨迹)
CREATE TABLE IF NOT EXISTS sys_approval_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_no VARCHAR(50) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    operator VARCHAR(100) NOT NULL,
    node_name VARCHAR(100) DEFAULT NULL,
    comment VARCHAR(500) DEFAULT NULL,
    is_system BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sys_approval_log_business ON sys_approval_log(business_no);

-- ============================================================
-- 审批流 DEMO 种子数据
-- ============================================================
INSERT INTO sys_approval_chain_config 
(id, module_id, up_id, next_id, node_name, node_type, role_target, parallel_branches, re_approval_strategy)
VALUES 
(1, 'MOD-SCORE-DETAIL', 0, 2, '教研组长初审', 'user_task', 'head_teacher', NULL, 'strict_reset'),
(2, 'MOD-SCORE-DETAIL', 1, 3, '跨部门并联交接', 'parallel_group', NULL, '[{"branch_id":"b1","name":"教务处核准","role_target":"academic_admin"},{"branch_id":"b2","name":"财务处退费复核","role_target":"finance"}]', 'smart_rollback'),
(3, 'MOD-SCORE-DETAIL', 2, 0, '校长终审', 'user_task', 'principal', NULL, 'strict_reset');
