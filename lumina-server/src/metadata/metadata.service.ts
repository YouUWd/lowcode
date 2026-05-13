import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';

/**
 * 表信息
 */
export interface TableInfo {
  tableName: string;
  tableComment: string;
  fields: ColumnInfo[];
  foreignKeys: ForeignKeyInfo[];
}

/**
 * 字段信息
 */
export interface ColumnInfo {
  columnName: string;
  columnType: string;
  columnComment: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isAutoIncrement: boolean;
}

/**
 * 外键信息
 */
export interface ForeignKeyInfo {
  constraintName: string;
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
}

/**
 * 数据库模型信息
 */
export interface DatabaseSchema {
  database: string;
  tables: TableInfo[];
}

@Injectable()
export class MetadataService {
  constructor(
    @Inject('BUSINESS_DB') private readonly businessDb: Knex,
  ) {
    console.log(`[元数据服务] 初始化 SQLite3 元数据服务`);
  }

  /**
   * 获取所有表信息
   */
  async getAllTables(database: string = 'lumina_business'): Promise<TableInfo[]> {
    try {
      console.log(`[元数据服务] 获取所有表信息...`);
      
      // SQLite 查询
      const tables = await this.businessDb.raw(`
        SELECT name as tableName FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `);

      console.log(`[元数据服务] 找到 ${tables.length} 个表`);

      // 为每个表加载字段和外键信息
      const result: TableInfo[] = [];

      for (const table of tables) {
        const tableName = table.tableName;
        const fields = await this.getTableColumns(database, tableName);
        const foreignKeys = await this.getTableForeignKeys(database, tableName);

        result.push({
          tableName,
          tableComment: '', // SQLite 不支持表注释
          fields,
          foreignKeys,
        });
      }

      return result;
    } catch (error) {
      console.error('获取表信息失败:', error);
      return [];
    }
  }

  /**
   * 获取表的字段信息
   */
  async getTableColumns(
    database: string = 'lumina_business',
    tableName: string,
  ): Promise<ColumnInfo[]> {
    try {
      console.log(`[元数据服务] 获取表 ${tableName} 的字段信息...`);
      
      // SQLite 查询 - 使用 PRAGMA table_info
      const columns = await this.businessDb.raw(`PRAGMA table_info(${tableName})`);
      
      console.log(`[元数据服务] 表 ${tableName} 有 ${columns.length} 个字段`);
      
      return columns.map((col: any) => ({
        columnName: col.name,
        columnType: col.type,
        columnComment: '',
        isNullable: col.notnull === 0,
        isPrimaryKey: col.pk === 1,
        isAutoIncrement: false, // SQLite 中通过 INTEGER PRIMARY KEY 实现自增
      }));
    } catch (error) {
      console.error(`获取表 ${tableName} 的字段信息失败:`, error);
      return [];
    }
  }

  /**
   * 获取表的外键信息
   */
  async getTableForeignKeys(
    database: string = 'lumina_business',
    tableName: string,
  ): Promise<ForeignKeyInfo[]> {
    try {
      console.log(`[元数据服务] 获取表 ${tableName} 的外键信息...`);
      
      // SQLite 查询 - 使用 PRAGMA foreign_key_list
      const foreignKeys = await this.businessDb.raw(`PRAGMA foreign_key_list(${tableName})`);
      
      console.log(`[元数据服务] 表 ${tableName} 有 ${foreignKeys.length} 个外键`);
      
      return foreignKeys.map((fk: any) => ({
        constraintName: `fk_${tableName}_${fk.from}`,
        columnName: fk.from,
        referencedTable: fk.table,
        referencedColumn: fk.to,
      }));
    } catch (error) {
      console.error(`获取表 ${tableName} 的外键信息失败:`, error);
      return [];
    }
  }

  /**
   * 获取完整的数据库模型信息
   */
  async getDatabaseSchema(database: string = 'lumina_business'): Promise<DatabaseSchema> {
    console.log(`[元数据服务] 开始加载数据库 ${database} 的模型信息...`);
    
    const tables = await this.getAllTables(database);
    
    console.log(`[元数据服务] 成功加载 ${tables.length} 个表的模型信息`);
    
    return {
      database,
      tables,
    };
  }

  /**
   * 转换为前端格式 (兼容 mockDbSchema)
   */
  async getDbSchemaForUI(database: string = 'lumina_business'): Promise<Record<string, any>> {
    const schema = await this.getDatabaseSchema(database);
    const result: Record<string, any> = {};

    for (const table of schema.tables) {
      result[table.tableName] = {
        desc: table.tableComment || table.tableName,
        fields: table.fields.map(f => f.columnName),
      };
    }

    return result;
  }

  /**
   * 获取特定表的详细信息
   */
  async getTableDetail(
    tableName: string,
    database: string = 'lumina_business',
  ): Promise<TableInfo | null> {
    try {
      console.log(`[元数据服务] 获取表 ${tableName} 的详细信息...`);
      
      const fields = await this.getTableColumns(database, tableName);
      const foreignKeys = await this.getTableForeignKeys(database, tableName);

      return {
        tableName,
        tableComment: '', // SQLite 不支持表注释
        fields,
        foreignKeys,
      };
    } catch (error) {
      console.error(`获取表 ${tableName} 的详细信息失败:`, error);
      return null;
    }
  }

  /**
   * 获取表的字段列表 (简化版，仅返回字段名)
   */
  async getTableFieldNames(
    tableName: string,
    database: string = 'lumina_business',
  ): Promise<string[]> {
    const columns = await this.getTableColumns(database, tableName);
    return columns.map(col => col.columnName);
  }

  /**
   * 检查表是否存在
   */
  async tableExists(
    tableName: string,
    database: string = 'lumina_business',
  ): Promise<boolean> {
    try {
      console.log(`[元数据服务] 检查表 ${tableName} 是否存在...`);
      
      // SQLite 查询
      const result = await this.businessDb.raw(`
        SELECT COUNT(*) as count
        FROM sqlite_master
        WHERE type='table' AND name = ?
      `, [tableName]);

      const exists = result[0]?.count > 0;
      console.log(`[元数据服务] 表 ${tableName} 存在: ${exists}`);
      
      return exists;
    } catch (error) {
      console.error(`检查表 ${tableName} 是否存在失败:`, error);
      return false;
    }
  }

  /**
   * 检查字段是否存在
   */
  async columnExists(
    tableName: string,
    columnName: string,
    database: string = 'lumina_business',
  ): Promise<boolean> {
    try {
      console.log(`[元数据服务] 检查字段 ${tableName}.${columnName} 是否存在...`);
      
      // SQLite 查询
      const columns = await this.businessDb.raw(`PRAGMA table_info(${tableName})`);
      const exists = columns.some((col: any) => col.name === columnName);
      
      console.log(`[元数据服务] 字段 ${tableName}.${columnName} 存在: ${exists}`);
      
      return exists;
    } catch (error) {
      console.error(`检查字段 ${tableName}.${columnName} 是否存在失败:`, error);
      return false;
    }
  }
}
