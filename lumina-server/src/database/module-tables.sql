-- ==================== 模块配置表 ====================

-- 1. 模块表 (sys_module)
CREATE TABLE IF NOT EXISTS sys_module (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id VARCHAR(50) UNIQUE NOT NULL,
  module_name VARCHAR(100) NOT NULL,
  module_desc VARCHAR(500),
  primary_entity VARCHAR(100) NOT NULL,
  primary_entity_desc VARCHAR(500),
  record_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(50),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sys_module_id ON sys_module(module_id);
CREATE INDEX IF NOT EXISTS idx_sys_module_active ON sys_module(is_active);

-- 2. 模块关联表 (sys_module_entity)
CREATE TABLE IF NOT EXISTS sys_module_entity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id VARCHAR(50) NOT NULL,
  entity_id VARCHAR(50) NOT NULL,
  entity_name VARCHAR(100) NOT NULL,
  entity_desc VARCHAR(500),
  join_left_field VARCHAR(100) NOT NULL,
  join_right_field VARCHAR(100) NOT NULL,
  entity_status VARCHAR(50) DEFAULT '正常',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (module_id) REFERENCES sys_module(module_id),
  UNIQUE(module_id, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_sys_module_entity_module ON sys_module_entity(module_id);
CREATE INDEX IF NOT EXISTS idx_sys_module_entity_name ON sys_module_entity(entity_name);

-- 3. 模块字段配置表 (sys_module_field)
CREATE TABLE IF NOT EXISTS sys_module_field (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id VARCHAR(50) NOT NULL,
  field_id VARCHAR(100) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  logical_field VARCHAR(100) NOT NULL,
  transformer VARCHAR(500),
  transformer_env VARCHAR(50) DEFAULT 'none',
  render_icon VARCHAR(100),
  render_type VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (module_id) REFERENCES sys_module(module_id),
  UNIQUE(module_id, logical_field)
);

CREATE INDEX IF NOT EXISTS idx_sys_module_field_module ON sys_module_field(module_id);
CREATE INDEX IF NOT EXISTS idx_sys_module_field_logical ON sys_module_field(logical_field);

-- 4. 字段物理源表 (sys_module_field_source)
CREATE TABLE IF NOT EXISTS sys_module_field_source (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id VARCHAR(50) NOT NULL,
  logical_field VARCHAR(100) NOT NULL,
  source_entity VARCHAR(100) NOT NULL,
  source_field VARCHAR(100) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (module_id) REFERENCES sys_module(module_id),
  UNIQUE(module_id, logical_field, source_entity, source_field)
);

CREATE INDEX IF NOT EXISTS idx_sys_module_field_source_module ON sys_module_field_source(module_id, logical_field);
CREATE INDEX IF NOT EXISTS idx_sys_module_field_source_entity ON sys_module_field_source(source_entity, source_field);

-- 5. 扩展权限配置表 (添加模块相关字段)
ALTER TABLE sys_permission_config ADD COLUMN module_id VARCHAR(50);
ALTER TABLE sys_permission_config ADD COLUMN logical_field VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_sys_permission_module ON sys_permission_config(module_id, permission_node);
