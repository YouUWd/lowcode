-- ============================================================
--  创建低代码业务数据库 business.db 初始化脚本 (SQLite)
-- ============================================================

-- ============================================================
-- 业务数据表结构
-- ============================================================

-- 客户档案扩展表
CREATE TABLE IF NOT EXISTS customer_profiles (
    id             INTEGER      PRIMARY KEY AUTOINCREMENT,
    name           VARCHAR(128) NOT NULL,
    level          VARCHAR(32)  DEFAULT 'REGULAR',
    contact_phone  VARCHAR(32)
);

-- 订单主表
CREATE TABLE IF NOT EXISTS orders (
    id          INTEGER       PRIMARY KEY AUTOINCREMENT,
    order_no    VARCHAR(64)   NOT NULL,
    customer_id INTEGER,
    amount      DECIMAL(12,2) DEFAULT 0,
    status      VARCHAR(32)   DEFAULT 'PENDING',
    remark      VARCHAR(512),
    created_at  DATETIME      DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME      DEFAULT CURRENT_TIMESTAMP
);

-- 订单明细从表
CREATE TABLE IF NOT EXISTS order_items (
    id           INTEGER       PRIMARY KEY AUTOINCREMENT,
    order_id     INTEGER       NOT NULL,
    product_name VARCHAR(128)  NOT NULL,
    qty          INTEGER       DEFAULT 1,
    price        DECIMAL(10,2) DEFAULT 0,
    created_at   DATETIME      DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- 标签表 (多对多关联右表)
CREATE TABLE IF NOT EXISTS tags (
    id   INTEGER      PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(64)  NOT NULL
);

-- 订单-标签中间表
CREATE TABLE IF NOT EXISTS order_tags (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    tag_id   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_tags_order ON order_tags(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tags_tag ON order_tags(tag_id);

-- ============================================================
-- 业务初始化数据导入
-- ============================================================

-- 导入客户档案扩展信息
INSERT INTO customer_profiles (name, level, contact_phone) VALUES
('张三', 'VIP',     '13800138000'),
('李四', 'GOLD',    '13900139000'),
('王五', 'REGULAR', '13700137000');

-- 导入标签
INSERT INTO tags (name) VALUES ('VIP'), ('加急'), ('退货'), ('特价'), ('赠品');

-- 导入订单主表
INSERT INTO orders (order_no, customer_id, amount, status, remark) VALUES
('20240101001', 1, 1500.00, 'PAID',    '首单客户'),
('20240101002', 2, 3200.50, 'SHIPPED', '加急'),
('20240102003', 3, 800.00,  'PENDING', NULL);

-- 导入订单从表
INSERT INTO order_items (order_id, product_name, qty, price) VALUES
(1, '鼠标', 1, 500.00),
(1, '键盘', 1, 1000.00),
(2, '笔记本', 1, 3200.50),
(3, '鼠标', 2, 150.00),
(3, '鼠标垫', 1, 50.00);

-- 导入多对多关联
INSERT INTO order_tags (order_id, tag_id) VALUES
(1, 1), (1, 4),   -- 订单1: VIP, 特价
(2, 2),            -- 订单2: 加急
(3, 3), (3, 5);   -- 订单3: 退货, 赠品
