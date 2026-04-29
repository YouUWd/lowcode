import { Module, Global } from '@nestjs/common';
import { DatabaseService } from './database.service';
import knex from 'knex';
import * as fs from 'fs';
import * as path from 'path';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('[数据库模块] 创建数据目录:', dataDir);
}

// Create config database Knex instance
const configKnex = knex({
  client: 'better-sqlite3',
  connection: {
    filename: path.join(dataDir, 'config.db'),
  },
  useNullAsDefault: true,
});

// Create business database Knex instance
const businessKnex = knex({
  client: 'better-sqlite3',
  connection: {
    filename: path.join(dataDir, 'business.db'),
  },
  useNullAsDefault: true,
});

/**
 * 数据库模块
 * 
 * 统一管理两个独立的数据库连接：
 * 
 * 1. **配置数据库 (config.db)**
 *    - 通过 'CONFIG_DB' token 注入，使用 @Inject('CONFIG_DB') 访问
 *    - 存储：模块配置、字段映射、权限配置等系统配置数据
 *    - 表：sys_module, sys_module_entity, sys_module_field, sys_permission_config
 * 
 * 2. **业务数据库 (business.db)**
 *    - 通过 'BUSINESS_DB' token 注入，使用 @Inject('BUSINESS_DB') 访问
 *    - 存储：HR 业务数据（组织、员工、薪酬等）
 *    - 表：hr_organization, hr_employee_base, hr_payroll_result 等
 * 
 * 使用 @Global() 装饰器，使数据库连接在整个应用中可用，无需在每个模块中重复导入
 */
@Global()
@Module({
  providers: [
    DatabaseService,
    {
      provide: 'CONFIG_DB',
      useValue: configKnex,
    },
    {
      provide: 'BUSINESS_DB',
      useValue: businessKnex,
    },
  ],
  exports: [DatabaseService, 'CONFIG_DB', 'BUSINESS_DB'],
})
export class DatabaseModule {}
