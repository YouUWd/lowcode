import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 数据库服务
 * 
 * 管理两个独立的数据库：
 * 1. configDb (配置数据库): 存储模块配置、字段映射、权限配置等系统配置数据
 * 2. businessDb (业务数据库): 存储业务数据
 * 
 * 初始化方式：直接读取 doc/database/ 下的 SQL 脚本文件并执行。
 */
@Injectable()
export class DatabaseService {
  constructor(
    @Inject('CONFIG_DB') private readonly configDb: Knex,
    @Inject('BUSINESS_DB') private readonly businessDb: Knex,
  ) {
    console.log('[数据库服务] 服务已创建');
    console.log('[数据库服务] - configDb: 配置数据库 (模块、字段、权限)');
    console.log('[数据库服务] - businessDb: 业务数据库 (业务数据)');
  }

  /**
   * 删除数据库文件（仅适用于 SQLite）
   */
  async deleteDatabaseFiles() {
    console.log('[数据库服务] 检查并删除现有数据库文件...');
    
    const dataDir = path.join(process.cwd(), 'data');
    const dbFiles = ['business.db', 'config.db'];
    
    let deletedCount = 0;
    
    for (const dbFile of dbFiles) {
      const filePath = path.join(dataDir, dbFile);
      
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`[数据库服务] ✓ 已删除: ${dbFile}`);
          deletedCount++;
        } catch (error) {
          console.error(`[数据库服务] ✗ 删除失败: ${dbFile}`, error);
        }
      } else {
        console.log(`[数据库服务] - 文件不存在: ${dbFile}`);
      }
    }
    
    if (deletedCount > 0) {
      console.log(`[数据库服务] 共删除 ${deletedCount} 个数据库文件`);
    } else {
      console.log(`[数据库服务] 没有需要删除的数据库文件`);
    }
  }

  /**
   * 数据库初始化主流程
   */
  async initializeDatabase() {
    console.log('[数据库服务] ========== 开始初始化数据库 ==========');
    const businessSqlPath = path.join(process.cwd(), 'sql', 'init_business.sql');
    const configSqlPath = path.join(process.cwd(), 'sql', 'init_config.sql');

    try {
      const businessInitialized = await this.checkIfInitialized(this.businessDb, 'orders');
      if (!businessInitialized) {
        console.log('[数据库服务] 正在执行 init_business.sql...');
        const businessSql = fs.readFileSync(businessSqlPath, 'utf8');
        await this.executeRawSql(this.businessDb, businessSql);
        console.log('[数据库服务] ✓ 业务数据库初始化完成');
      } else {
        console.log('[数据库服务] ✓ 业务数据库已存在表，跳过初始化');
      }

      const configInitialized = await this.checkIfInitialized(this.configDb, 'module_meta');
      if (!configInitialized) {
        console.log('[数据库服务] 正在执行 init_config.sql...');
        const configSql = fs.readFileSync(configSqlPath, 'utf8');
        await this.executeRawSql(this.configDb, configSql);
        console.log('[数据库服务] ✓ 配置数据库初始化完成');
      } else {
        console.log('[数据库服务] ✓ 配置数据库已存在表，跳过初始化');
      }

    } catch (error) {
      console.error('[数据库服务] 初始化过程中发生错误:', error);
      throw error;
    }

    console.log('[数据库服务] ========== 所有数据库初始化完成 ==========\n');
  }

  /**
   * 检查数据库是否已经初始化（判断核心表是否存在）
   */
  private async checkIfInitialized(db: Knex, tableName: string): Promise<boolean> {
    return await db.schema.hasTable(tableName);
  }

  /**
   * 执行多语句的原始 SQL 脚本
   */
  private async executeRawSql(db: Knex, sql: string) {
    const connection = await db.client.acquireConnection();
    try {
      await new Promise<void>((resolve, reject) => {
        // 对于 sqlite3 driver，connection 有 exec 方法可以执行包含多个用分号隔开的 SQL 语句
        connection.exec(sql, (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
    } finally {
      db.client.releaseConnection(connection);
    }
  }
}
